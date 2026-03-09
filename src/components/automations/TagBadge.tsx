import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface WorkflowTag {
  id: string;
  name: string;
  color: string; // HSL color key like 'primary', 'chart-1', etc.
}

// Predefined tag colors using design system tokens
export const TAG_COLORS = [
  { value: 'primary', label: 'Azul', className: 'bg-primary/15 text-primary border-primary/30' },
  { value: 'chart-1', label: 'Laranja', className: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  { value: 'chart-2', label: 'Verde-água', className: 'bg-chart-2/15 text-chart-2 border-chart-2/30' },
  { value: 'chart-3', label: 'Dourado', className: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  { value: 'chart-4', label: 'Roxo', className: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
  { value: 'chart-5', label: 'Vermelho', className: 'bg-chart-5/15 text-chart-5 border-chart-5/30' },
  { value: 'accent', label: 'Accent', className: 'bg-accent/50 text-accent-foreground border-accent/50' },
] as const;

export function getTagColorClass(color: string): string {
  const found = TAG_COLORS.find(c => c.value === color);
  return found?.className || TAG_COLORS[0].className;
}

interface TagBadgeProps {
  tag: WorkflowTag;
  onRemove?: () => void;
  size?: 'sm' | 'default';
  className?: string;
}

export function TagBadge({ tag, onRemove, size = 'default', className }: TagBadgeProps) {
  const colorClass = getTagColorClass(tag.color);
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium transition-colors',
        colorClass,
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        onRemove && 'pr-1',
        className
      )}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
        >
          <X className={cn('text-current', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        </button>
      )}
    </Badge>
  );
}
