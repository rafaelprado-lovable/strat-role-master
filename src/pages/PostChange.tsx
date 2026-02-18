import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { changesApi } from '@/services/mockApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,} from "@/components/ui/pagination";
import { CalendarIcon, Search, Eye, FileText, Users, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PostChangeDetailsDialog, PostChange } from "@/components/changes/PostChangeDetailsDialog";

// Mock data for executed changes


const PostChangePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChange, setSelectedChange] = useState<PostChange | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const itemsPerPage = 10;

  const { data: changes = [] } = useQuery({
    queryKey: ['changes'],
    queryFn: changesApi.getPostChanges
  });

  const filteredChanges = changes.filter((change) => {
    const matchesSearch =
      change.changeSystemData.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.changeSystemData.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change?.changeAproovalData?.tecnology?.toLowerCase().includes(searchTerm.toLowerCase());

    const changeDate = new Date(change.changeSystemData.start_date.split(" ")[0].split("/").reverse().join("-"));
    const matchesStartDate = !startDate || changeDate >= startDate;
    const matchesEndDate = !endDate || changeDate <= endDate;

    const matchesPlatform = platformFilter === "all" || change.changeAproovalData.tecnology === platformFilter;
    const matchesStatus = statusFilter === "all" || change?.postChangeData?.applicationStatus === statusFilter;

    return matchesSearch && matchesStartDate && matchesEndDate && matchesPlatform && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChanges = filteredChanges.slice(startIndex, endIndex);

  const handleVisualizar = (change: PostChange) => {
    setSelectedChange(change);
    setDetailsOpen(true);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pós Change</h2>
          <p className="text-muted-foreground">Análise de execução e taxa de sucesso das changes</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Data de Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
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

            {/* Data de Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
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

            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Número da Change</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Plataforma */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as plataformas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as plataformas</SelectItem>
                  <SelectItem value="PMID">PMID</SelectItem>
                  <SelectItem value="NMWS">NMWS</SelectItem>
                  <SelectItem value="VAS">VAS</SelectItem>
                  <SelectItem value="INFOBUS">INFOBUS</SelectItem>
                  <SelectItem value="SAP-BASIS">SAP-BASIS</SelectItem>
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
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Changes Executadas</CardTitle>
          <CardDescription>
            Visualização cronológica das changes executadas no período
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
                  const parsedDate = change.changeSystemData.start_date.split(" ")[0].split("/");
                  const formattedDate = `${parsedDate[0]}/${parsedDate[1]}/${parsedDate[2]}`;
                  
                  return (
                      <div key={change.changeSystemData.number} className="relative flex flex-col items-center">
                        {index < filteredChanges.length - 1 && (
                          <div className="absolute top-4 left-[calc(50%+80px)] w-8 h-0.5 bg-border" />
                        )}

                        {/* Bolinha */}
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mb-3 z-10",
                            !status
                              ? "bg-muted"
                              : status === "sucesso"
                                ? "bg-green-500"
                                : "bg-destructive"
                          )}
                        />

                        {/* Card */}
                        <Card
                          className={cn(
                            "w-[280px] cursor-pointer transition-colors flex-shrink-0",
                            !status
                              ? "hover:border-muted-foreground/30 border-muted"
                              : status === "sucesso"
                                ? "hover:border-green-500/50"
                                : "hover:border-destructive/50 border-destructive/30"
                          )}
                          onClick={() => handleVisualizar(change)}
                        >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {change.changeSystemData.number}
                            </Badge>
                            <Badge
                              variant={
                                change?.postChangeData?.applicationStatus
                                  ? change.postChangeData.applicationStatus === "sucesso"
                                    ? "default"
                                    : "destructive"
                                  : "secondary"
                              }
                            >
                              {change?.postChangeData?.applicationStatus
                                ? change.postChangeData.applicationStatus === "sucesso"
                                  ? "Sucesso"
                                  : "Rollback"
                                : "Sem informação"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formattedDate} - {change.changeAproovalData.tecnology}
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
                          
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {!change?.postChangeData?.applicationStatus ? (
                              <MinusCircle className="h-4 w-4 text-muted-foreground" />
                            ) : change.postChangeData.applicationStatus === "sucesso" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
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


      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listagem de Changes Executadas</CardTitle>
          <CardDescription>
            Detalhamento de todas as changes executadas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NÚMERO</TableHead>
                <TableHead>DESCRIÇÃO</TableHead>
                <TableHead>PLATAFORMA</TableHead>
                <TableHead>DATA EXECUÇÃO</TableHead>
                <TableHead>TEMPO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentChanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma change encontrada
                  </TableCell>
                </TableRow>
              ) : (
                currentChanges.map((change) => (
                  <TableRow key={change.changeSystemData.number}>
                    <TableCell className="font-mono font-medium">{change.changeSystemData.number}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{change.changeSystemData.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{change.changeAproovalData.tecnology}</Badge>
                    </TableCell>
                    <TableCell>{change.changeSystemData.start_date.split(" ")[0]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          change?.postChangeData?.applicationStatus
                            ? change.postChangeData.applicationStatus === "sucesso"
                              ? "default"
                              : "destructive"
                            : "secondary"
                        }
                      >
                        {change?.postChangeData?.applicationStatus
                          ? change.postChangeData.applicationStatus === "sucesso"
                            ? "Sucesso"
                            : "Rollback"
                          : "Sem informação"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVisualizar(change)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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

      {/* Footer */}
      <div className="text-right text-sm text-muted-foreground">
        Atualização: {format(new Date(), "dd/MM", { locale: ptBR })}
      </div>

      {/* Details Dialog */}
      {selectedChange && (
        <PostChangeDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          change={selectedChange}
        />
      )}
    </div>
  );
};

export default PostChangePage;
