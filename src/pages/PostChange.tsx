import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Star, CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import pptxgen from "pptxgenjs";

// Mock data for success rates
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

const PostChange = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2024, 10, 1),
    to: new Date(2024, 10, 25),
  });

  const cicSuccessRate = calculateSuccessRate(cicEngineeringData);
  const enterpriseSuccessRate = calculateSuccessRate(enterpriseData);
  const integracoesSuccessRate = calculateSuccessRate(integracoesData);

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
      `Período: ${dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : ""} - ${dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : ""}`,
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
    slide2.addText("CIC - ENGINEERING", {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: "1a1a2e",
      align: "center",
    });

    const cicChartData = cicEngineeringData.map((item) => ({
      name: item.name,
      labels: [item.name],
      values: [item.sucesso],
    }));

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
    slide3.addText("ENTERPRISE", {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: "1a1a2e",
      align: "center",
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
    slide4.addText("INTEGRAÇÕES", {
      x: 0.5,
      y: 1,
      w: 9,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: "1a1a2e",
      align: "center",
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
          <h1 className="text-3xl font-bold">Pós Change</h1>
          <p className="text-muted-foreground">Análise de execução e taxa de sucesso das changes</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                  : "Selecione o período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={exportToPPTX} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PPTX
          </Button>
        </div>
      </div>

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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CIC Engineering Chart */}
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

        {/* Enterprise Chart */}
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

        {/* Integrações Chart */}
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

        {/* Rollback Details */}
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

      {/* Footer with update date */}
      <div className="text-right text-sm text-muted-foreground">
        Atualização: {format(new Date(), "dd/MM", { locale: ptBR })}
      </div>
    </div>
  );
};

export default PostChange;
