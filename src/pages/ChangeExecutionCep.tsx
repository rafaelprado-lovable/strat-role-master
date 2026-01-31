import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trash2,
  Plus,
  Minus,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationLog {
  timestamp: string;
  message: string;
  type: "success" | "error" | "info";
}

type CepStatus = "pendente" | "validado" | "erro" | "validando";
type ChangeType = "inserção" | "exclusão";

interface CepChange {
  id: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  changeType: ChangeType;
  status: CepStatus;
}

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
  { timestamp: "", message: "[STEP 2/5] Verificando duplicatas na base...", type: "info" },
  { timestamp: "", message: "  → Consultando tabela cep_master...", type: "info" },
  { timestamp: "", message: "  ✓ Nenhuma duplicata encontrada", type: "success" },
  { timestamp: "", message: "[STEP 3/5] Validando endereços via API Correios...", type: "info" },
  { timestamp: "", message: "  → POST https://api.correios.com.br/validate", type: "info" },
  { timestamp: "", message: "  ✓ CEP 01310-100: Av. Paulista, Bela Vista - SP", type: "success" },
  { timestamp: "", message: "  ✓ CEP 04538-132: R. Funchal, Vila Olímpia - SP", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: R. Barata Ribeiro, Copacabana - RJ", type: "success" },
  { timestamp: "", message: "[STEP 4/5] Inserindo registros na base de dados...", type: "info" },
  { timestamp: "", message: "  → BEGIN TRANSACTION", type: "info" },
  { timestamp: "", message: "  → INSERT INTO cep_master (cep, logradouro, bairro, cidade, uf)...", type: "info" },
  { timestamp: "", message: "  ✓ 3 registros inseridos com sucesso", type: "success" },
  { timestamp: "", message: "  → COMMIT", type: "info" },
  { timestamp: "", message: "[STEP 5/5] Atualizando cache de CEPs...", type: "info" },
  { timestamp: "", message: "  → Invalidando cache Redis...", type: "info" },
  { timestamp: "", message: "  ✓ Cache atualizado", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Pipeline executado com sucesso!", type: "success" },
  { timestamp: "", message: "  Total de CEPs processados: 3", type: "info" },
  { timestamp: "", message: "  Inseridos com sucesso: 3", type: "success" },
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
  { timestamp: "", message: "  → DEL cep:30130-000 cep:80010-000", type: "info" },
  { timestamp: "", message: "  ✓ Cache limpo", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Pipeline de exclusão executado com sucesso!", type: "success" },
  { timestamp: "", message: "  Total excluído: 2 CEPs", type: "info" },
  { timestamp: "", message: "  Tempo total: 1.87s", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
];

const mockCepChanges: CepChange[] = [
  { id: "1", cep: "01310-100", logradouro: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", changeType: "inserção", status: "pendente" },
  { id: "2", cep: "04538-132", logradouro: "Rua Funchal", bairro: "Vila Olímpia", cidade: "São Paulo", uf: "SP", changeType: "inserção", status: "pendente" },
  { id: "3", cep: "22041-080", logradouro: "Rua Barata Ribeiro", bairro: "Copacabana", cidade: "Rio de Janeiro", uf: "RJ", changeType: "inserção", status: "pendente" },
  { id: "4", cep: "30130-000", logradouro: "Praça Sete de Setembro", bairro: "Centro", cidade: "Belo Horizonte", uf: "MG", changeType: "exclusão", status: "pendente" },
  { id: "5", cep: "80010-000", logradouro: "Rua XV de Novembro", bairro: "Centro", cidade: "Curitiba", uf: "PR", changeType: "exclusão", status: "pendente" },
];

const getStatusIcon = (status: CepStatus) => {
  switch (status) {
    case "validado":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "erro":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "validando":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadgeVariant = (status: CepStatus) => {
  switch (status) {
    case "validado":
      return "default";
    case "erro":
      return "destructive";
    case "validando":
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
  const [cepChanges, setCepChanges] = useState<CepChange[]>(mockCepChanges);
  const [selectedCep, setSelectedCep] = useState<string | null>(null);
  const [insertionLogs, setInsertionLogs] = useState<ValidationLog[]>([]);
  const [exclusionLogs, setExclusionLogs] = useState<ValidationLog[]>([]);
  const [isInsertionRunning, setIsInsertionRunning] = useState(false);
  const [isExclusionRunning, setIsExclusionRunning] = useState(false);
  const insertionTerminalRef = useRef<HTMLDivElement>(null);
  const exclusionTerminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const insertionCeps = cepChanges.filter(c => c.changeType === "inserção");
  const exclusionCeps = cepChanges.filter(c => c.changeType === "exclusão");

  // Auto-scroll terminals
  useEffect(() => {
    if (insertionTerminalRef.current) {
      insertionTerminalRef.current.scrollTop = insertionTerminalRef.current.scrollHeight;
    }
  }, [insertionLogs]);

  useEffect(() => {
    if (exclusionTerminalRef.current) {
      exclusionTerminalRef.current.scrollTop = exclusionTerminalRef.current.scrollHeight;
    }
  }, [exclusionLogs]);

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
      description: "Executando validação de inserção...",
    });

    streamLogs(insertionPipelineLogs, setInsertionLogs, () => {
      setIsInsertionRunning(false);
      setCepChanges(prev => prev.map(c => 
        c.changeType === "inserção" ? { ...c, status: "validado" as CepStatus } : c
      ));
      toast({
        title: "Pipeline concluído",
        description: "Validação de inserção finalizada.",
      });
    });
  };

  const handleStartExclusion = () => {
    setIsExclusionRunning(true);
    toast({
      title: "Iniciando pipeline",
      description: "Executando validação de exclusão...",
    });

    streamLogs(exclusionPipelineLogs, setExclusionLogs, () => {
      setIsExclusionRunning(false);
      setCepChanges(prev => prev.map(c => 
        c.changeType === "exclusão" ? { ...c, status: "validado" as CepStatus } : c
      ));
      toast({
        title: "Pipeline concluído",
        description: "Validação de exclusão finalizada.",
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

  const validatedCount = cepChanges.filter(c => c.status === "validado").length;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar - Lista de CEPs alterados */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle className="text-base">CEPs Alterados</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {validatedCount}/{cepChanges.length}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            CHG0174920 - Alterações de CEP
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {cepChanges.map((cep) => (
                <div
                  key={cep.id}
                  onClick={() => setSelectedCep(cep.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCep === cep.id 
                      ? "bg-accent border-primary" 
                      : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${
                    cep.changeType === "inserção" 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {cep.changeType === "inserção" ? (
                      <Plus className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{cep.cep}</span>
                      {getStatusIcon(cep.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {cep.bairro} - {cep.cidade}/{cep.uf}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área principal - Validação */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Execução de Change - CEP</h2>
            <p className="text-muted-foreground text-sm">Validação de inserções e exclusões</p>
          </div>
        </div>

        <Tabs defaultValue="insertion" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="insertion" className="gap-2">
              <Plus className="h-4 w-4" />
              Inserção ({insertionCeps.length})
            </TabsTrigger>
            <TabsTrigger value="exclusion" className="gap-2">
              <Minus className="h-4 w-4" />
              Exclusão ({exclusionCeps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insertion" className="flex-1 mt-4 overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
              {/* Lista de CEPs para inserção */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">CEPs para Validar</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {insertionCeps.filter(c => c.status === "validado").length}/{insertionCeps.length} validados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2">
                  {insertionCeps.map((cep) => (
                    <div
                      key={cep.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(cep.status)}
                        <div>
                          <span className="font-mono font-medium">{cep.cep}</span>
                          <p className="text-xs text-muted-foreground">
                            {cep.logradouro}, {cep.bairro}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(cep.status)} className="text-xs">
                          {cep.status}
                        </Badge>
                        {cep.status === "validado" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {cep.status === "erro" && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Terminal de inserção */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      <CardTitle className="text-base">Pipeline de Inserção</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadLogs(insertionLogs, "insertion-logs.txt")}
                        disabled={insertionLogs.length === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleStartInsertion}
                        disabled={isInsertionRunning}
                      >
                        {isInsertionRunning ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <FileCheck className="h-3 w-3 mr-1" />
                        )}
                        Executar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs h-full">
                    <div 
                      ref={insertionTerminalRef}
                      className="h-full overflow-y-auto"
                    >
                      <div className="space-y-0.5">
                        {insertionLogs.length === 0 && !isInsertionRunning && (
                          <div className="text-zinc-500 flex items-center gap-2">
                            <span className="text-green-400">$</span>
                            <span className="animate-pulse">_</span>
                            <span className="text-zinc-600">Clique em "Executar" para iniciar</span>
                          </div>
                        )}
                        {insertionLogs.map((log, index) => (
                          <div key={index} className="flex gap-2 leading-relaxed">
                            <span className="text-zinc-600 min-w-[50px]">{log.timestamp}</span>
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
            </div>
          </TabsContent>

          <TabsContent value="exclusion" className="flex-1 mt-4 overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
              {/* Lista de CEPs para exclusão */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">CEPs para Excluir</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {exclusionCeps.filter(c => c.status === "validado").length}/{exclusionCeps.length} validados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2">
                  {exclusionCeps.map((cep) => (
                    <div
                      key={cep.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(cep.status)}
                        <div>
                          <span className="font-mono font-medium">{cep.cep}</span>
                          <p className="text-xs text-muted-foreground">
                            {cep.logradouro}, {cep.bairro}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(cep.status)} className="text-xs">
                          {cep.status}
                        </Badge>
                        {cep.status === "validado" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {cep.status === "erro" && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Terminal de exclusão */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      <CardTitle className="text-base">Pipeline de Exclusão</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadLogs(exclusionLogs, "exclusion-logs.txt")}
                        disabled={exclusionLogs.length === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStartExclusion}
                        disabled={isExclusionRunning}
                      >
                        {isExclusionRunning ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Executar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs h-full">
                    <div 
                      ref={exclusionTerminalRef}
                      className="h-full overflow-y-auto"
                    >
                      <div className="space-y-0.5">
                        {exclusionLogs.length === 0 && !isExclusionRunning && (
                          <div className="text-zinc-500 flex items-center gap-2">
                            <span className="text-green-400">$</span>
                            <span className="animate-pulse">_</span>
                            <span className="text-zinc-600">Clique em "Executar" para iniciar</span>
                          </div>
                        )}
                        {exclusionLogs.map((log, index) => (
                          <div key={index} className="flex gap-2 leading-relaxed">
                            <span className="text-zinc-600 min-w-[50px]">{log.timestamp}</span>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
