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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Timeline de Changes
        </CardTitle>
        <CardDescription>
          Clique em uma data para visualizar as changes daquele dia
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ScrollArea className="w-full">
          <div className="flex items-end gap-0.5 sm:gap-1 pb-2 min-w-max px-1">
            {dateCounts.map(({ date, count }, idx) => {
              const isSelected = selectedDate === date;
              return (
                <div key={date} className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="text-[10px] px-1 sm:px-1.5 py-0"
                  >
                    {count}
                  </Badge>

                  <div className="flex items-center">
                    {idx > 0 && (
                      <div className="w-3 sm:w-6 h-0.5 bg-border" />
                    )}

                    <button
                      onClick={() => onSelectDate(date)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 transition-all cursor-pointer",
                        "hover:border-primary/50 hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card"
                      )}
                    >
                      <div
                        className={cn(
                          "w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full transition-colors",
                          isSelected ? "bg-primary" : "bg-muted-foreground/40"
                        )}
                      />
                      <span className={cn(
                        "text-[10px] sm:text-xs font-mono whitespace-nowrap",
                        isSelected ? "font-semibold text-primary" : "text-muted-foreground"
                      )}>
                        {date}
                      </span>
                    </button>

                    {idx < dateCounts.length - 1 && (
                      <div className="w-3 sm:w-6 h-0.5 bg-border" />
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
