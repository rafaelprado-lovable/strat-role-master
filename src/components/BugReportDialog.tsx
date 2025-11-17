import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Bug, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Service {
  name: string;
  version: string;
}

interface BugReportDialogProps {
  trigger?: React.ReactNode;
}

export default function BugReportDialog({ trigger }: BugReportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
      description: "O bug foi registrado e está pronto para ser enviado",
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

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Bug className="mr-2 h-4 w-4" />Criar Bug</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Abertura de Bug
          </DialogTitle>
          <DialogDescription>
            Preencha o formulário seguindo o padrão de documentação
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Título do Bug */}
            <Card>
              <CardHeader>
                <CardTitle>Título do Bug</CardTitle>
                <CardDescription>
                  Formato: [AMBIENTE][SISTEMA - CANAL/TECNOLOGIA - ERRO_GERADO] Descrição Resumida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ambiente">Ambiente *</Label>
                    <Input
                      id="ambiente"
                      placeholder="Ex: PRODUÇÃO, HOMOLOGAÇÃO"
                      value={ambiente}
                      onChange={(e) => setAmbiente(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sistema">Sistema *</Label>
                    <Input
                      id="sistema"
                      placeholder="Ex: API Gateway, Frontend"
                      value={sistema}
                      onChange={(e) => setSistema(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="canal">Canal/Tecnologia *</Label>
                    <Input
                      id="canal"
                      placeholder="Ex: REST, GraphQL"
                      value={canal}
                      onChange={(e) => setCanal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="erro">Erro Gerado *</Label>
                    <Input
                      id="erro"
                      placeholder="Ex: 500, Timeout"
                      value={erro}
                      onChange={(e) => setErro(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição Resumida *</Label>
                  <Input
                    id="descricao"
                    placeholder="Breve descrição do problema"
                    value={descricaoResumida}
                    onChange={(e) => setDescricaoResumida(e.target.value)}
                    required
                  />
                </div>
                {generateTitle() && (
                  <div className="p-3 bg-muted rounded-md">
                    <Label className="text-xs text-muted-foreground">Preview do Título:</Label>
                    <p className="text-sm font-medium mt-1">{generateTitle()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contexto */}
            <Card>
              <CardHeader>
                <CardTitle>Contextualização do Cenário</CardTitle>
                <CardDescription>
                  Descreva com o máximo de detalhes possível
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contexto">Descrição do Cenário</Label>
                  <Textarea
                    id="contexto"
                    placeholder="Prezados, identificamos um cenário de falha no(a) (INC, TASK, WR, SITUAÇÃO), onde ocorre o seguinte..."
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="situacao">Em qual situação ocorre o erro?</Label>
                  <Textarea
                    id="situacao"
                    placeholder="Descreva quando e como o erro acontece"
                    value={situacaoErro}
                    onChange={(e) => setSituacaoErro(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="http">Retorna HTTP de erro?</Label>
                  <Input
                    id="http"
                    placeholder="Ex: Sim - 500, Não"
                    value={retornaHttp}
                    onChange={(e) => setRetornaHttp(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Impacto no Negócio */}
            <Card>
              <CardHeader>
                <CardTitle>Impacto no Negócio</CardTitle>
                <CardDescription>
                  Descreva o impacto que essa falha causa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Para esse cenário, o impacto para o negócio é..."
                  value={impactoNegocio}
                  onChange={(e) => setImpactoNegocio(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Serviços e Versões */}
            <Card>
              <CardHeader>
                <CardTitle>Serviços e Versões</CardTitle>
                <CardDescription>
                  Informe todos os serviços envolvidos e suas versões em produção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`service-name-${index}`}>Serviço</Label>
                      <Input
                        id={`service-name-${index}`}
                        placeholder="Nome do serviço"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`service-version-${index}`}>Versão</Label>
                      <Input
                        id={`service-version-${index}`}
                        placeholder="v1.0.0"
                        value={service.version}
                        onChange={(e) => updateService(index, 'version', e.target.value)}
                      />
                    </div>
                    {services.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeService(index)}
                        className="mt-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addService} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardContent>
            </Card>

            {/* Logs e Informações */}
            <Card>
              <CardHeader>
                <CardTitle>Informações e Logs</CardTitle>
                <CardDescription>
                  Dados necessários para análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tid">TID</Label>
                    <Input
                      id="tid"
                      placeholder="Transaction ID"
                      value={tid}
                      onChange={(e) => setTid(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataHora">Data e Hora</Label>
                    <Input
                      id="dataHora"
                      type="datetime-local"
                      value={dataHora}
                      onChange={(e) => setDataHora(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apontamentos">Apontamentos</Label>
                  <Textarea
                    id="apontamentos"
                    placeholder="Observações e apontamentos importantes"
                    value={apontamentos}
                    onChange={(e) => setApontamentos(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logs">Logs</Label>
                  <Textarea
                    id="logs"
                    placeholder="Cole aqui os logs relevantes"
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Validação */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Validação</CardTitle>
                <CardDescription>
                  Preencha conforme o Change Quest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="areas">Áreas que realizarão a validação funcional</Label>
                  <Textarea
                    id="areas"
                    placeholder="Liste as áreas responsáveis pela validação"
                    value={areasValidacao}
                    onChange={(e) => setAreasValidacao(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fluxo">Detalhamento do fluxo de validação</Label>
                  <Textarea
                    id="fluxo"
                    placeholder="Descreva o fluxo que será executado durante a validação"
                    value={fluxoValidacao}
                    onChange={(e) => setFluxoValidacao(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário de validação da change</Label>
                  <RadioGroup value={horarioValidacao} onValueChange={setHorarioValidacao}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="durante-change" id="durante-change" />
                      <Label htmlFor="durante-change" className="font-normal">Durante a change</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="durante-dia" id="durante-dia" />
                      <Label htmlFor="durante-dia" className="font-normal">Durante o dia (requer justificativa)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="durante-semana" id="durante-semana" />
                      <Label htmlFor="durante-semana" className="font-normal">Durante a semana (requer justificativa)</Label>
                    </div>
                  </RadioGroup>
                </div>
                {(horarioValidacao === 'durante-dia' || horarioValidacao === 'durante-semana') && (
                  <div className="space-y-2">
                    <Label htmlFor="justificativa">Justificativa e DE ACORDO do gestor</Label>
                    <Textarea
                      id="justificativa"
                      placeholder="Justifique a escolha e anexe o DE ACORDO do gestor responsável"
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Links Externos */}
            <Card>
              <CardHeader>
                <CardTitle>Links Externos</CardTitle>
                <CardDescription>
                  Sistemas para abertura de tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="https://dev.azure.com/timbrasil/Producao/_workitems/create/Bug"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Azure DevOps - Abertura de Bug TIM
                </a>
                <a 
                  href="https://timbrasil.service-now.com/now/nav/ui/classic/params/target/problem.do%3Fsys_id%3D-1%26sysparm_stack%3Dproblem_list.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  ServiceNow - Abertura de Problema (ITSM)
                </a>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Bug className="mr-2 h-4 w-4" />
                Criar Bug
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
