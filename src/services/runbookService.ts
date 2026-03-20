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
  const content = item.content || '';
  const attachRefRegex = /!\[([^\]]*)\]\(attachment:([a-f0-9-]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = attachRefRegex.exec(content)) !== null) {
    const altName = match[1];
    const uuid = match[2];
    const img = (item.attachment_images || []).find((i: any) =>
      i.attachment === altName || i.attachment.replace(/\.[^.]+$/, '') === altName
    );
    if (img) {
      attachmentMap[uuid] = img.signed_url || img.file_url || '';
    }
  }

  // Replace attachment:UUID references directly in content with signed URLs
  let resolvedContent = content.replace(
    /!\[([^\]]*)\]\(attachment:([a-f0-9-]+)\)/g,
    (full, alt, uuid) => {
      const url = attachmentMap[uuid];
      return url ? `![${alt}](${url})` : full;
    }
  );

  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    content: resolvedContent,
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
  return mapRunbookItem(data);
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

const ATTACHMENT_FILE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp|pdf|docx?|xlsx?|txt|md)$/i;

function normalizeAttachmentFileName(attachment: RunbookAttachment): string {
  const trimmedName = attachment.name.trim();
  if (ATTACHMENT_FILE_EXTENSION_REGEX.test(trimmedName)) {
    return trimmedName;
  }

  return attachment.type === 'image' ? `${trimmedName}.png` : trimmedName;
}

async function buildAttachmentUpload(attachment: RunbookAttachment): Promise<{ blob: Blob; fileName: string }> {
  const fileName = normalizeAttachmentFileName(attachment);

  if (attachment.file) {
    return { blob: attachment.file, fileName };
  }

  const response = await fetch(attachment.url);
  if (!response.ok) {
    throw new Error(`Não foi possível baixar o anexo "${attachment.name}"`);
  }

  return {
    blob: await response.blob(),
    fileName,
  };
}

/**
 * Cria um runbook via POST /v1/create/runbook (multipart/form-data).
 * - `runbook_data`: JSON com metadados
 * - `file` (0..N): anexos de imagem/arquivo
 */
export async function createRunbook(data: CreateRunbookPayload): Promise<void> {
  const userId = apiClient.getUserId() || 'unknown';
  const normalizedAttachments = data.attachments.map((attachment) => ({
    ...attachment,
    name: normalizeAttachmentFileName(attachment),
  }));

  const runbookData = {
    id: crypto.randomUUID(),
    userId,
    title: data.title,
    description: data.description,
    content: data.content,
    tags: data.tags,
    service: data.service,
    record: data.incident,
    sistemas: data.sistemas,
    attachments: normalizedAttachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
    })),
  };

  const formData = new FormData();
  formData.append('runbook_data', JSON.stringify(runbookData));

  const fileResults = await Promise.all(
    normalizedAttachments.map(async (attachment) => {
      try {
        return await buildAttachmentUpload(attachment);
      } catch (error) {
        throw new Error(
          `Falha ao preparar o anexo "${attachment.name}" para upload: ${error instanceof Error ? error.message : 'erro desconhecido'}`
        );
      }
    })
  );

  fileResults.forEach((result, index) => {
    formData.append(`file_${index}`, result.blob, result.fileName);
  });

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
