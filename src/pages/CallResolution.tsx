import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  descricaoAlvo: string;
  codigoResolucao: string;
  causa: string;
  campoAlvo: string;
  notaFechamento: string;
  plataforma: string;
  subCausa: string;
}

const mockResolutions: Resolution[] = [
  {
    id: "1",
    descricaoAlvo: "ACUMULO DE REGISTROS FILA KAFKA",
    codigoResolucao: "RES001",
    causa: "Alta utilização",
    campoAlvo: "Descrição resumida",
    notaFechamento: "Foi necessário realizar o restart dos consumidores da fila kafka. Situação normalizada e ambiente validado.",
    plataforma: "Kafka",
    subCausa: "Consumidores travados",
  },
  {
    id: "2",
    descricaoAlvo: "AdditionalInfo: Alta Utilização de Memória",
    codigoResolucao: "RES002",
    causa: "Memory Leak",
    campoAlvo: "Descrição",
    notaFechamento: "#VASINTERNAL#MEMORIA#AMBIENTENORMALIZADO",
    plataforma: "VAS Internal",
    subCausa: "Vazamento de memória",
  },
  {
    id: "3",
    descricaoAlvo: "AdditionalInfo: PMID - Alarme PMID: AUMENTO DE REGISTROS FILA RABBIT PMID",
    codigoResolucao: "RES003",
    causa: "Fila acumulada",
    campoAlvo: "Descrição",
    notaFechamento: "Foi necessário verificar os serviços do ambiente PMID, serviços verificados e ambiente validado.",
    plataforma: "PMID",
    subCausa: "RabbitMQ congestionado",
  },
  {
    id: "4",
    descricaoAlvo: "AdditionalInfo: PMID - Alarme PMID: Deployment bi-queue-notify-billing-type favor analisar pode ter sido deletado teste - Funcionalidade: PMID - DescErro: Hostname: tim-pmid-prd-prometheus",
    codigoResolucao: "RES004",
    causa: "Deployment deletado",
    campoAlvo: "Descrição",
    notaFechamento: "Foi necessário verificar os serviços do ambiente PMID, serviços verificados e ambiente validado.",
    plataforma: "PMID",
    subCausa: "Configuração incorreta",
  },
  {
    id: "5",
    descricaoAlvo: "Alarme Ambiente GEMFIRE",
    codigoResolucao: "RES005",
    causa: "Instabilidade",
    campoAlvo: "Descrição resumida",
    notaFechamento: "#GEMFIRE#NIFI#KAFKA",
    plataforma: "GEMFIRE",
    subCausa: "Cache corrompido",
  },
];

export default function CallResolution() {
  const [resolutions, setResolutions] = useState<Resolution[]>(mockResolutions);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    descricaoAlvo: "",
    codigoResolucao: "",
    causa: "",
    campoAlvo: "",
    notaFechamento: "",
    plataforma: "",
    subCausa: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.descricaoAlvo || !formData.notaFechamento) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const newResolution: Resolution = {
      id: Date.now().toString(),
      ...formData,
    };

    setResolutions(prev => [newResolution, ...prev]);
    setFormData({
      descricaoAlvo: "",
      codigoResolucao: "",
      causa: "",
      campoAlvo: "",
      notaFechamento: "",
      plataforma: "",
      subCausa: "",
    });
    toast.success("Resolução cadastrada com sucesso!");
  };

  const handleDelete = (id: string) => {
    setResolutions(prev => prev.filter(r => r.id !== id));
    toast.success("Resolução removida com sucesso!");
  };

  const filteredResolutions = resolutions.filter(res =>
    res.descricaoAlvo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.campoAlvo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.notaFechamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredResolutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResolutions = filteredResolutions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resolução de chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descricaoAlvo">Descrição alvo</Label>
              <Input
                id="descricaoAlvo"
                value={formData.descricaoAlvo}
                onChange={(e) => handleInputChange("descricaoAlvo", e.target.value)}
                placeholder="Descrição alvo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notaFechamento">Nota de fechamento</Label>
              <Input
                id="notaFechamento"
                value={formData.notaFechamento}
                onChange={(e) => handleInputChange("notaFechamento", e.target.value)}
                placeholder="Nota de fechamento"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoResolucao">Código de resolução</Label>
              <Input
                id="codigoResolucao"
                value={formData.codigoResolucao}
                onChange={(e) => handleInputChange("codigoResolucao", e.target.value)}
                placeholder="Código de resolução"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plataforma">Plataforma</Label>
              <Input
                id="plataforma"
                value={formData.plataforma}
                onChange={(e) => handleInputChange("plataforma", e.target.value)}
                placeholder="Plataforma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="causa">Causa</Label>
              <Input
                id="causa"
                value={formData.causa}
                onChange={(e) => handleInputChange("causa", e.target.value)}
                placeholder="Causa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCausa">Sub causa</Label>
              <Input
                id="subCausa"
                value={formData.subCausa}
                onChange={(e) => handleInputChange("subCausa", e.target.value)}
                placeholder="Sub causa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campoAlvo">Campo alvo</Label>
            <Textarea
              id="campoAlvo"
              value={formData.campoAlvo}
              onChange={(e) => handleInputChange("campoAlvo", e.target.value)}
              placeholder="Campo alvo"
              rows={3}
            />
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
                <TableHead>CAMPO ALVO</TableHead>
                <TableHead>NOTA DE FECHAMENTO</TableHead>
                <TableHead className="w-20">AÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResolutions.map((resolution) => (
                <TableRow key={resolution.id}>
                  <TableCell className="font-medium">
                    {resolution.descricaoAlvo}
                  </TableCell>
                  <TableCell>{resolution.campoAlvo}</TableCell>
                  <TableCell>{resolution.notaFechamento}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(resolution.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
