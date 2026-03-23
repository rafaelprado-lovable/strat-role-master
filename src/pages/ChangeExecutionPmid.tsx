import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Heart,
  AlertTriangle,
  Clock,
  Server,
  GitBranch,
  ExternalLink,
  RefreshCw,
  Activity,
  Cpu,
  MemoryStick,
  ArrowUpCircle,
  Circle,
  Rocket,
  Package,
  Terminal,
  Undo2,
  History,
  GitMerge,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResourceTree, { type TreeNode } from "@/components/pmid/ResourceTree";

type DeployStatus = "Pending" | "Deploying" | "Deployed" | "Failed" | "RollingBack" | "RolledBack";
type HealthStatus = "Healthy" | "Degraded" | "Progressing" | "Suspended" | "Missing" | "Unknown";

interface ServiceResource {
  kind: string;
  name: string;
  namespace: string;
  health: HealthStatus;
  version: string;
  targetVersion: string;
  replicas?: { desired: number; ready: number; available: number };
  cpu?: string;
  memory?: string;
  restarts?: number;
  lastTransition?: string;
  message?: string;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

interface DeployHistoryEntry {
  id: string;
  version: string;
  previousVersion: string;
  status: "success" | "failed" | "rolled_back";
  startedAt: string;
  finishedAt: string;
  duration: string;
  triggeredBy: string;
}

interface PmidService {
  id: string;
  name: string;
  project: string;
  namespace: string;
  cluster: string;
  repoUrl: string;
  targetVersion: string;
  currentVersion: string;
  previousVersion?: string;
  deployStatus: DeployStatus;
  healthStatus: HealthStatus;
  deployProgress: number;
  deployStartedAt?: string;
  deployFinishedAt?: string;
  resources: ServiceResource[];
}

// --- Mock log templates ---
const deployLogTemplates: Array<{ minProgress: number; level: LogEntry["level"]; msg: (svc: string, ver: string) => string }> = [
  { minProgress: 0, level: "info", msg: (s, v) => `Iniciando deploy de ${s} para versão ${v}` },
  { minProgress: 5, level: "info", msg: (s) => `Pulling image registry.internal/${s}:latest` },
  { minProgress: 10, level: "info", msg: () => "Image pull complete" },
  { minProgress: 15, level: "info", msg: () => "Aplicando ConfigMaps e Secrets atualizados" },
  { minProgress: 20, level: "info", msg: () => "ConfigMaps aplicados com sucesso" },
  { minProgress: 25, level: "info", msg: () => "Iniciando rolling update dos pods" },
  { minProgress: 30, level: "info", msg: () => "Pod 0/N terminando gracefully..." },
  { minProgress: 35, level: "info", msg: () => "Novo pod agendado no node k8s-worker-03" },
  { minProgress: 40, level: "info", msg: () => "Container iniciado, executando health check" },
  { minProgress: 45, level: "info", msg: () => "Health check passed — pod 1 ready" },
  { minProgress: 50, level: "info", msg: () => "Rolling update: 50% dos pods atualizados" },
  { minProgress: 55, level: "info", msg: () => "Pod 2 agendado no node k8s-worker-01" },
  { minProgress: 60, level: "info", msg: () => "Container iniciado, aguardando readiness probe" },
  { minProgress: 65, level: "info", msg: () => "Readiness probe passed — pod 2 ready" },
  { minProgress: 70, level: "info", msg: () => "Rolling update: 75% dos pods atualizados" },
  { minProgress: 75, level: "info", msg: () => "Último batch de pods sendo atualizado" },
  { minProgress: 80, level: "info", msg: () => "Todos os pods atualizados, verificando estabilidade" },
  { minProgress: 85, level: "info", msg: () => "Service endpoints atualizados" },
  { minProgress: 90, level: "info", msg: () => "HPA recalculando métricas de autoscaling" },
  { minProgress: 95, level: "info", msg: () => "Validação final do deploy em andamento" },
  { minProgress: 100, level: "success", msg: (s, v) => `Deploy de ${s} ${v} concluído com sucesso ✓` },
];

const rollbackLogTemplates: Array<{ minProgress: number; level: LogEntry["level"]; msg: (svc: string, ver: string) => string }> = [
  { minProgress: 0, level: "warn", msg: (s, v) => `Iniciando rollback de ${s} para versão ${v}` },
  { minProgress: 15, level: "info", msg: () => "Restaurando manifests da revisão anterior" },
  { minProgress: 30, level: "info", msg: () => "Revertendo Deployment para revision anterior" },
  { minProgress: 45, level: "info", msg: () => "Rolling back pods..." },
  { minProgress: 60, level: "info", msg: () => "Pods antigos terminados, novos pods com versão anterior iniciando" },
  { minProgress: 75, level: "info", msg: () => "Health checks passando na versão anterior" },
  { minProgress: 90, level: "info", msg: () => "Service endpoints reconfigurados" },
  { minProgress: 100, level: "success", msg: (s, v) => `Rollback de ${s} para ${v} concluído ✓` },
];

const failLogSnippets: LogEntry[] = [
  { timestamp: "", level: "error", message: "CrashLoopBackOff detectado no container principal" },
  { timestamp: "", level: "error", message: "Readiness probe falhou após 5 tentativas consecutivas" },
  { timestamp: "", level: "warn", message: "Pod reiniciado 12 vezes — limite de backoff atingido" },
];

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

// --- Mock data ---
const mockServices: PmidService[] = [
  {
    id: "svc-1", name: "pmid-api-gateway", project: "pmid-production", namespace: "pmid-prod", cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/api-gateway.git", targetVersion: "v2.4.1", currentVersion: "v2.3.8",
    deployStatus: "Pending", healthStatus: "Healthy", deployProgress: 0,
    resources: [
      { kind: "Deployment", name: "api-gateway", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", replicas: { desired: 3, ready: 3, available: 3 }, cpu: "250m", memory: "512Mi", restarts: 0, lastTransition: "2026-03-23 08:30:00" },
      { kind: "Service", name: "api-gateway-svc", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
      { kind: "ConfigMap", name: "api-gateway-config", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:25:00" },
      { kind: "HorizontalPodAutoscaler", name: "api-gateway-hpa", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
    ],
  },
  {
    id: "svc-2", name: "pmid-order-service", project: "pmid-production", namespace: "pmid-prod", cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/order-service.git", targetVersion: "v1.13.0", currentVersion: "v1.12.0",
    deployStatus: "Pending", healthStatus: "Healthy", deployProgress: 0,
    resources: [
      { kind: "Deployment", name: "order-service", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "500m", memory: "1Gi", restarts: 0, lastTransition: "2026-03-23 09:15:00" },
      { kind: "Service", name: "order-service-svc", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", lastTransition: "2026-03-23 09:15:00" },
      { kind: "Secret", name: "order-service-secrets", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", lastTransition: "2026-03-23 09:10:00" },
    ],
  },
  {
    id: "svc-3", name: "pmid-notification-worker", project: "pmid-production", namespace: "pmid-prod", cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/notification-worker.git", targetVersion: "v3.1.0", currentVersion: "v3.0.5",
    deployStatus: "Deploying", healthStatus: "Progressing", deployProgress: 45, deployStartedAt: "2026-03-23 10:02:00",
    resources: [
      { kind: "Deployment", name: "notification-worker", namespace: "pmid-prod", health: "Progressing", version: "v3.0.5", targetVersion: "v3.1.0", replicas: { desired: 4, ready: 2, available: 2 }, cpu: "300m", memory: "768Mi", restarts: 1, lastTransition: "2026-03-23 10:02:00", message: "Rolling update: 2 of 4 replicas updated" },
      { kind: "Service", name: "notification-worker-svc", namespace: "pmid-prod", health: "Healthy", version: "v3.0.5", targetVersion: "v3.1.0", lastTransition: "2026-03-23 10:00:00" },
    ],
  },
  {
    id: "svc-4", name: "pmid-auth-service", project: "pmid-production", namespace: "pmid-prod", cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/auth-service.git", targetVersion: "v2.0.4", currentVersion: "v2.0.3",
    deployStatus: "Failed", healthStatus: "Degraded", deployProgress: 30, deployStartedAt: "2026-03-23 07:45:00",
    resources: [
      { kind: "Deployment", name: "auth-service", namespace: "pmid-prod", health: "Degraded", version: "v2.0.3", targetVersion: "v2.0.4", replicas: { desired: 3, ready: 1, available: 1 }, cpu: "400m", memory: "1Gi", restarts: 12, lastTransition: "2026-03-23 07:45:00", message: "CrashLoopBackOff: back-off 5m0s restarting failed container" },
      { kind: "Service", name: "auth-service-svc", namespace: "pmid-prod", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.4", lastTransition: "2026-03-23 07:45:00" },
      { kind: "PersistentVolumeClaim", name: "auth-service-pvc", namespace: "pmid-prod", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.4", lastTransition: "2026-03-23 07:40:00" },
    ],
  },
  {
    id: "svc-5", name: "pmid-billing-processor", project: "pmid-production", namespace: "pmid-prod", cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/billing-processor.git", targetVersion: "v1.8.3", currentVersion: "v1.8.2",
    deployStatus: "Deployed", healthStatus: "Healthy", deployProgress: 100, deployStartedAt: "2026-03-23 06:00:00", deployFinishedAt: "2026-03-23 06:04:30",
    resources: [
      { kind: "Deployment", name: "billing-processor", namespace: "pmid-prod", health: "Healthy", version: "v1.8.3", targetVersion: "v1.8.3", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "200m", memory: "256Mi", restarts: 0, lastTransition: "2026-03-23 06:04:30" },
      { kind: "CronJob", name: "billing-reconciliation", namespace: "pmid-prod", health: "Healthy", version: "v1.8.3", targetVersion: "v1.8.3", lastTransition: "2026-03-23 06:04:30" },
    ],
  },
];

const mockDeployHistory: Record<string, DeployHistoryEntry[]> = {
  "svc-1": [
    { id: "h1-1", version: "v2.3.8", previousVersion: "v2.3.7", status: "success", startedAt: "2026-03-22 14:30:00", finishedAt: "2026-03-22 14:34:12", duration: "4m 12s", triggeredBy: "carlos.silva" },
    { id: "h1-2", version: "v2.3.7", previousVersion: "v2.3.6", status: "success", startedAt: "2026-03-20 09:15:00", finishedAt: "2026-03-20 09:18:45", duration: "3m 45s", triggeredBy: "ana.santos" },
    { id: "h1-3", version: "v2.3.6", previousVersion: "v2.3.5", status: "failed", startedAt: "2026-03-18 16:00:00", finishedAt: "2026-03-18 16:05:30", duration: "5m 30s", triggeredBy: "marcos.lima" },
    { id: "h1-4", version: "v2.3.5", previousVersion: "v2.3.4", status: "success", startedAt: "2026-03-15 11:00:00", finishedAt: "2026-03-15 11:03:20", duration: "3m 20s", triggeredBy: "carlos.silva" },
    { id: "h1-5", version: "v2.3.4", previousVersion: "v2.3.3", status: "rolled_back", startedAt: "2026-03-12 08:45:00", finishedAt: "2026-03-12 08:52:10", duration: "7m 10s", triggeredBy: "julia.ferreira" },
  ],
  "svc-2": [
    { id: "h2-1", version: "v1.12.0", previousVersion: "v1.11.9", status: "success", startedAt: "2026-03-21 10:00:00", finishedAt: "2026-03-21 10:03:55", duration: "3m 55s", triggeredBy: "ana.santos" },
    { id: "h2-2", version: "v1.11.9", previousVersion: "v1.11.8", status: "success", startedAt: "2026-03-19 15:30:00", finishedAt: "2026-03-19 15:33:10", duration: "3m 10s", triggeredBy: "carlos.silva" },
    { id: "h2-3", version: "v1.11.8", previousVersion: "v1.11.7", status: "failed", startedAt: "2026-03-17 12:00:00", finishedAt: "2026-03-17 12:06:40", duration: "6m 40s", triggeredBy: "marcos.lima" },
  ],
  "svc-3": [
    { id: "h3-1", version: "v3.0.5", previousVersion: "v3.0.4", status: "success", startedAt: "2026-03-22 08:00:00", finishedAt: "2026-03-22 08:04:30", duration: "4m 30s", triggeredBy: "julia.ferreira" },
    { id: "h3-2", version: "v3.0.4", previousVersion: "v3.0.3", status: "rolled_back", startedAt: "2026-03-20 17:00:00", finishedAt: "2026-03-20 17:08:15", duration: "8m 15s", triggeredBy: "ana.santos" },
  ],
  "svc-4": [
    { id: "h4-1", version: "v2.0.3", previousVersion: "v2.0.2", status: "success", startedAt: "2026-03-21 07:30:00", finishedAt: "2026-03-21 07:33:50", duration: "3m 50s", triggeredBy: "carlos.silva" },
    { id: "h4-2", version: "v2.0.2", previousVersion: "v2.0.1", status: "failed", startedAt: "2026-03-19 09:00:00", finishedAt: "2026-03-19 09:07:20", duration: "7m 20s", triggeredBy: "marcos.lima" },
    { id: "h4-3", version: "v2.0.1", previousVersion: "v2.0.0", status: "success", startedAt: "2026-03-16 14:00:00", finishedAt: "2026-03-16 14:03:00", duration: "3m 00s", triggeredBy: "julia.ferreira" },
    { id: "h4-4", version: "v2.0.0", previousVersion: "v1.9.12", status: "success", startedAt: "2026-03-14 10:00:00", finishedAt: "2026-03-14 10:05:45", duration: "5m 45s", triggeredBy: "ana.santos" },
  ],
  "svc-5": [
    { id: "h5-1", version: "v1.8.2", previousVersion: "v1.8.1", status: "success", startedAt: "2026-03-22 06:00:00", finishedAt: "2026-03-22 06:03:30", duration: "3m 30s", triggeredBy: "carlos.silva" },
    { id: "h5-2", version: "v1.8.1", previousVersion: "v1.8.0", status: "success", startedAt: "2026-03-19 11:00:00", finishedAt: "2026-03-19 11:04:10", duration: "4m 10s", triggeredBy: "marcos.lima" },
  ],
};

// --- Build resource tree from service resources ---
function buildResourceTree(svc: PmidService): TreeNode[] {
  return svc.resources.map((res) => {
    const node: TreeNode = {
      kind: res.kind,
      name: res.name,
      namespace: res.namespace,
      health: res.health,
      syncStatus: res.version === res.targetVersion ? "Synced" : "OutOfSync",
      version: res.version,
      info: res.message,
      children: [],
    };

    if (res.kind === "Deployment" && res.replicas) {
      const rsName = `${res.name}-${(res.version || "").replace(/\./g, "")}`;
      const pods: TreeNode[] = [];
      for (let i = 0; i < res.replicas.desired; i++) {
        const isReady = i < res.replicas.ready;
        pods.push({
          kind: "Pod",
          name: `${res.name}-${rsName.slice(-5)}-${String.fromCharCode(97 + i)}x${Math.floor(Math.random() * 900 + 100)}`,
          namespace: res.namespace,
          health: isReady ? "Healthy" : (res.health === "Degraded" ? "Degraded" : "Progressing"),
          syncStatus: "Synced",
          info: !isReady ? (res.health === "Degraded" ? "CrashLoopBackOff" : "ContainerCreating") : undefined,
        });
      }
      node.children = [{
        kind: "ReplicaSet",
        name: rsName,
        namespace: res.namespace,
        health: res.health,
        syncStatus: res.version === res.targetVersion ? "Synced" : "OutOfSync",
        version: res.version,
        info: `${res.replicas.ready}/${res.replicas.desired} replicas ready`,
        children: pods,
      }];
    }

    if (res.kind === "Service") {
      node.children = [{
        kind: "EndpointSlice",
        name: `${res.name}-endpoint`,
        namespace: res.namespace,
        health: res.health,
        syncStatus: "Synced",
      }];
    }

    return node;
  });
}

// --- Badge helpers ---
const getDeployBadge = (status: DeployStatus) => {
  const config: Record<DeployStatus, { variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode; className?: string }> = {
    Deployed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, className: "bg-green-600 hover:bg-green-600/80" },
    Pending: { variant: "outline", icon: <Clock className="h-3 w-3 mr-1" /> },
    Deploying: { variant: "secondary", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> },
    Failed: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
    RollingBack: { variant: "secondary", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, className: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
    RolledBack: { variant: "outline", icon: <Undo2 className="h-3 w-3 mr-1" />, className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  };
  const c = config[status];
  return (
    <Badge variant={c.variant} className={`text-xs ${c.className || ""}`}>
      {c.icon} {status}
    </Badge>
  );
};

const getHealthBadge = (health: HealthStatus) => {
  const colors: Record<HealthStatus, string> = {
    Healthy: "bg-green-500/15 text-green-500 border-green-500/30",
    Degraded: "bg-destructive/15 text-destructive border-destructive/30",
    Progressing: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    Suspended: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    Missing: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    Unknown: "bg-muted text-muted-foreground border-border",
  };
  const icons: Record<HealthStatus, React.ReactNode> = {
    Healthy: <Heart className="h-3 w-3 mr-1" />,
    Degraded: <XCircle className="h-3 w-3 mr-1" />,
    Progressing: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    Suspended: <Clock className="h-3 w-3 mr-1" />,
    Missing: <AlertTriangle className="h-3 w-3 mr-1" />,
    Unknown: <Circle className="h-3 w-3 mr-1" />,
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[health]}`}>
      {icons[health]} {health}
    </Badge>
  );
};

const logLevelColor: Record<LogEntry["level"], string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
};

// --- Component ---
export default function ChangeExecutionPmid() {
  const [services, setServices] = useState<PmidService[]>(mockServices);
  const [selectedService, setSelectedService] = useState<PmidService | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, LogEntry[]>>(() => {
    // Pre-populate logs for services that already have activity
    const initial: Record<string, LogEntry[]> = {};
    mockServices.forEach((s) => {
      if (s.deployStatus === "Deploying") {
        const logs: LogEntry[] = [];
        deployLogTemplates.filter((t) => t.minProgress <= s.deployProgress).forEach((t) => {
          logs.push({ timestamp: now(), level: t.level, message: t.msg(s.name, s.targetVersion) });
        });
        initial[s.id] = logs;
      } else if (s.deployStatus === "Failed") {
        initial[s.id] = [
          { timestamp: "2026-03-23 07:45:01", level: "info", message: `Iniciando deploy de ${s.name} para versão ${s.targetVersion}` },
          { timestamp: "2026-03-23 07:45:15", level: "info", message: "Pulling image..." },
          { timestamp: "2026-03-23 07:45:30", level: "info", message: "Rolling update iniciado" },
          ...failLogSnippets.map((l) => ({ ...l, timestamp: "2026-03-23 07:46:00" })),
          { timestamp: "2026-03-23 07:47:00", level: "error", message: `Deploy de ${s.name} falhou — rollback manual necessário` },
        ];
      } else if (s.deployStatus === "Deployed") {
        initial[s.id] = [
          { timestamp: s.deployStartedAt || now(), level: "info", message: `Deploy de ${s.name} ${s.targetVersion} iniciado` },
          { timestamp: s.deployFinishedAt || now(), level: "success", message: `Deploy de ${s.name} ${s.targetVersion} concluído com sucesso ✓` },
        ];
      }
    });
    return initial;
  });
  const { toast } = useToast();
  const emittedLogsRef = useRef<Record<string, Set<number>>>({});
  const logScrollRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((serviceId: string, entry: LogEntry) => {
    setServiceLogs((prev) => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), entry],
    }));
  }, []);

  // Simulate deploy progress
  useEffect(() => {
    const activeIds = services.filter((s) => s.deployStatus === "Deploying" || s.deployStatus === "RollingBack").map((s) => s.id);
    if (activeIds.length === 0) return;

    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          if (s.deployStatus === "Deploying") {
            const newProgress = Math.min(s.deployProgress + Math.floor(Math.random() * 8) + 2, 100);
            const finished = newProgress >= 100;
            const readyRatio = newProgress / 100;

            // Emit new log lines
            if (!emittedLogsRef.current[s.id]) emittedLogsRef.current[s.id] = new Set();
            deployLogTemplates.forEach((t, i) => {
              if (t.minProgress <= newProgress && !emittedLogsRef.current[s.id].has(i)) {
                emittedLogsRef.current[s.id].add(i);
                addLog(s.id, { timestamp: now(), level: t.level, message: t.msg(s.name, s.targetVersion) });
              }
            });

            return {
              ...s,
              deployProgress: newProgress,
              deployStatus: finished ? "Deployed" as DeployStatus : s.deployStatus,
              healthStatus: finished ? "Healthy" as HealthStatus : "Progressing" as HealthStatus,
              currentVersion: finished ? s.targetVersion : s.currentVersion,
              deployFinishedAt: finished ? now() : undefined,
              resources: s.resources.map((r) => ({
                ...r,
                health: finished ? "Healthy" as HealthStatus : r.health,
                version: finished ? s.targetVersion : r.version,
                replicas: r.replicas ? {
                  ...r.replicas,
                  ready: finished ? r.replicas.desired : Math.min(Math.round(r.replicas.desired * readyRatio), r.replicas.desired),
                  available: finished ? r.replicas.desired : Math.min(Math.round(r.replicas.desired * readyRatio), r.replicas.desired),
                } : undefined,
                message: finished ? undefined : r.message,
                restarts: finished ? 0 : r.restarts,
              })),
            };
          }

          if (s.deployStatus === "RollingBack") {
            const newProgress = Math.min(s.deployProgress + Math.floor(Math.random() * 12) + 5, 100);
            const finished = newProgress >= 100;

            if (!emittedLogsRef.current[s.id]) emittedLogsRef.current[s.id] = new Set();
            rollbackLogTemplates.forEach((t, i) => {
              const key = 1000 + i;
              if (t.minProgress <= newProgress && !emittedLogsRef.current[s.id].has(key)) {
                emittedLogsRef.current[s.id].add(key);
                addLog(s.id, { timestamp: now(), level: t.level, message: t.msg(s.name, s.previousVersion || s.currentVersion) });
              }
            });

            return {
              ...s,
              deployProgress: newProgress,
              deployStatus: finished ? "RolledBack" as DeployStatus : s.deployStatus,
              healthStatus: finished ? "Healthy" as HealthStatus : "Progressing" as HealthStatus,
              currentVersion: finished ? (s.previousVersion || s.currentVersion) : s.currentVersion,
              deployFinishedAt: finished ? now() : undefined,
              resources: s.resources.map((r) => ({
                ...r,
                health: finished ? "Healthy" as HealthStatus : "Progressing" as HealthStatus,
                version: finished ? (s.previousVersion || s.currentVersion) : r.version,
                replicas: r.replicas ? {
                  ...r.replicas,
                  ready: finished ? r.replicas.desired : Math.max(1, Math.round(r.replicas.desired * (newProgress / 100))),
                  available: finished ? r.replicas.desired : Math.max(1, Math.round(r.replicas.desired * (newProgress / 100))),
                } : undefined,
                message: finished ? undefined : "Rollback in progress...",
                restarts: finished ? 0 : r.restarts,
              })),
            };
          }

          return s;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [services.filter((s) => s.deployStatus === "Deploying" || s.deployStatus === "RollingBack").length, addLog]);

  // Keep selected service in sync
  useEffect(() => {
    if (selectedService) {
      const updated = services.find((s) => s.id === selectedService.id);
      if (updated) setSelectedService(updated);
    }
  }, [services]);

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [serviceLogs, selectedService?.id]);

  const handleDeploy = useCallback((serviceId: string) => {
    emittedLogsRef.current[serviceId] = new Set();
    setServiceLogs((prev) => ({ ...prev, [serviceId]: [] }));
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              deployStatus: "Deploying" as DeployStatus,
              healthStatus: "Progressing" as HealthStatus,
              deployProgress: 0,
              deployStartedAt: now(),
              deployFinishedAt: undefined,
              previousVersion: s.currentVersion,
            }
          : s
      )
    );
    toast({ title: "Deploy iniciado", description: "Aplicação de deploy em andamento..." });
  }, [toast]);

  const handleRollback = useCallback((serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    emittedLogsRef.current[serviceId] = new Set();
    addLog(serviceId, { timestamp: now(), level: "warn", message: "--- ROLLBACK INICIADO ---" });
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              deployStatus: "RollingBack" as DeployStatus,
              healthStatus: "Progressing" as HealthStatus,
              deployProgress: 0,
              deployFinishedAt: undefined,
            }
          : s
      )
    );
    toast({ title: "Rollback iniciado", description: `Revertendo ${svc.name} para ${svc.previousVersion || svc.currentVersion}` });
  }, [services, toast, addLog]);

  const handleDeployAll = useCallback(() => {
    const pending = services.filter((s) => s.deployStatus === "Pending" || s.deployStatus === "Failed");
    if (pending.length === 0) {
      toast({ title: "Nenhum deploy pendente", description: "Todos os serviços já foram implantados." });
      return;
    }
    pending.forEach((s) => handleDeploy(s.id));
  }, [services, handleDeploy, toast]);

  const stats = {
    total: services.length,
    deployed: services.filter((s) => s.deployStatus === "Deployed").length,
    pending: services.filter((s) => s.deployStatus === "Pending").length,
    deploying: services.filter((s) => s.deployStatus === "Deploying").length,
    failed: services.filter((s) => s.deployStatus === "Failed").length,
    rolledBack: services.filter((s) => s.deployStatus === "RolledBack" || s.deployStatus === "RollingBack").length,
  };

  const overallProgress = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + (s.deployStatus === "RollingBack" || s.deployStatus === "RolledBack" ? 0 : s.deployProgress), 0) / services.length)
    : 0;

  const currentLogs = selectedService ? (serviceLogs[selectedService.id] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execução de Change - PMID</h2>
          <p className="text-muted-foreground">Deploy de serviços e monitoramento de saúde</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Atualizando...", description: "Buscando status atualizado" })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleDeployAll}>
            <Rocket className="h-4 w-4 mr-2" />
            Deploy All
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso geral do deploy</span>
            <span className="text-sm font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>{stats.deployed}/{stats.total} implantados</span>
            <span>{stats.deploying} em progresso</span>
            <span>{stats.pending} pendentes</span>
            {stats.failed > 0 && <span className="text-destructive">{stats.failed} com falha</span>}
            {stats.rolledBack > 0 && <span className="text-orange-500">{stats.rolledBack} rollback</span>}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{stats.deployed}</p><p className="text-xs text-muted-foreground">Deployed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{stats.deploying}</p><p className="text-xs text-muted-foreground">Deploying</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.failed}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-500">{stats.rolledBack}</p><p className="text-xs text-muted-foreground">Rollback</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Serviços para Deploy
          </h3>
          <div className="space-y-3">
            {services.map((svc) => (
              <Card
                key={svc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedService?.id === svc.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedService(svc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-sm font-semibold">{svc.name}</CardTitle>
                      <div className="flex gap-1">
                        {getDeployBadge(svc.deployStatus)}
                        {getHealthBadge(svc.healthStatus)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {svc.deployStatus === "Failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                          onClick={(e) => { e.stopPropagation(); handleRollback(svc.id); }}
                        >
                          <Undo2 className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                      {(svc.deployStatus === "Pending" || svc.deployStatus === "Failed") && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDeploy(svc.id); }}>
                          <Rocket className="h-3 w-3 mr-1" />
                          Deploy
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Server className="h-3 w-3" /> {svc.cluster}</span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {svc.currentVersion}
                      {svc.currentVersion !== svc.targetVersion && (
                        <span className="text-primary font-medium"> → {svc.targetVersion}</span>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {svc.deployStatus === "Deployed" ? "Deploy concluído" :
                         svc.deployStatus === "Deploying" ? "Deploying..." :
                         svc.deployStatus === "Failed" ? "Deploy falhou" :
                         svc.deployStatus === "RollingBack" ? "Rollback em andamento..." :
                         svc.deployStatus === "RolledBack" ? "Rollback concluído" :
                         "Aguardando deploy"}
                      </span>
                      <span className="font-medium">{svc.deployProgress}%</span>
                    </div>
                    <Progress
                      value={svc.deployProgress}
                      className={`h-2 ${
                        svc.deployStatus === "Failed" ? "[&>div]:bg-destructive" :
                        svc.deployStatus === "Deployed" ? "[&>div]:bg-green-500" :
                        svc.deployStatus === "RollingBack" ? "[&>div]:bg-orange-500" :
                        svc.deployStatus === "RolledBack" ? "[&>div]:bg-orange-500" : ""
                      }`}
                    />
                  </div>

                  {svc.deployStartedAt && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Início: {svc.deployStartedAt}</span>
                      {svc.deployFinishedAt && (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Fim: {svc.deployFinishedAt}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedService ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedService.name}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedService(null)} title="Fechar">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-1">
                  {getDeployBadge(selectedService.deployStatus)}
                  {getHealthBadge(selectedService.healthStatus)}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Deploy</span>
                    <span className="font-bold">{selectedService.deployProgress}%</span>
                  </div>
                  <Progress value={selectedService.deployProgress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="logs">
                  <TabsList className="w-full">
                    <TabsTrigger value="logs" className="flex-1">
                      <Terminal className="h-3 w-3 mr-1" />
                      Logs
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="flex-1">Recursos</TabsTrigger>
                    <TabsTrigger value="tree" className="flex-1">
                      <GitMerge className="h-3 w-3 mr-1" />
                      Tree
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">
                      <History className="h-3 w-3 mr-1" />
                      Histórico
                    </TabsTrigger>
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  </TabsList>

                  {/* Logs Tab */}
                  <TabsContent value="logs">
                    <div className="mt-3">
                      <div
                        ref={logScrollRef}
                        className="bg-zinc-950 rounded-md p-3 h-[500px] overflow-y-auto font-mono text-xs leading-relaxed"
                      >
                        {currentLogs.length === 0 ? (
                          <p className="text-zinc-500">Nenhum log disponível. Inicie o deploy para ver os logs.</p>
                        ) : (
                          currentLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-zinc-500 shrink-0">{log.timestamp.slice(11)}</span>
                              <span className={`shrink-0 uppercase w-[52px] ${logLevelColor[log.level]}`}>
                                [{log.level}]
                              </span>
                              <span className="text-zinc-200">{log.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                      {selectedService.deployStatus === "Failed" && (
                        <div className="flex gap-2 mt-3">
                          <Button className="flex-1" size="sm" onClick={() => handleDeploy(selectedService.id)}>
                            <Rocket className="h-3 w-3 mr-1" />
                            Retry Deploy
                          </Button>
                          <Button
                            className="flex-1 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(selectedService.id)}
                          >
                            <Undo2 className="h-3 w-3 mr-1" />
                            Rollback
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources">
                    <ScrollArea className="h-[500px] pr-2">
                      <div className="space-y-3 mt-3">
                        {selectedService.resources.map((res, idx) => (
                          <Card key={idx} className="border-border/50">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono">{res.kind}</Badge>
                                  <span className="text-sm font-medium">{res.name}</span>
                                </div>
                                {getHealthBadge(res.health)}
                              </div>
                              <Badge variant="outline" className="text-xs font-mono">
                                {res.version}{res.version !== res.targetVersion && ` → ${res.targetVersion}`}
                              </Badge>
                              {res.replicas && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Replicas</span>
                                    <span>{res.replicas.ready}/{res.replicas.desired} ready</span>
                                  </div>
                                  <Progress value={(res.replicas.ready / res.replicas.desired) * 100} className="h-1.5" />
                                </div>
                              )}
                              {(res.cpu || res.memory) && (
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  {res.cpu && <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {res.cpu}</span>}
                                  {res.memory && <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3" /> {res.memory}</span>}
                                  {res.restarts !== undefined && res.restarts > 0 && (
                                    <span className="flex items-center gap-1 text-destructive"><RefreshCw className="h-3 w-3" /> {res.restarts} restarts</span>
                                  )}
                                </div>
                              )}
                              {res.message && (
                                <p className="text-xs text-destructive bg-destructive/10 rounded p-2 mt-1">{res.message}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history">
                    <ScrollArea className="h-[500px] pr-2">
                      <div className="space-y-3 mt-3">
                        {(mockDeployHistory[selectedService.id] || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">Nenhum histórico disponível</p>
                        ) : (
                          (mockDeployHistory[selectedService.id] || []).map((entry) => (
                            <Card key={entry.id} className="border-border/50">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-semibold">{entry.version}</span>
                                    <Badge
                                      variant={entry.status === "success" ? "default" : entry.status === "failed" ? "destructive" : "outline"}
                                      className={`text-xs ${
                                        entry.status === "success" ? "bg-green-600 hover:bg-green-600/80" :
                                        entry.status === "rolled_back" ? "bg-orange-500/15 text-orange-600 border-orange-500/30" : ""
                                      }`}
                                    >
                                      {entry.status === "success" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                      {entry.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                                      {entry.status === "rolled_back" && <Undo2 className="h-3 w-3 mr-1" />}
                                      {entry.status === "success" ? "Sucesso" : entry.status === "failed" ? "Falhou" : "Rollback"}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{entry.duration}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <GitBranch className="h-3 w-3" />
                                  <span className="font-mono">{entry.previousVersion} → {entry.version}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {entry.startedAt}
                                  </span>
                                  <span>por {entry.triggeredBy}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Info Tab */}
                  <TabsContent value="info">
                    <div className="space-y-4 mt-3">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Projeto</p>
                        <p className="text-sm">{selectedService.project}</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Cluster</p>
                        <p className="text-sm">{selectedService.cluster}</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Namespace</p>
                        <p className="text-sm">{selectedService.namespace}</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Repositório</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono truncate">{selectedService.repoUrl}</p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Versão atual → target</p>
                        <p className="text-sm font-mono">{selectedService.currentVersion} → {selectedService.targetVersion}</p>
                      </div>
                      <Separator />
                      {selectedService.deployStartedAt && (
                        <><div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Início do deploy</p><p className="text-sm">{selectedService.deployStartedAt}</p></div><Separator /></>
                      )}
                      {selectedService.deployFinishedAt && (
                        <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Fim do deploy</p><p className="text-sm">{selectedService.deployFinishedAt}</p></div>
                      )}
                      {(selectedService.deployStatus === "Pending" || selectedService.deployStatus === "Failed") && (
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => handleDeploy(selectedService.id)}>
                            <Rocket className="h-4 w-4 mr-2" />
                            Iniciar Deploy
                          </Button>
                          {selectedService.deployStatus === "Failed" && (
                            <Button
                              className="flex-1 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                              variant="outline"
                              onClick={() => handleRollback(selectedService.id)}
                            >
                              <Undo2 className="h-4 w-4 mr-2" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecione um serviço para ver detalhes</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
