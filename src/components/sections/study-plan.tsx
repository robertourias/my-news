"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Clock, Target, X } from "lucide-react";
import { Section } from "../section";
import { cn } from "@/lib/utils";

type PlanKind = "dev-ai" | "languages";

interface StudyPlanSectionProps {
  id: string;
  emoji: string;
  label: string;
  accent: string;
  plan: PlanKind;
}

interface ThemeItem {
  icon: string;
  name: string;
  sub: string;
  days?: string;
  deadline?: string;
  color: string;
  soft: string;
}

interface DayBlock {
  type: string;
  label: string;
  time: string;
  activity: string;
  icon: string;
}

interface WeekdayPlan {
  day: string;
  label: string;
  tone: string;
  toneLabel: string;
  blocks: DayBlock[];
  tip?: {
    title: string;
    text: ReactNode;
    color: string;
    soft: string;
  };
}

interface PhasePlan {
  id: string;
  label: string;
  period: string;
  goal: string;
  level?: string;
  color: string;
  soft: string;
  objectives: string[];
  milestone: string;
}

interface TipGroup {
  icon: string;
  category: string;
  color: string;
  items: ReactNode[];
}

const devItems: ThemeItem[] = [
  { icon: "🎓", name: "Pós — IA Aplicada", sub: "Pós Unipds", deadline: "Março 2027", color: "#7c3aed", soft: "#f5f3ff" },
  { icon: "🚀", name: "Rocketseat", sub: "Trilha ativa", deadline: "Contínuo", color: "#e11d48", soft: "#fff1f2" },
  { icon: "💻", name: "Curso.dev", sub: "Módulo do dia", deadline: "Dez 2026", color: "#0ea5e9", soft: "#f0f9ff" },
  { icon: "📺", name: "Conteúdo técnico", sub: "Vídeos e leituras", deadline: "Hábito", color: "#059669", soft: "#ecfdf5" },
  { icon: "🧩", name: "Testes Técnicos", sub: "frontend-enterview-prep", deadline: "Seg–Sex", color: "#d97706", soft: "#fffbeb" },
];

const devTechTip = {
  title: "🧩 Testes técnicos",
  text: (
    <>
      Repositório:{" "}
      <a
        href="https://github.com/robertourias/frontend-enterview-prep"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#d97706] hover:underline font-medium"
      >
        frontend-enterview-prep
      </a>{" "}
      — 1 exercício por dia, sem pular.
    </>
  ),
  color: "#d97706",
  soft: "#fffbeb",
};

const devDays: WeekdayPlan[] = [
  {
    day: "SEG", label: "Segunda", tone: "#7c3aed", toneLabel: "90 min", blocks: [
      { type: "pos", label: "Pós — IA Aplicada", time: "45 min", activity: "Pós Unipds — aula ou material da semana", icon: "🎓" },
      { type: "cursodev", label: "Curso.dev", time: "30 min", activity: "Curso.dev — módulo do dia", icon: "💻" },
      { type: "interview", label: "Testes Técnicos", time: "15 min", activity: "frontend-enterview-prep — 1 exercício", icon: "🧩" },
    ], tip: devTechTip
  },
  {
    day: "TER", label: "Terça", tone: "#e11d48", toneLabel: "90 min", blocks: [
      { type: "pos", label: "Pós — IA Aplicada", time: "45 min", activity: "Pós Unipds — continuação da aula", icon: "🎓" },
      { type: "rocket", label: "Rocketseat", time: "30 min", activity: "Rocketseat — trilha ativa", icon: "🚀" },
      { type: "interview", label: "Testes Técnicos", time: "15 min", activity: "frontend-enterview-prep — 1 exercício", icon: "🧩" },
    ], tip: devTechTip
  },
  {
    day: "QUA", label: "Quarta", tone: "#0ea5e9", toneLabel: "90 min", blocks: [
      { type: "pos", label: "Pós — IA Aplicada", time: "45 min", activity: "Pós Unipds — exercícios ou revisão", icon: "🎓" },
      { type: "cursodev", label: "Curso.dev", time: "30 min", activity: "Curso.dev — módulo do dia", icon: "💻" },
      { type: "interview", label: "Testes Técnicos", time: "15 min", activity: "frontend-enterview-prep — 1 exercício", icon: "🧩" },
    ], tip: devTechTip
  },
  {
    day: "QUI", label: "Quinta", tone: "#e11d48", toneLabel: "90 min", blocks: [
      { type: "pos", label: "Pós — IA Aplicada", time: "45 min", activity: "Pós Unipds — nova aula ou leitura", icon: "🎓" },
      { type: "rocket", label: "Rocketseat", time: "30 min", activity: "Rocketseat — trilha ativa", icon: "🚀" },
      { type: "interview", label: "Testes Técnicos", time: "15 min", activity: "frontend-enterview-prep — 1 exercício", icon: "🧩" },
    ], tip: devTechTip
  },
  {
    day: "SEX", label: "Sexta", tone: "#0ea5e9", toneLabel: "90 min", blocks: [
      { type: "pos", label: "Pós — IA Aplicada", time: "45 min", activity: "Pós Unipds — revisão semanal", icon: "🎓" },
      { type: "cursodev", label: "Curso.dev", time: "30 min", activity: "Curso.dev — consolidação da semana", icon: "💻" },
      { type: "interview", label: "Testes Técnicos", time: "15 min", activity: "frontend-enterview-prep — 1 exercício", icon: "🧩" },
    ], tip: devTechTip
  },
  {
    day: "SAB", label: "Sábado", tone: "#059669", toneLabel: "90 min", blocks: [
      { type: "rocket", label: "Rocketseat", time: "30 min", activity: "Rocketseat — trilha ou projeto prático", icon: "🚀" },
      { type: "content", label: "Conteúdo técnico", time: "60 min", activity: "Vídeos técnicos — YouTube / conferências", icon: "📺" },
    ], tip: { title: "Sábado = margem de manobra", text: "Se perdeu sessão na semana, use o sábado para repor. Também é um bom bloco para projetos práticos.", color: "#d97706", soft: "#fffbeb" }
  },
  {
    day: "DOM", label: "Domingo", tone: "#64748b", toneLabel: "60 min", blocks: [
      { type: "content", label: "Conteúdo técnico", time: "60 min", activity: "Conteúdo da área — leitura leve ou vídeo", icon: "📺" },
    ], tip: { title: "Domingo = consumo leve", text: "Apenas vídeos ou leitura técnica leve. Sem pressão de completar módulos.", color: "#059669", soft: "#ecfdf5" }
  },
];

const devPhases: PhasePlan[] = [
  { id: "p1", label: "Fase 1", period: "Jul – Set 2026", color: "#7c3aed", soft: "#f5f3ff", goal: "Estabelecer ritmo e base sólida", objectives: ["Concluir os primeiros módulos da pós: fundamentos de IA + ES", "Avançar 40% do Curso.dev com foco nos fundamentos", "Completar 1 trilha Rocketseat, como Node.js ou React", "Praticar testes técnicos 15 min/dia com algoritmos básicos", "Criar workspace de estudos no Notion com registro semanal"], milestone: "Curso.dev 40% + 1 trilha Rocketseat finalizada" },
  { id: "p2", label: "Fase 2", period: "Out – Dez 2026", color: "#0ea5e9", soft: "#f0f9ff", goal: "Concluir Curso.dev e aprofundar pós", objectives: ["Atingir 50% da carga total da pós-graduação", "Concluir 100% do Curso.dev até 31/12/2026", "Iniciar nova trilha Rocketseat, como FullStack ou DevOps", "Avançar para desafios intermediários no repo de testes", "Revisão trimestral no Notion: o que aprendeu e o que aplicou"], milestone: "Curso.dev 100% concluído — certificado gerado" },
  { id: "p3", label: "Fase 3", period: "Jan – Jun 2027", color: "#059669", soft: "#ecfdf5", goal: "Acelerar pós e consolidar Rocketseat", objectives: ["Atingir 75% da pós em módulos de IA avançada e projetos", "Completar 2 trilhas Rocketseat no semestre", "Resolver desafios avançados e simular entrevistas com IA", "Produzir ao menos 1 projeto de portfólio com IA", "Checar alinhamento com o prazo de março/2027"], milestone: "Pós 75% + projeto de portfólio com IA publicado" },
  { id: "p4", label: "Fase 4", period: "Jul – Mar 2027", color: "#d97706", soft: "#fffbeb", goal: "Conclusão da pós e consolidação final", objectives: ["Concluir 100% da pós até março/2027: TCC ou projeto final", "Manter consistência Rocketseat: 1 trilha por trimestre", "Fazer revisão completa do repo de testes técnicos", "Organizar portfólio completo com todos os projetos do período", "Mapear próximos passos de carreira em uma retrospectiva geral"], milestone: "Certificado de Pós-Graduação em mãos — março/2027" },
];

const devTips: TipGroup[] = [
  { icon: "⏱", category: "Gestão de tempo", color: "#7c3aed", items: ["Use blocos Pomodoro para a pós: 25 + 5, depois mais 15 min de foco.", "Deixe Curso.dev e Rocketseat pausados exatamente onde parou.", "Os 15 min de testes técnicos são fixos: abra o repo, resolva 1 exercício, feche."] },
  { icon: "🔥", category: "Consistência", color: "#e11d48", items: ["Não tente recuperar dias perdidos acumulando. Volte à rotina normal no dia seguinte.", "Se tiver menos de 30 min, faça só os 15 min de testes técnicos.", "Sábado é a margem para repor qualquer sessão perdida na semana."] },
  { icon: "🛠", category: "Aplicação prática", color: "#0ea5e9", items: ["Aplique algo do Curso.dev ou Rocketseat nos seus projetos reais.", "A cada módulo da pós, identifique um caso real no seu trabalho.", "Crie um repositório privado só para experimentos dos cursos."] },
  { icon: "📝", category: "Notion como hub", color: "#059669", items: ["Registre curso, módulo, tempo gasto e 1 insight aplicável por semana.", "Mantenha um kanban simples: A fazer, Em curso, Concluído.", "Use milestones para marcar progresso real, não só tempo estudado."] },
];

const languageItems: ThemeItem[] = [
  { icon: "🦉", name: "Duolingo", sub: "Streak diária", days: "Seg–Sex", color: "#2563eb", soft: "#eff6ff" },
  { icon: "📖", name: "Mairo Vergara", sub: "Textos + ES sábado", days: "Seg–Sab", color: "#7c3aed", soft: "#f5f3ff" },
  { icon: "🎓", name: "Kiwify", sub: "Inglês de uma vez", days: "Seg–Sex", color: "#0ea5e9", soft: "#f0f9ff" },
  { icon: "🎸", name: "Músicas Rock", sub: "YouTube + letras", days: "Ter–Qui", color: "#e11d48", soft: "#fff1f2" },
  { icon: "🤖", name: "IA", sub: "Conversação prática", days: "Seg–Sex", color: "#059669", soft: "#ecfdf5" },
  { icon: "🇪🇸", name: "Espanhol", sub: "Duolingo + Mairo ES", days: "Sábado", color: "#dc2626", soft: "#fff1f2" },
];

const languageDays: WeekdayPlan[] = [
  {
    day: "SEG", label: "Segunda", tone: "#2563eb", toneLabel: "Inglês · 75min", blocks: [
      { type: "duolingo", label: "Duolingo", time: "20 min", activity: "Lições diárias — manter streak", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara", time: "20 min", activity: "Estudo de texto em inglês", icon: "📖" },
      { type: "kiwify", label: "Kiwify", time: "20 min", activity: "Inglês de uma vez — módulo do dia", icon: "🎓" },
      { type: "ai", label: "IA", time: "15 min", activity: "Conversa com IA — tema livre", icon: "🤖" },
    ]
  },
  {
    day: "TER", label: "Terça", tone: "#2563eb", toneLabel: "Inglês · 80min", blocks: [
      { type: "duolingo", label: "Duolingo", time: "20 min", activity: "Lições diárias — manter streak", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara", time: "20 min", activity: "Estudo de texto em inglês", icon: "📖" },
      { type: "music", label: "Música Rock", time: "30 min", activity: "Análise de letra de música rock", icon: "🎸" },
      { type: "notion", label: "Notion", time: "10 min", activity: "Registro no Notion", icon: "📝" },
    ]
  },
  {
    day: "QUA", label: "Quarta", tone: "#2563eb", toneLabel: "Inglês · 75min", blocks: [
      { type: "duolingo", label: "Duolingo", time: "20 min", activity: "Lições diárias — manter streak", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara", time: "20 min", activity: "Estudo de texto em inglês", icon: "📖" },
      { type: "kiwify", label: "Kiwify", time: "20 min", activity: "Inglês de uma vez — módulo do dia", icon: "🎓" },
      { type: "ai", label: "IA", time: "15 min", activity: "Role-play de situação real", icon: "🤖" },
    ]
  },
  {
    day: "QUI", label: "Quinta", tone: "#2563eb", toneLabel: "Inglês · 80min", blocks: [
      { type: "duolingo", label: "Duolingo", time: "20 min", activity: "Lições diárias — manter streak", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara", time: "20 min", activity: "Estudo de texto em inglês", icon: "📖" },
      { type: "music", label: "YouTube Rock", time: "30 min", activity: "Canal de rock em inglês — YouTube", icon: "🎬" },
      { type: "notion", label: "Notion", time: "10 min", activity: "Vocabulário novo no Notion", icon: "📝" },
    ]
  },
  {
    day: "SEX", label: "Sexta", tone: "#2563eb", toneLabel: "Inglês · 85min", blocks: [
      { type: "duolingo", label: "Duolingo", time: "20 min", activity: "Lições diárias — manter streak", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara", time: "20 min", activity: "Estudo de texto em inglês", icon: "📖" },
      { type: "notion", label: "Notion", time: "25 min", activity: "Revisão da semana no Notion", icon: "📝" },
      { type: "ai", label: "IA", time: "20 min", activity: "Conversa temática — música/cultura", icon: "🤖" },
    ]
  },
  {
    day: "SAB", label: "Sábado", tone: "#dc2626", toneLabel: "Espanhol · 100min", blocks: [
      { type: "duolingo", label: "Duolingo ES", time: "20 min", activity: "Duolingo — lições de espanhol", icon: "🦉" },
      { type: "mairo", label: "Mairo Vergara ES", time: "35 min", activity: "Estudo de textos em espanhol", icon: "📖" },
      { type: "ai", label: "IA", time: "20 min", activity: "Conversa em espanhol sobre o texto estudado", icon: "🤖" },
      { type: "music", label: "Série/Música ES", time: "15 min", activity: "Série ou música em espanhol", icon: "🎵" },
      { type: "notion", label: "Notion", time: "10 min", activity: "Vocabulário ES no Notion", icon: "📝" },
    ], tip: { title: "Dica do sábado", text: "Aproveite a proximidade do português. Use a IA para falar sobre o texto estudado.", color: "#dc2626", soft: "#fff1f2" }
  },
  {
    day: "DOM", label: "Domingo", tone: "#6b7280", toneLabel: "Livre", blocks: [
      { type: "rest", label: "Descanso", time: "livre", activity: "Consumo passivo — podcast ou música em inglês", icon: "☁️" },
    ], tip: { title: "Domingo livre", text: "Consumo passivo apenas. Um podcast em inglês enquanto caminha já conta.", color: "#6b7280", soft: "#f3f4f6" }
  },
];

const languagePhases: PhasePlan[] = [
  { id: "q1", label: "Q1", period: "Meses 1–3", level: "Foundation", color: "#2563eb", soft: "#eff6ff", goal: "Construir base sólida e hábito diário", objectives: ["Completar 60 lições no Duolingo com streak diária", "Terminar o módulo básico do Mairo Vergara e iniciar Kiwify", "Memorizar 300 palavras no contexto de músicas rock", "Conseguir se apresentar e ter conversa de 2 min com IA", "Criar template de progresso no Notion"], milestone: "Primeira conversa gravada com IA — arquivo no Notion" },
  { id: "q2", label: "Q2", period: "Meses 4–6", level: "Intermediate", color: "#7c3aed", soft: "#f5f3ff", goal: "Desenvolver fluência básica e expressão", objectives: ["Concluir o nível intermediário do Mairo Vergara", "Analisar 24 músicas rock com letra + contexto", "Manter diálogos de 5 min com IA sobre tópicos do dia a dia", "Completar o módulo 1 do Inglês de uma vez", "Escrever 1 resumo semanal em inglês no Notion"], milestone: "Gravar áudio de 5 min falando sobre uma música rock favorita" },
  { id: "q3", label: "Q3", period: "Meses 7–9", level: "Upper-Intermediate", color: "#059669", soft: "#ecfdf5", goal: "Consolidar gramática e vocabulário avançado", objectives: ["Completar Inglês de uma vez da Kiwify inteiramente", "Debater opiniões em inglês com a IA por 10 min", "Entender 70% de músicas rock sem precisar ver a letra", "Escrever resenhas de músicas ou álbuns em inglês no Notion", "Atingir 150 dias de streak no Duolingo"], milestone: "Debate de 10 min com IA sobre um álbum de rock — gravado" },
  { id: "q4", label: "Q4", period: "Meses 10–12", level: "Fluency", color: "#d97706", soft: "#fffbeb", goal: "Independência linguística e expressão natural", objectives: ["Manter conversas espontâneas de 15+ min com IA", "Consumir conteúdo rock em inglês sem suporte de legendas", "Criar playlist comentada com análises em inglês no Notion", "Rever toda a jornada no Notion e definir metas do próximo ano", "Completar 365 dias de hábito documentado"], milestone: "Vídeo-diário de 3 min em inglês sobre sua evolução no ano" },
];

const languageTips: TipGroup[] = [
  { icon: "💬", category: "Conversação", color: "#2563eb", items: ['"Vamos conversar por 10 minutos como nativo americano e estudante intermediário. Corrija meus erros no final."', '"Quero praticar small talk. Me faça perguntas sobre meu fim de semana e reaja naturalmente."', '"Me explique a gíria que apareceu nessa letra de música."'] },
  { icon: "🎸", category: "Análise de músicas", color: "#7c3aed", items: ['"Analise a letra desta música: explique expressões idiomáticas, gírias e contexto cultural."', '"Quais são as 10 palavras mais úteis dessa letra? Dê exemplos de uso no cotidiano."', '"Traduza essa frase de forma literal e depois natural."'] },
  { icon: "🎭", category: "Role-play", color: "#059669", items: ['"Você é atendente de uma loja de discos em Los Angeles e eu sou cliente."', '"Simule uma entrevista de emprego em inglês para tecnologia. Me avalie no final."', '"Me ajude a ensaiar uma discussão sobre minha banda favorita como se fosse um podcast."'] },
  { icon: "✏️", category: "Gramática & Correção", color: "#d97706", items: ['"Corrija esse texto, explicando cada erro e por que está errado."', '"Qual é a diferença entre estas duas palavras? Dê 3 exemplos de cada."', '"Reescreva essa frase de 3 maneiras: formal, informal e coloquial."'] },
];

const notionPages = [
  { icon: "📅", name: "Daily Log", desc: "Registro diário: o que estudou, nova palavra, frase do dia" },
  { icon: "📊", name: "Progress Tracker", desc: "Streak Duolingo, horas de estudo e músicas analisadas" },
  { icon: "🎸", name: "Music Library", desc: "Banco de músicas estudadas com vocabulário extraído" },
  { icon: "🤖", name: "AI Sessions", desc: "Resumos das sessões de conversa com IA" },
  { icon: "📖", name: "Vocabulary Bank", desc: "Palavras novas com contexto, exemplo e pronúncia" },
  { icon: "🏆", name: "Milestones", desc: "Conquistas trimestrais e reflexões de progresso" },
];

const colorByType: Record<string, { color: string; soft: string }> = {
  pos: { color: "#7c3aed", soft: "#f5f3ff" },
  rocket: { color: "#e11d48", soft: "#fff1f2" },
  cursodev: { color: "#0ea5e9", soft: "#f0f9ff" },
  content: { color: "#059669", soft: "#ecfdf5" },
  interview: { color: "#d97706", soft: "#fffbeb" },
  duolingo: { color: "#2563eb", soft: "#eff6ff" },
  mairo: { color: "#7c3aed", soft: "#f5f3ff" },
  kiwify: { color: "#0ea5e9", soft: "#f0f9ff" },
  music: { color: "#e11d48", soft: "#fff1f2" },
  ai: { color: "#059669", soft: "#ecfdf5" },
  notion: { color: "#64748b", soft: "#f8fafc" },
  rest: { color: "#6b7280", soft: "#f3f4f6" },
};

const devPlan = {
  summary: "Rotina semanal, fases até 2027 e regras de prioridade para Dev & IA.",
  subtitle: "Pós Unipds · Rocketseat · Curso.dev · Testes técnicos · Conteúdo · ~8h30min/sem",
  items: devItems,
  days: devDays,
  phases: devPhases,
  tips: devTips,
  tabs: ["Rotina semanal", "Plano de fases", "Dicas"],
  footer: "Carga semanal: ~8h30min · Pós: 5x/sem · Rocketseat: 3x/sem · Curso.dev: 3x/sem · Testes: 5x/sem",
  priority: {
    title: "Regra de prioridade",
    text: (
      <>
        <span className="font-bold">Pós tem prazo fixo (março/2027)</span> — prioridade máxima em dias de pouco tempo. <span className="font-bold">Curso.dev tem deadline dezembro/2026</span> — acelere nos próximos meses. <span className="font-bold">Rocketseat é o hábito de longo prazo</span> — nunca zere, mas pode ceder em semanas pesadas.
      </>
    ),
  },
};

const languagePlan = {
  summary: "Rotina de inglês e espanhol com rock, IA, Notion, Duolingo, Mairo e Kiwify.",
  subtitle: "1 ano estruturado · Rock · IA · Notion · Duolingo · Mairo Vergara · Kiwify",
  items: languageItems,
  days: languageDays,
  phases: languagePhases,
  tips: languageTips,
  tabs: ["Rotina semanal", "Plano anual", "Uso da IA", "Notion"],
  footer: "Semanal: ~5h30min inglês (Seg–Sex) · ~1h40 espanhol (sábado) · Domingo livre",
  priority: {
    title: "Canais de rock no YouTube",
    text: (
      <>
        <span className="font-bold">Genius Live · eTalk · Rock History · Songfacts</span> — busque a música + &quot;meaning explained&quot; ou &quot;lyrics breakdown&quot; para ter análises prontas para discutir com a IA.
      </>
    ),
  },
};

export function StudyPlanSection({ id, emoji, label, accent, plan }: StudyPlanSectionProps) {
  const [open, setOpen] = useState(false);
  const data = plan === "dev-ai" ? devPlan : languagePlan;

  return (
    <Section
      id={id}
      label={label}
      accent={accent}
      icon={<span className="text-base leading-none">{emoji}</span>}
      className="border-t border-[color:var(--card-border)]"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-card group flex w-full items-center justify-between gap-4 p-5 text-left ripple"
        aria-haspopup="dialog"
      >
        <span>
          <span className="block text-sm font-medium text-foreground">Abrir plano de estudos</span>
          <span className="mt-1 block text-xs leading-relaxed text-secondary">{data.summary}</span>
        </span>
        <ArrowUpRight
          className="size-4 shrink-0 transition-transform duration-250 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          style={{ color: "var(--accent)" }}
          aria-hidden
        />
      </button>

      {open && (
        <StudyPlanModal
          accent={accent}
          emoji={emoji}
          title={label}
          data={data}
          onClose={() => setOpen(false)}
        />
      )}
    </Section>
  );
}

function StudyPlanModal({
  accent,
  emoji,
  title,
  data,
  onClose,
}: {
  accent: string;
  emoji: string;
  title: string;
  data: typeof devPlan;
  onClose: () => void;
}) {
  const [tab, setTab] = useState(0);
  const [day, setDay] = useState(data.days[0].day);
  const [phaseId, setPhaseId] = useState(data.phases[0].id);
  const activeDay = useMemo(() => data.days.find((item) => item.day === day) ?? data.days[0], [data.days, day]);
  const activePhase = useMemo(() => data.phases.find((item) => item.id === phaseId) ?? data.phases[0], [data.phases, phaseId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${title}-modal-title`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ "--accent": accent } as CSSProperties}
    >
      <div className="glass-card max-h-[88vh] w-full max-w-5xl overflow-hidden bg-surface">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--card-border)] p-5 md:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">Plano de estudos</p>
            <h3 id={`${title}-modal-title`} className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">
              <span aria-hidden>{emoji}</span> {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{data.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--card-border)] text-secondary transition-colors hover:text-foreground"
            aria-label="Fechar modal"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[calc(88vh-7rem)] overflow-y-auto p-5 md:p-6">
          <OverviewCards items={data.items} />

          <div className="mt-5 flex gap-1 rounded-xl border border-[color:var(--card-border)] bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] p-1">
            {data.tabs.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(index)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-xs font-medium text-secondary transition-colors md:text-sm",
                  tab === index && "bg-surface text-foreground shadow-sm"
                )}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === 0 && (
            <div className="mt-5">
              <DaySelector days={data.days} active={activeDay.day} onSelect={setDay} />
              <DayCard day={activeDay} />
              <InfoNote icon={<Clock className="size-4" />} text={data.footer} />
            </div>
          )}

          {tab === 1 && (
            <div className="mt-5">
              <PhaseSelector phases={data.phases} active={activePhase.id} onSelect={setPhaseId} />
              <PhaseCard phase={activePhase} />
            </div>
          )}

          {tab === 2 && (
            <div className="mt-5">
              <TipsGrid tips={data.tips} />
              <PriorityBox title={data.priority.title} text={data.priority.text.toString()} />
            </div>
          )}

          {tab === 3 && (
            <div className="mt-5">
              <NotionPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewCards({ items }: { items: ThemeItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.name} className="rounded-xl border p-4" style={softStyle(item.color, item.soft)}>
          <div className="text-sm font-semibold" style={{ color: item.color }}>
            {item.icon} {item.name}
          </div>
          <div className="mt-1 text-xs text-secondary">{item.sub}</div>
          <div className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold text-white" style={{ background: item.color }}>
            {item.deadline ?? item.days}
          </div>
        </div>
      ))}
    </div>
  );
}

function DaySelector({ days, active, onSelect }: { days: WeekdayPlan[]; active: string; onSelect: (day: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {days.map((item) => (
        <button
          key={item.day}
          type="button"
          onClick={() => onSelect(item.day)}
          className={cn(
            "min-w-14 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors",
            active === item.day ? "text-white" : "border-[color:var(--card-border)] text-secondary hover:text-foreground"
          )}
          style={active === item.day ? { background: item.tone, borderColor: item.tone } : undefined}
        >
          {item.day}
          <span className="block text-[0.62rem] font-medium opacity-80">{item.toneLabel}</span>
        </button>
      ))}
    </div>
  );
}

function DayCard({ day }: { day: WeekdayPlan }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--card-border)] px-4 py-3">
        <h4 className="text-base font-semibold">{day.label}</h4>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ background: day.tone }}>
          <CalendarDays className="size-3" aria-hidden />
          {day.toneLabel}
        </span>
      </div>
      <div className="space-y-2 p-4">
        {day.blocks.map((block) => {
          const tone = colorByType[block.type] ?? colorByType.rest;
          return (
            <div key={`${day.day}-${block.label}-${block.activity}`} className="flex items-center gap-3 rounded-xl border p-3" style={softStyle(tone.color, tone.soft)}>
              <span className="text-lg" aria-hidden>{block.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: tone.color }}>{block.label}</div>
                <div className="mt-0.5 text-sm font-medium leading-snug text-foreground">{block.activity}</div>
              </div>
              <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-xs font-bold text-secondary">{block.time}</span>
            </div>
          );
        })}
        {day.tip && <TipBox {...day.tip} />}
      </div>
    </div>
  );
}

function PhaseSelector({ phases, active, onSelect }: { phases: PhasePlan[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {phases.map((phase) => (
        <button
          key={phase.id}
          type="button"
          onClick={() => onSelect(phase.id)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
            active === phase.id ? "text-white" : "border-[color:var(--card-border)] text-secondary hover:text-foreground"
          )}
          style={active === phase.id ? { background: phase.color, borderColor: phase.color } : undefined}
        >
          {phase.label} · {phase.period}
          {phase.level && <span className="block text-[0.62rem] font-medium opacity-80">{phase.level}</span>}
        </button>
      ))}
    </div>
  );
}

function PhaseCard({ phase }: { phase: PhasePlan }) {
  return (
    <div className="rounded-xl border p-4" style={softStyle(phase.color, phase.soft)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold" style={{ color: phase.color }}>{phase.period}</h4>
          <p className="mt-1 text-sm font-medium text-secondary">{phase.goal}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ background: phase.color }}>
          <Target className="size-3" aria-hidden />
          {phase.level ?? phase.label}
        </span>
      </div>
      <ol className="mt-4 space-y-2">
        {phase.objectives.map((objective, index) => (
          <li key={objective} className="flex gap-3 rounded-lg border border-[color:var(--card-border)] bg-surface p-3 text-sm leading-relaxed">
            <span className="shrink-0 text-xs font-bold" style={{ color: phase.color }}>{index + 1}.</span>
            <span>{objective}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg border-2 bg-surface p-3" style={{ borderColor: phase.color }}>
        <div className="text-xs font-bold" style={{ color: phase.color }}>Marco</div>
        <div className="mt-1 text-sm font-medium">{phase.milestone}</div>
      </div>
    </div>
  );
}

function TipsGrid({ tips }: { tips: TipGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {tips.map((tip) => (
        <div key={tip.category} className="glass-card p-4">
          <h4 className="text-sm font-semibold" style={{ color: tip.color }}>{tip.icon} {tip.category}</h4>
          <div className="mt-3 space-y-2">
            {tip.items.map((item, index) => (
              <div key={index} className="rounded-lg border border-[color:var(--card-border)] bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] p-3 text-sm leading-relaxed text-secondary">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotionPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {notionPages.map((page) => (
          <div key={page.name} className="glass-card flex gap-3 p-4">
            <span className="text-xl" aria-hidden>{page.icon}</span>
            <div>
              <div className="text-sm font-semibold">{page.name}</div>
              <div className="mt-1 text-xs leading-relaxed text-secondary">{page.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:color-mix(in_oklab,var(--accent)_8%,transparent)] p-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Template de registro diário</h4>
        <div className="mt-3 grid gap-2 text-sm leading-relaxed text-secondary md:grid-cols-2">
          <span>Data: ___________</span>
          <span>Tempo estudado: _____ min</span>
          <span>O que fiz: ___________</span>
          <span>Música do dia: ___________</span>
          <span>Palavra nova: ___</span>
          <span>IA hoje: sim / não — tema: ___</span>
          <span>Frase que aprendi: ___________</span>
          <span>Nível de confiança: 1–5</span>
        </div>
      </div>
    </div>
  );
}

function InfoNote({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--card-border)] bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] p-3 text-sm leading-relaxed text-secondary">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function TipBox({ title, text, color, soft }: NonNullable<WeekdayPlan["tip"]>) {
  return (
    <div className="rounded-xl border p-3" style={softStyle(color, soft)}>
      <div className="text-xs font-bold" style={{ color }}>{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-secondary">{text}</div>
    </div>
  );
}

function PriorityBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-1 text-sm leading-relaxed opacity-90">{text}</div>
    </div>
  );
}

function softStyle(color: string, soft: string): CSSProperties {
  return {
    borderColor: `color-mix(in oklab, ${color} 28%, var(--card-border))`,
  };
}
