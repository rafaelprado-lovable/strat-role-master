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

interface Service {
  name: string;
  version: string;
}

export default function BugReport() {
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
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abertura de Bug</h1>
          <p className="text-muted-foreground mt-2">
            Preencha o formulário seguindo o padrão de documentação
          </p>
        </div>
        <Bug className="h-8 w-8 text-primary" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título do Bug */}
        <Card>
          <CardHeader>
            <CardTitle>Título do Bug</CardTitle>
            <CardDescription>
              Formato: [AMBIENTE][SISTEMA - CANAL/TECNOLOGIA - ERRO_GERADO] Descrição Resumida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Ex: API Gateway, Portal Web"
                  value={sistema}
                  onChange={(e) => setSistema(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canal">Canal/Tecnologia *</Label>
                <Input
                  id="canal"
                  placeholder="Ex: Mobile, Web, API"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="erro">Erro Gerado *</Label>
                <Input
                  id="erro"
                  placeholder="Ex: 500, TimeoutException"
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
                <p className="text-sm font-mono">{generateTitle()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contextualização */}
        <Card>
          <CardHeader>
            <CardTitle>Contextualização do Cenário de Falha</CardTitle>
            <CardDescription>
              Forneça o máximo de detalhes possíveis sobre o erro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contexto">Descrição do Contexto</Label>
              <Textarea
                id="contexto"
                placeholder="Prezados, identificamos um cenário de falha no(a) (INC, TASK, WR. SITUAÇÃO), onde ocorre o seguinte..."
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="situacao">Em qual situação ocorre o erro?</Label>
              <Textarea
                id="situacao"
                placeholder="Descreva detalhadamente quando o erro acontece"
                value={situacaoErro}
                onChange={(e) => setSituacaoErro(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="http">Retorna HTTP de erro?</Label>
              <Input
                id="http"
                placeholder="Ex: Sim, retorna 500 / Não retorna erro HTTP"
                value={retornaHttp}
                onChange={(e) => setRetornaHttp(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Impacto no Negócio */}
        <Card>
          <CardHeader>
            <CardTitle>Impacto para o Negócio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="impacto">Descrição do Impacto</Label>
              <Textarea
                id="impacto"
                placeholder="Para este cenário, o impacto para o negócio é..."
                value={impactoNegocio}
                onChange={(e) => setImpactoNegocio(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Serviços e Versões */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços e Versões</CardTitle>
            <CardDescription>
              Liste todos os serviços envolvidos e suas versões em produção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`service-name-${index}`}>Nome do Serviço</Label>
                  <Input
                    id={`service-name-${index}`}
                    placeholder="Ex: API de Autenticação"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`service-version-${index}`}>Versão em Produção</Label>
                  <Input
                    id={`service-version-${index}`}
                    placeholder="Ex: v2.3.1"
                    value={service.version}
                    onChange={(e) => updateService(index, 'version', e.target.value)}
                  />
                </div>
                {services.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(index)}
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

        {/* Informações e Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Informações e Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Informações relevantes sobre o problema"
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
            <CardTitle>Validação da Change</CardTitle>
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
            <div className="space-y-3">
              <Label>Horário de validação da change</Label>
              <RadioGroup value={horarioValidacao} onValueChange={setHorarioValidacao}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="durante-change" id="durante" />
                  <Label htmlFor="durante" className="font-normal cursor-pointer">
                    Durante a change
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="durante-dia" id="dia" />
                  <Label htmlFor="dia" className="font-normal cursor-pointer">
                    Durante o dia (Requer justificativa e DE ACORDO do gestor)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="durante-semana" id="semana" />
                  <Label htmlFor="semana" className="font-normal cursor-pointer">
                    Durante a semana (Requer justificativa e DE ACORDO do gestor)
                  </Label>
                </div>
              </RadioGroup>
              {(horarioValidacao === 'durante-dia' || horarioValidacao === 'durante-semana') && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="justificativa">Justificativa *</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Justifique a necessidade e anexe o DE ACORDO do gestor responsável"
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Links e Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Links de Referência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Abertura de Bug TIM (Azure DevOps)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open('https://dev.azure.com/timbrasil/Producao/_workitems/create/Bug', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Abertura de Problema (ServiceNow)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open('https://timbrasil.service-now.com/now/nav/ui/classic/params/target/problem.do%3Fsys_id%3D-1%26sysparm_stack%3Dproblem_list.do', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit">
            <Bug className="h-4 w-4 mr-2" />
            Criar Bug
          </Button>
        </div>
      </form>
    </div>
  );
}
