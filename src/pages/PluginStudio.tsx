import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Puzzle, Save, Upload, ArrowLeft, Plus, FileCode2, Settings2, Eye, GitBranch, Terminal, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { toast } from 'sonner';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json as jsonLang } from '@codemirror/lang-json';
import { autocompletion } from '@codemirror/autocomplete';

import { PluginFileExplorer } from '@/components/plugin-studio/PluginFileExplorer';
import { PluginSchemaEditor } from '@/components/plugin-studio/PluginSchemaEditor';
import { PluginTestConsole } from '@/components/plugin-studio/PluginTestConsole';
import { PluginJsonPreview } from '@/components/plugin-studio/PluginJsonPreview';
import { PluginVersionPanel } from '@/components/plugin-studio/PluginVersionPanel';
import { PluginMetadataPanel } from '@/components/plugin-studio/PluginMetadataPanel';
import { PluginProject, PluginFile, PluginVersion, TestRun, PluginFieldDef } from '@/types/pluginStudio';
import { definitionService } from '@/services/definitionService';
import { ScrollArea } from '@/components/ui/scroll-area';

function createEmptyProject(): PluginProject {
  return {
    id: `plugin-${Date.now()}`,
    name: 'Novo Plugin',
    description: '',
    category: 'action',
    group: '',
    icon: '⚡',
    definition_id: `custom_plugin_v1`,
    inputs: [],
    outputs: [],
    files: [
      {
        id: 'file-main',
        name: 'main.py',
        language: 'python',
        content: `# Plugin principal\n# Acesse inputs via variável 'inputs'\n# Retorne o resultado via 'output'\n\nimport json\n\ndata = inputs.get("data", {})\nresult = {"status": "ok", "processed": True}\n\noutput = json.dumps(result)\n`,
        isEntry: true,
      },
    ],
    status: 'draft',
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getEditorExtensions(lang: string) {
  const base = [autocompletion()];
  switch (lang) {
    case 'python': return [...base, python()];
    case 'javascript': return [...base, javascript()];
    case 'json': return [...base, jsonLang()];
    default: return base;
  }
}

// Persist projects in localStorage
const STORAGE_KEY = 'plugin-studio-projects';
function loadProjects(): PluginProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveProjects(projects: PluginProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export default function PluginStudio() {
  const [projects, setProjects] = useState<PluginProject[]>(() => loadProjects());
  const [activeProject, setActiveProject] = useState<PluginProject | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState('schema');
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);

  // Persist
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const activeFile = activeProject?.files.find(f => f.id === activeFileId) || null;

  const handleNewProject = () => {
    const p = createEmptyProject();
    setProjects(prev => [p, ...prev]);
    setActiveProject(p);
    setActiveFileId(p.files[0].id);
  };

  const handleSelectProject = (p: PluginProject) => {
    setActiveProject(p);
    setActiveFileId(p.files[0]?.id || null);
    setTestRuns([]);
  };

  const handleBack = () => {
    setActiveProject(null);
    setActiveFileId(null);
    setTestRuns([]);
  };

  const updateProject = useCallback((updates: Partial<PluginProject>) => {
    setActiveProject(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      setProjects(ps => ps.map(p => p.id === updated.id ? updated : p));
      return updated;
    });
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    if (!activeFileId || !activeProject) return;
    const updatedFiles = activeProject.files.map(f =>
      f.id === activeFileId ? { ...f, content: code } : f
    );
    updateProject({ files: updatedFiles });
  }, [activeFileId, activeProject, updateProject]);

  const handleAddFile = (file: PluginFile) => {
    if (!activeProject) return;
    updateProject({ files: [...activeProject.files, file] });
    setActiveFileId(file.id);
  };

  const handleDeleteFile = (id: string) => {
    if (!activeProject) return;
    const files = activeProject.files.filter(f => f.id !== id);
    updateProject({ files });
    if (activeFileId === id) setActiveFileId(files[0]?.id || null);
  };

  const handleRunTest = (inputValues: Record<string, unknown>) => {
    const run: TestRun = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      inputs: inputValues,
      output: null,
      status: 'running',
      logs: ['[INFO] Iniciando execução de teste...'],
    };
    setTestRuns(prev => [run, ...prev]);

    // Simulate test execution
    setTimeout(() => {
      setTestRuns(prev => prev.map(r =>
        r.id === run.id
          ? {
              ...r,
              status: 'success' as const,
              duration: Math.floor(Math.random() * 500) + 100,
              output: { status: 'ok', processed: true, input_received: inputValues },
              logs: [
                ...r.logs,
                '[INFO] Inputs recebidos: ' + JSON.stringify(inputValues),
                '[INFO] Executando script principal...',
                '[INFO] Processamento concluído',
                '[OK] Output gerado com sucesso',
              ],
            }
          : r
      ));
    }, 1500);
  };

  const handleCreateVersion = (label: string) => {
    if (!activeProject) return;
    const version: PluginVersion = {
      id: `ver-${Date.now()}`,
      version: `v${(activeProject.versions.length + 1)}.0.0`,
      label,
      createdAt: new Date().toISOString(),
      snapshot: { ...activeProject },
    };
    updateProject({ versions: [...activeProject.versions, version] });
  };

  const handleRestoreVersion = (version: PluginVersion) => {
    const snap = version.snapshot;
    updateProject({
      files: snap.files,
      inputs: snap.inputs,
      outputs: snap.outputs,
      name: snap.name,
      description: snap.description,
    });
    setActiveFileId(snap.files[0]?.id || null);
    toast.success(`Restaurado para ${version.label || version.version}`);
  };

  const handlePublish = async () => {
    if (!activeProject) return;
    try {
      const def = {
        definition_id: activeProject.definition_id,
        label: activeProject.name,
        icon: activeProject.icon,
        description: activeProject.description,
        category: activeProject.category,
        group: activeProject.group,
        inputs: activeProject.inputs,
        outputs: activeProject.outputs,
      };
      await definitionService.create(def as any);
      updateProject({ status: 'published' });
      toast.success('Plugin publicado com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao publicar: ${err.message}`);
    }
  };

  const handleSave = () => {
    saveProjects(projects);
    toast.success('Projeto salvo localmente');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProject?.id === id) handleBack();
    toast.success('Projeto excluído');
  };

  // ====== PROJECT LIST VIEW ======
  if (!activeProject) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Plugin Studio</h2>
              <p className="text-muted-foreground text-sm">IDE completa para desenvolvimento de plugins e conectores</p>
            </div>
          </div>
          <Button onClick={handleNewProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Plugin
          </Button>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="p-4 rounded-2xl bg-muted/50">
              <Puzzle className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nenhum plugin criado</h3>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro plugin para começar</p>
            </div>
            <Button onClick={handleNewProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Plugin
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-card group"
                onClick={() => handleSelectProject(p)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <code className="text-[10px] text-muted-foreground font-mono">{p.definition_id}</code>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    p.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {p.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileCode2 className="h-3 w-3" /> {p.files.length} arquivo{p.files.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {p.inputs.length}→{p.outputs.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" /> {p.versions.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 text-[10px] text-destructive opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                >
                  Excluir
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ====== IDE VIEW ======
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeProject.icon}</span>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{activeProject.name}</h3>
              <code className="text-[10px] text-muted-foreground font-mono">{activeProject.definition_id}</code>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ml-2 ${
            activeProject.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {activeProject.status === 'published' ? 'Publicado' : 'Rascunho'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handlePublish}>
            <Upload className="h-3.5 w-3.5" />
            Publicar
          </Button>
        </div>
      </div>

      {/* IDE layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: File Explorer */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <PluginFileExplorer
            files={activeProject.files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
            pluginName={activeProject.name}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: Code Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Tab bar for open files */}
            {activeFile && (
              <div className="flex items-center gap-0 border-b border-border bg-muted/30 shrink-0">
                {activeProject.files
                  .filter(f => f.id === activeFileId)
                  .map(f => (
                    <div
                      key={f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-background border-r border-border"
                    >
                      <FileCode2 className="h-3 w-3 text-primary" />
                      <span>{f.name}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Editor area */}
            <div className="flex-1 overflow-hidden">
              {activeFile ? (
                <CodeMirror
                  value={activeFile.content}
                  onChange={handleCodeChange}
                  theme={vscodeDark}
                  extensions={getEditorExtensions(activeFile.language)}
                  height="100%"
                  className="text-sm h-full [&_.cm-editor]:!outline-none [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    indentOnInput: true,
                    tabSize: 2,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Selecione um arquivo para editar
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Schema/Preview/Versions */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
            <TabsList className="h-9 shrink-0 rounded-none border-b border-border bg-muted/30 w-full justify-start px-1">
              <TabsTrigger value="schema" className="text-[10px] h-7 gap-1 data-[state=active]:bg-background">
                <Layers className="h-3 w-3" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="metadata" className="text-[10px] h-7 gap-1 data-[state=active]:bg-background">
                <Settings2 className="h-3 w-3" />
                Config
              </TabsTrigger>
              <TabsTrigger value="test" className="text-[10px] h-7 gap-1 data-[state=active]:bg-background">
                <Terminal className="h-3 w-3" />
                Console
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-[10px] h-7 gap-1 data-[state=active]:bg-background">
                <Eye className="h-3 w-3" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="versions" className="text-[10px] h-7 gap-1 data-[state=active]:bg-background">
                <GitBranch className="h-3 w-3" />
                Versões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  <PluginSchemaEditor
                    title="Inputs"
                    fields={activeProject.inputs}
                    onChange={fields => updateProject({ inputs: fields })}
                  />
                  <PluginSchemaEditor
                    title="Outputs"
                    fields={activeProject.outputs}
                    onChange={fields => updateProject({ outputs: fields })}
                    color="secondary"
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metadata" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <PluginMetadataPanel
                  project={activeProject}
                  onChange={updateProject}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="test" className="flex-1 overflow-hidden m-0">
              <PluginTestConsole
                inputs={activeProject.inputs}
                testRuns={testRuns}
                onRunTest={handleRunTest}
                onClearRuns={() => setTestRuns([])}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
              <PluginJsonPreview project={activeProject} />
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-hidden m-0">
              <PluginVersionPanel
                versions={activeProject.versions}
                currentProject={activeProject}
                onCreateVersion={handleCreateVersion}
                onRestore={handleRestoreVersion}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
