import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Shield, Users, Clock, TrendingUp } from "lucide-react";

// ---------- Mock data ----------

const USERS = ["carlos.silva", "ana.souza", "lucas.oliveira", "maria.santos", "pedro.lima", "julia.costa", "rafael.mendes"];

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

const mockLogs = Array.from({ length: 120 }, (_, i) => {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  const date = randomDate(30);
  return {
    id: i + 1,
    user,
    action: ["login", "login", "login", "page_view", "api_call"][Math.floor(Math.random() * 5)],
    ip: `10.151.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 255)}`,
    timestamp: date,
  };
});

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
];

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
  "hsl(var(--primary))",
];

// ---------- Component ----------

export default function Audit() {
  const [period, setPeriod] = useState("30");

  const filteredLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return mockLogs.filter((l) => l.timestamp >= cutoff);
  }, [period]);

  // Access count per user
  const accessByUser = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      if (l.action === "login") map[l.user] = (map[l.user] || 0) + 1;
    });
    return Object.entries(map)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  // Actions distribution
  const actionDist = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      map[l.action] = (map[l.action] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  // Recent logs
  const recentLogs = useMemo(
    () => [...filteredLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20),
    [filteredLogs]
  );

  const totalLogins = accessByUser.reduce((s, u) => s + u.count, 0);
  const uniqueUsers = accessByUser.length;

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    accessByUser.forEach((item, i) => {
      cfg[item.user] = { label: item.user, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    return cfg;
  }, [accessByUser]);

  const pieConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    actionDist.forEach((item, i) => {
      cfg[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    return cfg;
  }, [actionDist]);

  const actionLabel = (a: string) => {
    const map: Record<string, string> = { login: "Login", page_view: "Visualização", api_call: "API Call" };
    return map[a] || a;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
            <p className="text-sm text-muted-foreground">Acessos e atividades por usuário</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Logins</p>
              <p className="text-2xl font-bold text-foreground">{totalLogins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Clock className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar chart — logins per user */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Acessos por Usuário</CardTitle>
            <CardDescription>Logins no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={accessByUser} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="user" type="category" width={110} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {accessByUser.map((entry, i) => (
                    <Cell key={entry.user} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie chart — action distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de Ação</CardTitle>
            <CardDescription>Distribuição de eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={actionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {actionDist.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent logs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Acessos</CardTitle>
          <CardDescription>20 eventos mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={log.action === "login" ? "default" : "secondary"}>
                      {actionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.timestamp.toLocaleDateString("pt-BR")} {log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
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
