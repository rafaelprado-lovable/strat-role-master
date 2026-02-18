import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, CheckCircle, Clock, AlertTriangle, Zap, FileText, Bot, Target, Eye, FileSearch, CalendarIcon, X, ArrowUpDown, Search, ArrowRight,} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { departmentApi, incidentApi } from '@/services/mockApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Insight } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem,} from "@/components/ui/command"
import { BugDialog } from '@/components/incidents/BugDialog';

const priorityLabels: Record<string, { label: string; variant: 'destructive' | 'default' | 'secondary' }> = {
  '1': { label: 'Crítico', variant: 'destructive' },
  '2': { label: 'Alto', variant: 'destructive' },
  '3': { label: 'Médio', variant: 'default' },
  '4': { label: 'Baixo', variant: 'secondary' },
};

const stateLabels: Record<string, string> = {
  '1': 'Novo',
  '2': 'Em Progresso',
  '3': 'Em espera',
  '6': 'Resolvido',
  '7': 'Fechado',
};

function safeParseDateArray(arr: any): Date[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => (item?.$date ? new Date(item.$date) : null)).filter(Boolean) as Date[];
}

function normalizeEngineeringSla(sla: any) {
  return {
    entry_time: safeParseDateArray(sla?.entry_time),
    out_time: safeParseDateArray(sla?.out_time),
    pause_sla_time: safeParseDateArray(sla?.pause_sla_time),
    start_time: safeParseDateArray(sla?.start_time),
    solved_by_eng: sla?.solved_by_eng ?? false,
    total_time: sla?.total_time ?? 0,
    departaments: sla?.departaments ?? [],
  };
}

const formatDate = (d?: Date | null) => (d ? format(d, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '-');



/* ----------------------------
   Component
   ---------------------------- */

export default function Insights() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'state' | 'solved' | 'entry' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newDepartament, setDepartament] = useState('');
  const [newDepartamentSysId, setDepartamentSysId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]); // agora é lista
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);

  const [resolutionCode, setResolutionCode] = useState("");
  const [resolutionPlatform, setResolutionPlatform] = useState("");
  const [resolutionCause, setResolutionCause] = useState("");
  const [resolutionSubCause, setResolutionSubCause] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // data fetching
  const { data: insights = [] } = useQuery({ queryKey: ['insights'], queryFn: incidentApi.getAll });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentApi.getAll });
  const { toast } = useToast();

  // normalize once
  const normalizedInsights = useMemo(
    () => insights.map((insight) => ({ ...insight, engineering_sla: normalizeEngineeringSla(insight.engineering_sla) })),
    [insights]
  );

  // toggle department helper
  const toggleDepartment = useCallback((sysId: string) => {
    setSelectedDepartments((prev) => (prev.includes(sysId) ? prev.filter((s) => s !== sysId) : [...prev, sysId]));
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }, []);

  // filtered + sorted (memoized)
  const filteredInsights = useMemo(() => {
    const filtered = normalizedInsights.filter((insight) => {
      // date filter
      if (startDate || endDate) {
        const entryDate = insight.engineering_sla.entry_time?.[0];
        if (!entryDate) return false;
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
      }

      // department
      if (selectedDepartments.length > 0) {
        const insightDepts = insight.engineering_sla.departaments.map((d: any) => d.name || d.sysId);
        if (!insightDepts.some((dept: string) => selectedDepartments.includes(dept))) return false;
      }

      // status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(insight.incident_data.state)) return false;

      // search number
      if (searchNumber && !insight.incident_data.number.toLowerCase().includes(searchNumber.toLowerCase())) return false;

      return true;
    });

    if (!sortBy) return filtered;

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'priority') {
        comparison = parseInt(a.incident_data.priority) - parseInt(b.incident_data.priority);

      } else if (sortBy === 'state') {
        comparison = parseInt(a.incident_data.state) - parseInt(b.incident_data.state);

      } else if (sortBy === 'solved') {
        comparison = a.engineering_sla.solved_by_eng === b.engineering_sla.solved_by_eng
          ? 0
          : a.engineering_sla.solved_by_eng
          ? -1
          : 1;

      } else if (sortBy === 'entry') {
        const da = a.engineering_sla.entry_time?.[0] ? new Date(a.engineering_sla.entry_time[0]).getTime() : 0;
        const db = b.engineering_sla.entry_time?.[0] ? new Date(b.engineering_sla.entry_time[0]).getTime() : 0;
        comparison = da - db;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [normalizedInsights, startDate, endDate, selectedDepartments, selectedStatuses, searchNumber, sortBy, sortOrder]);

  const handleSort = useCallback((column: 'priority' | 'state' | 'solved' | 'entry') => {
    setSortBy((prev) => (prev === column ? prev : column));
    setSortOrder((prev) => (sortBy === column ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
  }, [sortBy]);

  const handleViewDetails = useCallback(async (insight: Insight) => {
    const merged = await incidentApi.getIncidentHistory(insight, departments);
    setNewStatus(insight.incident_data.state)
    setSelectedInsight(merged);
    setDetailsOpen(true);
  }, []);

  const handleViewAnalysis = useCallback((insight: Insight) => {
    setSelectedInsight(insight);
    setAnalysisOpen(true);
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um comentário.',
        variant: 'destructive',
      });
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("messageid", "123456");

    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const raw = JSON.stringify({
      "userId": userId,
      "incidentComment": newComment,
      "incidentNumber": selectedInsight.incident_data.number
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      Authorization: userToken
    };

    fetch("/v1/create/incident/comment", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

    toast({
      title: 'Comentário adicionado',
      description: `Comentário adicionado ao incidente ${selectedInsight?.incident_data.number}`,
    });
    setNewComment('');
    setDetailsOpen(false);
  };

  const handleUpdateAssignedTeam  = async () => {
    try {
      const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
      const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
      
      const response = await fetch(
        "/v1/change/incident/assignment/group",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userToken}`
          },
          body: JSON.stringify({
            userId: userId,
            assignmentGroup: newDepartamentSysId,
            incidentNumber: selectedInsight.incident_data.number,
          }),
        }
      );

      const data = await response.json();

      if(response.status == 200){
        toast({
          title: "Sucesso ao tramitar o incidente",
          description: `Tramitação do incidente ${selectedInsight?.incident_data.number} feita com sucesso`,
        });
        setDetailsOpen(false);

      }else{
        toast({
          title: "Falha ao tramitar o incidente",
          description: `Tramitação do incidente ${selectedInsight?.incident_data.number} falhou. Erro ${response.status}`,
        });
      }

    } catch (error) {
      toast({
        title: "Falha ao tramitar o incidente",
        description: `Tramitação do incidente ${selectedInsight?.incident_data.number} falhou. Erro ${error}`,
      });
      console.error("Erro ao atualizar:", error);
    }
  };

  const handleCreateBug = () => {
    setBugDialogOpen(true);
  };

  const handleResolveIncident = async () => {
    if (resolutionCode == ""){
      toast({
        title: "Erro!",
        description: `Preencha o código de resolução!`,
        variant: "destructive",
      });
      return;
    };
    if (resolutionPlatform == ""){
      toast({
        title: "Erro!",
        description: `Preencha a plataforma!`,
        variant: "destructive",
      });
      return;
    };
    if (resolutionCause == ""){
      toast({
        title: "Erro!",
        description: `Preencha a causa de resolução!`,
        variant: "destructive",
      });
      return;
    };
    if (resolutionSubCause == ""){
      toast({
        title: "Erro!",
        description: `Preencha a subcausa de resolução!`,
        variant: "destructive",
      });
      return;
    };
    if (resolutionNotes == ""){
      toast({
        title: "Erro!",
        description: `Preencha a nota de resolução!`,
        variant: "destructive",
      });
      return;
    };

    if (!selectedInsight) return;

    try {
      const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
      const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", `Bearer ${userToken}`);


      const raw = JSON.stringify({
        userId: userId,
        incidentNumber: selectedInsight.incident_data.number,
        closeCode: resolutionCode,
        platform: resolutionPlatform,
        cause: resolutionCause,
        subCause: resolutionSubCause,
        closeNotes: resolutionNotes
      });

      const requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
      };

      const response = await fetch(
        "http://10.151.1.54:8000/v1/resolve/incident",
        requestOptions
      );

      if (!response.ok) {
        throw new Error("Erro ao resolver incidente");
      }

      setDetailsOpen(false);
      toast({
        title: "Incidente resolvido",
        description: `Incidente ${selectedInsight.incident_data.number} marcado como resolvido`,
      });

    } catch (error) {
      console.error(error);

      toast({
        title: "Erro",
        description: "Não foi possível resolver o incidente.",
        variant: "destructive",
      });
    }
  };


  const handleSearch = async (text) => {
    setSearchTerm(text);
    setLoading(true);

    if (!text || text.length < 2) { 
      setSearchResults([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/v1/read/assignment/group?string=${text}`
      );

      const data = await res.json();
      const unique = Array.from(
        new Map(data.map(item => [item.sysId, item])).values()
      );

      setSearchResults(unique);

    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }

    setLoading(false);
  };



  const totalInsights = filteredInsights.length;
  const solvedByEng = filteredInsights.filter((i) => i.engineering_sla.solved_by_eng).length;
  const avgSlaTime = (filteredInsights.reduce((acc, i) => acc + i.engineering_sla.total_time, 0) / totalInsights) || 0;
  const scalated = filteredInsights.filter((i) => i.scalation['50_percent'] || i.scalation['75_percent'] || i.scalation['90_percent']).length;
  const changeCriticity = filteredInsights.filter((i) => i.heimdall_actuation.change_criticity).length;
  const closeByAnalyse = filteredInsights.filter((i) => i.heimdall_actuation.close_by_analyse).length;
  const closeByAutomation = filteredInsights.filter((i) => i.heimdall_actuation.close_by_automation).length;
  const slaManagement = filteredInsights.filter((i) => i.heimdall_actuation.sla_management).length;

  /* ----------------------------
     Render
     ---------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Incidentes</h1>
        <p className="text-muted-foreground">Visualização e análise de incidentes gerenciados pelo Heimdall</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            {/* Start */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* End */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDate(endDate) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Número do Incidente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por número..." value={searchNumber} onChange={(e) => setSearchNumber(e.target.value)} className="pl-8" />
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Departamentos</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedDepartments.length > 0 ? `${selectedDepartments.length} selecionado(s)` : 'Todos os departamentos'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="start">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedDepartments.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setSelectedDepartments([])}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar seleção
                      </Button>
                    )}
                    {departments.map((dept: any) => (
                      <div key={dept._id} className="flex items-center space-x-2">
                        <Checkbox id={dept._id} checked={selectedDepartments.includes(dept.sysId)} onCheckedChange={() => toggleDepartment(dept.sysId)} />
                        <Label htmlFor={dept.sysId} className="text-sm cursor-pointer">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedStatuses.length > 0 ? `${selectedStatuses.length} selecionado(s)` : 'Todos os status'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="start">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStatuses.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setSelectedStatuses([])}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar seleção
                      </Button>
                    )}
                    {Object.entries(stateLabels).map(([id, label]) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox id={id} checked={selectedStatuses.includes(id)} onCheckedChange={() => toggleStatus(id)} />
                        <Label htmlFor={id} className="text-sm cursor-pointer">
                          {label}
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

      {/* Metrics */}
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
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((solvedByEng / totalInsights) * 100) : 0}% do total</p>
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
            <div className="text-2xl font-bold">{scalated}</div>
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((scalated / totalInsights) * 100) : 0}% em escalação</p>
          </CardContent>
        </Card>

        {/* other metric cards kept as before... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acionamento de manager</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeCriticity}</div>
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((changeCriticity / totalInsights) * 100) : 0}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechado por Análise</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closeByAnalyse}</div>
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((closeByAnalyse / totalInsights) * 100) : 0}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechado por Automação</CardTitle>
            <Bot className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closeByAutomation}</div>
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((closeByAutomation / totalInsights) * 100) : 0}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestão de SLA</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaManagement}</div>
            <p className="text-xs text-muted-foreground">{totalInsights > 0 ? Math.round((slaManagement / totalInsights) * 100) : 0}% do total</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Incidentes <span className="text-muted-foreground">({totalInsights} incidentes)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número do Incidente</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleSort('priority')}>
                    Prioridade
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleSort('state')}>
                    Estado
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Tempo SLA (h)</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleSort('solved')}>
                    Resolvido Eng.
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Escalação</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleSort('entry')}>
                    Data de entrada
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsights.map((insight) => {
                const priority = priorityLabels[insight.incident_data.priority] || { label: 'Desconhecido', variant: 'default' as const };
                const state = stateLabels[insight.incident_data.state] || 'Desconhecido';
                const scalationBadges: string[] = [];
                if (insight.scalation['50_percent']) scalationBadges.push('50%');
                if (insight.scalation['75_percent']) scalationBadges.push('75%');
                if (insight.scalation['90_percent']) scalationBadges.push('90%');

                return (
                  <TableRow key={insight.id}>
                    <TableCell className="font-medium">{insight.incident_data.number}</TableCell>
                    <TableCell><Badge variant={priority.variant}>{priority.label}</Badge></TableCell>
                    <TableCell>{state}</TableCell>
                    <TableCell>{(insight.engineering_sla.total_time / 60).toFixed(2)}</TableCell>
                    <TableCell>{insight.engineering_sla.solved_by_eng ? <CheckCircle className="h-5 w-5 text-green-600" /> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      {scalationBadges.length > 0 ? (<div className="flex flex-wrap gap-1">{scalationBadges.map((badge) => (<Badge key={badge} variant="outline">{badge}</Badge>))}</div>) : (<span className="text-muted-foreground">-</span>)}
                    </TableCell>
                    <TableCell className="uppercase">{insight.traceability.organization}</TableCell>
                    <TableCell>{formatDate(insight.engineering_sla.entry_time?.[0])}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(insight)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleViewAnalysis(insight)}><FileSearch className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details dialog (trimmed content kept same but using helpers) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Incidente</DialogTitle>
            <DialogDescription>Informações completas sobre o incidente {selectedInsight?.incident_data.number}</DialogDescription>
          </DialogHeader>

          {selectedInsight && (
            <div className="space-y-6">
              {/* Incident data */}
              <div>
                <div className="grid grid-cols-1 gap-4 text-sm mb-12">
                  <h3 className="font-semibold mb-2">Dados do Incidente</h3>
                  <div>
                    <span className="text-muted-foreground">Descrição resumida:</span>
                    <p className="font-medium">{selectedInsight.shortDescription}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="font-medium">{selectedInsight.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-12">
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">{selectedInsight.incident_data.number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prioridade:</span>
                    <p className="font-medium">{priorityLabels[selectedInsight.incident_data.priority]?.label || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">{stateLabels[selectedInsight.incident_data.state] || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time de Atribuição:</span>
                    <p className="font-medium">{selectedInsight.assignment_team}</p>
                  </div>
                </div>
              </div>

              {selectedInsight.incident_data.state !== "7" && (
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

                    {/* Alterar Departamento (com busca) */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Alterar Departamento</Label>
                      <div className="flex gap-2">
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {newDepartament ? searchResults.find((g) => g.name === newDepartament)?.name : "Buscar equipe..."}
                              <ArrowRight className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0 w-[300px]">
                            <Command>
                              <CommandInput placeholder="Digite para buscar..." value={searchTerm} onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}/>

                              {loading && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Buscando...
                                </div>
                              )}

                              {!loading && searchResults.length === 0 && (
                                <CommandEmpty>Nenhum resultado encontrado</CommandEmpty>
                              )}

                              <CommandGroup>
                                {searchResults.map((item) => (
                                  <CommandItem
                                    key={item.sysId}
                                    value={item.name}
                                    onSelect={() => {
                                      setDepartament(item.name);
                                      setDepartamentSysId(item.sysId);
                                      setOpen(false);
                                    }}
                                  >
                                    {item.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <Button onClick={handleUpdateAssignedTeam} size="sm">
                          Atualizar Departamento
                        </Button>
                      </div>
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
                        { newStatus !== "6" && (
                          <Button size="sm">
                            Atualizar Status
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Campos extras se status = 6 (Resolvido) */}
                    {newStatus === "6" && selectedInsight.incident_data.state !== "6" && (
                      <div className="space-y-3 mt-4 border p-4 rounded-lg">
                        <Label>Informações adicionais para resolução</Label>

                        <div className="space-y-2">
                          <Label htmlFor="resolutionCode">Código da Resolução</Label>
                          <Select value={resolutionCode} onValueChange={setResolutionCode}>
                            <SelectTrigger id="resolutionCode" className="flex-1">
                              <SelectValue placeholder="Selecione o código de resolução" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solved">Solucionado (Contorno)</SelectItem>
                              <SelectItem value="solved2">Solucionado (Permanentemente)</SelectItem>
                              <SelectItem value="remotely">Solucionado Remotamente (Contorno)</SelectItem>
                              <SelectItem value="remotely2">Solucionado Remotamente (Permanentemente)</SelectItem>
                              <SelectItem value="reproducible">Não Solucionado (Não reproduzível)</SelectItem>
                              <SelectItem value="costly">Não Solucionado (Muito caro)</SelectItem>
                              <SelectItem value="caller">Encerrado/Solucionado pelo solicitante</SelectItem>
                              <SelectItem value="not_solved_not_applicable">Não Solucionado (Improcedente)</SelectItem>
                              <SelectItem value="Change_Execution_Scenario_Unfounded">Cenário de execução de change (Improcedente)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolutionPlatform">Plataforma</Label>
                          <Select value={resolutionPlatform} onValueChange={setResolutionPlatform}>
                            <SelectTrigger id="resolutionPlatform" className="flex-1">
                              <SelectValue placeholder="Selecione a plataforma" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PMID">PMID</SelectItem>
                              <SelectItem value="NMWS">NMWS</SelectItem>
                              <SelectItem value="DIGIBEE">DIGIBEE</SelectItem>
                              <SelectItem value="APIGEE">APIGEE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolutionCause">Causa</Label>
                          <Select value={resolutionCause} onValueChange={setResolutionCause}>
                            <SelectTrigger id="resolutionCause" className="flex-1">
                              <SelectValue placeholder="Selecione a causa" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALARME">ALARME</SelectItem>
                              <SelectItem value="Alerta de PMID">Alerta de PMID</SelectItem>
                              <SelectItem value="Alerta de NMWS">Alerta de NMWS</SelectItem>
                              <SelectItem value="Solicitação de análise">Solicitação de análise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolutionSubCause">Sub-Causa</Label>
                          <Select value={resolutionSubCause} onValueChange={setResolutionSubCause}>
                            <SelectTrigger id="resolutionSubCause" className="flex-1">
                              <SelectValue placeholder="Selecione a sub-causa" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Alerta Geral">Alerta Geral</SelectItem>
                              <SelectItem value="Erro gerado por Alarme nas camadas de INFRA ou Aplicação">Erro gerado por Alarme nas camadas de INFRA ou Aplicação</SelectItem>
                              <SelectItem value="Erro gerado por cenário identificado como BUG">Erro gerado por cenário identificado como BUG</SelectItem>
                              <SelectItem value="IMPROCEDENTE - ERRO OPERACIONAL">IMPROCEDENTE - ERRO OPERACIONAL</SelectItem>
                              <SelectItem value="IMPROCEDENTE - REGRA DE NEGÓCIO">IMPROCEDENTE - REGRA DE NEGÓCIO</SelectItem>
                              <SelectItem value="IMPROCEDENTE - SEM INTERVENÇÃO TÉCNICA">IMPROCEDENTE - SEM INTERVENÇÃO TÉCNICA</SelectItem>
                              <SelectItem value="Filas Rabbi">Filas Rabbi</SelectItem>
                              <SelectItem value="FILESYSTEM">FILESYSTEM</SelectItem>
                              <SelectItem value="nmws_monitor">nmws_monitor</SelectItem>
                              <SelectItem value="Processo">Processo</SelectItem>
                              <SelectItem value="Processo NMWS">Processo NMWS</SelectItem>
                              <SelectItem value="SWAP">SWAP</SelectItem>
                              <SelectItem value="ULOG">ULOG</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resolutionNotes">Nota de resolução</Label>
                          <Textarea
                            id="resolutionNotes"
                            placeholder="Informação de resolução"
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Button onClick={handleResolveIncident} size="sm" className="w-full">
                            Resolver incidente
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Campos extras se status = 3 (Espera) */}
                    {newStatus === "3" && selectedInsight.incident_data.state !== "3" && (
                      <div className="space-y-3 mt-4 border p-4 rounded-lg">
                        <Label>Informações para colocar o incidente em espera</Label>

                        <div className="space-y-2">
                          <Label htmlFor="waitingWhy">Código da Resolução</Label>
                          <Select>
                            <SelectTrigger id="waitingWhy" className="flex-1">
                              <SelectValue placeholder="Selecione o código de resolução" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Aguardando solução do incidente pai</SelectItem>
                              <SelectItem value="2">Aguardando automação</SelectItem>
                              <SelectItem value="3">Aguardando Solicitante</SelectItem>
                              <SelectItem value="4">Aguardando Mudança</SelectItem>
                              <SelectItem value="5">Aguardando Evento</SelectItem>
                              <SelectItem value="6">Aguardando Problema</SelectItem>
                              <SelectItem value="7">Aguardando requisição</SelectItem>
                              <SelectItem value="8">Aguardando Fornecedor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>


                        <div className="space-y-2">
                          <Button size="sm" className="w-full">
                            Alterar status
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Ações Rápidas */}
                    <div className="space-y-2">
                      <Label>Ações Rápidas</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleCreateBug} variant="outline" size="sm">
                          Criar Bug
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Department trammit */}
              {selectedInsight.departamentTrammit && selectedInsight.departamentTrammit.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tramitação das Filas</h3>
                  <div className="space-y-3">
                    {selectedInsight.departamentTrammit.map((note, idx) => (
                      <div key={idx} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{note.userName} alterou a fila do incidente:</span>
                            {note.oldname && <Badge variant="secondary" className="ml-2 text-xs">{note.oldname}</Badge>}
                            {note.oldname && note.newname && <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />}
                            {note.newname && <Badge variant="secondary" className="ml-2 text-xs">{note.newname}</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{note.datetime}</span>
                        </div>
                        <p className="text-sm text-foreground">{note.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {selectedInsight.comments && selectedInsight.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Comentários</h3>
                  <div className="space-y-3">
                    {selectedInsight.comments.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/40">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">{comment.datetime}</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work notes */}
              {selectedInsight.work_notes && selectedInsight.work_notes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Work Notes</h3>
                  <div className="space-y-3">
                    {selectedInsight.work_notes.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/40">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">{comment.data_time}</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close notes */}
              {selectedInsight.closeNotes && selectedInsight.closeNotes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Notas de resolução</h3>
                  <div className="space-y-3">
                    {selectedInsight.closeNotes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/40">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{note.userName}</span>
                          <span className="text-xs text-muted-foreground">{note.datetime}</span>
                        </div>
                        <p className="text-sm text-foreground">{note.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bug Creation Dialog */}
      <BugDialog
        open={bugDialogOpen}
        onOpenChange={setBugDialogOpen}
        incident={selectedInsight || undefined}
      />

    </div>
  );
}
