import { useState } from "react";
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
  HardDrive,
  MemoryStick,
  Play,
  ArrowUpCircle,
  Circle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SyncStatus = "Synced" | "OutOfSync" | "Unknown" | "Progressing";
type HealthStatus = "Healthy" | "Degraded" | "Progressing" | "Suspended" | "Missing" | "Unknown";

interface ServiceResource {
  kind: string;
  name: string;
  namespace: string;
  status: SyncStatus;
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

interface PmidService {
  id: string;
  name: string;
  project: string;
  namespace: string;
  cluster: string;
  repoUrl: string;
  targetRevision: string;
  currentRevision: string;
  syncStatus: SyncStatus;
  healthStatus: HealthStatus;
  lastSyncedAt: string;
  resources: ServiceResource[];
}

const mockServices: PmidService[] = [
  {
    id: "svc-1",
    name: "pmid-api-gateway",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/api-gateway.git",
    targetRevision: "v2.4.1",
    currentRevision: "v2.3.8",
    syncStatus: "OutOfSync",
    healthStatus: "Healthy",
    lastSyncedAt: "2026-03-23 08:30:00",
    resources: [
      { kind: "Deployment", name: "api-gateway", namespace: "pmid-prod", status: "OutOfSync", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", replicas: { desired: 3, ready: 3, available: 3 }, cpu: "250m", memory: "512Mi", restarts: 0, lastTransition: "2026-03-23 08:30:00" },
      { kind: "Service", name: "api-gateway-svc", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
      { kind: "ConfigMap", name: "api-gateway-config", namespace: "pmid-prod", status: "OutOfSync", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:25:00" },
      { kind: "HorizontalPodAutoscaler", name: "api-gateway-hpa", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
    ],
  },
  {
    id: "svc-2",
    name: "pmid-order-service",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/order-service.git",
    targetRevision: "v1.12.0",
    currentRevision: "v1.12.0",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "2026-03-23 09:15:00",
    resources: [
      { kind: "Deployment", name: "order-service", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v1.12.0", targetVersion: "v1.12.0", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "500m", memory: "1Gi", restarts: 0, lastTransition: "2026-03-23 09:15:00" },
      { kind: "Service", name: "order-service-svc", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v1.12.0", targetVersion: "v1.12.0", lastTransition: "2026-03-23 09:15:00" },
      { kind: "Secret", name: "order-service-secrets", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v1.12.0", targetVersion: "v1.12.0", lastTransition: "2026-03-23 09:10:00" },
    ],
  },
  {
    id: "svc-3",
    name: "pmid-notification-worker",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/notification-worker.git",
    targetRevision: "v3.1.0",
    currentRevision: "v3.0.5",
    syncStatus: "Progressing",
    healthStatus: "Progressing",
    lastSyncedAt: "2026-03-23 10:02:00",
    resources: [
      { kind: "Deployment", name: "notification-worker", namespace: "pmid-prod", status: "Progressing", health: "Progressing", version: "v3.0.5", targetVersion: "v3.1.0", replicas: { desired: 4, ready: 2, available: 2 }, cpu: "300m", memory: "768Mi", restarts: 1, lastTransition: "2026-03-23 10:02:00", message: "Rolling update in progress: 2 of 4 replicas updated" },
      { kind: "Service", name: "notification-worker-svc", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v3.0.5", targetVersion: "v3.1.0", lastTransition: "2026-03-23 10:00:00" },
    ],
  },
  {
    id: "svc-4",
    name: "pmid-auth-service",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/auth-service.git",
    targetRevision: "v2.0.3",
    currentRevision: "v2.0.3",
    syncStatus: "Synced",
    healthStatus: "Degraded",
    lastSyncedAt: "2026-03-23 07:45:00",
    resources: [
      { kind: "Deployment", name: "auth-service", namespace: "pmid-prod", status: "Synced", health: "Degraded", version: "v2.0.3", targetVersion: "v2.0.3", replicas: { desired: 3, ready: 1, available: 1 }, cpu: "400m", memory: "1Gi", restarts: 12, lastTransition: "2026-03-23 07:45:00", message: "CrashLoopBackOff: back-off 5m0s restarting failed container" },
      { kind: "Service", name: "auth-service-svc", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.3", lastTransition: "2026-03-23 07:45:00" },
      { kind: "PersistentVolumeClaim", name: "auth-service-pvc", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.3", lastTransition: "2026-03-23 07:40:00" },
    ],
  },
  {
    id: "svc-5",
    name: "pmid-billing-processor",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/billing-processor.git",
    targetRevision: "v1.8.2",
    currentRevision: "v1.8.2",
    syncStatus: "Synced",
    healthStatus: "Healthy",
    lastSyncedAt: "2026-03-23 06:00:00",
    resources: [
      { kind: "Deployment", name: "billing-processor", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v1.8.2", targetVersion: "v1.8.2", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "200m", memory: "256Mi", restarts: 0, lastTransition: "2026-03-23 06:00:00" },
      { kind: "CronJob", name: "billing-reconciliation", namespace: "pmid-prod", status: "Synced", health: "Healthy", version: "v1.8.2", targetVersion: "v1.8.2", lastTransition: "2026-03-23 06:00:00" },
    ],
  },
];

const getSyncBadge = (status: SyncStatus) => {
  const config: Record<SyncStatus, { variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode }> = {
    Synced: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    OutOfSync: { variant: "destructive", icon: <ArrowUpCircle className="h-3 w-3 mr-1" /> },
    Progressing: { variant: "secondary", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> },
    Unknown: { variant: "outline", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
  };
  const c = config[status];
  return (
    <Badge variant={c.variant} className="text-xs">
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

export default function ChangeExecutionPmid() {
  const [services, setServices] = useState<PmidService[]>(mockServices);
  const [selectedService, setSelectedService] = useState<PmidService | null>(null);
  const { toast } = useToast();

  const handleSync = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, syncStatus: "Progressing" as SyncStatus, healthStatus: "Progressing" as HealthStatus } : s
      )
    );
    toast({ title: "Sincronizando", description: "Deploy em andamento..." });
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                syncStatus: "Synced" as SyncStatus,
                healthStatus: "Healthy" as HealthStatus,
                currentRevision: s.targetRevision,
                resources: s.resources.map((r) => ({
                  ...r,
                  status: "Synced" as SyncStatus,
                  health: "Healthy" as HealthStatus,
                  version: s.targetRevision,
                  replicas: r.replicas ? { ...r.replicas, ready: r.replicas.desired, available: r.replicas.desired } : undefined,
                  restarts: 0,
                  message: undefined,
                })),
              }
            : s
        )
      );
      if (selectedService?.id === serviceId) {
        setSelectedService((prev) =>
          prev
            ? {
                ...prev,
                syncStatus: "Synced",
                healthStatus: "Healthy",
                currentRevision: prev.targetRevision,
                resources: prev.resources.map((r) => ({
                  ...r,
                  status: "Synced" as SyncStatus,
                  health: "Healthy" as HealthStatus,
                  version: prev.targetRevision,
                  replicas: r.replicas ? { ...r.replicas, ready: r.replicas.desired, available: r.replicas.desired } : undefined,
                  restarts: 0,
                  message: undefined,
                })),
              }
            : null
        );
      }
      toast({ title: "Sync concluído", description: "Serviço sincronizado com sucesso!" });
    }, 3000);
  };

  const stats = {
    total: services.length,
    synced: services.filter((s) => s.syncStatus === "Synced").length,
    outOfSync: services.filter((s) => s.syncStatus === "OutOfSync").length,
    healthy: services.filter((s) => s.healthStatus === "Healthy").length,
    degraded: services.filter((s) => s.healthStatus === "Degraded").length,
    progressing: services.filter((s) => s.healthStatus === "Progressing" || s.syncStatus === "Progressing").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execução de Change - PMID</h2>
          <p className="text-muted-foreground">CHG0174916 - Visão de deploy e saúde dos serviços</p>
        </div>
        <Button variant="outline" onClick={() => toast({ title: "Atualizando...", description: "Buscando status atualizado" })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.synced}</p>
            <p className="text-xs text-muted-foreground">Synced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.outOfSync}</p>
            <p className="text-xs text-muted-foreground">Out of Sync</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.healthy}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.degraded}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.progressing}</p>
            <p className="text-xs text-muted-foreground">Progressing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Aplicações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <Card
                key={svc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedService?.id === svc.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedService(svc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold truncate">{svc.name}</CardTitle>
                    <div className="flex gap-1">
                      {getSyncBadge(svc.syncStatus)}
                      {getHealthBadge(svc.healthStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Server className="h-3 w-3" />
                    <span>{svc.cluster}</span>
                    <span className="text-border">|</span>
                    <span>{svc.namespace}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>
                      {svc.currentRevision}
                      {svc.currentRevision !== svc.targetRevision && (
                        <span className="text-primary"> → {svc.targetRevision}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Último sync: {svc.lastSyncedAt}</span>
                  </div>
                  {svc.syncStatus === "OutOfSync" && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSync(svc.id);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Sync & Deploy
                    </Button>
                  )}
                  {svc.syncStatus === "Progressing" && (
                    <div className="space-y-1">
                      <Progress value={50} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">Sincronizando...</p>
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
                  {getSyncBadge(selectedService.syncStatus)}
                  {getHealthBadge(selectedService.healthStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="resources">
                  <TabsList className="w-full">
                    <TabsTrigger value="resources" className="flex-1">Recursos</TabsTrigger>
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resources">
                    <ScrollArea className="h-[500px] pr-2">
                      <div className="space-y-3 mt-3">
                        {selectedService.resources.map((res, idx) => (
                          <Card key={idx} className="border-border/50">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {res.kind}
                                  </Badge>
                                  <span className="text-sm font-medium">{res.name}</span>
                                </div>
                                {getHealthBadge(res.health)}
                              </div>

                              <div className="flex gap-2">
                                {getSyncBadge(res.status)}
                                <Badge variant="outline" className="text-xs font-mono">
                                  {res.version}
                                  {res.version !== res.targetVersion && ` → ${res.targetVersion}`}
                                </Badge>
                              </div>

                              {res.replicas && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Replicas</span>
                                    <span>
                                      {res.replicas.ready}/{res.replicas.desired} ready
                                    </span>
                                  </div>
                                  <Progress
                                    value={(res.replicas.ready / res.replicas.desired) * 100}
                                    className="h-1.5"
                                  />
                                </div>
                              )}

                              {(res.cpu || res.memory) && (
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  {res.cpu && (
                                    <span className="flex items-center gap-1">
                                      <Cpu className="h-3 w-3" /> {res.cpu}
                                    </span>
                                  )}
                                  {res.memory && (
                                    <span className="flex items-center gap-1">
                                      <MemoryStick className="h-3 w-3" /> {res.memory}
                                    </span>
                                  )}
                                  {res.restarts !== undefined && res.restarts > 0 && (
                                    <span className="flex items-center gap-1 text-destructive">
                                      <RefreshCw className="h-3 w-3" /> {res.restarts} restarts
                                    </span>
                                  )}
                                </div>
                              )}

                              {res.message && (
                                <p className="text-xs text-destructive bg-destructive/10 rounded p-2 mt-1">
                                  {res.message}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

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
                        <p className="text-xs font-medium text-muted-foreground">Revisão atual → target</p>
                        <p className="text-sm font-mono">
                          {selectedService.currentRevision} → {selectedService.targetRevision}
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Último sync</p>
                        <p className="text-sm">{selectedService.lastSyncedAt}</p>
                      </div>

                      {selectedService.syncStatus === "OutOfSync" && (
                        <Button className="w-full" onClick={() => handleSync(selectedService.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Sync & Deploy
                        </Button>
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
