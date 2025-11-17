import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CheckSquare, Eye, Send } from "lucide-react";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState("mostrando");
  const itemsPerPage = 5;

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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Pré validação de changes - MIDDLEWARE
        </h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="mostrando">Mostrando</TabsTrigger>
            <TabsTrigger value="registros">registros</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">NÚMERO DA CHANGE</TableHead>
              <TableHead className="min-w-[300px]">DESCRIÇÃO RESUMIDA</TableHead>
              <TableHead className="w-[150px]">DATA DA EXECUÇÃO</TableHead>
              <TableHead className="w-[100px]">SISTEMA</TableHead>
              <TableHead className="w-[100px]">STATUS</TableHead>
              <TableHead className="w-[140px]">CHANGEFORM ANEXADO</TableHead>
              <TableHead className="w-[100px]">PRÉ ANÁLISE</TableHead>
              <TableHead className="w-[140px]">VISUALIZAR CHANGE</TableHead>
              <TableHead className="w-[140px]">ENVIAR RELATÓRIO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="font-medium">{change.numero}</TableCell>
                <TableCell>{change.descricao}</TableCell>
                <TableCell>{change.dataExecucao}</TableCell>
                <TableCell>{change.sistema}</TableCell>
                <TableCell>{change.status}</TableCell>
                <TableCell className="text-center">
                  {change.changeformAnexado ? "Sim" : "Não"}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePreAnalise(change.numero)}
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVisualizar(change.numero)}
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEnviarRelatorio(change.numero)}
                    className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando de {startIndex + 1} a {Math.min(endIndex, filteredChanges.length)} do total de{" "}
          {filteredChanges.length} registros
        </p>

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
                className={
                  currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
