import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UpdateMnp() {
  const [msisdn, setMsisdn] = useState('');
  const [rn, setRn] = useState('');
  const [loading, setLoading] = useState(false);

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
        if (data && typeof data.message === 'string') {
          msg = data.message;
        }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Atualização MNP</h2>
        <p className="text-muted-foreground">Preencha os dados para atualizar o MNP no OMS</p>
      </div>

      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
