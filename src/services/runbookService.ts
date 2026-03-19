import { apiClient } from './apiClient';
import type { Runbook, RunbookAttachment } from '@/types/runbooks';

function generateMessageId(): string {
  const chars = '0123456789ABCDEF';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Lista todos os runbooks via POST /v1/read/runbook (sem id).
 */
function mapRunbookItem(item: any): Runbook {
  // Build attachments from attachment_public_urls and attachment_images
  const attachments: RunbookAttachment[] = [];
  const attachmentMap: Record<string, string> = {};

  // Process attachment_images (images with signed URLs)
  if (Array.isArray(item.attachment_images)) {
    for (const img of item.attachment_images) {
      const id = img.attachment || '';
      const url = img.signed_url || img.file_url || '';
      attachments.push({ id, name: img.attachment, url, type: 'image' });
    }
  }

  // Process attachment_public_urls (non-image files)
  if (Array.isArray(item.attachment_public_urls)) {
    for (const pub of item.attachment_public_urls) {
      const alreadyAdded = attachments.some((a) => a.name === pub.attachment);
      if (!alreadyAdded) {
        const isImage = (pub.content_type || '').startsWith('image/');
        const url = pub.signed_url || pub.file_url || '';
        attachments.push({
          id: pub.attachment,
          name: pub.attachment,
          url,
          type: isImage ? 'image' : 'file',
        });
        if (isImage) {
          // also available for inline markdown images
        }
      }
    }
  }

  // Build attachmentMap for resolving attachment:ID references in markdown
  // Match attachment ID (UUID) to signed_url from images
  if (Array.isArray(item.attachment_images)) {
    for (const img of item.attachment_images) {
      const url = img.signed_url || img.file_url || '';
      if (url) {
        // Map by filename (without extension) for attachment:UUID pattern
        attachmentMap[img.attachment] = url;
      }
    }
  }

  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    content: item.content || '',
    tags: item.tags || [],
    service: item.service || '',
    incident: item.record || '',
    sistemas: item.sistemas || '',
    attachments,
    attachmentMap,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
}

export async function fetchRunbooks(): Promise<Runbook[]> {
  const userId = apiClient.getUserId() || 'unknown';
  const data = await apiClient.post<any>('/v1/read/runbook', {
    authUserId: userId,
  });
  const items = Array.isArray(data) ? data : (data.items || []);
  return items.map(mapRunbookItem);
}

/**
 * Lê um runbook específico via POST /v1/read/runbook (com id).
 */
export async function fetchRunbookById(id: string): Promise<Runbook> {
  const userId = apiClient.getUserId() || 'unknown';
  const data = await apiClient.post<any>('/v1/read/runbook', {
    authUserId: userId,
    id,
  });
  return {
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    content: data.content || '',
    tags: data.tags || [],
    service: data.service || '',
    incident: data.record || '',
    sistemas: data.sistemas || '',
    attachments: (data.attachments || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      url: a.url || '',
      type: a.type || 'file',
    })),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };
}

interface CreateRunbookPayload {
  title: string;
  description: string;
  content: string;
  tags: string[];
  service: string;
  incident: string;
  sistemas: string;
  attachments: RunbookAttachment[];
}

/**
 * Cria um runbook via POST /v1/create/runbook (multipart/form-data).
 * - `runbook_data`: JSON com metadados
 * - `file` (0..N): anexos de imagem/arquivo
 */
export async function createRunbook(data: CreateRunbookPayload): Promise<void> {
  const userId = apiClient.getUserId() || 'unknown';

  const runbookData = {
    id: crypto.randomUUID(),
    userId,
    title: data.title,
    description: data.description,
    content: data.content,
    tags: data.tags,
    service: data.service,
    record: data.incident, // API usa "record" em vez de "incident"
    sistemas: data.sistemas,
    attachments: data.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    })),
  };

  const formData = new FormData();
  formData.append('runbook_data', JSON.stringify(runbookData));

  // Converte blob URLs ou URLs externas em File objects para envio
  for (const att of data.attachments) {
    try {
      const response = await fetch(att.url);
      const blob = await response.blob();
      const extension = att.type === 'image' ? '.png' : '';
      const fileName = `${att.name}${extension}`;
      formData.append('file', blob, fileName);
    } catch (err) {
      console.warn(`Falha ao converter anexo "${att.name}" para upload:`, err);
    }
  }

  const userToken = localStorage.getItem('userToken');

  const res = await fetch(`${apiClient.baseUrl}/v1/create/runbook`, {
    method: 'POST',
    headers: {
      ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
      messageid: generateMessageId(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Erro ao criar runbook: ${res.status} ${errorText || res.statusText}`);
  }
}
