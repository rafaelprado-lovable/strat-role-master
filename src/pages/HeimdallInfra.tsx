import { useState } from "react";
import {
  Server,
  Network,
  Monitor,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ---------- types ----------
interface Environment {
  id: string;
  name: string;
  color: string;
}

interface Cluster {
  id: string;
  name: string;
  environmentId: string;
}

interface Machine {
  id: string;
  name: string;
  host: string;
  sshUser: string;
  status: "online" | "offline";
  clusterId: string;
  environmentId: string;
}

// ---------- initial mock data ----------
const INITIAL_ENVIRONMENTS: Environment[] = [
  { id: "env-1", name: "Produção", color: "hsl(0 70% 50%)" },
  { id: "env-2", name: "Homologação", color: "hsl(45 90% 45%)" },
  { id: "env-3", name: "Desenvolvimento", color: "hsl(210 70% 50%)" },
];

const INITIAL_CLUSTERS: Cluster[] = [
  { id: "c1", name: "cluster-a", environmentId: "env-1" },
  { id: "c2", name: "cluster-b", environmentId: "env-1" },
  { id: "c3", name: "cluster-stg", environmentId: "env-2" },
  { id: "c4", name: "cluster-dev", environmentId: "env-3" },
];

const INITIAL_MACHINES: Machine[] = [
  { id: "m1", name: "prod-app-01", host: "10.0.1.10", sshUser: "nmws_app", status: "online", clusterId: "c1", environmentId: "env-1" },
  { id: "m2", name: "prod-db-01", host: "10.0.1.20", sshUser: "nmws_app", status: "online", clusterId: "c1", environmentId: "env-1" },
  { id: "m3", name: "prod-worker-01", host: "10.0.1.30", sshUser: "nmws_app", status: "online", clusterId: "c2", environmentId: "env-1" },
  { id: "m4", name: "stg-app-01", host: "10.0.2.10", sshUser: "nmws_app", status: "online", clusterId: "c3", environmentId: "env-2" },
  { id: "m5", name: "stg-db-01", host: "10.0.2.20", sshUser: "nmws_app", status: "online", clusterId: "c3", environmentId: "env-2" },
  { id: "m6", name: "dev-app-01", host: "10.0.3.5", sshUser: "nmws_app", status: "online", clusterId: "c4", environmentId: "env-3" },
  { id: "m7", name: "dev-worker-01", host: "10.0.3.6", sshUser: "nmws_app", status: "offline", clusterId: "c4", environmentId: "env-3" },
];

type ActiveTab = "environments" | "clusters" | "machines";

let counter = 100;
const uid = () => `gen-${++counter}`;

export default function HeimdallInfra() {
  const [environments, setEnvironments] = useState<Environment[]>(INITIAL_ENVIRONMENTS);
  const [clusters, setClusters] = useState<Cluster[]>(INITIAL_CLUSTERS);
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);

  const [activeTab, setActiveTab] = useState<ActiveTab>("environments");
  const [search, setSearch] = useState("");

  // ---- Environment dialog ----
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [envForm, setEnvForm] = useState({ name: "", color: "hsl(210 70% 50%)" });

  // ---- Cluster dialog ----
  const [clusterDialogOpen, setClusterDialogOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [clusterForm, setClusterForm] = useState({ name: "", environmentId: "" });

  // ---- Machine dialog ----
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineForm, setMachineForm] = useState({ name: "", host: "", sshUser: "nmws_app", status: "online" as "online" | "offline", clusterId: "", environmentId: "" });

  // ---- Delete dialog ----
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ActiveTab; id: string; name: string } | null>(null);

  // ---- Tree state ----
  const [expandedEnvs, setExpandedEnvs] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const toggleExpand = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  // ---- Helpers ----
  const getEnvName = (id: string) => environments.find((e) => e.id === id)?.name ?? "—";
  const getEnvColor = (id: string) => environments.find((e) => e.id === id)?.color ?? "hsl(0 0% 50%)";
  const getClusterName = (id: string) => clusters.find((c) => c.id === id)?.name ?? "—";
  const countClusters = (envId: string) => clusters.filter((c) => c.environmentId === envId).length;
  const countMachines = (clusterId: string) => machines.filter((m) => m.clusterId === clusterId).length;
  const countMachinesEnv = (envId: string) => machines.filter((m) => m.environmentId === envId).length;

  // ---- CRUD: Environments ----
  const openEnvDialog = (env?: Environment) => {
    if (env) {
      setEditingEnv(env);
      setEnvForm({ name: env.name, color: env.color });
    } else {
      setEditingEnv(null);
      setEnvForm({ name: "", color: "hsl(210 70% 50%)" });
    }
    setEnvDialogOpen(true);
  };

  const saveEnv = () => {
    if (!envForm.name.trim()) return;
    if (editingEnv) {
      setEnvironments((prev) => prev.map((e) => (e.id === editingEnv.id ? { ...e, ...envForm } : e)));
      toast.success("Ambiente atualizado");
    } else {
      setEnvironments((prev) => [...prev, { id: uid(), ...envForm }]);
      toast.success("Ambiente criado");
    }
    setEnvDialogOpen(false);
  };

  // ---- CRUD: Clusters ----
  const openClusterDialog = (cluster?: Cluster) => {
    if (cluster) {
      setEditingCluster(cluster);
      setClusterForm({ name: cluster.name, environmentId: cluster.environmentId });
    } else {
      setEditingCluster(null);
      setClusterForm({ name: "", environmentId: environments[0]?.id ?? "" });
    }
    setClusterDialogOpen(true);
  };

  const saveCluster = () => {
    if (!clusterForm.name.trim() || !clusterForm.environmentId) return;
    if (editingCluster) {
      setClusters((prev) => prev.map((c) => (c.id === editingCluster.id ? { ...c, ...clusterForm } : c)));
      toast.success("Cluster atualizado");
    } else {
      setClusters((prev) => [...prev, { id: uid(), ...clusterForm }]);
      toast.success("Cluster criado");
    }
    setClusterDialogOpen(false);
  };

  // ---- CRUD: Machines ----
  const openMachineDialog = (machine?: Machine) => {
    if (machine) {
      setEditingMachine(machine);
      setMachineForm({ name: machine.name, host: machine.host, sshUser: machine.sshUser, status: machine.status, clusterId: machine.clusterId, environmentId: machine.environmentId });
    } else {
      setEditingMachine(null);
      setMachineForm({ name: "", host: "", sshUser: "nmws_app", status: "online", clusterId: clusters[0]?.id ?? "", environmentId: environments[0]?.id ?? "" });
    }
    setMachineDialogOpen(true);
  };

  const saveMachine = () => {
    if (!machineForm.name.trim() || !machineForm.host.trim() || !machineForm.clusterId || !machineForm.environmentId) return;
    if (editingMachine) {
      setMachines((prev) => prev.map((m) => (m.id === editingMachine.id ? { ...m, ...machineForm } : m)));
      toast.success("Máquina atualizada");
    } else {
      setMachines((prev) => [...prev, { id: uid(), ...machineForm }]);
      toast.success("Máquina criada");
    }
    setMachineDialogOpen(false);
  };

  // ---- Delete ----
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === "environments") {
      setEnvironments((prev) => prev.filter((e) => e.id !== id));
      setClusters((prev) => prev.filter((c) => c.environmentId !== id));
      setMachines((prev) => prev.filter((m) => m.environmentId !== id));
    } else if (type === "clusters") {
      setClusters((prev) => prev.filter((c) => c.id !== id));
      setMachines((prev) => prev.filter((m) => m.clusterId !== id));
    } else {
      setMachines((prev) => prev.filter((m) => m.id !== id));
    }
    toast.success("Removido com sucesso");
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const askDelete = (type: ActiveTab, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  // ---- Filtered data based on active tab ----
  const q = search.toLowerCase();

  const filteredEnvs = environments.filter((e) => e.name.toLowerCase().includes(q));
  const filteredClusters = clusters.filter(
    (c) => c.name.toLowerCase().includes(q) || getEnvName(c.environmentId).toLowerCase().includes(q)
  );
  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.host.toLowerCase().includes(q) ||
      getClusterName(m.clusterId).toLowerCase().includes(q) ||
      getEnvName(m.environmentId).toLowerCase().includes(q)
  );

  const clustersForEnv = (envId: string) => filteredClusters.filter((c) => c.environmentId === envId);

  const tabs: { key: ActiveTab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "environments", label: "Ambientes", icon: Network, count: environments.length },
    { key: "clusters", label: "Clusters", icon: Server, count: clusters.length },
    { key: "machines", label: "Máquinas", icon: Monitor, count: machines.length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Infraestrutura Heimdall</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de ambientes, clusters e máquinas
          </p>
        </div>
      </div>

      {/* Tabs + Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {t.count}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              if (activeTab === "environments") openEnvDialog();
              else if (activeTab === "clusters") openClusterDialog();
              else openMachineDialog();
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* ==================== ENVIRONMENTS TAB ==================== */}
      {activeTab === "environments" && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="text-center">Clusters</TableHead>
                <TableHead className="text-center">Máquinas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnvs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum ambiente encontrado
                  </TableCell>
                </TableRow>
              )}
              {filteredEnvs.map((env) => (
                <TableRow key={env.id}>
                  <TableCell className="font-medium">{env.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full inline-block" style={{ background: env.color }} />
                      <span className="text-xs text-muted-foreground font-mono">{env.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{countClusters(env.id)}</TableCell>
                  <TableCell className="text-center">{countMachinesEnv(env.id)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEnvDialog(env)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => askDelete("environments", env.id, env.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ==================== CLUSTERS TAB ==================== */}
      {activeTab === "clusters" && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead className="text-center">Máquinas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClusters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum cluster encontrado
                  </TableCell>
                </TableRow>
              )}
              {filteredClusters.map((cl) => (
                <TableRow key={cl.id}>
                  <TableCell className="font-medium">{cl.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ background: getEnvColor(cl.environmentId) }} />
                      {getEnvName(cl.environmentId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{countMachines(cl.id)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openClusterDialog(cl)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => askDelete("clusters", cl.id, cl.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ==================== MACHINES TAB ==================== */}
      {activeTab === "machines" && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Usuário SSH</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma máquina encontrada
                  </TableCell>
                </TableRow>
              )}
              {filteredMachines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs">{m.host}</TableCell>
                  <TableCell className="font-mono text-xs">{m.sshUser}</TableCell>
                  <TableCell>{getClusterName(m.clusterId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ background: getEnvColor(m.environmentId) }} />
                      {getEnvName(m.environmentId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={m.status === "online" ? "default" : "destructive"}>
                      {m.status === "online" ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openMachineDialog(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => askDelete("machines", m.id, m.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ==================== TREE VIEW ==================== */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Visão em Árvore</h2>
        <div className="space-y-1">
          {environments.map((env) => (
            <div key={env.id}>
              <button
                onClick={() => toggleExpand(expandedEnvs, env.id, setExpandedEnvs)}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm"
              >
                {expandedEnvs.has(env.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="h-3 w-3 rounded-full" style={{ background: env.color }} />
                <span className="font-medium">{env.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{countClusters(env.id)} clusters · {countMachinesEnv(env.id)} máquinas</span>
              </button>

              {expandedEnvs.has(env.id) && (
                <div className="ml-6 space-y-0.5">
                  {clustersForEnv(env.id).length === 0 && (
                    <p className="text-xs text-muted-foreground pl-6 py-1">Nenhum cluster</p>
                  )}
                  {clusters
                    .filter((c) => c.environmentId === env.id)
                    .map((cl) => (
                      <div key={cl.id}>
                        <button
                          onClick={() => toggleExpand(expandedClusters, cl.id, setExpandedClusters)}
                          className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors text-sm"
                        >
                          {expandedClusters.has(cl.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <Server className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{cl.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{countMachines(cl.id)} máquinas</span>
                        </button>

                        {expandedClusters.has(cl.id) && (
                          <div className="ml-8 space-y-0.5">
                            {machines
                              .filter((m) => m.clusterId === cl.id)
                              .map((m) => (
                                <div key={m.id} className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                                  <Monitor className="h-3.5 w-3.5" />
                                  <span>{m.name}</span>
                                  <span className="font-mono text-xs">{m.host}</span>
                                  <Badge variant={m.status === "online" ? "default" : "destructive"} className="ml-auto text-[10px] px-1.5 py-0">
                                    {m.status}
                                  </Badge>
                                </div>
                              ))}
                            {machines.filter((m) => m.clusterId === cl.id).length === 0 && (
                              <p className="text-xs text-muted-foreground pl-6 py-1">Nenhuma máquina</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== DIALOGS ==================== */}

      {/* Environment Dialog */}
      <Dialog open={envDialogOpen} onOpenChange={setEnvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEnv ? "Editar Ambiente" : "Novo Ambiente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={envForm.name} onChange={(e) => setEnvForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Produção" />
            </div>
            <div className="space-y-2">
              <Label>Cor (HSL)</Label>
              <div className="flex items-center gap-2">
                <Input value={envForm.color} onChange={(e) => setEnvForm((f) => ({ ...f, color: e.target.value }))} placeholder="hsl(210 70% 50%)" />
                <span className="h-8 w-8 rounded-md border" style={{ background: envForm.color }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnvDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEnv}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cluster Dialog */}
      <Dialog open={clusterDialogOpen} onOpenChange={setClusterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCluster ? "Editar Cluster" : "Novo Cluster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={clusterForm.name} onChange={(e) => setClusterForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: cluster-a" />
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={clusterForm.environmentId} onValueChange={(v) => setClusterForm((f) => ({ ...f, environmentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {environments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                        {e.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClusterDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveCluster}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Machine Dialog */}
      <Dialog open={machineDialogOpen} onOpenChange={setMachineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMachine ? "Editar Máquina" : "Nova Máquina"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={machineForm.name} onChange={(e) => setMachineForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: prod-app-01" />
              </div>
              <div className="space-y-2">
                <Label>Host / IP</Label>
                <Input value={machineForm.host} onChange={(e) => setMachineForm((f) => ({ ...f, host: e.target.value }))} placeholder="10.0.1.10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usuário SSH</Label>
                <Input value={machineForm.sshUser} onChange={(e) => setMachineForm((f) => ({ ...f, sshUser: e.target.value }))} placeholder="nmws_app" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={machineForm.status} onValueChange={(v) => setMachineForm((f) => ({ ...f, status: v as "online" | "offline" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select value={machineForm.environmentId} onValueChange={(v) => setMachineForm((f) => ({ ...f, environmentId: v, clusterId: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {environments.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                          {e.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cluster</Label>
                <Select value={machineForm.clusterId} onValueChange={(v) => setMachineForm((f) => ({ ...f, clusterId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clusters
                      .filter((c) => !machineForm.environmentId || c.environmentId === machineForm.environmentId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMachineDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMachine}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
            {deleteTarget?.type === "environments" && " Todos os clusters e máquinas associados também serão removidos."}
            {deleteTarget?.type === "clusters" && " Todas as máquinas associadas também serão removidas."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
