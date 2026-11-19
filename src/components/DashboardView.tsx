import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  CalendarClock,
  CheckCircle2,
  Compass,
  ExternalLink,
  Flame,
  Globe,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import type {
  AcademicMonth,
  AuditSession,
  GradingSchemeConfig,
  OperationalDay,
  UserRole,
} from '../types/audit';
import {
  ACADEMIC_MONTHS,
  OPERATIONAL_DAYS,
  computeTermAccumulation,
  detectAnomalies,
  formatCashVariance,
  formatIdr,
  formatWaste,
  getActiveSessions,
  getLetterGrade,
} from '../utils/calculations';
import { AnimatedNumber, ScoreProgressRing } from './GlassPrimitives';

interface StrengthPoint {
  title: string;
  metric: string;
  detail: string;
}

interface ImprovementPoint {
  title: string;
  impact: string;
  action: string;
}

interface AiInsightResult {
  executiveSummary: string;
  topStrengths: StrengthPoint[];
  urgentImprovements: ImprovementPoint[];
  modelUsed: string;
  generatedAt: string;
}

interface BenchmarkResult {
  answer: string;
  sources: { uri: string; title: string }[];
  modelUsed: string;
  generatedAt: string;
}

export function DashboardView({
  sessions,
  monthFilter,
  role,
  gradingScheme,
  onUpdateGradingScheme,
  onInspectSession,
  onEditSession,
  onNavigateForm,
  onOpenPrintReport,
  onNavigateAnalyzer,
}: {
  sessions: AuditSession[];
  monthFilter: AcademicMonth | 'Semua';
  role: UserRole;
  gradingScheme: GradingSchemeConfig;
  onUpdateGradingScheme: (next: GradingSchemeConfig) => void;
  onInspectSession: (session: AuditSession) => void;
  onEditSession: (session: AuditSession) => void;
  onNavigateForm: () => void;
  onOpenPrintReport: (session: AuditSession) => void;
  onNavigateAnalyzer: () => void;
}) {
  const filteredSessions = useMemo(() => {
    if (monthFilter === 'Semua') return sessions;
    return sessions.filter((s) => s.month === monthFilter);
  }, [sessions, monthFilter]);

  const termStats = useMemo(() => computeTermAccumulation(filteredSessions), [filteredSessions]);
  const fullTermStats = useMemo(() => computeTermAccumulation(sessions), [sessions]);
  const anomalies = useMemo(() => detectAnomalies(filteredSessions), [filteredSessions]);

  const activeOrdered = useMemo(
    () =>
      getActiveSessions(filteredSessions)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredSessions]
  );

  // Cumulative 3-month running average calculated chronologically across all active sessions
  const cumulativeScoreMap = useMemo(() => {
    const allActiveChrono = getActiveSessions(sessions)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    const map = new Map<string, number>();
    let sum = 0;
    allActiveChrono.forEach((s, i) => {
      sum += s.weightedScore;
      map.set(s.id, Math.round((sum / (i + 1)) * 10) / 10);
    });
    return map;
  }, [sessions]);

  const anomaliesBySessionId = useMemo(() => {
    const map = new Map<string, typeof anomalies>();
    for (const a of anomalies) {
      const list = map.get(a.sessionId) || [];
      list.push(a);
      map.set(a.sessionId, list);
    }
    return map;
  }, [anomalies]);

  // Recent 3 months sessions for AI Audit Insights card
  const last3MonthsSessions = useMemo(() => {
    const allActive = getActiveSessions(sessions).sort((a, b) => a.date.localeCompare(b.date));
    return allActive.slice(-14); // last ~3 months of active operational shifts
  }, [sessions]);

  const [trendMode, setTrendMode] = useState<'daily' | 'cumulative'>('daily');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showThresholdsEditor, setShowThresholdsEditor] = useState(false);

  useEffect(() => {
    setHoveredIdx(null);
  }, [monthFilter, trendMode]);

  // AI Audit Insights Card State (Auto-runs on mount / session changes)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<AiInsightResult | null>(null);
  const [selectedInsightTab, setSelectedInsightTab] = useState<'both' | 'strengths' | 'improvements'>('both');
  const lastAnalyzedSignatureRef = useRef<string>('');

  // Search Grounding State
  const [benchTopic, setBenchTopic] = useState(
    'standar ideal food waste persen kafe dan ticket time minuman makanan F&B'
  );
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchError, setBenchError] = useState<string | null>(null);
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);

  // Monthly comparison across Sep-Jan
  const monthlyStats = useMemo(() => {
    return ACADEMIC_MONTHS.map((month) => {
      const mSessions = sessions.filter((s) => s.month === month);
      const stats = computeTermAccumulation(mSessions);
      return {
        month,
        ...stats,
      };
    });
  }, [sessions]);

  // Day-of-week comparison (Sel - Jum)
  const dayStats = useMemo(() => {
    return OPERATIONAL_DAYS.map((day: OperationalDay) => {
      const dSessions = filteredSessions.filter((s) => s.day === day);
      const stats = computeTermAccumulation(dSessions);
      return {
        day,
        ...stats,
      };
    });
  }, [filteredSessions]);

  // What-If Projected Final Grade calculation
  const projectedDailyScore = useMemo(() => {
    const completedCount = fullTermStats.activeCount;
    const remCount = gradingScheme.simulatedRemainingSessionsCount;
    if (completedCount + remCount === 0) return 0;
    const total =
      fullTermStats.avgWeightedScore * completedCount +
      gradingScheme.simulatedRemainingDailyScore * remCount;
    return Math.round((total / (completedCount + remCount)) * 10) / 10;
  }, [fullTermStats, gradingScheme]);

  const projectedFinalGradeScore = useMemo(() => {
    const dWeight = gradingScheme.dailyAccumulationWeight / 100;
    const fWeight = gradingScheme.finalPresentationWeight / 100;
    return (
      Math.round(
        (projectedDailyScore * dWeight +
          gradingScheme.simulatedFinalPresentationScore * fWeight) *
          10
      ) / 10
    );
  }, [projectedDailyScore, gradingScheme]);

  const currentLetter = getLetterGrade(termStats.avgWeightedScore, gradingScheme.thresholds);
  const projectedLetter = getLetterGrade(projectedFinalGradeScore, gradingScheme.thresholds);

  const runAiAuditInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const stats3M = computeTermAccumulation(last3MonthsSessions);
      const anomalies3M = detectAnomalies(last3MonthsSessions);

      const payload = {
        focusMonth: 'Akhir Oktober 2026 – Januari 2027 (3 Bulan Operasional Cafe Lab)',
        summaryPayload: {
          analyzedSessionsCount: stats3M.activeCount,
          dateRange:
            last3MonthsSessions.length > 0
              ? `${last3MonthsSessions[0].date} s/d ${
                  last3MonthsSessions[last3MonthsSessions.length - 1].date
                }`
              : '-',
          avgWeightedScore: stats3M.avgWeightedScore,
          avgRubric: stats3M.avgRubric,
          totalRevenueIdr: stats3M.totalRevenueIdr,
          netCashVarianceIdr: stats3M.netCashVarianceIdr,
          exactCashAccuracyRate: `${stats3M.exactCashCount}/${stats3M.activeCount}`,
          avgKitchenWasteGrams: stats3M.avgWasteGrams,
          avgDrinkTicketMin: stats3M.avgDrinkTicketMin,
          avgFoodTicketMin: stats3M.avgFoodTicketMin,
          drinkSlaCompliancePct: stats3M.drinkSlaRate,
          foodSlaCompliancePct: stats3M.foodSlaRate,
          totalQrFeedback: stats3M.totalQrFeedback,
          recentAnomalies: anomalies3M.slice(0, 5).map((a) => ({
            date: a.date,
            category: a.category,
            detail: a.title,
          })),
        },
      };

      const res = await fetch('/api/gemini/audit-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menjalankan analisis evaluasi 3 bulan.');
      setAiInsight(data);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses ringkasan evaluasi 3 bulan.'
      );
    } finally {
      setAiLoading(false);
    }
  }, [last3MonthsSessions]);

  // Automatic execution when dashboard mounts or underlying session scores change
  useEffect(() => {
    const signature = last3MonthsSessions
      .map((s) => `${s.id}:${s.weightedScore}:${s.cashVarianceIdr}:${s.kitchenWasteGrams}`)
      .join('|');
    if (signature && signature !== lastAnalyzedSignatureRef.current) {
      lastAnalyzedSignatureRef.current = signature;
      runAiAuditInsights();
    }
  }, [last3MonthsSessions, runAiAuditInsights]);

  const handleRunSearchBenchmark = async () => {
    setBenchLoading(true);
    setBenchError(null);
    try {
      const res = await fetch('/api/gemini/industry-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: benchTopic,
          currentMetrics: {
            avgDrinkTicketMin: termStats.avgDrinkTicketMin,
            avgFoodTicketMin: termStats.avgFoodTicketMin,
            avgWasteGramsPerShift: termStats.avgWasteGrams,
            avgRevenueIdrPerShift: termStats.avgRevenueIdr,
            exactCashAccuracyCount: `${termStats.exactCashCount} dari ${termStats.activeCount} shift`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil benchmark Google Search.');
      setBenchResult(data);
    } catch (err: unknown) {
      setBenchError(err instanceof Error ? err.message : 'Terjadi kesalahan Search Grounding.');
    } finally {
      setBenchLoading(false);
    }
  };

  // Chart geometry
  const chartW = 720;
  const chartH = 220;
  const padL = 38;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const points = activeOrdered.map((s, idx) => {
    const x =
      activeOrdered.length <= 1
        ? padL + innerW / 2
        : padL + (idx / (activeOrdered.length - 1)) * innerW;
    const cumulativeScore = cumulativeScoreMap.get(s.id) ?? s.weightedScore;
    const displayedScore = trendMode === 'daily' ? s.weightedScore : cumulativeScore;
    const yScore = Math.max(60, Math.min(100, displayedScore));
    const y = padT + ((100 - yScore) / 40) * innerH;
    const sessionAnomalies = anomaliesBySessionId.get(s.id) || [];
    const flaggedFinding = s.checklist.find(
      (c) => c.status !== 'sesuai' && c.findingNote.trim().length > 0
    );
    return {
      x,
      y,
      session: s,
      displayedScore,
      cumulativeScore,
      sessionAnomalies,
      flaggedFinding,
    };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : '';

  const wasteDisplay = formatWaste(termStats.totalWasteGrams);
  const latestActiveSession = activeOrdered[activeOrdered.length - 1] || sessions[0];

  const springCardTransition = { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.85 };

  return (
    <LayoutGroup id="dashboard-cards">
      <div className="space-y-6">
        {/* Row 1: 4-Card KPI Strip with Framer Motion Layout & Hover Expansion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.99 }}
            transition={springCardTransition}
            className="glass-panel glass-panel-interactive rounded-2xl p-5 flex items-center justify-between gap-4 cursor-default"
          >
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-medium text-slate-500">Akumulasi Skor Tertimbang</p>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={termStats.avgWeightedScore}
                  decimals={1}
                  className="text-3xl font-bold text-slate-900"
                />
                <span className="text-sm font-mono-num text-slate-400">/ 100</span>
              </div>
              <p className="text-xs text-slate-600">
                Mutu <span className="font-semibold text-emerald-700">{currentLetter.letter}</span> · IP{' '}
                <span className="font-mono-num">{currentLetter.gpaPoint.toFixed(1)}</span> ·{' '}
                {monthFilter === 'Semua' ? 'Okt 2026–Jan 2027' : monthFilter}
              </p>
            </div>
            <ScoreProgressRing
              score={termStats.avgWeightedScore}
              size={78}
              strokeWidth={7}
              color="#059669"
            />
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.99 }}
            transition={{ ...springCardTransition, delay: 0.04 }}
            className="glass-panel glass-panel-interactive rounded-2xl p-5 space-y-2 cursor-default"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Sesi Aktif &amp; Pengecualian Libur</p>
              <CalendarClock className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={termStats.activeCount}
                className="text-3xl font-bold text-slate-900"
              />
              <span className="text-xs text-slate-500">sesi dinilai</span>
            </div>
            <p className="text-xs text-slate-600">
              <span className="font-mono-num font-medium text-amber-700">
                {termStats.posTransitionCount} transisi POS
              </span>{' '}
              ·{' '}
              <span className="font-mono-num text-slate-500">
                {termStats.holidayCount} hari libur dikecualikan
              </span>
            </p>
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.99 }}
            transition={{ ...springCardTransition, delay: 0.08 }}
            className="glass-panel glass-panel-interactive rounded-2xl p-5 space-y-2 cursor-default"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Total Omset &amp; Rekonsiliasi Kas</p>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <AnimatedNumber
                value={termStats.totalRevenueIdr}
                prefix="IDR "
                className="text-2xl font-bold text-slate-900 block truncate"
              />
            </div>
            <p className="text-xs text-slate-600">
              <span className="font-mono-num font-medium text-emerald-700">
                {termStats.exactCashCount}/{termStats.activeCount} sesi IDR 0
              </span>{' '}
              · Net{' '}
              <span
                className={`font-mono-num ${
                  termStats.netCashVarianceIdr === 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {formatCashVariance(termStats.netCashVarianceIdr)}
              </span>
            </p>
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.99 }}
            transition={{ ...springCardTransition, delay: 0.12 }}
            className="glass-panel glass-panel-interactive rounded-2xl p-5 space-y-2 cursor-default"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Kitchen Waste &amp; Kepatuhan SLA</p>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-num text-2xl font-bold text-slate-900">
                {wasteDisplay.kgText}
              </span>
              <span className="font-mono-num text-xs text-slate-500">({wasteDisplay.gramsText})</span>
            </div>
            <p className="text-xs text-slate-600">
              SLA Minuman &lt;5m:{' '}
              <span className="font-mono-num font-semibold text-emerald-700">
                {termStats.drinkSlaRate}%
              </span>{' '}
              · Makanan &lt;10m:{' '}
              <span className="font-mono-num font-semibold text-blue-700">
                {termStats.foodSlaRate}%
              </span>
            </p>
          </motion.div>
        </div>

        {/* Row 2: Dedicated Interactive 'Ringkasan Evaluasi & Rekomendasi 3 Bulan' Card */}
        <motion.div
          layout
          transition={springCardTransition}
          className="glass-panel rounded-2xl p-6 space-y-5 relative overflow-hidden"
        >
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Ringkasan Evaluasi &amp; Rekomendasi 3 Bulan
                </h2>
                <p className="text-xs text-slate-500">
                  Analisis otomatis 3 bulan terakhir ({last3MonthsSessions.length} sesi aktif) · 3 Kekuatan Utama &amp; 3 Perbaikan Mendesak
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LayoutGroup id="ai-insight-tabs">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  {(
                    [
                      { id: 'both', label: 'Semua' },
                      { id: 'strengths', label: '3 Kekuatan' },
                      { id: 'improvements', label: '3 Perbaikan' },
                    ] as const
                  ).map((t) => {
                    const isActive = selectedInsightTab === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedInsightTab(t.id)}
                        className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          isActive
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="aiInsightTabBg"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-md bg-white shadow-xs"
                          />
                        )}
                        <span className="relative z-10">{t.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>

              {latestActiveSession && (
                <motion.button
                  type="button"
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenPrintReport(latestActiveSession)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  Cetak Laporan Audit
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={runAiAuditInsights}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Menganalisis...' : 'Perbarui Analisis'}
              </motion.button>
            </div>
          </div>

        {aiError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-center justify-between gap-3 text-xs text-rose-800">
            <span>{aiError}</span>
            <button
              type="button"
              onClick={runAiAuditInsights}
              className="rounded-lg bg-rose-700 px-3 py-1 font-semibold text-white hover:bg-rose-800 shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {aiLoading && !aiInsight ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-2.5 animate-pulse">
                <div className="h-4 w-44 rounded bg-slate-200/80" />
                <div className="h-20 rounded-xl bg-slate-100/90" />
                <div className="h-20 rounded-xl bg-slate-100/90" />
                <div className="h-20 rounded-xl bg-slate-100/90" />
              </div>
            ))}
          </div>
        ) : aiInsight ? (
          <div className="space-y-4 relative">
            <div className="rounded-xl border border-emerald-200/70 bg-white/75 px-4 py-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-emerald-800">Sintesis 3 Bulan Terakhir: </span>
              {aiInsight.executiveSummary}
            </div>

            <motion.div
              layout
              transition={springCardTransition}
              className={`grid grid-cols-1 ${
                selectedInsightTab === 'both' ? 'lg:grid-cols-2' : ''
              } gap-5`}
            >
              {/* 3 Poin Kekuatan Utama */}
              {(selectedInsightTab === 'both' || selectedInsightTab === 'strengths') && (
                <motion.div layout="position" className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      3 Poin Kekuatan Utama
                    </span>
                    <span className="font-mono-num text-emerald-700">Terverifikasi Data</span>
                  </div>
                  <div className="space-y-2.5">
                    {aiInsight.topStrengths.slice(0, 3).map((item, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2, scale: 1.012 }}
                        transition={{ ...springCardTransition, delay: idx * 0.04 }}
                        className="rounded-xl border border-emerald-200/80 bg-emerald-50/45 p-3.5 hover:bg-emerald-50/85 hover:shadow-sm transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">
                            0{idx + 1}. {item.title}
                          </p>
                          <span className="font-mono-num text-xs font-semibold text-emerald-800 shrink-0">
                            {item.metric}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 3 Poin Perbaikan Mendesak */}
              {(selectedInsightTab === 'both' || selectedInsightTab === 'improvements') && (
                <motion.div layout="position" className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span className="inline-flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      3 Poin Perbaikan Mendesak
                    </span>
                    <button
                      type="button"
                      onClick={onNavigateAnalyzer}
                      className="text-blue-700 hover:underline font-semibold"
                    >
                      Buka Analyzer →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {aiInsight.urgentImprovements.slice(0, 3).map((item, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2, scale: 1.012 }}
                        transition={{ ...springCardTransition, delay: idx * 0.04 }}
                        className="rounded-xl border border-amber-200/85 bg-amber-50/50 p-3.5 hover:bg-amber-50/90 hover:shadow-sm transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">
                            0{idx + 1}. {item.title}
                          </p>
                          <span className="text-[11px] font-semibold text-rose-700 shrink-0">
                            Prioritas
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium text-amber-900">Risiko:</span> {item.impact}
                        </p>
                        <p className="text-xs text-slate-700 mt-1">
                          <span className="font-medium text-blue-800">Tindakan:</span> {item.action}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        ) : null}
      </motion.div>

      {/* Row 3: Main Trend Chart + Rubric & Day Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 cols: Animated Moving Score Trend Chart */}
        <motion.div
          layout
          whileHover={{ y: -3, scale: 1.006 }}
          transition={springCardTransition}
          className="lg:col-span-8 glass-panel glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${monthFilter}-${trendMode}-header`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-base font-semibold text-slate-900">
                  {trendMode === 'daily'
                    ? 'Tren Skor Operasional Harian (Selasa–Jumat)'
                    : 'Tren Rata-Rata Akumulasi 3 Bulan (Selasa–Jumat)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arahkan kursor pada titik untuk melihat catatan audit &amp; anomali, atau klik untuk detail sesi
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-2.5">
              <LayoutGroup id="trend-mode-toggle">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                  {(
                    [
                      { id: 'daily', label: 'Skor Harian' },
                      { id: 'cumulative', label: 'Akumulasi 3 Bulan' },
                    ] as const
                  ).map((mode) => {
                    const isActive = trendMode === mode.id;
                    return (
                      <motion.button
                        key={mode.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setTrendMode(mode.id)}
                        className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'text-emerald-800 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="trendModeActiveBg"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-md bg-white shadow-xs"
                          />
                        )}
                        <span className="relative z-10">{mode.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>

              <button
                type="button"
                onClick={onNavigateForm}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap shrink-0"
              >
                Input Baru
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {activeOrdered.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500">Belum ada sesi aktif pada bulan ini.</p>
              <button
                type="button"
                onClick={onNavigateForm}
                className="mt-2 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
              >
                Catat Sesi Pertama
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-56 min-w-[540px]">
                  <defs>
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.26" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="scoreStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {[60, 70, 80, 90, 100].map((val) => {
                    const y = padT + ((100 - val) / 40) * innerH;
                    return (
                      <g key={val}>
                        <line
                          x1={padL}
                          x2={chartW - padR}
                          y1={y}
                          y2={y}
                          stroke={val === 80 ? 'rgba(5,150,105,0.4)' : 'rgba(148,163,184,0.22)'}
                          strokeDasharray={val === 80 ? '4 4' : undefined}
                          strokeWidth={1}
                        />
                        <text
                          x={padL - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 text-[10px] font-mono"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  <AnimatePresence mode="wait">
                    <motion.g
                      key={`${monthFilter}-${trendMode}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4, transition: { duration: 0.16, ease: 'easeOut' } }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {areaPath && (
                        <motion.path
                          d={areaPath}
                          fill="url(#scoreAreaGrad)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.92, 0.78, 0.92] }}
                          transition={{
                            opacity: {
                              duration: 3.6,
                              times: [0, 0.22, 0.62, 1],
                              ease: 'easeOut',
                              delay: 0.14,
                            },
                          }}
                        />
                      )}

                      {/* Animated Subtle Vertical Momentum Columns with Staggered Entry Fade-In */}
                      {points.map((pt, idx) => {
                        const baseBottom = padT + innerH;
                        const barHeight = Math.max(4, baseBottom - pt.y);
                        return (
                          <motion.rect
                            key={`bar-${pt.session.id}`}
                            x={pt.x - 4}
                            width={8}
                            rx={3}
                            fill={
                              hoveredIdx === idx
                                ? 'rgba(5, 150, 105, 0.28)'
                                : pt.sessionAnomalies.length > 0
                                ? 'rgba(225, 29, 72, 0.14)'
                                : 'rgba(5, 150, 105, 0.09)'
                            }
                            initial={{ y: baseBottom, height: 0, opacity: 0 }}
                            animate={{
                              y: pt.y,
                              height: barHeight,
                              opacity: 1,
                            }}
                            transition={{
                              y: {
                                type: 'spring',
                                stiffness: 250,
                                damping: 24,
                                delay: 0.06 + Math.min(idx * 0.022, 0.4),
                              },
                              height: {
                                type: 'spring',
                                stiffness: 250,
                                damping: 24,
                                delay: 0.06 + Math.min(idx * 0.022, 0.4),
                              },
                              opacity: {
                                duration: 0.3,
                                delay: 0.06 + Math.min(idx * 0.022, 0.4),
                              },
                            }}
                          />
                        );
                      })}

                      {/* Base Trend Path: Framer Motion Path Drawing on Month/Mode Switch */}
                      {linePath && points.length > 1 && (
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke="url(#scoreStrokeGrad)"
                          strokeWidth={2.75}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{
                            pathLength: { duration: 0.88, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.24, ease: 'easeOut' },
                          }}
                        />
                      )}

                      {/* Continuous Flowing Emerald Energy Stream Entering After Path Drawing */}
                      {linePath && points.length > 1 && (
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke="rgba(52, 211, 153, 0.92)"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeDasharray="18 42"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, strokeDashoffset: [0, -120] }}
                          transition={{
                            opacity: { duration: 0.42, delay: 0.56, ease: 'easeOut' },
                            strokeDashoffset: { duration: 2.6, repeat: Infinity, ease: 'linear' },
                          }}
                        />
                      )}

                      {/* Traveling Luminous Tracer Dot Appearing After Path Draw */}
                      {linePath && points.length > 1 && (
                        <motion.g
                          className="pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.35, delay: 0.68 }}
                        >
                          <circle r="7" fill="rgba(16, 185, 129, 0.24)">
                            <animateMotion dur="5.2s" repeatCount="indefinite" path={linePath} />
                          </circle>
                          <circle r="3.4" fill="#059669" stroke="#ffffff" strokeWidth="1.5">
                            <animateMotion dur="5.2s" repeatCount="indefinite" path={linePath} />
                          </circle>
                        </motion.g>
                      )}

                      {/* Interactive Crosshair Guideline on Hover */}
                      {hoveredIdx !== null && points[hoveredIdx] && (
                        <motion.line
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            x1: points[hoveredIdx].x,
                            x2: points[hoveredIdx].x,
                          }}
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          y1={padT}
                          y2={padT + innerH}
                          stroke="rgba(5, 150, 105, 0.5)"
                          strokeWidth={1.25}
                          strokeDasharray="3 3"
                        />
                      )}

                      {points.map((pt, idx) => {
                        const isPos = pt.session.isPosTransition;
                        const isLow = pt.session.weightedScore < 76;
                        const hasAnomaly = pt.sessionAnomalies.length > 0;
                        const hasNote = pt.session.auditorSummaryNote.trim().length > 0;
                        const dotColor =
                          isLow || pt.sessionAnomalies.some((a) => a.severity === 'critical')
                            ? '#dc2626'
                            : isPos || hasAnomaly
                            ? '#d97706'
                            : '#059669';
                        const isHover = hoveredIdx === idx;
                        const isLatest = idx === points.length - 1;
                        const pointDelay = Math.min(0.14 + idx * 0.025, 0.68);
                        return (
                          <motion.g
                            key={pt.session.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Audit ${pt.session.day} ${pt.session.date}, Skor Tertimbang ${pt.session.weightedScore.toFixed(1)}`}
                            className="cursor-pointer outline-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.28, delay: pointDelay, ease: 'easeOut' }}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx((curr) => (curr === idx ? null : curr))}
                            onFocus={() => setHoveredIdx(idx)}
                            onBlur={() => setHoveredIdx((curr) => (curr === idx ? null : curr))}
                            onClick={() => onInspectSession(pt.session)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onInspectSession(pt.session);
                              }
                            }}
                          >
                            {/* Generous invisible hit area for effortless point hover */}
                            <circle cx={pt.x} cy={pt.y} r={18} fill="transparent" />

                            {/* Hover Focus Halo Ring */}
                            {isHover && (
                              <motion.circle
                                cx={pt.x}
                                cy={pt.y}
                                r={11}
                                fill="rgba(5, 150, 105, 0.12)"
                                stroke="rgba(5, 150, 105, 0.45)"
                                strokeWidth={1.25}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                              />
                            )}

                            {/* Interactive Anomaly / Finding Ring & Marker above point */}
                            {hasAnomaly && (
                              <motion.g
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, delay: pointDelay + 0.06 }}
                              >
                                <motion.circle
                                  cx={pt.x}
                                  cy={Math.max(10, pt.y - 14)}
                                  r={6.5}
                                  fill="#fff1f2"
                                  stroke={dotColor}
                                  strokeWidth={1.4}
                                  animate={{ scale: isHover ? 1.25 : 1 }}
                                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                                  style={{ transformOrigin: `${pt.x}px ${Math.max(10, pt.y - 14)}px` }}
                                />
                                <text
                                  x={pt.x}
                                  y={Math.max(13, pt.y - 11)}
                                  textAnchor="middle"
                                  fontSize="8.5"
                                  fontWeight="700"
                                  fill={dotColor}
                                >
                                  !
                                </text>
                              </motion.g>
                            )}

                            {/* Subtle Note Indicator Ring when session has auditor notes without anomaly */}
                            {!hasAnomaly && hasNote && (
                              <motion.circle
                                cx={pt.x}
                                cy={pt.y}
                                r={6.8}
                                fill="none"
                                stroke="rgba(29, 78, 216, 0.32)"
                                strokeWidth={1.2}
                                strokeDasharray="2 2"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: isHover ? 1.35 : 1, opacity: 1 }}
                                transition={{
                                  scale: { type: 'spring', stiffness: 320, damping: 24 },
                                  opacity: { duration: 0.25, delay: pointDelay + 0.04 },
                                }}
                                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                              />
                            )}

                            {isLatest && (
                              <motion.circle
                                cx={pt.x}
                                cy={pt.y}
                                r={8}
                                fill="none"
                                stroke={dotColor}
                                strokeWidth={1.5}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                  scale: [0.9, 1.65, 0.9],
                                  opacity: [0.65, 0.1, 0.65],
                                }}
                                transition={{
                                  scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: pointDelay },
                                  opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: pointDelay },
                                }}
                                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                              />
                            )}

                            <motion.circle
                              cx={pt.x}
                              cy={pt.y}
                              r={4.3}
                              fill="#ffffff"
                              stroke={dotColor}
                              strokeWidth={2.5}
                              initial={{ scale: 0 }}
                              animate={{ scale: isHover ? 1.6 : 1 }}
                              transition={{
                                scale: {
                                  type: 'spring',
                                  stiffness: 420,
                                  damping: 22,
                                  delay: isHover ? 0 : pointDelay,
                                },
                              }}
                              style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                            />

                            {(idx % Math.max(1, Math.floor(points.length / 7)) === 0 ||
                              idx === points.length - 1) && (
                              <motion.text
                                x={pt.x}
                                y={chartH - 10}
                                textAnchor="middle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.25, delay: pointDelay }}
                                className="fill-slate-500 text-[10px] font-mono"
                              >
                                {pt.session.date.slice(5)}
                              </motion.text>
                            )}
                          </motion.g>
                        );
                      })}
                    </motion.g>
                  </AnimatePresence>
                </svg>
              </div>

              {/* Floating Framer Motion Interactive Tooltip on Data Point Hover */}
              <AnimatePresence>
                {hoveredIdx !== null && points[hoveredIdx] && (() => {
                  const pt = points[hoveredIdx];
                  const s = pt.session;
                  const xPct = (pt.x / chartW) * 100;
                  const yPct = (pt.y / chartH) * 100;
                  const anchorSide = xPct > 68 ? 'right' : xPct < 24 ? 'left' : 'center';
                  const showBelow = pt.y < 105;
                  return (
                    <motion.div
                      key={`tooltip-${s.id}`}
                      role="tooltip"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        left:
                          anchorSide === 'right'
                            ? 'auto'
                            : anchorSide === 'left'
                            ? `${Math.max(2, xPct)}%`
                            : `${xPct}%`,
                        right: anchorSide === 'right' ? `${Math.max(2, 100 - xPct)}%` : 'auto',
                        top: showBelow
                          ? `${Math.min(72, yPct + 8)}%`
                          : `${Math.max(2, yPct - 6)}%`,
                        transform:
                          anchorSide === 'center'
                            ? showBelow
                              ? 'translate(-50%, 0)'
                              : 'translate(-50%, -100%)'
                            : showBelow
                            ? 'translate(0, 0)'
                            : 'translate(0, -100%)',
                      }}
                      className="pointer-events-none hidden sm:block absolute z-30 w-72"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: showBelow ? -6 : 6, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                        className="rounded-xl border border-emerald-200/90 bg-white/95 backdrop-blur-md p-3.5 shadow-xl space-y-2"
                      >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <p className="text-[10px] font-medium text-emerald-700">
                            Tanggal Audit
                          </p>
                          <p className="text-xs font-bold text-slate-900">
                            {s.day}, {s.date}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {s.shiftManager} · {s.sessionStatus}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-medium text-slate-500">
                            Skor Tertimbang
                          </p>
                          <p className="font-mono-num text-sm font-bold text-emerald-700">
                            {s.weightedScore.toFixed(1)}
                            <span className="text-[11px] font-normal text-slate-400"> / 100</span>
                          </p>
                          <p className="text-[10px] font-mono-num text-slate-500">
                            Kumulatif 3 Bln: {pt.cumulativeScore.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-600">
                        <span>{formatIdr(s.totalRevenueIdr)}</span>
                        <span
                          className={
                            s.cashVarianceIdr === 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'
                          }
                        >
                          Kas: {formatCashVariance(s.cashVarianceIdr)}
                        </span>
                        <span>Waste: {s.kitchenWasteGrams}g</span>
                      </div>

                      {pt.sessionAnomalies.length > 0 && (
                        <div className="rounded-lg border border-rose-200/80 bg-rose-50/75 px-2.5 py-1.5 space-y-0.5">
                          <p className="text-[10px] font-semibold text-rose-800">
                            Anomali Terdeteksi ({pt.sessionAnomalies.length}):
                          </p>
                          {pt.sessionAnomalies.slice(0, 2).map((anom) => (
                            <p key={anom.id} className="text-[11px] text-rose-900 leading-snug">
                              • {anom.title} ({anom.metricValue})
                            </p>
                          ))}
                        </div>
                      )}

                      {(s.auditorSummaryNote || pt.flaggedFinding) && (
                        <div className="text-[11px] text-slate-700 leading-snug space-y-1">
                          {s.auditorSummaryNote && (
                            <p className="line-clamp-2">
                              <span className="font-semibold text-slate-900">Catatan Audit:</span>{' '}
                              {s.auditorSummaryNote}
                            </p>
                          )}
                          {pt.flaggedFinding && (
                            <p className="text-amber-800 line-clamp-1">
                              Temuan #{pt.flaggedFinding.itemNumber}: {pt.flaggedFinding.findingNote}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] font-medium text-emerald-700">
                        Klik titik untuk detail lengkap &amp; cetak PDF
                      </p>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Mobile / Compact Animated Tooltip Strip below chart when hovering/tapping */}
              <AnimatePresence>
                {hoveredIdx !== null && points[hoveredIdx] && (
                  <motion.div
                    key={`mobile-tooltip-${points[hoveredIdx].session.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="sm:hidden mt-2 rounded-xl border border-emerald-200 bg-white/95 p-3 text-xs space-y-1 shadow-sm"
                  >
                    <div className="flex justify-between items-baseline font-semibold text-slate-900">
                      <span>
                        {points[hoveredIdx].session.day}, {points[hoveredIdx].session.date}
                      </span>
                      <span className="font-mono-num text-emerald-700">
                        Skor {points[hoveredIdx].session.weightedScore.toFixed(1)} / 100
                      </span>
                    </div>
                    <p className="text-[11px] font-mono-num text-slate-500">
                      Kumulatif 3 Bulan: {points[hoveredIdx].cumulativeScore.toFixed(1)}
                    </p>
                    {points[hoveredIdx].sessionAnomalies.length > 0 && (
                      <p className="text-rose-700 font-medium">
                        Anomali: {points[hoveredIdx].sessionAnomalies[0].title}
                      </p>
                    )}
                    {points[hoveredIdx].session.auditorSummaryNote && (
                      <p className="text-slate-600">
                        {points[hoveredIdx].session.auditorSummaryNote}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-emerald-700 font-medium">Hijau: Normal</span>
              <span>·</span>
              <span className="text-amber-700 font-medium">Amber: Transisi POS</span>
              <span>·</span>
              <span className="text-rose-700 font-medium">Merah / ! : Anomali</span>
              <span>·</span>
              <span className="text-blue-700 font-medium">Cincin Putus: Catatan Audit</span>
            </div>
            <span>Garis putus-putus = Target Mutu A- (80.0)</span>
          </div>
        </motion.div>

        {/* Right 4 cols: 4 Rubrik Bobot & Day-of-Week */}
        <motion.div
          layout
          whileHover={{ y: -3, scale: 1.008 }}
          transition={springCardTransition}
          className="lg:col-span-4 glass-panel glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">Perbandingan 4 Rubrik Berbobot</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rata-rata pencapaian tiap aspek penilaian</p>

            <div className="mt-4 space-y-3.5">
              {[
                { label: 'Financial & Cash Flow (30%)', val: termStats.avgRubric.financial, color: 'bg-emerald-600' },
                { label: 'BOH & FOH Execution (25%)', val: termStats.avgRubric.operational, color: 'bg-blue-700' },
                { label: 'Customer Service & L.A.S.T (20%)', val: termStats.avgRubric.service, color: 'bg-teal-600' },
                { label: 'Teamwork & Discipline (25%)', val: termStats.avgRubric.teamwork, color: 'bg-indigo-600' },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <AnimatedNumber
                      value={item.val}
                      decimals={1}
                      className="font-mono-num font-semibold text-slate-900"
                    />
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/75 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.val)}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: idx * 0.06 }}
                      className={`h-full rounded-full relative overflow-hidden ${item.color}`}
                    >
                      <motion.span
                        className="absolute inset-y-0 w-10 bg-white/35 blur-[1px]"
                        animate={{ x: ['-120%', '420%'] }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          repeatDelay: 2.5 + idx * 0.4,
                          ease: 'easeInOut',
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/70">
            <p className="text-xs font-semibold text-slate-700 mb-2.5">
              Performa Antar-Hari Operasional (Sel–Jum)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {dayStats.map((d, idx) => (
                <motion.div
                  key={d.day}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24, delay: idx * 0.04 }}
                  className="rounded-xl border border-slate-200/80 bg-white/75 p-2.5 text-center hover:border-emerald-400 hover:shadow-xs transition-colors cursor-default"
                >
                  <p className="text-xs font-semibold text-slate-600">{d.day}</p>
                  <p className="font-mono-num text-sm font-bold text-slate-900 mt-0.5">
                    {d.activeCount > 0 ? (
                      <AnimatedNumber value={d.avgWeightedScore} decimals={1} />
                    ) : (
                      '-'
                    )}
                  </p>
                  <p className="text-[11px] font-mono-num text-slate-500">{d.activeCount}x</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 4: Monthly Okt 2026-Jan 2027 Comparison + Smart Anomaly Detector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <motion.div
          layout
          whileHover={{ y: -3, scale: 1.008 }}
          transition={springCardTransition}
          className="lg:col-span-5 glass-panel glass-panel-interactive rounded-2xl p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">Rekap Per Bulan (Okt 2026–Jan 2027)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Progres perbaikan 3 bulan · Hari libur dikecualikan
            </p>
          </div>
          <div className="space-y-2.5">
            {monthlyStats.map((m, idx) => {
              const isSelectedMonth = monthFilter === m.month;
              return (
                <motion.div
                  key={m.month}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 26, delay: idx * 0.05 }}
                  className={`rounded-xl border px-3.5 py-2.5 space-y-2 transition-colors ${
                    isSelectedMonth
                      ? 'border-emerald-400 bg-emerald-50/75'
                      : 'border-slate-200/75 bg-white/60 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{m.month}</p>
                      <p className="text-xs text-slate-500">
                        {m.activeCount} aktif
                        {m.holidayCount > 0 ? ` · ${m.holidayCount} libur` : ''} ·{' '}
                        {formatIdr(m.totalRevenueIdr)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-num text-sm font-bold text-emerald-700">
                        {m.activeCount > 0 ? (
                          <>
                            <AnimatedNumber value={m.avgWeightedScore} decimals={1} /> / 100
                          </>
                        ) : (
                          'Belum ada'
                        )}
                      </p>
                      <p className="text-[11px] font-mono-num text-slate-500">
                        Waste avg {m.avgWasteGrams} g
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: m.activeCount > 0 ? `${Math.min(100, m.avgWeightedScore)}%` : '0%',
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: idx * 0.08 }}
                      className="h-full rounded-full bg-emerald-600 relative overflow-hidden"
                    >
                      {m.activeCount > 0 && (
                        <motion.span
                          className="absolute inset-y-0 w-10 bg-white/40 blur-[1px]"
                          animate={{ x: ['-120%', '460%'] }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            repeatDelay: 3.2 + idx * 0.35,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          layout
          whileHover={{ y: -3, scale: 1.006 }}
          transition={springCardTransition}
          className="lg:col-span-7 glass-panel glass-panel-interactive rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Smart Audit Alert &amp; Anomaly Detector
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deteksi otomatis selisih kas mencolok, waste tinggi (&ge; 1.1 kg), dan penurunan skor
              </p>
            </div>
            <span className="font-mono-num text-xs font-semibold text-rose-700">
              <AnimatedNumber value={anomalies.length} /> temuan
            </span>
          </div>

          {anomalies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800"
            >
              Tidak ada anomali operasional signifikan pada rentang filter saat ini.
            </motion.div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {anomalies.slice(0, 6).map((alert, idx) => {
                  const targetSession = sessions.find((s) => s.id === alert.sessionId);
                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      whileHover={{ y: -2, scale: 1.012 }}
                      transition={{ ...springCardTransition, delay: Math.min(idx * 0.04, 0.2) }}
                      className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        alert.severity === 'critical'
                          ? 'border-rose-200 bg-rose-50/65'
                          : 'border-amber-200 bg-amber-50/65'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <motion.span
                            animate={{ scale: [1, 1.14, 1] }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              delay: idx * 0.35,
                              ease: 'easeInOut',
                            }}
                            className="inline-flex"
                          >
                            <AlertTriangle
                              className={`w-3.5 h-3.5 ${
                                alert.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'
                              }`}
                            />
                          </motion.span>
                          <span
                            className={`font-semibold ${
                              alert.severity === 'critical' ? 'text-rose-800' : 'text-amber-800'
                            }`}
                          >
                            {alert.category}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono-num text-slate-600">{alert.date}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono-num font-semibold text-slate-900">
                            {alert.metricValue}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                      </div>
                      {targetSession && (
                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onInspectSession(targetSession)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                          >
                            Detail
                          </motion.button>
                          {role === 'dosen' && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => onEditSession(targetSession)}
                              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
                            >
                              Edit
                            </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 5: Modern Redesigned Simulasi Proyeksi Nilai Akhir + Benchmark Industri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <motion.section
          layout
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 glass-panel glass-panel-interactive rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 relative overflow-hidden"
        >
          {(() => {
            const tierPalette =
              projectedFinalGradeScore >= 80
                ? {
                    textGradient: 'from-emerald-600 via-teal-500 to-cyan-600',
                    surfaceGradient: 'from-emerald-50/70 via-white/95 to-cyan-50/45',
                    borderTint: 'border-emerald-200/70',
                    ringStart: '#059669',
                    ringEnd: '#0891b2',
                    subAccent: 'text-emerald-700',
                    statusLabel: 'Target Mutu Unggulan Tercapai',
                    statusDetail: 'Memenuhi ambang batas minimal A- (80.0)',
                  }
                : projectedFinalGradeScore >= 70
                ? {
                    textGradient: 'from-blue-600 via-indigo-600 to-violet-600',
                    surfaceGradient: 'from-blue-50/70 via-white/95 to-indigo-50/45',
                    borderTint: 'border-blue-200/70',
                    ringStart: '#2563eb',
                    ringEnd: '#4f46e5',
                    subAccent: 'text-blue-700',
                    statusLabel: 'Zona Baik · Mendekati A-',
                    statusDetail: `Butuh +${Math.max(0, 80 - projectedFinalGradeScore).toFixed(1)} poin untuk menembus mutu A-`,
                  }
                : {
                    textGradient: 'from-amber-600 via-orange-600 to-rose-600',
                    surfaceGradient: 'from-amber-50/70 via-white/95 to-orange-50/45',
                    borderTint: 'border-amber-200/70',
                    ringStart: '#d97706',
                    ringEnd: '#e11d48',
                    subAccent: 'text-amber-700',
                    statusLabel: 'Perlu Akselerasi Sisa Sesi',
                    statusDetail: `Butuh +${Math.max(0, 80 - projectedFinalGradeScore).toFixed(1)} poin untuk mencapai A-`,
                  };

            const dailyContribution =
              Math.round(projectedDailyScore * (gradingScheme.dailyAccumulationWeight / 100) * 10) / 10;
            const finalContribution =
              Math.round(
                gradingScheme.simulatedFinalPresentationScore *
                  (gradingScheme.finalPresentationWeight / 100) *
                  10
              ) / 10;

            const sliderConfigs = [
              {
                label: 'Bobot Harian vs Final',
                valueText: `${gradingScheme.dailyAccumulationWeight}% / ${gradingScheme.finalPresentationWeight}%`,
                minLabel: '50%',
                maxLabel: '100%',
                value: gradingScheme.dailyAccumulationWeight,
                min: 50,
                max: 100,
                step: 5,
                disabled: role !== 'dosen',
                trackGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                thumbRing: 'border-emerald-600 focus-visible:ring-emerald-500/30',
                valueColor: 'text-emerald-700',
                onChange: (v: number) =>
                  onUpdateGradingScheme({
                    ...gradingScheme,
                    dailyAccumulationWeight: v,
                    finalPresentationWeight: 100 - v,
                  }),
              },
              {
                label: 'Nilai Presentasi Akhir',
                valueText: `${gradingScheme.simulatedFinalPresentationScore} pts`,
                minLabel: '50 pts',
                maxLabel: '100 pts',
                value: gradingScheme.simulatedFinalPresentationScore,
                min: 50,
                max: 100,
                step: 1,
                disabled: false,
                trackGradient: 'from-teal-500 via-cyan-500 to-sky-500',
                thumbRing: 'border-teal-600 focus-visible:ring-teal-500/30',
                valueColor: 'text-teal-700',
                onChange: (v: number) =>
                  onUpdateGradingScheme({
                    ...gradingScheme,
                    simulatedFinalPresentationScore: v,
                  }),
              },
              {
                label: 'Sesi Tersisa',
                valueText: `${gradingScheme.simulatedRemainingSessionsCount} sesi`,
                minLabel: '0 sesi',
                maxLabel: '16 sesi',
                value: gradingScheme.simulatedRemainingSessionsCount,
                min: 0,
                max: 16,
                step: 1,
                disabled: false,
                trackGradient: 'from-blue-500 via-indigo-500 to-violet-500',
                thumbRing: 'border-blue-600 focus-visible:ring-blue-500/30',
                valueColor: 'text-blue-700',
                onChange: (v: number) =>
                  onUpdateGradingScheme({
                    ...gradingScheme,
                    simulatedRemainingSessionsCount: v,
                  }),
              },
              {
                label: 'Target Skor Sesi Tersisa',
                valueText: `${gradingScheme.simulatedRemainingDailyScore} pts`,
                minLabel: '55 pts',
                maxLabel: '100 pts',
                value: gradingScheme.simulatedRemainingDailyScore,
                min: 55,
                max: 100,
                step: 1,
                disabled: false,
                trackGradient: 'from-indigo-500 via-violet-500 to-fuchsia-500',
                thumbRing: 'border-indigo-600 focus-visible:ring-indigo-500/30',
                valueColor: 'text-indigo-700',
                onChange: (v: number) =>
                  onUpdateGradingScheme({
                    ...gradingScheme,
                    simulatedRemainingDailyScore: v,
                  }),
              },
            ];

            return (
              <>
                {/* Minimalist Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50/90 text-emerald-700 border border-emerald-200/70">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-slate-900">
                        Simulasi Proyeksi Nilai Akhir
                      </h2>
                      <p className="text-xs text-slate-500">
                        Kalkulator skenario akumulasi 3 bulan &amp; presentasi akhir
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        onUpdateGradingScheme({
                          ...gradingScheme,
                          simulatedFinalPresentationScore: 88,
                          simulatedRemainingSessionsCount: 4,
                          simulatedRemainingDailyScore: 88,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset
                    </motion.button>

                    {role === 'dosen' && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowThresholdsEditor((v) => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          showThresholdsEditor
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200/90 bg-white/85 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {showThresholdsEditor ? 'Tutup Skala' : 'Skala Huruf'}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Focal Minimalist Prediction Hero Card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl border ${tierPalette.borderTint} bg-gradient-to-br ${tierPalette.surfaceGradient} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6`}
                >
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`font-semibold ${tierPalette.subAccent}`}>
                        {tierPalette.statusLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>IP {projectedLetter.gpaPoint.toFixed(1)}</span>
                    </div>

                    <div className="flex items-baseline gap-2.5">
                      <span
                        className={`font-mono-num text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r ${tierPalette.textGradient} bg-clip-text text-transparent`}
                      >
                        <AnimatedNumber value={projectedFinalGradeScore} decimals={1} />
                      </span>
                      <span className="font-mono-num text-sm font-medium text-slate-400">
                        / 100
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                      <span>
                        Harian{' '}
                        <strong className="font-mono-num text-slate-900">
                          <AnimatedNumber value={projectedDailyScore} decimals={1} />
                        </strong>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        Presentasi{' '}
                        <strong className="font-mono-num text-slate-900">
                          {gradingScheme.simulatedFinalPresentationScore}
                        </strong>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500">{tierPalette.statusDetail}</span>
                    </div>
                  </div>

                  {/* Minimalist Precision Grade Ring */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center self-center sm:self-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <defs>
                        <linearGradient id="simMinimalGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={tierPalette.ringStart} />
                          <stop offset="100%" stopColor={tierPalette.ringEnd} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.18)"
                        strokeWidth="6.5"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#simMinimalGaugeGrad)"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 40}
                        animate={{
                          strokeDashoffset:
                            2 *
                            Math.PI *
                            40 *
                            (1 - Math.max(0, Math.min(100, projectedFinalGradeScore)) / 100),
                        }}
                        transition={{ type: 'spring', stiffness: 170, damping: 24 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">
                        Mutu
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={projectedLetter.letter}
                          initial={{ y: 8, opacity: 0, scale: 0.86 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          exit={{ y: -8, opacity: 0, scale: 0.86 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className={`font-display text-3xl font-extrabold leading-none bg-gradient-to-br ${tierPalette.textGradient} bg-clip-text text-transparent`}
                        >
                          {projectedLetter.letter}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Minimalist Weighted Point Split Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      Kontribusi Harian ({gradingScheme.dailyAccumulationWeight}%){' '}
                      <strong className="font-mono-num text-emerald-700">
                        +{dailyContribution.toFixed(1)} pts
                      </strong>
                    </span>
                    <span>
                      Kontribusi Final ({gradingScheme.finalPresentationWeight}%){' '}
                      <strong className="font-mono-num text-indigo-700">
                        +{finalContribution.toFixed(1)} pts
                      </strong>
                    </span>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex gap-1 p-0.5"
                  >
                    <div
                      style={{ width: `${gradingScheme.dailyAccumulationWeight}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-[width] duration-300 ease-out"
                    />
                    {gradingScheme.finalPresentationWeight > 0 && (
                      <div
                        style={{ width: `${gradingScheme.finalPresentationWeight}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-[width] duration-300 ease-out"
                      />
                    )}
                  </motion.div>
                </motion.div>

                {/* 4 Minimalist Card-Based Interactive Framer Motion Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {sliderConfigs.map((ctrl, idx) => {
                    const ratio = Math.max(
                      0,
                      Math.min(1, (ctrl.value - ctrl.min) / (ctrl.max - ctrl.min))
                    );
                    const pct = ratio * 100;
                    return (
                      <motion.div
                        key={ctrl.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.36,
                          delay: 0.14 + idx * 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{ y: -2 }}
                        className={`rounded-xl border border-slate-200/80 bg-white/85 p-4 space-y-3 transition-shadow hover:shadow-sm ${
                          ctrl.disabled ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-slate-600">{ctrl.label}</span>
                          <span className={`font-mono-num font-bold ${ctrl.valueColor}`}>
                            {ctrl.valueText}
                          </span>
                        </div>

                        <div className="relative flex items-center h-6 group">
                          {/* Track Base */}
                          <div className="w-full h-1.5 rounded-full bg-slate-200/75 overflow-hidden">
                            <motion.div
                              animate={{ scaleX: ratio }}
                              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                              style={{ originX: 0 }}
                              className={`h-full w-full rounded-full bg-gradient-to-r ${ctrl.trackGradient}`}
                            />
                          </div>

                          {/* Native Range Input for Full Keyboard/Pointer Accessibility */}
                          <input
                            type="range"
                            min={ctrl.min}
                            max={ctrl.max}
                            step={ctrl.step}
                            disabled={ctrl.disabled}
                            value={ctrl.value}
                            onChange={(e) => ctrl.onChange(Number(e.target.value))}
                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                            aria-label={ctrl.label}
                          />

                          {/* Spring-Interactive Visual Thumb */}
                          <motion.div
                            animate={{ left: `${pct}%` }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className={`pointer-events-none absolute -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 ${ctrl.thumbRing} shadow-sm transition-transform duration-150 group-hover:scale-110 peer-active:scale-125 peer-focus-visible:ring-4`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400">
                          <span>{ctrl.minLabel}</span>
                          {ctrl.disabled && (
                            <span className="font-sans text-[10px] text-slate-400">
                              Khusus dosen
                            </span>
                          )}
                          <span>{ctrl.maxLabel}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Collapsible Grade Threshold Calibration Matrix */}
                <AnimatePresence initial={false}>
                  {showThresholdsEditor && role === 'dosen' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="pt-4 border-t border-slate-200/80 grid grid-cols-3 sm:grid-cols-5 gap-2.5"
                    >
                      {gradingScheme.thresholds.map((t, idx) => {
                        const isProjectedTier = projectedLetter.letter === t.letter;
                        return (
                          <div
                            key={t.letter}
                            className={`rounded-xl border p-2.5 transition-colors ${
                              isProjectedTier
                                ? 'border-emerald-400 bg-emerald-50/75'
                                : 'border-slate-200/85 bg-white/85'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                              <span className={isProjectedTier ? 'text-emerald-700' : ''}>
                                {t.letter}
                              </span>
                              <span className="font-mono-num text-slate-400">
                                {t.gpaPoint.toFixed(1)}
                              </span>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={t.minScore}
                              onChange={(e) => {
                                const nextThresholds = [...gradingScheme.thresholds];
                                nextThresholds[idx] = { ...t, minScore: Number(e.target.value) };
                                onUpdateGradingScheme({
                                  ...gradingScheme,
                                  thresholds: nextThresholds,
                                });
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono-num text-slate-900 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}
        </motion.section>

        {/* Google Search Grounding Benchmark */}
        <motion.div
          layout
          whileHover={{ y: -3, scale: 1.008 }}
          transition={springCardTransition}
          className="lg:col-span-5 glass-panel glass-panel-interactive rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Benchmark F&amp;B (Google Search)
              </h2>
              <p className="text-xs text-slate-500">
                Bandingkan metrik Start-Up Lens dengan standar industri terkini
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={benchTopic}
              onChange={(e) => setBenchTopic(e.target.value)}
              placeholder="Topik benchmark F&B..."
              className="flex-1 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRunSearchBenchmark}
              disabled={benchLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {benchLoading ? 'Mencari...' : 'Cari'}
            </motion.button>
          </div>

          {benchError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/75 p-3 text-xs text-rose-800">
              {benchError}
            </div>
          )}

          {benchResult ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-white/75 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                {benchResult.answer}
              </div>
              {benchResult.sources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500">Sumber Google Search:</p>
                  <div className="flex flex-wrap gap-2">
                    {benchResult.sources.slice(0, 4).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      >
                        <span>{src.title.slice(0, 32)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
              Tekan &ldquo;Cari&rdquo; untuk membandingkan food waste, ticket time, dan akurasi kasir
              dengan standar industri kafe terkini via Google Search.
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </LayoutGroup>
  );
}
