'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  animate as animateValue,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CheckCircle,
  FileText,
  Headphones,
  LayoutGrid,
  MessageSquare,
  Mic,
  Network,
  Play,
  Target,
  TrendingUp,
  Upload,
  UserRound,
  Wand2,
  Zap,
} from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/useTranslation';
import { ClientProviders } from '@/components/ClientProviders';
import nextDynamic from 'next/dynamic';

// Disable SSR completely for this page
export const dynamic = 'force-dynamic';

const DashboardPage = nextDynamic(() => import('@/app/dashboard/page'), {
  ssr: false,
  loading: () => null,
});

type AuthMode = 'login' | 'register';
type IconType = typeof Brain;
const LOGO_URL = '/aether-logo.png';
const ease = [0.22, 1, 0.36, 1] as const;

const premiumFeatures: Array<{
  icon: IconType;
  title: string;
  description: string;
  visual: string;
}> = [
  {
    icon: Brain,
    title: 'Active Recall Engine',
    description:
      'Test je kennis actief met 10+ vraagtypes. Versterk neurale verbindingen en verbeter langetermijngeheugen door informatie actief op te halen zonder herlezen.',
    visual: 'active-recall',
  },
  {
    icon: Target,
    title: 'Daily Quiz',
    description:
      'Dagelijkse quiz van 10 vragen uit al je vakken. Adaptieve moeilijkheid en directe feedback voor consistente vooruitgang en kennishiaten identificatie.',
    visual: 'daily-quiz',
  },
  {
    icon: TrendingUp,
    title: 'FSRS Spaced Repetition',
    description:
      'Wetenschappelijk bewezen algoritme voor optimale herhaling. Je hersenen bepalen wanneer je iets moet herhalen voor maximale retentie met minimale tijd.',
    visual: 'fsrs',
  },
  {
    icon: FileText,
    title: 'Intelligente Notities',
    description:
      'Verbind notities met flashcards en quizvragen. Automatische koppeling van leerstof naar oefeningen voor een geïntegreerde leerervaring.',
    visual: 'notes',
  },
  {
    icon: Network,
    title: 'Kennisgraaf',
    description:
      'Visualiseer verbindingen tussen concepten. Begrijp hoe onderwerpen samenhangen en ontdek nieuwe inzichten door relationeel leren.',
    visual: 'graph',
  },
  {
    icon: CalendarDays,
    title: 'Slimme Agenda',
    description:
      'Intelligente planning op basis van je toetsdata en leerdoelen. Automatische suggesties voor optimale studietijden en herhalingmomenten.',
    visual: 'calendar',
  },
];

const modes = [
  {
    id: 'flashcards',
    labelKey: 'home_mode_flashcards',
    icon: Brain,
    titleKey: 'home_mode_flashcards_title',
    textKey: 'home_mode_flashcards_text',
  },
  {
    id: 'leren',
    labelKey: 'home_mode_learn',
    icon: Wand2,
    titleKey: 'home_mode_learn_title',
    textKey: 'home_mode_learn_text',
  },
  {
    id: 'schrijven',
    labelKey: 'home_mode_write',
    icon: FileText,
    titleKey: 'home_mode_write_title',
    textKey: 'home_mode_write_text',
  },
  {
    id: 'spraak',
    labelKey: 'home_mode_speech',
    icon: Mic,
    titleKey: 'home_mode_speech_title',
    textKey: 'home_mode_speech_text',
  },
  {
    id: 'toets',
    labelKey: 'home_mode_test',
    icon: Target,
    titleKey: 'home_mode_test_title',
    textKey: 'home_mode_test_text',
  },
  {
    id: 'match',
    labelKey: 'home_mode_match',
    icon: LayoutGrid,
    titleKey: 'home_mode_match_title',
    textKey: 'home_mode_match_text',
  },
] as const;

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <Reveal className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p
        className={`mb-4 text-[11px] font-semibold tracking-[0.12em] text-primary ${centered ? '' : ''}`}
      >
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold leading-[0.98] tracking-tight text-foreground md:text-4xl lg:text-6xl">
        {title}
      </h2>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base lg:text-lg">
        {description}
      </p>
    </Reveal>
  );
}

function ProductChrome({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-blue-300/20 bg-[#0d1b35] shadow-2xl shadow-blue-950/20 ${className}`}
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-white/10 bg-[#09152b] px-4">
        <span className="h-2 w-2 rounded-full bg-blue-300/50" />
        <span className="h-2 w-2 rounded-full bg-sky-300/50" />
        <span className="h-2 w-2 rounded-full bg-indigo-300/50" />
        <div className="ml-3 h-4 w-32 rounded-full bg-white/5" />
      </div>
      {children}
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Aether home">
      <Image
        src={LOGO_URL}
        alt="Aether logo"
        width={compact ? 30 : 36}
        height={compact ? 30 : 36}
        className="rounded-lg object-cover"
        priority={!compact}
      />
      {!compact && (
        <span className="font-display text-3xl font-semibold tracking-tight">Aether</span>
      )}
    </Link>
  );
}

function OneWayProgress() {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (value) => `${value}%`);
  const label = useTransform(progress, (value) => `${Math.round(value)}%`);
  useEffect(() => {
    const controls = animateValue(progress, 100, { duration: 8, ease: [0.18, 0.72, 0.32, 1] });
    return () => controls.stop();
  }, [progress]);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div style={{ width }} className="h-full rounded-full bg-blue-400" />
      </div>
      <motion.span className="w-9 text-right text-[9px] text-white/55">{label}</motion.span>
    </div>
  );
}

function HeroWorkspace() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const sidebarItems = [
    t('home_mock_overview'),
    t('home_nav_artisan'),
    t('home_mock_sidebar_notes'),
    t('home_mock_sidebar_agenda'),
  ];
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-2, 1, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-7 top-20 z-20 hidden w-44 rounded-xl border border-blue-300/20 bg-[#142749] p-3 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2 text-[10px] text-blue-100/50">
          <FileText className="h-3.5 w-3.5 text-blue-300" />
          {t('home_mock_new_note')}
        </div>
        <p className="mt-3 text-xs font-medium text-white">{t('home_mock_cardio_title')}</p>
        <div className="mt-2 h-1.5 w-24 rounded-full bg-white/10" />
        <div className="mt-1.5 h-1.5 w-32 rounded-full bg-white/10" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 9, 0], rotate: [2, -1, 2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -right-7 bottom-20 z-20 hidden w-48 rounded-xl border border-sky-300/20 bg-[#142749] p-3 shadow-xl sm:block"
      >
        <div className="flex items-center justify-between text-[10px] text-blue-100/50">
          <CalendarDays className="h-3.5 w-3.5 text-sky-300" />
          {t('home_mock_today')}
        </div>
        <p className="mt-3 text-xs font-medium text-white">{t('home_mock_review_bio')}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-sky-300">
          <Zap className="h-3 w-3" />
          {t('home_mock_20min')}
        </div>
      </motion.div>
      <ProductChrome className="relative z-10 rotate-[1deg]">
        <div className="grid min-h-[430px] grid-cols-[108px_1fr] sm:grid-cols-[145px_1fr]">
          <aside className="border-r border-white/10 bg-[#0b1931] p-3">
            <div className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-white">
              <Image src={LOGO_URL} alt="" width={20} height={20} className="rounded" />
              Aether
            </div>
            {sidebarItems.map((item, index) => (
              <div
                key={item}
                className={`mb-2 rounded-md px-2 py-2 text-[10px] ${index === 1 ? 'bg-blue-500/20 text-blue-200' : 'text-white/40'}`}
              >
                {item}
              </div>
            ))}
            <div className="mt-10 rounded-lg border border-blue-400/20 bg-blue-500/10 p-2">
              <Image src={LOGO_URL} alt="" width={14} height={14} className="rounded" />
              <p className="mt-2 text-[9px] text-white/60">{t('home_nav_artisan')}</p>
              <OneWayProgress />
            </div>
          </aside>
          <div className="p-5 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                  {t('home_mock_session')}
                </p>
                <h3 className="mt-2 font-display text-3xl text-white sm:text-4xl">
                  {t('home_mock_from_source')}
                </h3>
              </div>
              <span className="rounded-lg border border-blue-300/20 px-2 py-1 text-[9px] text-blue-200/70">
                {t('home_mock_ai_active')}
              </span>
            </div>
            <div className="mt-8 rounded-2xl border border-dashed border-blue-300/30 bg-blue-500/[0.07] p-5">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-500/20 text-blue-200"
              >
                <Upload className="h-6 w-6" />
              </motion.div>
              <p className="mt-4 text-center text-sm font-medium text-white">
                {t('home_mock_drop')}
              </p>
              <p className="mt-1 text-center text-[10px] text-white/45">
                {t('home_mock_drop_types')}
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#142749] p-3">
                <div className="grid h-8 w-8 place-items-center rounded bg-blue-500/20 text-blue-200">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white">{t('home_mock_file')}</p>
                  <p className="mt-1 text-[9px] text-white/40">{t('home_mock_ready_analyse')}</p>
                </div>
                <Check className="h-4 w-4 text-blue-300" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[9px] text-white/50">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg text-white">18</p>
                {t('home_mock_flashcards_count')}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg text-white">6</p>
                {t('home_mock_questions_count')}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg text-white">1</p>
                {t('home_mock_summary_count')}
              </div>
            </div>
          </div>
        </div>
      </ProductChrome>
    </div>
  );
}

function ArtisanFlowPreview() {
  const { t } = useTranslation();
  return (
    <ProductChrome className="mx-auto max-w-6xl">
      <div className="grid gap-4 p-4 sm:grid-cols-[0.8fr_1.2fr] sm:p-6">
        <div className="rounded-xl border border-dashed border-blue-300/30 bg-blue-500/[0.07] p-5">
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#09152b] text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/20 text-blue-200"
            >
              <Upload className="h-5 w-5" />
            </motion.div>
            <p className="mt-4 text-xs font-medium text-white">{t('home_mock_upload_source')}</p>
            <p className="mt-1 text-[10px] text-white/40">{t('home_mock_focus_cardio')}</p>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-white/50">
            <span>{t('home_mock_artisan_analyses')}</span>
            <span>{t('home_mock_one_time')}</span>
          </div>
          <div className="mt-2">
            <OneWayProgress />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#09152b] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <Image src={LOGO_URL} alt="" width={16} height={16} className="rounded" />
              {t('home_mock_generated')}
            </div>
            <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[9px] text-blue-200">
              {t('home_mock_ready')}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#142749] p-4">
              <p className="text-[9px] uppercase tracking-widest text-white/40">
                {t('home_mock_card_01')}
              </p>
              <p className="mt-3 text-sm text-white">{t('home_mock_aorta_q')}</p>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/55">
                {t('home_mock_aorta_a')}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#142749] p-4">
              <p className="text-[9px] uppercase tracking-widest text-white/40">
                {t('home_mock_summary')}
              </p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded-full bg-white/10" />
                <div className="h-2 w-11/12 rounded-full bg-white/10" />
                <div className="h-2 w-8/12 rounded-full bg-white/10" />
                <div className="h-2 w-10/12 rounded-full bg-blue-300/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductChrome>
  );
}

function PremiumFeatureVisual({ kind }: { kind: string }) {
  if (kind === 'active-recall') {
    return (
      <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Active Recall Engine</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">Open vraag</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary">Multiple choice</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <Brain className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">Flashcard</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'daily-quiz') {
    return (
      <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Daily Quiz</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
            <span className="text-xs">Vraag 3/10</span>
            <span className="text-xs text-primary">30%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-[30%] bg-primary rounded-full" />
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 h-8 rounded-lg border border-border bg-secondary/50 flex items-center justify-center text-xs">
              A
            </div>
            <div className="flex-1 h-8 rounded-lg border-2 border-primary bg-primary/10 flex items-center justify-center text-xs text-primary">
              B
            </div>
            <div className="flex-1 h-8 rounded-lg border border-border bg-secondary/50 flex items-center justify-center text-xs">
              C
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'fsrs') {
    return (
      <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">FSRS Spaced Repetition</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Herhaal in</span>
            <span className="font-medium">2 dagen</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Moeilijkheid</span>
            <span className="font-medium text-yellow-600">Gemiddeld</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Stabiliteit</span>
            <span className="font-medium text-green-600">Hoog</span>
          </div>
          <div className="mt-2 h-8 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-xs text-primary">Optimaal herhalingmoment</span>
          </div>
        </div>
      </div>
    );
  }
  return <FeatureVisual kind={kind} />;
}

function FeatureVisual({ kind }: { kind: string }) {
  const { t } = useTranslation();
  const graphNodes: Array<Array<string | boolean>> = [
    [t('home_mock_node_heart'), '12%', '55%', true],
    [t('home_mock_node_aorta'), '30%', '20%'],
    [t('home_mock_node_lungs'), '32%', '82%'],
    [t('home_mock_node_oxygen'), '58%', '38%'],
    [t('home_mock_node_pressure'), '82%', '18%'],
    [t('home_mock_node_tension'), '84%', '75%'],
  ];
  const modeLabels = [
    t('home_mock_mode_flip'),
    t('home_mock_mode_write'),
    t('home_mock_mode_test'),
    t('home_mock_mode_match'),
    t('home_mock_mode_learn'),
    t('home_mock_mode_gravity'),
  ];
  if (kind === 'cards')
    return (
      <div className="relative h-36 overflow-hidden rounded-xl border border-blue-200/15 bg-[#0b1931] p-4">
        <motion.div
          animate={{ rotate: [-5, -2, -5], y: [5, 0, 5] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute left-8 top-7 h-24 w-36 rounded-xl border border-blue-200/20 bg-[#1a3157] p-3 text-xs text-blue-100/70 shadow-xl"
        >
          {t('home_mock_fsrs_q')}
        </motion.div>
        <motion.div
          animate={{ rotate: [4, 2, 4], y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
          className="absolute left-12 top-4 h-24 w-36 rounded-xl border border-blue-300/40 bg-[#244776] p-3 text-xs text-white shadow-2xl"
        >
          {t('home_mock_fsrs_answer')}
          <div className="mt-5 h-1.5 w-16 rounded-full bg-blue-300/50" />
        </motion.div>
        <span className="absolute bottom-3 right-3 text-[9px] text-blue-200/60">
          {t('home_mock_again_hard')}
        </span>
      </div>
    );
  if (kind === 'notes')
    return (
      <div className="h-36 rounded-xl border border-blue-200/15 bg-[#0b1931] p-4">
        <div className="flex items-center gap-2 text-[9px] text-blue-200/60">
          <span className="text-blue-300">⋮⋮</span>
          {t('home_mock_block_editor')}
        </div>
        <p className="mt-3 font-display text-xl text-white">{t('home_mock_heart')}</p>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-11/12 rounded-full bg-white/15" />
          <div className="h-2 w-8/12 rounded-full bg-blue-300/35" />
          <div className="h-2 w-10/12 rounded-full bg-white/10" />
        </div>
      </div>
    );
  if (kind === 'graph')
    return (
      <div className="relative h-36 overflow-hidden rounded-xl border border-blue-200/15 bg-[#0b1931]">
        <svg className="absolute inset-0 h-full w-full">
          <line x1="12%" y1="55%" x2="30%" y2="20%" stroke="rgba(96,165,250,.55)" />
          <line x1="12%" y1="55%" x2="32%" y2="82%" stroke="rgba(96,165,250,.4)" />
          <line x1="30%" y1="20%" x2="58%" y2="38%" stroke="rgba(125,211,252,.45)" />
          <line x1="32%" y1="82%" x2="58%" y2="38%" stroke="rgba(125,211,252,.35)" />
          <line x1="58%" y1="38%" x2="82%" y2="18%" stroke="rgba(147,197,253,.35)" />
          <line x1="58%" y1="38%" x2="84%" y2="75%" stroke="rgba(147,197,253,.3)" />
        </svg>
        {graphNodes.map(([label, left, top, main], index) => (
          <motion.span
            key={String(label)}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            style={{ left: String(left), top: String(top) }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[9px] ${main ? 'border-blue-300 bg-blue-400 text-[#07162e]' : 'border-blue-200/20 bg-[#183259] text-blue-100/70'}`}
          >
            {String(label)}
          </motion.span>
        ))}
      </div>
    );
  if (kind === 'calendar') return <MiniMonth />;
  if (kind === 'modes')
    return (
      <div className="h-36 rounded-xl border border-blue-200/15 bg-[#0b1931] p-4">
        <div className="grid grid-cols-3 gap-2">
          {modeLabels.map((label, index) => (
            <motion.div
              whileHover={{ y: -2 }}
              key={label}
              className={`rounded-lg border p-2 text-center text-[9px] ${index === 0 ? 'border-blue-300/40 bg-blue-500/20 text-blue-100' : 'border-white/10 text-white/45'}`}
            >
              {label}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[9px] text-blue-200/50">
          <Target className="h-3 w-3" />
          {t('home_mock_ways')}
        </div>
      </div>
    );
  return (
    <div className="h-36 rounded-xl border border-blue-200/15 bg-[#0b1931] p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/20 text-blue-200">
          <Headphones className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-white">{t('home_mock_repeat_on_the_go')}</p>
          <p className="mt-1 text-[9px] text-white/40">{t('home_mock_audio_cardio')}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-1">
        {Array.from({ length: 26 }, (_, i) => (
          <motion.span
            key={i}
            animate={{ height: [4, 8 + (i % 5) * 2, 4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.03 }}
            className="w-1 rounded-full bg-blue-400/60"
          />
        ))}
      </div>
    </div>
  );
}

function MiniMonth() {
  const { t } = useTranslation();
  const dayLabels = [
    t('home_mock_day_ma'),
    t('home_mock_day_di'),
    t('home_mock_day_wo'),
    t('home_mock_day_do'),
    t('home_mock_day_vr'),
    t('home_mock_day_za'),
    t('home_mock_day_zo'),
  ];
  const cells = [
    '27',
    '28',
    '29',
    '30',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
  ];
  const events: Record<string, string> = {
    '4': t('home_mock_ev_chem'),
    '7': t('home_mock_ev_math'),
    '12': t('home_mock_ev_testweek'),
    '13': t('home_mock_ev_phys_exam'),
    '14': t('home_mock_ev_bio_exam'),
    '20': t('home_mock_ev_report'),
    '24': t('home_mock_ev_autumn'),
    '25': t('home_mock_ev_autumn'),
    '26': t('home_mock_ev_autumn'),
    '27': t('home_mock_ev_autumn'),
  };
  return (
    <div className="h-36 overflow-hidden rounded-xl border border-blue-200/15 bg-[#09152b] p-2">
      <div className="grid grid-cols-7 gap-px text-center text-[7px] text-blue-200/60">
        {dayLabels.map((day) => (
          <span key={day} className="pb-1">
            {day}
          </span>
        ))}
        {cells.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className={`min-h-5 overflow-hidden border-t border-white/10 p-1 text-left text-[7px] ${index < 4 ? 'text-white/25' : 'text-blue-100/80'}`}
          >
            <span>{day}</span>
            {events[day] && (
              <span className="mt-1 block truncate rounded bg-blue-500/30 px-1 text-[6px] text-blue-100">
                {events[day]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectFoldersPreview() {
  const { t } = useTranslation();
  const subjects = [
    t('home_mock_subj_geo'),
    t('home_mock_subj_math'),
    t('home_mock_subj_phys'),
    t('home_mock_subj_dutch'),
    t('home_mock_subj_eng'),
    t('home_mock_subj_french'),
    t('home_mock_subj_bio'),
    t('home_mock_subj_chem'),
  ];
  return (
    <ProductChrome className="w-full">
      <div className="grid min-h-[340px] grid-cols-[140px_1fr] sm:grid-cols-[190px_1fr]">
        <aside className="border-r border-white/10 bg-[#0b1931] p-4">
          <p className="text-[9px] uppercase tracking-widest text-white/40">
            {t('home_mock_my_subjects')}
          </p>
          {subjects.map((subject, index) => (
            <div
              key={subject}
              className={`mt-2 rounded-md px-2 py-1.5 text-[10px] ${index === 0 ? 'bg-blue-500/20 text-blue-100' : 'text-white/50'}`}
            >
              <span className="mr-1.5 text-blue-300">⌄</span>
              {subject}
            </div>
          ))}
        </aside>
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/40">
                {t('home_mock_subj_path')}
              </p>
              <h3 className="mt-2 font-display text-3xl text-white">
                {t('home_mock_knowledge_cards')}
              </h3>
            </div>
            <FileText className="h-5 w-5 text-blue-300" />
          </div>
          <div className="mt-6 space-y-2 font-mono text-[11px] text-blue-100/80">
            <p>
              <span className="mr-2 text-blue-300">⌄</span>
              {subjects[0]}
            </p>
            <p className="pl-5">
              <span className="mr-2 text-blue-300">⌄</span>
              {t('home_mock_chapter_1')}
            </p>
            <p className="pl-10 text-white/60">└ {t('home_mock_topic_11')}</p>
            <p className="pl-10 text-white/60">└ {t('home_mock_topic_12')}</p>
            <p className="pl-5">
              <span className="mr-2 text-blue-300">⌄</span>
              {t('home_mock_chapter_2')}
            </p>
            <p className="pl-10 text-white/60">└ {t('home_mock_topic_21')}</p>
            <p className="pl-10 text-white/60">└ {t('home_mock_topic_22')}</p>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => (
              <div
                key={subject}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[9px] text-white/60"
              >
                <p className="font-medium text-blue-100">{subject}</p>
                <p className="mt-1 font-mono text-[8px] text-white/40">{t('home_mock_path_11')}</p>
                <p className="font-mono text-[8px] text-white/40">{t('home_mock_path_12')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProductChrome>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof premiumFeatures)[number];
  index: number;
}) {
  const Icon = feature.icon;
  return (
    <Reveal delay={index * 0.05}>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="group h-full rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
      >
        <PremiumFeatureVisual kind={feature.visual} />
        <div className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight">{feature.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
      </motion.div>
    </Reveal>
  );
}

function NotesPreview() {
  const { t } = useTranslation();
  const sidebarItems = [
    t('home_mock_note_side_bio'),
    t('home_mock_note_side_cardio'),
    t('home_mock_note_side_terms'),
  ];
  return (
    <ProductChrome>
      <div className="grid min-h-[300px] grid-cols-[90px_1fr] sm:grid-cols-[130px_1fr]">
        <aside className="border-r border-white/10 bg-[#0b1931] p-3">
          <p className="text-[9px] uppercase tracking-widest text-white/40">
            {t('home_mock_sidebar_notes')}
          </p>
          {sidebarItems.map((item, i) => (
            <div
              key={item}
              className={`mt-3 rounded px-2 py-1.5 text-[10px] ${i === 1 ? 'bg-blue-500/20 text-blue-100' : 'text-white/40'}`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-2 text-[10px] text-blue-200/60">
            <span className="text-blue-300">⋮⋮</span>
            {t('home_mock_block_selected')}
          </div>
          <h3 className="mt-5 font-display text-3xl text-white">{t('home_mock_heart')}</h3>
          <div className="mt-5 space-y-3">
            <p className="text-xs leading-relaxed text-white/65">{t('home_mock_heart_body')}</p>
            <p className="rounded-lg border border-blue-300/30 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-100">
              {t('home_mock_heart_link')}
            </p>
            <div className="h-2 w-36 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </ProductChrome>
  );
}

function GraphPreview() {
  const { t } = useTranslation();
  const lines = [
    ['18%', '50%', '38%', '18%'],
    ['18%', '50%', '38%', '82%'],
    ['38%', '18%', '65%', '35%'],
    ['38%', '82%', '65%', '35%'],
    ['65%', '35%', '88%', '18%'],
    ['65%', '35%', '88%', '80%'],
    ['38%', '18%', '65%', '80%'],
  ];
  const nodes: Array<Array<string | boolean>> = [
    [t('home_mock_node_heart'), '18%', '50%', true],
    [t('home_mock_node_aorta'), '38%', '18%'],
    [t('home_mock_node_lungs'), '38%', '82%'],
    [t('home_mock_node_oxygen'), '65%', '35%'],
    [t('home_mock_node_pressure'), '88%', '18%'],
    [t('home_mock_node_tension'), '88%', '80%'],
    [t('home_mock_node_cells'), '65%', '80%'],
  ];
  return (
    <ProductChrome>
      <div className="relative min-h-[340px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_44%)]">
        <svg className="absolute inset-0 h-full w-full">
          {lines.map((line, index) => (
            <line
              key={index}
              x1={line[0]}
              y1={line[1]}
              x2={line[2]}
              y2={line[3]}
              stroke="rgba(96,165,250,.42)"
              strokeWidth="1"
            />
          ))}
        </svg>
        {nodes.map(([label, left, top, main], index) => (
          <motion.span
            key={String(label)}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, type: 'spring' }}
            style={{ left: String(left), top: String(top) }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-[10px] ${main ? 'border-blue-300 bg-blue-400 text-[#07162e]' : 'border-blue-200/20 bg-[#183259] text-blue-100/75'}`}
          >
            {String(label)}
          </motion.span>
        ))}
      </div>
    </ProductChrome>
  );
}

function ReviewPreview() {
  const { t } = useTranslation();
  const labels = [
    t('home_mock_again'),
    t('home_mock_hard'),
    t('home_mock_good'),
    t('home_mock_easy'),
  ];
  const units = [t('home_mock_min'), t('home_mock_min'), t('home_mock_min'), t('home_mock_days')];
  return (
    <ProductChrome>
      <div className="min-h-[300px] p-5 sm:p-8">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>{t('home_mock_review_subject')}</span>
          <span>{t('home_mock_card_of')}</span>
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-[#183259] p-7 text-center">
          <p className="text-[9px] uppercase tracking-widest text-white/40">
            {t('home_mock_question')}
          </p>
          <p className="mt-5 font-display text-2xl text-white">{t('home_mock_valves_q')}</p>
          <p className="mt-4 text-xs text-white/40">{t('home_mock_flip_hint')}</p>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {labels.map((label, index) => (
            <motion.div
              whileHover={{ y: -4 }}
              key={label}
              className={`rounded-lg p-2 text-center text-[10px] ${index === 0 ? 'bg-blue-500/20 text-blue-100' : 'bg-white/5 text-white/60'}`}
            >
              {label}
              <span className="mt-1 block text-[9px] opacity-50">
                {[1, 6, 4, 12][index]} {units[index]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </ProductChrome>
  );
}

function PlannerPreview() {
  const { t } = useTranslation();
  return (
    <ProductChrome>
      <div className="min-h-[360px] p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/40">
              {t('home_mock_agenda_may')}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{t('home_mock_month_view')}</p>
          </div>
          <span className="rounded-md bg-blue-500/15 px-2 py-1 text-[9px] text-blue-200">
            {t('home_mock_planning')}
          </span>
        </div>
        <div className="mt-5">
          <MiniMonth />
        </div>
      </div>
    </ProductChrome>
  );
}

function ModeVisual({ id }: { id: string }) {
  const { t } = useTranslation();
  if (id === 'flashcards')
    return (
      <div className="relative h-[270px] overflow-hidden rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
        <motion.div
          animate={{ rotate: [-7, -4, -7], x: [0, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute left-12 top-16 h-36 w-64 rounded-2xl border border-blue-200/20 bg-[#17325b] p-5 text-white/70 shadow-2xl"
        >
          <p className="text-[9px] uppercase tracking-widest text-white/40">
            {t('home_mock_card_1')}
          </p>
          <p className="mt-5 font-display text-xl">{t('home_mock_diffusion_q')}</p>
        </motion.div>
        <motion.div
          animate={{ rotate: [6, 3, 6], x: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
          className="absolute left-20 top-10 h-36 w-64 rounded-2xl border border-blue-300/40 bg-[#2a5288] p-5 text-white shadow-2xl"
        >
          <p className="text-[9px] uppercase tracking-widest text-blue-100/60">
            {t('home_mock_card_2_active')}
          </p>
          <p className="mt-5 font-display text-xl">{t('home_mock_aorta_q')}</p>
          <div className="mt-5 h-1.5 w-20 rounded-full bg-blue-200/50" />
        </motion.div>
        <div className="absolute bottom-4 left-6 right-6 grid grid-cols-4 gap-2 text-center text-[9px] text-blue-100/60">
          <span className="rounded bg-blue-500/20 p-2">{t('home_mock_again')}</span>
          <span className="rounded bg-white/5 p-2">{t('home_mock_hard')}</span>
          <span className="rounded bg-white/5 p-2">{t('home_mock_good')}</span>
          <span className="rounded bg-white/5 p-2">{t('home_mock_easy')}</span>
        </div>
      </div>
    );
  if (id === 'leren')
    return (
      <div className="h-[270px] rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
        <div className="flex items-center justify-between text-[10px] text-white/45">
          <span>{t('home_mock_q_learn')}</span>
          <span>{t('home_mock_adaptive')}</span>
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-[#17325b] p-5">
          <p className="text-[9px] uppercase tracking-widest text-blue-200/60">
            {t('home_mock_multiple_choice')}
          </p>
          <p className="mt-4 font-display text-2xl text-white">{t('home_mock_ozone_q')}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            t('home_mock_ans_ozone'),
            t('home_mock_ans_troposphere'),
            t('home_mock_ans_core'),
            t('home_mock_ans_lithosphere'),
          ].map((answer, index) => (
            <div
              key={answer}
              className={`rounded-lg border p-3 text-xs ${index === 0 ? 'border-blue-300 bg-blue-500/20 text-blue-100' : 'border-white/10 text-white/55'}`}
            >
              {String.fromCharCode(65 + index)} · {answer}
            </div>
          ))}
        </div>
      </div>
    );
  if (id === 'schrijven')
    return (
      <div className="h-[270px] rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
        <p className="text-[9px] uppercase tracking-widest text-blue-200/60">
          {t('home_mock_write_answer')}
        </p>
        <p className="mt-5 font-display text-2xl text-white">{t('home_mock_paris_q')}</p>
        <div className="mt-7 flex items-center gap-2 rounded-lg border border-blue-300/40 bg-[#17325b] px-4 py-3 text-sm text-blue-100">
          <span>Par</span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="h-5 w-px bg-blue-300"
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-white/40">
          <span>{t('home_mock_typing')}</span>
          <span>{t('home_mock_enter_check')}</span>
        </div>
      </div>
    );
  if (id === 'spraak')
    return (
      <div className="h-[270px] rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-500/20 text-blue-200">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-white">{t('home_mock_say_term')}</p>
            <p className="mt-1 text-[10px] text-white/40">{t('home_mock_cv_system')}</p>
          </div>
        </div>
        <div className="mt-9 flex h-16 items-center justify-center gap-1">
          {Array.from({ length: 34 }, (_, i) => (
            <motion.span
              key={i}
              animate={{ height: [5, 12 + (i % 7) * 4, 5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.035 }}
              className="w-1 rounded-full bg-blue-400/70"
            />
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between text-[10px] text-blue-200/60">
          <span>{t('home_mock_recording')}</span>
          <span>00:08 / 00:15</span>
        </div>
      </div>
    );
  if (id === 'toets')
    return (
      <div className="h-[270px] rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10px] text-white/45">
          <span>{t('home_mock_test_title')}</span>
          <span>{t('home_mock_q_of')}</span>
        </div>
        <p className="mt-6 text-[9px] uppercase tracking-widest text-blue-200/60">
          {t('home_mock_open_q')}
        </p>
        <p className="mt-3 font-display text-2xl text-white">{t('home_mock_oxygen_q')}</p>
        <div className="mt-5 h-16 rounded-lg border border-white/10 bg-[#17325b]" />
        <div className="mt-4 flex justify-between text-[10px] text-white/40">
          <span>{t('home_mock_no_feedback')}</span>
          <span>{t('home_mock_grade_later')}</span>
        </div>
      </div>
    );
  const leftPairs = [
    t('home_mock_match_aorta'),
    t('home_mock_match_neuron'),
    t('home_mock_match_diffusion'),
  ];
  const rightPairs = [
    t('home_mock_match_vessel'),
    t('home_mock_match_nerve'),
    t('home_mock_match_spread'),
  ];
  return (
    <div className="h-[270px] rounded-2xl border border-blue-300/20 bg-[#0b1931] p-6">
      <div className="flex items-center justify-between text-[10px] text-white/45">
        <span>{t('home_mock_match_pairs')}</span>
        <span>{t('home_mock_found_of')}</span>
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {leftPairs.map((item, index) => (
            <div
              key={item}
              className={`rounded-lg border p-3 text-xs ${index === 0 ? 'border-blue-300 bg-blue-500/20 text-blue-100' : 'border-white/10 text-white/65'}`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {rightPairs.map((item, index) => (
            <div
              key={item}
              className={`rounded-lg border p-3 text-xs ${index === 0 ? 'border-blue-300 bg-blue-500/20 text-blue-100' : 'border-white/10 text-white/65'}`}
            >
              {item}
            </div>
          ))}
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <path
            d="M 95 24 C 150 10, 170 10, 230 24"
            fill="none"
            stroke="rgba(96,165,250,.75)"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="mt-6 text-center text-[10px] text-blue-200/55">{t('home_mock_match_hint')}</p>
    </div>
  );
}

function PlayfulLearningPreview() {
  const { t } = useTranslation();
  const sprintItems = [
    t('home_mock_sprint_aorta'),
    t('home_mock_sprint_osmosis'),
    t('home_mock_sprint_neuron'),
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="relative h-56 overflow-hidden rounded-2xl border border-blue-300/20 bg-gradient-to-b from-blue-500/20 to-[#07162e] p-5">
        <p className="relative z-10 text-xs font-semibold text-blue-100">{t('home_mock_runner')}</p>
        <div className="absolute bottom-0 left-1/2 h-32 w-40 -translate-x-1/2 skew-x-[-12deg] border-x-2 border-blue-300/30 bg-blue-950/50">
          <div className="absolute left-1/2 top-8 h-8 w-8 -translate-x-1/2 rotate-45 rounded-md bg-blue-300" />
          <div className="absolute left-8 top-20 h-3 w-3 rounded-full bg-sky-300" />
          <div className="absolute right-8 top-12 h-3 w-3 rounded-full bg-sky-300" />
          <div className="absolute left-1/2 top-28 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-200" />
        </div>
        <p className="absolute bottom-4 left-5 text-[10px] text-blue-100/60">
          {t('home_mock_runner_hint')}
        </p>
      </div>
      <div className="relative h-56 overflow-hidden rounded-2xl border border-blue-300/20 bg-[#0b1931] p-5">
        <p className="text-xs font-semibold text-blue-100">{t('home_mock_knowledge_blocks')}</p>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.04 }}
              className={`aspect-square rounded-md ${i % 5 === 0 ? 'bg-blue-300' : 'bg-blue-500/30'}`}
            />
          ))}
        </div>
        <p className="absolute bottom-4 left-5 text-[10px] text-blue-100/60">
          {t('home_mock_blocks_hint')}
        </p>
      </div>
      <div className="relative h-56 overflow-hidden rounded-2xl border border-blue-300/20 bg-gradient-to-b from-indigo-500/20 to-[#07162e] p-5">
        <p className="text-xs font-semibold text-blue-100">{t('home_mock_match_sprint')}</p>
        <div className="mt-6 space-y-2">
          {sprintItems.map((item, index) => (
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              key={item}
              className="rounded-lg border border-blue-300/20 bg-blue-500/10 p-2 text-[10px] text-blue-100"
            >
              {item}
            </motion.div>
          ))}
        </div>
        <p className="absolute bottom-4 left-5 text-[10px] text-blue-100/60">
          {t('home_mock_sprint_hint')}
        </p>
      </div>
    </div>
  );
}

function HomePage() {
  const { user, loading } = useUser();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeMode, setActiveMode] = useState<string>(modes[0].id);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
    layoutEffect: false,
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="h-screen" />
      </main>
    );
  }

  if (user && !loading) return <DashboardPage />;
  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const currentMode = modes.find((mode) => mode.id === activeMode) ?? modes[0];
  const CurrentModeIcon = currentMode.icon;
  const artisanSteps = [
    { number: '01', icon: Upload, titleKey: 'home_step1_title', textKey: 'home_step1_text' },
    { number: '02', icon: Wand2, titleKey: 'home_step2_title', textKey: 'home_step2_text' },
    { number: '03', icon: BookOpen, titleKey: 'home_step3_title', textKey: 'home_step3_text' },
  ];
  const howSteps = [
    { number: '1', icon: UserRound, titleKey: 'home_how1_title', textKey: 'home_how1_text' },
    { number: '2', icon: Upload, titleKey: 'home_how2_title', textKey: 'home_how2_text' },
    { number: '3', icon: Wand2, titleKey: 'home_how3_title', textKey: 'home_how3_text' },
    { number: '4', icon: Target, titleKey: 'home_how4_title', textKey: 'home_how4_text' },
  ];
  const journeyRows = [
    { title: t('home_nav_artisan'), status: t('home_mock_journey_source') },
    { title: t('home_mock_sidebar_notes'), status: t('home_mock_journey_notes') },
    { title: t('home_mode_flashcards'), status: t('home_mock_journey_review') },
  ];
  const pricingItems = [
    t('home_pricing_f1'),
    t('home_pricing_f2'),
    t('home_pricing_f3'),
    t('home_pricing_f4'),
    t('home_pricing_f5'),
    t('home_pricing_f6'),
  ];

  return (
    <ClientProviders>
      <main className="scroll-smooth overflow-hidden bg-gradient-to-b from-background via-background to-primary/[0.02] text-foreground">
        <AuthModal
          isOpen={authOpen}
          initialMode={authMode}
          onClose={() => setAuthOpen(false)}
          onAuthSuccess={() => window.location.assign('/')}
          onGuestMode={() => setAuthOpen(false)}
        />
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-30 [background-image:radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <motion.div
          style={{ y: glowY }}
          className="pointer-events-none absolute left-1/2 top-[-30rem] -z-10 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[150px]"
        />
        <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#artisan" className="transition-colors hover:text-primary">
              Artisan AI
            </a>
            <a href="#functies" className="transition-colors hover:text-primary">
              Functies
            </a>
            <a href="#werkwijze" className="transition-colors hover:text-primary">
              Werkwijze
            </a>
            <a href="#prijzen" className="transition-colors hover:text-primary">
              Prijzen
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:block"
            >
              Inloggen
            </button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => openAuth('register')}
            >
              Start Gratis <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </header>
        <section
          ref={heroRef}
          className="relative mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1fr_1.1fr] lg:px-10 lg:pb-32 lg:pt-24"
        >
          <div className="relative z-10 lg:pl-4">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Nieuw: Artisan AI met validatie
              </div>
              <h1 className="mt-4 max-w-[650px] font-display text-5xl font-semibold leading-[0.92] tracking-tight md:text-7xl lg:text-[5.5rem] bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                <span className="block whitespace-nowrap">De Toekomst van</span>
                <span className="block text-primary">Slim Leren</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Transformeer je studiemethode met AI-aangedreven flashcards, dagelijkse quizzen en
                wetenschappelijk bewezen herhalingstechnieken. Ontworpen voor maximale retentie met
                minimale inspanning.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 h-12 px-8"
                  onClick={() => openAuth('register')}
                >
                  Start Gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8"
                  onClick={() =>
                    document.getElementById('functies')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Bekijk Functies
                </Button>
                <Link href="/quiz/daily">
                  <Button size="lg" variant="secondary" className="h-12 px-8">
                    <Brain className="mr-2 h-4 w-4" />
                    Start Daily Quiz
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Volledig gratis
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Geen creditcard nodig
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Direct beginnen
                </div>
              </div>
            </Reveal>
          </div>
          <motion.div style={{ y: heroY }} className="relative z-0">
            <HeroWorkspace />
          </motion.div>
          <motion.a
            href="#functies"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[11px] tracking-[0.15em] text-muted-foreground sm:flex"
          >
            Ontdek meer
            <ArrowDown className="h-5 w-5" />
          </motion.a>
        </section>
        <section
          id="artisan"
          className="relative border-y border-border bg-gradient-to-b from-primary/[0.05] to-primary/[0.02] px-6 py-32 lg:px-10 lg:py-40"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <SectionIntro
                  eyebrow="Artisan AI"
                  title="Premium Kwaliteit, Geen Compromis"
                  description="Artisan AI levert de hoogste kwaliteit flashcards door uitgebreide validatie en hallucinatie-preventie. Dit betekent iets meer wachttijd, maar het resultaat is altijd correct en betrouwbaar."
                />
                <div className="mt-10 space-y-6">
                  <Reveal delay={0.1}>
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Uitgebreide Validatie</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Elke flashcard wordt meerdere keren gecontroleerd op nauwkeurigheid,
                          relevantie en didactische waarde voordat deze wordt opgeslagen.
                        </p>
                      </div>
                    </div>
                  </Reveal>
                  <Reveal delay={0.2}>
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Hallucinatie-Preventie</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Geavanceerde AI-technieken voorkomen onjuiste informatie. Alleen
                          geverifieerde feiten worden omgezet in leerkaarten.
                        </p>
                      </div>
                    </div>
                  </Reveal>
                  <Reveal delay={0.3}>
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Contextueel Begrip</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          De AI begrijpt de context van je studiemateriaal en creëert kaarten die
                          perfect passen bij je leerdoelen.
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
              <Reveal className="lg:order-first" delay={0.15}>
                <ArtisanFlowPreview />
              </Reveal>
            </div>
            <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/[0.03] p-8">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-4xl font-display font-semibold text-primary">99.2%</p>
                  <p className="mt-2 text-sm text-muted-foreground">Nauwkeurigheid</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-display font-semibold text-primary">3x</p>
                  <p className="mt-2 text-sm text-muted-foreground">Validatie Rondes</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-display font-semibold text-primary">0%</p>
                  <p className="mt-2 text-sm text-muted-foreground">Hallucinaties</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="functies" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionIntro
            eyebrow="Premium Functies"
            title="Geavanceerde Leertools"
            description="Ontdek de functies die Aether onderscheiden van traditionele leermethoden"
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {premiumFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
          <Reveal className="mt-14">
            <SubjectFoldersPreview />
          </Reveal>
        </section>
        <section
          id="werkwijze"
          className="border-y border-border bg-primary/[0.03] px-6 py-24 lg:px-10 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <SectionIntro
                eyebrow={t('home_how_eyebrow')}
                title={t('home_how_title')}
                description={t('home_how_desc')}
              />
              <div className="mt-10 space-y-8">
                {howSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <Reveal key={String(step.number)} delay={index * 0.06}>
                      <div className="flex gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {String(step.number)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <StepIcon className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{t(step.titleKey)}</h3>
                          </div>
                          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            {t(step.textKey)}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
            <Reveal>
              <div className="relative rounded-3xl border border-border bg-card p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('home_mock_journey_title')}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
                    {t('home_mock_journey_status')}
                  </span>
                </div>
                <div className="space-y-3">
                  {journeyRows.map((row, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
                    >
                      <span className="text-sm font-medium">{row.title}</span>
                      <span className="text-xs text-muted-foreground">{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionIntro
            eyebrow={t('home_deeper_eyebrow')}
            title={t('home_deeper_title')}
            description={t('home_deeper_desc')}
          />
          <div className="mt-16 space-y-24">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                <div>
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-4xl font-semibold">{t('home_notes_title')}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t('home_notes_text')}
                  </p>
                  <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                    {[t('home_notes_b1'), t('home_notes_b2'), t('home_notes_b3')].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <NotesPreview />
              </div>
            </Reveal>
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                <GraphPreview />
                <div>
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Network className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-4xl font-semibold">{t('home_graph_title')}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t('home_graph_text')}
                  </p>
                  <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                    {[t('home_graph_b1'), t('home_graph_b2'), t('home_graph_b3')].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
                <div>
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Brain className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-4xl font-semibold">{t('home_review_title')}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t('home_review_text')}
                  </p>
                  <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                    {[t('home_review_b1'), t('home_review_b2'), t('home_review_b3')].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <ReviewPreview />
              </div>
            </Reveal>
          </div>
        </section>
        <section className="border-y border-border bg-primary/[0.03] px-6 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow={t('home_modes_eyebrow')}
              title={t('home_modes_title')}
              description={t('home_modes_desc')}
            />
            <div className="mt-12 flex gap-2 overflow-x-auto pb-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium transition-all ${activeMode === mode.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(mode.labelKey)}
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMode.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center"
              >
                <div>
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CurrentModeIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-4xl font-semibold">{t(currentMode.titleKey)}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t(currentMode.textKey)}
                  </p>
                </div>
                <ModeVisual id={currentMode.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionIntro
            eyebrow={t('home_playful_eyebrow')}
            title={t('home_playful_title')}
            description={t('home_playful_desc')}
          />
          <Reveal className="mt-12">
            <PlayfulLearningPreview />
          </Reveal>
        </section>
        <section id="prijzen" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionIntro
            centered
            eyebrow={t('home_pricing_eyebrow')}
            title={t('home_pricing_title')}
            description={t('home_pricing_desc')}
          />
          <div className="mx-auto mt-14 max-w-xl">
            <Reveal>
              <Card className="border-primary/30 bg-primary/[0.04] p-8 shadow-xl shadow-blue-500/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t('home_pricing_plan')}</p>
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                    {t('home_pricing_badge')}
                  </span>
                </div>
                <p className="mt-7 font-display text-6xl font-semibold">€0</p>
                <p className="mt-2 text-sm text-muted-foreground">{t('home_pricing_caption')}</p>
                <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  {pricingItems.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="mt-9 w-full" size="lg" onClick={() => openAuth('register')}>
                  {t('home_pricing_cta')}
                </Button>
              </Card>
            </Reveal>
          </div>
        </section>
        <footer className="border-t border-border bg-primary/[0.03] px-6 py-12 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Slim leren met AI-aangedreven technologie voor maximale retentie en efficiëntie.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Link href="/privacy" className="transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-primary">
                Algemene voorwaarden
              </Link>
              <a href="#werkwijze" className="transition-colors hover:text-primary">
                Over ons
              </a>
              <a href="mailto:hallo@aether.study" className="transition-colors hover:text-primary">
                Contact
              </a>
            </div>
          </div>
          <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© 2024 Aether. Alle rechten voorbehouden.</span>
            <span>Gemaakt met passie voor leren.</span>
          </div>
        </footer>
      </main>
    </ClientProviders>
  );
}

export default HomePage;
