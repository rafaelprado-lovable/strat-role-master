import { useEffect, useState, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, X, Eye, Edit3, Tag as TagIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  KB_CATEGORIES, KB_SEVERITIES, KB_SYSTEMS, KbSeverity, knowledgeBaseService,
} from '@/services/knowledgeBaseService';

export default function KnowledgeBaseOmsEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [system, setSystem] = useState('');
  const [severity, setSeverity] = useState<KbSeverity>('media');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [symptom, setSymptom] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [solution, setSolution] = useState('');

  useEffect(() => {
    if (isNew) return;
    const article = knowledgeBaseService.get(id!);
    if (!article) {
      toast({ title: 'Artigo não encontrado', variant: 'destructive' });
      navigate('/knowledge-base/oms');
      return;
    }
    setTitle(article.title);
    setDescription(article.description);
    setContent(article.content);
    setCategory(article.category);
    setSystem(article.system);
    setSeverity(article.severity);
    setTags(article.tags);
    setSymptom(article.symptom);
    setRootCause(article.rootCause);
    setSolution(article.solution);
  }, [id, isNew, navigate]);

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      content,
      category,
      system,
      severity,
      tags,
      symptom,
      rootCause,
      solution,
    };
    if (isNew) {
      knowledgeBaseService.create(payload);
      toast({ title: 'Artigo criado' });
    } else {
      knowledgeBaseService.update(id!, payload);
      toast({ title: 'Artigo atualizado' });
    }
    navigate('/knowledge-base/oms');
  };

  const handleDelete = () => {
    if (isNew) return;
    knowledgeBaseService.remove(id!);
    toast({ title: 'Artigo removido' });
    navigate('/knowledge-base/oms');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/knowledge-base/oms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do artigo..."
            className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> Excluir
            </Button>
          )}
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main column */}
          <div className="space-y-6 min-w-0">
            <div className="space-y-2">
              <Label>Descrição curta</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resumo do componente, integração ou problema documentado..."
                rows={2}
              />
            </div>

            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Troubleshooting</h3>
                <Badge variant="outline" className="text-xs">Sintoma → Causa → Solução</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sintoma</Label>
                <Textarea
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder="Como o problema se manifesta? Ex: erro 500 em /orders, lentidão ao consultar..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Causa raiz</Label>
                <Textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="O que causa o problema? Ex: pool de conexões esgotado, fila travada..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Solução</Label>
                <Textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Passos para resolver. Ex: reiniciar serviço X, aumentar pool, executar runbook RB-001..."
                  rows={4}
                />
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Tabs defaultValue="edit">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <h3 className="font-semibold">Conteúdo detalhado</h3>
                  <TabsList>
                    <TabsTrigger value="edit" className="gap-1.5"><Edit3 className="h-3.5 w-3.5" /> Editar</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="edit" className="m-0">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Arquitetura&#10;&#10;Descreva diagramas, fluxos, dependências, endpoints, exemplos em markdown..."
                    rows={20}
                    className="border-0 rounded-none font-mono text-sm focus-visible:ring-0 resize-none"
                  />
                </TabsContent>
                <TabsContent value="preview" className="m-0 p-6 min-h-[400px]">
                  {content.trim() ? (
                    <div className="prose prose-invert max-w-none prose-img:rounded-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nada para mostrar ainda.</p>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar — metadata */}
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Categorização</h3>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {KB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sistema</Label>
                <Select value={system} onValueChange={setSystem}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {KB_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as KbSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KB_SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={addTag}
                placeholder="Adicionar tag (Enter ou ,)"
              />
            </Card>

            <Card className="p-4 text-xs text-muted-foreground space-y-1">
              <div><strong>Ambiente:</strong> OMS</div>
              <div><strong>Status:</strong> {isNew ? 'Novo (não salvo)' : 'Salvo'}</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
