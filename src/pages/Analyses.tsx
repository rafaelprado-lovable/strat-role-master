import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type AnalysisType = "incidente" | "tid-producao" | "";

type AnalysisResult = {
  success: {
    tipo_erro: string;
    info_erro: {
      uri_falha: string;
      data_hora: string;
      request: any;
      response: any;
      motivo_erro: string;
      corretion_suject: string;
    };
  };
};

export default function Analyses() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("");
  const [incidentNumber, setIncidentNumber] = useState("");
  const [platform, setPlatform] = useState("");
  const [uri, setUri] = useState("");
  const [messageId, setMessageId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [method, setMethod] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIncidentAnalysis = async () => {
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        success: {
          tipo_erro: "erro tecnico",
          info_erro: {
            uri_falha: "orch-r-customers-pending-requests",
            data_hora: "2025-11-20 22:49:39",
            request: {
              incident: incidentNumber,
              timestamp: new Date().toISOString()
            },
            response: {
              description: "Generic Error",
              provider: {
                serviceName: "incident-analysis-service",
                errorCode: "550",
                errorMessage: "Generic Error"
              }
            },
            motivo_erro: "The external service returned a non-standard HTTP 550 status code with a 'Generic Error' message, indicating an internal issue or unhandled exception during processing.",
            corretion_suject: "Investigate the incident analysis service for internal errors, unhandled exceptions, or misconfigurations that lead to a generic 550 error."
          }
        }
      };
      
      setAnalysisResult(mockResult);
      setIsLoading(false);
      toast.success("Análise concluída");
    }, 1500);
  };

  const handleTidAnalysis = async () => {
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        success: {
          tipo_erro: "erro tecnico",
          info_erro: {
            uri_falha: uri || "orch-r-customers-pending-requests",
            data_hora: dateTime || "2025-11-20 22:49:39",
            request: {
              channel: "APP",
              contract: {
                msisdn: "21986509060"
              },
              customer: {
                socialSecNo: "16091160702"
              },
              interaction: {
                calleds: [
                  {
                    status: "PENDING"
                  },
                  {
                    status: "WAITING"
                  }
                ],
                document: {
                  number: "16091160702"
                },
                msisdn: "21986509060"
              },
              serviceRequest: {
                login: "BFFDIGITAL",
                reason1: "Solicitação",
                reason2: "Plano",
                reason3: "Troca",
                status: "Fechado"
              },
              services: [
                {
                  product: {
                    action: "Activate",
                    commercialCode: "PLN537"
                  }
                },
                {
                  product: {
                    action: "Activate",
                    commercialCode: "DSC511"
                  }
                },
                {
                  product: {
                    action: "Activate",
                    commercialCode: "PCT552"
                  }
                }
              ],
              type: "1",
              platform,
              messageId,
              method
            },
            response: {
              description: "Generic Error",
              provider: {
                serviceName: uri || "orch-r-customers-pending-requests",
                errorCode: "550",
                errorMessage: "Generic Error"
              }
            },
            motivo_erro: "The external service 'orch-r-customers-pending-requests' returned a non-standard HTTP 550 status code with a 'Generic Error' message, indicating an internal issue or unhandled exception during processing.",
            corretion_suject: "Investigate the 'orch-r-customers-pending-requests' service for internal errors, unhandled exceptions, or misconfigurations that lead to a generic 550 error. Check its logs, dependencies, and business logic for the given request parameters."
          }
        }
      };
      
      setAnalysisResult(mockResult);
      setIsLoading(false);
      toast.success("Análise concluída");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Análises</h2>
        <p className="text-muted-foreground">Selecione o tipo de análise e preencha os dados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de análise</CardTitle>
          <CardDescription>Escolha entre análise de incidente ou análise de TID em produção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="analysis-type">Tipo de análise</Label>
            <Select value={analysisType} onValueChange={(value) => setAnalysisType(value as AnalysisType)}>
              <SelectTrigger id="analysis-type">
                <SelectValue placeholder="Selecione o tipo de análise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incidente">Análise de incidente</SelectItem>
                <SelectItem value="tid-producao">Análise de TID em produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analysisType === "incidente" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Análise de incidente</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident">Incidente</Label>
                    <Input
                      id="incident"
                      placeholder="INC0000000"
                      value={incidentNumber}
                      onChange={(e) => setIncidentNumber(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleIncidentAnalysis}
                    disabled={isLoading || !incidentNumber}
                  >
                    {isLoading ? "Analisando..." : "Analisar chamado"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {analysisType === "tid-producao" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Análise de TID - PRODUÇÃO</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma</Label>
                    <Input
                      id="platform"
                      placeholder="PMID"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uri">URI</Label>
                    <Input
                      id="uri"
                      placeholder="access/v4/offers"
                      value={uri}
                      onChange={(e) => setUri(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="messageId">Message Id</Label>
                    <Input
                      id="messageId"
                      placeholder="Message Id"
                      value={messageId}
                      onChange={(e) => setMessageId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTime">data e hora</Label>
                    <Input
                      id="dateTime"
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Método</Label>
                    <Input
                      id="method"
                      placeholder="POST"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleTidAnalysis}
                    disabled={isLoading}
                  >
                    {isLoading ? "Analisando..." : "Analisar TID em produção"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Análise</CardTitle>
            <CardDescription>Detalhes do erro identificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-semibold">Tipo de Erro</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {analysisResult.success.tipo_erro}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">URI com Falha</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.success.info_erro.uri_falha}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Data e Hora</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.success.info_erro.data_hora}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Código do Erro</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.success.info_erro.response.provider.errorCode}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Motivo do Erro</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {analysisResult.success.info_erro.motivo_erro}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Sugestão de Correção</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {analysisResult.success.info_erro.corretion_suject}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Request</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                <pre className="p-4 text-xs">
                  {JSON.stringify(analysisResult.success.info_erro.request, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div>
              <Label className="text-sm font-semibold">Response</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                <pre className="p-4 text-xs">
                  {JSON.stringify(analysisResult.success.info_erro.response, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
