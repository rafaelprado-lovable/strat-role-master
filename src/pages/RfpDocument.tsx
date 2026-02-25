import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Activity,
  Bell,
  Phone,
  GitBranch,
  Server,
  BarChart3,
  Eye,
  Clock,
  Target,
  Users,
  Lock,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  Layers,
  Database,
  Globe,
  Cpu,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import engLogo from "@/assets/eng-logo.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import screenshotK8s from "@/assets/screenshot-k8s.png";
import screenshotChanges from "@/assets/screenshot-changes.png";

const modules = [
  {
    icon: Activity,
    title: "Dashboard Operacional",
    description:
      "Painel centralizado com visão 360° de todas as operações, KPIs em tempo real, gráficos de tendência e indicadores de saúde do ambiente.",
    features: [
      "KPIs customizáveis em tempo real",
      "Gráficos de tendência e históricos",
      "Indicadores de saúde por serviço",
      "Filtros por organização e departamento",
      "Atualização automática dos dados",
    ],
    image: screenshotDashboard,
  },
  {
    icon: Bell,
    title: "Gestão de Incidentes",
    description:
      "Módulo completo de registro, acompanhamento e resolução de incidentes com workflows de escalation inteligente e rastreamento de SLA.",
    features: [
      "Registro e categorização de incidentes",
      "Escalation automático por SLA",
      "Rastreamento de tempo por departamento",
      "Integração com ServiceNow",
      "Análise de causa raiz",
      "Abertura de Bug com rich text editor",
      "Histórico completo de tramitação",
    ],
  },
  {
    icon: Phone,
    title: "Resolução de Chamados",
    description:
      "Sistema de resolução automatizada de chamados com regras de tratamento configuráveis, aprovação gerencial e templates de resolução.",
    features: [
      "Regras de tratamento por descrição",
      "Templates de resolução pré-definidos",
      "Fluxo de aprovação gerencial",
      "Classificação por plataforma e causa",
      "Notas de resolução padronizadas",
    ],
  },
  {
    icon: GitBranch,
    title: "Gestão de Mudanças (Pré-Change)",
    description:
      "Controle completo do ciclo pré-mudança com validação de testes, checklist de aprovação, timeline de aprovadores e análise de risco.",
    features: [
      "Validação de testes (FQA, UAT, System Test)",
      "Checklist de aprovação configurable",
      "Timeline de aprovadores com status",
      "Aprovações pendentes com cobrança automática",
      "Análise de impacto e risco",
      "Histórico de comentários e work notes",
    ],
  },
  {
    icon: GitBranch,
    title: "Mudanças em Execução",
    description:
      "Monitoramento em tempo real de mudanças sendo executadas com controle de tasks, fechamento parcial e acompanhamento de progresso.",
    features: [
      "Monitoramento em tempo real",
      "Controle de tasks por cluster",
      "Fechamento parcial de tasks",
      "Pipeline blocking e rollback",
      "Notificações de progresso",
    ],
  },
  {
    icon: GitBranch,
    title: "Execução de Changes",
    description:
      "Orquestração step-by-step de mudanças em clusters com validação de pipelines, sanity check integrado e controle de rollback.",
    features: [
      "Execução step-by-step por cluster",
      "Validação de pipeline CI/CD",
      "Sanity check pré e pós mudança",
      "Controle de rollback automatizado",
      "Terminal SSE em tempo real",
    ],
  },
  {
    icon: BarChart3,
    title: "Pós-Change",
    description:
      "Análise pós-mudança com comparação de métricas de serviço antes/depois, timeline de HTTP codes e avaliação de sucesso.",
    features: [
      "Comparação de métricas antes/depois",
      "Timeline de HTTP codes por serviço",
      "Taxa de sucesso da mudança",
      "Relatórios exportáveis",
      "Histórico de mudanças anteriores",
    ],
  },
  {
    icon: Server,
    title: "Observabilidade Kubernetes",
    description:
      "Monitoramento completo de clusters K8s com métricas de nodes, pods, deployments, serviços e alertas proativos.",
    features: [
      "Monitoramento de nodes e pods",
      "Métricas de CPU, memória e disco",
      "Status de deployments e réplicas",
      "Alertas proativos configuráveis",
      "Visualização de logs de containers",
    ],
    image: screenshotK8s,
  },
  {
    icon: Eye,
    title: "Sanity Check",
    description:
      "Verificações automatizadas de saúde do ambiente antes e depois de mudanças críticas, garantindo a integridade dos serviços.",
    features: [
      "Verificações pré e pós mudança",
      "Validação de endpoints e APIs",
      "Checklist automatizado de saúde",
      "Comparação de estado do ambiente",
      "Relatórios de conformidade",
    ],
  },
  {
    icon: BarChart3,
    title: "Análises & Relatórios",
    description:
      "Módulo de análises avançadas com relatórios detalhados, exportação em múltiplos formatos e dashboards customizáveis por perfil.",
    features: [
      "Relatórios detalhados por período",
      "Exportação em PDF e PowerPoint",
      "Dashboards customizáveis",
      "Métricas de desempenho por equipe",
      "Análise de tendências",
    ],
  },
  {
    icon: Clock,
    title: "Gestão de Plantões",
    description:
      "Gerenciamento completo de escalas de plantão com controle de turnos, notificação automática e histórico de cobertura.",
    features: [
      "Cadastro de escalas por departamento",
      "Controle de turnos e horários",
      "Notificação automática de plantonistas",
      "Histórico de cobertura",
      "Integração com telefonia",
    ],
  },
  {
    icon: Target,
    title: "Swap de Alarmes",
    description:
      "Gestão da troca de alarmes entre equipes com rastreabilidade completa, validação de handoff e auditoria de transferências.",
    features: [
      "Transferência controlada de alarmes",
      "Rastreabilidade completa",
      "Validação de handoff",
      "Auditoria de transferências",
      "Notificações em tempo real",
    ],
  },
];

const adminModules = [
  {
    icon: Users,
    title: "Gestão de Usuários",
    features: ["CRUD completo de usuários", "Vinculação a departamentos", "Atribuição de funções e permissões"],
  },
  {
    icon: Lock,
    title: "Controle de Acesso (RBAC)",
    features: ["Funções (roles) configuráveis", "Permissões granulares por ação", "Escopos de acesso por módulo"],
  },
  {
    icon: Layers,
    title: "Organizações & Departamentos",
    features: ["Multi-organização", "Hierarquia de departamentos", "Gestores e coordenadores por área"],
  },
];

const techSpecs = [
  { icon: Globe, title: "Frontend", items: ["React 18 + TypeScript", "Tailwind CSS + shadcn/ui", "React Router v6", "React Query", "Recharts", "Framer Motion"] },
  { icon: Database, title: "Backend & Integrações", items: ["API REST", "Integração ServiceNow", "Integração Kubernetes API", "SSE (Server-Sent Events)", "Autenticação JWT"] },
  { icon: Cpu, title: "Infraestrutura", items: ["Deploy em containers", "Escalabilidade horizontal", "Alta disponibilidade", "Monitoramento integrado", "Backup automático"] },
  { icon: Shield, title: "Segurança", items: ["RBAC granular", "Autenticação segura", "Auditoria completa", "Criptografia em trânsito", "Controle de sessão"] },
];

export default function RfpDocument() {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-16 print:py-4 print:space-y-8">
        {/* ── Cover ── */}
        <div className="text-center space-y-6 py-12 print:py-4">
          <img src={engLogo} alt="Eng Logo" className="h-16 mx-auto" />
          <div className="space-y-3">
            <Badge variant="outline" className="text-sm px-4 py-1">Documento RFP</Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent print:text-foreground">
                Heimdall
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma Inteligente de Gestão de Operações de TI
            </p>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-sm text-muted-foreground">
            <div><p className="font-semibold text-foreground">Versão</p><p>2.0</p></div>
            <div><p className="font-semibold text-foreground">Data</p><p>{new Date().toLocaleDateString("pt-BR")}</p></div>
            <div><p className="font-semibold text-foreground">Classificação</p><p>Confidencial</p></div>
          </div>
        </div>

        {/* ── TOC ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Índice</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              {["Visão Geral da Solução", "Objetivos", "Módulos Funcionais", "Módulos Administrativos", "Especificações Técnicas", "Requisitos Não Funcionais", "Diferenciais Competitivos", "Escopo de Implantação"].map((t, i) => (
                <li key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                  <a href={`#section-${i + 1}`} className="ml-1">{t}</a>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* ── 1. Visão Geral ── */}
        <section id="section-1" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
            Visão Geral da Solução
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              O <strong className="text-foreground">Heimdall</strong> é uma plataforma unificada de gestão de operações de TI projetada para centralizar e otimizar processos de gerenciamento de incidentes, mudanças, observabilidade de infraestrutura e operações do dia a dia em um único ambiente integrado.
            </p>
            <p>
              A solução atende equipes de operações, engenharia e gestão de TI, proporcionando visibilidade completa sobre o ciclo de vida operacional — desde a detecção de incidentes até a análise pós-mudança — reduzindo o MTTR (Mean Time To Resolve) em até 60% e aumentando a taxa de sucesso de mudanças para mais de 99%.
            </p>
            <p>
              Com arquitetura modular e extensível, o Heimdall integra-se nativamente com ferramentas de mercado como ServiceNow, Kubernetes e pipelines CI/CD, oferecendo uma experiência unificada sem necessidade de alternar entre múltiplas ferramentas.
            </p>
          </div>
        </section>

        <Separator />

        {/* ── 2. Objetivos ── */}
        <section id="section-2" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
            Objetivos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Centralizar a gestão de incidentes, mudanças e operações em uma única plataforma",
              "Reduzir o MTTR e aumentar a eficiência operacional das equipes",
              "Prover visibilidade end-to-end do ciclo de vida operacional",
              "Garantir rastreabilidade e auditoria completa de todas as ações",
              "Automatizar processos recorrentes e eliminar tarefas manuais",
              "Integrar observabilidade de infraestrutura K8s nativamente",
              "Implementar controle de acesso granular (RBAC) por organização",
              "Fornecer análises e relatórios para tomada de decisão baseada em dados",
            ].map((obj, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{obj}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── 3. Módulos Funcionais ── */}
        <section id="section-3" className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">3</span>
            Módulos Funcionais
          </h2>
          <p className="text-muted-foreground">
            O Heimdall conta com <strong className="text-foreground">12 módulos funcionais</strong> integrados que cobrem todo o ciclo operacional:
          </p>

          <div className="space-y-6">
            {modules.map((mod, idx) => (
              <Card key={mod.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <mod.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span>3.{idx + 1} — {mod.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                  <div>
                    <p className="text-sm font-semibold mb-2">Funcionalidades:</p>
                    <ul className="grid md:grid-cols-2 gap-1.5">
                      {mod.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {mod.image && (
                    <div className="mt-4 print:hidden">
                      <img src={mod.image} alt={mod.title} className="rounded-lg border border-border shadow-md w-full max-h-80 object-cover" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── 4. Módulos Administrativos ── */}
        <section id="section-4" className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">4</span>
            Módulos Administrativos
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {adminModules.map((mod) => (
              <Card key={mod.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <mod.icon className="w-5 h-5 text-primary" />
                    {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {mod.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── 5. Especificações Técnicas ── */}
        <section id="section-5" className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">5</span>
            Especificações Técnicas
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {techSpecs.map((spec) => (
              <Card key={spec.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <spec.icon className="w-5 h-5 text-primary" />
                    {spec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {spec.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── 6. Requisitos Não Funcionais ── */}
        <section id="section-6" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">6</span>
            Requisitos Não Funcionais
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold">Requisito</th>
                  <th className="text-left p-3 font-semibold">Especificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Disponibilidade", "99.9% de uptime garantido"],
                  ["Performance", "Tempo de resposta < 2s para operações padrão"],
                  ["Escalabilidade", "Suporte a crescimento horizontal sem downtime"],
                  ["Compatibilidade", "Navegadores modernos (Chrome, Firefox, Edge, Safari)"],
                  ["Responsividade", "Interface adaptável para desktop e tablet"],
                  ["Internacionalização", "Interface em Português (BR)"],
                  ["Auditoria", "Log completo de ações com timestamp e usuário"],
                  ["Backup", "Backup automático diário com retenção de 30 dias"],
                  ["SLA de Suporte", "Atendimento em horário comercial com escalonamento"],
                ].map(([req, spec]) => (
                  <tr key={req} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{req}</td>
                    <td className="p-3 text-muted-foreground">{spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Separator />

        {/* ── 7. Diferenciais ── */}
        <section id="section-7" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">7</span>
            Diferenciais Competitivos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Plataforma Unificada", desc: "Todos os módulos operacionais integrados em uma única interface, eliminando a necessidade de múltiplas ferramentas." },
              { title: "Observabilidade Nativa K8s", desc: "Monitoramento de clusters Kubernetes integrado nativamente, sem necessidade de ferramentas externas." },
              { title: "Ciclo Completo de Mudanças", desc: "Cobertura end-to-end: pré-análise, execução em tempo real e pós-change com métricas comparativas." },
              { title: "RBAC Granular", desc: "Controle de acesso por organização, departamento, função e escopo com auditoria completa." },
              { title: "Integração ServiceNow", desc: "Integração nativa com ServiceNow para sincronização de incidentes e mudanças." },
              { title: "Rich Text em Bug Reports", desc: "Editor de texto formatado para abertura de bugs com suporte a negrito, grifo, blocos de código e listas." },
            ].map((d) => (
              <div key={d.title} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{d.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── 8. Escopo de Implantação ── */}
        <section id="section-8" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">8</span>
            Escopo de Implantação
          </h2>
          <div className="space-y-4">
            {[
              { phase: "Fase 1 — Setup Inicial", duration: "2 semanas", items: ["Configuração da infraestrutura", "Cadastro de organizações e departamentos", "Configuração de usuários e permissões", "Integração com ServiceNow"] },
              { phase: "Fase 2 — Módulos Core", duration: "4 semanas", items: ["Ativação do Dashboard Operacional", "Configuração da Gestão de Incidentes", "Implementação da Gestão de Mudanças (Pré, Execução, Pós)", "Configuração de Resolução de Chamados"] },
              { phase: "Fase 3 — Observabilidade", duration: "2 semanas", items: ["Integração com clusters Kubernetes", "Configuração do Sanity Check", "Setup de alertas e monitoramento"] },
              { phase: "Fase 4 — Operações", duration: "2 semanas", items: ["Configuração de Plantões", "Setup de Swap de Alarmes", "Treinamento das equipes", "Go-live e acompanhamento"] },
            ].map((phase) => (
              <Card key={phase.phase}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{phase.phase}</span>
                    <Badge variant="outline">{phase.duration}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Prazo total estimado:</strong> 10 semanas para implantação completa, incluindo treinamento e acompanhamento pós go-live.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="text-center py-8 space-y-4 print:py-4">
          <Separator />
          <img src={engLogo} alt="Eng Logo" className="h-10 mx-auto opacity-50" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Eng Corporation — Documento confidencial. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
