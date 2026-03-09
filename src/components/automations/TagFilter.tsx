import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkflowTag, TagBadge } from './TagBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagFilterProps {
  availableTags: WorkflowTag[];
  selectedTags: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function TagFilter({ availableTags, selectedTags, onChange, className }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCount = selectedTags.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 border-border/50',
            selectedCount > 0 && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <Filter className="h-4 w-4" />
          Tags
          {selectedCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Filtrar por tags</p>
            {selectedCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {availableTags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tag disponível
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'cursor-pointer transition-all',
                      isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-full' : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    <TagBadge tag={tag} size="sm" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
