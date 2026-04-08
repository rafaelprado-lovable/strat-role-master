import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { changesApi } from "@/services/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceConfigEditor, { type DeploymentConfig } from "@/components/pmid/ServiceConfigEditor";
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
  History,
  Link,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types from API ─────────────────────────────────────────────

export interface DhuoRelease {
  id: string;
  name: string;
  majorVersion: string;
  integrationVersionId: string;
  integrationReleaseId: string;
  status: string;
}

export interface DhuoDeploymentData {
  id: string;
  status: string;
  size: string;
  deployment: {
    request: { memory: string; cpu: string };
    limit: { memory: string; cpu: string };
  };
  hpa: {
    minReplica: number;
    maxReplica: number;
    targetCPUUtilizationPercentage: number;
    targetMemoryUtilizationPercentage: number;
  };
  advanced: {
    variables: any[];
    nodeAffinityKey: string;
    nodeAffinityValue: any[];
    hostAlias: any[];
    logLevel: string;
    enableTracing: boolean;
  };
  integrationRelease: { id: string; name: string };
  integrationVersion: { id: string; version: string };
  integration: { id: string; name: string };
  environment: { id: string; name: string };
  cluster: {
    id: string;
    name: string;
    type: string;
    namespace: string;
    region: string;
  };
  author: { id: string; name: string; email: string };
  majorVersion: string;
  rollbackEnabled: boolean;
  details: string; // JSON string with full deploy config
  createdAt: string;
  updatedAt: string;
}

export interface DhuoData {
  integration_id: string;
  deployment_data: DhuoDeploymentData;
  available_releases: DhuoRelease[];
  target_release: DhuoRelease;
}

export interface ChangeServiceItem {
  service_name: string;
  cf_production_version: string;
  implementation_version: string;
  pipeline_service_link: string;
  pipeline_route_link?: string;
  dhuo_data?: DhuoData;
}

// ─── Internal types ─────────────────────────────────────────────

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
  namespace: string;
  cluster: string;
  clusterType: string;
  region: string;
  currentVersion: string;
  targetVersion: string;
  currentRelease: string;
  targetRelease: string;
  deployStatus: DeployStatus;
  healthStatus: HealthStatus;
  deployProgress: number;
  deployStartedAt?: string;
  deployFinishedAt?: string;
  resources: ServiceResource[];
  pipelineLink: string;
  availableReleases: DhuoRelease[];
  rollbackEnabled: boolean;
  size: string;
  environment: string;
  author: { name: string; email: string };
}

// ─── Parse details JSON ─────────────────────────────────────────

interface ParsedDetails {
  deploy: {
    cluster: string;
    clusterType: string;
    namespace: string;
    resources: {
      size: string;
      requestCPU: string;
      requestMemory: string;
      limitCPU: string;
      limitMemory: string;
      minReplica: number;
      maxReplica: number;
      autoscalingCpu: number;
      autoscalingMemory: number;
    };
    hostAlias: any[];
    logLevel: string;
  };
  params: {
    variables: string[];
    certs: string[];
    keys: string[];
    secrets: string[];
  };
}

function parseDetails(details: string): ParsedDetails | null {
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

// mockChangeData removed — data is now fetched from the API

// ─── Build PmidService from API data ────────────────────────────

function buildServicesFromChange(changeServicesList: ChangeServiceItem[]): PmidService[] {
  return changeServicesList.map((svc, idx) => {
    const dhuo = svc.dhuo_data;
    const dd = dhuo?.deployment_data;
    const details = dd?.details ? parseDetails(dd.details) : null;

    const namespace = dd?.cluster?.namespace || "default";
    const clusterName = dd?.cluster?.name || "unknown";
    const clusterType = dd?.cluster?.type || "unknown";
    const region = dd?.cluster?.region || "unknown";

    const hpa = dd?.hpa;
    const deploy = dd?.deployment;

    return {
      id: dd?.id || `svc-${idx}`,
      name: svc.service_name,
      namespace,
      cluster: clusterName,
      clusterType,
      region,
      currentVersion: dd?.integrationRelease?.name || svc.cf_production_version,
      targetVersion: dhuo?.target_release?.name || svc.implementation_version,
      currentRelease: svc.cf_production_version,
      targetRelease: svc.implementation_version,
      deployStatus: "Pending" as DeployStatus,
      healthStatus: dd?.status === "SUCCESS" ? ("Healthy" as HealthStatus) : ("Unknown" as HealthStatus),
      deployProgress: 0,
      resources: [
        {
          kind: "Deployment",
          name: svc.service_name,
          namespace,
          health: "Healthy" as HealthStatus,
          version: svc.cf_production_version,
          targetVersion: svc.implementation_version,
          replicas: hpa ? { desired: hpa.minReplica, ready: hpa.minReplica, available: hpa.minReplica } : undefined,
          cpu: deploy?.request?.cpu,
          memory: deploy?.request?.memory,
          restarts: 0,
        },
        {
          kind: "Service",
          name: `${svc.service_name}-svc`,
          namespace,
          health: "Healthy" as HealthStatus,
          version: svc.cf_production_version,
          targetVersion: svc.implementation_version,
        },
        ...(hpa
          ? [
              {
                kind: "HorizontalPodAutoscaler",
                name: `${svc.service_name}-hpa`,
                namespace,
                health: "Healthy" as HealthStatus,
                version: svc.cf_production_version,
                targetVersion: svc.implementation_version,
              },
            ]
          : []),
      ],
      pipelineLink: svc.pipeline_service_link || "",
      availableReleases: dhuo?.available_releases || [],
      rollbackEnabled: dd?.rollbackEnabled ?? false,
      size: dd?.size || "medium",
      environment: dd?.environment?.name || "prd",
      author: dd?.author ? { name: dd.author.name, email: dd.author.email } : { name: "", email: "" },
    };
  });
}

// ─── Build initial configs from API data ────────────────────────

export interface InitialServiceConfig {
  serviceName: string;
  variables: string[];
  secrets: string[];
  hostAliases: Array<{ ip: string; hostnames: string[] }>;
  resources: {
    cpuMin: string;
    cpuMax: string;
    memoryMin: string;
    memoryMax: string;
    podsMin: number;
    podsMax: number;
    autoscalingEnabled: boolean;
    autoscalingTargetCpu: number;
    autoscalingTargetMemory: number;
  };
}

function buildInitialConfigs(changeServicesList: ChangeServiceItem[]): InitialServiceConfig[] {
  return changeServicesList.map((svc) => {
    const dd = svc.dhuo_data?.deployment_data;
    const details = dd?.details ? parseDetails(dd.details) : null;
    const hpa = dd?.hpa;
    const deploy = dd?.deployment;

    return {
      serviceName: svc.service_name,
      variables: details?.params?.variables || [],
      secrets: details?.params?.secrets || [],
      hostAliases: details?.deploy?.hostAlias || dd?.advanced?.hostAlias || [],
      resources: {
        cpuMin: deploy?.request?.cpu || "100m",
        cpuMax: deploy?.limit?.cpu || "500m",
        memoryMin: deploy?.request?.memory || "128Mi",
        memoryMax: deploy?.limit?.memory || "512Mi",
        podsMin: hpa?.minReplica || 1,
        podsMax: hpa?.maxReplica || 3,
        autoscalingEnabled: !!hpa,
        autoscalingTargetCpu: hpa?.targetCPUUtilizationPercentage || 80,
        autoscalingTargetMemory: hpa?.targetMemoryUtilizationPercentage || 80,
      },
    };
  });
}

// ─── Badge helpers ──────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────

export default function ChangeExecutionPmid() {
  const { id: changeNumber } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Fetch change data from /v1/changes API
  const { data: changesData = [], isLoading, isError } = useQuery({
    queryKey: ['execution-changes'],
    queryFn: changesApi.getExecutionChanges,
  });

  // Find the specific change by number
  const changeData = useMemo(
    () => changesData.find((c: any) => c.changeSystemData?.number === changeNumber),
    [changesData, changeNumber]
  );

  const changeServicesList: ChangeServiceItem[] = (changeData?.changeServicesList || []).map((s: any) => ({
    ...s,
    pipeline_service_link: s.pipeline_service_link || s.pipeline_link || '',
  }));
  const changeInfo = changeData?.changeSystemData || { number: changeNumber || '', description: '', start_date: '', end_date: '', state: '' };

  const initialServices = useMemo(() => buildServicesFromChange(changeServicesList), [changeServicesList]);
  const initialConfigs = useMemo(() => buildInitialConfigs(changeServicesList), [changeServicesList]);

  const [services, setServices] = useState<PmidService[]>([]);
  const [selectedService, setSelectedService] = useState<PmidService | null>(null);
  const [selectedReleaseMap, setSelectedReleaseMap] = useState<Record<string, string>>({});

  // Initialize services when data loads
  useEffect(() => {
    if (initialServices.length > 0 && services.length === 0) {
      setServices(initialServices);
      const map: Record<string, string> = {};
      initialServices.forEach((s) => { map[s.id] = s.targetVersion; });
      setSelectedReleaseMap(map);
    }
  }, [initialServices]);

  // Per-service deployment configs
  const allVariables = useMemo(() => Array.from(new Set(initialConfigs?.flatMap((c) => c.variables) || [])).sort(), [initialConfigs]);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, DeploymentConfig>>({});

  useEffect(() => {
    if (initialConfigs.length > 0 && Object.keys(serviceConfigs).length === 0) {
      const cfgs: Record<string, DeploymentConfig> = {};
      initialConfigs.forEach((ic) => {
        cfgs[ic.serviceName] = {
          variables: ic.variables.map((v) => ({ id: crypto.randomUUID(), name: v })),
          secrets: ic.secrets || [],
          hostAliases: ic.hostAliases.map((h: any) => ({ id: crypto.randomUUID(), ip: h.ip || "", hostnames: h.hostnames || [""] })),
          resources: { ...ic.resources },
        };
      });
      setServiceConfigs(cfgs);
    }
  }, [initialConfigs]);

  // Simulate deploy progress
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
            deployStatus: finished ? ("Deployed" as DeployStatus) : s.deployStatus,
            healthStatus: finished ? ("Healthy" as HealthStatus) : ("Progressing" as HealthStatus),
            currentVersion: finished ? s.targetVersion : s.currentVersion,
            deployFinishedAt: finished ? new Date().toISOString().replace("T", " ").slice(0, 19) : undefined,
            resources: s.resources.map((r) => ({
              ...r,
              health: finished ? ("Healthy" as HealthStatus) : r.health,
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

  const handleDeploy = useCallback(
    (serviceId: string) => {
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
                targetVersion: selectedReleaseMap[s.id] || s.targetVersion,
              }
            : s
        )
      );
      toast({ title: "Deploy iniciado", description: "Aplicação de deploy em andamento..." });
    },
    [toast, selectedReleaseMap]
  );

  const handleDeployAll = useCallback(() => {
    const pending = services.filter((s) => s.deployStatus === "Pending" || s.deployStatus === "Failed");
    if (pending.length === 0) {
      toast({ title: "Nenhum deploy pendente", description: "Todos os serviços já foram implantados." });
      return;
    }
    pending.forEach((s) => handleDeploy(s.id));
  }, [services, handleDeploy, toast]);

  const handleRollback = useCallback(
    (serviceId: string, releaseName: string) => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                targetVersion: releaseName,
                deployStatus: "Deploying" as DeployStatus,
                healthStatus: "Progressing" as HealthStatus,
                deployProgress: 5,
                deployStartedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
                deployFinishedAt: undefined,
              }
            : s
        )
      );
      toast({ title: "Rollback iniciado", description: `Rollback para release ${releaseName}...` });
    },
    [toast]
  );

  const stats = {
    total: services.length,
    deployed: services.filter((s) => s.deployStatus === "Deployed").length,
    pending: services.filter((s) => s.deployStatus === "Pending").length,
    deploying: services.filter((s) => s.deployStatus === "Deploying").length,
    failed: services.filter((s) => s.deployStatus === "Failed").length,
    healthy: services.filter((s) => s.healthStatus === "Healthy").length,
  };

  const overallProgress =
    services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.deployProgress, 0) / services.length) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando dados da change...</span>
      </div>
    );
  }

  if (isError || !changeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-muted-foreground">
          {isError ? "Erro ao carregar dados da change." : `Change ${changeNumber} não encontrada.`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execução de Change - PMID</h2>
          <p className="text-muted-foreground">
            {changeInfo.number} - {changeInfo.description.length > 100 ? changeInfo.description.slice(0, 100) + "..." : changeInfo.description}
          </p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>Início: {changeInfo.start_date}</span>
            <span>Fim: {changeInfo.end_date}</span>
            <Badge variant="outline" className="text-xs">{changeInfo.state}</Badge>
          </div>
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

      <div className="space-y-6">
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
              {/* New Services */}
              {services.filter((s) => s.currentRelease === "N/A").length > 0 && (
                <>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-primary" />
                    Novos Serviços
                    <Badge variant="secondary" className="text-xs">{services.filter((s) => s.currentRelease === "N/A").length}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {services.filter((s) => s.currentRelease === "N/A").map((svc) => (
                      <ServiceCard key={svc.id} svc={svc} selectedService={selectedService} setSelectedService={setSelectedService} handleDeploy={handleDeploy} getDeployBadge={getDeployBadge} getHealthBadge={getHealthBadge} serviceConfigs={serviceConfigs} allVariables={allVariables} setServiceConfigs={setServiceConfigs} isNew />
                    ))}
                  </div>
                </>
              )}

              {/* Existing Services */}
              {services.filter((s) => s.currentRelease !== "N/A").length > 0 && (
                <>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Serviços Existentes
                    <Badge variant="secondary" className="text-xs">{services.filter((s) => s.currentRelease !== "N/A").length}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {services.filter((s) => s.currentRelease !== "N/A").map((svc) => (
                      <ServiceCard key={svc.id} svc={svc} selectedService={selectedService} setSelectedService={setSelectedService} handleDeploy={handleDeploy} getDeployBadge={getDeployBadge} getHealthBadge={getHealthBadge} serviceConfigs={serviceConfigs} allVariables={allVariables} setServiceConfigs={setServiceConfigs} />
                    ))}
                  </div>
                </>
              )}
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
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{svc.namespace}</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {svc.currentVersion}
                          {svc.currentVersion !== svc.targetVersion && (
                            <span className="text-primary font-medium"> → {svc.targetVersion}</span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">{svc.size}</Badge>
                      </div>

                      {/* Target release info */}
                      {svc.targetVersion && (svc.deployStatus === "Pending" || svc.deployStatus === "Failed") && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-muted-foreground">Release alvo:</span>
                          <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
                            {svc.targetVersion}
                          </Badge>
                        </div>
                      )}

                      {/* Deploy Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {svc.deployStatus === "Deployed"
                              ? "Deploy concluído"
                              : svc.deployStatus === "Deploying"
                              ? "Deploying..."
                              : svc.deployStatus === "Failed"
                              ? "Deploy falhou"
                              : "Aguardando deploy"}
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

                      {/* Per-service config */}
                      {serviceConfigs[svc.name] && (
                        <div className="mt-3">
                          <ServiceConfigEditor
                            config={serviceConfigs[svc.name]}
                            allVariables={allVariables}
                            onChange={(newCfg) =>
                              setServiceConfigs((prev) => ({ ...prev, [svc.name]: newCfg }))
                            }
                          />
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
                            {/* Version info */}
                            <Card className="border-primary/30 bg-primary/5">
                              <CardContent className="p-3 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Versões</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono bg-green-500/10 text-green-500 border-green-500/30">
                                    {selectedService.currentVersion}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
                                    {selectedService.targetVersion}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
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
                                        <span>{res.replicas.ready}/{res.replicas.desired} ready</span>
                                      </div>
                                      <Progress value={(res.replicas.ready / res.replicas.desired) * 100} className="h-1.5" />
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
                                    <p className="text-xs text-destructive bg-destructive/10 rounded p-2 mt-1">{res.message}</p>
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
                            <p className="text-xs font-medium text-muted-foreground">Cluster</p>
                            <p className="text-sm font-mono">{selectedService.cluster}</p>
                            <p className="text-xs text-muted-foreground">{selectedService.clusterType} · {selectedService.region}</p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Namespace</p>
                            <p className="text-sm font-mono">{selectedService.namespace}</p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Environment</p>
                            <p className="text-sm">{selectedService.environment}</p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Size</p>
                            <Badge variant="outline">{selectedService.size}</Badge>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Versão atual → target</p>
                            <p className="text-sm font-mono">{selectedService.currentVersion} → {selectedService.targetVersion}</p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Último deploy por</p>
                            <p className="text-sm">{selectedService.author.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedService.author.email}</p>
                          </div>
                          <Separator />
                          {selectedService.pipelineLink && selectedService.pipelineLink !== "N/A" && (
                            <a
                              href={selectedService.pipelineLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <Link className="h-4 w-4" />
                              Pipeline
                              <ExternalLink className="h-3 w-3" />
                            </a>
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
    </div>
  );
}
