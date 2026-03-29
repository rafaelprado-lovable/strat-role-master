import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Terminal, Server, Plus, X, Circle, Wifi, WifiOff, Loader2, Send, Radio, ChevronsUpDown, Check, Link } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { executeCommand as apiExecute, pollJobStatus } from "@/services/heimdallCliService";

// ---------- mock data ----------
type Environment = "middleware";

const ENV_LABELS: Record<Environment, string> = {
  middleware: "Produção",
};

const ENV_COLORS: Record<Environment, string> = {
  middleware: "hsl(0,70%,50%)",
  staging: "hsl(45,90%,45%)",
  development: "hsl(210,70%,50%)",
};

interface Cluster {
  id: string;
  name: string;
  environment: Environment;
}

const MOCK_CLUSTERS: Cluster[] = [
  { id: "beta", name: "beta", environment: "middleware" },
  { id: "c2", name: "cluster-b", environment: "middleware" },
  { id: "c3", name: "cluster-stg", environment: "middleware" },
  { id: "c4", name: "cluster-dev", environment: "middleware" },
];

interface Machine {
  id: string;
  name: string;
  host: string;
  status: "online" | "offline";
  environment: Environment;
  clusterId: string;
  sshUser: string;
}

const MOCK_MACHINES: Machine[] = [
  { id: "m1", name: "snelnxb967", host: "snelnxb967", status: "online", environment: "middleware", clusterId: "beta", sshUser: "nmws_app" },
  { id: "m2", name: "prod-db-01", host: "10.0.1.20", status: "online", environment: "middleware", clusterId: "c1", sshUser: "nmws_app" },
  { id: "m3", name: "prod-worker-01", host: "10.0.1.30", status: "online", environment: "middleware", clusterId: "c2", sshUser: "nmws_app" },
  { id: "m4", name: "stg-app-01", host: "10.0.2.10", status: "online", environment: "middleware", clusterId: "c3", sshUser: "nmws_app" },
  { id: "m5", name: "stg-db-01", host: "10.0.2.20", status: "online", environment: "middleware", clusterId: "c3", sshUser: "nmws_app" },
  { id: "m6", name: "dev-app-01", host: "10.0.3.5", status: "online", environment: "middleware", clusterId: "c4", sshUser: "nmws_app" },
  { id: "m7", name: "dev-worker-01", host: "10.0.3.6", status: "offline", environment: "middleware", clusterId: "c4", sshUser: "nmws_app" },
];

// ---------- types ----------
interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "pending";
  text: string;
  timestamp: string;
  cwd?: string;
}

interface TerminalTab {
  id: string;
  machine: Machine;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
  isExecuting: boolean;
  cwd: string;
}

function now() {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}

// ---------- Terminal component ----------
function TerminalView({
  tab,
  onExecute,
}: {
  tab: TerminalTab;
  onExecute: (tabId: string, cmd: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tab.lines.length]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (tab.isExecuting) return;

    if (e.key === "Enter" && input.trim()) {
      onExecute(tab.id, input.trim());
      setInput("");
      setHistoryIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, tab.history.length - 1);
      if (newIdx >= 0 && tab.history[tab.history.length - 1 - newIdx]) {
        setHistoryIdx(newIdx);
        setInput(tab.history[tab.history.length - 1 - newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = historyIdx - 1;
      if (newIdx < 0) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(newIdx);
        setInput(tab.history[tab.history.length - 1 - newIdx]);
      }
    }
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div
      className="flex-1 flex flex-col bg-[hsl(220,20%,6%)] rounded-lg border border-border overflow-hidden font-mono text-sm cursor-text"
      onClick={focusInput}
    >
      {/* terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(220,15%,10%)] border-b border-border select-none">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[hsl(0,80%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(45,90%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(120,60%,50%)]" />
        </div>
        <span className="text-muted-foreground text-xs ml-2">
          {tab.machine.sshUser}@{tab.machine.name} — {tab.machine.host}
        </span>
        {tab.isExecuting && (
          <Loader2 className="w-3.5 h-3.5 text-[hsl(45,90%,55%)] animate-spin ml-2" />
        )}
        <Badge
          variant={tab.machine.status === "online" ? "default" : "destructive"}
          className="ml-auto text-[10px] h-5"
        >
          {tab.machine.status === "online" ? (
            <Wifi className="w-3 h-3 mr-1" />
          ) : (
            <WifiOff className="w-3 h-3 mr-1" />
          )}
          {tab.machine.status}
        </Badge>
      </div>

      {/* terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-[400px] max-h-[calc(100vh-280px)]">
        {tab.lines.map((line, i) => (
          <div key={i} className="leading-6">
            {line.type === "input" && (
              <span>
                <span className="text-[hsl(120,60%,50%)]">{tab.machine.sshUser}@{tab.machine.name}</span>
                <span className="text-muted-foreground">:</span>
                <span className="text-[hsl(210,80%,65%)]">{line.cwd || "~"}</span>
                <span className="text-muted-foreground">$ </span>
                <span className="text-[hsl(0,0%,90%)]">{line.text}</span>
              </span>
            )}
            {line.type === "output" && (
              <pre className="text-[hsl(0,0%,85%)] whitespace-pre-wrap">{line.text}</pre>
            )}
            {line.type === "error" && (
              <pre className="text-[hsl(0,70%,60%)] whitespace-pre-wrap">{line.text}</pre>
            )}
            {line.type === "system" && (
              <pre className="text-[hsl(210,60%,60%)] whitespace-pre-wrap italic">{line.text}</pre>
            )}
            {line.type === "pending" && (
              <span className="text-[hsl(45,90%,55%)] flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin inline" />
                {line.text}
              </span>
            )}
          </div>
        ))}

        {/* prompt line */}
        <div className="flex items-center leading-6">
          <span className="text-[hsl(120,60%,50%)]">{tab.machine.sshUser}@{tab.machine.name}</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-[hsl(210,80%,65%)]">{tab.cwd}</span>
          <span className="text-muted-foreground">$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={tab.isExecuting}
            className="flex-1 bg-transparent text-[hsl(0,0%,90%)] outline-none caret-[hsl(120,60%,50%)] ml-0.5 disabled:opacity-40"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}

// ---------- page ----------
export default function HeimdallCli() {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedEnv, setSelectedEnv] = useState<Environment>("production");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(new Set());
  const [machinePopoverOpen, setMachinePopoverOpen] = useState(false);
  const [broadcastCmd, setBroadcastCmd] = useState("");
  const [broadcastTargets, setBroadcastTargets] = useState<Set<string>>(new Set());
  const [showBroadcast, setShowBroadcast] = useState(false);

  const filteredClusters = MOCK_CLUSTERS.filter((c) => c.environment === selectedEnv);
  const filteredMachines = MOCK_MACHINES.filter(
    (m) => m.environment === selectedEnv && (selectedCluster === "all" || m.clusterId === selectedCluster)
  );

  // Keyboard shortcuts: Alt+← / Alt+→ to switch sessions, Alt+1-9 to jump
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (tabs.length < 2) return;

      // Alt+ArrowRight (next) / Alt+ArrowLeft (prev)
      if (e.altKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTab);
        const next = e.key === "ArrowLeft"
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length;
        setActiveTab(tabs[next].id);
        return;
      }

      // Alt+1 through Alt+9
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key >= "1" && e.key <= "9") {
        const target = parseInt(e.key) - 1;
        if (target < tabs.length) {
          e.preventDefault();
          setActiveTab(tabs[target].id);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tabs, activeTab]);

  const addTab = useCallback((machineId: string) => {
    const machine = MOCK_MACHINES.find((m) => m.id === machineId);
    if (!machine) return;

    const id = `tab-${Date.now()}-${machineId}`;
    const welcomeLine: TerminalLine = {
      type: "system",
      text: `Conectado a ${machine.name} (${machine.host}) como ${machine.sshUser}. Os comandos serão executados via SSH remoto.`,
      timestamp: now(),
    };

    setTabs((prev) => [
      ...prev,
      { id, machine, lines: [welcomeLine], history: [], historyIndex: -1, isExecuting: false, cwd: "~" },
    ]);
    return id;
  }, []);

  const connectSelected = useCallback(() => {
    if (selectedMachines.size === 0) return;
    let lastId = "";
    selectedMachines.forEach((mid) => {
      const id = addTab(mid);
      if (id) lastId = id;
    });
    if (lastId) setActiveTab(lastId);
    setSelectedMachines(new Set());
    setMachinePopoverOpen(false);
  }, [selectedMachines, addTab]);

  const connectAll = useCallback(() => {
    let lastId = "";
    filteredMachines.forEach((m) => {
      const id = addTab(m.id);
      if (id) lastId = id;
    });
    if (lastId) setActiveTab(lastId);
  }, [filteredMachines, addTab]);

  const toggleMachineSelection = useCallback((machineId: string) => {
    setSelectedMachines((prev) => {
      const next = new Set(prev);
      if (next.has(machineId)) next.delete(machineId);
      else next.add(machineId);
      return next;
    });
  }, []);

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTab === tabId && next.length > 0) {
        setActiveTab(next[next.length - 1].id);
      }
      return next;
    });
  };

  const updateTabLines = useCallback((tabId: string, updater: (lines: TerminalLine[]) => TerminalLine[]) => {
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, lines: updater(t.lines) } : t));
  }, []);

  const setTabExecuting = useCallback((tabId: string, isExecuting: boolean) => {
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, isExecuting } : t));
  }, []);

  const handleExecute = useCallback(async (tabId: string, cmd: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Handle clear locally
    if (cmd.trim().toLowerCase() === "clear") {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, lines: [], history: [...t.history, cmd] } : t
        )
      );
      return;
    }

    // Add input line + pending indicator
    const inputLine: TerminalLine = { type: "input", text: cmd, timestamp: now(), cwd: tab.cwd };
    const pendingLine: TerminalLine = { type: "pending", text: "Enviando comando via SSH...", timestamp: now() };

    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? { ...t, lines: [...t.lines, inputLine, pendingLine], history: [...t.history, cmd], isExecuting: true }
          : t
      )
    );

    // Build the actual command: prepend cd to cwd if not home
    const actualCommand = tab.cwd === "~"
      ? cmd
      : `cd ${tab.cwd} && ${cmd}`;

    try {
      // 1. Execute command via API
      const { job_id } = await apiExecute({
        server: tab.machine.name,
        user: tab.machine.sshUser,
        command: actualCommand,
      });

      // Update pending line to show job_id
      updateTabLines(tabId, (lines) => {
        const updated = [...lines];
        let pendingIdx = -1;
        for (let i = updated.length - 1; i >= 0; i--) { if (updated[i].type === "pending") { pendingIdx = i; break; } }
        if (pendingIdx >= 0) {
          updated[pendingIdx] = { type: "system", text: `Job ${job_id} criado. Aguardando resultado...`, timestamp: now() };
        }
        return updated;
      });

      // 2. Poll for result
      const result = await pollJobStatus(job_id, (status) => {
        updateTabLines(tabId, (lines) => {
          const updated = [...lines];
          let lastSys = -1;
          for (let i = updated.length - 1; i >= 0; i--) { if (updated[i].type === "system" && updated[i].text.includes(job_id)) { lastSys = i; break; } }
          if (lastSys >= 0) {
            updated[lastSys] = { type: "system", text: `Job ${job_id} — status: ${status.status}`, timestamp: now() };
          }
          return updated;
        });
      });

      // 3. Show result
      if (result.status === "completed" || result.status === "finished") {
        const decoded = (result.output || "(sem output)")
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\\\/g, "\\");
        updateTabLines(tabId, (lines) => [
          ...lines,
          { type: "output", text: decoded, timestamp: now() },
        ]);

        // Update cwd if command was a cd
        const cdMatch = cmd.trim().match(/^cd\s+(.+)/);
        if (cdMatch) {
          const target = cdMatch[1].trim().replace(/\/+$/, "");
          setTabs((prev) => prev.map((t) => {
            if (t.id !== tabId) return t;
            let newCwd: string;
            if (target === "~" || target === "") {
              newCwd = "~";
            } else if (target === "..") {
              if (t.cwd === "~" || t.cwd === "/") newCwd = t.cwd;
              else {
                const parts = t.cwd.split("/");
                parts.pop();
                newCwd = parts.join("/") || "/";
              }
            } else if (target.startsWith("/")) {
              newCwd = target;
            } else if (t.cwd === "~") {
              newCwd = `~/${target}`;
            } else {
              newCwd = `${t.cwd}/${target}`;
            }
            return { ...t, cwd: newCwd };
          }));
        }
      } else {
        const errorOutput = (result.output || result.error || `Job ${job_id} falhou`)
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "\r")
          .replace(/\\\\/g, "\\");
        updateTabLines(tabId, (lines) => [
          ...lines,
          { type: "error", text: errorOutput, timestamp: now() },
        ]);
      }
    } catch (err: any) {
      updateTabLines(tabId, (lines) => {
        // Remove pending line if still there
        const filtered = lines.filter((l) => l.type !== "pending");
        return [
          ...filtered,
          { type: "error", text: `Erro: ${err.message || "Falha na comunicação com o agente"}`, timestamp: now() },
        ];
      });
    } finally {
      setTabExecuting(tabId, false);
    }
  }, [tabs, updateTabLines, setTabExecuting]);

  const toggleBroadcastTarget = useCallback((tabId: string) => {
    setBroadcastTargets((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const selectAllBroadcast = useCallback(() => {
    setBroadcastTargets(new Set(tabs.map((t) => t.id)));
  }, [tabs]);

  const handleBroadcast = useCallback(() => {
    if (!broadcastCmd.trim() || broadcastTargets.size === 0) return;
    const cmd = broadcastCmd.trim();
    broadcastTargets.forEach((tabId) => {
      handleExecute(tabId, cmd);
    });
    setBroadcastCmd("");
  }, [broadcastCmd, broadcastTargets, handleExecute]);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Heimdall CLI</h1>
            <p className="text-sm text-muted-foreground">
              Terminal remoto para interação com máquinas registradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Environment selector */}
          <Select value={selectedEnv} onValueChange={(v) => {
            const env = v as Environment;
            setSelectedEnv(env);
            setSelectedCluster("all");
            setSelectedMachines(new Set());
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ambiente" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ENV_LABELS) as Environment[]).map((env) => (
                <SelectItem key={env} value={env}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: ENV_COLORS[env] }}
                    />
                    <span>{ENV_LABELS[env]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cluster selector */}
          <Select value={selectedCluster} onValueChange={(v) => {
            setSelectedCluster(v);
            setSelectedMachines(new Set());
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clusters</SelectItem>
              {filteredClusters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Machine combobox */}
          <Popover open={machinePopoverOpen} onOpenChange={setMachinePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-between font-normal">
                {selectedMachines.size === 0
                  ? "Selecionar máquinas..."
                  : `${selectedMachines.size} máquina(s) selecionada(s)`}
                <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-2" align="end">
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {(selectedCluster === "all" ? filteredClusters : filteredClusters.filter(c => c.id === selectedCluster)).map((cluster) => {
                  const clusterMachines = filteredMachines.filter(m => m.clusterId === cluster.id);
                  if (clusterMachines.length === 0) return null;
                  return (
                    <div key={cluster.id}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {cluster.name}
                      </div>
                      {clusterMachines.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => toggleMachineSelection(m.id)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors",
                            selectedMachines.has(m.id) && "bg-accent"
                          )}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedMachines.has(m.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                            {selectedMachines.has(m.id) && <Check className="h-3 w-3" />}
                          </div>
                          <Circle
                            className={cn(
                              "h-2 w-2 fill-current",
                              m.status === "online" ? "text-[hsl(120,60%,50%)]" : "text-destructive"
                            )}
                          />
                          <Server className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{m.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">({m.host})</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border mt-2 pt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedMachines(new Set(filteredMachines.map((m) => m.id)))}
                >
                  Selecionar todas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedMachines(new Set())}
                >
                  Limpar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={connectSelected} size="sm" className="gap-1.5" disabled={selectedMachines.size === 0}>
            <Plus className="h-4 w-4" />
            Conectar ({selectedMachines.size})
          </Button>
          <Button onClick={connectAll} size="sm" variant="outline" className="gap-1.5">
            <Link className="h-4 w-4" />
            Conectar todas
          </Button>
          {tabs.length > 0 && (
            <Button
              onClick={() => { setTabs([]); setActiveTab(""); }}
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Desconectar todas
            </Button>
          )}
          {tabs.length >= 2 && (
            <Button
              onClick={() => setShowBroadcast((v) => !v)}
              size="sm"
              variant={showBroadcast ? "default" : "outline"}
              className="gap-1.5"
            >
              <Radio className="h-4 w-4" />
              Broadcast
            </Button>
          )}
        </div>
      </div>

      {/* broadcast bar */}
      {showBroadcast && tabs.length >= 2 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Radio className="h-4 w-4 text-primary" />
            Broadcast — enviar comando para múltiplas sessões
          </div>

          <div className="flex flex-wrap gap-3">
            {tabs.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors",
                  broadcastTargets.has(t.id)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                )}
              >
                <Checkbox
                  checked={broadcastTargets.has(t.id)}
                  onCheckedChange={() => toggleBroadcastTarget(t.id)}
                />
                <Circle
                  className={cn(
                    "h-2 w-2 fill-current",
                    t.machine.status === "online" ? "text-[hsl(120,60%,50%)]" : "text-destructive"
                  )}
                />
                <span>{t.machine.name}</span>
                {t.isExecuting && <Loader2 className="h-3 w-3 animate-spin text-[hsl(45,90%,55%)]" />}
              </label>
            ))}
            <Button variant="ghost" size="sm" onClick={selectAllBroadcast} className="text-xs">
              Selecionar todas
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={broadcastCmd}
              onChange={(e) => setBroadcastCmd(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleBroadcast(); }}
              placeholder="Comando para enviar a todas as sessões selecionadas..."
              className="font-mono text-sm"
            />
            <Button
              onClick={handleBroadcast}
              size="sm"
              disabled={!broadcastCmd.trim() || broadcastTargets.size === 0}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              Enviar ({broadcastTargets.size})
            </Button>
          </div>
        </div>
      )}

      {/* tabs area */}
      {tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
          <Terminal className="h-16 w-16 opacity-30" />
          <p className="text-lg">Nenhuma sessão aberta</p>
          <p className="text-sm">
            Selecione uma máquina e clique em{" "}
            <span className="font-medium text-primary">"Nova sessão"</span> para
            iniciar.
          </p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 h-auto flex-wrap gap-1 p-1">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="gap-2 pr-1 data-[state=active]:bg-background"
              >
                <Circle
                  className={cn(
                    "h-2 w-2 fill-current",
                    t.machine.status === "online"
                      ? "text-[hsl(120,60%,50%)]"
                      : "text-destructive"
                  )}
                />
                <span className="text-xs">{t.machine.name}</span>
                {t.isExecuting && <Loader2 className="h-3 w-3 animate-spin text-[hsl(45,90%,55%)]" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-2">
              <TerminalView tab={t} onExecute={handleExecute} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
