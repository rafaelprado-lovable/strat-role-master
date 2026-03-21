import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon } from "lucide-react";
import { Changes } from "@/types";
import { cn } from "@/lib/utils";

interface ChangesTimelineProps {
  changes: Changes[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

/** Extrai datas únicas e conta changes por dia */
function getDateCounts(changes: Changes[]): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const c of changes) {
    const dateKey = c.changeSystemData.start_date?.split(" ")[0] || "Sem data";
    map[dateKey] = (map[dateKey] || 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function ChangesTimeline({ changes, selectedDate, onSelectDate }: ChangesTimelineProps) {
  const dateCounts = useMemo(() => getDateCounts(changes), [changes]);

  if (changes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Timeline de Changes
        </CardTitle>
        <CardDescription>
          Clique em uma data para visualizar as changes daquele dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex items-end gap-1 pb-2 min-w-max">
            {dateCounts.map(({ date, count }, idx) => {
              const isSelected = selectedDate === date;
              return (
                <div key={date} className="flex flex-col items-center gap-1">
                  {/* Count badge */}
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {count}
                  </Badge>

                  {/* Timeline node */}
                  <div className="flex items-center">
                    {/* Connector line left */}
                    {idx > 0 && (
                      <div className="w-6 h-0.5 bg-border" />
                    )}

                    <button
                      onClick={() => onSelectDate(date)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer",
                        "hover:border-primary/50 hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full transition-colors",
                          isSelected ? "bg-primary" : "bg-muted-foreground/40"
                        )}
                      />
                      <span className={cn(
                        "text-xs font-mono whitespace-nowrap",
                        isSelected ? "font-semibold text-primary" : "text-muted-foreground"
                      )}>
                        {date}
                      </span>
                    </button>

                    {/* Connector line right */}
                    {idx < dateCounts.length - 1 && (
                      <div className="w-6 h-0.5 bg-border" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
