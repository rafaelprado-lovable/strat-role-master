import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Star, CalendarIcon, AlertTriangle, Search, Eye, CheckCircle, XCircle, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import pptxgen from "pptxgenjs";
import { PostChangeDetailsDialog, PostChange } from "@/components/changes/PostChangeDetailsDialog";

// Helper function to generate timeline data points
const generateTimelineData = (
  dayKey: string,
  serviceName: string,
  application: string,
  routePath: string,
  baseMetrics: { base2xx: number; base4xx: number; base5xx: number; baseAvgTime: number },
  hours: number = 12,
  variation5xx: number = 1 // multiplier for 5xx errors
) => {
  const data = [];
  for (let h = 0; h < hours; h++) {
    for (let m = 0; m < 60; m += 30) {
      const timeStr = `${dayKey} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      const hourMultiplier = 1 + (h * 0.05); // Traffic increases throughout the day
      const randomVariation = 0.85 + Math.random() * 0.3; // 85% to 115% variation
      
      data.push({
        timestamp: timeStr,
        context_info: { application, service_name: serviceName, route_path: routePath },
        http_code_group: [
          { code: "2xx", total_count: Math.round(baseMetrics.base2xx * hourMultiplier * randomVariation), avg_time: baseMetrics.baseAvgTime * 0.12 * randomVariation },
          { code: "4xx", total_count: Math.round(baseMetrics.base4xx * randomVariation), avg_time: baseMetrics.baseAvgTime * 2.5 * randomVariation },
          { code: "5xx", total_count: Math.round(baseMetrics.base5xx * variation5xx * randomVariation), avg_time: baseMetrics.baseAvgTime * 0.15 * randomVariation }
        ],
        avg_time: baseMetrics.baseAvgTime * randomVariation
      });
    }
  }
  return data;
};

// Mock data for executed changes
const mockPostChanges: PostChange[] = [
  {
    id: "1",
    numero: "CHG0170034",
    descricao: "Atualização de API de autenticação PMID",
    dataExecucao: "15/11/2024 22:00:00",
    sistema: "Autorizar",
    plataforma: "PMID",
    status: "rollback",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - OMS - N3",
    motivoRollback: "rollback por falta de validação",
    detalheRollback: "Em horário de janela e sem impacto",
    tempoExecucao: "45 min",
    impacto: "Baixo",
    servicos: [
      { nome: "auth-service", versaoAnterior: "2.1.0", versaoNova: "2.2.0", statusInstalacao: "Rollback" },
    ],
    validacoes: { validacaoFuncional: false, validacaoHDC: true, rollbackExecutado: true, impactoCliente: false },
    observacoes: "Rollback realizado devido à falta de validação funcional antes da execução.",
    serviceTimeline: {
      today: [
        {
          day_key: "2026-01-22",
          services: [
            // Service 1: auth-service-v2-prd (with elevated 5xx errors - 8x more than last week)
            ...generateTimelineData(
              "2026-01-22", 
              "auth-service-v2-prd", 
              "PMID", 
              "/auth/v2/token",
              { base2xx: 1100, base4xx: 15, base5xx: 40, baseAvgTime: 3000 },
              12,
              1 // current rate
            ),
            // Service 2: user-profile-api (normal levels)
            ...generateTimelineData(
              "2026-01-22",
              "user-profile-api",
              "PMID",
              "/users/v1/profile",
              { base2xx: 2400, base4xx: 30, base5xx: 5, baseAvgTime: 1000 },
              12,
              1
            ),
            // Service 3: payment-gateway-prd (slight decrease in errors)
            ...generateTimelineData(
              "2026-01-22",
              "payment-gateway-prd",
              "Gateway",
              "/payments/v2/process",
              { base2xx: 900, base4xx: 10, base5xx: 6, baseAvgTime: 1700 },
              12,
              1
            )
          ]
        }
      ],
      lastWeek: [
        {
          day_key: "2026-01-15",
          services: [
            // Service 1: auth-service-v2-prd (much lower 5xx last week - triggers critical alert)
            ...generateTimelineData(
              "2026-01-15",
              "auth-service-v2-prd",
              "PMID",
              "/auth/v2/token",
              { base2xx: 1050, base4xx: 12, base5xx: 5, baseAvgTime: 3200 },
              12,
              1 // baseline rate - today has 8x more 5xx
            ),
            // Service 2: user-profile-api
            ...generateTimelineData(
              "2026-01-15",
              "user-profile-api",
              "PMID",
              "/users/v1/profile",
              { base2xx: 2300, base4xx: 35, base5xx: 7, baseAvgTime: 1050 },
              12,
              1
            ),
            // Service 3: payment-gateway-prd (had more errors last week)
            ...generateTimelineData(
              "2026-01-15",
              "payment-gateway-prd",
              "Gateway",
              "/payments/v2/process",
              { base2xx: 900, base4xx: 10, base5xx: 11, baseAvgTime: 1550 },
              12,
              1
            )
          ]
        }
      ]
    }
  },
  {
    id: "2",
    numero: "CHG0170427",
    descricao: "Liberação de clientid para nova integração",
    dataExecucao: "16/11/2024 22:00:00",
    sistema: "Autorizar",
    plataforma: "PMID",
    status: "rollback",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - PMID - N3",
    motivoRollback: "rollback por falta de validação",
    detalheRollback: "Em horário de janela e sem impacto",
    tempoExecucao: "30 min",
    impacto: "Baixo",
    servicos: [],
    validacoes: { validacaoFuncional: false, validacaoHDC: false, rollbackExecutado: true, impactoCliente: false },
    observacoes: ""
  },
  {
    id: "3",
    numero: "CHG0173972",
    descricao: "Projeto HUB - Liberação de clientid e criação de rota interna - API Detalhamento de produtos",
    dataExecucao: "17/11/2024 22:00:00",
    sistema: "Autorizar",
    plataforma: "PMID",
    status: "sucesso",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - OMS - N3, CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    tempoExecucao: "1h 15min",
    impacto: "Nenhum",
    servicos: [
      { nome: "hub-api", versaoAnterior: "1.0.0", versaoNova: "1.1.0", statusInstalacao: "Sucesso" },
      { nome: "product-detail-api", versaoAnterior: "3.2.1", versaoNova: "3.3.0", statusInstalacao: "Sucesso" },
    ],
    validacoes: { validacaoFuncional: true, validacaoHDC: true, rollbackExecutado: false, impactoCliente: false },
    observacoes: "Execução realizada com sucesso dentro da janela programada."
  },
  {
    id: "4",
    numero: "CHG0174528",
    descricao: "Projeto HUB - Liberação da nova API de recarga do TIMWE",
    dataExecucao: "17/11/2024 23:00:00",
    sistema: "Autorizar",
    plataforma: "PMID",
    status: "sucesso",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - OMS - N3",
    tempoExecucao: "50 min",
    impacto: "Nenhum",
    servicos: [
      { nome: "recarga-timwe-api", versaoAnterior: "N/A", versaoNova: "1.0.0", statusInstalacao: "Sucesso" },
    ],
    validacoes: { validacaoFuncional: true, validacaoHDC: true, rollbackExecutado: false, impactoCliente: false },
    observacoes: ""
  },
  {
    id: "5",
    numero: "CHG0168326",
    descricao: "Atualização de configuração INFOBUS",
    dataExecucao: "18/11/2024 22:00:00",
    sistema: "Integração",
    plataforma: "INFOBUS",
    status: "rollback",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - INFOBUS - N3",
    motivoRollback: "rollback por falha na configuração",
    detalheRollback: "Em horário de janela e sem impacto",
    tempoExecucao: "25 min",
    impacto: "Baixo",
    servicos: [
      { nome: "infobus-config", versaoAnterior: "1.5.0", versaoNova: "1.6.0", statusInstalacao: "Rollback" },
    ],
    validacoes: { validacaoFuncional: true, validacaoHDC: false, rollbackExecutado: true, impactoCliente: false },
    observacoes: "Falha na configuração identificada durante validação HDC."
  },
  {
    id: "6",
    numero: "CHG0170428",
    descricao: "Deploy de nova versão NMWS",
    dataExecucao: "19/11/2024 22:00:00",
    sistema: "Novo",
    plataforma: "NMWS",
    status: "rollback",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - OMS - N3",
    motivoRollback: "rollback por falta de validação",
    detalheRollback: "Em horário de janela e sem impacto",
    tempoExecucao: "35 min",
    impacto: "Baixo",
    servicos: [],
    validacoes: { validacaoFuncional: false, validacaoHDC: true, rollbackExecutado: true, impactoCliente: false },
    observacoes: ""
  },
  {
    id: "7",
    numero: "CHG0175001",
    descricao: "Atualização SAP-BASIS - Patch de segurança",
    dataExecucao: "20/11/2024 02:00:00",
    sistema: "Enterprise",
    plataforma: "SAP-BASIS",
    status: "sucesso",
    equipesAplicacao: "CTIO IT - ENTERPRISE OPERATIONS - SAP - N3",
    equipesValidacao: "CTIO IT - ENTERPRISE OPERATIONS - SAP - N3",
    tempoExecucao: "2h 30min",
    impacto: "Nenhum",
    servicos: [
      { nome: "sap-basis-core", versaoAnterior: "7.52", versaoNova: "7.53", statusInstalacao: "Sucesso" },
    ],
    validacoes: { validacaoFuncional: true, validacaoHDC: true, rollbackExecutado: false, impactoCliente: false },
    observacoes: "Patch aplicado com sucesso durante janela de manutenção."
  },
  {
    id: "8",
    numero: "CHG0175002",
    descricao: "Liberação VAS - Nova feature de notificações",
    dataExecucao: "20/11/2024 22:00:00",
    sistema: "Integração",
    plataforma: "VAS",
    status: "sucesso",
    equipesAplicacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - VAS - N3",
    equipesValidacao: "CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - VAS - N3",
    tempoExecucao: "1h",
    impacto: "Nenhum",
    servicos: [
      { nome: "vas-notification-service", versaoAnterior: "2.0.0", versaoNova: "2.1.0", statusInstalacao: "Sucesso" },
    ],
    validacoes: { validacaoFuncional: true, validacaoHDC: true, rollbackExecutado: false, impactoCliente: false },
    observacoes: ""
  },
];

// Chart data
const cicEngineeringData = [
  { name: "VENDAS", sucesso: 13, rollback: 0 },
  { name: "OMS", sucesso: 8, rollback: 0 },
  { name: "RECARGA", sucesso: 2, rollback: 0 },
  { name: "ECM", sucesso: 1, rollback: 0 },
];

const enterpriseData = [
  { name: "SAP-BASIS", sucesso: 35, rollback: 0 },
  { name: "SAP-SD", sucesso: 4, rollback: 0 },
  { name: "SAP-MM", sucesso: 2, rollback: 0 },
  { name: "OAM/SENHA ÚNICA", sucesso: 2, rollback: 0 },
  { name: "SAP-PI", sucesso: 1, rollback: 0 },
  { name: "SAP-FI", sucesso: 1, rollback: 0 },
];

const integracoesData = [
  { name: "PMID", sucesso: 26, rollback: 8 },
  { name: "VAS", sucesso: 18, rollback: 0 },
  { name: "NMWS", sucesso: 11, rollback: 2 },
  { name: "API/IMDB", sucesso: 4, rollback: 0 },
  { name: "DIGIBEE", sucesso: 2, rollback: 0 },
  { name: "INFOBUS", sucesso: 1, rollback: 1 },
  { name: "FASTDATA", sucesso: 1, rollback: 1 },
];

const rollbackDetails = [
  {
    sistema: "PMID",
    totalRollbacks: 8,
    changes: [
      { numero: "CHG0170034", motivo: "rollback por falta de validação", detalhe: "Em horário de janela e sem impacto" },
      { numero: "CHG0170427", motivo: "rollback por falta de validação", detalhe: "Em horário de janela e sem impacto" },
      { numero: "CHG0170797", motivo: "rollback por falha no código", detalhe: "Em horário de janela e sem impacto" },
      { numero: "CHG0171827", motivo: "rollback por falha no change form", detalhe: "Em horário de janela e sem impacto" },
      { numero: "CHG0173858", motivo: "rollback por falha no código", detalhe: "" },
      { numero: "CHG0163462", motivo: "rollback por solicitação do validador", detalhe: "" },
      { numero: "CHG0172697", motivo: "rollback por falta de firewall", detalhe: "" },
      { numero: "CHG0174916", motivo: "rollback por falha no código", detalhe: "" },
    ],
  },
  {
    sistema: "INFOBUS",
    totalRollbacks: 1,
    changes: [
      { numero: "CHG0168326", motivo: "rollback por falha na configuração", detalhe: "Em horário de janela e sem impacto" },
    ],
  },
  {
    sistema: "NMWS",
    totalRollbacks: 2,
    changes: [
      { numero: "CHG0170428", motivo: "rollback por falta de validação", detalhe: "Em horário de janela e sem impacto" },
      { numero: "CHG0173349", motivo: "rollback por falta de firewall", detalhe: "" },
    ],
  },
  {
    sistema: "FASTDATA",
    totalRollbacks: 1,
    changes: [
      { numero: "CHG0173997", motivo: "rollback por falha no código", detalhe: "" },
    ],
  },
];

const calculateSuccessRate = (data: { sucesso: number; rollback: number }[]) => {
  const totalSuccesso = data.reduce((acc, item) => acc + item.sucesso, 0);
  const totalRollback = data.reduce((acc, item) => acc + item.rollback, 0);
  const total = totalSuccesso + totalRollback;
  if (total === 0) return 100;
  return ((totalSuccesso / total) * 100).toFixed(1);
};

const PostChangePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChange, setSelectedChange] = useState<PostChange | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const itemsPerPage = 10;

  const cicSuccessRate = calculateSuccessRate(cicEngineeringData);
  const enterpriseSuccessRate = calculateSuccessRate(enterpriseData);
  const integracoesSuccessRate = calculateSuccessRate(integracoesData);

  const filteredChanges = mockPostChanges.filter((change) => {
    const matchesSearch =
      change.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.plataforma.toLowerCase().includes(searchTerm.toLowerCase());

    const changeDate = new Date(change.dataExecucao.split(" ")[0].split("/").reverse().join("-"));
    const matchesStartDate = !startDate || changeDate >= startDate;
    const matchesEndDate = !endDate || changeDate <= endDate;

    const matchesPlatform = platformFilter === "all" || change.plataforma === platformFilter;
    const matchesStatus = statusFilter === "all" || change.status === statusFilter;

    return matchesSearch && matchesStartDate && matchesEndDate && matchesPlatform && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChanges = filteredChanges.slice(startIndex, endIndex);

  const handleVisualizar = (change: PostChange) => {
    setSelectedChange(change);
    setDetailsOpen(true);
  };

  const exportToPPTX = async () => {
    const pptx = new pptxgen();
    pptx.author = "Heimdall";
    pptx.title = "Relatório Pós Change";
    pptx.subject = "Análise de Changes";

    // Slide 1 - Title
    const slide1 = pptx.addSlide();
    slide1.addText("Relatório Pós Change", {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: "1a1a2e",
      align: "center",
    });
    slide1.addText(
      `Período: ${startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Início"} - ${endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Fim"}`,
      {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: "666666",
        align: "center",
      }
    );
    slide1.addText(`Atualização: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: "999999",
      align: "center",
    });

    // Slide 2 - CIC Engineering
    const slide2 = pptx.addSlide();
    slide2.addText(`⭐ Taxa de Sucesso CIC - Engineering = ${cicSuccessRate}%`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "228B22",
    });

    slide2.addChart(pptx.ChartType.bar, [
      {
        name: "Sucesso",
        labels: cicEngineeringData.map(d => d.name),
        values: cicEngineeringData.map(d => d.sucesso),
      },
      {
        name: "Rollback",
        labels: cicEngineeringData.map(d => d.name),
        values: cicEngineeringData.map(d => d.rollback),
      },
    ], {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      showLegend: true,
      legendPos: "b",
      chartColors: ["4169E1", "FFB347"],
    });

    // Slide 3 - Enterprise
    const slide3 = pptx.addSlide();
    slide3.addText(`⭐ Taxa de Sucesso Enterprise = ${enterpriseSuccessRate}%`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "228B22",
    });

    slide3.addChart(pptx.ChartType.bar, [
      {
        name: "Sucesso",
        labels: enterpriseData.map(d => d.name),
        values: enterpriseData.map(d => d.sucesso),
      },
      {
        name: "Rollback",
        labels: enterpriseData.map(d => d.name),
        values: enterpriseData.map(d => d.rollback),
      },
    ], {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      showLegend: true,
      legendPos: "b",
      chartColors: ["4169E1", "FFB347"],
    });

    // Slide 4 - Integrações
    const slide4 = pptx.addSlide();
    slide4.addText(`⭐ Taxa de Sucesso - Integrações = ${integracoesSuccessRate}%`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "228B22",
    });

    slide4.addChart(pptx.ChartType.bar, [
      {
        name: "Sucesso",
        labels: integracoesData.map(d => d.name),
        values: integracoesData.map(d => d.sucesso),
      },
      {
        name: "ROLLBACK",
        labels: integracoesData.map(d => d.name),
        values: integracoesData.map(d => d.rollback),
      },
    ], {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      showLegend: true,
      legendPos: "b",
      chartColors: ["4169E1", "FFB347"],
    });

    // Slide 5 - Rollback Details
    const slide5 = pptx.addSlide();
    slide5.addText("Importante: Detalhes dos Rollbacks", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "CC0000",
    });

    let yPos = 1;
    rollbackDetails.forEach((sistema) => {
      slide5.addText(`${sistema.sistema} (${sistema.totalRollbacks} rollback${sistema.totalRollbacks > 1 ? "s" : ""})`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: "1a1a2e",
      });
      yPos += 0.35;

      sistema.changes.forEach((change) => {
        slide5.addText(`${change.numero} – ${change.motivo}${change.detalhe ? ` (${change.detalhe})` : ""}`, {
          x: 0.7,
          y: yPos,
          w: 8.5,
          h: 0.25,
          fontSize: 9,
          color: "666666",
        });
        yPos += 0.25;
      });
      yPos += 0.15;
    });

    await pptx.writeFile({ fileName: `relatorio-pos-change-${format(new Date(), "yyyy-MM-dd")}.pptx` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pós Change</h2>
          <p className="text-muted-foreground">Análise de execução e taxa de sucesso das changes</p>
        </div>

        <Button onClick={exportToPPTX} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PPTX
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Data de Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Número da Change</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Plataforma */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as plataformas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as plataformas</SelectItem>
                  <SelectItem value="PMID">PMID</SelectItem>
                  <SelectItem value="NMWS">NMWS</SelectItem>
                  <SelectItem value="VAS">VAS</SelectItem>
                  <SelectItem value="INFOBUS">INFOBUS</SelectItem>
                  <SelectItem value="SAP-BASIS">SAP-BASIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rates Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-green-600">Taxa de Sucesso CIC - Engineering = {cicSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-green-600">Taxa de Sucesso Enterprise = {enterpriseSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-green-600">Taxa de Sucesso - Integrações = {integracoesSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Changes Executadas</CardTitle>
          <CardDescription>
            Visualização cronológica das changes executadas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {filteredChanges.length === 0 ? (
                <div className="w-full text-center py-8 text-muted-foreground">
                  Nenhuma change encontrada para o período
                </div>
              ) : (
                filteredChanges.map((change, index) => {
                  const parsedDate = change.dataExecucao.split(" ")[0].split("/");
                  const formattedDate = `${parsedDate[0]}/${parsedDate[1]}/${parsedDate[2]}`;
                  
                  return (
                    <div key={change.id} className="relative flex flex-col items-center">
                      {index < filteredChanges.length - 1 && (
                        <div className="absolute top-4 left-[calc(50%+80px)] w-8 h-0.5 bg-border" />
                      )}
                      
                      <div className={cn(
                        "w-3 h-3 rounded-full mb-3 z-10",
                        change.status === "sucesso" ? "bg-green-500" : "bg-destructive"
                      )} />
                      
                      <Card 
                        className={cn(
                          "w-[280px] cursor-pointer transition-colors flex-shrink-0",
                          change.status === "sucesso" 
                            ? "hover:border-green-500/50" 
                            : "hover:border-destructive/50 border-destructive/30"
                        )}
                        onClick={() => handleVisualizar(change)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {change.numero}
                            </Badge>
                            <Badge variant={change.status === "sucesso" ? "default" : "destructive"} className="text-xs">
                              {change.status === "sucesso" ? "Sucesso" : "Rollback"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formattedDate} - {change.plataforma}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>Descrição</span>
                            </div>
                            <p className="text-sm line-clamp-2">{change.descricao}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Equipe na Implementação</span>
                            </div>
                            <p className="text-xs line-clamp-2 text-muted-foreground">
                              {change.equipesAplicacao || "Não informado"}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {change.status === "sucesso" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">{change.tempoExecucao}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">CIC - ENGINEERING</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cicEngineeringData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" name="Sucesso" fill="hsl(var(--primary))" />
                <Bar dataKey="rollback" name="Sem Rollback" fill="hsl(var(--warning))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">ENTERPRISE</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enterpriseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" name="Sucesso" fill="hsl(var(--primary))" />
                <Bar dataKey="rollback" name="Sem Rollback" fill="hsl(var(--warning))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">INTEGRAÇÕES</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={integracoesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" name="Sucesso" fill="hsl(var(--primary))" />
                <Bar dataKey="rollback" name="ROLLBACK" fill="hsl(var(--warning))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Importante: Detalhes dos Rollbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {rollbackDetails.map((sistema) => (
                  <div key={sistema.sistema}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="font-semibold">
                        {sistema.sistema} ({sistema.totalRollbacks} rollback{sistema.totalRollbacks > 1 ? "s" : ""})
                      </Badge>
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-muted">
                      {sistema.changes.map((change) => (
                        <div key={change.numero} className="text-sm">
                          <span className="font-mono text-muted-foreground">{change.numero}</span>
                          <span className="mx-1">–</span>
                          <span className="text-destructive">{change.motivo}</span>
                          {change.detalhe && (
                            <span className="text-muted-foreground"> ({change.detalhe})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listagem de Changes Executadas</CardTitle>
          <CardDescription>
            Detalhamento de todas as changes executadas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NÚMERO</TableHead>
                <TableHead>DESCRIÇÃO</TableHead>
                <TableHead>PLATAFORMA</TableHead>
                <TableHead>DATA EXECUÇÃO</TableHead>
                <TableHead>TEMPO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentChanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma change encontrada
                  </TableCell>
                </TableRow>
              ) : (
                currentChanges.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="font-mono font-medium">{change.numero}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{change.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{change.plataforma}</Badge>
                    </TableCell>
                    <TableCell>{change.dataExecucao.split(" ")[0]}</TableCell>
                    <TableCell>{change.tempoExecucao}</TableCell>
                    <TableCell>
                      <Badge variant={change.status === "sucesso" ? "default" : "destructive"}>
                        {change.status === "sucesso" ? "Sucesso" : "Rollback"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVisualizar(change)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
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
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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

      {/* Footer */}
      <div className="text-right text-sm text-muted-foreground">
        Atualização: {format(new Date(), "dd/MM", { locale: ptBR })}
      </div>

      {/* Details Dialog */}
      {selectedChange && (
        <PostChangeDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          change={selectedChange}
        />
      )}
    </div>
  );
};

export default PostChangePage;
