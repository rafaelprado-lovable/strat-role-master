import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, ArrowRightLeft, Trophy, Search, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export default function AnalystProductivity() {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('abril');
  const [queueFilter, setQueueFilter] = useState<string[]>([]);

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

  const departmentNames = useMemo(() => {
    return new Set(departments.map((d: any) => d.name?.trim()).filter(Boolean));
  }, [departments]);

  const availableQueues = useMemo(() => {
    return Array.from(departmentNames).sort();
  }, [departmentNames]);

  const filteredData = useMemo(() => {
    let data: Tramitation[] = (tramitations as Tramitation[]).filter(t =>
      departmentNames.has(t.oldvalue_name?.trim())
    );
    if (queueFilter.length > 0) {
      data = data.filter(d => queueFilter.includes(d.oldvalue_name?.trim()));
    }
    if (periodFilter === 'abril') {
      data = data.filter(d => {
        const dt = parseDate(d.sys_created_on);
        return dt && dt.getMonth() === 3 && dt.getFullYear() === 2026;
      });
    } else if (periodFilter !== 'all') {
      const now = new Date();
      const hours = parseInt(periodFilter);
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      data = data.filter(d => {
        const dt = parseDate(d.sys_created_on);
        return dt && dt >= cutoff;
      });
    }
    return data;
  }, [tramitations, periodFilter, queueFilter, departmentNames]);

  const analystStats = useMemo(() => {
    const map = new Map<string, { user_id: string; user_name: string; count: number }>();
    filteredData.forEach(t => {
      const key = t.user_id;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { user_id: t.user_id, user_name: t.user_name, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
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

  const barData = analystStats.slice(0, 10).map(a => ({
    name: a.user_name.split(' ').slice(0, 2).join(' '),
    tramitações: a.count,
  }));

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
              <SelectItem value="abril">Abril 2025</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="48">Últimas 48h</SelectItem>
              <SelectItem value="168">Última semana</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-[280px] h-10">
                <span className="truncate text-foreground">
                  {queueFilter.length === 0
                    ? 'Todas as filas'
                    : `${queueFilter.length} fila${queueFilter.length > 1 ? 's' : ''} selecionada${queueFilter.length > 1 ? 's' : ''}`}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <div className="p-2 border-b border-border">
                <button
                  onClick={() => setQueueFilter([])}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar seleção
                </button>
              </div>
              <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
                {availableQueues.map(q => {
                  const selected = queueFilter.includes(q);
                  return (
                    <label
                      key={q}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setQueueFilter(prev =>
                            selected ? prev.filter(x => x !== q) : [...prev, q]
                          )
                        }
                        className="rounded border-input"
                      />
                      {q.replace('CTIO IT - ', '').replace('CTIO OPS - ', '').replace('CTIO UX - ', '')}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Bar Chart */}
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
                  </TableRow>
                );
              })}
              {displayedAnalysts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
