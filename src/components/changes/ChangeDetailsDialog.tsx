import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Changes } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react"

interface ChangeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: Changes;
  onUpdateChange: (updated: Changes) => void;  // <-- aqui
}


export function ChangeDetailsDialog({ open, onOpenChange, change, onUpdateChange  }: ChangeDetailsDialogProps) {
  const { toast } = useToast();
  const [loadingAnalyse, setLoadingAnalyse] = useState(false);
  const [comment, setComment] = useState("");

  const validator = change.changeAproovalData?.validator_contact;

  const isInvalidValidator =
  !validator ||
  !validator[1] ||
  (typeof validator[1] === "string" &&
    ["sem informação", "n/a"].includes(validator[1]?.toLowerCase()));

  async function analyse() {
    try {
      setLoadingAnalyse(true);

      const userToken = localStorage.getItem("userToken");
      const userId = localStorage.getItem("userId");

      const response = await fetch("http://10.151.1.54:8000/v1/process/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          userId,
          changeNumber: change.changeSystemData.number,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 412) {
        data
        toast({
          title: "ChangeForm não existe",
          description:
            data?.errorDetail?.error ||
            "A mudança não atende aos critérios necessários para ser analisada.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        toast({
          title: "Erro ao executar análise",
          description: data?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // ⬅️ Atualiza os dados no React sem recarregar a página
      onUpdateChange({
        ...change,
        ...data,
      });

      toast({
        title: "Análise realizada com sucesso!",
        description: `A análise da mudança ${change.changeSystemData.number} foi realizada.`,
      });


    } catch (err) {
      console.log(err)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível comunicar com o servidor.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalyse(false);
    }
  }

  const testMap = {
    fqa: "FQA",
    uat: "UAT",
    system_test: "System Test",
    no_test: "Sem testes",
  };

  const tipoTeste = Object.keys(testMap).find(
    (key) => String(change.changeTestData?.[key]).toLowerCase() === "verdadeiro"
  );

  const labelTeste = tipoTeste ? testMap[tipoTeste] : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {change.changeSystemData.number} - {change.changeSystemData.description}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Número da change</label>
              <Input value={change.changeSystemData.number} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Descrição da change</label>
              <Input value={change.changeSystemData.description} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Início da validação</label>
              <Input value={change.changeSystemData.start_date} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fim da validação</label>
              <Input value={change.changeSystemData.end_date} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dia da semana</label>
              <Input value={change.changeSystemData.week_day} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Equipes envolvidas na aplicação</label>
            <Input value={change.changeSystemData.teams_involved_in_execution} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Equipes envolvidas na validação</label>
            <Input value={change.changeSystemData.teams_involved_in_validation} readOnly className="bg-muted" />
          </div>

          <Separator />

          {/* Dados do ChangeForm */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do ChangeForm</h3>

            {/* Primeira linha */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tecnologia</label>
                <Input value={change.changeAproovalData.tecnology || "Sem informação"} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tipo do restart</label>
                <Input value={
                  change.changeAproovalData.restart_type === false
                    ? "N/A"
                    : change.changeAproovalData.restart_type ?? "Sem informação"
                } readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Possui serviço novo</label>
                <Input value={
                  change.changeAproovalData.new_service === true ? "Sim" :
                  change.changeAproovalData.new_service === false ? "Não" :
                  "Sem informação"
                } readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Possui serviço reuso</label>
                <Input value={
                  change.changeAproovalData.old_service === true ? "Sim" :
                  change.changeAproovalData.old_service === false ? "Não" :
                  "Sem informação"
                } readOnly className="bg-muted" />
              </div>
            </div>

            {/* Segunda linha */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Validação durante a change</label>
                <Input value={
                  change.changeAproovalData?.validation_time ?? "Sem informação"
                } readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Validação HDC</label>
                <Input value={
                  change.changeAproovalData.hdc_validation === true ? "Sim" :
                  change.changeAproovalData.hdc_validation === false ? "Não" :
                  "Sem informação"
                } readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Aumento de volumetria</label>
                <Input value={
                  change.changeAproovalData.increase_volume === true ? "Sim" :
                  change.changeAproovalData.increase_volume === false ? "Não" :
                  "Sem informação"
                } readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Impacto em vendas</label>
                <Input value={
                  change.changeAproovalData.validation_time === true ? "Sim" :
                  change.changeAproovalData.validation_time === false ? "Não" :
                  "Sem informação"
                } readOnly className="bg-muted" />
              </div>
            </div>

            {/* Testes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {labelTeste && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo de teste
                  </label>
                  <Input value={labelTeste} readOnly className="bg-muted" />
                </div>
              )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo de entrega
                  </label>
                  <Input value={change.changeAproovalData.deliveryType} readOnly className="bg-muted" />
                </div>
            </div>
          </div>

          <Separator />

          {/* Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do serviço</h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOME DO SERVIÇO</TableHead>
                  <TableHead>VERSÃO ATUAL EM PRODUÇÃO</TableHead>
                  <TableHead>VERSÃO ATUAL NO CF</TableHead>
                  <TableHead>PIPELINE DE SERVIÇO</TableHead>
                  <TableHead>VERSÃO DE ROTA</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!change.changeServicesList || change.changeServicesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum serviço cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  change.changeServicesList.map((servico, index) => (
                    <TableRow key={index}>
                      <TableCell>{servico.service_name}</TableCell>
                      <TableCell>{servico.cf_production_version}</TableCell>
                      <TableCell>{servico.implementation_version}</TableCell>
                      <TableCell>
                        <a
                          href={servico.pipeline_service_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center gap-2"
                        >
                          Abrir pipeline <ExternalLink className="w-4 h-4" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={servico.pipeline_route_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center gap-2"
                        >
                          Abrir pipeline <ExternalLink className="w-4 h-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />


          {/* Validação do ambiente */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validação do funcional</h3>
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Contato dos responsáveis pela validação funcional:
                </p>

                <div className="space-y-3">
                  {(() => {
                    const data = change.changeAproovalData?.functional_validator_contact;

                    if (!data) {
                      return <p className="text-sm text-muted-foreground">Sem informação</p>;
                    }

                    // Se vier como ["Nome", "email", "telefone"]
                    const normalized =
                      Array.isArray(data[0]) ? data : [data];

                    return normalized.map((contact: string[], index: number) => (
                      <div key={index} className="border-l-2 pl-3">
                        <p className="text-sm font-semibold">
                          {contact?.[0] ?? "Sem nome"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {contact?.[1] ?? "Sem email"} {contact?.[2] ? `- ${contact[2]}` : ""}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Procedimento:</p>
                <p className="text-sm">
                  {change.changeAproovalData?.validation_process ?? "Sem informação"}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">A validação ocorrerá:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 border-2 border-primary rounded bg-primary">
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{change.changeAproovalData?.validation_time ?? "Sem informação"}</span>
                  </div>
                </div>
                
                {/* Justificativa - exibida quando não é "Durante a change" */}
                {false && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Justificativa:</p>
                    <p className="text-sm text-muted-foreground">
                      A validação será realizada no próximo dia útil devido à indisponibilidade da equipe durante o horário da change.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Serviços */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Responsáveis pela validação do ambiente</h3>

            {!change.changeAproovalData?.enviroment_responsible?.length ? (
              <p className="text-sm text-muted-foreground">Sem informação</p>
            ) : (
              <ul className="list-disc ml-5 space-y-1">
                {change.changeAproovalData.enviroment_responsible.map((team: string, i: number) => (
                  <li key={i} className="text-sm">
                    {team}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Refazer análise */}
          <Button className="w-full" size="lg" onClick={analyse}>
            {loadingAnalyse ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </span>
            ) : (
              "Refazer a análise"
            )}
          </Button>

          <Separator />

          {/* Validações Realizadas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validações Realizadas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DESCRIÇÃO DA VALIDAÇÃO</TableHead>
                  <TableHead className="w-[120px] text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Validação durante a change</TableCell>
                  <TableCell className="text-center">
                  {change.changeAproovalData?.validation_time === "Durante a change" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                  )}
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Serviço novo X Aumento de volumetria</TableCell>
                  <TableCell className="text-center">
                  {change.changeAproovalData.new_service === true && change.changeAproovalData.increase_volume !== true ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                  ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Contato do validador anexado</TableCell>
                  <TableCell className="text-center">
                    {isInvalidValidator ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Entrega de demanda com system test</TableCell>
                  <TableCell className="text-center">
                  {labelTeste === "System Test" && change.changeAproovalData.deliveryType === "ENTREGA DE DEMANDA" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                  ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  )}
                  </TableCell>
                </TableRow>
              
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Histórico  */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Histórico - {change.changeSystemData.number}</h3>
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="combined">Comentários + Work Notes</TabsTrigger>
                <TabsTrigger value="approval">Histórico de Aprovação</TabsTrigger>
              </TabsList>
              
              <TabsContent value="combined" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {change.changeHistory?.comments_work_notes?.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.autor}</p>
                            <p className="text-xs text-muted-foreground">{entry.data}</p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.mensagem}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="approval" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {change.changeHistory?.timelineAprooval?.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.user}</p>
                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                            <p className="text-xs text-muted-foreground">{entry.group}</p>
                          </div>

                          <span className="flex items-center">
                            {entry.status === "✔️ APROVADO" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : entry.status === "❌ REJEITADO" ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : null}
                          </span>
                        </div>

                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.status}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

            </Tabs>
          </div>     
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
