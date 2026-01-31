import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const insertionPipelineLogs: ValidationLog[] = [
  { timestamp: "", message: "$ pipeline-cep-insertion --validate", type: "info" },
  { timestamp: "", message: "Iniciando pipeline de inserção de CEP...", type: "info" },
  { timestamp: "", message: "Conectando ao serviço de validação...", type: "info" },
  { timestamp: "", message: "[INFO] Autenticação realizada com sucesso", type: "info" },
  { timestamp: "", message: "[INFO] Carregando lista de CEPs para inserção...", type: "info" },
  { timestamp: "", message: "[STEP 1/5] Validando formato dos CEPs...", type: "info" },
  { timestamp: "", message: "  ✓ CEP 01310-100: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 04538-132: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 30130-000: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 80010-000: formato válido", type: "success" },
  { timestamp: "", message: "[STEP 2/5] Verificando duplicatas na base...", type: "info" },
  { timestamp: "", message: "  → Consultando tabela cep_master...", type: "info" },
  { timestamp: "", message: "  ✓ Nenhuma duplicata encontrada", type: "success" },
  { timestamp: "", message: "[STEP 3/5] Validando endereços via API Correios...", type: "info" },
  { timestamp: "", message: "  → POST https://api.correios.com.br/validate", type: "info" },
  { timestamp: "", message: "  ✓ CEP 01310-100: Av. Paulista, Bela Vista - SP", type: "success" },
  { timestamp: "", message: "  ✓ CEP 04538-132: R. Funchal, Vila Olímpia - SP", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: R. Barata Ribeiro, Copacabana - RJ", type: "success" },
  { timestamp: "", message: "  ✓ CEP 30130-000: Pç. Sete de Setembro, Centro - MG", type: "success" },
  { timestamp: "", message: "  ✓ CEP 80010-000: R. XV de Novembro, Centro - PR", type: "success" },
  { timestamp: "", message: "[STEP 4/5] Inserindo registros na base de dados...", type: "info" },
  { timestamp: "", message: "  → BEGIN TRANSACTION", type: "info" },
  { timestamp: "", message: "  → INSERT INTO cep_master (cep, logradouro, bairro, cidade, uf)...", type: "info" },
  { timestamp: "", message: "  ✓ 5 registros inseridos com sucesso", type: "success" },
  { timestamp: "", message: "  → COMMIT", type: "info" },
  { timestamp: "", message: "[STEP 5/5] Atualizando cache de CEPs...", type: "info" },
  { timestamp: "", message: "  → Invalidando cache Redis...", type: "info" },
  { timestamp: "", message: "  ✓ Cache atualizado", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Pipeline executado com sucesso!", type: "success" },
  { timestamp: "", message: "  Total de CEPs processados: 5", type: "info" },
  { timestamp: "", message: "  Inseridos com sucesso: 5", type: "success" },
  { timestamp: "", message: "  Erros: 0", type: "info" },
  { timestamp: "", message: "  Tempo total: 4.23s", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
];

const exclusionPipelineLogs: ValidationLog[] = [
  { timestamp: "", message: "$ pipeline-cep-exclusion --validate", type: "info" },
  { timestamp: "", message: "Iniciando pipeline de exclusão de CEP...", type: "info" },
  { timestamp: "", message: "[INFO] Verificando dependências dos CEPs...", type: "info" },
  { timestamp: "", message: "  → Consultando tabela de pedidos...", type: "info" },
  { timestamp: "", message: "  → Consultando tabela de clientes...", type: "info" },
  { timestamp: "", message: "  ✓ Nenhuma dependência encontrada", type: "success" },
  { timestamp: "", message: "[STEP 1/3] Marcando registros para exclusão...", type: "info" },
  { timestamp: "", message: "  → UPDATE cep_master SET deleted_at = NOW()...", type: "info" },
  { timestamp: "", message: "  ✓ 2 registros marcados", type: "success" },
  { timestamp: "", message: "[STEP 2/3] Arquivando registros...", type: "info" },
  { timestamp: "", message: "  → INSERT INTO cep_archive SELECT * FROM cep_master...", type: "info" },
  { timestamp: "", message: "  ✓ Registros arquivados", type: "success" },
  { timestamp: "", message: "[STEP 3/3] Removendo do cache...", type: "info" },
  { timestamp: "", message: "  → DEL cep:01310-100 cep:04538-132", type: "info" },
  { timestamp: "", message: "  ✓ Cache limpo", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Pipeline de exclusão executado com sucesso!", type: "success" },
  { timestamp: "", message: "  Total excluído: 2 CEPs", type: "info" },
  { timestamp: "", message: "  Tempo total: 1.87s", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
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
  { id: "1", cep: "01310-100", logradouro: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", status: "não executado" },
  { id: "2", cep: "04538-132", logradouro: "Rua Funchal", bairro: "Vila Olímpia", cidade: "São Paulo", uf: "SP", status: "não executado" },
  { id: "3", cep: "22041-080", logradouro: "Rua Barata Ribeiro", bairro: "Copacabana", cidade: "Rio de Janeiro", uf: "RJ", status: "não executado" },
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
      return "text-zinc-300";
  }
};

export default function ChangeExecutionCep() {
  const [cepItems, setCepItems] = useState<CepItem[]>(mockCepItems);
  const [insertionLogs, setInsertionLogs] = useState<ValidationLog[]>([]);
  const [exclusionLogs, setExclusionLogs] = useState<ValidationLog[]>([]);
  const [isInsertionRunning, setIsInsertionRunning] = useState(false);
  const [isExclusionRunning, setIsExclusionRunning] = useState(false);
  const insertionTerminalRef = useRef<HTMLDivElement>(null);
  const exclusionTerminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll insertion terminal
  useEffect(() => {
    if (insertionTerminalRef.current) {
      insertionTerminalRef.current.scrollTop = insertionTerminalRef.current.scrollHeight;
    }
  }, [insertionLogs]);

  // Auto-scroll exclusion terminal
  useEffect(() => {
    if (exclusionTerminalRef.current) {
      exclusionTerminalRef.current.scrollTop = exclusionTerminalRef.current.scrollHeight;
    }
  }, [exclusionLogs]);

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

  const streamLogs = (
    logs: ValidationLog[], 
    setLogs: React.Dispatch<React.SetStateAction<ValidationLog[]>>,
    onComplete: () => void
  ) => {
    setLogs([]);
    let index = 0;
    
    const addNextLog = () => {
      if (index < logs.length) {
        const log = logs[index];
        const timestamp = new Date().toISOString().replace("T", " ").slice(11, 19);
        setLogs(prev => [...prev, { ...log, timestamp }]);
        index++;
        
        // Variable delay for realistic feel
        const delay = log.message.startsWith("[STEP") ? 300 : 
                      log.message.startsWith("  →") ? 200 :
                      log.message.startsWith("  ✓") ? 150 :
                      log.message.includes("═") ? 100 : 120;
        setTimeout(addNextLog, delay);
      } else {
        onComplete();
      }
    };
    
    addNextLog();
  };

  const handleStartInsertion = () => {
    setIsInsertionRunning(true);
    toast({
      title: "Iniciando pipeline",
      description: "Executando inserção de CEPs...",
    });

    streamLogs(insertionPipelineLogs, setInsertionLogs, () => {
      setIsInsertionRunning(false);
      setCepItems(prev => prev.map(item => ({ ...item, status: "executado com sucesso" as StepStatus })));
      toast({
        title: "Pipeline concluído",
        description: "Inserção de CEPs finalizada com sucesso.",
      });
    });
  };

  const handleStartExclusion = () => {
    setIsExclusionRunning(true);
    toast({
      title: "Iniciando pipeline",
      description: "Executando exclusão de CEPs...",
    });

    streamLogs(exclusionPipelineLogs, setExclusionLogs, () => {
      setIsExclusionRunning(false);
      toast({
        title: "Pipeline concluído",
        description: "Exclusão de CEPs finalizada com sucesso.",
      });
    });
  };

  const handleDownloadLogs = (logs: ValidationLog[], filename: string) => {
    const content = logs.map(log => `[${log.timestamp}] ${log.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = cepItems.filter(item => item.status === "executado com sucesso").length;

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
            <div className="h-[400px] overflow-y-auto pr-2 space-y-3">
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
          </CardContent>
        </Card>

        {/* Terminal de Validação de Inserção */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                <CardTitle>Pipeline de Inserção</CardTitle>
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
                  Executar
                </Button>
              </div>
            </div>
            <CardDescription>
              Log em tempo real da execução do pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm">
              <div 
                ref={insertionTerminalRef}
                className="h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              >
                <div className="space-y-0.5">
                  {insertionLogs.length === 0 && !isInsertionRunning && (
                    <div className="text-zinc-500 flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="animate-pulse">_</span>
                      <span className="text-zinc-600 text-xs">Clique em "Executar" para iniciar</span>
                    </div>
                  )}
                  {insertionLogs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed">
                      <span className="text-zinc-600 text-xs min-w-[60px]">{log.timestamp}</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                  {isInsertionRunning && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="animate-pulse">▌</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terminal de Validação de Exclusão */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <CardTitle>Pipeline de Exclusão</CardTitle>
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
                  Executar
                </Button>
              </div>
            </div>
            <CardDescription>
              Log em tempo real da execução do pipeline de exclusão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm">
              <div 
                ref={exclusionTerminalRef}
                className="h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              >
                <div className="space-y-0.5">
                  {exclusionLogs.length === 0 && !isExclusionRunning && (
                    <div className="text-zinc-500 flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="animate-pulse">_</span>
                      <span className="text-zinc-600 text-xs">Clique em "Executar" para iniciar</span>
                    </div>
                  )}
                  {exclusionLogs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed">
                      <span className="text-zinc-600 text-xs min-w-[60px]">{log.timestamp}</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                  {isExclusionRunning && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="animate-pulse">▌</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
