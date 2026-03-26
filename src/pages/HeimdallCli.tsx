import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Terminal, Server, Plus, X, Circle, Wifi, WifiOff } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ---------- mock data ----------
type Environment = "production" | "staging" | "development";

const ENV_LABELS: Record<Environment, string> = {
  production: "Produção",
  staging: "Homologação",
  development: "Desenvolvimento",
};

const ENV_COLORS: Record<Environment, string> = {
  production: "hsl(0,70%,50%)",
  staging: "hsl(45,90%,45%)",
  development: "hsl(210,70%,50%)",
};

interface Machine {
  id: string;
  name: string;
  host: string;
  status: "online" | "offline";
  environment: Environment;
}

const MOCK_MACHINES: Machine[] = [
  { id: "m1", name: "prod-app-01", host: "10.0.1.10", status: "online", environment: "production" },
  { id: "m2", name: "prod-db-01", host: "10.0.1.20", status: "online", environment: "production" },
  { id: "m3", name: "prod-worker-01", host: "10.0.1.30", status: "online", environment: "production" },
  { id: "m4", name: "stg-app-01", host: "10.0.2.10", status: "online", environment: "staging" },
  { id: "m5", name: "stg-db-01", host: "10.0.2.20", status: "online", environment: "staging" },
  { id: "m6", name: "dev-app-01", host: "10.0.3.5", status: "online", environment: "development" },
  { id: "m7", name: "dev-worker-01", host: "10.0.3.6", status: "offline", environment: "development" },
];

const MOCK_RESPONSES: Record<string, string> = {
  help: `Available commands:
  ls        - list directory contents
  pwd       - print working directory
  whoami    - display current user
  uptime    - show system uptime
  df -h     - disk usage
  free -m   - memory usage
  ps aux    - running processes
  cat       - display file contents
  clear     - clear terminal
  help      - show this help`,
  ls: "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var",
  pwd: "/home/nmws_app",
  whoami: "nmws_app",
  uptime: " 14:32:07 up 42 days,  3:15,  1 user,  load average: 0.08, 0.03, 0.01",
  "df -h": `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   18G   30G  38% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
/dev/sdb1       200G   95G   96G  50% /data`,
  "free -m": `              total        used        free      shared  buff/cache   available
Mem:           7982        2134        3521          42        2326        5512
Swap:          2047           0        2047`,
  "ps aux": `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169364 11200 ?        Ss   Mar14   0:08 /sbin/init
nmws_app  1234  0.1  0.5 456780 42100 ?        Sl   Mar14   2:30 /opt/app/server
nmws_app  1235  0.0  0.2 234560 18200 ?        S    Mar14   0:45 /opt/app/worker`,
};

// ---------- types ----------
interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  text: string;
  timestamp: string;
}

interface TerminalTab {
  id: string;
  machine: Machine;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
}

function now() {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}

function simulateCommand(cmd: string, machine: Machine): TerminalLine[] {
  const trimmed = cmd.trim().toLowerCase();

  if (trimmed === "clear") return [];

  if (machine.status === "offline") {
    return [{ type: "error", text: `ssh: connect to host ${machine.host} port 22: Connection refused`, timestamp: now() }];
  }

  const response = MOCK_RESPONSES[trimmed];
  if (response) {
    return [{ type: "output", text: response, timestamp: now() }];
  }

  if (trimmed.startsWith("cat ")) {
    return [{ type: "error", text: `cat: ${trimmed.slice(4)}: No such file or directory`, timestamp: now() }];
  }

  if (trimmed.startsWith("echo ")) {
    return [{ type: "output", text: trimmed.slice(5), timestamp: now() }];
  }

  return [{ type: "error", text: `bash: ${trimmed.split(" ")[0]}: command not found`, timestamp: now() }];
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
          {tab.machine.name} — {tab.machine.host}
        </span>
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
                <span className="text-[hsl(120,60%,50%)]">nmws_app@{tab.machine.name}</span>
                <span className="text-muted-foreground">:</span>
                <span className="text-[hsl(210,80%,65%)]">~</span>
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
          </div>
        ))}

        {/* prompt line */}
        <div className="flex items-center leading-6">
          <span className="text-[hsl(120,60%,50%)]">nmws_app@{tab.machine.name}</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-[hsl(210,80%,65%)]">~</span>
          <span className="text-muted-foreground">$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-[hsl(0,0%,90%)] outline-none caret-[hsl(120,60%,50%)] ml-0.5"
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
  const [selectedMachine, setSelectedMachine] = useState<string>(MOCK_MACHINES[0].id);

  const filteredMachines = MOCK_MACHINES.filter((m) => m.environment === selectedEnv);

  const addTab = useCallback(() => {
    const machine = MOCK_MACHINES.find((m) => m.id === selectedMachine);
    if (!machine) return;

    const id = `tab-${Date.now()}`;
    const welcomeLine: TerminalLine = {
      type: "system",
      text: `Conectado a ${machine.name} (${machine.host}). Digite "help" para ver os comandos disponíveis.`,
      timestamp: now(),
    };

    setTabs((prev) => [
      ...prev,
      { id, machine, lines: [welcomeLine], history: [], historyIndex: -1 },
    ]);
    setActiveTab(id);
  }, [selectedMachine]);

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTab === tabId && next.length > 0) {
        setActiveTab(next[next.length - 1].id);
      }
      return next;
    });
  };

  const executeCommand = useCallback((tabId: string, cmd: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId) return t;

        const inputLine: TerminalLine = { type: "input", text: cmd, timestamp: now() };

        if (cmd.trim().toLowerCase() === "clear") {
          return { ...t, lines: [], history: [...t.history, cmd] };
        }

        const outputLines = simulateCommand(cmd, t.machine);
        return {
          ...t,
          lines: [...t.lines, inputLine, ...outputLines],
          history: [...t.history, cmd],
        };
      })
    );
  }, []);

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
            const first = MOCK_MACHINES.find((m) => m.environment === env);
            if (first) setSelectedMachine(first.id);
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

          {/* Machine selector */}
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Selecionar máquina" />
            </SelectTrigger>
            <SelectContent>
              {filteredMachines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <Circle
                      className={cn(
                        "h-2 w-2 fill-current",
                        m.status === "online"
                          ? "text-[hsl(120,60%,50%)]"
                          : "text-destructive"
                      )}
                    />
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{m.name}</span>
                    <span className="text-muted-foreground text-xs">({m.host})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addTab} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova sessão
          </Button>
        </div>
      </div>

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
              <TerminalView tab={t} onExecute={executeCommand} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
