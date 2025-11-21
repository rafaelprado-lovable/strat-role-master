import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type SwapAlarm = {
  id: string;
  incidente: string;
  horarioAlarme: string;
  horarioFechamento: string;
  maquina: string;
  swapLivre: string;
  status: string;
};

const mockSwapAlarms: SwapAlarm[] = [
  {
    id: "1",
    incidente: "INC2145430",
    horarioAlarme: "2025-11-20 21:42:26",
    horarioFechamento: "2025-11-20 18:43:06.846642",
    maquina: "snelnxb255",
    swapLivre: "14.285714285714292",
    status: "pendente"
  },
  {
    id: "2",
    incidente: "INC2145287",
    horarioAlarme: "2025-11-20 18:53:01",
    horarioFechamento: "2025-11-20 15:54:05.607721",
    maquina: "snelnxb245",
    swapLivre: "18.181818181818173",
    status: "pendente"
  },
  {
    id: "3",
    incidente: "INC2139163",
    horarioAlarme: "2025-11-17 21:16:56",
    horarioFechamento: "2025-11-17 18:17:05.190840",
    maquina: "snelnxb258",
    swapLivre: "14.285714285714292",
    status: "pendente"
  },
  {
    id: "4",
    incidente: "INC2137880",
    horarioAlarme: "2025-11-17 12:11:23",
    horarioFechamento: "2025-11-17 09:12:05.549252",
    maquina: "snelnxb251",
    swapLivre: "14.285714285714292",
    status: "pendente"
  },
  {
    id: "5",
    incidente: "INC2134172",
    horarioAlarme: "2025-11-14 16:18:16",
    horarioFechamento: "2025-11-14 13:19:06.919990",
    maquina: "snelnxb255",
    swapLivre: "100",
    status: "Cenário normalizado"
  }
];

export default function SwapAlarms() {
  const [alarms, setAlarms] = useState<SwapAlarm[]>(mockSwapAlarms);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingAlarm, setLoadingAlarm] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const filteredAlarms = alarms.filter((alarm) =>
    Object.values(alarm).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleCleanup = async (alarm: SwapAlarm) => {
    setLoadingAlarm(alarm.id);
    setProgress(0);
    
    // Simulate progress from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoadingAlarm(null);
            setProgress(0);
            setAlarms(prev => prev.map(a => 
              a.id === alarm.id 
                ? { ...a, status: "Cenário normalizado", swapLivre: "100" }
                : a
            ));
            toast.success("Aplicação reiniciada com sucesso");
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alarmes de SWAP</h2>
        <p className="text-muted-foreground">Monitore e gerencie os alarmes de memória SWAP</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mostrando {filteredAlarms.length} registros</CardTitle>
            <div className="w-[300px]">
              <Input
                placeholder="Search:"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>INCIDENTE</TableHead>
                  <TableHead>HORÁRIO DO ALARME</TableHead>
                  <TableHead>HORÁRIO DE FECHAMENTO</TableHead>
                  <TableHead>MÁQUINA ALARMADA</TableHead>
                  <TableHead>% SWAP LIVRE</TableHead>
                  <TableHead>AÇÃO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.map((alarm) => (
                  <TableRow key={alarm.id}>
                    <TableCell className="font-medium">{alarm.incidente}</TableCell>
                    <TableCell>{alarm.horarioAlarme}</TableCell>
                    <TableCell>{alarm.horarioFechamento}</TableCell>
                    <TableCell>{alarm.maquina}</TableCell>
                    <TableCell>{alarm.swapLivre}</TableCell>
                    <TableCell>
                      {alarm.status === "Cenário normalizado" ? (
                        <span className="text-sm text-muted-foreground">{alarm.status}</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCleanup(alarm)}
                          disabled={loadingAlarm !== null}
                        >
                          {loadingAlarm === alarm.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {loadingAlarm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Progresso da subida da aplicação - {alarms.find(a => a.id === loadingAlarm)?.maquina}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
