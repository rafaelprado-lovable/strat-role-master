import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  CalendarIcon,
  X,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
    comments: [
      {
        created_at: '2025-10-12T17:40:00.000Z',
        created_by: 'João Silva',
        value: 'Incidente reportado pelo cliente. Sem conectividade na região.',
      },
      {
        created_at: '2025-10-12T18:15:00.000Z',
        created_by: 'Maria Santos',
        value: 'Equipe de campo acionada para verificação in loco.',
      },
      {
        created_at: '2025-10-12T18:50:00.000Z',
        created_by: 'Pedro Oliveira',
        value: 'Problema identificado: falha em equipamento de rede.',
      },
    ],
    work_notes: [
      {
        created_at: '2025-10-12T17:35:00.000Z',
        created_by: 'Sistema',
        value: 'Incidente criado automaticamente pelo monitoramento.',
        assignment_group: 'NOC - Network Operations Center',
      },
      {
        created_at: '2025-10-12T17:45:00.000Z',
        created_by: 'João Silva',
        value: 'Encaminhando para equipe de engenharia de rede.',
        assignment_group: 'CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT',
      },
      {
        created_at: '2025-10-12T18:20:00.000Z',
        created_by: 'Maria Santos',
        value: 'Escalado para equipe de campo. Necessário atendimento presencial.',
        assignment_group: 'Field Operations',
      },
      {
        created_at: '2025-10-12T19:00:00.000Z',
        created_by: 'Pedro Oliveira',
        value: 'Equipamento substituído. Testando conectividade.',
        assignment_group: 'Field Operations',
      },
    ],
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
    comments: [
      {
        created_at: '2025-10-13T08:20:00.000Z',
        created_by: 'Ana Costa',
        value: 'Cliente reporta lentidão severa em toda a rede corporativa.',
      },
      {
        created_at: '2025-10-13T10:30:00.000Z',
        created_by: 'Carlos Mendes',
        value: 'Identificado ataque DDoS. Implementando mitigação.',
      },
    ],
    work_notes: [
      {
        created_at: '2025-10-13T08:18:00.000Z',
        created_by: 'Sistema',
        value: 'Alerta crítico: tráfego anormal detectado.',
        assignment_group: 'Security Operations Center',
      },
      {
        created_at: '2025-10-13T08:25:00.000Z',
        created_by: 'Ana Costa',
        value: 'Escalando para equipe de segurança com prioridade alta.',
        assignment_group: 'Network Security Team',
      },
      {
        created_at: '2025-10-13T10:00:00.000Z',
        created_by: 'Carlos Mendes',
        value: 'Aplicando regras de firewall para bloquear origem do ataque.',
        assignment_group: 'Network Security Team',
      },
      {
        created_at: '2025-10-13T13:50:00.000Z',
        created_by: 'Carlos Mendes',
        value: 'Ataque mitigado com sucesso. Monitorando situação.',
        assignment_group: 'Network Security Team',
      },
    ],
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
    comments: [
      {
        created_at: '2025-10-13T14:25:00.000Z',
        created_by: 'Fernando Lima',
        value: 'Incidente crítico: falha completa do servidor principal de aplicação.',
      },
      {
        created_at: '2025-10-13T16:00:00.000Z',
        created_by: 'Juliana Rocha',
        value: 'Backup restaurado. Investigando causa raiz da falha.',
      },
      {
        created_at: '2025-10-13T22:45:00.000Z',
        created_by: 'Fernando Lima',
        value: 'Causa identificada: atualização de firmware com bug. Rollback realizado.',
      },
    ],
    work_notes: [
      {
        created_at: '2025-10-13T14:22:00.000Z',
        created_by: 'Sistema',
        value: 'Alerta P1: Servidor de produção offline.',
        assignment_group: 'Infrastructure Monitoring',
      },
      {
        created_at: '2025-10-13T14:30:00.000Z',
        created_by: 'Fernando Lima',
        value: 'Escalado para engenharia de infraestrutura. Verificando logs.',
        assignment_group: 'CTIO IT - INFRASTRUCTURE - N2',
      },
      {
        created_at: '2025-10-13T15:45:00.000Z',
        created_by: 'Juliana Rocha',
        value: 'Iniciando processo de restore do backup mais recente.',
        assignment_group: 'Security Team',
      },
      {
        created_at: '2025-10-13T20:00:00.000Z',
        created_by: 'Fernando Lima',
        value: 'Análise concluída. Preparando rollback da atualização.',
        assignment_group: 'Infrastructure',
      },
    ],
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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'state' | 'solved' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  const { data: insights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsApi.getAll,
  });

  // Extrair departamentos únicos dos insights
  const allDepartments = Array.from(
    new Set(
      insights.flatMap((insight) =>
        insight.engineering_sla.departaments.map((d) => d.name || d.sysId)
      )
    )
  ).filter(Boolean);

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const filteredInsights = insights
    .filter((insight) => {
      // Filtro de data
      if (startDate || endDate) {
        const entryDate = new Date(insight.engineering_sla.entry_time[0]);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
      }

      // Filtro de departamentos
      if (selectedDepartments.length > 0) {
        const insightDepts = insight.engineering_sla.departaments.map((d) => d.name || d.sysId);
        const hasMatchingDept = insightDepts.some((dept) => selectedDepartments.includes(dept));
        if (!hasMatchingDept) return false;
      }

      // Filtro de número de incidente
      if (searchNumber) {
        if (!insight.incident_data.number.toLowerCase().includes(searchNumber.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let comparison = 0;
      if (sortBy === 'priority') {
        comparison = parseInt(a.incident_data.priority) - parseInt(b.incident_data.priority);
      } else if (sortBy === 'state') {
        comparison = parseInt(a.incident_data.state) - parseInt(b.incident_data.state);
      } else if (sortBy === 'solved') {
        comparison = (a.engineering_sla.solved_by_eng === b.engineering_sla.solved_by_eng) 
          ? 0 
          : a.engineering_sla.solved_by_eng ? -1 : 1;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: 'priority' | 'state' | 'solved') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (insight: Insight) => {
    setSelectedInsight(insight);
    setNewStatus(insight.incident_data.state);
    setNewComment('');
    setDetailsOpen(true);
  };

  const handleViewAnalysis = (insight: Insight) => {
    setSelectedInsight(insight);
    setAnalysisOpen(true);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um comentário.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Comentário adicionado',
      description: `Comentário adicionado ao incidente ${selectedInsight?.incident_data.number}`,
    });
    setNewComment('');
  };

  const handleUpdateStatus = () => {
    toast({
      title: 'Status atualizado',
      description: `Status do incidente ${selectedInsight?.incident_data.number} atualizado para ${stateLabels[newStatus]}`,
    });
  };

  const handleCreateBug = () => {
    toast({
      title: 'Bug criado',
      description: `Bug criado para o incidente ${selectedInsight?.incident_data.number}`,
    });
  };

  const handleResolveIncident = () => {
    toast({
      title: 'Incidente resolvido',
      description: `Incidente ${selectedInsight?.incident_data.number} marcado como resolvido`,
    });
  };

  const handleCloseIncident = () => {
    toast({
      title: 'Incidente fechado',
      description: `Incidente ${selectedInsight?.incident_data.number} fechado`,
    });
  };

  const handleReassignIncident = () => {
    toast({
      title: 'Incidente reatribuído',
      description: `Incidente ${selectedInsight?.incident_data.number} reatribuído`,
    });
  };

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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Número do Incidente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número..."
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Departamentos</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedDepartments.length > 0
                      ? `${selectedDepartments.length} selecionado(s)`
                      : 'Todos os departamentos'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="start">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedDepartments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setSelectedDepartments([])}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpar seleção
                      </Button>
                    )}
                    {allDepartments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept}
                          checked={selectedDepartments.includes(dept)}
                          onCheckedChange={() => toggleDepartment(dept)}
                        />
                        <Label htmlFor={dept} className="text-sm cursor-pointer">
                          {dept}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('priority')}
                  >
                    Prioridade
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('state')}
                  >
                    Estado
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Tempo SLA (h)</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('solved')}
                  >
                    Resolvido Eng.
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(insight)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewAnalysis(insight)}
                        >
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Incidente</DialogTitle>
            <DialogDescription>
              Informações completas sobre o incidente {selectedInsight?.incident_data.number}
            </DialogDescription>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Dados do Incidente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">{selectedInsight.incident_data.number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prioridade:</span>
                    <p className="font-medium">
                      {priorityLabels[selectedInsight.incident_data.priority]?.label || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">
                      {stateLabels[selectedInsight.incident_data.state] || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time de Atribuição:</span>
                    <p className="font-medium">{selectedInsight.incident_data.assignment_team}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">SLA de Engenharia</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entrada:</span>
                    <p className="font-medium">
                      {format(new Date(selectedInsight.engineering_sla.entry_time[0]), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saída:</span>
                    <p className="font-medium">
                      {format(new Date(selectedInsight.engineering_sla.out_time[0]), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tempo Total:</span>
                    <p className="font-medium">{(selectedInsight.engineering_sla.total_time / 60).toFixed(2)}h</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolvido por Eng:</span>
                    <p className="font-medium">
                      {selectedInsight.engineering_sla.solved_by_eng ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departamentos:</span>
                    <div className="mt-1 space-y-1">
                      {selectedInsight.engineering_sla.departaments.map((dept, idx) => (
                        <div key={idx} className="flex justify-between bg-muted/50 p-2 rounded">
                          <span>{dept.name || dept.sysId}</span>
                          <span className="font-medium">{(dept.totalTime / 60).toFixed(2)}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Escalação</h3>
                <div className="flex gap-2">
                  {selectedInsight.escalation['50_percent'] && (
                    <Badge variant="outline">50%</Badge>
                  )}
                  {selectedInsight.escalation['75_percent'] && (
                    <Badge variant="outline">75%</Badge>
                  )}
                  {selectedInsight.escalation['90_percent'] && (
                    <Badge variant="outline">90%</Badge>
                  )}
                  {!selectedInsight.escalation['50_percent'] &&
                    !selectedInsight.escalation['75_percent'] &&
                    !selectedInsight.escalation['90_percent'] && (
                      <span className="text-sm text-muted-foreground">Sem escalação</span>
                    )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Rastreabilidade</h3>
                <div className="text-sm">
                  <span className="text-muted-foreground">Organização:</span>
                  <p className="font-medium uppercase">{selectedInsight.traceability.organization}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Atuação do Heimdall</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedInsight.heimdall_actuation.change_criticity} disabled />
                    <span>Mudança de Criticidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedInsight.heimdall_actuation.close_by_analyse} disabled />
                    <span>Fechado por Análise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedInsight.heimdall_actuation.close_by_automation} disabled />
                    <span>Fechado por Automação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedInsight.heimdall_actuation.sla_management} disabled />
                    <span>Gestão de SLA</span>
                  </div>
                </div>
                {selectedInsight.heimdall_actuation.omsActuation && (
                  <div className="mt-4 p-3 bg-muted/50 rounded">
                    <h4 className="font-medium text-sm mb-2">OMS Actuation</h4>
                    <div className="space-y-1 text-sm">
                      {selectedInsight.heimdall_actuation.omsActuation.RejectedByMask && (
                        <p className="text-muted-foreground">Rejeitado por Máscara</p>
                      )}
                      {selectedInsight.heimdall_actuation.omsActuation.RejectedByIOP && (
                        <p>
                          <span className="text-muted-foreground">Rejeitado por IOP:</span>{' '}
                          <span className="font-medium">
                            {selectedInsight.heimdall_actuation.omsActuation.RejectedByIOP}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedInsight.comments && selectedInsight.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Comentários</h3>
                  <div className="space-y-3">
                    {selectedInsight.comments.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/40">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{comment.created_by}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInsight.work_notes && selectedInsight.work_notes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tramitação das Filas</h3>
                  <div className="space-y-3">
                    {selectedInsight.work_notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{note.created_by}</span>
                            {note.assignment_group && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {note.assignment_group}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{note.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Ações do ServiceNow</h3>
                
                <div className="space-y-4">
                  {/* Adicionar Comentário */}
                  <div className="space-y-2">
                    <Label htmlFor="comment">Adicionar Comentário</Label>
                    <Textarea
                      id="comment"
                      placeholder="Digite seu comentário aqui..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment} size="sm">
                      Adicionar Comentário
                    </Button>
                  </div>

                  {/* Alterar Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Alterar Status</Label>
                    <div className="flex gap-2">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger id="status" className="flex-1">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Novo</SelectItem>
                          <SelectItem value="2">Em Andamento</SelectItem>
                          <SelectItem value="3">Em Espera</SelectItem>
                          <SelectItem value="6">Resolvido</SelectItem>
                          <SelectItem value="7">Fechado</SelectItem>
                          <SelectItem value="8">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleUpdateStatus} size="sm">
                        Atualizar Status
                      </Button>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="space-y-2">
                    <Label>Ações Rápidas</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleCreateBug} variant="outline" size="sm">
                        Criar Bug
                      </Button>
                      <Button onClick={handleResolveIncident} variant="outline" size="sm">
                        Marcar como Resolvido
                      </Button>
                      <Button onClick={handleCloseIncident} variant="outline" size="sm">
                        Fechar Incidente
                      </Button>
                      <Button onClick={handleReassignIncident} variant="outline" size="sm">
                        Reatribuir Incidente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Análise do Incidente</DialogTitle>
            <DialogDescription>
              Análise detalhada do incidente {selectedInsight?.incident_data.number}
            </DialogDescription>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tempo de Resolução</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(selectedInsight.engineering_sla.total_time / 60).toFixed(2)}h
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Departamentos Envolvidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedInsight.engineering_sla.departaments.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Distribuição de Tempo por Departamento</h3>
                <div className="space-y-2">
                  {selectedInsight.engineering_sla.departaments.map((dept, idx) => {
                    const percentage = (dept.totalTime / selectedInsight.engineering_sla.total_time) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{dept.name || dept.sysId}</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Métricas de Desempenho</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Status de Resolução</span>
                    <Badge variant={selectedInsight.engineering_sla.solved_by_eng ? 'default' : 'secondary'}>
                      {selectedInsight.engineering_sla.solved_by_eng ? 'Resolvido' : 'Não Resolvido'}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Nível de Escalação</span>
                    <span className="font-medium">
                      {selectedInsight.escalation['90_percent']
                        ? '90%'
                        : selectedInsight.escalation['75_percent']
                        ? '75%'
                        : selectedInsight.escalation['50_percent']
                        ? '50%'
                        : 'Nenhum'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>Automação Aplicada</span>
                    <Badge variant={selectedInsight.heimdall_actuation.close_by_automation ? 'default' : 'outline'}>
                      {selectedInsight.heimdall_actuation.close_by_automation ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
