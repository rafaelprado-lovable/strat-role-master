import { apiClient } from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Envia mensagem para a IA e recebe resposta via SSE (streaming).
 * Caso o backend não suporte SSE, faz fallback para POST normal.
 */
export const chatService = {
  async sendMessage(
    message: string,
    history: { role: string; content: string }[],
    onDelta: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
    signal?: AbortSignal,
  ) {
    try {
      const response = await apiClient.rawFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        onError(`Erro ${response.status}: ${text || response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type') || '';

      // SSE streaming
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          if (signal?.aborted) {
            reader.cancel();
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content
                ?? parsed.choices?.[0]?.message?.content
                ?? parsed.content
                ?? parsed.text
                ?? parsed.message;
              if (content) onDelta(content);
            } catch {
              // pode ser texto puro direto do SSE
              if (jsonStr) onDelta(jsonStr);
            }
          }
        }
        onDone();
        return;
      }

      // Fallback: resposta JSON normal
      const data = await response.json();
      const reply = data.content ?? data.message ?? data.text ?? JSON.stringify(data);
      onDelta(reply);
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onError(err.message || 'Erro ao conectar com a IA');
    }
  },
};
