import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChangeInExecution {
  id: string;
  numero: string;
  descricaoResumida: string;
  fimExecucao: string;
  status: string;
}

const mockChangesInExecution: ChangeInExecution[] = [
  {
    id: "1",
    numero: "CHG0173972",
    descricaoResumida: "Projeto HUB - Liberação de clientid",
    fimExecucao: "17/11/2025 23:00:00",
    status: "Em execução",
  },
  {
    id: "2",
    numero: "CHG0174528",
    descricaoResumida: "Projeto HUB - API TIMWE",
    fimExecucao: "17/11/2025 23:00:00",
    status: "Em execução",
  },
];

export default function ChangesInExecution() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [numeroFilter, setNumeroFilter] = useState<string>("all");
  const [descricaoFilter, setDescricaoFilter] = useState<string>("all");
  const [fimExecucaoFilter, setFimExecucaoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 10;

  const filteredChanges = mockChangesInExecution.filter((change) => {
    const matchesSearch =
      change.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.descricaoResumida.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNumero = numeroFilter === "all" || change.numero === numeroFilter;
    const matchesDescricao = descricaoFilter === "all" || change.descricaoResumida.includes(descricaoFilter);
    const matchesFimExecucao = fimExecucaoFilter === "all" || change.fimExecucao === fimExecucaoFilter;
    const matchesStatus = statusFilter === "all" || change.status === statusFilter;

    return matchesSearch && matchesNumero && matchesDescricao && matchesFimExecucao && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChanges = filteredChanges.slice(startIndex, endIndex);

  const handleConsultarDados = (numero: string) => {
    console.log("Consultar dados:", numero);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Changes em execução</h2>
          <p className="text-muted-foreground">Mostrando {filteredChanges.length} registros</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search:"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
                <TableHead className="text-center">CONSULTAR DADOS</TableHead>
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
                currentChanges.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="font-medium">{change.numero}</TableCell>
                    <TableCell>{change.descricaoResumida}</TableCell>
                    <TableCell className="whitespace-nowrap">{change.fimExecucao}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{change.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleConsultarDados(change.numero)}
                        title="Consultar dados"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={numeroFilter} onValueChange={setNumeroFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Número da change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os números</SelectItem>
                {mockChangesInExecution.map((change) => (
                  <SelectItem key={change.id} value={change.numero}>
                    {change.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={descricaoFilter} onValueChange={setDescricaoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Descrição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as descrições</SelectItem>
                <SelectItem value="HUB">Projeto HUB</SelectItem>
                <SelectItem value="API">API</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fimExecucaoFilter} onValueChange={setFimExecucaoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fim da execução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="17/11/2025 23:00:00">17/11/2025 23:00:00</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em execução">Em execução</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
    </div>
  );
}
