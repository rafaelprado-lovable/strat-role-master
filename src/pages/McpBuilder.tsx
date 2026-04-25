import { useCallback, useMemo, useRef, useState } from "react";
import {
  Wrench,
  Database,
  MessageSquareQuote,
  ServerCog,
  Trash2,
  Download,
  Copy,
  Plus,
  Move,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BlockKind = "tool" | "resource" | "prompt";

interface McpBlock {
  id: string;
  kind: BlockKind;
  name: string;
  description: string;
  // tool
  inputSchema?: string; // JSON string
  // resource
  uri?: string;
  mimeType?: string;
  // prompt
  template?: string;
  x: number;
  y: number;
}

interface PaletteItem {
  kind: BlockKind;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string; // tailwind classes for bar
}

const PALETTE: PaletteItem[] = [
  {
    kind: "tool",
    label: "Tool",
    description: "Função executável exposta pelo MCP",
    icon: Wrench,
    accent: "from-sky-500 to-indigo-500",
  },
  {
    kind: "resource",
    label: "Resource",
    description: "Recurso/dado acessível por URI",
    icon: Database,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    kind: "prompt",
    label: "Prompt",
    description: "Template de prompt reutilizável",
    icon: MessageSquareQuote,
    accent: "from-fuchsia-500 to-pink-500",
  },
];

const KIND_META: Record<BlockKind, { icon: React.ElementType; label: string; accent: string }> = {
  tool: { icon: Wrench, label: "Tool", accent: "from-sky-500 to-indigo-500" },
  resource: { icon: Database, label: "Resource", accent: "from-emerald-500 to-teal-500" },
  prompt: { icon: MessageSquareQuote, label: "Prompt", accent: "from-fuchsia-500 to-pink-500" },
};

const defaultBlock = (kind: BlockKind, x: number, y: number): McpBlock => {
  const id = `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  if (kind === "tool") {
    return {
      id,
      kind,
      name: "new_tool",
      description: "Descreva o que essa tool faz",
      inputSchema: JSON.stringify(
        {
          type: "object",
          properties: { input: { type: "string" } },
          required: ["input"],
        },
        null,
        2,
      ),
      x,
      y,
    };
  }
  if (kind === "resource") {
    return {
      id,
      kind,
      name: "new_resource",
      description: "Descreva o recurso",
      uri: "resource://example",
      mimeType: "application/json",
      x,
      y,
    };
  }
  return {
    id,
    kind,
    name: "new_prompt",
    description: "Descreva o prompt",
    template: "Você é um assistente. {{input}}",
    x,
    y,
  };
};

export default function McpBuilder() {
  const [serverName, setServerName] = useState("my-mcp-server");
  const [serverVersion, setServerVersion] = useState("1.0.0");
  const [blocks, setBlocks] = useState<McpBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) || null, [blocks, selectedId]);

  // Drop from palette
  const onPaletteDragStart = (e: React.DragEvent, kind: BlockKind) => {
    e.dataTransfer.setData("application/x-mcp-kind", kind);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Move existing block
  const onBlockDragStart = (e: React.DragEvent, block: McpBlock) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOriginRef.current = {
      id: block.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    e.dataTransfer.setData("application/x-mcp-move", block.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("application/x-mcp-move") ? "move" : "copy";
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const newKind = e.dataTransfer.getData("application/x-mcp-kind") as BlockKind | "";
    const moveId = e.dataTransfer.getData("application/x-mcp-move");

    if (newKind) {
      const x = e.clientX - rect.left - 130;
      const y = e.clientY - rect.top - 40;
      const block = defaultBlock(newKind, Math.max(8, x), Math.max(8, y));
      setBlocks((prev) => [...prev, block]);
      setSelectedId(block.id);
      return;
    }
    if (moveId && dragOriginRef.current?.id === moveId) {
      const { offsetX, offsetY } = dragOriginRef.current;
      const x = e.clientX - rect.left - offsetX;
      const y = e.clientY - rect.top - offsetY;
      setBlocks((prev) =>
        prev.map((b) => (b.id === moveId ? { ...b, x: Math.max(0, x), y: Math.max(0, y) } : b)),
      );
      dragOriginRef.current = null;
    }
  };

  const updateSelected = useCallback(
    (patch: Partial<McpBlock>) => {
      if (!selectedId) return;
      setBlocks((prev) => prev.map((b) => (b.id === selectedId ? { ...b, ...patch } : b)));
    },
    [selectedId],
  );

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const exportJson = useMemo(() => {
    const tools = blocks
      .filter((b) => b.kind === "tool")
      .map((b) => {
        let schema: unknown = {};
        try {
          schema = b.inputSchema ? JSON.parse(b.inputSchema) : {};
        } catch {
          schema = { _error: "invalid JSON schema" };
        }
        return { name: b.name, description: b.description, inputSchema: schema };
      });
    const resources = blocks
      .filter((b) => b.kind === "resource")
      .map((b) => ({ name: b.name, description: b.description, uri: b.uri, mimeType: b.mimeType }));
    const prompts = blocks
      .filter((b) => b.kind === "prompt")
      .map((b) => ({ name: b.name, description: b.description, template: b.template }));
    return JSON.stringify(
      { name: serverName, version: serverVersion, tools, resources, prompts },
      null,
      2,
    );
  }, [blocks, serverName, serverVersion]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportJson);
    toast.success("JSON copiado para a área de transferência");
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serverName || "mcp"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exportado");
  };

  const counts = useMemo(
    () => ({
      tool: blocks.filter((b) => b.kind === "tool").length,
      resource: blocks.filter((b) => b.kind === "resource").length,
      prompt: blocks.filter((b) => b.kind === "prompt").length,
    }),
    [blocks],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/60 p-2 text-primary-foreground shadow-lg">
            <ServerCog className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">MCP Builder</h1>
            <p className="text-xs text-muted-foreground">
              Arraste blocos para o canvas e monte seu servidor MCP visualmente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="secondary" className="gap-1">
              <Wrench className="h-3 w-3" /> {counts.tool}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Database className="h-3 w-3" /> {counts.resource}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MessageSquareQuote className="h-3 w-3" /> {counts.prompt}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copiar JSON
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Server meta */}
      <Card className="flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="srv-name" className="text-xs">Nome do servidor</Label>
          <Input
            id="srv-name"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder="my-mcp-server"
          />
        </div>
        <div className="w-32">
          <Label htmlFor="srv-version" className="text-xs">Versão</Label>
          <Input
            id="srv-version"
            value={serverVersion}
            onChange={(e) => setServerVersion(e.target.value)}
            placeholder="1.0.0"
          />
        </div>
      </Card>

      {/* Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
        {/* Palette */}
        <Card className="col-span-12 flex flex-col p-3 md:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Blocos
          </div>
          <div className="flex flex-col gap-2">
            {PALETTE.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.kind}
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, p.kind)}
                  className="group cursor-grab overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60 hover:shadow-md active:cursor-grabbing"
                  title={p.description}
                >
                  <div className={cn("h-1 w-full bg-gradient-to-r", p.accent)} />
                  <div className="flex items-center gap-2 p-2">
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground">
                        {p.description}
                      </div>
                    </div>
                    <Move className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="my-3" />
          <p className="text-[11px] text-muted-foreground">
            Dica: arraste um bloco para o canvas e clique para editar suas propriedades.
          </p>
        </Card>

        {/* Canvas */}
        <Card className="col-span-12 min-h-[480px] overflow-hidden p-0 md:col-span-7">
          <div
            ref={canvasRef}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            onClick={() => setSelectedId(null)}
            className="relative h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            {blocks.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ServerCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Arraste blocos da paleta para começar
                  </p>
                </div>
              </div>
            )}

            {blocks.map((b) => {
              const meta = KIND_META[b.kind];
              const Icon = meta.icon;
              const isSelected = selectedId === b.id;
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => onBlockDragStart(e, b)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(b.id);
                  }}
                  style={{ left: b.x, top: b.y }}
                  className={cn(
                    "absolute w-[260px] cursor-grab select-none overflow-hidden rounded-2xl border bg-card shadow-md transition active:cursor-grabbing",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className={cn("h-1.5 w-full bg-gradient-to-r", meta.accent)} />
                  <div className="flex items-start gap-2 p-3">
                    <div className="rounded-md bg-muted p-1.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{b.name}</span>
                        <Badge variant="outline" className="h-4 px-1 text-[10px]">
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {b.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(b.id);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Inspector */}
        <Card className="col-span-12 flex min-h-0 flex-col p-3 md:col-span-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4" /> Inspetor
          </div>
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">
                Selecione um bloco no canvas para editar suas propriedades.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="props" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="props">Propriedades</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="props" className="mt-2 min-h-0 flex-1">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={selected.name}
                        onChange={(e) => updateSelected({ name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Textarea
                        value={selected.description}
                        onChange={(e) => updateSelected({ description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {selected.kind === "tool" && (
                      <div>
                        <Label className="text-xs">Input Schema (JSON)</Label>
                        <Textarea
                          value={selected.inputSchema || ""}
                          onChange={(e) => updateSelected({ inputSchema: e.target.value })}
                          rows={10}
                          className="font-mono text-xs"
                        />
                      </div>
                    )}

                    {selected.kind === "resource" && (
                      <>
                        <div>
                          <Label className="text-xs">URI</Label>
                          <Input
                            value={selected.uri || ""}
                            onChange={(e) => updateSelected({ uri: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">MIME type</Label>
                          <Input
                            value={selected.mimeType || ""}
                            onChange={(e) => updateSelected({ mimeType: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selected.kind === "prompt" && (
                      <div>
                        <Label className="text-xs">Template</Label>
                        <Textarea
                          value={selected.template || ""}
                          onChange={(e) => updateSelected({ template: e.target.value })}
                          rows={8}
                          className="font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="json" className="mt-2 min-h-0 flex-1">
                <ScrollArea className="h-full">
                  <pre className="rounded-md bg-muted p-2 text-[11px] leading-tight">
{exportJson}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
}
