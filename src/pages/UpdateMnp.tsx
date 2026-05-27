import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Send } from 'lucide-react';

export default function UpdateMnp() {
  const navigate = useNavigate();
  const [msisdn, setMsisdn] = useState('');
  const [rn, setRn] = useState('');

  const handleQuerySubmit = () => {
    const m = msisdn.trim();
    const r = rn.trim();
    if (!m || !r) return;
    const text = `MSISDN: ${m}\nRN: ${r}\nCNL: 00000`;
    navigate('/ai-chat', { state: { prefillQuery: text } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Atualização MNP</h2>
        <p className="text-muted-foreground">Preencha os dados para consultar a ordem no OMS</p>
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
                  Preencha os campos abaixo para consultar a ordem.
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
                disabled={!msisdn.trim() || !rn.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Consultar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
