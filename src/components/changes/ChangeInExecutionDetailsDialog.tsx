import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, CheckCircle, XCircle, Download, Play } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  numeroTarefa: string;
  descricaoTarefa: string;
  tipoTarefa: string;
  statusTarefa: string;
}

interface ValidationLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

interface ChangeInExecutionDetails {
  id: string;
  numero: string;
  tipo: string;
  descricaoChange: string;
  inicioValidacao: string;
  fimValidacao: string;
  diaSemana: string;
  equipesAplicacao: string;
  equipesValidacao: string;
  tarefas: Task[];
  validacaoInsercao?: {
    logs: ValidationLog[];
    status: "pending" | "running" | "success" | "error";
  };
  validacaoExclusao?: {
    logs: ValidationLog[];
    status: "pending" | "running" | "success" | "error";
  };
}

interface ChangeInExecutionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: ChangeInExecutionDetails;
}

export function ChangeInExecutionDetailsDialog({
  open,
  onOpenChange,
  change,
}: ChangeInExecutionDetailsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExclusaoRunning, setIsExclusaoRunning] = useState(false);
  const itemsPerPage = 10;

  // Mock logs para demonstração - serão substituídos por dados reais
  const mockInsercaoLogs: ValidationLog[] = change.validacaoInsercao?.logs || [
    { timestamp: "30/01/2026 00:03:25", message: "Inclusão iniciada", type: "info" },
    { timestamp: "30/01/2026 00:03:25", message: "Inclusão finalizada", type: "info" },
    { timestamp: "30/01/2026 00:03:25", message: "Sucesso na validação da change!", type: "success" },
  ];

  const filteredTasks = change.tarefas.filter((task) =>
    task.numeroTarefa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.descricaoTarefa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const handleFecharSucesso = (numeroTarefa: string) => {
    toast.success(`Tarefa ${numeroTarefa} fechada como sucesso`);
  };

  const handleFecharRollback = (numeroTarefa: string) => {
    toast.error(`Tarefa ${numeroTarefa} fechada como rollback`);
  };

  const handleDownloadLogs = () => {
    const logContent = mockInsercaoLogs
      .map((log) => `[${log.timestamp}] ${log.message}`)
      .join("\n");
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${change.numero}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo de logs baixado com sucesso");
  };

  const handleIniciarValidacaoExclusao = () => {
    setIsExclusaoRunning(true);
    toast.info("Validação de exclusão iniciada...");
    // Simula execução
    setTimeout(() => {
      setIsExclusaoRunning(false);
      toast.success("Validação de exclusão finalizada");
    }, 3000);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "encerrado":
        return "destructive";
      case "pendente":
        return "secondary";
      case "implementação":
        return "default";
      case "revisão":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getLogColor = (type: ValidationLog["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {change.numero} - {change.tipo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Change */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Número da change
                  </label>
                  <p className="mt-1 text-base">{change.numero}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Descrição da change
                  </label>
                  <p className="mt-1 text-base">{change.descricaoChange}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Início da validação
                  </label>
                  <p className="mt-1 text-base">{change.inicioValidacao}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fim da validação
                  </label>
                  <p className="mt-1 text-base">{change.fimValidacao}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dia da semana
                  </label>
                  <p className="mt-1 text-base">{change.diaSemana}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Equipes envolvidas na aplicação
                  </label>
                  <p className="mt-1 text-base">{change.equipesAplicacao}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Equipes envolvidas na validação
                  </label>
                  <p className="mt-1 text-base">{change.equipesValidacao}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validação da change (Inserção) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validação da change (Inserção)</h3>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-0">
                <ScrollArea className="h-48">
                  <div className="p-4 font-mono text-sm">
                    {mockInsercaoLogs.map((log, index) => (
                      <div key={index} className={getLogColor(log.type)}>
                        {log.type === "success" && "✅ "}
                        {log.type === "info" && `Inclusão ${log.message.includes("iniciada") ? "iniciada" : "finalizada"}: `}
                        {log.type === "info" ? log.timestamp : log.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Button 
              onClick={handleDownloadLogs}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar arquivo de logs
            </Button>
          </div>

          {/* Validação da change (Exclusão) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validação da change (Exclusão)</h3>
            <Button 
              onClick={handleIniciarValidacaoExclusao}
              disabled={isExclusaoRunning}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isExclusaoRunning ? (
                <>Executando validação...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar validação
                </>
              )}
            </Button>
          </div>

          {/* Tarefas da change */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tarefas da change</h3>
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

            <p className="text-sm text-muted-foreground mb-4">
              Mostrando {filteredTasks.length} registros
            </p>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NÚMERO DA TAREFA</TableHead>
                      <TableHead>DESCRIÇÃO DA TAREFA</TableHead>
                      <TableHead>TIPO DA TAREFA</TableHead>
                      <TableHead>STATUS DA TAREFA</TableHead>
                      <TableHead className="text-center">FECHAR TAREFA COMO SUCESSO</TableHead>
                      <TableHead className="text-center">FECHAR TAREFA COMO ROLLBACK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma tarefa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.numeroTarefa}</TableCell>
                          <TableCell>{task.descricaoTarefa}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.tipoTarefa}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(task.statusTarefa)}>
                              {task.statusTarefa}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFecharSucesso(task.numeroTarefa)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tarefa encerrada
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFecharRollback(task.numeroTarefa)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Tarefa encerrada
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {filteredTasks.length > itemsPerPage && (
                  <div className="p-4 flex items-center justify-between border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando de {startIndex + 1} a {Math.min(endIndex, filteredTasks.length)} do total de {filteredTasks.length} registros
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
                          <span className="px-4 py-2">{currentPage}</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
