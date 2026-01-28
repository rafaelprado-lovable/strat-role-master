import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AutomationSchedule } from '@/types/automations';
import { Calendar, Clock, RefreshCw } from 'lucide-react';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: AutomationSchedule | null;
  onSave: (schedule: AutomationSchedule | null) => void;
}

const INTERVAL_OPTIONS = [
  { value: '5', label: '5 minutos' },
  { value: '15', label: '15 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '120', label: '2 horas' },
  { value: '360', label: '6 horas' },
  { value: '720', label: '12 horas' },
  { value: '1440', label: '24 horas' },
];

const CRON_PRESETS = [
  { value: '0 * * * *', label: 'A cada hora' },
  { value: '0 0 * * *', label: 'Diariamente à meia-noite' },
  { value: '0 9 * * 1-5', label: 'Dias úteis às 9h' },
  { value: '0 0 * * 1', label: 'Toda segunda-feira' },
  { value: '0 0 1 * *', label: 'Primeiro dia do mês' },
];

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onSave,
}: ScheduleDialogProps) {
  const [enabled, setEnabled] = useState(!!schedule);
  const [type, setType] = useState<'once' | 'interval' | 'cron'>(schedule?.type || 'interval');
  const [value, setValue] = useState(schedule?.value || '60');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [cronValue, setCronValue] = useState(schedule?.type === 'cron' ? schedule.value : '0 * * * *');

  const handleSave = () => {
    if (!enabled) {
      onSave(null);
      return;
    }

    let finalValue = value;
    if (type === 'once') {
      finalValue = new Date(`${dateValue}T${timeValue}`).toISOString();
    } else if (type === 'cron') {
      finalValue = cronValue;
    }

    onSave({
      type,
      value: finalValue,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Agendamento</DialogTitle>
          <DialogDescription>
            Configure quando esta automação deve ser executada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Agendamento ativo</Label>
              <p className="text-sm text-muted-foreground">
                Executar automação automaticamente
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label>Tipo de agendamento</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Uma vez
                      </div>
                    </SelectItem>
                    <SelectItem value="interval">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Intervalo
                      </div>
                    </SelectItem>
                    <SelectItem value="cron">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Expressão Cron
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'once' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora</Label>
                    <Input
                      type="time"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {type === 'interval' && (
                <div className="space-y-2">
                  <Label>Executar a cada</Label>
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {type === 'cron' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Presets</Label>
                    <Select
                      value={cronValue}
                      onValueChange={setCronValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {CRON_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expressão Cron</Label>
                    <Input
                      value={cronValue}
                      onChange={(e) => setCronValue(e.target.value)}
                      placeholder="0 * * * *"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: minuto hora dia mês dia-semana
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
