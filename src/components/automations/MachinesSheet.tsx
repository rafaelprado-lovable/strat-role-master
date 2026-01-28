import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Machine } from '@/types/automations';
import { Edit2, Plus, Server, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MachinesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machines: Machine[];
  onAddMachine: () => void;
  onEditMachine: (machine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
}

export function MachinesSheet({
  open,
  onOpenChange,
  machines,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
}: MachinesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Máquinas Cadastradas</SheetTitle>
          <SheetDescription>
            Gerencie as máquinas onde os scripts serão executados remotamente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Button onClick={onAddMachine} className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Nova Máquina
          </Button>

          <ScrollArea className="h-[calc(100vh-250px)]">
            {machines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma máquina cadastrada</p>
                <p className="text-sm">Clique em "Nova Máquina" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {machines.map((machine) => (
                  <div
                    key={machine.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{machine.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditMachine(machine)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onDeleteMachine(machine.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {machine.host}:{machine.port}
                    </div>
                    {machine.description && (
                      <p className="text-xs text-muted-foreground">
                        {machine.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
