import { useCallback, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangeDetailsDialog } from "@/components/changes/ChangeDetailsDialog";
import { changesApi, departmentApi } from '@/services/mockApi';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CheckSquare, Eye, Send, Search, CalendarIcon, X, Users, FileText} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Changes } from '@/types';


export default function ChangesPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChange, setSelectedChange] = useState<Changes | null>(null);

  const itemsPerPage = 10;

  const { data: changes = [] } = useQuery({
    queryKey: ['changes'],
    queryFn: changesApi.getPreChanges
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll
  });

  const stateLabels: Record<string, string> = {
    'Novo': 'Novo',
    'Avaliar': 'Avaliar',
    'Autorizar': 'Autorizar',
  };

  const toggleDepartment = (id: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleStatus = (id: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleVisualizar = (change: Changes) => {
    console.log(change)
    setSelectedChange(change);
    setDetailsOpen(true);
  };

  const filteredChanges = useMemo(() => {
    return changes.filter((c: Changes) => {
      const cs = c.changeSystemData;
      if (!cs) return false;

      // --- Número sempre tratado como string segura ---
      const number = typeof cs.number === "string" ? cs.number.toLowerCase() : "";

      // --- Busca também segura ---
      const search = searchNumber.toLowerCase();

      // --- FILTRO POR NÚMERO (agora aceita letras sem erro) ---
      if (searchNumber && !number.includes(search)) {
        return false;
      }

      // --- FILTRO POR DEPARTAMENTOS ---
      const teams = Array.isArray(cs.teams_involved_in_validation)
        ? cs.teams_involved_in_validation
        : [];

      if (selectedDepartments.length > 0) {
        const match = teams.some((team) => selectedDepartments.includes(team));
        if (!match) return false;
      }

      // --- FILTRO POR STATUS ---
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(cs.state)) return false;
      }

      return true;
    });
  }, [
    changes,
    startDate,
    endDate,
    searchNumber,
    selectedDepartments,
    selectedStatuses,
  ]);


  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredChanges.slice(start, start + itemsPerPage);

  const handlePreAnalise = (numero: string) => toast.success(`Pré-análise realizada para ${numero}`);
  const handleEnviarRelatorio = (numero: string) => toast.success(`Relatório enviado para ${numero}`);

  const handleUpdateChange = (updated: Changes) => {
    setSelectedChange(updated);
  };

  const formatDate = (date?: Date) =>
    date ? date.toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">

            {/* Data Início */}
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDate(endDate) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Número da Change */}
            <div className="space-y-2">
              <Label>Número da Change</Label>
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

            {/* Departamentos */}
            <div className="space-y-2">
              <Label>Departamentos</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedDepartments.length > 0
                      ? `${selectedDepartments.length} selecionado(s)`
                      : "Todos os departamentos"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedDepartments.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedDepartments([])}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar seleção
                      </Button>
                    )}

                    {departments.map((dept) => (
                      <div key={dept._id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedDepartments.includes(dept.name)}
                          onCheckedChange={() => toggleDepartment(dept.name)}
                        />
                        <Label>{dept.name}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedStatuses.length > 0
                      ? `${selectedStatuses.length} selecionado(s)`
                      : "Todos os status"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStatuses.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedStatuses([])}>
                        <X className="mr-2 h-4 w-4" />
                        Limpar seleção
                      </Button>
                    )}

                    {Object.keys(stateLabels).map((state) => (
                      <div key={state} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedStatuses.includes(state)}
                          onCheckedChange={() => toggleStatus(state)}
                        />
                        <Label>{state}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Timeline de Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Changes</CardTitle>
          <CardDescription>
            Visualização cronológica das changes para o período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-screen max-w-screen max-h-[70vh] max-w-[162vh] overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 pb-4">
              {filteredChanges.length === 0 ? (
                <div className="w-full text-center py-8 text-muted-foreground">
                  Nenhuma change encontrada para o período
                </div>
              ) : (
                filteredChanges.map((change, index) => {
                 
                  return (
                    <div key={change.changeSystemData.number} className="relative flex flex-col items-center">
                      {/* Timeline connector */}
                      {index < filteredChanges.length - 1 && (
                        <div className="absolute top-4 left-[calc(50%+80px)] w-8 h-0.5 bg-border" />
                      )}
                      
                      {/* Timeline dot */}
                      <div className="w-3 h-3 rounded-full bg-primary mb-3 z-10" />
                      
                      {/* Change Card */}
                      <Card 
                        className="w-[280px] cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
                        onClick={() => handleVisualizar(change)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {change.changeSystemData.number}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {change.changeSystemData.state}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {change.changeSystemData.start_date} - {change.changeSystemData.week_day}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>Descrição</span>
                            </div>
                            <p className="text-sm line-clamp-2">{change.changeSystemData.description}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Equipe na Implementação</span>
                            </div>
                            <p className="text-xs line-clamp-2 text-muted-foreground">
                              {change.changeSystemData.teams_involved_in_execution || "Não informado"}
                            </p>
                          </div>
                        
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* TABELA */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Changes</CardTitle>
          <CardDescription>Visualize e gerencie todas as changes para avaliação</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Execução</TableHead>
                <TableHead>Equipes Aplicação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentItems.map((c) => (
                <TableRow key={c.changeSystemData.number}>
                  <TableCell>{c.changeSystemData.number}</TableCell>
                  <TableCell>{c.changeSystemData.description}</TableCell>
                  <TableCell>{c.changeSystemData.start_date}</TableCell>
                  <TableCell>{c.changeSystemData.teams_involved_in_execution.join(", ")}</TableCell>
                  <TableCell>
                    <Badge>{c.changeSystemData.state}</Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center gap-2">

                      <Button variant="ghost" size="icon" onClick={() => handleVisualizar(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleEnviarRelatorio(c.changeSystemData.number)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {currentItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma change encontrada para avaliação
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={currentPage === 1 ? "opacity-50 pointer-events-none" : ""}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={page === currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    className={currentPage === totalPages ? "opacity-50 pointer-events-none" : ""}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {selectedChange && (
        <ChangeDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          change={selectedChange}
          onUpdateChange={handleUpdateChange}
        />
      )}
    </div>
  );
}
