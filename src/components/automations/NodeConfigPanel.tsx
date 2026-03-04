import { type Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, GitBranch, Repeat, RefreshCw, Globe, Database, Mail, Clock, Code, Zap } from 'lucide-react';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  trigger: Zap, condition: GitBranch, forEach: Repeat, while: RefreshCw,
  http: Globe, database: Database, email: Mail, delay: Clock, script: Code,
};

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const d = node.data as Record<string, any>;
  const nodeType = d.type as string;
  const Icon = iconMap[nodeType] || Code;

  const update = (key: string, value: unknown) => {
    onUpdate(node.id, { ...d, [key]: value });
  };

  return (
    <div className="w-72 shrink-0 border rounded-lg bg-card p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Configuração</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Common: Label */}
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do bloco</Label>
        <Input
          value={d.label || ''}
          onChange={(e) => update('label', e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Common: Description */}
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Input
          value={d.description || ''}
          onChange={(e) => update('description', e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* ----- Type-specific fields ----- */}

      {nodeType === 'condition' && (
        <>
          <div className="border-t border-border pt-3 space-y-1.5">
            <Label className="text-xs">Expressão condicional <span className="text-destructive">*</span></Label>
            <Textarea
              value={d.expression || ''}
              onChange={(e) => update('expression', e.target.value)}
              placeholder={'{{node1.status}} == 200'}
              className="text-sm min-h-[60px] font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Use {'{{nodeId.campo}}'} para referenciar saídas
            </p>
          </div>
        </>
      )}

      {nodeType === 'forEach' && (
        <>
          <div className="border-t border-border pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Array de iteração <span className="text-destructive">*</span></Label>
              <Input
                value={d.iterableExpression || ''}
                onChange={(e) => update('iterableExpression', e.target.value)}
                placeholder={'{{node1.items}}'}
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Variável do item</Label>
              <Input
                value={d.itemVariable || 'currentItem'}
                onChange={(e) => update('itemVariable', e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Saídas disponíveis: currentItem, index, isLast
            </p>
          </div>
        </>
      )}

      {nodeType === 'while' && (
        <>
          <div className="border-t border-border pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Condição de repetição <span className="text-destructive">*</span></Label>
              <Textarea
                value={d.whileCondition || ''}
                onChange={(e) => update('whileCondition', e.target.value)}
                placeholder={'{{self.counter}} < 10'}
                className="text-sm min-h-[60px] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limite de iterações (segurança)</Label>
              <Input
                type="number"
                value={d.maxIterations || 100}
                onChange={(e) => update('maxIterations', parseInt(e.target.value) || 100)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {nodeType === 'http' && (
        <div className="border-t border-border pt-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input
              value={d.url || ''}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://api.example.com/data"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Método</Label>
            <Input
              value={d.method || 'GET'}
              onChange={(e) => update('method', e.target.value)}
              placeholder="GET"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body (JSON)</Label>
            <Textarea
              value={d.body || ''}
              onChange={(e) => update('body', e.target.value)}
              placeholder='{"key": "value"}'
              className="text-sm min-h-[60px] font-mono"
            />
          </div>
        </div>
      )}

      {nodeType === 'database' && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <Label className="text-xs">Query SQL</Label>
          <Textarea
            value={d.query || ''}
            onChange={(e) => update('query', e.target.value)}
            placeholder="SELECT * FROM ..."
            className="text-sm min-h-[80px] font-mono"
          />
        </div>
      )}

      {nodeType === 'email' && (
        <div className="border-t border-border pt-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Destinatário</Label>
            <Input
              value={d.to || ''}
              onChange={(e) => update('to', e.target.value)}
              placeholder="user@example.com"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Assunto</Label>
            <Input
              value={d.subject || ''}
              onChange={(e) => update('subject', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Corpo</Label>
            <Textarea
              value={d.emailBody || ''}
              onChange={(e) => update('emailBody', e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
        </div>
      )}

      {nodeType === 'delay' && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <Label className="text-xs">Tempo (segundos)</Label>
          <Input
            type="number"
            value={d.delaySeconds || 5}
            onChange={(e) => update('delaySeconds', parseInt(e.target.value) || 5)}
            className="h-8 text-sm"
          />
        </div>
      )}

      {nodeType === 'script' && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <Label className="text-xs">Código</Label>
          <Textarea
            value={d.code || ''}
            onChange={(e) => update('code', e.target.value)}
            placeholder="// seu script aqui"
            className="text-sm min-h-[100px] font-mono"
          />
        </div>
      )}
    </div>
  );
}
