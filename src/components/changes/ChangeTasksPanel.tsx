import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Task {
  sys_id: string;
  number: string;
  description: string;
  type: string;
  state: string;
  departament?: string;
}

interface ChangeTasksPanelProps {
  changeNumber: string;
}

export function ChangeTasksPanel({ changeNumber }: ChangeTasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTasks = useCallback(async () => {
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${userToken}`);

    const raw = JSON.stringify({ userId, changeNumber });

    try {
      setLoadingTasks(true);
      const response = await fetch("http://10.151.1.54:8000/v1/ctasks", {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
      });
      const data = await response.json();
      setTasks(data.success ?? data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [changeNumber]);

  const closeTask = useCallback(async (taskNumber: string, isRollback: boolean) => {
    const userId = localStorage.getItem("userId") ?? "unknown_user";
    const userToken = localStorage.getItem("userToken") ?? "unknown_user";

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${userToken}`);

    const raw = JSON.stringify({
      userId,
      taskNumber,
      close_code: isRollback ? "unsuccessful" : "successful",
      close_notes: isRollback ? "Rollback!" : "Sucesso!",
      u_houve_estouro_de_janela: "no",
    });

    try {
      await fetch("http://10.151.1.33:8000/v1/close/implementation/tasks", {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
      });
      toast.success(`Task ${taskNumber} fechada com ${isRollback ? "rollback" : "sucesso"}`);
      getTasks();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao fechar task ${taskNumber}`);
    }
  }, [getTasks]);

  useEffect(() => {
    if (changeNumber) {
      getTasks();
    }
  }, [changeNumber, getTasks]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (task) =>
        task.number?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  const getStatusLabel = (state: string) => {
    switch (state) {
      case "3":
        return "Encerrada";
      case "-5":
        return "Pendente";
      default:
        return "Em execução";
    }
  };

  const getStatusVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (state) {
      case "3":
        return "secondary";
      case "-5":
        return "outline";
      default:
        return "default";
    }
  };

  const isTaskClosed = (state: string) => String(state) === "3";
  const isImplementationTask = (type: string) => type?.toLowerCase() === "implementation";
  const canCloseTask = (task: Task) => !isTaskClosed(task.state) && isImplementationTask(task.type);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tarefas da change</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredTasks.length} registro{filteredTasks.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent>
        {loadingTasks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando tarefas...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">NÚMERO DA TAREFA</TableHead>
                  <TableHead className="min-w-[300px]">DESCRIÇÃO DA TAREFA</TableHead>
                  <TableHead className="whitespace-nowrap">TIPO DA TAREFA</TableHead>
                  <TableHead className="whitespace-nowrap">STATUS DA TAREFA</TableHead>
                  <TableHead className="whitespace-nowrap">FECHAR TAREFA COMO SUCESSO</TableHead>
                  <TableHead className="whitespace-nowrap">FECHAR TAREFA COMO ROLLBACK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTasks.map((task) => (
                    <TableRow key={task.sys_id}>
                      <TableCell className="font-mono text-sm">{task.number}</TableCell>
                      <TableCell className="text-sm max-w-xs">{task.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(task.state)} className="text-xs">
                          {getStatusLabel(task.state)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canCloseTask(task) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={() => closeTask(task.number, false)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Fechar como sucesso
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canCloseTask(task) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => closeTask(task.number, true)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Fechar como rollback
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm text-muted-foreground px-3">
                        Página {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
