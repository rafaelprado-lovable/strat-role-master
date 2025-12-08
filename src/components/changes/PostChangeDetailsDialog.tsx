import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export interface PostChange {
  id: string;
  numero: string;
  descricao: string;
  dataExecucao: string;
  sistema: string;
  plataforma: string;
  status: "sucesso" | "rollback";
  equipesAplicacao: string;
  equipesValidacao: string;
  motivoRollback?: string;
  detalheRollback?: string;
  tempoExecucao: string;
  impacto: string;
  servicos: Array<{
    nome: string;
    versaoAnterior: string;
    versaoNova: string;
    statusInstalacao: string;
  }>;
  validacoes: {
    validacaoFuncional: boolean;
    validacaoHDC: boolean;
    rollbackExecutado: boolean;
    impactoCliente: boolean;
  };
  observacoes: string;
}

interface PostChangeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: PostChange;
}

export function PostChangeDetailsDialog({ open, onOpenChange, change }: PostChangeDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            {change.numero} - {change.sistema}
            <Badge variant={change.status === "sucesso" ? "default" : "destructive"}>
              {change.status === "sucesso" ? "Sucesso" : "Rollback"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Número da change</label>
              <Input value={change.numero} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Plataforma</label>
              <Input value={change.plataforma} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data de Execução</label>
              <Input value={change.dataExecucao} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Descrição da change</label>
            <Input value={change.descricao} readOnly className="bg-muted" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tempo de Execução</label>
              <Input value={change.tempoExecucao} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Impacto</label>
              <Input value={change.impacto} readOnly className="bg-muted" />
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

          {/* Status de Validações */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Status das Validações</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                {change.validacoes.validacaoFuncional ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="text-sm">Validação Funcional</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                {change.validacoes.validacaoHDC ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="text-sm">Validação HDC</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                {change.validacoes.rollbackExecutado ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span className="text-sm">Rollback Executado</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                {change.validacoes.impactoCliente ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span className="text-sm">Impacto ao Cliente</span>
              </div>
            </div>
          </div>

          {/* Detalhes do Rollback (se aplicável) */}
          {change.status === "rollback" && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Detalhes do Rollback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Motivo do Rollback</label>
                    <Input value={change.motivoRollback || "Não informado"} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Detalhes Adicionais</label>
                    <Input value={change.detalheRollback || "N/A"} readOnly className="bg-muted" />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Dados dos Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Serviços Alterados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOME DO SERVIÇO</TableHead>
                  <TableHead>VERSÃO ANTERIOR</TableHead>
                  <TableHead>VERSÃO NOVA</TableHead>
                  <TableHead>STATUS INSTALAÇÃO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {change.servicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum serviço registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  change.servicos.map((servico, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{servico.nome}</TableCell>
                      <TableCell>{servico.versaoAnterior}</TableCell>
                      <TableCell>{servico.versaoNova}</TableCell>
                      <TableCell>
                        <Badge variant={servico.statusInstalacao === "Sucesso" ? "default" : "destructive"}>
                          {servico.statusInstalacao}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Observações */}
          {change.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Observações</h3>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{change.observacoes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
