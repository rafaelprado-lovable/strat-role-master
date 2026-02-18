import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { changesApi } from '@/services/mockApi';
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Search, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChangeInExecutionDetailsDialog } from "@/components/changes/ChangeInExecutionDetailsDialog";
import { useNavigate } from "react-router-dom";
import ChangeExecutionCep from "./ChangeExecutionCep";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Task {
  id: string;
  numeroTarefa: string;
  descricaoTarefa: string;
  tipoTarefa: string;
  statusTarefa: string;
}

interface ChangeInExecution {
  changeSystemData: {
      number: string,
      description: string,
      teams_involved_in_execution: string[],
      teams_involved_in_validation: string[],
      start_date: string,
      end_date: string,
      week_day: string,
      state: string
  };
  postChangeData: {
      applicationStatus: string
  },
  changeTestData: {
    fqa: string,
    uat: string,
    system_test: string,
    no_test: string,
  },
  changeAproovalData: {
    tecnology: string,
    restart_type: boolean,
    new_service: boolean,
    old_service: boolean,
    increase_volume: boolean,
    validation_time: string,
    validation_process: string,
    hdc_validation: boolean,
    validator_contact: string[],
  }
  changeHistory: {
    comments_work_notes: string[],
    comments: string[],
    timelineAprooval: string[],
    rejectionAprooval: string[]
  },
  changeServicesList: Array<{
    service_name: string,
    cf_production_version: string,
    implementation_version: string,
    pipeline_link: string
  }>,
  serviceTimeline?: {
    today: any[];
    lastWeek?: any[];
  };
  cepsInclude?: any[];
  cepsExclude?: any[];
  [key: string]: any;
}

const mockChangesInExecution: ChangeInExecution[] = [];

export default function ChangesInExecution() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [numeroFilter, setNumeroFilter] = useState<string>("all");
  const [descricaoFilter, setDescricaoFilter] = useState<string>("all");
  const [fimExecucaoFilter, setFimExecucaoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChange, setSelectedChange] = useState<ChangeInExecution | null>(null);
  const [executingChange, setExecutingChange] = useState<ChangeInExecution | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const itemsPerPage = 10;

  const { data: changes = [] } = useQuery({
    queryKey: ['changes'],
    queryFn: changesApi.getExecutionChanges
  });


  const filteredChanges = changes.filter((change) => {
    const matchesSearch =
      change.changeSystemData.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.changeSystemData.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNumero = numeroFilter === "all" || change.changeSystemData.number === numeroFilter;
    const matchesDescricao = descricaoFilter === "all" || change.changeSystemData.description.includes(descricaoFilter);
    const matchesFimExecucao = fimExecucaoFilter === "all" || change.changeSystemData.end_date === fimExecucaoFilter;
    const matchesStatus = statusFilter === "all" || change.changeSystemData.state === statusFilter;

    return matchesSearch && matchesNumero && matchesDescricao && matchesFimExecucao && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChanges = filteredChanges.slice(startIndex, endIndex);

  const handleConsultarDados = (change: ChangeInExecution) => {
    setSelectedChange(change);
    setDetailsOpen(true);
  };

  const handleExecutar = (change: ChangeInExecution) => {
    console.log(change);

    if (change?.changeAproovalData?.tecnology?.toLowerCase() === "nmws") {
      setExecutingChange(change);

    } else {
      setExecutingChange(change);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Changes em execução</h2>
          <p className="text-muted-foreground">Mostrando {filteredChanges.length} registros</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search:"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Número da Change */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Número da Change</label>
              <Select value={numeroFilter} onValueChange={setNumeroFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os números" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os números</SelectItem>
                  {mockChangesInExecution.map((change) => (
                    <SelectItem key={change.id} value={change?.changeSystemData?.number}>
                      {change?.changeSystemData?.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Select value={descricaoFilter} onValueChange={setDescricaoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as descrições" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as descrições</SelectItem>
                  <SelectItem value="HUB">Projeto HUB</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fim da Execução */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fim da Execução</label>
              <Select value={fimExecucaoFilter} onValueChange={setFimExecucaoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="17/11/2025 23:00:00">17/11/2025 23:00:00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Em execução">Em execução</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Changes em Execução</CardTitle>
          <CardDescription>
            Visualize todas as changes que estão sendo executadas no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NÚMERO DA CHANGE</TableHead>
                <TableHead>DESCRIÇÃO RESUMIDA</TableHead>
                <TableHead>FIM DA EXECUÇÃO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-center">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentChanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Não há dados a serem exibidos
                  </TableCell>
                </TableRow>
              ) : (
                currentChanges.map((change, index) => (
                  <TableRow key={change.changeSystemData?.number || index}>
                    <TableCell className="font-medium">{change?.changeSystemData?.number}</TableCell>
                    <TableCell>{change.changeSystemData.description}</TableCell>
                    <TableCell className="whitespace-nowrap">{change.changeSystemData?.end_date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{change.changeSystemData?.state}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConsultarDados(change)}
                          title="Consultar dados"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecutar(change)}
                          title="Executar change"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Executar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredChanges.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando de {startIndex} a {Math.min(endIndex, filteredChanges.length)} do total de {filteredChanges.length} registros
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedChange && (
        <ChangeInExecutionDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          change={selectedChange as any}
        />
      )}

      <Dialog open={!!executingChange} onOpenChange={() => setExecutingChange(null)}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0">
          {executingChange && (
            <ChangeExecutionCep change={executingChange as any} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
