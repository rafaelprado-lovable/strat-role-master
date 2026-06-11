import { Layers, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Index() {
  const { workspaces, current, setCurrent } = useWorkspace();
  const userName = localStorage.getItem("userName") || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
        <p className="text-muted-foreground">
          {userName ? `Olá, ${userName}. ` : ""}Selecione um workspace para começar.
        </p>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum workspace configurado para o seu usuário.
            </p>
            <p className="text-xs text-muted-foreground">
              Procure um administrador para vincular workspaces à sua conta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => {
            const isActive = current?._id === ws._id;
            return (
              <Card
                key={ws._id}
                className={`group transition-all hover:shadow-lg hover:border-primary/40 cursor-pointer ${
                  isActive ? "border-primary/60 ring-1 ring-primary/30" : ""
                }`}
                onClick={() => setCurrent(ws._id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-10 w-10 rounded-lg border border-border flex items-center justify-center shrink-0"
                        style={{ background: `${ws.color}22`, borderColor: ws.color }}
                      >
                        <Layers className="h-5 w-5" style={{ color: ws.color }} />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate">{ws.name}</CardTitle>
                        <CardDescription className="truncate">
                          {ws.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                    </div>
                    {isActive && (
                      <Badge className="gap-1 shrink-0">
                        <Check className="h-3 w-3" /> Ativo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrent(ws._id);
                    }}
                  >
                    {isActive ? "Selecionado" : "Selecionar workspace"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
