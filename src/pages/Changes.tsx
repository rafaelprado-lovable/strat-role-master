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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CheckSquare, Eye, Send, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Change {
  id: string;
  numero: string;
  descricao: string;
  dataExecucao: string;
  sistema: string;
  status: string;
  changeformAnexado: boolean;
  preAnalise: boolean;
}

const mockChanges: Change[] = [
  {
    id: "1",
    numero: "CHG0173972",
    descricao: "Projeto HUB - Liberação de clientid e criação de rota interna - API Detalhamento de produtos",
    dataExecucao: "17/11/2025 22:00:00",
    sistema: "Autorizar",
    status: "PMID",
    changeformAnexado: true,
    preAnalise: true,
  },
  {
    id: "2",
    numero: "CHG0174528",
    descricao: "Projeto HUB - Liberação da nova API de recarga do TIMWE",
    dataExecucao: "17/11/2025 22:00:00",
    sistema: "Autorizar",
    status: "PMID",
    changeformAnexado: false,
    preAnalise: true,
  },
  {
    id: "3",
    numero: "CHG0174549",
    descricao: "[DM25863179 RSA ] - Otimização de Fluxo de Aprovisionamento RSA - ID 6993.",
    dataExecucao: "09/12/2025 23:00:00",
    sistema: "Novo",
    status: "NMWS",
    changeformAnexado: false,
    preAnalise: true,
  },
  {
    id: "4",
    numero: "CHG0174551",
    descricao: "[DM25863179 RSA ] - Otimização de Fluxo de Aprovisionamento RSA",
    dataExecucao: "10/12/2025 00:00:00",
    sistema: "Novo",
    status: "PMID",
    changeformAnexado: false,
    preAnalise: true,
  },
  {
    id: "5",
    numero: "CHG0175151",
    descricao: "Projeto HUB - Liberação de clientid na API r-access-data (ABR)",
    dataExecucao: "18/11/2025 22:00:00",
    sistema: "Autorizar",
    status: "PMID",
    changeformAnexado: false,
    preAnalise: true,
  },
];

export default function Changes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredChanges = mockChanges.filter(
    (change) =>
      change.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.sistema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChanges = filteredChanges.slice(startIndex, endIndex);

  const handlePreAnalise = (numero: string) => {
    toast.success(`Pré-análise realizada para ${numero}`);
  };

  const handleVisualizar = (numero: string) => {
    toast.info(`Visualizando change ${numero}`);
  };

  const handleEnviarRelatorio = (numero: string) => {
    toast.success(`Relatório enviado para ${numero}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pré validação de changes - MIDDLEWARE</h2>
          <p className="text-muted-foreground">Gerencie e valide changes do sistema middleware</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, descrição ou sistema..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Changes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as changes cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data Execução</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Changeform</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
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
                    <TableRow key={change.id}>
                      <TableCell className="font-medium">{change.numero}</TableCell>
                      <TableCell className="max-w-md">{change.descricao}</TableCell>
                      <TableCell className="whitespace-nowrap">{change.dataExecucao}</TableCell>
                      <TableCell>{change.sistema}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{change.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={change.changeformAnexado ? "default" : "destructive"}>
                          {change.changeformAnexado ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreAnalise(change.numero)}
                            title="Pré-análise"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVisualizar(change.numero)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEnviarRelatorio(change.numero)}
                            title="Enviar relatório"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredChanges.length > itemsPerPage && (
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
      </div>
  );
}
