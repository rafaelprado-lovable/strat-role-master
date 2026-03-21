import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileText, Users, Calendar as CalendarIcon } from "lucide-react";
import { Changes } from "@/types";

interface ChangesTimelineProps {
  changes: Changes[];
  onSelectChange: (change: Changes) => void;
}

/** Agrupa changes por data de início */
function groupByDate(changes: Changes[]): Record<string, Changes[]> {
  const groups: Record<string, Changes[]> = {};
  for (const c of changes) {
    const dateKey = c.changeSystemData.start_date?.split(" ")[0] || "Sem data";
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(c);
  }
  return groups;
}

const stateColor: Record<string, string> = {
  Novo: "bg-blue-500",
  Avaliar: "bg-amber-500",
  Autorizar: "bg-emerald-500",
};

export function ChangesTimeline({ changes, onSelectChange }: ChangesTimelineProps) {
  const grouped = useMemo(() => groupByDate(changes), [changes]);
  const dateKeys = Object.keys(grouped).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Timeline de Changes
        </CardTitle>
        <CardDescription>
          Linha do tempo cronológica das changes por data de execução
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full max-h-[70vh]">
          {changes.length === 0 ? (
            <div className="w-full text-center py-8 text-muted-foreground">
              Nenhuma change encontrada para o período
            </div>
          ) : (
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-8">
                {dateKeys.map((dateKey) => (
                  <div key={dateKey} className="relative">
                    {/* Date marker */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-md">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{dateKey}</h3>
                        <p className="text-xs text-muted-foreground">
                          {grouped[dateKey].length} change{grouped[dateKey].length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Changes for this date */}
                    <div className="ml-12 space-y-3">
                      {grouped[dateKey].map((change) => {
                        const cs = change.changeSystemData;
                        const dotColor = stateColor[cs.state] || "bg-muted-foreground";

                        return (
                          <div
                            key={cs.number}
                            className="group relative flex items-start gap-3 cursor-pointer"
                            onClick={() => onSelectChange(change)}
                          >
                            {/* Small dot connector */}
                            <div className="absolute -left-[30px] top-3 w-5 h-0.5 bg-border" />
                            <div className={`absolute -left-[12px] top-[7px] w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-background z-10`} />

                            {/* Card */}
                            <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm transition-all group-hover:border-primary/50 group-hover:shadow-md">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {cs.number}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {cs.week_day}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {cs.state}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                                    <FileText className="h-3 w-3" />
                                    <span>Descrição</span>
                                  </div>
                                  <p className="text-sm line-clamp-2">{cs.description}</p>
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                                    <Users className="h-3 w-3" />
                                    <span>Equipe na Implementação</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {Array.isArray(cs.teams_involved_in_execution)
                                      ? cs.teams_involved_in_execution.join(", ")
                                      : cs.teams_involved_in_execution || "Não informado"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
