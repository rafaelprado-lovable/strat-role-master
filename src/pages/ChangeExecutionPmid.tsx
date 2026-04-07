import { useState, useEffect, useCallback } from "react";
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
  Play,
  ArrowUpCircle,
  Circle,
  Rocket,
  Package,
  Settings2,
} from "lucide-react";
import DeploymentConfigPanel from "@/components/pmid/DeploymentConfigPanel";
import { useToast } from "@/hooks/use-toast";

type DeployStatus = "Pending" | "Deploying" | "Deployed" | "Failed" | "Rollback";
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

interface PmidService {
  id: string;
  name: string;
  project: string;
  namespace: string;
  cluster: string;
  repoUrl: string;
  targetVersion: string;
  currentVersion: string;
  deployStatus: DeployStatus;
  healthStatus: HealthStatus;
  deployProgress: number;
  deployStartedAt?: string;
  deployFinishedAt?: string;
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
    targetVersion: "v2.4.1",
    currentVersion: "v2.3.8",
    deployStatus: "Pending",
    healthStatus: "Healthy",
    deployProgress: 0,
    resources: [
      { kind: "Deployment", name: "api-gateway", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", replicas: { desired: 3, ready: 3, available: 3 }, cpu: "250m", memory: "512Mi", restarts: 0, lastTransition: "2026-03-23 08:30:00" },
      { kind: "Service", name: "api-gateway-svc", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
      { kind: "ConfigMap", name: "api-gateway-config", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:25:00" },
      { kind: "HorizontalPodAutoscaler", name: "api-gateway-hpa", namespace: "pmid-prod", health: "Healthy", version: "v2.3.8", targetVersion: "v2.4.1", lastTransition: "2026-03-23 08:30:00" },
    ],
  },
  {
    id: "svc-2",
    name: "pmid-order-service",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/order-service.git",
    targetVersion: "v1.13.0",
    currentVersion: "v1.12.0",
    deployStatus: "Pending",
    healthStatus: "Healthy",
    deployProgress: 0,
    resources: [
      { kind: "Deployment", name: "order-service", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "500m", memory: "1Gi", restarts: 0, lastTransition: "2026-03-23 09:15:00" },
      { kind: "Service", name: "order-service-svc", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", lastTransition: "2026-03-23 09:15:00" },
      { kind: "Secret", name: "order-service-secrets", namespace: "pmid-prod", health: "Healthy", version: "v1.12.0", targetVersion: "v1.13.0", lastTransition: "2026-03-23 09:10:00" },
    ],
  },
  {
    id: "svc-3",
    name: "pmid-notification-worker",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-01",
    repoUrl: "git@gitlab.internal:pmid/notification-worker.git",
    targetVersion: "v3.1.0",
    currentVersion: "v3.0.5",
    deployStatus: "Deploying",
    healthStatus: "Progressing",
    deployProgress: 45,
    deployStartedAt: "2026-03-23 10:02:00",
    resources: [
      { kind: "Deployment", name: "notification-worker", namespace: "pmid-prod", health: "Progressing", version: "v3.0.5", targetVersion: "v3.1.0", replicas: { desired: 4, ready: 2, available: 2 }, cpu: "300m", memory: "768Mi", restarts: 1, lastTransition: "2026-03-23 10:02:00", message: "Rolling update: 2 of 4 replicas updated" },
      { kind: "Service", name: "notification-worker-svc", namespace: "pmid-prod", health: "Healthy", version: "v3.0.5", targetVersion: "v3.1.0", lastTransition: "2026-03-23 10:00:00" },
    ],
  },
  {
    id: "svc-4",
    name: "pmid-auth-service",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/auth-service.git",
    targetVersion: "v2.0.4",
    currentVersion: "v2.0.3",
    deployStatus: "Failed",
    healthStatus: "Degraded",
    deployProgress: 30,
    deployStartedAt: "2026-03-23 07:45:00",
    resources: [
      { kind: "Deployment", name: "auth-service", namespace: "pmid-prod", health: "Degraded", version: "v2.0.3", targetVersion: "v2.0.4", replicas: { desired: 3, ready: 1, available: 1 }, cpu: "400m", memory: "1Gi", restarts: 12, lastTransition: "2026-03-23 07:45:00", message: "CrashLoopBackOff: back-off 5m0s restarting failed container" },
      { kind: "Service", name: "auth-service-svc", namespace: "pmid-prod", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.4", lastTransition: "2026-03-23 07:45:00" },
      { kind: "PersistentVolumeClaim", name: "auth-service-pvc", namespace: "pmid-prod", health: "Healthy", version: "v2.0.3", targetVersion: "v2.0.4", lastTransition: "2026-03-23 07:40:00" },
    ],
  },
  {
    id: "svc-5",
    name: "pmid-billing-processor",
    project: "pmid-production",
    namespace: "pmid-prod",
    cluster: "k8s-prod-02",
    repoUrl: "git@gitlab.internal:pmid/billing-processor.git",
    targetVersion: "v1.8.3",
    currentVersion: "v1.8.2",
    deployStatus: "Deployed",
    healthStatus: "Healthy",
    deployProgress: 100,
    deployStartedAt: "2026-03-23 06:00:00",
    deployFinishedAt: "2026-03-23 06:04:30",
    resources: [
      { kind: "Deployment", name: "billing-processor", namespace: "pmid-prod", health: "Healthy", version: "v1.8.3", targetVersion: "v1.8.3", replicas: { desired: 2, ready: 2, available: 2 }, cpu: "200m", memory: "256Mi", restarts: 0, lastTransition: "2026-03-23 06:04:30" },
      { kind: "CronJob", name: "billing-reconciliation", namespace: "pmid-prod", health: "Healthy", version: "v1.8.3", targetVersion: "v1.8.3", lastTransition: "2026-03-23 06:04:30" },
    ],
  },
];

const getDeployBadge = (status: DeployStatus) => {
  const config: Record<DeployStatus, { variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode; className?: string }> = {
    Deployed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, className: "bg-green-600 hover:bg-green-600/80" },
    Pending: { variant: "outline", icon: <Clock className="h-3 w-3 mr-1" /> },
    Deploying: { variant: "secondary", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> },
    Failed: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
    Rollback: { variant: "destructive", icon: <ArrowUpCircle className="h-3 w-3 mr-1" /> },
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

export default function ChangeExecutionPmid() {
  const [services, setServices] = useState<PmidService[]>(mockServices);
  const [selectedService, setSelectedService] = useState<PmidService | null>(null);
  const { toast } = useToast();

  // Simulate deploy progress for "Deploying" services
  useEffect(() => {
    const deploying = services.filter((s) => s.deployStatus === "Deploying");
    if (deploying.length === 0) return;

    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          if (s.deployStatus !== "Deploying") return s;
          const newProgress = Math.min(s.deployProgress + Math.floor(Math.random() * 8) + 2, 100);
          const finished = newProgress >= 100;
          const readyRatio = newProgress / 100;
          return {
            ...s,
            deployProgress: newProgress,
            deployStatus: finished ? "Deployed" as DeployStatus : s.deployStatus,
            healthStatus: finished ? "Healthy" as HealthStatus : "Progressing" as HealthStatus,
            currentVersion: finished ? s.targetVersion : s.currentVersion,
            deployFinishedAt: finished ? new Date().toISOString().replace("T", " ").slice(0, 19) : undefined,
            resources: s.resources.map((r) => ({
              ...r,
              health: finished ? "Healthy" as HealthStatus : r.health,
              version: finished ? s.targetVersion : r.version,
              replicas: r.replicas
                ? {
                    ...r.replicas,
                    ready: finished ? r.replicas.desired : Math.min(Math.round(r.replicas.desired * readyRatio), r.replicas.desired),
                    available: finished ? r.replicas.desired : Math.min(Math.round(r.replicas.desired * readyRatio), r.replicas.desired),
                  }
                : undefined,
              message: finished ? undefined : r.message,
              restarts: finished ? 0 : r.restarts,
            })),
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [services.filter((s) => s.deployStatus === "Deploying").length]);

  // Keep selected service in sync
  useEffect(() => {
    if (selectedService) {
      const updated = services.find((s) => s.id === selectedService.id);
      if (updated) setSelectedService(updated);
    }
  }, [services]);

  const handleDeploy = useCallback((serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              deployStatus: "Deploying" as DeployStatus,
              healthStatus: "Progressing" as HealthStatus,
              deployProgress: 5,
              deployStartedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
              deployFinishedAt: undefined,
            }
          : s
      )
    );
    toast({ title: "Deploy iniciado", description: "Aplicação de deploy em andamento..." });
  }, [toast]);

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
    healthy: services.filter((s) => s.healthStatus === "Healthy").length,
    degraded: services.filter((s) => s.healthStatus === "Degraded").length,
  };

  const overallProgress = services.length > 0 
    ? Math.round(services.reduce((sum, s) => sum + s.deployProgress, 0) / services.length) 
    : 0;

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

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">
            <Rocket className="h-4 w-4 mr-1.5" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings2 className="h-4 w-4 mr-1.5" />
            Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-6">

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
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.deployed}</p>
            <p className="text-xs text-muted-foreground">Deployed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.deploying}</p>
            <p className="text-xs text-muted-foreground">Deploying</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
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
                    {(svc.deployStatus === "Pending" || svc.deployStatus === "Failed") && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeploy(svc.id);
                        }}
                      >
                        <Rocket className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Server className="h-3 w-3" /> {svc.cluster}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {svc.currentVersion}
                      {svc.currentVersion !== svc.targetVersion && (
                        <span className="text-primary font-medium"> → {svc.targetVersion}</span>
                      )}
                    </span>
                  </div>

                  {/* Deploy Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {svc.deployStatus === "Deployed" ? "Deploy concluído" :
                         svc.deployStatus === "Deploying" ? "Deploying..." :
                         svc.deployStatus === "Failed" ? "Deploy falhou" :
                         "Aguardando deploy"}
                      </span>
                      <span className="font-medium">{svc.deployProgress}%</span>
                    </div>
                    <Progress 
                      value={svc.deployProgress} 
                      className={`h-2 ${svc.deployStatus === "Failed" ? "[&>div]:bg-destructive" : svc.deployStatus === "Deployed" ? "[&>div]:bg-green-500" : ""}`} 
                    />
                  </div>

                  {svc.deployStartedAt && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Início: {svc.deployStartedAt}
                      </span>
                      {svc.deployFinishedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" /> Fim: {svc.deployFinishedAt}
                        </span>
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
                        <p className="text-xs font-medium text-muted-foreground">Versão atual → target</p>
                        <p className="text-sm font-mono">
                          {selectedService.currentVersion} → {selectedService.targetVersion}
                        </p>
                      </div>
                      <Separator />
                      {selectedService.deployStartedAt && (
                        <>
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Início do deploy</p>
                            <p className="text-sm">{selectedService.deployStartedAt}</p>
                          </div>
                          <Separator />
                        </>
                      )}
                      {selectedService.deployFinishedAt && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Fim do deploy</p>
                          <p className="text-sm">{selectedService.deployFinishedAt}</p>
                        </div>
                      )}

                      {(selectedService.deployStatus === "Pending" || selectedService.deployStatus === "Failed") && (
                        <Button className="w-full" onClick={() => handleDeploy(selectedService.id)}>
                          <Rocket className="h-4 w-4 mr-2" />
                          Iniciar Deploy
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
