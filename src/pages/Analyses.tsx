import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AnalysisType = "incidente" | "tid-producao" | "";

export default function Analyses() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("");
  const [incidentNumber, setIncidentNumber] = useState("");
  const [platform, setPlatform] = useState("");
  const [uri, setUri] = useState("");
  const [messageId, setMessageId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [method, setMethod] = useState("");

  const handleIncidentAnalysis = () => {
    console.log("Analisando incidente:", incidentNumber);
    // Lógica de análise de incidente
  };

  const handleTidAnalysis = () => {
    console.log("Analisando TID:", { platform, uri, messageId, dateTime, method });
    // Lógica de análise de TID
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
                  <Button className="w-full" onClick={handleIncidentAnalysis}>
                    Analisar chamado
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
                  <Button className="w-full" onClick={handleTidAnalysis}>
                    Analisar TID em produção
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
