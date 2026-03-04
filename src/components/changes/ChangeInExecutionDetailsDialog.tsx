import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departmentApi, incidentResolutionApi } from '@/services/mockApi';
import { useQuery } from '@tanstack/react-query';
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
import { Search, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Task {
  sys_id: string;
  number: string;
  description: string;
  type: string;
  state: string;
  departament?: string;
}

interface ChangeInExecutionDetails {
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
  tarefas: Task[];
}

interface ChangeInExecutionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: ChangeInExecutionDetails;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export function ChangeInExecutionDetailsDialog({
  open,
  onOpenChange,
  change,
}: ChangeInExecutionDetailsDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isExclusaoRunning, setIsExclusaoRunning] = useState(false);
  const itemsPerPage = 10;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [userDepartments, setUserDepartments] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("departaments");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserDepartments(parsed); // array
      } catch {
        // caso venha como string simples
        setUserDepartments([stored]);
      }
    }
  }, []);

  async function getTasks() {
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${userToken}`);

    const raw = JSON.stringify({
      userId,
      changeNumber: change.changeSystemData.number,
    });

    try {
      setLoadingTasks(true); // 🔥 START LOADING

      const response = await fetch("http://10.151.1.54:8000/v1/ctasks", {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
      });

      const data = await response.json();
      console.log("TASKS RESPONSE:", data);

      // AJUSTE CONFORME SUA API
      setTasks(data.success ?? data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false); // 🔥 STOP LOADING
    }
  }

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll
  });

  const stringAllowedDepartments = (
    localStorage.getItem("departaments") ?? ""
  ).split(",");

  const allowedDepartmentsList = departments.filter((dept) =>
    stringAllowedDepartments.includes(dept._id)
  );

  console.log(allowedDepartmentsList)

  async function closeTask(taskNumber: string, isRollback = false) {
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
      const response = await fetch(
        "http://10.151.1.33:8000/v1/close/implementation/tasks",
        {
          method: "PATCH",
          headers: myHeaders,
          body: raw,
        }
      );

      toast.success(`Task ${taskNumber} fechada com ${isRollback ? "rollback" : "sucesso"}`);

      // 🔥 Atualizar lista depois de fechar
      getTasks();

    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao fechar task ${taskNumber}`);
    }
  }

  useEffect(() => {
    if (open && change?.changeSystemData?.number) {
      setCurrentPage(1);
      getTasks();
    }
  }, [open, change.changeSystemData.number]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return tasks.filter(task => {
      const matchesSearch =
        task.number?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term);

      const taskDept = task.departament?.toLowerCase() ?? "";

      const matchesDepartment =
        allowedDepartmentsList.length === 0 ||
        allowedDepartmentsList.some(dep =>
          taskDept.includes(dep.sysId)
        );

      return matchesSearch && matchesDepartment;
    });
  }, [tasks, searchTerm, allowedDepartmentsList]);


  const totalPages = Math.ceil(filteredTasks?.length / itemsPerPage || 0);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks?.slice(startIndex, endIndex);

  const handleFecharSucesso = (number: string) => {
    closeTask(number, false);
  };

  const handleFecharRollback = (number: string) => {
    closeTask(number, true);
  };


  const getStatusVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (state) {
      case "encerrado":
        return "destructive";
      case "3":
        return "secondary";
      case "implementação":
        return "default";
      case "revisão":
        return "outline";
      default:
        return "secondary";
    }
  };

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

  const isTaskClosed = (state: string) => String(state) === "3";

  const isImplementationTask = (type: string) =>
    type?.toLowerCase() === "implementation";

  const canCloseTask = (task: any) => {
    return !isTaskClosed(task.state) && isImplementationTask(task.type);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {change.changeSystemData.number} - {change.changeSystemData.description}
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
                  <p className="mt-1 text-base">{change.changeSystemData.number}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Descrição da change
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Início da implementação
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.start_date}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fim da implementação
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.end_date}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dia da semana
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.week_day}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Equipes envolvidas na aplicação
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.teams_involved_in_execution}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Equipes envolvidas na validação
                  </label>
                  <p className="mt-1 text-base">{change.changeSystemData.teams_involved_in_validation}</p>
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
              Mostrando {filteredTasks?.length} registros
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
                      {loadingTasks ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                              Carregando tarefas...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : currentTasks?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma tarefa encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                      currentTasks?.map((task) => (
                        <TableRow key={task.sys_id}>
                          <TableCell className="font-medium">{task.number}</TableCell>
                          <TableCell>{task.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(task.state)}>
                              {getStatusLabel(task.state)}
                            </Badge>
                          </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canCloseTask(task)}
                                onClick={() => handleFecharSucesso(task.number)}
                                className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
                                  !canCloseTask(task) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Fechar como sucesso
                              </Button>
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canCloseTask(task)}
                                onClick={() => handleFecharRollback(task.number)}
                                className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                                  !canCloseTask(task) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Fechar como rollback
                              </Button>
                            </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {filteredTasks?.length > itemsPerPage && (
                  <div className="p-4 flex items-center justify-between border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando de {startIndex + 1} a {Math.min(endIndex, filteredTasks?.length)} do total de {filteredTasks?.length} registros
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
