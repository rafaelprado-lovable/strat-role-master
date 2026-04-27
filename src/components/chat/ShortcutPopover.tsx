import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AtSign, Slash, Hash, Smile, type LucideIcon } from 'lucide-react';

export type ShortcutTrigger = '@' | '/' | '#' | ':';

export interface ShortcutItem {
  /** Value inserted into the textarea (without trigger) */
  value: string;
  /** Display label */
  label: string;
  /** Optional description shown in muted text */
  description?: string;
  /** Optional emoji/icon override */
  emoji?: string;
}

interface ShortcutPopoverProps {
  trigger: ShortcutTrigger;
  query: string;
  items: ShortcutItem[];
  selectedIndex: number;
  onSelect: (item: ShortcutItem) => void;
  onHoverIndex: (i: number) => void;
  /** Anchor coords (left, top in viewport) */
  anchor: { left: number; top: number } | null;
}

const triggerMeta: Record<ShortcutTrigger, { icon: LucideIcon; title: string; color: string }> = {
  '@': { icon: AtSign, title: 'Mencionar', color: 'text-blue-400' },
  '/': { icon: Slash, title: 'Comandos', color: 'text-violet-400' },
  '#': { icon: Hash, title: 'Tickets', color: 'text-amber-400' },
  ':': { icon: Smile, title: 'Emojis', color: 'text-emerald-400' },
};

export function ShortcutPopover({
  trigger, query, items, selectedIndex, onSelect, onHoverIndex, anchor,
}: ShortcutPopoverProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter(i =>
        i.value.toLowerCase().includes(q) ||
        i.label.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false))
      .slice(0, 8);
  }, [items, query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!anchor || filtered.length === 0) return null;

  const meta = triggerMeta[trigger];
  const Icon = meta.icon;

  // Position above the anchor with small offset; clamp horizontally.
  const POPOVER_WIDTH = 320;
  const left = Math.max(8, Math.min(window.innerWidth - POPOVER_WIDTH - 8, anchor.left));
  const style: React.CSSProperties = {
    position: 'fixed',
    left,
    bottom: window.innerHeight - anchor.top + 8,
    width: POPOVER_WIDTH,
    zIndex: 60,
  };

  return (
    <div
      style={style}
      className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden"
      onMouseDown={(e) => e.preventDefault()} // keep textarea focus
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <Icon className={cn('w-3.5 h-3.5', meta.color)} />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {meta.title}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {trigger}{query}
        </span>
      </div>
      <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
        {filtered.map((item, i) => (
          <button
            key={item.value}
            data-idx={i}
            type="button"
            onMouseEnter={() => onHoverIndex(i)}
            onClick={() => onSelect(item)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors',
              i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50',
            )}
          >
            <span className="flex-shrink-0 w-6 text-center">
              {item.emoji ? (
                <span className="text-base">{item.emoji}</span>
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground">{trigger}</span>
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate font-medium leading-tight">{item.label}</span>
              {item.description && (
                <span className="block truncate text-[11px] text-muted-foreground leading-tight">
                  {item.description}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center gap-3">
        <span><kbd className="px-1 rounded bg-muted">↑↓</kbd> navegar</span>
        <span><kbd className="px-1 rounded bg-muted">Enter</kbd> selecionar</span>
        <span><kbd className="px-1 rounded bg-muted">Esc</kbd> fechar</span>
      </div>
    </div>
  );
}

export const SHORTCUT_DATA: Record<ShortcutTrigger, ShortcutItem[]> = {
  '@': [
    { value: 'runbooks', label: 'Runbooks', description: 'Buscar procedimentos operacionais' },
    { value: 'changes', label: 'Changes', description: 'Consultar mudanças em andamento' },
    { value: 'incidents', label: 'Incidentes', description: 'Buscar incidentes recentes' },
    { value: 'k8s', label: 'Kubernetes', description: 'Estado do cluster e pods' },
    { value: 'sanity-check', label: 'Sanity Check', description: 'Saúde dos serviços' },
    { value: 'automations', label: 'Automations', description: 'Workflows e execuções' },
    { value: 'heimdall-cli', label: 'Heimdall CLI', description: 'Executar comando SSH' },
  ],
  '/': [
    { value: 'clear', label: '/clear', description: 'Limpar conversa atual' },
    { value: 'new', label: '/new', description: 'Iniciar nova conversa' },
    { value: 'runbook ', label: '/runbook', description: 'Buscar runbook por palavra-chave' },
    { value: 'change ', label: '/change', description: 'Detalhes de uma change (ex: /change CHG12345)' },
    { value: 'incident ', label: '/incident', description: 'Detalhes de um incidente' },
    { value: 'status', label: '/status', description: 'Status geral da operação' },
    { value: 'help', label: '/help', description: 'Listar comandos disponíveis' },
  ],
  '#': [
    { value: 'CHG', label: '#CHG', description: 'Referenciar uma change' },
    { value: 'INC', label: '#INC', description: 'Referenciar um incidente' },
    { value: 'TASK', label: '#TASK', description: 'Referenciar uma tarefa' },
    { value: 'RB', label: '#RB', description: 'Referenciar um runbook' },
  ],
  ':': [
    { value: 'check', label: 'check', emoji: '✅', description: 'Concluído' },
    { value: 'warning', label: 'warning', emoji: '⚠️', description: 'Atenção' },
    { value: 'error', label: 'error', emoji: '❌', description: 'Erro' },
    { value: 'fire', label: 'fire', emoji: '🔥', description: 'Crítico' },
    { value: 'rocket', label: 'rocket', emoji: '🚀', description: 'Deploy/Release' },
    { value: 'eyes', label: 'eyes', emoji: '👀', description: 'Investigando' },
    { value: 'thumbsup', label: 'thumbsup', emoji: '👍', description: 'Ok' },
    { value: 'bug', label: 'bug', emoji: '🐛', description: 'Bug' },
    { value: 'tada', label: 'tada', emoji: '🎉', description: 'Sucesso' },
    { value: 'thinking', label: 'thinking', emoji: '🤔', description: 'Analisando' },
  ],
};

/** What to insert into the textarea on selection (replacing the trigger+query). */
export function renderShortcutInsertion(trigger: ShortcutTrigger, item: ShortcutItem): string {
  if (trigger === ':') return item.emoji ?? `:${item.value}:`;
  if (trigger === '/') return `/${item.value}`;
  return `${trigger}${item.value} `;
}
