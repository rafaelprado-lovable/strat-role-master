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
