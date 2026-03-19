import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronRight, ArrowRight, BookOpen, FileText } from "lucide-react";
import { icons, Globe } from "lucide-react";
import { definitionService, type Definition, type DefinitionField } from "@/services/definitionService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/definitions/MarkdownRenderer";

function resolveIcon(iconName?: string): React.ElementType {
  if (!iconName) return Globe;
  const pascal = iconName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (icons as Record<string, React.ElementType>)[pascal] || Globe;
}

const categoryColors: Record<string, string> = {
  trigger: 'hsl(var(--chart-1))',
  action: 'hsl(var(--chart-3))',
  filter: 'hsl(160 60% 45%)',
};

const categoryLabels: Record<string, string> = {
  trigger: 'Gatilho',
  action: 'Ação',
  filter: 'Filtro',
};

const typeLabels: Record<string, string> = {
  string: 'String',
  text: 'Texto',
  number: 'Número',
  boolean: 'Booleano',
  json: 'JSON',
  list: 'Lista',
};

function FieldTable({ fields, type }: { fields: DefinitionField[]; type: 'input' | 'output' }) {
  if (!fields || fields.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Nenhum {type === 'input' ? 'input' : 'output'} definido</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Campo</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Tipo</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs hidden sm:table-cell">Descrição</th>
            <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs w-20">Obrigatório</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.name} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
              <td className="px-3 py-2">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{f.name}</code>
                {f.label && f.label !== f.name && (
                  <span className="text-xs text-muted-foreground ml-2">{f.label}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {typeLabels[f.type] || f.type}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                {f.description || f.placeholder || '—'}
              </td>
              <td className="px-3 py-2 text-center">
                {f.required ? (
                  <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Sim</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NodeDocCard({ definition }: { definition: Definition }) {
  const [open, setOpen] = useState(false);
  const Icon = resolveIcon(definition.icon);
  const color = categoryColors[definition.category] || 'hsl(var(--muted-foreground))';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold truncate">{definition.label}</CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0"
                    style={{ borderColor: color, color }}
                  >
                    {categoryLabels[definition.category] || definition.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{definition.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded hidden md:block">
                  {definition.definition_id}
                </code>
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">definition_id: {definition.definition_id}</code>
            </div>

            {/* Markdown Documentation */}
            {definition.documentation && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-primary" />
                  Documentação
                </h4>
                <div className="border rounded-lg p-4 bg-card">
                  <MarkdownRenderer content={definition.documentation} />
                </div>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-primary" />
                Inputs
              </h4>
              <FieldTable fields={definition.inputs} type="input" />
            </div>

            {/* Outputs */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 rotate-180 text-chart-2" />
                Outputs
              </h4>
              <FieldTable fields={definition.outputs} type="output" />
            </div>

            {/* Usage example */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">Referência em templates</h4>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs text-muted-foreground space-y-1">
                {definition.outputs?.map(o => (
                  <div key={o.name}>
                    <span className="text-primary">{`{{nodeId.output.${o.name}}}`}</span>
                    <span className="ml-2">→ {o.label}</span>
                  </div>
                ))}
                {(!definition.outputs || definition.outputs.length === 0) && (
                  <span>Sem outputs disponíveis</span>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function NodeDocs() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await definitionService.list();
      setDefinitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar definições:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDefinitions(); }, [fetchDefinitions]);

  const categories = ['trigger', 'action', 'filter'];

  const filtered = definitions.filter(d => {
    const matchSearch = !search || 
      d.label.toLowerCase().includes(search.toLowerCase()) ||
      d.definition_id.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = filtered.filter(d => d.category === cat);
    return acc;
  }, {} as Record<string, Definition[]>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentação de Nodes</h1>
          <p className="text-sm text-muted-foreground">Referência completa dos blocos disponíveis para automações</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer text-xs px-3 py-1.5"
            onClick={() => setCategoryFilter(null)}
          >
            Todos ({definitions.length})
          </Badge>
          {categories.map(cat => {
            const count = definitions.filter(d => d.category === cat).length;
            const isActive = categoryFilter === cat;
            return (
              <Badge
                key={cat}
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer text-xs px-3 py-1.5"
                style={isActive ? { backgroundColor: categoryColors[cat] } : { borderColor: categoryColors[cat], color: categoryColors[cat] }}
                onClick={() => setCategoryFilter(isActive ? null : cat)}
              >
                {categoryLabels[cat]} ({count})
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum bloco encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                  <h2 className="text-sm font-semibold text-foreground">
                    {categoryLabels[cat]}s
                  </h2>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map(d => (
                    <NodeDocCard key={d._id || d.definition_id} definition={d} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
