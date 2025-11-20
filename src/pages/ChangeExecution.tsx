import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  Loader2, 
  Play,
  Server,
  Package,
  RefreshCw,
  PowerOff,
  Power
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StepStatus = "não executado" | "executado com sucesso" | "executado com erro" | "executando";

interface ServiceItem {
  id: string;
  name: string;
  status: StepStatus;
}

interface PackageItem {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
}

interface ClusterStep {
  id: string;
  name: string;
  type: "stop_services" | "install_packages" | "sync_servers" | "start_services";
  items: (ServiceItem | PackageItem)[];
}

interface Cluster {
  id: string;
  name: string;
  steps: ClusterStep[];
}

const mockClusters: Cluster[] = [
  {
    id: "cluster_qa",
    name: "kong_pmid2_eng_qa",
    steps: [
      {
        id: "stop_1",
        name: "Stop Services",
        type: "stop_services",
        items: [
          { id: "s1", name: "kong_pmid2_eng_qa", status: "executado com sucesso" }
        ]
      },
      {
        id: "install_1",
        name: "Install Packages",
        type: "install_packages",
        items: [
          { id: "p1", name: "package_v1.2.3", description: "Main application package", status: "executado com sucesso" }
        ]
      },
      {
        id: "sync_1",
        name: "Sync Servers",
        type: "sync_servers",
        items: [
          { id: "sy1", name: "kong_pmid2_eng_qa", status: "executando" }
        ]
      },
      {
        id: "start_1",
        name: "Start Services",
        type: "start_services",
        items: [
          { id: "st1", name: "kong_pmid2_eng_qa", status: "não executado" }
        ]
      }
    ]
  },
  {
    id: "cluster_uat",
    name: "kong_pmid2_uats",
    steps: [
      {
        id: "stop_2",
        name: "Stop Services",
        type: "stop_services",
        items: [
          { id: "s2", name: "kong_pmid2_uat1", status: "executado com sucesso" },
          { id: "s3", name: "kong_pmid2_uat2", status: "executado com sucesso" },
          { id: "s4", name: "kong_pmid2_uat3", status: "executado com sucesso" }
        ]
      },
      {
        id: "install_2",
        name: "Install Packages",
        type: "install_packages",
        items: [
          { id: "p2", name: "package_v1.2.3", description: "Main application package", status: "executado com sucesso" },
          { id: "p3", name: "dependency_v2.0.1", description: "Required dependency", status: "executado com sucesso" }
        ]
      },
      {
        id: "sync_2",
        name: "Sync Servers",
        type: "sync_servers",
        items: [
          { id: "sy2", name: "kong_pmid2_uat1", status: "não executado" },
          { id: "sy3", name: "kong_pmid2_uat2", status: "não executado" },
          { id: "sy4", name: "kong_pmid2_uat3", status: "não executado" }
        ]
      },
      {
        id: "start_2",
        name: "Start Services",
        type: "start_services",
        items: [
          { id: "st2", name: "kong_pmid2_uat1", status: "não executado" },
          { id: "st3", name: "kong_pmid2_uat2", status: "não executado" },
          { id: "st4", name: "kong_pmid2_uat3", status: "não executado" }
        ]
      }
    ]
  },
  {
    id: "cluster_preprod",
    name: "kong_pmid2_preprod",
    steps: [
      {
        id: "stop_3",
        name: "Stop Services",
        type: "stop_services",
        items: [
          { id: "s5", name: "kong_pmid2_preprod", status: "não executado" }
        ]
      },
      {
        id: "install_3",
        name: "Install Packages",
        type: "install_packages",
        items: [
          { id: "p4", name: "package_v1.2.3", description: "Main application package", status: "não executado" }
        ]
      },
      {
        id: "sync_3",
        name: "Sync Servers",
        type: "sync_servers",
        items: [
          { id: "sy5", name: "kong_pmid2_preprod", status: "não executado" }
        ]
      },
      {
        id: "start_3",
        name: "Start Services",
        type: "start_services",
        items: [
          { id: "st5", name: "kong_pmid2_preprod", status: "não executado" }
        ]
      }
    ]
  }
];

const getStatusIcon = (status: StepStatus) => {
  switch (status) {
    case "executado com sucesso":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "executado com erro":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "executando":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadgeVariant = (status: StepStatus) => {
  switch (status) {
    case "executado com sucesso":
      return "default";
    case "executado com erro":
      return "destructive";
    case "executando":
      return "secondary";
    default:
      return "outline";
  }
};

const getStepIcon = (type: string) => {
  switch (type) {
    case "stop_services":
      return <PowerOff className="h-4 w-4" />;
    case "install_packages":
      return <Package className="h-4 w-4" />;
    case "sync_servers":
      return <RefreshCw className="h-4 w-4" />;
    case "start_services":
      return <Power className="h-4 w-4" />;
    default:
      return <Server className="h-4 w-4" />;
  }
};

export default function ChangeExecution() {
  const [clusters, setClusters] = useState<Cluster[]>(mockClusters);
  const { toast } = useToast();

  const handleExecuteItem = (clusterId: string, stepId: string, itemId: string) => {
    setClusters(prev => prev.map(cluster => {
      if (cluster.id === clusterId) {
        return {
          ...cluster,
          steps: cluster.steps.map(step => {
            if (step.id === stepId) {
              return {
                ...step,
                items: step.items.map(item => {
                  if (item.id === itemId) {
                    toast({
                      title: "Executando ação",
                      description: `${item.name} está sendo executado...`,
                    });
                    // Simular execução
                    setTimeout(() => {
                      setClusters(current => current.map(c => {
                        if (c.id === clusterId) {
                          return {
                            ...c,
                            steps: c.steps.map(s => {
                              if (s.id === stepId) {
                                return {
                                  ...s,
                                  items: s.items.map(i => {
                                    if (i.id === itemId) {
                                      return { ...i, status: "executado com sucesso" as StepStatus };
                                    }
                                    return i;
                                  })
                                };
                              }
                              return s;
                            })
                          };
                        }
                        return c;
                      }));
                      toast({
                        title: "Ação concluída",
                        description: `${item.name} executado com sucesso!`,
                      });
                    }, 2000);
                    return { ...item, status: "executando" as StepStatus };
                  }
                  return item;
                })
              };
            }
            return step;
          })
        };
      }
      return cluster;
    }));
  };

  const getClusterProgress = (cluster: Cluster) => {
    const totalItems = cluster.steps.reduce((acc, step) => acc + step.items.length, 0);
    const completedItems = cluster.steps.reduce((acc, step) => {
      return acc + step.items.filter(item => item.status === "executado com sucesso").length;
    }, 0);
    return (completedItems / totalItems) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Execução de Change</h2>
          <p className="text-muted-foreground">CHG0174916 - Bug 1185202: [PRODUÇÃO]|PMID</p>
        </div>
      </div>

      <div className="space-y-6">
        {clusters.map((cluster) => (
          <Card key={cluster.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  <CardTitle>{cluster.name}</CardTitle>
                </div>
                <Progress value={getClusterProgress(cluster)} className="w-32" />
              </div>
              <CardDescription>
                Pipeline de execução para o cluster {cluster.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {cluster.steps.map((step) => (
                  <Card key={step.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.type)}
                        <CardTitle className="text-sm font-medium">{step.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {step.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(item.status)}
                              <span className="text-sm font-medium truncate">{item.name}</span>
                            </div>
                            {'description' in item && item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                            <Badge variant={getStatusBadgeVariant(item.status)} className="mt-2 text-xs">
                              {item.status}
                            </Badge>
                          </div>
                          {item.status === "não executado" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleExecuteItem(cluster.id, step.id, item.id)}
                              title="Executar"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
