import { useState, useRef, useEffect } from 'react';
import { Plus, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkflowTag, TagBadge, TAG_COLORS } from './TagBadge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: WorkflowTag[];
  onChange: (tags: WorkflowTag[]) => void;
  availableTags?: WorkflowTag[];
  placeholder?: string;
  className?: string;
}

export function TagInput({ 
  tags, 
  onChange, 
  availableTags = [], 
  placeholder = 'Adicionar tag...',
  className 
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter available tags not already selected
  const filteredAvailable = availableTags.filter(
    t => !tags.some(st => st.id === t.id) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches an existing tag
  const exactMatch = availableTags.find(
    t => t.name.toLowerCase() === search.toLowerCase()
  );

  const handleAddTag = (tag: WorkflowTag) => {
    if (!tags.some(t => t.id === tag.id)) {
      onChange([...tags, tag]);
    }
    setSearch('');
    setIsOpen(false);
  };

  const handleCreateTag = () => {
    if (!search.trim()) return;
    const newTag: WorkflowTag = {
      id: `tag-${Date.now()}`,
      name: search.trim(),
      color: selectedColor,
    };
    onChange([...tags, newTag]);
    setSearch('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(tags.filter(t => t.id !== tagId));
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => handleRemoveTag(tag.id)}
          />
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground border-dashed"
            >
              <Plus className="h-3 w-3" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="pl-8 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (exactMatch && !tags.some(t => t.id === exactMatch.id)) {
                        handleAddTag(exactMatch);
                      } else if (search.trim() && !exactMatch) {
                        handleCreateTag();
                      }
                    }
                  }}
                />
              </div>

              {/* Existing tags */}
              {filteredAvailable.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    Tags existentes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredAvailable.slice(0, 6).map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="cursor-pointer"
                      >
                        <TagBadge tag={tag} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create new tag */}
              {search.trim() && !exactMatch && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    Criar nova tag
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {TAG_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-all',
                          color.className.replace(/text-[^\s]+/g, '').replace('bg-', 'bg-').replace('/15', ''),
                          selectedColor === color.value 
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' 
                            : 'opacity-60 hover:opacity-100'
                        )}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateTag}
                    className="w-full h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Criar "{search}"
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
