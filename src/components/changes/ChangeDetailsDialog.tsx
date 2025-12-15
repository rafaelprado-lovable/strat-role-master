import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface HistoryEntry {
  timestamp: string;
  author: string;
  type: string;
  content: string;
}

interface ChangeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: {
    numero: string;
    sistema: string;
    descricao: string;
    inicioValidacao: string;
    fimValidacao: string;
    diaSemana: string;
    equipesAplicacao: string;
    equipesValidacao: string;
    changeForm: {
      tecnologia: string;
      tipoRestart: string;
      possuiServicoNovo: string;
      possuiServicoReuso: string;
      validacaoDurante: string;
      validacaoHDC: string;
      aumentoVolumetria: string;
      impactoVendas: string;
      houveUAT: string;
      houveFQA: string;
      systemTest: string;
      semTestes: string;
    };
    servicos: Array<{
      nome: string;
      versaoProducao: string;
      versaoCF: string;
      versaoInstalacao: string;
      clientsId: string;
    }>;
  };
}

// Mock history data
const mockHistoryData = {
  comments: [
    {
      timestamp: "10/11/2025 09:30:12",
      author: "Rafael Jesus",
      type: "Comentários adicionais",
      content: "Solicitada alteração no campo Sox perimeter via CAT00279685"
    },
    {
      timestamp: "11/10/2025 09:09:22",
      author: "Vitoria Lima Guimaraes",
      type: "Comentários adicionais",
      content: "*🔔 Lembrete Importante*\n \nAinda existem pendências de aprovação relacionadas à atividade. Lembrando que após a aprovação técnica da Operação de Change, *fica a cargo do solicitante entrar em contato* com as equipes para aprovações da mudança em tempo hábil *(áreas técnicas, gestores diretos e negócios).*"
    },
    {
      timestamp: "07/10/2025 13:02:04",
      author: "Paulo Santiago Leonelli Vidigal",
      type: "Comentários adicionais",
      content: "A aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3 foi rejeitada (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - SALES E CUSTOMER CARE MANAGEMENT - ACN - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - DIGITAL SALES OPERATIONS - ECOMMERCE - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - PMID - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nReason 1: Aprovação Rejeitada\nReason 2: Análise Técnica Rejeitada (rejeição grupos aprovação técnica)\n\nComentários:\n BFFDIGITAL não está na validação da change, favor incluir validação da equipe BFFDIGITAL"
    },
    {
      timestamp: "06/10/2025 16:19:09",
      author: "Gisele Maria De Barros",
      type: "Comentários adicionais",
      content: "Filas funcionais adicionadas."
    },
    {
      timestamp: "01/10/2025 13:28:29",
      author: "Paulo Santiago Leonelli Vidigal",
      type: "Comentários adicionais",
      content: "A aprovação do grupo referente a CTIO IT - DIGITAL SALES OPERATIONS - ECOMMERCE - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3 foi rejeitada (Technical and Business Approvals).\n\nReason 1: Aprovação Rejeitada\nReason 2: Análise Técnica Rejeitada (rejeição grupos aprovação técnica)\n\nComentários:\n Precisamos da validação funcional dos client id URA e BFFDIGITAL"
    }
  ],
  workNotes: [
    {
      timestamp: "13/10/2025 22:36:44",
      author: "System",
      type: "Anotações de trabalho",
      content: "Informações de CI enviadas ao Netcool com sucesso."
    },
    {
      timestamp: "13/10/2025 22:00:26",
      author: "System",
      type: "Anotações de trabalho",
      content: "Informações de CI enviadas ao Netcool com sucesso."
    }
  ],
  approvalHistory: [
    {
      timestamp: "13/10/2025 16:07:34",
      author: "Julio Cesar De Carvalho Amaral",
      type: "Approval history",
      content: "Aprovação do grupo para CTIO IT - APP & DIGITAL PRODUCTS OPERATIONS - APP MEU TIM - N3 foi aprovada (Technical and Business Approvals)."
    },
    {
      timestamp: "09/10/2025 17:43:01",
      author: "Raul De Campos Gouveia",
      type: "Approval history",
      content: "Aprovação do grupo para CTIO IT - DIGITAL SALES OPERATIONS - ECOMMERCE - N3 foi aprovada (Technical and Business Approvals)."
    },
    {
      timestamp: "09/10/2025 12:21:26",
      author: "Luciana De Oliveira Lins",
      type: "Approval history",
      content: "Luciana De Oliveira Lins approved the task."
    },
    {
      timestamp: "09/10/2025 10:06:51",
      author: "Adriano Oliveira Bastos",
      type: "Approval history",
      content: "Aprovação do grupo para CTIO IT - CUSTOMER CARE & COGN. DIGITAL OPERATIONS - URA-COGNITIVA - N3 foi aprovada (Technical and Business Approvals)."
    },
    {
      timestamp: "08/10/2025 18:02:25",
      author: "Emilia De Deus Bernardino Silva",
      type: "Approval history",
      content: "Luciana De Oliveira Lins requested to approve task"
    },
    {
      timestamp: "08/10/2025 17:21:11",
      author: "Jessica Janaina Crocco Lopes",
      type: "Approval history",
      content: "Aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - PMID - N3 foi aprovada (Technical and Business Approvals)."
    },
    {
      timestamp: "08/10/2025 17:20:11",
      author: "Jessica Janaina Crocco Lopes",
      type: "Approval history",
      content: "Aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3 foi aprovada (Technical and Business Approvals)."
    },
    {
      timestamp: "08/10/2025 11:41:45",
      author: "Vitoria Lima Guimaraes",
      type: "Approval history",
      content: "Aprovação do grupo para Change Management IT foi aprovada (Change Manager Approval)."
    },
    {
      timestamp: "07/10/2025 13:02:01",
      author: "Paulo Santiago Leonelli Vidigal",
      type: "Approval history",
      content: "A aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3 foi rejeitada (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - SALES E CUSTOMER CARE MANAGEMENT - ACN - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - DIGITAL SALES OPERATIONS - ECOMMERCE - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo referente a CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - PMID - N3 foi aprovada por todos os usuários (Technical and Business Approvals)."
    },
    {
      timestamp: "07/10/2025 06:42:50",
      author: "Vitoria Lima Guimaraes",
      type: "Approval history",
      content: "Aprovação do grupo para Change Management IT foi aprovada (Change Manager Approval)."
    },
    {
      timestamp: "01/10/2025 13:28:25",
      author: "Paulo Santiago Leonelli Vidigal",
      type: "Approval history",
      content: "A aprovação do grupo referente a CTIO IT - DIGITAL SALES OPERATIONS - ECOMMERCE - N3 foi aprovada por todos os usuários (Technical and Business Approvals).\n\nA aprovação do grupo para CTIO IT - INTEGRATION SOLUTIONS MANAGEMENT - MIDDLEWARE - N3 foi rejeitada (Technical and Business Approvals)."
    },
    {
      timestamp: "30/09/2025 09:38:18",
      author: "Vitoria Lima Guimaraes",
      type: "Approval history",
      content: "Aprovação do grupo para Change Management IT foi aprovada (Change Manager Approval)."
    }
  ]
};

// Combine comments and work notes sorted by date
const getCombinedHistory = () => {
  const combined = [...mockHistoryData.comments, ...mockHistoryData.workNotes];
  return combined.sort((a, b) => {
    const dateA = new Date(a.timestamp.split(' ')[0].split('/').reverse().join('-'));
    const dateB = new Date(b.timestamp.split(' ')[0].split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });
};

export function ChangeDetailsDialog({ open, onOpenChange, change }: ChangeDetailsDialogProps) {
  const [comment, setComment] = useState("");

  const handleApprove = () => {
    if (comment.trim()) {
      toast.success(`Change ${change.numero} aprovada com sucesso!`, {
        description: `Comentário: ${comment}`
      });
      setComment("");
      onOpenChange(false);
    } else {
      toast.error("Por favor, adicione um comentário antes de aprovar.");
    }
  };

  const handleReject = () => {
    if (comment.trim()) {
      toast.error(`Change ${change.numero} rejeitada.`, {
        description: `Motivo: ${comment}`
      });
      setComment("");
      onOpenChange(false);
    } else {
      toast.error("Por favor, adicione um comentário explicando o motivo da rejeição.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {change.numero} - {change.sistema}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Número da change</label>
              <Input value={change.numero} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Descrição da change</label>
              <Input value={change.descricao} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Início da validação</label>
              <Input value={change.inicioValidacao} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fim da validação</label>
              <Input value={change.fimValidacao} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dia da semana</label>
              <Input value={change.diaSemana} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Equipes envolvidas na aplicação</label>
            <Input value={change.equipesAplicacao} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Equipes envolvidas na validação</label>
            <Input value={change.equipesValidacao} readOnly className="bg-muted" />
          </div>

          <Separator />

          {/* Dados do ChangeForm */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do ChangeForm</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tecnologia</label>
                <Input value={change.changeForm.tecnologia} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tipo do restart</label>
                <Input value={change.changeForm.tipoRestart} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Possui serviço novo</label>
                <Input value={change.changeForm.possuiServicoNovo} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Possui serviço reuso</label>
                <Input value={change.changeForm.possuiServicoReuso} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Validação durante a change</label>
                <Input value={change.changeForm.validacaoDurante} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Validação HDC</label>
                <Input value={change.changeForm.validacaoHDC} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Aumento de volumetria</label>
                <Input value={change.changeForm.aumentoVolumetria} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Impacto em vendas</label>
                <Input value={change.changeForm.impactoVendas} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Houve UAT</label>
                <Input value={change.changeForm.houveUAT} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Houve FQA</label>
                <Input value={change.changeForm.houveFQA} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">System test</label>
                <Input value={change.changeForm.systemTest} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Sem testes</label>
                <Input value={change.changeForm.semTestes} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

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
                  <TableCell>Versão no ChangeForm é o mesmo de produção</TableCell>
                  <TableCell className="text-center">
                    {change.servicos.every(s => s.versaoCF === s.versaoProducao) ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Impacto em vendas</TableCell>
                  <TableCell className="text-center">
                    {change.changeForm.impactoVendas === "Não" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Validação do HDC</TableCell>
                  <TableCell className="text-center">
                    {change.changeForm.validacaoHDC === "Sim" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Pipelines estão corretas</TableCell>
                  <TableCell className="text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Dados do serviço */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do serviço</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOME DO SERVIÇO</TableHead>
                  <TableHead>VERSÃO ATUAL EM PRODUÇÃO</TableHead>
                  <TableHead>VERSÃO ATUAL NO CF</TableHead>
                  <TableHead>VERSÃO DE INSTALAÇÃO</TableHead>
                  <TableHead>CLIENTS ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {change.servicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum serviço cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  change.servicos.map((servico, index) => (
                    <TableRow key={index}>
                      <TableCell>{servico.nome}</TableCell>
                      <TableCell>{servico.versaoProducao}</TableCell>
                      <TableCell>{servico.versaoCF}</TableCell>
                      <TableCell>{servico.versaoInstalacao}</TableCell>
                      <TableCell>{servico.clientsId}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Validação Funcional */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validação Funcional</h3>
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Contato dos responsáveis pela validação funcional:
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Rafael Martins</p>
                  <p className="text-sm text-muted-foreground">
                    rafael.martins@engdb.com.br - (31) 99174-6531
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Procedimento:</p>
                <p className="text-sm">
                  Será efetuado uma chamada para gerar o token de acesso ao TIMWE.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">A validação ocorrerá:</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 border-2 border-primary rounded bg-primary">
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm">Durante a change</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Histórico */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Histórico - {change.numero}</h3>
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="comments">Comentários</TabsTrigger>
                <TabsTrigger value="workNotes">Work Notes</TabsTrigger>
                <TabsTrigger value="combined">Comentários + Work Notes</TabsTrigger>
                <TabsTrigger value="approval">Histórico de Aprovação</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {mockHistoryData.comments.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.author}</p>
                            <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="workNotes" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {mockHistoryData.workNotes.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.author}</p>
                            <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-secondary/50 text-secondary-foreground rounded">
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="combined" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {getCombinedHistory().map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.author}</p>
                            <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            entry.type === "Anotações de trabalho" 
                              ? "bg-secondary/50 text-secondary-foreground" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="approval" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {mockHistoryData.approvalHistory.map((entry, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.author}</p>
                            <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded">
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Área de Aprovação/Rejeição */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Análise da Change</h3>
            
            {/* Sugestões de Motivos para Rejeição */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Sugestões de motivos para rejeição
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Versão do ChangeForm divergente da produção",
                  "Falta validação funcional de equipe",
                  "Impacto em vendas não documentado",
                  "Pipelines com configuração incorreta",
                  "Validação do HDC pendente",
                  "Ausência de testes funcionais",
                  "Documentação incompleta",
                  "Janela de execução inadequada"
                ].map((motivo) => (
                  <Button
                    key={motivo}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                    onClick={() => setComment(prev => prev ? `${prev}\n- ${motivo}` : `- ${motivo}`)}
                  >
                    {motivo}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Comentário <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Adicione seus comentários sobre a análise da change..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Aprovar
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Rejeitar
              </Button>
            </div>
          </div>

          {/* Botão Refazer análise */}
          <Button className="w-full" size="lg">
            Refazer a análise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
