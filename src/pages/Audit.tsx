import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Shield, Users, Clock, TrendingUp, Eye } from "lucide-react";

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
  const userLogs = useMemo(
    () => [...logs.filter((l) => l.user === user)].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [logs, user]
  );

  const lastAccess = userLogs.length ? userLogs[0].timestamp : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Detalhes de {user}
          </DialogTitle>
        </DialogHeader>

        {/* Último acesso */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Último acesso:</span>
          <span className="text-sm font-medium text-foreground">
            {lastAccess
              ? `${lastAccess.toLocaleDateString("pt-BR")} às ${lastAccess.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "—"}
          </span>
        </div>

        {/* Tabela: horário + ação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Histórico de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.timestamp.toLocaleDateString("pt-BR")} {log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.action === "login" ? "default" : "secondary"}>
                        {actionLabel(log.action)}
                      </Badge>
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
