import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  X,
  Search,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface ChangeInExecution {

  cepsInclude: CepChange[];
  cepsExclude: CepChange[];

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
  serviceTimeline?: {
    today: any[];
    lastWeek?: any[];
  };
}


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
  infraco: string;
  tecnologia: string;
  prioridade: string;
  changeType: string;
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
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: formato válido", type: "success" },
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
  { timestamp: "", message: "  → INSERT INTO cep_master (cep, infraco, bairro, cidade, uf)...", type: "info" },
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

const validationInsertionLogs: ValidationLog[] = [
  { timestamp: "", message: "$ validate-cep-insertion --check", type: "info" },
  { timestamp: "", message: "Iniciando validação de CEPs inseridos...", type: "info" },
  { timestamp: "", message: "[INFO] Conectando à base de dados...", type: "info" },
  { timestamp: "", message: "[STEP 1/3] Verificando existência dos CEPs na base...", type: "info" },
  { timestamp: "", message: "  → SELECT * FROM cep_master WHERE cep IN ('01310-100', '04538-132', '22041-080')", type: "info" },
  { timestamp: "", message: "  ✓ CEP 01310-100: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 04538-132: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "  ✓ CEP 22041-080: encontrado na base", type: "success" },
  { timestamp: "", message: "[STEP 2/3] Validando integridade dos dados...", type: "info" },
  { timestamp: "", message: "  → Verificando campos obrigatórios...", type: "info" },
  { timestamp: "", message: "  ✓ Todos os campos preenchidos corretamente", type: "success" },
  { timestamp: "", message: "[STEP 3/3] Testando consulta via API...", type: "info" },
  { timestamp: "", message: "  → GET https://api.correios.com.br/cep/01310-100", type: "info" },
  { timestamp: "", message: "  ✓ API retornando dados corretos", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Validação de inserção concluída com sucesso!", type: "success" },
  { timestamp: "", message: "  CEPs verificados: 3", type: "info" },
  { timestamp: "", message: "  CEPs válidos: 3", type: "success" },
  { timestamp: "", message: "  CEPs inválidos: 0", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
];

const validationExclusionLogs: ValidationLog[] = [
  { timestamp: "", message: "$ validate-cep-exclusion --check", type: "info" },
  { timestamp: "", message: "Iniciando validação de CEPs excluídos...", type: "info" },
  { timestamp: "", message: "[INFO] Conectando à base de dados...", type: "info" },
  { timestamp: "", message: "[STEP 1/3] Verificando remoção dos CEPs...", type: "info" },
  { timestamp: "", message: "  → SELECT * FROM cep_master WHERE cep IN ('30130-000', '80010-000')", type: "info" },
  { timestamp: "", message: "  ✓ CEP 30130-000: não encontrado (removido)", type: "success" },
  { timestamp: "", message: "  ✓ CEP 80010-000: não encontrado (removido)", type: "success" },
  { timestamp: "", message: "[STEP 2/3] Verificando arquivamento...", type: "info" },
  { timestamp: "", message: "  → SELECT * FROM cep_archive WHERE cep IN ('30130-000', '80010-000')", type: "info" },
  { timestamp: "", message: "  ✓ Registros arquivados corretamente", type: "success" },
  { timestamp: "", message: "[STEP 3/3] Verificando cache...", type: "info" },
  { timestamp: "", message: "  → EXISTS cep:30130-000 cep:80010-000", type: "info" },
  { timestamp: "", message: "  ✓ Cache limpo, CEPs não encontrados", type: "success" },
  { timestamp: "", message: "", type: "info" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
  { timestamp: "", message: "Validação de exclusão concluída com sucesso!", type: "success" },
  { timestamp: "", message: "  CEPs verificados: 2", type: "info" },
  { timestamp: "", message: "  Exclusões confirmadas: 2", type: "success" },
  { timestamp: "", message: "═══════════════════════════════════════════════════════", type: "info" },
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

interface ChangeExecutionCepProps {
  change: ChangeInExecution;
}

export default function ChangeExecutionCep({ change }: ChangeExecutionCepProps) {
  const [cepChanges, setCepChanges] = useState<CepChange[]>(change.cepsInclude);
  const [selectedCep, setSelectedCep] = useState<string | null>(null);
  const [insertionLogs, setInsertionLogs] = useState<ValidationLog[]>([]);
  const [exclusionLogs, setExclusionLogs] = useState<ValidationLog[]>([]);
  const [validationInsLogs, setValidationInsLogs] = useState<ValidationLog[]>([]);
  const [validationExcLogs, setValidationExcLogs] = useState<ValidationLog[]>([]);
  const [isInsertionRunning, setIsInsertionRunning] = useState(false);
  const [isExclusionRunning, setIsExclusionRunning] = useState(false);
  const [isValidationInsRunning, setIsValidationInsRunning] = useState(false);
  const [isValidationExcRunning, setIsValidationExcRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const insertionTerminalRef = useRef<HTMLDivElement>(null);
  const exclusionTerminalRef = useRef<HTMLDivElement>(null);
  const validationInsTerminalRef = useRef<HTMLDivElement>(null);
  const validationExcTerminalRef = useRef<HTMLDivElement>(null);
  const deleteEventSourceRef = useRef<EventSource | null>(null);
  const insertEventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();
  const insertionCeps = change.cepsInclude;
  const exclusionCeps = change.cepsExclude;
  
  const filteredInsertionCeps = insertionCeps.filter(c => 
    c.cep.includes(searchTerm) || 
    c.tecnologia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.infraco.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredExclusionCeps = exclusionCeps.filter(c => 
    c.cep.includes(searchTerm) || 
    c.tecnologia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.infraco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MAX_DELETE_LINES = 300;

  const startDelete = (changeNumber: string) => {
    // Cancela execução se já estiver rodando
    if (deleteEventSourceRef.current) {
      deleteEventSourceRef.current.close();
      deleteEventSourceRef.current = null;
      setIsExclusionRunning(false);
      return;
    }

    setIsExclusionRunning(true);
    setExclusionLogs([]); // limpa terminal

    const es = new EventSource(
      `http://10.151.1.54:8000/v1/digibee-change-cep?change_number=${encodeURIComponent(changeNumber)}&execution_type=exclusion`
    );

    deleteEventSourceRef.current = es;

    es.onmessage = (e) => {
      const timestamp = new Date().toISOString().slice(11, 19);

      setExclusionLogs(prev => {
        const next = [
          ...prev,
          {
            timestamp,
            message: e.data,
            type: "info" as const,
          },
        ];

        // Limite de linhas (igual seu código antigo)
        if (next.length > MAX_DELETE_LINES) {
          return next.slice(next.length - MAX_DELETE_LINES);
        }

        return next;
      });
    };

    es.onerror = (err) => {
      console.error("Erro na conexão do SSE de deleção", err);

      es.close();
      deleteEventSourceRef.current = null;
      setIsExclusionRunning(false);

      setExclusionLogs(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString().slice(11, 19),
          message: "Conexão encerrada.",
          type: "error" as const,
        },
      ]);
    };
  };

  const startInsert = (changeNumber: string) => {
    // Cancela execução se já estiver rodando
    if (insertEventSourceRef.current) {
      insertEventSourceRef.current.close();
      insertEventSourceRef.current = null;
      setIsInsertionRunning(false);
      return;
    }

    setIsInsertionRunning(true);
    setInsertionLogs([]); // limpa terminal

    const es = new EventSource(
      `http://10.151.1.54:8000/v1/digibee-change-cep?change_number=${encodeURIComponent(changeNumber)}&execution_type=inclusion`
    );

    insertEventSourceRef.current = es;

    es.onmessage = (e) => {
      const timestamp = new Date().toISOString().slice(11, 19);

      setInsertionLogs(prev => {
        const next = [
          ...prev,
          {
            timestamp,
            message: e.data,
            type: "info" as const,
          },
        ];

        // Limite de linhas (igual seu código antigo)
        if (next.length > MAX_DELETE_LINES) {
          return next.slice(next.length - MAX_DELETE_LINES);
        }

        return next;
      });
    };

    es.onerror = (err) => {
      console.error("Erro na conexão do SSE de deleção", err);

      es.close();
      insertEventSourceRef.current = null;
      setIsInsertionRunning(false);

      setInsertionLogs(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString().slice(11, 19),
          message: "Conexão encerrada.",
          type: "error",
        },
      ]);
    };
  };


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

  useEffect(() => {
    if (validationInsTerminalRef.current) {
      validationInsTerminalRef.current.scrollTop = validationInsTerminalRef.current.scrollHeight;
    }
  }, [validationInsLogs]);

  useEffect(() => {
    if (validationExcTerminalRef.current) {
      validationExcTerminalRef.current.scrollTop = validationExcTerminalRef.current.scrollHeight;
    }
  }, [validationExcLogs]);

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
        description: "Pipeline de exclusão finalizado.",
      });
    });
  };

  const handleStartValidationInsertion = () => {
    setIsValidationInsRunning(true);
    toast({
      title: "Iniciando validação",
      description: "Verificando CEPs inseridos na base...",
    });

    streamLogs(validationInsertionLogs, setValidationInsLogs, () => {
      setIsValidationInsRunning(false);
      toast({
        title: "Validação concluída",
        description: "CEPs inseridos verificados com sucesso.",
      });
    });
  };

  const handleStartValidationExclusion = () => {
    setIsValidationExcRunning(true);
    toast({
      title: "Iniciando validação",
      description: "Verificando CEPs excluídos da base...",
    });

    streamLogs(validationExclusionLogs, setValidationExcLogs, () => {
      setIsValidationExcRunning(false);
      toast({
        title: "Validação concluída",
        description: "CEPs excluídos verificados com sucesso.",
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

  const validatedCount = [];

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
              {change.changeSystemData.number} - Alterações de CEP
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {change.cepsInclude.map((cep) => (
                <div
                  key={cep.id}
                  onClick={() => setSelectedCep(cep.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCep === cep.id 
                      ? "bg-accent border-primary" 
                      : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className={`p-1.5 rounded-full bg-green-500/10 text-green-500`}>
                      <Plus className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{cep.cep}</span>
                      {getStatusIcon(cep.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
      {cep.tecnologia} - {cep.infraco}/{cep.prioridade}
                    </p>
                  </div>
                </div>
              ))}
              {change.cepsExclude.map((cep) => (
                <div
                  key={cep.id}
                  onClick={() => setSelectedCep(cep.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCep === cep.id 
                      ? "bg-accent border-primary" 
                      : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className='p-1.5 rounded-full bg-red-500/10 text-red-500'>

                      <Minus className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{cep.cep}</span>
                      {getStatusIcon(cep.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {cep.tecnologia} - {cep.infraco}/{cep.prioridade}
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

        <Tabs defaultValue="insertion" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="insertion" className="gap-2">
              <Plus className="h-4 w-4" />
              Inserção ({insertionCeps.length})
            </TabsTrigger>
            <TabsTrigger value="exclusion" className="gap-2">
              <Minus className="h-4 w-4" />
              Exclusão ({exclusionCeps.length})
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Validação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insertion" className="flex-1 mt-4 min-h-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full min-h-0">
              {/* Lista de CEPs para inserção */}
              <Card className="flex flex-col min-h-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">CEPs para Validar</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {insertionCeps.filter(c => c.status === "validado").length}/{insertionCeps.length} validados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-2">
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
                            {cep.infraco} - {cep.tecnologia}
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
              <Card className="flex flex-col min-h-0">
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
                        variant="destructive"
                        onClick={() =>
                          startInsert(change.changeSystemData.number)
                        }
                      >
                      {isInsertionRunning ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      {isInsertionRunning ? "Cancelando..." : "Executar"}
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

          <TabsContent value="exclusion" className="flex-1 mt-4 overflow-hidden max-h-[90%]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full min-h-0">
              {/* Lista de CEPs para exclusão */}
              <Card className="flex flex-col min-h-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">CEPs para Excluir</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {exclusionCeps.filter(c => c.status === "validado").length}/{exclusionCeps.length} validados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-2">
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
                            {cep.infraco}, {cep.tecnologia}
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
              <Card className="flex flex-col min-h-0">
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
                        onClick={() =>
                          startDelete(change.changeSystemData.number)
                        }
                      >
                        {isExclusionRunning ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {isExclusionRunning ? "Cancelando..." : "Executar"}
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

          {/* Tab de Validação */}
          <TabsContent value="validation" className="flex-1 mt-4 overflow-hidden">
            <div className="space-y-6 h-full overflow-y-auto">
              {/* Barra de busca */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar CEP, cidade ou bairro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Validação de CEPs Incluídos */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-green-500/10 text-green-500">
                        <Plus className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">Validação de CEPs Incluídos</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {filteredInsertionCeps.length} CEPs
                    </Badge>
                  </div>
                  <CardDescription>
                    Verifica se os CEPs foram inseridos corretamente na base de dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de CEPs incluídos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredInsertionCeps.map((cep) => (
                      <div
                        key={cep.id}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-mono font-medium">{cep.cep}</span>
                        <span className="text-muted-foreground truncate">
                          {cep.infraco}/{cep.tecnologia}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal de validação */}
                  <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs h-48">
                    <div 
                      ref={validationInsTerminalRef}
                      className="h-full overflow-y-auto"
                    >
                      <div className="space-y-0.5">
                        {validationInsLogs.length === 0 && !isValidationInsRunning && (
                          <div className="text-zinc-500 flex items-center gap-2">
                            <span className="text-green-400">$</span>
                            <span className="animate-pulse">_</span>
                            <span className="text-zinc-600">Clique em "Iniciar validação" para verificar</span>
                          </div>
                        )}
                        {validationInsLogs.map((log, index) => (
                          <div key={index} className="flex gap-2 leading-relaxed">
                            <span className="text-zinc-600 min-w-[50px]">{log.timestamp}</span>
                            <span className={getLogColor(log.type)}>{log.message}</span>
                          </div>
                        ))}
                        {isValidationInsRunning && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <span className="animate-pulse">▌</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartValidationInsertion}
                      disabled={isValidationInsRunning}
                      className="flex-1"
                    >
                      {isValidationInsRunning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      )}
                      Iniciar validação
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadLogs(validationInsLogs, "validation-insertion-logs.txt")}
                      disabled={validationInsLogs.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Validação de CEPs Excluídos */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-red-500/10 text-red-500">
                        <Minus className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">Validação de CEPs Excluídos</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {filteredExclusionCeps.length} CEPs
                    </Badge>
                  </div>
                  <CardDescription>
                    Verifica se os CEPs foram removidos corretamente da base de dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de CEPs excluídos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredExclusionCeps.map((cep) => (
                      <div
                        key={cep.id}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm"
                      >
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="font-mono font-medium">{cep.cep}</span>
                        <span className="text-muted-foreground truncate">
                          {cep.infraco}/{cep.tecnologia}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal de validação */}
                  <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs h-48">
                    <div 
                      ref={validationExcTerminalRef}
                      className="h-full overflow-y-auto"
                    >
                      <div className="space-y-0.5">
                        {validationExcLogs.length === 0 && !isValidationExcRunning && (
                          <div className="text-zinc-500 flex items-center gap-2">
                            <span className="text-green-400">$</span>
                            <span className="animate-pulse">_</span>
                            <span className="text-zinc-600">Clique em "Iniciar validação" para verificar</span>
                          </div>
                        )}
                        {validationExcLogs.map((log, index) => (
                          <div key={index} className="flex gap-2 leading-relaxed">
                            <span className="text-zinc-600 min-w-[50px]">{log.timestamp}</span>
                            <span className={getLogColor(log.type)}>{log.message}</span>
                          </div>
                        ))}
                        {isValidationExcRunning && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <span className="animate-pulse">▌</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleStartValidationExclusion}
                      disabled={isValidationExcRunning}
                      className="flex-1"
                    >
                      {isValidationExcRunning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      )}
                      Iniciar validação
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadLogs(validationExcLogs, "validation-exclusion-logs.txt")}
                      disabled={validationExcLogs.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
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
