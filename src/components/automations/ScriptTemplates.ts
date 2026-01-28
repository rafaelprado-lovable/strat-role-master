import { StepConfigParam, StepInputValue, StepOutputValue } from '@/types/automations';

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: 'terminal' | 'server';
  color: string;
  defaultScriptPath: string;
  stepConfigParams: StepConfigParam[];
  stepInputValue: StepInputValue[];
  stepOutputValue: StepOutputValue[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'restart-service',
    name: 'Restart Service',
    description: 'Reinicia um serviço específico na máquina remota',
    category: 'Gerenciamento de Serviços',
    icon: 'server',
    color: 'bg-emerald-500',
    defaultScriptPath: '/opt/scripts/restart-service.sh',
    stepConfigParams: [
      { paramName: 'timeout', paramType: 'integer', paramExample: '30', paramValue: '30' },
      { paramName: 'retry_count', paramType: 'integer', paramExample: '3', paramValue: '3' },
    ],
    stepInputValue: [
      { paramName: 'service_name', paramType: 'string', mandatory: true },
    ],
    stepOutputValue: [
      { paramName: 'status', paramType: 'string' },
      { paramName: 'message', paramType: 'string' },
      { paramName: 'restart_time', paramType: 'integer' },
    ],
  },
  {
    id: 'health-check',
    name: 'Health Check',
    description: 'Verifica o status de saúde de um serviço ou endpoint',
    category: 'Monitoramento',
    icon: 'terminal',
    color: 'bg-sky-500',
    defaultScriptPath: '/opt/scripts/health-check.sh',
    stepConfigParams: [
      { paramName: 'check_interval', paramType: 'integer', paramExample: '10', paramValue: '10' },
      { paramName: 'threshold', paramType: 'integer', paramExample: '3', paramValue: '3' },
    ],
    stepInputValue: [
      { paramName: 'endpoint_url', paramType: 'string', mandatory: true },
      { paramName: 'expected_status', paramType: 'integer', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'is_healthy', paramType: 'boolean' },
      { paramName: 'response_time_ms', paramType: 'integer' },
      { paramName: 'status_code', paramType: 'integer' },
    ],
  },
  {
    id: 'deploy-application',
    name: 'Deploy Application',
    description: 'Realiza deploy de uma aplicação específica',
    category: 'Deploy',
    icon: 'server',
    color: 'bg-violet-500',
    defaultScriptPath: '/opt/scripts/deploy.sh',
    stepConfigParams: [
      { paramName: 'environment', paramType: 'string', paramExample: 'production', paramValue: 'production' },
      { paramName: 'backup_before', paramType: 'boolean', paramExample: 'true', paramValue: 'true' },
    ],
    stepInputValue: [
      { paramName: 'app_name', paramType: 'string', mandatory: true },
      { paramName: 'version', paramType: 'string', mandatory: true },
      { paramName: 'rollback_version', paramType: 'string', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'deploy_status', paramType: 'string' },
      { paramName: 'deployed_version', paramType: 'string' },
      { paramName: 'deploy_timestamp', paramType: 'string' },
    ],
  },
  {
    id: 'clear-cache',
    name: 'Clear Cache',
    description: 'Limpa cache de aplicação ou sistema',
    category: 'Manutenção',
    icon: 'terminal',
    color: 'bg-amber-500',
    defaultScriptPath: '/opt/scripts/clear-cache.sh',
    stepConfigParams: [
      { paramName: 'cache_type', paramType: 'string', paramExample: 'redis', paramValue: 'redis' },
    ],
    stepInputValue: [
      { paramName: 'cache_key_pattern', paramType: 'string', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'keys_cleared', paramType: 'integer' },
      { paramName: 'success', paramType: 'boolean' },
    ],
  },
  {
    id: 'backup-database',
    name: 'Backup Database',
    description: 'Cria backup do banco de dados',
    category: 'Banco de Dados',
    icon: 'server',
    color: 'bg-rose-500',
    defaultScriptPath: '/opt/scripts/backup-db.sh',
    stepConfigParams: [
      { paramName: 'compression', paramType: 'boolean', paramExample: 'true', paramValue: 'true' },
      { paramName: 'retention_days', paramType: 'integer', paramExample: '7', paramValue: '7' },
    ],
    stepInputValue: [
      { paramName: 'database_name', paramType: 'string', mandatory: true },
      { paramName: 'backup_path', paramType: 'string', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'backup_file', paramType: 'string' },
      { paramName: 'backup_size', paramType: 'string' },
      { paramName: 'success', paramType: 'boolean' },
    ],
  },
  {
    id: 'run-migration',
    name: 'Run Migration',
    description: 'Executa migrações do banco de dados',
    category: 'Banco de Dados',
    icon: 'terminal',
    color: 'bg-pink-500',
    defaultScriptPath: '/opt/scripts/run-migration.sh',
    stepConfigParams: [
      { paramName: 'dry_run', paramType: 'boolean', paramExample: 'false', paramValue: 'false' },
    ],
    stepInputValue: [
      { paramName: 'migration_version', paramType: 'string', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'migrations_applied', paramType: 'array' },
      { paramName: 'current_version', paramType: 'string' },
      { paramName: 'success', paramType: 'boolean' },
    ],
  },
  {
    id: 'send-notification',
    name: 'Send Notification',
    description: 'Envia notificação via Slack, Teams ou Email',
    category: 'Comunicação',
    icon: 'terminal',
    color: 'bg-emerald-500',
    defaultScriptPath: '/opt/scripts/send-notification.sh',
    stepConfigParams: [
      { paramName: 'channel', paramType: 'string', paramExample: '#ops-alerts', paramValue: '' },
      { paramName: 'notification_type', paramType: 'string', paramExample: 'slack', paramValue: 'slack' },
    ],
    stepInputValue: [
      { paramName: 'message', paramType: 'string', mandatory: true },
      { paramName: 'severity', paramType: 'string', mandatory: false },
    ],
    stepOutputValue: [
      { paramName: 'sent', paramType: 'boolean' },
      { paramName: 'message_id', paramType: 'string' },
    ],
  },
  {
    id: 'scale-service',
    name: 'Scale Service',
    description: 'Escala horizontalmente um serviço',
    category: 'Infraestrutura',
    icon: 'server',
    color: 'bg-sky-500',
    defaultScriptPath: '/opt/scripts/scale-service.sh',
    stepConfigParams: [
      { paramName: 'min_replicas', paramType: 'integer', paramExample: '1', paramValue: '1' },
      { paramName: 'max_replicas', paramType: 'integer', paramExample: '10', paramValue: '10' },
    ],
    stepInputValue: [
      { paramName: 'service_name', paramType: 'string', mandatory: true },
      { paramName: 'replica_count', paramType: 'integer', mandatory: true },
    ],
    stepOutputValue: [
      { paramName: 'current_replicas', paramType: 'integer' },
      { paramName: 'success', paramType: 'boolean' },
    ],
  },
  {
    id: 'custom',
    name: 'Script Customizado',
    description: 'Crie um bloco com configurações personalizadas',
    category: 'Personalizado',
    icon: 'terminal',
    color: 'bg-rose-500',
    defaultScriptPath: '',
    stepConfigParams: [],
    stepInputValue: [],
    stepOutputValue: [],
  },
];

export const SCRIPT_CATEGORIES = [...new Set(SCRIPT_TEMPLATES.map(t => t.category))];
