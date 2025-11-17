import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Lock,
  Sparkles,
  Bug
} from "lucide-react";
import dashboardImg from "@/assets/dashboard-screenshot.png";
import loginImg from "@/assets/login-screenshot.png";
import bugReportImg from "@/assets/bug-report-screenshot.png";
import BugReportDialog from "@/components/BugReportDialog";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Heimdall</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              Como Funciona
            </a>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <Badge variant="secondary" className="w-fit">
              <Sparkles className="h-3 w-3 mr-1" />
              Solução Completa para Gerenciamento de Incidentes
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Gerencie Incidentes com{" "}
              <span className="text-primary">Inteligência</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Heimdall é a plataforma definitiva para gestão de incidentes, bugs e chamados. 
              Centralize, analise e resolva problemas 3x mais rápido.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto group">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Agendar Demo
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">98%</span>
                <span className="text-sm text-muted-foreground">Satisfação</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">3x</span>
                <span className="text-sm text-muted-foreground">Mais Rápido</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">24/7</span>
                <span className="text-sm text-muted-foreground">Monitoramento</span>
              </div>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-4 bg-primary/20 rounded-lg blur-3xl"></div>
            <img 
              src={dashboardImg} 
              alt="Dashboard Heimdall" 
              className="relative rounded-lg shadow-2xl border border-border"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16 border-y bg-muted/50">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">10k+</div>
            <div className="text-sm text-muted-foreground">Incidentes Resolvidos</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">500+</div>
            <div className="text-sm text-muted-foreground">Empresas Confiam</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">0.33h</div>
            <div className="text-sm text-muted-foreground">Tempo Médio SLA</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 md:py-32">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mx-auto w-fit">Recursos</Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para equipes de alta performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Dashboard Inteligente</CardTitle>
              <CardDescription>
                Visualize métricas em tempo real, KPIs e tendências de incidentes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Automação Total</CardTitle>
              <CardDescription>
                Roteamento automático, notificações e escalonamento inteligente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gestão de Equipes</CardTitle>
              <CardDescription>
                Organize departamentos, roles e permissões com facilidade
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>SLA Garantido</CardTitle>
              <CardDescription>
                Monitoramento de SLA com alertas e relatórios detalhados
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Lock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Segurança Enterprise</CardTitle>
              <CardDescription>
                Criptografia ponta-a-ponta e conformidade com LGPD
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Insights Avançados</CardTitle>
              <CardDescription>
                IA para análise preditiva e recomendações inteligentes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="container py-20 md:py-32 bg-muted/50">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mx-auto w-fit">Como Funciona</Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Simples, rápido e eficiente
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Acesse a Plataforma</h3>
                <p className="text-muted-foreground">
                  Login seguro com autenticação de dois fatores e interface intuitiva
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Configure sua Estrutura</h3>
                <p className="text-muted-foreground">
                  Defina departamentos, usuários, permissões e fluxos de trabalho
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Comece a Gerenciar</h3>
                <p className="text-muted-foreground">
                  Registre, acompanhe e resolva incidentes com eficiência máxima
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src={loginImg} 
              alt="Login Heimdall" 
              className="rounded-lg shadow-2xl border border-border"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <img 
              src={bugReportImg} 
              alt="Abertura de Bug" 
              className="rounded-lg shadow-2xl border border-border"
            />
          </div>
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">Abertura de Bugs Padronizada</h3>
            <p className="text-lg text-muted-foreground">
              Sistema completo seguindo as melhores práticas do ServiceNow
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Formulários padronizados com todos os campos necessários</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Integração direta com Azure DevOps e ServiceNow</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Logs, TID e contexto automático para análise</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                <span>Fluxo de validação e aprovação configurável</span>
              </li>
            </ul>
            <BugReportDialog 
              trigger={
                <Button size="lg" className="mt-4">
                  <Bug className="mr-2 h-5 w-5" />
                  Criar Bug
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container py-20 md:py-32">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mx-auto w-fit">Benefícios</Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Por que escolher Heimdall?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Redução de Custos
              </CardTitle>
              <CardDescription>
                Economize até 40% em custos operacionais com automação inteligente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Aumento de Produtividade
              </CardTitle>
              <CardDescription>
                Sua equipe resolve 3x mais incidentes no mesmo período
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Conformidade Total
              </CardTitle>
              <CardDescription>
                Atende todos os requisitos de compliance e auditoria
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Visibilidade 360°
              </CardTitle>
              <CardDescription>
                Acompanhe cada detalhe do ciclo de vida dos incidentes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Pronto para transformar sua gestão de incidentes?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Junte-se a centenas de empresas que já confiam no Heimdall
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Gratuitamente
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Falar com Vendas
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sem cartão de crédito • Setup em 5 minutos • Suporte 24/7
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Heimdall</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A solução definitiva para gerenciamento de incidentes
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Heimdall by Eng Corporation. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
