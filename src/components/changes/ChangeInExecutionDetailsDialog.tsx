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
import { Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  numeroTarefa: string;
  descricaoTarefa: string;
  tipoTarefa: string;
  statusTarefa: string;
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
  const itemsPerPage = 10;

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
