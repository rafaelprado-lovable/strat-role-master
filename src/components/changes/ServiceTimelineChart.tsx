import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";

interface HttpCodeGroup {
  code: string;
  total_count: number;
  avg_time: number;
}

interface ServiceDataPoint {
  timestamp: string;
  context_info: {
    application: string;
    service_name: string;
    route_path: string;
  };
  http_code_group: HttpCodeGroup[];
  avg_time: number;
}

interface ServiceDayData {
  day_key: string;
  services: ServiceDataPoint[];
}

export interface ServiceTimelineData {
  today: ServiceDayData[];
  lastWeek: ServiceDayData[];
}

interface ServiceTimelineChartProps {
  data: ServiceTimelineData;
}

const COLORS = {
  "2xx": "hsl(var(--chart-1))",
  "3xx": "hsl(var(--chart-2))",
  "4xx": "hsl(var(--chart-3))",
  "5xx": "hsl(var(--chart-4))",
  avgTime: "hsl(var(--chart-5))",
};

const formatTime = (timestamp: string) => {
  try {
    const date = parseISO(timestamp.replace(" ", "T"));
    return format(date, "HH:mm", { locale: ptBR });
  } catch {
    return timestamp.split(" ")[1]?.substring(0, 5) || timestamp;
  }
};

const formatDate = (dayKey: string) => {
  try {
    return format(parseISO(dayKey), "dd/MM/yyyy (EEEE)", { locale: ptBR });
  } catch {
    return dayKey;
  }
};

interface TimelineChartSectionProps {
  dayData: ServiceDayData[];
  title: string;
  icon: React.ReactNode;
}

function TimelineChartSection({ dayData, title, icon }: TimelineChartSectionProps) {
  // Group services by service_name across all days
  const serviceGroups = new Map<string, { 
    serviceName: string; 
    application: string; 
    routePath: string; 
    dataPoints: Array<{ timestamp: string; http_code_group: HttpCodeGroup[]; avg_time: number }> 
  }>();

  dayData.forEach((day) => {
    day.services.forEach((service) => {
      const key = service.context_info.service_name;
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, {
          serviceName: service.context_info.service_name,
          application: service.context_info.application,
          routePath: service.context_info.route_path,
          dataPoints: [],
        });
      }
      serviceGroups.get(key)!.dataPoints.push({
        timestamp: service.timestamp,
        http_code_group: service.http_code_group,
        avg_time: service.avg_time,
      });
    });
  });

  // Sort data points by timestamp for each service
  serviceGroups.forEach((group) => {
    group.dataPoints.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  });

  const dateLabel = dayData.length > 0 ? formatDate(dayData[0].day_key) : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span className="font-medium">{title}</span>
        {dateLabel && <span>- {dateLabel}</span>}
      </div>

      {Array.from(serviceGroups.entries()).map(([serviceName, group]) => {
        // Transform data for the chart
        const chartData = group.dataPoints.map((point) => {
          const result: Record<string, string | number> = {
            time: formatTime(point.timestamp),
            fullTimestamp: point.timestamp,
            avgTime: Math.round(point.avg_time),
          };

          point.http_code_group.forEach((httpGroup) => {
            result[`count_${httpGroup.code}`] = httpGroup.total_count;
            result[`time_${httpGroup.code}`] = Math.round(httpGroup.avg_time);
          });

          return result;
        });

        // Get unique HTTP codes
        const httpCodes = new Set<string>();
        group.dataPoints.forEach((point) => {
          point.http_code_group.forEach((httpGroup) => {
            httpCodes.add(httpGroup.code);
          });
        });

        return (
          <Card key={serviceName} className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {group.application}
                </span>
                <span>{serviceName}</span>
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {group.routePath}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Request Count Chart */}
                <div>
                  <h4 className="mb-3 text-xs font-medium text-muted-foreground">Quantidade de Requisições</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 9 }}
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number, name: string) => {
                            const code = name.replace("count_", "");
                            return [value.toLocaleString(), `${code}`];
                          }}
                        />
                        <Legend
                          formatter={(value: string) => value.replace("count_", "")}
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                        {Array.from(httpCodes).map((code) => (
                          <Line
                            key={`count_${code}`}
                            type="monotone"
                            dataKey={`count_${code}`}
                            name={`count_${code}`}
                            stroke={COLORS[code as keyof typeof COLORS] || "hsl(var(--muted-foreground))"}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Response Time Chart */}
                <div>
                  <h4 className="mb-3 text-xs font-medium text-muted-foreground">Tempo Médio de Resposta (ms)</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 9 }}
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number, name: string) => {
                            if (name === "avgTime") return [`${value.toLocaleString()}ms`, "Média Geral"];
                            const code = name.replace("time_", "");
                            return [`${value.toLocaleString()}ms`, `${code}`];
                          }}
                        />
                        <Legend
                          formatter={(value: string) => {
                            if (value === "avgTime") return "Média";
                            return value.replace("time_", "");
                          }}
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgTime"
                          name="avgTime"
                          stroke={COLORS.avgTime}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                        {Array.from(httpCodes).map((code) => (
                          <Line
                            key={`time_${code}`}
                            type="monotone"
                            dataKey={`time_${code}`}
                            name={`time_${code}`}
                            stroke={COLORS[code as keyof typeof COLORS] || "hsl(var(--muted-foreground))"}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from(httpCodes).map((code) => {
                  const totalCount = group.dataPoints.reduce((sum, point) => {
                    const httpGroup = point.http_code_group.find((h) => h.code === code);
                    return sum + (httpGroup?.total_count || 0);
                  }, 0);

                  const pointsWithCode = group.dataPoints.filter((p) => 
                    p.http_code_group.some((h) => h.code === code)
                  );
                  const avgResponseTime = pointsWithCode.length > 0
                    ? pointsWithCode.reduce((sum, point) => {
                        const httpGroup = point.http_code_group.find((h) => h.code === code);
                        return sum + (httpGroup?.avg_time || 0);
                      }, 0) / pointsWithCode.length
                    : 0;

                  const isError = code === "4xx" || code === "5xx";

                  return (
                    <div
                      key={code}
                      className={`rounded-lg border p-2 ${isError && totalCount > 0 ? "border-destructive/50 bg-destructive/10" : ""}`}
                    >
                      <div className="text-xs font-medium text-muted-foreground">{code}</div>
                      <div className="text-sm font-bold">{totalCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        ~{Math.round(avgResponseTime).toLocaleString()}ms
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {serviceGroups.size === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum dado de serviço disponível para este período
        </div>
      )}
    </div>
  );
}

export function ServiceTimelineChart({ data }: ServiceTimelineChartProps) {
  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="today" className="gap-2">
          <Clock className="h-4 w-4" />
          Dia Atual
        </TabsTrigger>
        <TabsTrigger value="lastWeek" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Semana Anterior
        </TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="mt-4">
        <TimelineChartSection 
          dayData={data.today} 
          title="Meia-noite até o momento atual"
          icon={<Clock className="h-4 w-4" />}
        />
      </TabsContent>
      <TabsContent value="lastWeek" className="mt-4">
        <TimelineChartSection 
          dayData={data.lastWeek} 
          title="Mesmo dia da semana anterior (meia-noite até horário atual)"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </TabsContent>
    </Tabs>
  );
}
