import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Available variables that can be assigned
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

export default function DeploymentConfigPanel() {
  const { toast } = useToast();

  // Variables state
  const [selectedVariables, setSelectedVariables] = useState<SelectedVariable[]>([
    { id: "1", name: "DATABASE_URL" },
    { id: "2", name: "REDIS_URL" },
  ]);

  // Host aliases state
  const [hostAliases, setHostAliases] = useState<HostAlias[]>([
    { id: "1", ip: "10.0.0.50", hostnames: ["api.internal.local", "gateway.internal.local"] },
  ]);

  // Resource config state
  const [resources, setResources] = useState<ResourceConfig>({ ...DEFAULT_RESOURCES });

  // --- Variables ---
  const addVariable = (name: string) => {
    if (selectedVariables.find((v) => v.name === name)) {
      toast({ title: "Variável já adicionada", variant: "destructive" });
      return;
    }
    setSelectedVariables((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };

  const removeVariable = (id: string) => {
    setSelectedVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const availableToAdd = AVAILABLE_VARIABLES.filter(
    (v) => !selectedVariables.find((sv) => sv.name === v)
  );

  // --- Host Aliases ---
  const addHostAlias = () => {
    setHostAliases((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ip: "", hostnames: [""] },
    ]);
  };

  const removeHostAlias = (id: string) => {
    setHostAliases((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHostAliasIp = (id: string, ip: string) => {
    setHostAliases((prev) => prev.map((h) => (h.id === id ? { ...h, ip } : h)));
  };

  const addHostname = (aliasId: string) => {
    setHostAliases((prev) =>
      prev.map((h) => (h.id === aliasId ? { ...h, hostnames: [...h.hostnames, ""] } : h))
    );
  };

  const updateHostname = (aliasId: string, index: number, value: string) => {
    setHostAliases((prev) =>
      prev.map((h) =>
        h.id === aliasId
          ? { ...h, hostnames: h.hostnames.map((hn, i) => (i === index ? value : hn)) }
          : h
      )
    );
  };

  const removeHostname = (aliasId: string, index: number) => {
    setHostAliases((prev) =>
      prev.map((h) =>
        h.id === aliasId
          ? { ...h, hostnames: h.hostnames.filter((_, i) => i !== index) }
          : h
      )
    );
  };

  // --- Resources ---
  const resetResources = () => {
    setResources({ ...DEFAULT_RESOURCES });
    toast({ title: "Valores padrão restaurados" });
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 pr-4">
        {/* Variables Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Variable className="h-4 w-4" />
              Variáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {selectedVariables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma variável selecionada
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedVariables.map((v) => (
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
        </Card>

        {/* Host Aliases Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Host Aliases
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addHostAlias}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hostAliases.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum host alias configurado
              </p>
            ) : (
              hostAliases.map((alias) => (
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
        </Card>

        {/* Resources Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Recursos dos Deployments
              </CardTitle>
              <Button variant="outline" size="sm" onClick={resetResources}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Padrão
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* CPU */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> CPU
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Mínimo (request)</Label>
                  <Input
                    value={resources.cpuMin}
                    onChange={(e) => setResources((r) => ({ ...r, cpuMin: e.target.value }))}
                    placeholder="100m"
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Máximo (limit)</Label>
                  <Input
                    value={resources.cpuMax}
                    onChange={(e) => setResources((r) => ({ ...r, cpuMax: e.target.value }))}
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
                    value={resources.memoryMin}
                    onChange={(e) => setResources((r) => ({ ...r, memoryMin: e.target.value }))}
                    placeholder="128Mi"
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Máximo (limit)</Label>
                  <Input
                    value={resources.memoryMax}
                    onChange={(e) => setResources((r) => ({ ...r, memoryMax: e.target.value }))}
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
                    value={resources.podsMin}
                    onChange={(e) =>
                      setResources((r) => ({ ...r, podsMin: parseInt(e.target.value) || 1 }))
                    }
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Máximo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={resources.podsMax}
                    onChange={(e) =>
                      setResources((r) => ({ ...r, podsMax: parseInt(e.target.value) || 1 }))
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
                  checked={resources.autoscalingEnabled}
                  onCheckedChange={(checked) =>
                    setResources((r) => ({ ...r, autoscalingEnabled: checked }))
                  }
                />
              </div>

              {resources.autoscalingEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Target CPU (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={resources.autoscalingTargetCpu}
                      onChange={(e) =>
                        setResources((r) => ({
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
                      value={resources.autoscalingTargetMemory}
                      onChange={(e) =>
                        setResources((r) => ({
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
        </Card>
      </div>
    </ScrollArea>
  );
}
