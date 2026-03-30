import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, ArrowRightLeft, Clock, Trophy, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { incidentApi, userApi, departmentApi } from '@/services/mockApi';

interface Tramitation {
  user_id: string;
  user_name: string;
  oldvalue_name: string;
  newvalue_name: string;
  sys_created_on: string;
  incident_number: string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds] = match.map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#ec4899',
  '#06b6d4',
];

export default function AnalystProductivity() {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [queueFilter, setQueueFilter] = useState<string>('all');

  const { data: tramitations = [], isLoading: loadingTramitations } = useQuery({
    queryKey: ['analyst-tramitations'],
    queryFn: incidentApi.getAllTramitations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });

  const isLoading = loadingTramitations || loadingUsers;

  // Match tramitation users against registered users by name (case-insensitive)
  const registeredUserNames = useMemo(() => {
    return new Set(users.map(u => u.name?.toLowerCase().trim()).filter(Boolean));
  }, [users]);

  // Department names from the API (valid queues)
  const departmentNames = useMemo(() => {
    return new Set(departments.map((d: any) => d.name?.trim()).filter(Boolean));
  }, [departments]);

  // Only show queues that exist in department list
  const availableQueues = useMemo(() => {
    return Array.from(departmentNames).sort();
  }, [departmentNames]);

  const filteredData = useMemo(() => {
    // Only tramitations where newvalue_name is a registered department AND user is registered
    let data: Tramitation[] = (tramitations as Tramitation[]).filter(t =>
      departmentNames.has(t.oldvalue_name?.trim())
    );
    if (queueFilter !== 'all') {
      data = data.filter(d => d.oldvalue_name === queueFilter);
    }
    if (periodFilter !== 'all') {
      const now = new Date();
      const hours = parseInt(periodFilter);
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      data = data.filter(d => {
        const dt = parseDate(d.sys_created_on);
        return dt && dt >= cutoff;
      });
    }
    return data;
  }, [tramitations, periodFilter, queueFilter, registeredUserNames, departmentNames]);

  const analystStats = useMemo(() => {
    const map = new Map<string, { user_id: string; user_name: string; count: number; timestamps: Date[] }>();
    filteredData.forEach(t => {
      const key = t.user_id;
      const ts = parseDate(t.sys_created_on);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (ts) existing.timestamps.push(ts);
      } else {
        map.set(key, { user_id: t.user_id, user_name: t.user_name, count: 1, timestamps: ts ? [ts] : [] });
      }
    });

    return Array.from(map.values())
      .map(analyst => {
        const sorted = analyst.timestamps.sort((a, b) => a.getTime() - b.getTime());
        let avgTime = 0;
        if (sorted.length > 1) {
          const diffs: number[] = [];
          for (let i = 1; i < sorted.length; i++) {
            diffs.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 60000);
          }
          avgTime = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        }
        return { ...analyst, avgTime };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const displayedAnalysts = useMemo(() => {
    if (!search) return analystStats;
    const lower = search.toLowerCase();
    return analystStats.filter(a =>
      a.user_name.toLowerCase().includes(lower) || a.user_id.toLowerCase().includes(lower)
    );
  }, [analystStats, search]);

  const totalTramitations = filteredData.length;
  const totalAnalysts = analystStats.length;
  const globalAvgTime = analystStats.length
    ? analystStats.reduce((acc, a) => acc + a.avgTime, 0) / analystStats.length
    : 0;

  const barData = analystStats.slice(0, 10).map(a => ({
    name: a.user_name.split(' ').slice(0, 2).join(' '),
    tramitações: a.count,
  }));

  const teamMap = new Map<string, number>();
  filteredData.forEach(t => {
    if (t.oldvalue_name) {
      teamMap.set(t.oldvalue_name, (teamMap.get(t.oldvalue_name) || 0) + 1);
    }
  });
  const pieData = Array.from(teamMap.entries())
    .map(([name, value]) => ({
      name: name.replace('CTIO IT - ', '').replace('CTIO OPS - ', '').replace('CTIO UX - ', ''),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  function formatTime(minutes: number) {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}min`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando tramitações dos incidentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtividade dos Analistas</h1>
          <p className="text-sm text-muted-foreground">Visão geral de tramitações e performance da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar analista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-[220px]"
            />
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="48">Últimas 48h</SelectItem>
              <SelectItem value="168">Última semana</SelectItem>
            </SelectContent>
          </Select>
          <Select value={queueFilter} onValueChange={setQueueFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filtrar por fila" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filas</SelectItem>
              {availableQueues.map(q => (
                <SelectItem key={q} value={q}>
                  {q.replace('CTIO IT - ', '').replace('CTIO OPS - ', '').replace('CTIO UX - ', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tramitações</p>
                <p className="text-3xl font-bold text-foreground">{totalTramitations}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Analistas Ativos</p>
                <p className="text-3xl font-bold text-foreground">{totalAnalysts}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio entre Ações</p>
                <p className="text-3xl font-bold text-foreground">{formatTime(globalAvgTime)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Analista</p>
                <p className="text-lg font-bold text-foreground truncate max-w-[160px]">
                  {analystStats[0]?.user_name.split(' ').slice(0, 2).join(' ') || '-'}
                </p>
                <p className="text-xs text-muted-foreground">{analystStats[0]?.count || 0} tramitações</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tramitações por Analista</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="tramitações" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período selecionado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destino das Tramitações (Times)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' - ')[0]} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período selecionado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Produtividade</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Analista</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-center">Tramitações</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
                <TableHead className="text-center">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAnalysts.map((analyst) => {
                const rank = analystStats.indexOf(analyst) + 1;
                const isTop = rank <= 3;
                return (
                  <TableRow key={analyst.user_id}>
                    <TableCell>
                      {isTop ? (
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ${
                          rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
                        }`}>
                          {rank}
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium ml-1.5">{rank}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{analyst.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{analyst.user_id}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-foreground">{analyst.count}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {analyst.avgTime > 0 ? formatTime(analyst.avgTime) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {analyst.avgTime > 0 && analyst.avgTime < globalAvgTime ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-500">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-medium">Acima da média</span>
                        </div>
                      ) : analyst.avgTime > globalAvgTime ? (
                        <div className="flex items-center justify-center gap-1 text-amber-500">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs font-medium">Abaixo da média</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {displayedAnalysts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum analista encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
