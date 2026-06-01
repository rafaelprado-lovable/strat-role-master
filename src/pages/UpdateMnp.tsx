import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Send, Loader2, Trash2, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

const BULK_PLACEHOLDER = `Cole um MSISDN por linha para evitar erros. Ex:
48999999999
4832780017
48988887777`;

type BulkRow = { raw: string; msisdn: string; valid: boolean; reason?: string };

function sanitize(value: string): string {
  // remove spaces, hyphens, parens, dots and invisible chars
  return value
    .replace(/[\s\-().\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function parseBulk(input: string): BulkRow[] {
  if (!input.trim()) return [];
  // split by newline, comma, semicolon
  const parts = input.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const rows: BulkRow[] = [];

  for (const raw of parts) {
    const cleaned = sanitize(raw);
    let valid = true;
    let reason: string | undefined;

    if (!cleaned) {
      valid = false;
      reason = 'Valor vazio após limpeza.';
    } else if (/[a-zA-Z]/.test(raw)) {
      valid = false;
      reason = 'Contém letras. Use apenas números.';
    } else if (!/^\d+$/.test(cleaned)) {
      valid = false;
      reason = 'Contém caracteres inválidos. Use apenas números.';
    } else if (cleaned.length > 13) {
      valid = false;
      reason = 'Encontramos números grudados. Separe um MSISDN por linha.';
    } else if (cleaned.length < 10) {
      valid = false;
      reason = `MSISDN muito curto (${cleaned.length} dígitos). Deve ter entre 10 e 13.`;
    } else if (seen.has(cleaned)) {
      // skip duplicates silently
      continue;
    }

    if (valid) seen.add(cleaned);
    rows.push({ raw, msisdn: cleaned || raw, valid, reason });
  }

  return rows;
}

export default function UpdateMnp() {
  // single mode
  const [msisdn, setMsisdn] = useState('');
  const [rn, setRn] = useState('');
  const [loading, setLoading] = useState(false);

  // bulk mode
  const [bulkText, setBulkText] = useState('');
  const [bulkRn, setBulkRn] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const bulkRows = useMemo(() => parseBulk(bulkText), [bulkText]);
  const allValid = bulkRows.length > 0 && bulkRows.every((r) => r.valid);
  const validCount = bulkRows.filter((r) => r.valid).length;
  const invalidCount = bulkRows.length - validCount;

  const handleQuerySubmit = async () => {
    const m = msisdn.trim();
    const r = rn.trim();
    if (!m || !r) return;
    setLoading(true);
    try {
      const res = await fetch('http://10.151.0.61:5032/bdpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msisdn: m, rn: r }),
      });
      let msg: string | undefined;
      try {
        const data = await res.json();
        if (data && typeof data.message === 'string') msg = data.message;
      } catch {
        msg = await res.text();
      }
      if (!res.ok) throw new Error(msg || `HTTP ${res.status}`);
      toast.success(msg || `MSISDN ${m} atualizado com sucesso.`);
      setMsisdn('');
      setRn('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao enviar requisição.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!allValid || !bulkRn.trim()) return;
    setConfirmOpen(false);
    setBulkLoading(true);
    const msisdns = bulkRows.map((r) => r.msisdn);
    try {
      const res = await fetch('http://10.151.0.61:5032/bdpr/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msisdns, rn: bulkRn.trim() }),
      });
      let msg: string | undefined;
      try {
        const data = await res.json();
        if (data && typeof data.message === 'string') msg = data.message;
      } catch {
        msg = await res.text();
      }
      if (!res.ok) throw new Error(msg || `HTTP ${res.status}`);
      toast.success(msg || `${msisdns.length} MSISDNs atualizados com sucesso.`);
      setBulkText('');
      setBulkRn('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Falha ao enviar requisição em massa.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Atualização MNP</h2>
        <p className="text-muted-foreground">Preencha os dados para atualizar o MNP no OMS</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="single">Individual</TabsTrigger>
              <TabsTrigger value="bulk">Em massa</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <div className="flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md space-y-5">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Atualização do MNP</h2>
                    <p className="text-sm text-muted-foreground">
                      Preencha os campos abaixo para atualizar o MNP.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">MSISDN</label>
                    <Input
                      type="text"
                      value={msisdn}
                      onChange={(e) => setMsisdn(e.target.value)}
                      placeholder="Ex: 99982596475"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">RN</label>
                    <Input
                      type="text"
                      value={rn}
                      onChange={(e) => setRn(e.target.value)}
                      placeholder="Ex: 12345"
                      className="h-11"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuerySubmit();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">CNL</label>
                    <Input
                      type="text"
                      value="00000"
                      disabled
                      readOnly
                      className="h-11 bg-muted text-muted-foreground"
                    />
                  </div>

                  <Button
                    className="w-full h-11"
                    onClick={handleQuerySubmit}
                    disabled={!msisdn.trim() || !rn.trim() || loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Enviando...' : 'Atualizar'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk">
              <div className="px-4 py-6 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Atualização em Massa</h2>
                  <p className="text-sm text-muted-foreground">
                    Cole um MSISDN por linha para evitar erros.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">MSISDNs</label>
                    <Textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={BULK_PLACEHOLDER}
                      autoResize={false}
                      className="min-h-[220px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aceita quebra de linha, vírgula, ponto e vírgula. Espaços, hífens e parênteses são removidos automaticamente. Duplicados são ignorados.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkText('')}
                        disabled={!bulkText}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Limpar lista
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">RN</label>
                      <Input
                        type="text"
                        value={bulkRn}
                        onChange={(e) => setBulkRn(e.target.value)}
                        placeholder="Ex: 12345"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">CNL</label>
                      <Input
                        type="text"
                        value="00000"
                        disabled
                        readOnly
                        className="h-11 bg-muted text-muted-foreground"
                      />
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total detectado</span>
                        <span className="font-medium">{bulkRows.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Válidos</span>
                        <span className="font-medium text-green-600">{validCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inválidos</span>
                        <span className="font-medium text-destructive">{invalidCount}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full h-11"
                      onClick={() => setConfirmOpen(true)}
                      disabled={!allValid || !bulkRn.trim() || bulkLoading}
                    >
                      {bulkLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {bulkLoading ? 'Enviando...' : 'Atualizar em Massa'}
                    </Button>
                  </div>
                </div>

                {bulkRows.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Pré-visualização</label>
                    <div className="rounded-md border max-h-80 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead>MSISDN detectado</TableHead>
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkRows.map((row, i) => (
                            <TableRow key={`${row.raw}-${i}`}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-mono text-sm">{row.msisdn}</TableCell>
                              <TableCell>
                                {row.valid ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Válido
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                                    <XCircle className="w-4 h-4" /> Inválido
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {row.reason ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar atualização em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a atualizar <strong>{validCount}</strong> MSISDN(s) para o RN{' '}
              <strong>{bulkRn.trim()}</strong>. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkSubmit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
