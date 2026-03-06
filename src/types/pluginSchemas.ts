// Plugin input/output schema definitions
// Each plugin defines its expected inputs and outputs with name, type, and whether required

export interface PluginField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export interface PluginSchema {
  name: string;
  description: string;
  inputs: PluginField[];
  outputs: PluginField[];
}

export const PLUGIN_SCHEMAS: Record<string, PluginSchema> = {
  ssh_execution: {
    name: 'SSH Execution',
    description: 'Executa comando via SSH no servidor informado',
    inputs: [
      { name: 'server', label: 'Servidor', type: 'string', required: true, placeholder: '10.0.0.1 ou {{node-x.output.ip}}' },
      { name: 'user', label: 'Usuário', type: 'string', required: true, placeholder: 'nmws_app' },
      { name: 'command', label: 'Comando', type: 'string', required: true, placeholder: '/opt/script.sh' },
      { name: 'port', label: 'Porta', type: 'number', placeholder: '22' },
      { name: 'timeout', label: 'Timeout (s)', type: 'number', placeholder: '30' },
    ],
    outputs: [
      { name: 'stdout', label: 'Saída padrão', type: 'string' },
      { name: 'stderr', label: 'Saída de erro', type: 'string' },
      { name: 'exit_code', label: 'Código de saída', type: 'number' },
      { name: 'status', label: 'Status', type: 'string' },
    ],
  },

  send_whatsapp_message_v1: {
    name: 'Envio de mensagem',
    description: 'Envia mensagem por WhatsApp no número informado',
    inputs: [
      { name: 'phone_number', label: 'Número', type: 'string', required: true, placeholder: '+5511999999999 ou {{node-x.output.phone}}' },
      { name: 'message', label: 'Mensagem', type: 'string', required: true, placeholder: 'Olá, {{item.name}}!' },
      { name: 'template_id', label: 'Template ID', type: 'string', placeholder: 'template_alerta_v1' },
    ],
    outputs: [
      { name: 'message_id', label: 'ID da mensagem', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
    ],
  },

  api_call_v1: {
    name: 'API Call',
    description: 'Chamada HTTP/API para endpoint externo',
    inputs: [
      { name: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://api.exemplo.com/endpoint' },
      { name: 'method', label: 'Método', type: 'string', required: true, placeholder: 'GET | POST | PUT | PATCH | DELETE' },
      { name: 'headers', label: 'Headers', type: 'json', placeholder: '{"Authorization": "Bearer ..."}' },
      { name: 'body', label: 'Body', type: 'json', placeholder: '{"key": "value"}' },
      { name: 'timeout', label: 'Timeout (s)', type: 'number', placeholder: '30' },
    ],
    outputs: [
      { name: 'status', label: 'Status HTTP', type: 'number' },
      { name: 'body', label: 'Response Body', type: 'json' },
      { name: 'headers', label: 'Response Headers', type: 'json' },
    ],
  },

  get_specific_incident_v1: {
    name: 'Get Incident',
    description: 'Busca incidente específico por ID',
    inputs: [
      { name: 'incident_id', label: 'ID do Incidente', type: 'string', required: true, placeholder: '{{trigger.output.incident_id}}' },
      { name: 'source', label: 'Fonte', type: 'string', placeholder: 'zabbix | datadog | pagerduty' },
    ],
    outputs: [
      { name: 'incident', label: 'Incidente', type: 'json' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'severity', label: 'Severidade', type: 'string' },
      { name: 'items', label: 'Lista de itens', type: 'json', description: 'Array de hosts/serviços afetados' },
    ],
  },

  delay_v1: {
    name: 'Delay',
    description: 'Aguarda um tempo antes de continuar a execução',
    inputs: [
      { name: 'seconds', label: 'Segundos', type: 'number', required: true, placeholder: '10' },
    ],
    outputs: [
      { name: 'waited', label: 'Tempo aguardado (s)', type: 'number' },
    ],
  },

  llm_analyse_v1: {
    name: 'LLM Analyse',
    description: 'Análise inteligente de dados via modelo de linguagem',
    inputs: [
      { name: 'prompt', label: 'Prompt', type: 'string', required: true, placeholder: 'Analise o seguinte log: {{node-x.output.stdout}}' },
      { name: 'context', label: 'Contexto', type: 'json', placeholder: '{"logs": "...", "metrics": "..."}' },
      { name: 'model', label: 'Modelo', type: 'string', placeholder: 'gpt-4o | claude-3' },
      { name: 'max_tokens', label: 'Max Tokens', type: 'number', placeholder: '2000' },
    ],
    outputs: [
      { name: 'analysis', label: 'Análise', type: 'string' },
      { name: 'confidence', label: 'Confiança', type: 'number' },
      { name: 'suggestions', label: 'Sugestões', type: 'json' },
    ],
  },
};
