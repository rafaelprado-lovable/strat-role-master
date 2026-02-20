import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Users,
  Lock,
  BarChart3,
  Zap,
  Server,
  Bell,
  GitBranch,
  Activity,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Phone,
  Clock,
  Target,
  Layers,
  Eye,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import engLogo from "@/assets/eng-logo.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import screenshotK8s from "@/assets/screenshot-k8s.png";
import screenshotChanges from "@/assets/screenshot-changes.png";
import screenshotAutomations from "@/assets/screenshot-automations.png";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ─── Motion helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</div>;
}

/* ─── Feature data ─── */
const features = [
  {
    icon: Activity,
    title: "Dashboard Operacional",
    description: "Visão centralizada de todos os indicadores críticos com gráficos em tempo real e KPIs personalizáveis.",
  },
  {
    icon: Bell,
    title: "Gestão de Incidentes",
    description: "Registre, acompanhe e resolva incidentes com workflows automatizados e escalation inteligente.",
  },
  {
    icon: Phone,
    title: "Resolução de Chamados",
    description: "Sistema completo de atendimento com rastreamento de SLA, priorização automática e histórico detalhado.",
  },
  {
    icon: GitBranch,
    title: "Gestão de Mudanças",
    description: "Controle pré, durante e pós-mudança com aprovações, checklists e rollback automatizado.",
  },
  {
    icon: Workflow,
    title: "Automações Inteligentes",
    description: "Crie fluxos de automação visuais com editor drag-and-drop, triggers e condições customizáveis.",
  },
  {
    icon: Server,
    title: "Observabilidade K8s",
    description: "Monitore clusters Kubernetes com métricas de nodes, pods, deployments e alertas em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Análises & Relatórios",
    description: "Relatórios detalhados com exportação em múltiplos formatos e dashboards customizáveis.",
  },
  {
    icon: Eye,
    title: "Sanity Check",
    description: "Verificações automatizadas de saúde do ambiente antes e depois de mudanças críticas.",
  },
  {
    icon: Clock,
    title: "Gestão de Plantões",
    description: "Escale plantonistas, gerencie turnos e notifique automaticamente a equipe responsável.",
  },
  {
    icon: Target,
    title: "Swap de Alarmes",
    description: "Gerencie a troca de alarmes entre equipes com rastreabilidade completa e auditoria.",
  },
  {
    icon: Users,
    title: "Gestão de Usuários",
    description: "Controle completo de usuários, funções, departamentos e permissões granulares por escopo.",
  },
  {
    icon: Lock,
    title: "Segurança & RBAC",
    description: "Controle de acesso baseado em funções com permissões granulares e auditoria completa.",
  },
];

const steps = [
  {
    number: "01",
    title: "Configure sua Organização",
    description: "Cadastre sua empresa, departamentos e estruture as equipes com permissões adequadas.",
  },
  {
    number: "02",
    title: "Integre seus Sistemas",
    description: "Conecte suas ferramentas existentes, clusters K8s e fontes de dados em minutos.",
  },
  {
    number: "03",
    title: "Automatize Processos",
    description: "Crie fluxos de automação para incidentes, mudanças e operações recorrentes.",
  },
  {
    number: "04",
    title: "Monitore & Otimize",
    description: "Acompanhe métricas em tempo real e otimize seus processos continuamente.",
  },
];

const productScreenshots = [
  {
    image: screenshotDashboard,
    title: "Dashboard Operacional",
    description: "Visão centralizada com KPIs em tempo real, gráficos de tendências e indicadores de saúde.",
  },
  {
    image: screenshotK8s,
    title: "Observabilidade Kubernetes",
    description: "Monitore clusters, nodes, pods e deployments com métricas detalhadas e alertas proativos.",
  },
  {
    image: screenshotChanges,
    title: "Gestão de Mudanças",
    description: "Controle pré, durante e pós-mudança com aprovações, checklists e avaliação de risco.",
  },
  {
    image: screenshotAutomations,
    title: "Automações Visuais",
    description: "Editor drag-and-drop para criar fluxos de automação com triggers e condições customizáveis.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={engLogo} alt="Eng Logo" className="h-12" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#screenshots" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Módulos</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/">
              <Button>
                Acessar Sistema
                <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10">
          <motion.div className="max-w-5xl mx-auto text-center space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              <Shield className="w-4 h-4" />
              Plataforma de Operações Inteligente
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="text-foreground">Controle Total.</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Operações Inteligentes.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              O Heimdall unifica gestão de incidentes, mudanças, automações e observabilidade K8s em uma única plataforma — reduzindo custos operacionais e acelerando a resolução de problemas.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/">
                <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-xl border-2">
                Agendar Demonstração
              </Button>
            </motion.div>

            <motion.p variants={fadeIn} className="text-sm text-muted-foreground">
              ✓ Setup em minutos &nbsp;&nbsp; ✓ Sem cartão de crédito &nbsp;&nbsp; ✓ Suporte dedicado
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <motion.section className="border-y border-border bg-card/50" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 60, suffix: "%", label: "Redução no MTTR" },
              { value: 12, suffix: "+", label: "Módulos Integrados" },
              { value: 99, suffix: ".9%", label: "Uptime Garantido" },
              { value: 10000, suffix: "+", label: "Incidentes Resolvidos/mês" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-extrabold text-primary">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center space-y-4 mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
              <Layers className="w-4 h-4" />
              Recursos Completos
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Tudo que você precisa em uma{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                única plataforma
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              12 módulos integrados para cobrir todo o ciclo de operações da sua empresa
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}>
            {features.map((feature) => (
              <motion.div key={feature.title} variants={scaleUp}>
                <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="bg-muted/40">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div className="text-center space-y-4 mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <Zap className="w-4 h-4" />
                Simples de Começar
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">Como Funciona</h2>
              <p className="text-muted-foreground text-lg">
                Em 4 passos você estará operando com total controle
              </p>
            </motion.div>

            <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}>
              {steps.map((step, idx) => (
                <motion.div key={step.number} variants={fadeUp} className="relative">
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-primary/30 z-0" />
                  )}
                  <div className="relative z-10 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-extrabold shadow-lg shadow-primary/20">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Benefits / Why Heimdall ── */}
      <section id="benefits" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div className="space-y-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Vantagens Competitivas
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold leading-tight">
                Por que escolher o{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Heimdall?
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
                Simplifique operações complexas com uma plataforma que integra tudo que sua equipe precisa.
              </motion.p>

              <div className="space-y-6">
                {[
                  { title: "Visão 360° das Operações", desc: "Dashboard unificado com todos os indicadores críticos em tempo real" },
                  { title: "Automação End-to-End", desc: "Elimine tarefas manuais com workflows inteligentes e triggers automáticos" },
                  { title: "Observabilidade Nativa", desc: "Monitoramento de infraestrutura K8s integrado com alertas proativos" },
                  { title: "RBAC Granular", desc: "Controle de acesso por escopo, função e departamento com auditoria completa" },
                  { title: "Escalável e Resiliente", desc: "Arquitetura preparada para crescer junto com sua operação" },
                ].map((benefit) => (
                  <motion.div key={benefit.title} variants={fadeUp} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{benefit.title}</h4>
                      <p className="text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="relative" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={scaleUp}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl bg-card border border-border p-8 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-chart-4" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
                {[
                  { label: "Incidentes Resolvidos", value: "98.5%", color: "bg-primary" },
                  { label: "Mudanças com Sucesso", value: "99.2%", color: "bg-chart-5" },
                  { label: "SLA Cumprido", value: "99.8%", color: "bg-accent" },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-bold text-foreground">{metric.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${metric.color}`}
                        style={{ width: metric.value }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-extrabold text-primary">24/7</div>
                    <div className="text-xs text-muted-foreground">Monitoramento</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-accent">&lt;5min</div>
                    <div className="text-xs text-muted-foreground">MTTR Médio</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-chart-5">Zero</div>
                    <div className="text-xs text-muted-foreground">Downtime</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <section id="screenshots" className="bg-muted/40">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div className="text-center space-y-4 mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <Monitor className="w-4 h-4" />
                Veja na Prática
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">
                Conheça os{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  módulos do Heimdall
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Interfaces intuitivas projetadas para máxima produtividade operacional
              </p>
            </motion.div>

            <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}>
              {productScreenshots.map((item, idx) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className={`flex flex-col ${idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}
                >
                  <div className="md:w-2/3 relative group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img
                      src={item.image}
                      alt={item.title}
                      className="relative rounded-xl border border-border shadow-2xl w-full hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="md:w-1/3 space-y-4">
                    <h3 className="text-2xl md:text-3xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                      Explorar módulo <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <motion.div className="max-w-4xl mx-auto text-center space-y-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold">
              Pronto para transformar suas operações?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Comece a operar com total controle e visibilidade em minutos
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/">
                <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-lg shadow-primary/25">
                  Começar Agora — É Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-xl border-2">
                Falar com Especialista
              </Button>
            </motion.div>
            <motion.p variants={fadeIn} className="text-sm text-muted-foreground">
              Setup em 5 minutos • Sem cartão • Cancele quando quiser
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <img src={engLogo} alt="Eng Logo" className="h-10" />
              <p className="text-sm text-muted-foreground">
                Plataforma inteligente de gestão de operações para empresas que não param.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#screenshots" className="hover:text-foreground transition-colors">Módulos</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Como Funciona</a></li>
                <li><a href="#benefits" className="hover:text-foreground transition-colors">Benefícios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Módulos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Incidentes</li>
                <li>Mudanças</li>
                <li>Automações</li>
                <li>Observabilidade K8s</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sobre nós</li>
                <li>Contato</li>
                <li>Política de Privacidade</li>
                <li>Termos de Uso</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Eng Corporation. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Feito com ❤️ para equipes de operações
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
