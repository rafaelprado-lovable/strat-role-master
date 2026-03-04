import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ValidationError } from '@/types/automations';

interface WorkflowValidatorProps {
  errors: ValidationError[];
}

export function WorkflowValidator({ errors }: WorkflowValidatorProps) {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-2/10 border border-chart-2/30 text-sm">
        <CheckCircle className="h-4 w-4 text-chart-2 shrink-0" />
        <span className="text-foreground">Workflow válido — pronto para exportar</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-sm">
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" /> {errorCount} erro{errorCount > 1 ? 's' : ''}
          </span>
        )}
        {warningCount > 0 && (
          <span className="flex items-center gap-1 text-chart-4">
            <AlertTriangle className="h-4 w-4" /> {warningCount} aviso{warningCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {errors.map((err, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-2 rounded text-xs ${
              err.severity === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-chart-4/10 text-chart-4'
            }`}
          >
            {err.severity === 'error' ? <XCircle className="h-3 w-3 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
            <div>
              <span className="font-mono text-[10px] opacity-70">{err.path}</span>
              <p>{err.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
