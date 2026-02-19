import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Server, Cpu, MemoryStick, HardDrive, Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────

const clusters = [
  { name: "prod-br-east-1", nodes: 12, region: "São Paulo" },
  { name: "prod-br-west-1", nodes: 8, region: "Rio de Janeiro" },
  { name: "staging-br-1", nodes: 4, region: "São Paulo" },
];

const nodesByCluster: Record<string, Array<{
  name: string;
  status: "Ready" | "NotReady";
  cpuUsage: number;
  cpuTotal: number;
  memUsage: number;
  memTotal: number;
  diskUsage: number;
  diskTotal: number;
  pods: number;
  maxPods: number;
}>> = {
  "prod-br-east-1": [
    { name: "node-01", status: "Ready", cpuUsage: 3200, cpuTotal: 4000, memUsage: 12800, memTotal: 16384, diskUsage: 78, diskTotal: 100, pods: 42, maxPods: 110 },
    { name: "node-02", status: "Ready", cpuUsage: 2800, cpuTotal: 4000, memUsage: 10240, memTotal: 16384, diskUsage: 55, diskTotal: 100, pods: 38, maxPods: 110 },
    { name: "node-03", status: "Ready", cpuUsage: 3600, cpuTotal: 4000, memUsage: 14336, memTotal: 16384, diskUsage: 82, diskTotal: 100, pods: 65, maxPods: 110 },
    { name: "node-04", status: "NotReady", cpuUsage: 0, cpuTotal: 4000, memUsage: 0, memTotal: 16384, diskUsage: 12, diskTotal: 100, pods: 0, maxPods: 110 },
    { name: "node-05", status: "Ready", cpuUsage: 1600, cpuTotal: 4000, memUsage: 8192, memTotal: 16384, diskUsage: 45, diskTotal: 100, pods: 28, maxPods: 110 },
    { name: "node-06", status: "Ready", cpuUsage: 2400, cpuTotal: 4000, memUsage: 11264, memTotal: 16384, diskUsage: 60, diskTotal: 100, pods: 35, maxPods: 110 },
  ],
  "prod-br-west-1": [
    { name: "node-01", status: "Ready", cpuUsage: 2000, cpuTotal: 4000, memUsage: 9216, memTotal: 16384, diskUsage: 50, diskTotal: 100, pods: 30, maxPods: 110 },
    { name: "node-02", status: "Ready", cpuUsage: 3400, cpuTotal: 4000, memUsage: 13312, memTotal: 16384, diskUsage: 72, diskTotal: 100, pods: 55, maxPods: 110 },
    { name: "node-03", status: "Ready", cpuUsage: 1200, cpuTotal: 4000, memUsage: 6144, memTotal: 16384, diskUsage: 30, diskTotal: 100, pods: 18, maxPods: 110 },
  ],
  "staging-br-1": [
    { name: "node-01", status: "Ready", cpuUsage: 800, cpuTotal: 2000, memUsage: 2048, memTotal: 8192, diskUsage: 25, diskTotal: 50, pods: 12, maxPods: 60 },
    { name: "node-02", status: "Ready", cpuUsage: 1200, cpuTotal: 2000, memUsage: 4096, memTotal: 8192, diskUsage: 40, diskTotal: 50, pods: 20, maxPods: 60 },
  ],
};

const deployments: Array<{
  name: string;
  namespace: string;
  cluster: string;
  replicas: number;
  available: number;
  status: "Healthy" | "Degraded" | "Failed";
  image: string;
  lastUpdate: string;
}> = [
  { name: "api-gateway", namespace: "production", cluster: "prod-br-east-1", replicas: 3, available: 3, status: "Healthy", image: "api-gateway:v2.4.1", lastUpdate: "2026-02-19 08:12" },
  { name: "auth-service", namespace: "production", cluster: "prod-br-east-1", replicas: 2, available: 2, status: "Healthy", image: "auth-svc:v1.8.0", lastUpdate: "2026-02-18 14:30" },
  { name: "payment-service", namespace: "production", cluster: "prod-br-east-1", replicas: 3, available: 1, status: "Degraded", image: "payment:v3.1.2", lastUpdate: "2026-02-19 09:45" },
  { name: "notification-worker", namespace: "production", cluster: "prod-br-west-1", replicas: 2, available: 0, status: "Failed", image: "notif-worker:v1.2.0", lastUpdate: "2026-02-19 07:00" },
  { name: "order-processor", namespace: "production", cluster: "prod-br-west-1", replicas: 4, available: 4, status: "Healthy", image: "order-proc:v5.0.3", lastUpdate: "2026-02-17 20:15" },
  { name: "frontend-web", namespace: "production", cluster: "prod-br-east-1", replicas: 3, available: 3, status: "Healthy", image: "frontend:v4.2.0", lastUpdate: "2026-02-19 06:00" },
  { name: "cache-manager", namespace: "infra", cluster: "prod-br-east-1", replicas: 2, available: 2, status: "Healthy", image: "cache-mgr:v1.0.5", lastUpdate: "2026-02-15 10:00" },
  { name: "log-aggregator", namespace: "monitoring", cluster: "staging-br-1", replicas: 1, available: 1, status: "Healthy", image: "log-agg:v2.1.0", lastUpdate: "2026-02-18 16:00" },
];

const restartingServices: Array<{
  name: string;
  namespace: string;
  cluster: string;
  restarts: number;
  lastRestart: string;
  reason: string;
}> = [
  { name: "payment-service-7d8f9", namespace: "production", cluster: "prod-br-east-1", restarts: 42, lastRestart: "2026-02-19 09:58", reason: "OOMKilled" },
  { name: "notification-worker-3a2b1", namespace: "production", cluster: "prod-br-west-1", restarts: 18, lastRestart: "2026-02-19 09:50", reason: "CrashLoopBackOff" },
  { name: "auth-service-5c4d2", namespace: "production", cluster: "prod-br-east-1", restarts: 5, lastRestart: "2026-02-19 08:30", reason: "Error" },
  { name: "cache-manager-9e8f7", namespace: "infra", cluster: "prod-br-east-1", restarts: 3, lastRestart: "2026-02-18 22:15", reason: "OOMKilled" },
];

// ── Helpers ──────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "Healthy":
    case "Ready":
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />{status}</Badge>;
    case "Degraded":
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    case "Failed":
    case "NotReady":
      return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getUsageColor(pct: number) {
  if (pct >= 90) return "text-red-500";
  if (pct >= 70) return "text-amber-500";
  return "text-emerald-500";
}

function getProgressColor(pct: number) {
  if (pct >= 90) return "[&>div]:bg-red-500";
  if (pct >= 70) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

// ── Chart configs ──────────────────────────────────────────

const clusterChartConfig: ChartConfig = {
  nodes: { label: "Nodes", color: "hsl(var(--chart-1))" },
};

const statusChartConfig: ChartConfig = {
  healthy: { label: "Healthy", color: "hsl(142 76% 36%)" },
  degraded: { label: "Degraded", color: "hsl(38 92% 50%)" },
  failed: { label: "Failed", color: "hsl(0 84% 60%)" },
};

const PIE_COLORS = ["hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

// ── Component ──────────────────────────────────────────────

export default function K8sObservability() {
  const [selectedCluster, setSelectedCluster] = useState<string>("all");

  const filteredNodes = selectedCluster === "all"
    ? Object.entries(nodesByCluster).flatMap(([cluster, nodes]) => nodes.map(n => ({ ...n, cluster })))
    : (nodesByCluster[selectedCluster] || []).map(n => ({ ...n, cluster: selectedCluster }));

  const filteredDeployments = selectedCluster === "all"
    ? deployments
    : deployments.filter(d => d.cluster === selectedCluster);

  const filteredRestarting = selectedCluster === "all"
    ? restartingServices
    : restartingServices.filter(s => s.cluster === selectedCluster);

  const totalNodes = filteredNodes.length;
  const readyNodes = filteredNodes.filter(n => n.status === "Ready").length;
  const healthyDeploys = filteredDeployments.filter(d => d.status === "Healthy").length;
  const degradedDeploys = filteredDeployments.filter(d => d.status === "Degraded").length;
  const failedDeploys = filteredDeployments.filter(d => d.status === "Failed").length;

  const clusterBarData = clusters.map(c => ({ name: c.name, nodes: c.nodes }));

  const deployStatusPieData = [
    { name: "Healthy", value: healthyDeploys },
    { name: "Degraded", value: degradedDeploys },
    { name: "Failed", value: failedDeploys },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Observabilidade K8s</h1>
          <p className="text-sm text-muted-foreground">Monitoramento de clusters, nodes, deployments e serviços</p>
        </div>
        <Select value={selectedCluster} onValueChange={setSelectedCluster}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clusters</SelectItem>
            {clusters.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Nodes totais</p>
              <p className="text-2xl font-bold text-foreground">{totalNodes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Nodes Ready</p>
              <p className="text-2xl font-bold text-foreground">{readyNodes}<span className="text-sm font-normal text-muted-foreground">/{totalNodes}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10"><Activity className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Deployments</p>
              <p className="text-2xl font-bold text-foreground">{filteredDeployments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><RefreshCw className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pods restartando</p>
              <p className="text-2xl font-bold text-foreground">{filteredRestarting.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nodes por Cluster</CardTitle>
            <CardDescription>Quantidade de nodes em cada cluster</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={clusterChartConfig} className="h-[220px] w-full">
              <BarChart data={clusterBarData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="nodes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saúde dos Deployments</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={statusChartConfig} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={deployStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {deployStatusPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Node consumption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" />Consumo dos Nodes</CardTitle>
          <CardDescription>CPU, Memória, Disco e Pods por node</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU (m)</TableHead>
                <TableHead>Memória (Mi)</TableHead>
                <TableHead>Disco (%)</TableHead>
                <TableHead>Pods</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNodes.map((node) => {
                const cpuPct = Math.round((node.cpuUsage / node.cpuTotal) * 100);
                const memPct = Math.round((node.memUsage / node.memTotal) * 100);
                const podPct = Math.round((node.pods / node.maxPods) * 100);
                return (
                  <TableRow key={`${node.cluster}-${node.name}`}>
                    <TableCell className="font-mono text-sm">{node.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{node.cluster}</TableCell>
                    <TableCell>{getStatusBadge(node.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{node.cpuUsage}m</span>
                          <span className={getUsageColor(cpuPct)}>{cpuPct}%</span>
                        </div>
                        <Progress value={cpuPct} className={`h-2 ${getProgressColor(cpuPct)}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{Math.round(node.memUsage / 1024)}Gi</span>
                          <span className={getUsageColor(memPct)}>{memPct}%</span>
                        </div>
                        <Progress value={memPct} className={`h-2 ${getProgressColor(memPct)}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{node.diskUsage}%</span>
                        </div>
                        <Progress value={node.diskUsage} className={`h-2 ${getProgressColor(node.diskUsage)}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{node.pods}/{node.maxPods}</span>
                          <span className={getUsageColor(podPct)}>{podPct}%</span>
                        </div>
                        <Progress value={podPct} className={`h-2 ${getProgressColor(podPct)}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deployments health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Saúde dos Deployments</CardTitle>
          <CardDescription>Status de todos os deployments nos clusters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deployment</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Réplicas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Última atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeployments.map((dep) => (
                <TableRow key={`${dep.cluster}-${dep.name}`}>
                  <TableCell className="font-mono text-sm font-medium">{dep.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{dep.namespace}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{dep.cluster}</TableCell>
                  <TableCell>
                    <span className={dep.available < dep.replicas ? "text-destructive font-medium" : ""}>
                      {dep.available}/{dep.replicas}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(dep.status)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{dep.image}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{dep.lastUpdate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restarting services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive"><RefreshCw className="h-4 w-4" />Serviços Restartando</CardTitle>
          <CardDescription>Pods com alto número de restarts recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pod</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Restarts</TableHead>
                <TableHead>Último restart</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestarting.map((svc) => (
                <TableRow key={`${svc.cluster}-${svc.name}`}>
                  <TableCell className="font-mono text-sm">{svc.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{svc.namespace}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{svc.cluster}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${svc.restarts >= 20 ? "text-destructive" : svc.restarts >= 5 ? "text-amber-500" : "text-foreground"}`}>
                      {svc.restarts}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{svc.lastRestart}</TableCell>
                  <TableCell>
                    <Badge className={
                      svc.reason === "OOMKilled"
                        ? "bg-red-500/15 text-red-600 border-red-500/30"
                        : svc.reason === "CrashLoopBackOff"
                        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                        : "bg-muted text-muted-foreground"
                    }>
                      {svc.reason}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
