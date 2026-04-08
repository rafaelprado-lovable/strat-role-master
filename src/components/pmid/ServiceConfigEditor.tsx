import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Settings2,
  KeyRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SelectedVariable {
  id: string;
  name: string;
}

export interface HostAlias {
  id: string;
  ip: string;
  hostnames: string[];
}

export interface ResourceConfig {
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

export interface DeploymentConfig {
  variables: SelectedVariable[];
  secrets: string[];
  hostAliases: HostAlias[];
  resources: ResourceConfig;
}

export const DEFAULT_RESOURCES: ResourceConfig = {
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

interface Props {
  config: DeploymentConfig;
  allVariables: string[];
  onChange: (config: DeploymentConfig) => void;
}

export default function ServiceConfigEditor({ config, allVariables, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const update = (updater: (cfg: DeploymentConfig) => DeploymentConfig) => {
    onChange(updater(config));
  };

  const resetResources = () => {
    update((c) => ({ ...c, resources: { ...DEFAULT_RESOURCES } }));
    toast({ title: "Recursos restaurados ao padrão" });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5" />
            <span className="font-medium">Configuração</span>
            <span className="text-muted-foreground/70">
              {config.variables.length} vars · {config.hostAliases.length} hosts · CPU {config.resources.cpuMin}-{config.resources.cpuMax}
            </span>
          </div>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-4 border rounded-md p-3 bg-background">
          {/* Variables */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Variable className="h-3.5 w-3.5" /> Variáveis
            </Label>
            <Select
              onValueChange={(v) =>
                update((c) => ({
                  ...c,
                  variables: [...c.variables, { id: crypto.randomUUID(), name: v }],
                }))
              }
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Adicionar variável..." />
              </SelectTrigger>
              <SelectContent>
                {allVariables
                  .filter((v) => !config.variables.find((sv) => sv.name === v))
                  .map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {config.variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.variables.map((v) => (
                  <Badge key={v.id} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 font-mono text-xs">
                    {v.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        update((c) => ({ ...c, variables: c.variables.filter((x) => x.id !== v.id) }));
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Secrets */}
          {config.secrets.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Secrets
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {config.secrets.map((s) => (
                    <Badge key={s} variant="outline" className="font-mono text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Host Aliases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Host Aliases
              </Label>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() =>
                  update((c) => ({
                    ...c,
                    hostAliases: [...c.hostAliases, { id: crypto.randomUUID(), ip: "", hostnames: [""] }],
                  }))
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            {config.hostAliases.map((alias) => (
              <div key={alias.id} className="border rounded-md p-2 space-y-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="IP"
                    value={alias.ip}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        hostAliases: c.hostAliases.map((h) =>
                          h.id === alias.id ? { ...h, ip: e.target.value } : h
                        ),
                      }))
                    }
                    className="font-mono text-xs flex-1 h-7"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() =>
                      update((c) => ({ ...c, hostAliases: c.hostAliases.filter((h) => h.id !== alias.id) }))
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {alias.hostnames.map((hn, idx) => (
                  <div key={idx} className="flex items-center gap-2 ml-3">
                    <Input
                      placeholder="hostname"
                      value={hn}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          hostAliases: c.hostAliases.map((h) =>
                            h.id === alias.id
                              ? { ...h, hostnames: h.hostnames.map((x, i) => (i === idx ? e.target.value : x)) }
                              : h
                          ),
                        }))
                      }
                      className="font-mono text-xs h-7"
                    />
                    {alias.hostnames.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground"
                        onClick={() =>
                          update((c) => ({
                            ...c,
                            hostAliases: c.hostAliases.map((h) =>
                              h.id === alias.id ? { ...h, hostnames: h.hostnames.filter((_, i) => i !== idx) } : h
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs ml-3"
                  onClick={() =>
                    update((c) => ({
                      ...c,
                      hostAliases: c.hostAliases.map((h) =>
                        h.id === alias.id ? { ...h, hostnames: [...h.hostnames, ""] } : h
                      ),
                    }))
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Hostname
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" /> Recursos
              </Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetResources}>
                <RotateCcw className="h-3 w-3 mr-1" /> Padrão
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">CPU min</Label>
                <Input value={config.resources.cpuMin} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, cpuMin: e.target.value } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CPU max</Label>
                <Input value={config.resources.cpuMax} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, cpuMax: e.target.value } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mem min</Label>
                <Input value={config.resources.memoryMin} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, memoryMin: e.target.value } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mem max</Label>
                <Input value={config.resources.memoryMax} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, memoryMax: e.target.value } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pods min</Label>
                <Input type="number" min={1} value={config.resources.podsMin} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, podsMin: parseInt(e.target.value) || 1 } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pods max</Label>
                <Input type="number" min={1} value={config.resources.podsMax} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, podsMax: parseInt(e.target.value) || 1 } }))} className="font-mono text-xs mt-0.5 h-7" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Scaling className="h-3.5 w-3.5" /> Autoscaling
              </Label>
              <Switch
                checked={config.resources.autoscalingEnabled}
                onCheckedChange={(checked) => update((c) => ({ ...c, resources: { ...c.resources, autoscalingEnabled: checked } }))}
              />
            </div>
            {config.resources.autoscalingEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Target CPU %</Label>
                  <Input type="number" min={1} max={100} value={config.resources.autoscalingTargetCpu} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, autoscalingTargetCpu: parseInt(e.target.value) || 80 } }))} className="font-mono text-xs mt-0.5 h-7" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Target Mem %</Label>
                  <Input type="number" min={1} max={100} value={config.resources.autoscalingTargetMemory} onChange={(e) => update((c) => ({ ...c, resources: { ...c.resources, autoscalingTargetMemory: parseInt(e.target.value) || 80 } }))} className="font-mono text-xs mt-0.5 h-7" />
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
