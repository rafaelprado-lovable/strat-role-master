import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Shield, Users, Clock, TrendingUp, ArrowLeft, Eye } from "lucide-react";

// ---------- Mock data ----------

const USERS = ["carlos.silva", "ana.souza", "lucas.oliveira", "maria.santos", "pedro.lima", "julia.costa", "rafael.mendes"];

const PAGES = ["/dashboard", "/automations", "/changes", "/settings", "/users", "/incidents", "/definitions"];

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

const mockLogs = Array.from({ length: 200 }, (_, i) => {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  const date = randomDate(30);
  return {
    id: i + 1,
    user,
    action: ["login", "login", "login", "page_view", "api_call"][Math.floor(Math.random() * 5)],
    page: PAGES[Math.floor(Math.random() * PAGES.length)],
    ip: `10.151.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 255)}`,
    userAgent: ["Chrome/120", "Firefox/121", "Safari/17", "Edge/120"][Math.floor(Math.random() * 4)],
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

const actionLabel = (a: string) => {
  const map: Record<string, string> = { login: "Login", page_view: "Visualização", api_call: "API Call" };
  return map[a] || a;
};

// ---------- User Detail Dialog ----------

function UserDetailDialog({
  user,
  open,
  onClose,
  logs,
}: {
  user: string;
  open: boolean;
  onClose: () => void;
  logs: typeof mockLogs;
}) {
  const userLogs = useMemo(() => logs.filter((l) => l.user === user), [logs, user]);

  // Daily access timeline
  const dailyAccess = useMemo(() => {
    const map: Record<string, number> = {};
    userLogs.forEach((l) => {
      const day = l.timestamp.toLocaleDateString("pt-BR");
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split("/").map(Number);
        const [db, mb, yb] = b.date.split("/").map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      });
  }, [userLogs]);

  // Pages visited
  const pageVisits = useMemo(() => {
    const map: Record<string, number> = {};
    userLogs.filter((l) => l.action === "page_view").forEach((l) => {
      map[l.page] = (map[l.page] || 0) + 1;
    });
    return Object.entries(map)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
  }, [userLogs]);

  // Actions breakdown
  const actionBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    userLogs.forEach((l) => {
      map[l.action] = (map[l.action] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [userLogs]);

  // IPs used
  const ipsUsed = useMemo(() => {
    const set = new Set(userLogs.map((l) => l.ip));
    return Array.from(set);
  }, [userLogs]);

  // Browsers used
  const browsersUsed = useMemo(() => {
    const map: Record<string, number> = {};
    userLogs.forEach((l) => {
      map[l.userAgent] = (map[l.userAgent] || 0) + 1;
    });
    return Object.entries(map).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count);
  }, [userLogs]);

  const totalEvents = userLogs.length;
  const totalLogins = userLogs.filter((l) => l.action === "login").length;
  const lastAccess = userLogs.length
    ? new Date(Math.max(...userLogs.map((l) => l.timestamp.getTime())))
    : null;

  const lineConfig = { count: { label: "Acessos", color: CHART_COLORS[0] } };
  const pieConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    actionBreakdown.forEach((item, i) => {
      cfg[item.name] = { label: actionLabel(item.name), color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    return cfg;
  }, [actionBreakdown]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Detalhes de {user}
          </DialogTitle>
        </DialogHeader>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-4 mt-2">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Eventos</p>
              <p className="text-xl font-bold text-foreground">{totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Logins</p>
              <p className="text-xl font-bold text-foreground">{totalLogins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">IPs Distintos</p>
              <p className="text-xl font-bold text-foreground">{ipsUsed.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Último Acesso</p>
              <p className="text-sm font-bold text-foreground">
                {lastAccess ? `${lastAccess.toLocaleDateString("pt-BR")} ${lastAccess.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-5 mt-2">
          {/* Timeline */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Acessos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineConfig} className="h-[200px] w-full">
                <LineChart data={dailyAccess}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Action breakdown pie */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tipos de Ação</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieConfig} className="h-[200px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={actionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {actionBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables row */}
        <div className="grid gap-4 lg:grid-cols-2 mt-2">
          {/* Pages visited */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Páginas Visitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead className="text-right">Acessos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageVisits.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma visualização</TableCell></TableRow>
                  )}
                  {pageVisits.map((p) => (
                    <TableRow key={p.page}>
                      <TableCell className="font-mono text-sm">{p.page}</TableCell>
                      <TableCell className="text-right">{p.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* IPs & Browsers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">IPs e Navegadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Endereços IP</p>
                <div className="flex flex-wrap gap-1.5">
                  {ipsUsed.map((ip) => (
                    <Badge key={ip} variant="outline" className="font-mono text-xs">{ip}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Navegadores</p>
                <Table>
                  <TableBody>
                    {browsersUsed.map((b) => (
                      <TableRow key={b.browser}>
                        <TableCell className="text-sm py-1.5">{b.browser}</TableCell>
                        <TableCell className="text-right py-1.5">{b.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="mt-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimas Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...userLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={log.action === "login" ? "default" : "secondary"}>
                        {actionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.page}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{log.userAgent}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.timestamp.toLocaleDateString("pt-BR")} {log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main Component ----------

export default function Audit() {
  const [period, setPeriod] = useState("30");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return mockLogs.filter((l) => l.timestamp >= cutoff);
  }, [period]);

  const accessByUser = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      if (l.action === "login") map[l.user] = (map[l.user] || 0) + 1;
    });
    return Object.entries(map)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  const actionDist = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      map[l.action] = (map[l.action] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Acessos por Usuário</CardTitle>
            <CardDescription>Clique em uma barra para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={accessByUser} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="user" type="category" width={110} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                  onClick={(data: any) => data?.user && setSelectedUser(data.user)}
                >
                  {accessByUser.map((entry, i) => (
                    <Cell key={entry.user} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

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

      {/* Users table with detail button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários</CardTitle>
          <CardDescription>Clique em "Detalhes" para ver o histórico completo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-center">Logins</TableHead>
                <TableHead className="text-center">Eventos</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessByUser.map((u) => {
                const userEvents = filteredLogs.filter((l) => l.user === u.user);
                const last = new Date(Math.max(...userEvents.map((l) => l.timestamp.getTime())));
                return (
                  <TableRow key={u.user}>
                    <TableCell className="font-medium">{u.user}</TableCell>
                    <TableCell className="text-center">{u.count}</TableCell>
                    <TableCell className="text-center">{userEvents.length}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {last.toLocaleDateString("pt-BR")} {last.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(u.user)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent logs */}
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
                <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUser(log.user)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User detail dialog */}
      {selectedUser && (
        <UserDetailDialog
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          logs={filteredLogs}
        />
      )}
    </div>
  );
}
