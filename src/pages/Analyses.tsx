import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { de } from "date-fns/locale";

type AnalysisType = "incidente" | "tid-producao" | "";

type AnalysisResult = {
  analise_log_api: {
    data_ocorrencia_aproximada: String;
    codigo_status_http_retornado: String;
    TID: String;
    mensagem_erro_principal: String;
    causa_raiz_sugerida: String;
    tipo_do_erro: String;
    endpoint_do_provedor: String;
    request_ao_provedor: String;
    response_do_provedor: String;
    Direcionar_para_fila: String;
    tagueamento_de_controle: String;
  }
};

type Department = {
  sysId: string;
  name: string;
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
  const [departaments, setDepartaments] = useState<Department[]>([]);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
  const [selectedDepartmentSysId, setSelectedDepartmentSysId] = useState("");

  const handleIncidentAnalysis = async () => {
    setIsLoading(true);

    try {
      setAnalysisResult(null);
      const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
      const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', `Bearer ${userToken}`);

      const raw = JSON.stringify({
        userId: userId,
        incidentNumber: incidentNumber,
      });

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(
        "http://10.151.1.54:8000/v1/analyse/ticket",
        requestOptions
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();

      // Ajuste conforme o formato do backend:
      setAnalysisResult(result);

      toast({
        title: "Sucesso",
        description: "Sucesso ao analisar o incidente",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao analisar o incidente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async (comment: string) => {
    try {
      const userToken = localStorage.getItem("userToken");
      const userId = localStorage.getItem("userId");

      if (!userToken || !userId) throw new Error("Usuário não autenticado");

      const response = await fetch(
        "http://10.151.1.33:8000/v1/create/incident/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            userId,
            incidentNumber,
            incidentComment: comment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao postar comentário");
      }

      const result = await response.json();
      console.log("Comentário enviado:", result);
    } catch (err) {
      console.error("Erro ao comentar incidente:", err);
    }
  };


  const handleTrammitIncident = async () => {
    try {
      const userToken = localStorage.getItem("userToken");
      const userId = localStorage.getItem("userId");

      if (!incidentNumber || !selectedDepartmentSysId) {
        toast({
          title: "Erro",
          description: "Selecione a fila antes de encaminhar.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        "http://10.151.1.54:8000/v1/change/incident/assignment/group",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            userId,
            incidentNumber,
            assignmentGroup: selectedDepartmentSysId,
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao encaminhar incidente");

      toast({
        title: "Incidente encaminhado",
        description: `Incidente ${incidentNumber} encaminhado com sucesso.`,
      });

      // Comentário automático ITIL style
      const autoComment = `Prezados, poderiam verificar o motivo do retorno abaixo:
Apontamento: 
${analysisResult.analise_log_api.endpoint_do_provedor}
Request:
${JSON.stringify(analysisResult.analise_log_api.request_ao_provedor, null, 2)}
Response: 
${JSON.stringify(analysisResult.analise_log_api.response_do_provedor, null, 2)}
Motivo do erro:
${analysisResult.analise_log_api.causa_raiz_sugerida}
`;

      await handlePostComment(autoComment);

    } catch (error) {
      console.error(error);

      toast({
        title: "Erro",
        description: "Não foi possível encaminhar o incidente.",
        variant: "destructive",
      });
    }
  };


  const handleEncerrarIncidente = async () => {
    console.log(analysisResult)
    
    try {
      const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
      const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", `Bearer ${userToken}`);

      const resolutionNotes = `${JSON.stringify(analysisResult.analise_log_api, null, 2)}`


      const raw = JSON.stringify({
        userId: userId,
        incidentNumber: incidentNumber,
        closeCode: "not_solved_not_applicable",
        platform: "PMID",
        cause: "Solicitação de Analise",
        subCause: "IMPROCEDENTE - REGRA DE NEGÓCIO",
        closeNotes: resolutionNotes
      });

      const requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
      };

      const response = await fetch(
        "http://10.151.1.54:8000/v1/resolve/incident",
        requestOptions
      );

      if (!response.ok) {
        throw new Error("Erro ao resolver incidente");
      }

      toast({
        title: "Incidente resolvido",
        description: `Incidente ${incidentNumber} marcado como resolvido`,
      });

    } catch (error) {
      console.error(error);

      toast({
        title: "Erro",
        description: "Não foi possível resolver o incidente.",
        variant: "destructive",
      });
    }
  };

  const getDepartaments = async () => {
    try {
      const userToken = localStorage.getItem("userToken");

      const response = await fetch("http://10.151.1.33:8000/v1/read/assignment/group", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const result = await response.json();

      setDepartaments(result);
      console.log("Departamentos carregados:", result);

    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    getDepartaments();
  }, []);
  
  const uniqueDepartments = departaments.filter(
    (dept, index, self) =>
      index === self.findIndex(d => d.sysId === dept.sysId)
  );

  useEffect(() => {
    const fila = analysisResult?.analise_log_api?.Direcionar_para_fila;
    if (fila) {
      console.log("Fila recebida da análise:", fila);
      setSelectedDepartmentName(fila);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (!selectedDepartmentName || departaments.length === 0) return;

    const dep = departaments.find(d => d.name === selectedDepartmentName);
    if (dep) setSelectedDepartmentSysId(dep.sysId);
  }, [selectedDepartmentName, departaments]);


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
                <SelectItem value="tid-producao">TID em ambiente de produção</SelectItem>
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
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NMWS">NMWS</SelectItem>
                        <SelectItem value="PMID">PMID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    {/* SE FOR NMWS → só TID + Data */}
                    {platform === "NMWS" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="messageId">TID</Label>
                          <Input
                            id="messageId"
                            placeholder="TID"
                            value={messageId}
                            onChange={(e) => setMessageId(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateTime">Data e hora</Label>
                          <Input
                            id="dateTime"
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* SE NÃO FOR NMWS → mostra tudo */}

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
                          <Label htmlFor="dateTime">Data e hora</Label>
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
                      </>
                    )}
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
                  {analysisResult.analise_log_api.tipo_do_erro}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">URI com Falha</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.analise_log_api.endpoint_do_provedor}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Data e Hora</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.analise_log_api.data_ocorrencia_aproximada}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Código do Erro</Label>
                <p className="text-sm text-muted-foreground">
                  {analysisResult?.analise_log_api.codigo_status_http_retornado ?? ""}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Motivo do Erro</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {analysisResult.analise_log_api.causa_raiz_sugerida}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Sugestão de Correção</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {analysisResult.analise_log_api.causa_raiz_sugerida}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Request</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                <pre className="p-4 text-xs">
                  {JSON.stringify(analysisResult.analise_log_api.request_ao_provedor, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div>
              <Label className="text-sm font-semibold">Response</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                <pre className="p-4 text-xs">
                  {JSON.stringify(analysisResult.analise_log_api.response_do_provedor, null, 2)}
                </pre>
              </ScrollArea>
            </div>
           </CardContent>

            {/* ------------------------------ */}
            {/* BOTÃO ENCERRAR INCIDENTE */}
            {/* ------------------------------ */}
            {analysisResult.analise_log_api.tipo_do_erro === 'regra_de_negocio' ? (
              <div className="pt-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleEncerrarIncidente()}
                >
                  Encerrar incidente como regra de negócio
                </Button>
              </div>
            ) : (
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Direcionar para fila</Label>

                    <Select value={selectedDepartmentName} onValueChange={setSelectedDepartmentName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fila" />
                      </SelectTrigger>

                      <SelectContent>
                        {uniqueDepartments.map((dept) => (
                          <SelectItem key={dept.sysId} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Informações para análise</Label>
                    <ScrollArea className="h-[200px] w-full rounded-md border mt-2">
                      <pre className="p-4 text-xs">
                        Prezados, poderiam verificar o motivo do erro abaixo:
                        <br />
                        <br />
                        Apontamento: 
                        <br />
                        {analysisResult.analise_log_api.endpoint_do_provedor}
                        <br />
                        <br />
                        Request:
                        <br />
                        {JSON.stringify(analysisResult.analise_log_api.request_ao_provedor, null, 2)}
                        <br />
                        <br />
                        Response: 
                        <br />
                        {JSON.stringify(analysisResult.analise_log_api.response_do_provedor, null, 2)}
                        <br />
                        <br />
                        Motivo do erro:
                        <br />
                        {analysisResult.analise_log_api.causa_raiz_sugerida}

                      </pre>
                    </ScrollArea>
                    <div className="pt-4">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleTrammitIncident()}
                      >
                        Encaminhar incidente para {selectedDepartmentName}
                      </Button>
                    </div>
                </div>
              </CardContent>
            )}
        </Card>

      )}
    </div>
  );
}
