import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react";
import { ServiceTimelineChart } from "./ServiceTimelineChart";


interface HttpCodeGroup {
  code: string;
  total_count: number;
  avg_time: number;
}

interface ServiceTimelinePoint {
  timestamp: string;
  context_info: {
    application: string;
    service_name: string;
    route_path: string;
  };
  http_code_group: HttpCodeGroup[];
  avg_time: number;
}

interface ServiceTimelineDay {
  services: ServiceTimelinePoint[];
}

export interface PostChange {
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
    today: ServiceTimelinePoint[];
    lastWeek?: ServiceTimelinePoint[];
  };
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
            {change.changeSystemData.number} - {change?.changeAproovalData?.tecnology}
            <Badge
              variant={
                change?.postChangeData?.applicationStatus
                  ? change.postChangeData.applicationStatus === "sucesso"
                    ? "default"
                    : "destructive"
                  : "secondary"
              }
            >
              {change?.postChangeData?.applicationStatus
                ? change.postChangeData.applicationStatus === "sucesso"
                  ? "Sucesso"
                  : "Rollback"
                : "Sem informação"}
            </Badge>
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

          {/* Dados dos Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Serviços Alterados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOME DO SERVIÇO</TableHead>
                  <TableHead>VERSÃO ANTERIOR</TableHead>
                  <TableHead>VERSÃO NOVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {change?.changeServicesList?.length === 0 || !change.changeServicesList ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum serviço registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  change?.changeServicesList?.map((servico, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{servico.service_name}</TableCell>
                      <TableCell>{servico.cf_production_version}</TableCell>
                      <TableCell>{servico.implementation_version}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Monitoramento de Serviços - Timeline Charts */}
          {change?.serviceTimeline && (change?.serviceTimeline?.today?.length > 0 || change?.serviceTimeline?.lastWeek?.length > 0) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Monitoramento de Serviços
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparação de performance: dia atual vs mesma hora da semana anterior
                </p>
                <ServiceTimelineChart data={change?.serviceTimeline} />
              </div>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
