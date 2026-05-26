import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Building2, Shield, UserCog, Users, Search, Send } from 'lucide-react';

export default function Index() {
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Bem-vindo ao Sistema Heimdall</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="query">Consulta</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 m-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Total cadastradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Usuários ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funções</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Funções definidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permissões</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Permissões ativas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Acesso Rápido</CardTitle>
                <CardDescription>Navegue para as principais seções</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/incidents">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Building2 className="h-4 w-4" />
                    Incidentes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Novo usuário cadastrado</p>
                      <p className="text-xs text-muted-foreground">Maria Silva adicionada</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <UserCog className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Função atualizada</p>
                      <p className="text-xs text-muted-foreground">Permissões do Operador modificadas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="query" className="m-0">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md space-y-5">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Consulta OMS</h2>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
