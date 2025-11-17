import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Insight } from '@/types';

interface Service {
  name: string;
  version: string;
}

interface BugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: Insight;
}

export function BugDialog({ open, onOpenChange, incident }: BugDialogProps) {
  const { toast } = useToast();
  const [ambiente, setAmbiente] = useState('');
  const [sistema, setSistema] = useState('');
  const [canal, setCanal] = useState('');
  const [erro, setErro] = useState('');
  const [descricaoResumida, setDescricaoResumida] = useState('');
  const [contexto, setContexto] = useState('');
  const [situacaoErro, setSituacaoErro] = useState('');
  const [retornaHttp, setRetornaHttp] = useState('');
  const [impactoNegocio, setImpactoNegocio] = useState('');
  const [services, setServices] = useState<Service[]>([{ name: '', version: '' }]);
  const [tid, setTid] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [apontamentos, setApontamentos] = useState('');
  const [logs, setLogs] = useState('');
  const [areasValidacao, setAreasValidacao] = useState('');
  const [fluxoValidacao, setFluxoValidacao] = useState('');
  const [horarioValidacao, setHorarioValidacao] = useState('durante-change');
  const [justificativa, setJustificativa] = useState('');

  // Pre-fill fields when incident is provided
  useEffect(() => {
    if (incident && open) {
      setDescricaoResumida(`Incidente ${incident.incident_data.number}`);
      setDataHora(new Date(incident.engineering_sla.entry_time[0]).toLocaleString('pt-BR'));
      setContexto(`Incidente reportado: ${incident.incident_data.number}\nPrioridade: ${incident.incident_data.priority}\nEstado: ${incident.incident_data.state}`);
    }
  }, [incident, open]);

  const addService = () => {
    setServices([...services, { name: '', version: '' }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: 'name' | 'version', value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const generateTitle = () => {
    if (!ambiente || !sistema || !canal || !erro || !descricaoResumida) return '';
    return `[${ambiente}][${sistema} - ${canal} - ${erro}] ${descricaoResumida}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ambiente || !sistema || !canal || !erro || !descricaoResumida) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do título",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bug criado com sucesso",
      description: `Bug criado para o incidente ${incident?.incident_data.number}`,
    });

    console.log({
      title: generateTitle(),
      contexto,
      situacaoErro,
      retornaHttp,
      impactoNegocio,
      services,
      tid,
      dataHora,
      apontamentos,
      logs,
      areasValidacao,
      fluxoValidacao,
      horarioValidacao,
      justificativa,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Criar Bug</DialogTitle>
          <DialogDescription>
            Preencha o formulário seguindo o padrão de documentação
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título do Bug */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Título do Bug</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Formato: [AMBIENTE][SISTEMA - CANAL/TECNOLOGIA - ERRO_GERADO] Descrição Resumida
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select value={ambiente} onValueChange={setAmbiente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROD">PROD</SelectItem>
                      <SelectItem value="HML">HML</SelectItem>
                      <SelectItem value="DEV">DEV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sistema">Sistema *</Label>
                  <Input
                    id="sistema"
                    value={sistema}
                    onChange={(e) => setSistema(e.target.value)}
                    placeholder="Ex: CRM, Billing, OSS"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canal">Canal/Tecnologia *</Label>
                  <Input
                    id="canal"
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                    placeholder="Ex: API, WEB, MOBILE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="erro">Erro Gerado *</Label>
                  <Input
                    id="erro"
                    value={erro}
                    onChange={(e) => setErro(e.target.value)}
                    placeholder="Ex: 500, TIMEOUT, NULL_POINTER"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricaoResumida">Descrição Resumida *</Label>
                <Input
                  id="descricaoResumida"
                  value={descricaoResumida}
                  onChange={(e) => setDescricaoResumida(e.target.value)}
                  placeholder="Breve descrição do problema"
                />
              </div>

              {generateTitle() && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Título Gerado:</Label>
                  <p className="mt-1 font-mono text-sm">{generateTitle()}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Contextualização */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contextualização do Cenário</h3>
                <p className="text-sm text-muted-foreground">
                  Descreva o cenário de falha com a maior quantidade de detalhes possíveis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto">Descrição do Problema</Label>
                <Textarea
                  id="contexto"
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  placeholder="Prezados, identificamos um cenário de falha no(a) (INC, TASK, WR. SITUAÇÃO), onde ocorre o seguinte..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="situacaoErro">Em qual situação ocorre o erro?</Label>
                <Textarea
                  id="situacaoErro"
                  value={situacaoErro}
                  onChange={(e) => setSituacaoErro(e.target.value)}
                  placeholder="Descreva a situação específica que causa o erro"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retornaHttp">Retorna HTTP de erro?</Label>
                <Input
                  id="retornaHttp"
                  value={retornaHttp}
                  onChange={(e) => setRetornaHttp(e.target.value)}
                  placeholder="Ex: 500 Internal Server Error, 404 Not Found"
                />
              </div>
            </div>

            <Separator />

            {/* Impacto no Negócio */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Impacto no Negócio</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactoNegocio">Descrição do Impacto</Label>
                <Textarea
                  id="impactoNegocio"
                  value={impactoNegocio}
                  onChange={(e) => setImpactoNegocio(e.target.value)}
                  placeholder="Descreva o impacto para o negócio"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Serviços e Versões */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Serviços e Versões</h3>
                <Button type="button" onClick={addService} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </div>

              {services.map((service, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`service-name-${index}`}>Nome do Serviço</Label>
                    <Input
                      id={`service-name-${index}`}
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      placeholder="Ex: API Gateway"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`service-version-${index}`}>Versão em Produção</Label>
                    <Input
                      id={`service-version-${index}`}
                      value={service.version}
                      onChange={(e) => updateService(index, 'version', e.target.value)}
                      placeholder="Ex: v2.3.1"
                    />
                  </div>
                  {services.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeService(index)}
                      size="icon"
                      variant="ghost"
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Logs e Informações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Logs e Informações</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tid">TID</Label>
                  <Input
                    id="tid"
                    value={tid}
                    onChange={(e) => setTid(e.target.value)}
                    placeholder="Transaction ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataHora">Data e Hora</Label>
                  <Input
                    id="dataHora"
                    value={dataHora}
                    onChange={(e) => setDataHora(e.target.value)}
                    placeholder="DD/MM/YYYY HH:MM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apontamentos">Apontamentos</Label>
                <Textarea
                  id="apontamentos"
                  value={apontamentos}
                  onChange={(e) => setApontamentos(e.target.value)}
                  placeholder="Descreva os principais apontamentos"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logs">Logs</Label>
                <Textarea
                  id="logs"
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Cole os logs relevantes aqui"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <Separator />

            {/* Validação de Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Validação da Change</h3>

              <div className="space-y-2">
                <Label htmlFor="areasValidacao">Áreas que realizarão a validação funcional</Label>
                <Textarea
                  id="areasValidacao"
                  value={areasValidacao}
                  onChange={(e) => setAreasValidacao(e.target.value)}
                  placeholder="Liste as áreas responsáveis pela validação"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fluxoValidacao">Detalhamento do fluxo de validação</Label>
                <Textarea
                  id="fluxoValidacao"
                  value={fluxoValidacao}
                  onChange={(e) => setFluxoValidacao(e.target.value)}
                  placeholder="Descreva o fluxo que será executado durante a validação"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Horário de validação da change</Label>
                <RadioGroup value={horarioValidacao} onValueChange={setHorarioValidacao}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="durante-change" id="durante-change" />
                    <Label htmlFor="durante-change" className="font-normal cursor-pointer">
                      Durante a change
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="durante-dia" id="durante-dia" />
                    <Label htmlFor="durante-dia" className="font-normal cursor-pointer">
                      Durante o dia (requer justificativa e aprovação do gestor)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="durante-semana" id="durante-semana" />
                    <Label htmlFor="durante-semana" className="font-normal cursor-pointer">
                      Durante a semana (requer justificativa e aprovação do gestor)
                    </Label>
                  </div>
                </RadioGroup>

                {(horarioValidacao === 'durante-dia' || horarioValidacao === 'durante-semana') && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="justificativa">Justificativa *</Label>
                    <Textarea
                      id="justificativa"
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      placeholder="Justifique a necessidade de validação fora do horário padrão"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Links Externos */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Links de Referência</h3>
              
              <div className="flex flex-col gap-2">
                <a
                  href="https://dev.azure.com/timbrasil/Producao/_workitems/create/Bug"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Bug no Azure DevOps (TIM)
                </a>
                <a
                  href="https://timbrasil.service-now.com/now/nav/ui/classic/params/target/problem.do%3Fsys_id%3D-1%26sysparm_stack%3Dproblem_list.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Problema no ServiceNow (ITSM)
                </a>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Criar Bug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
