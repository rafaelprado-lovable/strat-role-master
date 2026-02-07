import { TaskDefinition } from '@/types/automations';

/**
 * Built-in task definitions registry.
 * Custom definitions created by users are stored in state.
 */
export const BUILTIN_TASK_DEFINITIONS: TaskDefinition[] = [
  // ── Triggers ──
  {
    id: 'trigger_alarm',
    name: 'Alarme',
    type: 'trigger',
    description: 'Dispara quando um alarme é detectado',
    icon: 'alert-triangle',
    color: 'bg-orange-500',
    category: 'Gatilhos',
    schema: {
      inputs: {
        alarmType: 'string',
        service: 'string',
      },
      outputs: {
        alarmId: 'string',
        alarmType: 'string',
        service: 'string',
        message: 'string',
        timestamp: 'string',
      },
    },
  },
  {
    id: 'trigger_incident',
    name: 'Incidente',
    type: 'trigger',
    description: 'Dispara quando um incidente é criado',
    icon: 'bug',
    color: 'bg-red-500',
    category: 'Gatilhos',
    schema: {
      inputs: {
        priority: 'string',
        team: 'string',
      },
      outputs: {
        incidentId: 'string',
        priority: 'string',
        team: 'string',
        title: 'string',
        description: 'string',
      },
    },
  },
  {
    id: 'trigger_rabbit_full',
    name: 'Rabbit Cheio',
    type: 'trigger',
    description: 'Dispara quando uma fila RabbitMQ atinge o threshold',
    icon: 'database',
    color: 'bg-purple-500',
    category: 'Gatilhos',
    schema: {
      inputs: {
        threshold: 'number',
        queue: 'string',
      },
      outputs: {
        queueName: 'string',
        messageCount: 'number',
        usagePercent: 'number',
        threshold: 'number',
      },
    },
  },

  // ── Actions ──
  {
    id: 'action_webhook',
    name: 'Webhook',
    type: 'action',
    description: 'Faz uma chamada HTTP',
    icon: 'webhook',
    color: 'bg-blue-500',
    category: 'Ações',
    schema: {
      inputs: {
        url: 'string',
        method: 'string',
        headers: 'object',
        body: 'object',
      },
      outputs: {
        statusCode: 'number',
        responseBody: 'object',
        responseHeaders: 'object',
      },
    },
  },
  {
    id: 'action_email',
    name: 'Enviar Email',
    type: 'action',
    description: 'Envia um email',
    icon: 'mail',
    color: 'bg-green-500',
    category: 'Ações',
    schema: {
      inputs: {
        to: 'string',
        subject: 'string',
        body: 'string',
      },
      outputs: {
        sent: 'boolean',
        messageId: 'string',
      },
    },
  },
  {
    id: 'action_slack',
    name: 'Slack',
    type: 'action',
    description: 'Envia uma mensagem no Slack',
    icon: 'message-square',
    color: 'bg-indigo-500',
    category: 'Ações',
    schema: {
      inputs: {
        webhookUrl: 'string',
        channel: 'string',
        message: 'string',
      },
      outputs: {
        sent: 'boolean',
        messageTs: 'string',
      },
    },
  },
  {
    id: 'action_script',
    name: 'Script',
    type: 'action',
    description: 'Executa um script customizado',
    icon: 'zap',
    color: 'bg-yellow-500',
    category: 'Ações',
    schema: {
      inputs: {
        code: 'string',
        input: 'object',
      },
      outputs: {
        result: 'object',
        success: 'boolean',
        error: 'string',
      },
    },
  },
  {
    id: 'action_delay',
    name: 'Delay',
    type: 'action',
    description: 'Aguarda um tempo antes de continuar',
    icon: 'clock',
    color: 'bg-gray-500',
    category: 'Ações',
    schema: {
      inputs: {
        duration: 'number',
        unit: 'string',
      },
      outputs: {
        completed: 'boolean',
        duration: 'number',
      },
    },
  },

  // ── Conditions ──
  {
    id: 'condition_if',
    name: 'Condição IF',
    type: 'condition',
    description: 'Avalia uma condição e direciona o fluxo',
    icon: 'git-branch',
    color: 'bg-cyan-500',
    category: 'Condições',
    schema: {
      inputs: {
        field: 'string',
        operator: 'string',
        value: 'string',
      },
      outputs: {
        result: 'boolean',
        branch: 'string',
      },
    },
  },
  {
    id: 'condition_filter',
    name: 'Filtro',
    type: 'condition',
    description: 'Filtra dados com base em uma expressão',
    icon: 'filter',
    color: 'bg-teal-500',
    category: 'Condições',
    schema: {
      inputs: {
        expression: 'string',
      },
      outputs: {
        passed: 'boolean',
        data: 'object',
      },
    },
  },

  // ── Remote Script Templates ──
  {
    id: 'script_restart_service',
    name: 'Restart Service',
    type: 'remote_script',
    description: 'Reinicia um serviço na máquina remota',
    icon: 'server',
    color: 'bg-emerald-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/restart-service.sh',
    schema: {
      inputs: {
        service_name: 'string',
        timeout: 'number',
        retry_count: 'number',
      },
      outputs: {
        status: 'string',
        message: 'string',
        restart_time: 'number',
      },
    },
  },
  {
    id: 'script_health_check',
    name: 'Health Check',
    type: 'remote_script',
    description: 'Verifica a saúde de um serviço ou endpoint',
    icon: 'terminal',
    color: 'bg-sky-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/health-check.sh',
    schema: {
      inputs: {
        endpoint_url: 'string',
        expected_status: 'number',
        check_interval: 'number',
      },
      outputs: {
        is_healthy: 'boolean',
        response_time_ms: 'number',
        status_code: 'number',
      },
    },
  },
  {
    id: 'script_deploy',
    name: 'Deploy Application',
    type: 'remote_script',
    description: 'Realiza deploy de uma aplicação',
    icon: 'server',
    color: 'bg-violet-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/deploy.sh',
    schema: {
      inputs: {
        app_name: 'string',
        version: 'string',
        environment: 'string',
        rollback_version: 'string',
      },
      outputs: {
        deploy_status: 'string',
        deployed_version: 'string',
        deploy_timestamp: 'string',
      },
    },
  },
  {
    id: 'script_backup_db',
    name: 'Backup Database',
    type: 'remote_script',
    description: 'Cria backup do banco de dados',
    icon: 'server',
    color: 'bg-rose-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/backup-db.sh',
    schema: {
      inputs: {
        database_name: 'string',
        backup_path: 'string',
        compression: 'boolean',
        retention_days: 'number',
      },
      outputs: {
        backup_file: 'string',
        backup_size: 'string',
        success: 'boolean',
      },
    },
  },
  {
    id: 'script_clear_cache',
    name: 'Clear Cache',
    type: 'remote_script',
    description: 'Limpa cache de aplicação ou sistema',
    icon: 'terminal',
    color: 'bg-amber-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/clear-cache.sh',
    schema: {
      inputs: {
        cache_type: 'string',
        cache_key_pattern: 'string',
      },
      outputs: {
        keys_cleared: 'number',
        success: 'boolean',
      },
    },
  },
  {
    id: 'script_send_notification',
    name: 'Send Notification',
    type: 'remote_script',
    description: 'Envia notificação via Slack, Teams ou Email',
    icon: 'terminal',
    color: 'bg-emerald-500',
    category: 'Scripts Remotos',
    scriptPath: '/opt/scripts/send-notification.sh',
    schema: {
      inputs: {
        message: 'string',
        severity: 'string',
        channel: 'string',
        notification_type: 'string',
      },
      outputs: {
        sent: 'boolean',
        message_id: 'string',
      },
    },
  },
];

/** Get categories from definitions */
export function getDefinitionCategories(definitions: TaskDefinition[]): string[] {
  return [...new Set(definitions.map((d) => d.category || 'Outros'))];
}

/** Find a definition by id */
export function findDefinition(
  id: string,
  builtIn: TaskDefinition[] = BUILTIN_TASK_DEFINITIONS,
  custom: TaskDefinition[] = []
): TaskDefinition | undefined {
  return [...builtIn, ...custom].find((d) => d.id === id);
}
