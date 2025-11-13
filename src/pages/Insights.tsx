import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  FileText,
  Bot,
  Target,
  Eye,
  FileSearch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Insight } from '@/types';

// Mock API
const mockInsights: Insight[] = [
  {
    id: '1',
    incident_data: {
      number: 'INC2076074',
      priority: '4',
      state: '7',
      assignment_team: 'eabf34b2db10d1549c4087b304961909',
    },
    engineering_sla: {
      entry_time: ['2025-10-12T17:33:47.382Z'],
      out_time: ['2025-10-12T19:01:02.508Z'],
      solved_by_eng: false,
      total_time: 86.22,
      departaments: [
        { sysId: '8a40459e1b4af410e9162170f54bcb3a', totalTime: 0 },
        { name: '8a40459e1b4af410e9162170f54bcb3a', totalTime: 0.33 },
      ],
    },
    escalation: {
      '50_percent': false,
      '75_percent': false,
      '90_percent': false,
    },
    traceability: {
      organization: 'tim',
    },
    heimdall_actuation: {
      change_criticity: false,
      close_by_analyse: false,
      close_by_automation: false,
      sla_management: false,
      omsActuation: {
        RejectedByMask: true,
        RejectedByIOP: 'IOP1236',
      },
    },
  },
  {
    id: '2',
    incident_data: {
      number: 'INC2076458',
      priority: '2',
      state: '1',
      assignment_team: 'team123',
    },
    engineering_sla: {
      entry_time: ['2025-10-13T08:15:20.000Z'],
      out_time: ['2025-10-13T13:52:30.000Z'],
      solved_by_eng: true,
      total_time: 337.17,
      departaments: [
        { name: 'Network Operations', totalTime: 200.5 },
        { name: 'Field Support', totalTime: 136.67 },
      ],
    },
    escalation: {
      '50_percent': true,
      '75_percent': false,
      '90_percent': false,
    },
    traceability: {
      organization: 'vivo',
    },
    heimdall_actuation: {
      change_criticity: true,
      close_by_analyse: false,
      close_by_automation: false,
      sla_management: true,
    },
  },
  {
    id: '3',
    incident_data: {
      number: 'INC2076459',
      priority: '1',
      state: '2',
      assignment_team: 'team456',
    },
    engineering_sla: {
      entry_time: ['2025-10-13T14:20:00.000Z'],
      out_time: ['2025-10-13T22:50:00.000Z'],
      solved_by_eng: true,
      total_time: 510.0,
      departaments: [
        { name: 'Security Team', totalTime: 300.0 },
        { name: 'Infrastructure', totalTime: 210.0 },
      ],
    },
    escalation: {
      '50_percent': true,
      '75_percent': true,
      '90_percent': false,
    },
    traceability: {
      organization: 'claro',
    },
    heimdall_actuation: {
      change_criticity: false,
      close_by_analyse: true,
      close_by_automation: false,
      sla_management: true,
    },
  },
  {
    id: '4',
    incident_data: {
      number: 'INC2076460',
      priority: '3',
      state: '6',
      assignment_team: 'team789',
    },
    engineering_sla: {
      entry_time: ['2025-10-14T09:00:00.000Z'],
      out_time: ['2025-10-14T12:15:00.000Z'],
      solved_by_eng: true,
      total_time: 195.0,
      departaments: [{ name: 'Application Support', totalTime: 195.0 }],
    },
    escalation: {
      '50_percent': false,
      '75_percent': false,
      '90_percent': false,
    },
    traceability: {
      organization: 'oi',
    },
    heimdall_actuation: {
      change_criticity: false,
      close_by_analyse: false,
      close_by_automation: true,
      sla_management: false,
    },
  },
  {
    id: '5',
    incident_data: {
      number: 'INC2076461',
      priority: '4',
      state: '3',
      assignment_team: 'team101',
    },
    engineering_sla: {
      entry_time: ['2025-10-14T15:30:00.000Z'],
      out_time: ['2025-10-14T17:15:00.000Z'],
      solved_by_eng: false,
      total_time: 105.0,
      departaments: [{ name: 'Help Desk', totalTime: 105.0 }],
    },
    escalation: {
      '50_percent': false,
      '75_percent': false,
      '90_percent': false,
    },
    traceability: {
      organization: 'nextel',
    },
    heimdall_actuation: {
      change_criticity: false,
      close_by_analyse: false,
      close_by_automation: false,
      sla_management: true,
    },
  },
];

const insightsApi = {
  getAll: async (): Promise<Insight[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockInsights;
  },
};

const priorityLabels: Record<string, { label: string; variant: 'destructive' | 'default' | 'secondary' }> = {
  '1': { label: 'Crítico', variant: 'destructive' },
  '2': { label: 'Alto', variant: 'destructive' },
  '3': { label: 'Médio', variant: 'default' },
  '4': { label: 'Baixo', variant: 'secondary' },
};

const stateLabels: Record<string, string> = {
  '1': 'Novo',
  '2': 'Em Progresso',
  '3': 'Em Análise',
  '6': 'Resolvido',
  '7': 'Fechado',
};

export default function Insights() {
  const [selectedOrg, setSelectedOrg] = useState<string>('all');

  const { data: insights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsApi.getAll,
  });

  const filteredInsights =
    selectedOrg === 'all'
      ? insights
      : insights.filter((i) => i.traceability.organization === selectedOrg);

  const totalInsights = filteredInsights.length;
  const solvedByEng = filteredInsights.filter((i) => i.engineering_sla.solved_by_eng).length;
  const avgSlaTime =
    filteredInsights.reduce((acc, i) => acc + i.engineering_sla.total_time, 0) / totalInsights || 0;
  const escalated = filteredInsights.filter(
    (i) => i.escalation['50_percent'] || i.escalation['75_percent'] || i.escalation['90_percent']
  ).length;
  const changeCriticity = filteredInsights.filter((i) => i.heimdall_actuation.change_criticity).length;
  const closeByAnalyse = filteredInsights.filter((i) => i.heimdall_actuation.close_by_analyse).length;
  const closeByAutomation = filteredInsights.filter((i) => i.heimdall_actuation.close_by_automation).length;
  const slaManagement = filteredInsights.filter((i) => i.heimdall_actuation.sla_management).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Insights</h1>
        <p className="text-muted-foreground">
          Visualização e análise de incidentes gerenciados pelo Heimdall
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Filtrar por Organização</label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecionar organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as organizações</SelectItem>
                  <SelectItem value="tim">TIM</SelectItem>
                  <SelectItem value="vivo">VIVO</SelectItem>
                  <SelectItem value="claro">CLARO</SelectItem>
                  <SelectItem value="oi">OI</SelectItem>
                  <SelectItem value="nextel">NEXTEL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Incidentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsights}</div>
            <p className="text-xs text-muted-foreground">Registrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos por Eng.</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solvedByEng}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((solvedByEng / totalInsights) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio SLA</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgSlaTime / 60).toFixed(2)}h</div>
            <p className="text-xs text-muted-foreground">Média de tempo de resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalated}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((escalated / totalInsights) * 100) : 0}% em escalação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mudança de Criticidade</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeCriticity}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((changeCriticity / totalInsights) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechado por Análise</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closeByAnalyse}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((closeByAnalyse / totalInsights) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechado por Automação</CardTitle>
            <Bot className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closeByAutomation}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((closeByAutomation / totalInsights) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestão de SLA</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaManagement}</div>
            <p className="text-xs text-muted-foreground">
              {totalInsights > 0 ? Math.round((slaManagement / totalInsights) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Incidentes <span className="text-muted-foreground">({totalInsights} incidentes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número do Incidente</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tempo SLA (h)</TableHead>
                <TableHead>Resolvido Eng.</TableHead>
                <TableHead>Escalação</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsights.map((insight) => {
                const priority = priorityLabels[insight.incident_data.priority] || {
                  label: 'Desconhecido',
                  variant: 'default' as const,
                };
                const state = stateLabels[insight.incident_data.state] || 'Desconhecido';
                const escalationBadges = [];

                if (insight.escalation['50_percent']) escalationBadges.push('50%');
                if (insight.escalation['75_percent']) escalationBadges.push('75%');
                if (insight.escalation['90_percent']) escalationBadges.push('90%');

                return (
                  <TableRow key={insight.id}>
                    <TableCell className="font-medium">{insight.incident_data.number}</TableCell>
                    <TableCell>
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </TableCell>
                    <TableCell>{state}</TableCell>
                    <TableCell>{(insight.engineering_sla.total_time / 60).toFixed(2)}</TableCell>
                    <TableCell>
                      {insight.engineering_sla.solved_by_eng ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {escalationBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {escalationBadges.map((badge) => (
                            <Badge key={badge} variant="outline">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="uppercase">{insight.traceability.organization}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FileSearch className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
