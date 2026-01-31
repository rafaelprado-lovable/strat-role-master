import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  Loader2, 
  Play,
  Download,
  MapPin,
  Terminal,
  FileCheck,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationLog {
  timestamp: string;
  message: string;
  type: "success" | "error" | "info";
}

type StepStatus = "não executado" | "executado com sucesso" | "executado com erro" | "executando";

const mockInsertionLogs: ValidationLog[] = [
  { timestamp: "2024-01-15 10:30:01", message: "Iniciando validação de inserção de CEP...", type: "info" },
  { timestamp: "2024-01-15 10:30:02", message: "Conectando ao serviço de validação...", type: "info" },
  { timestamp: "2024-01-15 10:30:03", message: "CEP 01310-100 validado com sucesso", type: "success" },
  { timestamp: "2024-01-15 10:30:04", message: "CEP 04538-132 validado com sucesso", type: "success" },
  { timestamp: "2024-01-15 10:30:05", message: "CEP 22041-080 validado com sucesso", type: "success" },
  { timestamp: "2024-01-15 10:30:06", message: "Erro ao validar CEP 00000-000: CEP inválido", type: "error" },
  { timestamp: "2024-01-15 10:30:07", message: "CEP 30130-000 validado com sucesso", type: "success" },
  { timestamp: "2024-01-15 10:30:08", message: "Total: 4 CEPs inseridos, 1 erro", type: "info" },
];

interface CepItem {
  id: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  status: StepStatus;
}

const mockCepItems: CepItem[] = [
  { id: "1", cep: "01310-100", logradouro: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", status: "executado com sucesso" },
  { id: "2", cep: "04538-132", logradouro: "Rua Funchal", bairro: "Vila Olímpia", cidade: "São Paulo", uf: "SP", status: "executado com sucesso" },
  { id: "3", cep: "22041-080", logradouro: "Rua Barata Ribeiro", bairro: "Copacabana", cidade: "Rio de Janeiro", uf: "RJ", status: "executando" },
  { id: "4", cep: "30130-000", logradouro: "Praça Sete de Setembro", bairro: "Centro", cidade: "Belo Horizonte", uf: "MG", status: "não executado" },
  { id: "5", cep: "80010-000", logradouro: "Rua XV de Novembro", bairro: "Centro", cidade: "Curitiba", uf: "PR", status: "não executado" },
];

const getStatusIcon = (status: StepStatus) => {
  switch (status) {
    case "executado com sucesso":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "executado com erro":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "executando":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadgeVariant = (status: StepStatus) => {
  switch (status) {
    case "executado com sucesso":
      return "default";
    case "executado com erro":
      return "destructive";
    case "executando":
      return "secondary";
    default:
      return "outline";
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

export default function ChangeExecutionCep() {
  const [cepItems, setCepItems] = useState<CepItem[]>(mockCepItems);
  const [insertionLogs, setInsertionLogs] = useState<ValidationLog[]>(mockInsertionLogs);
  const [exclusionLogs, setExclusionLogs] = useState<ValidationLog[]>([]);
  const [isInsertionRunning, setIsInsertionRunning] = useState(false);
  const [isExclusionRunning, setIsExclusionRunning] = useState(false);
  const { toast } = useToast();

  const handleExecuteCep = (cepId: string) => {
    setCepItems(prev => prev.map(item => {
      if (item.id === cepId) {
        toast({
          title: "Executando inserção",
          description: `Inserindo CEP ${item.cep}...`,
        });
        
        setTimeout(() => {
          setCepItems(current => current.map(i => {
            if (i.id === cepId) {
              return { ...i, status: "executado com sucesso" as StepStatus };
            }
            return i;
          }));
          
          setInsertionLogs(current => [...current, {
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
            message: `CEP ${item.cep} inserido com sucesso`,
            type: "success"
          }]);
          
          toast({
            title: "CEP inserido",
            description: `${item.cep} executado com sucesso!`,
          });
        }, 2000);
        
        return { ...item, status: "executando" as StepStatus };
      }
      return item;
    }));
  };

  const handleStartInsertion = () => {
    setIsInsertionRunning(true);
    toast({
      title: "Iniciando validação",
      description: "Processando inserção de CEPs...",
    });

    setTimeout(() => {
      setIsInsertionRunning(false);
      toast({
        title: "Validação concluída",
        description: "Inserção de CEPs finalizada.",
      });
    }, 3000);
  };

  const handleStartExclusion = () => {
    setIsExclusionRunning(true);
    setExclusionLogs([
      { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), message: "Iniciando validação de exclusão...", type: "info" }
    ]);

    toast({
      title: "Iniciando exclusão",
      description: "Processando exclusão de CEPs...",
    });

    setTimeout(() => {
      setExclusionLogs(prev => [...prev, 
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), message: "Verificando dependências...", type: "info" },
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), message: "CEPs removidos com sucesso", type: "success" }
      ]);
      setIsExclusionRunning(false);
      toast({
        title: "Exclusão concluída",
        description: "Validação de exclusão finalizada.",
      });
    }, 3000);
  };

  const handleDownloadLogs = (logs: ValidationLog[], filename: string) => {
    const content = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = cepItems.filter(item => item.status === "executado com sucesso").length;
  const progress = (completedCount / cepItems.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execução de Change - CEP</h2>
          <p className="text-muted-foreground">CHG0174920 - Inserção de novos CEPs na base</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {completedCount}/{cepItems.length} CEPs processados
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de CEPs para inserção */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>CEPs para Inserção</CardTitle>
            </div>
            <CardDescription>
              Lista de CEPs aguardando processamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {cepItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <span className="font-mono font-semibold">{item.cep}</span>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{item.logradouro}</p>
                        <p>{item.bairro} - {item.cidade}/{item.uf}</p>
                      </div>
                    </div>
                    {item.status === "não executado" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleExecuteCep(item.id)}
                        title="Executar inserção"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Terminal de Validação de Inserção */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                <CardTitle>Validação de Inserção</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadLogs(insertionLogs, "insertion-logs.txt")}
                  disabled={insertionLogs.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartInsertion}
                  disabled={isInsertionRunning}
                >
                  {isInsertionRunning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileCheck className="h-4 w-4 mr-2" />
                  )}
                  Validar
                </Button>
              </div>
            </div>
            <CardDescription>
              Log em tempo real da validação de inserção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm">
              <ScrollArea className="h-[340px]">
                <div className="space-y-1">
                  {insertionLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-zinc-500">[{log.timestamp}]</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                  {isInsertionRunning && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Terminal de Validação de Exclusão */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <CardTitle>Validação de Exclusão</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadLogs(exclusionLogs, "exclusion-logs.txt")}
                  disabled={exclusionLogs.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStartExclusion}
                  disabled={isExclusionRunning}
                >
                  {isExclusionRunning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Iniciar validação
                </Button>
              </div>
            </div>
            <CardDescription>
              Log em tempo real da validação de exclusão de CEPs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm">
              <ScrollArea className="h-[200px]">
                {exclusionLogs.length > 0 ? (
                  <div className="space-y-1">
                    {exclusionLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-zinc-500">[{log.timestamp}]</span>
                        <span className={getLogColor(log.type)}>{log.message}</span>
                      </div>
                    ))}
                    {isExclusionRunning && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processando...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    <span>Clique em "Iniciar validação" para começar</span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
