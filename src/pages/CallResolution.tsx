import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { departmentApi, incidentResolutionApi } from '@/services/mockApi';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";


interface Resolution {
  id: string;
  match_description: string;
  close_code: string;
  cause: string;
  target_field: string;
  resolution_notes: string;
  platform: string;
  sub_cause: string;
}


export default function CallResolution() {
  const userFunction = localStorage.getItem("userFunction"); // use a mesma chave que você usa no login
  const allowedDepartments = new Set(
    localStorage.getItem("departaments")?.split(",") ?? []
  );



  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const handleSelectDepartment = (value: string | null) => {
    setSelectedDepartment(value);
    setFormData(prev => ({
      ...prev,
      target_field: value ?? "",
    }));
  };

  const { data: resolutions = [] } = useQuery({
    queryKey: ['resolutions'],
    queryFn: incidentResolutionApi.getAll
  });


  const [formData, setFormData] = useState({
    match_description: "",
    close_code: "",
    cause: "",
    target_field: "",
    resolution_notes: "",
    platform: "",
    sub_cause: "",
    departament: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const allowedDepartmentNames = new Set(
    departments
      .filter((dept) => stringAllowedDepartments.includes(dept._id))
      .map((dept) => dept.name)
  );

  const handleSubmit = async () => {
    if (!formData.match_description || !formData.resolution_notes) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await incidentResolutionApi.create(formData as any);

      toast.success("Resolução cadastrada com sucesso!");

      setFormData({
        match_description: "",
        close_code: "",
        cause: "",
        target_field: "",
        resolution_notes: "",
        platform: "",
        sub_cause: "",
        departament: "",
      });

      // 🔄 Recarrega a lista
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });

    } catch (error) {
      toast.error("Erro ao cadastrar resolução");
      console.error(error);
    }
  };


  const filteredResolutions = resolutions.filter(res =>
    res.handlingRuleData.match_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.handlingRuleData.target_field.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.incidentResolutionData.resolution_notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredResolutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResolutions = filteredResolutions.slice(startIndex, startIndex + itemsPerPage);

  const handleApprove = async (resolution: any) => {
    try {
      await incidentResolutionApi.aprooveSolicitation({
        id: resolution.handlingRuleData.id,
        aprooval: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["resolutions"] });

      console.log("Aprovado:", resolution.handlingRuleData.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (resolution: any) => {
    try {
      await incidentResolutionApi.aprooveSolicitation({
        id: resolution.handlingRuleData.id,
        aprooval: false,
      });

      await queryClient.invalidateQueries({ queryKey: ["resolutions"] });

      console.log("Rejeitado:", resolution.handlingRuleData.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await incidentResolutionApi.delete({ id });

      await queryClient.invalidateQueries({ queryKey: ["resolutions"] });

      console.log("Deletado:", id);
    } catch (err) {
      console.error(err);
    }
  };

  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resolução de chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match_description">Descrição alvo</Label>
              <Input
                id="match_description"
                value={formData.match_description}
                onChange={(e) => handleInputChange("match_description", e.target.value)}
                placeholder="Descrição alvo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Nota de fechamento</Label>
              <Input
                id="resolution_notes"
                value={formData.resolution_notes}
                onChange={(e) => handleInputChange("resolution_notes", e.target.value)}
                placeholder="Nota de fechamento"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="close_code">Código de resolução</Label>
              <select
                id="close_code"
                value={formData.close_code}
                onChange={(e) =>
                  handleInputChange("close_code", e.target.value)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value=""></option>
                <option value="Solucionado(Contorno)">Solucionado(Contorno)</option>
                <option value="solved">Solucionado (Contorno)</option>
                <option value="solved2">Solucionado (Permanentemente)</option>
                <option value="remotely">Solucionado Remotamente (Contorno)</option>
                <option value="remotely2">Solucionado Remotamente (Permanentemente)</option>
                <option value="reproducible">Não Solucionado (Não Reproduzível)</option>
                <option value="costly">Não Solucionado (Muito caro)</option>
                <option value="caller">Encerrado/Solucionado pelo solicitante</option>
                <option value="not_solved_not_applicable">Não Solucionado (Improcedente)</option>
                <option value="Change_Execution_Scenario_Unfounded">Cenário de execução de change (Improcedente)</option>
              </select>

            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Input
                id="platform"
                value={formData.platform}
                onChange={(e) => handleInputChange("platform", e.target.value)}
                placeholder="Plataforma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cause">Causa</Label>
              <Input
                id="cause"
                value={formData.cause}
                onChange={(e) => handleInputChange("cause", e.target.value)}
                placeholder="Causa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_cause">Sub cause</Label>
              <Input
                id="sub_cause"
                value={formData.sub_cause}
                onChange={(e) => handleInputChange("sub_cause", e.target.value)}
                placeholder="Sub cause"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_field">Campo alvo</Label>
            <select
              id="target_field"
              value={formData.target_field}
              onChange={(e) =>
                handleInputChange("target_field", e.target.value)
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value=""></option>
              <option value="descricao_resumida">Descrição resumida</option>
              <option value="descricao">Descrição</option>
            </select>
          </div>

          {/* departaments */}
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>

            <select
              id="departament"
              value={formData.departament}
              onChange={(e) => handleInputChange("departament", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value=""></option>

              {departments
                .filter((dept) => stringAllowedDepartments.includes(dept._id))
                .map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
            </select>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Cadastrar novo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resolução de chamados</span>
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Mostrando {paginatedResolutions.length} registros
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DESCRIÇÃO ALVO</TableHead>
                <TableHead>departament</TableHead>
                <TableHead className="w-20">AÇÃO</TableHead>
                {userFunction === "gerente" && (
                  <TableHead className="w-20">Aprovar gerencial</TableHead>
                )}
                <TableHead className="w-20">Aprovado gerencialmente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResolutions
                .filter((resolution) =>
                  allowedDepartmentNames.has(resolution.handlingRuleData.departament)
                )
                .map((resolution) => (
                  <TableRow key={resolution.handlingRuleData.id}>
                    <TableCell className="font-medium">
                      {resolution.handlingRuleData.match_description}
                    </TableCell>

                    <TableCell>
                      {resolution.handlingRuleData.departament}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(resolution.handlingRuleData.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>

                    {userFunction === "gerente" && (
                      <TableCell className="font-medium">
                        {resolution.handlingRuleData.pendentManagerAprooval ? (
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(resolution)}
                            >
                              Rejeitar
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(resolution)}
                            >
                              Aprovar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      {resolution.handlingRuleData.pendentManagerAprooval ? (
                        <span className="flex items-center gap-2 text-yellow-600">
                          <Clock className="h-4 w-4" />
                          Pendente
                        </span>
                      ) : resolution.handlingRuleData.managerAprooved ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Aprovado
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Rejeitado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando de {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredResolutions.length)} do total de {filteredResolutions.length} registros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
