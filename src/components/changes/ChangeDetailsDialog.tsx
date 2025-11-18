import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

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

export function ChangeDetailsDialog({ open, onOpenChange, change }: ChangeDetailsDialogProps) {
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

          {/* Botão Refazer análise */}
          <Button className="w-full" size="lg">
            Refazer a análise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
