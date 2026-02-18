import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Activity, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';
import { sanityService, SanityItem } from '@/services/sanityService';

interface ServiceStatus {
  name: string;
  value: number;
  status: 'ok' | 'error';
}

const extractSystem = (name: string): string => {
  const patterns = [
    /^(AIRVANTAGE)_/i,
    /^(BSCSIX)_/i,
    /^(BSCS)_/i,
    /^(BSCS)[RU]/i,
    /^(CBCF)_/i,
    /^(CBD)_/i,
    /^(CRIVO)[R_]/i,
    /^(ECM)[R_]/i,
    /^(EPC)R/i,
    /^(F)_/i,
    /^(GEMFIRE)_/i,
    /^(GEMS)[R_]/i,
    /^(Gemfire)/i,
    /^(GFA)_/i,
    /^(HPERM)_/i,
    /^(HRD)_/i,
    /^(Hperm)/i,
    /^(IMDB)[R_]/i,
    /^(Imdb)/i,
    /^(JUVO)_/i,
    /^(MDG)_/i,
    /^(MRSBL)[R_]/i,
    /^(OCS)[R_]/i,
    /^(OMS)_/i,
    /^(ORCH)[C_]/i,
    /^(Orch)/i,
    /^(P2K)_/i,
    /^(PFE)[RU_]/i,
    /^(PGU)_/i,
    /^(PMID)_/i,
    /^(PROTOCOLO)/i,
    /^(RMCA)[R_]/i,
    /^(RTDM)_/i,
    /^(RabbitMQ)/i,
    /^(Rules)[CE_]/i,
    /^(SENHAUNICA)_/i,
    /^(SGG)_/i,
    /^(SGR)R/i,
    /^(SIEBELCAT)_/i,
    /^(SIEBELPOS)[N_]/i,
    /^(SIEBELPRE)_/i,
    /^(SIEBEL)_/i,
    /^(SiebelPos)/i,
    /^(S)_/i,
    /^(UCM)R/i,
    /^(VAS)[RUS_]/i,
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return 'OUTROS';
};


const SanityCheck = () => {
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
	const [selectedSystem, setSelectedSystem] = useState<string>('all');
	const [apiPayload, setApiPayload] = useState<SanityItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSanity = () => {
		setLoading(true);

		sanityService.getMwDepartment()
		.then((data) => {
			setApiPayload(data);
			setLastUpdate(new Date());
			setError(null);
		})
		.catch(err => {
			console.error(err);
			setError('Erro ao consultar sanity do middleware');
		})
		.finally(() => {
			setLoading(false);
		});
	};

	const responseTimeData: ServiceStatus[] = useMemo(() => {
	return apiPayload.map(item => ({
		name: item.name,
		value: item.latencia_ms,
		status: item.status_lat
	}));
	}, [apiPayload]);
	const availabilityData: ServiceStatus[] = useMemo(() => {
	return apiPayload.map(item => ({
		name: item.name,
		value: item.disponibilidade,
		status: item.status_disp
	}));
	}, [apiPayload]);

	const allSystems = Array.from(
	new Set([...responseTimeData, ...availabilityData].map(s => extractSystem(s.name)))
	).sort();

	useEffect(() => {
	fetchSanity();

	const interval = setInterval(fetchSanity, 5 * 60 * 1000);

	return () => clearInterval(interval);
	}, []);

	const filteredResponseTimeData = useMemo(() => {
	if (selectedSystem === 'all') return responseTimeData;
	return responseTimeData.filter(s => extractSystem(s.name) === selectedSystem);
	}, [selectedSystem, responseTimeData]);

	const filteredAvailabilityData = useMemo(() => {
	if (selectedSystem === 'all') return availabilityData;
	return availabilityData.filter(s => extractSystem(s.name) === selectedSystem);
	}, [selectedSystem, availabilityData]);
  
	const responseTimeErrors = filteredResponseTimeData.filter(s => s.status === 'error');
	const availabilityErrors = filteredAvailabilityData.filter(s => s.status === 'error');
	const totalErrors = responseTimeErrors.length + availabilityErrors.length;
	const totalServices = apiPayload.length;

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('pt-BR') + ' - ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
	};

	const formatValue = (
		value: number,
		type: 'response' | 'availability'
	) => {
		return type === 'response'
		? `${value} ms`
		: `${value} %`;
	};

	const ServiceRow = ({ service, type }: { service: ServiceStatus; type: 'response' | 'availability' }) => (
		<div 
		className={`flex items-center justify-between px-4 py-2 rounded-md transition-colors ${
			service.status === 'error' 
			? 'bg-destructive/10 border border-destructive/30' 
			: 'hover:bg-muted/50'
		}`}
		>
		<div className="flex items-center gap-3">
			{service.status === 'error' ? (
			<AlertTriangle className="h-4 w-4 text-destructive" />
			) : (
			<CheckCircle className="h-4 w-4 text-emerald-500" />
			)}
			<span className={`font-mono text-sm ${service.status === 'error' ? 'text-destructive font-medium' : 'text-foreground'}`}>
			{service.name}
			</span>
		</div>
		<div className="flex items-center gap-2">
			<Badge 
			variant={service.status === 'error' ? 'destructive' : 'secondary'}
			className={
					service.status === 'ok'
					? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
					: ''
			}
			>
			{formatValue(service.value, type)}
			</Badge>
			<span className="text-lg">
			{service.status === 'error' ? '❌' : '✅'}
			</span>
		</div>
		</div>
	);


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sanity Check</h1>
          <p className="text-muted-foreground">
            Monitoramento de disponibilidade e tempo de resposta dos serviços NMWS
          </p>
        </div>

		<div className="flex flex-wrap items-center gap-4">
			<div className="flex items-center gap-2">
				<Filter className="h-4 w-4 text-muted-foreground" />
				<Select value={selectedSystem} onValueChange={setSelectedSystem}>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="Filtrar por sistema" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos os Sistemas</SelectItem>
					{allSystems.map(system => (
					<SelectItem key={system} value={system}>
						{system}
					</SelectItem>
					))}
				</SelectContent>
				</Select>
			</div>

			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Clock className="h-4 w-4" />

				{loading ? (
				<>
					<RefreshCw className="h-3 w-3 animate-spin" />
					<span>Atualizando…</span>
				</>
				) : (
				<span>Última atualização: {formatDate(lastUpdate)}</span>
				)}
			</div>

			<Button
				variant="outline"
				size="sm"
				onClick={fetchSanity}
				disabled={loading}
			>
				<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
				Atualizar
			</Button>
		</div>
      </div>

      {totalErrors > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alertas Ativos</AlertTitle>
          <AlertDescription>
            {totalErrors} serviço{totalErrors > 1 ? 's' : ''} apresentando problemas. 
            Verifique os detalhes abaixo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalServices}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalServices - totalErrors}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {responseTimeErrors.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {availabilityErrors.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas ({totalErrors})
          </TabsTrigger>
          <TabsTrigger value="response" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tempo de Resposta
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Disponibilidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Serviços com Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalErrors === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                  <p>Todos os serviços estão operando normalmente!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responseTimeErrors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tempo de Resposta - {formatDate(lastUpdate)}
                      </h4>
                      <div className="space-y-1">
                        {responseTimeErrors.map((service) => (
                          <ServiceRow key={service.name} service={service} type="response" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availabilityErrors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Disponibilidade - {formatDate(lastUpdate)}
                      </h4>
                      <div className="space-y-1">
                        {availabilityErrors.map((service) => (
                          <ServiceRow key={service.name} service={service} type="availability" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SANITY NMWS DEFAULT - TEMPO DE RESPOSTA - {formatDate(lastUpdate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredResponseTimeData.map((service) => (
                    <ServiceRow key={service.name} service={service} type="response" />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                SANITY NMWS DEFAULT - DISPONIBILIDADE - {formatDate(lastUpdate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-1">
                  {filteredAvailabilityData.map((service) => (
                    <ServiceRow key={service.name} service={service} type="availability" />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SanityCheck;
