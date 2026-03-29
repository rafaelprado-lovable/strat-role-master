const AGENT_URL = 'http://10.151.1.54:8000/agent/ask';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const chatService = {
  async sendMessage(
    message: string,
    _history: { role: string; content: string }[],
    onDelta: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
    signal?: AbortSignal,
  ) {
    try {
      const response = await fetch(AGENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        onError(`Erro ${response.status}: ${text || response.statusText}`);
        return;
      }

      const data = await response.json();

      // Extrai resposta do agente
      const content =
        data.answer ??
        data.event?.content?.body?.message ??
        data.event?.content?.message ??
        data.event?.content ??
        data.mcp_body?.body?.message ??
        data.message ??
        JSON.stringify(data);

      // Verifica se houve erro no MCP
      if (data.mcp_status && data.mcp_status >= 400) {
        const errorMsg = typeof content === 'string' ? content : JSON.stringify(content);
        onError(`Erro do agente (${data.mcp_status}): ${errorMsg}`);
        return;
      }

      const reply = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      onDelta(reply);
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onError(err.message || 'Erro ao conectar com o agente');
    }
  },
};
