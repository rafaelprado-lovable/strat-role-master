import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Variable,
  Globe,
  Cpu,
  MemoryStick,
  Server,
  Scaling,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_VARIABLES = [
  "DATABASE_URL",
  "REDIS_URL",
  "API_KEY",
  "SECRET_KEY",
  "LOG_LEVEL",
  "NODE_ENV",
  "PORT",
  "KAFKA_BROKERS",
  "S3_BUCKET",
  "SENTRY_DSN",
  "NEW_RELIC_KEY",
  "ELASTICSEARCH_URL",
  "RABBITMQ_URL",
  "SMTP_HOST",
  "CACHE_TTL",
];

interface SelectedVariable {
  id: string;
  name: string;
}

interface HostAlias {
  id: string;
  ip: string;
  hostnames: string[];
}

interface ResourceConfig {
  cpuMin: string;
  cpuMax: string;
  memoryMin: string;
  memoryMax: string;
  podsMin: number;
  podsMax: number;
  autoscalingEnabled: boolean;
  autoscalingTargetCpu: number;
  autoscalingTargetMemory: number;
}

const DEFAULT_RESOURCES: ResourceConfig = {
  cpuMin: "100m",
  cpuMax: "500m",
  memoryMin: "128Mi",
  memoryMax: "512Mi",
  podsMin: 1,
  podsMax: 3,
  autoscalingEnabled: true,
  autoscalingTargetCpu: 80,
  autoscalingTargetMemory: 80,
};

// Per-deployment config
interface DeploymentConfig {
  variables: SelectedVariable[];
  hostAliases: HostAlias[];
  resources: ResourceConfig;
}

interface Props {
  serviceNames: string[];
}

// Deployment selector component used in each config section
function DeploymentSelector({
  serviceNames,
  selected,
  onChange,
}: {
  serviceNames: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const allSelected = selected.length === serviceNames.length;
  const noneSelected = selected.length === 0;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...serviceNames]);
  };

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name]
    );
  };

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground font-medium">Aplicar a</Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={toggleAll}
        >
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {serviceNames.map((name) => {
          const checked = selected.includes(name);
          return (
            <label
              key={name}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                checked
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(name)}
                className="h-3.5 w-3.5"
              />
              <span className="truncate max-w-[140px]">{name}</span>
            </label>
          );
        })}
      </div>
      {noneSelected && (
        <p className="text-xs text-destructive">Selecione ao menos um deployment</p>
      )}
    </div>
  );
}

export default function DeploymentConfigPanel({ serviceNames }: Props) {
  const { toast } = useToast();

  // Per-service config map
  const [configs, setConfigs] = useState<Record<string, DeploymentConfig>>(() => {
    const initial: Record<string, DeploymentConfig> = {};
    serviceNames.forEach((name) => {
      initial[name] = {
        variables: [],
        hostAliases: [],
        resources: { ...DEFAULT_RESOURCES },
      };
    });
    return initial;
  });

  // Track which deployments are selected for each config section
  const [varTargets, setVarTargets] = useState<string[]>([...serviceNames]);
  const [hostTargets, setHostTargets] = useState<string[]>([...serviceNames]);
  const [resTargets, setResTargets] = useState<string[]>([...serviceNames]);

  // Shared editing state (edits apply to all selected targets)
  const [sharedVars, setSharedVars] = useState<SelectedVariable[]>([
    { id: "1", name: "DATABASE_URL" },
    { id: "2", name: "REDIS_URL" },
  ]);
  const [sharedHostAliases, setSharedHostAliases] = useState<HostAlias[]>([
    { id: "1", ip: "10.0.0.50", hostnames: ["api.internal.local", "gateway.internal.local"] },
  ]);
  const [sharedResources, setSharedResources] = useState<ResourceConfig>({ ...DEFAULT_RESOURCES });

  // Section collapse state
  const [openSections, setOpenSections] = useState({ vars: true, hosts: true, resources: true });

  // --- Variables ---
  const addVariable = (name: string) => {
    if (sharedVars.find((v) => v.name === name)) {
      toast({ title: "Variável já adicionada", variant: "destructive" });
      return;
    }
    setSharedVars((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };

  const removeVariable = (id: string) => {
    setSharedVars((prev) => prev.filter((v) => v.id !== id));
  };

  const availableToAdd = AVAILABLE_VARIABLES.filter(
    (v) => !sharedVars.find((sv) => sv.name === v)
  );

  // --- Host Aliases ---
  const addHostAlias = () => {
    setSharedHostAliases((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ip: "", hostnames: [""] },
    ]);
  };

  const removeHostAlias = (id: string) => {
    setSharedHostAliases((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHostAliasIp = (id: string, ip: string) => {
    setSharedHostAliases((prev) => prev.map((h) => (h.id === id ? { ...h, ip } : h)));
  };

  const addHostname = (aliasId: string) => {
    setSharedHostAliases((prev) =>
      prev.map((h) => (h.id === aliasId ? { ...h, hostnames: [...h.hostnames, ""] } : h))
    );
  };

  const updateHostname = (aliasId: string, index: number, value: string) => {
    setSharedHostAliases((prev) =>
      prev.map((h) =>
        h.id === aliasId
          ? { ...h, hostnames: h.hostnames.map((hn, i) => (i === index ? value : hn)) }
          : h
      )
    );
  };

  const removeHostname = (aliasId: string, index: number) => {
    setSharedHostAliases((prev) =>
      prev.map((h) =>
        h.id === aliasId
          ? { ...h, hostnames: h.hostnames.filter((_, i) => i !== index) }
          : h
      )
    );
  };

  // --- Resources ---
  const resetResources = () => {
    setSharedResources({ ...DEFAULT_RESOURCES });
    toast({ title: "Valores padrão restaurados" });
  };

  // Apply config to selected targets
  const applyConfig = () => {
    setConfigs((prev) => {
      const next = { ...prev };
      varTargets.forEach((name) => {
        if (next[name]) next[name] = { ...next[name], variables: [...sharedVars] };
      });
      hostTargets.forEach((name) => {
        if (next[name])
          next[name] = {
            ...next[name],
            hostAliases: sharedHostAliases.map((h) => ({
              ...h,
              hostnames: [...h.hostnames],
            })),
          };
      });
      resTargets.forEach((name) => {
        if (next[name]) next[name] = { ...next[name], resources: { ...sharedResources } };
      });
      return next;
    });
    toast({
      title: "Configuração aplicada",
      description: `Configuração aplicada aos deployments selecionados.`,
    });
  };

  const toggleSection = (key: "vars" | "hosts" | "resources") => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 pr-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Deployments:</span>
          {serviceNames.map((name) => (
            <Badge key={name} variant="outline" className="text-xs font-mono">
              {name}
            </Badge>
          ))}
        </div>

        {/* Variables Section */}
        <Card>
          <Collapsible open={openSections.vars} onOpenChange={() => toggleSection("vars")}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {openSections.vars ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Variable className="h-4 w-4" />
                    Variáveis
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {sharedVars.length} selecionadas · {varTargets.length} deployments
                  </Badge>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <DeploymentSelector
                  serviceNames={serviceNames}
                  selected={varTargets}
                  onChange={setVarTargets}
                />

                <div className="flex gap-2">
                  <Select onValueChange={addVariable}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma variável..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAdd.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          Todas as variáveis foram adicionadas
                        </SelectItem>
                      ) : (
                        availableToAdd.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {sharedVars.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma variável selecionada
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sharedVars.map((v) => (
                      <Badge
                        key={v.id}
                        variant="secondary"
                        className="gap-1 pl-3 pr-1 py-1.5 font-mono text-xs"
                      >
                        {v.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removeVariable(v.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Host Aliases Section */}
        <Card>
          <Collapsible open={openSections.hosts} onOpenChange={() => toggleSection("hosts")}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {openSections.hosts ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Globe className="h-4 w-4" />
                    Host Aliases
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {sharedHostAliases.length} aliases · {hostTargets.length} deployments
                  </Badge>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <DeploymentSelector
                  serviceNames={serviceNames}
                  selected={hostTargets}
                  onChange={setHostTargets}
                />

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={addHostAlias}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {sharedHostAliases.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum host alias configurado
                  </p>
                ) : (
                  sharedHostAliases.map((alias) => (
                    <div key={alias.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">IP</Label>
                          <Input
                            placeholder="ex: 10.0.0.50"
                            value={alias.ip}
                            onChange={(e) => updateHostAliasIp(alias.id, e.target.value)}
                            className="font-mono text-sm mt-1"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-5 text-destructive hover:bg-destructive/10"
                          onClick={() => removeHostAlias(alias.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Hostnames</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => addHostname(alias.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Hostname
                          </Button>
                        </div>
                        {alias.hostnames.map((hostname, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="ex: api.internal.local"
                              value={hostname}
                              onChange={(e) => updateHostname(alias.id, idx, e.target.value)}
                              className="font-mono text-sm"
                            />
                            {alias.hostnames.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeHostname(alias.id, idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Resources Section */}
        <Card>
          <Collapsible open={openSections.resources} onOpenChange={() => toggleSection("resources")}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {openSections.resources ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Server className="h-4 w-4" />
                    Recursos dos Deployments
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {resTargets.length} deployments
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetResources();
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Padrão
                    </Button>
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-5">
                <DeploymentSelector
                  serviceNames={serviceNames}
                  selected={resTargets}
                  onChange={setResTargets}
                />

                {/* CPU */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" /> CPU
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Mínimo (request)</Label>
                      <Input
                        value={sharedResources.cpuMin}
                        onChange={(e) => setSharedResources((r) => ({ ...r, cpuMin: e.target.value }))}
                        placeholder="100m"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Máximo (limit)</Label>
                      <Input
                        value={sharedResources.cpuMax}
                        onChange={(e) => setSharedResources((r) => ({ ...r, cpuMax: e.target.value }))}
                        placeholder="500m"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Memory */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <MemoryStick className="h-3.5 w-3.5" /> Memória
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Mínimo (request)</Label>
                      <Input
                        value={sharedResources.memoryMin}
                        onChange={(e) => setSharedResources((r) => ({ ...r, memoryMin: e.target.value }))}
                        placeholder="128Mi"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Máximo (limit)</Label>
                      <Input
                        value={sharedResources.memoryMax}
                        onChange={(e) => setSharedResources((r) => ({ ...r, memoryMax: e.target.value }))}
                        placeholder="512Mi"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pods */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" /> Pods (Replicas)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Input
                        type="number"
                        min={1}
                        value={sharedResources.podsMin}
                        onChange={(e) =>
                          setSharedResources((r) => ({ ...r, podsMin: parseInt(e.target.value) || 1 }))
                        }
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Input
                        type="number"
                        min={1}
                        value={sharedResources.podsMax}
                        onChange={(e) =>
                          setSharedResources((r) => ({ ...r, podsMax: parseInt(e.target.value) || 1 }))
                        }
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Autoscaling */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Scaling className="h-3.5 w-3.5" /> Autoscaling (HPA)
                    </Label>
                    <Switch
                      checked={sharedResources.autoscalingEnabled}
                      onCheckedChange={(checked) =>
                        setSharedResources((r) => ({ ...r, autoscalingEnabled: checked }))
                      }
                    />
                  </div>

                  {sharedResources.autoscalingEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Target CPU (%)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={sharedResources.autoscalingTargetCpu}
                          onChange={(e) =>
                            setSharedResources((r) => ({
                              ...r,
                              autoscalingTargetCpu: parseInt(e.target.value) || 80,
                            }))
                          }
                          className="font-mono text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Memory (%)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={sharedResources.autoscalingTargetMemory}
                          onChange={(e) =>
                            setSharedResources((r) => ({
                              ...r,
                              autoscalingTargetMemory: parseInt(e.target.value) || 80,
                            }))
                          }
                          className="font-mono text-sm mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Apply button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={resetResources}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={applyConfig}>
            <Copy className="h-4 w-4 mr-2" />
            Aplicar Configuração
          </Button>
        </div>

        {/* Per-deployment summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Resumo por Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceNames.map((name) => {
                const cfg = configs[name];
                if (!cfg) return null;
                return (
                  <div key={name} className="border rounded-md p-3 space-y-2">
                    <p className="text-sm font-medium font-mono">{name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{cfg.variables.length} variáveis</span>
                      <span>{cfg.hostAliases.length} host aliases</span>
                      <span>CPU: {cfg.resources.cpuMin}-{cfg.resources.cpuMax}</span>
                      <span>Mem: {cfg.resources.memoryMin}-{cfg.resources.memoryMax}</span>
                      <span>Pods: {cfg.resources.podsMin}-{cfg.resources.podsMax}</span>
                      {cfg.resources.autoscalingEnabled && (
                        <Badge variant="outline" className="text-xs">HPA</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
