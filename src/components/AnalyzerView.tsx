import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  DollarSign,
  ListChecks,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import type {
  AcademicMonth,
  ActionItemEntry,
  AuditSession,
  UserRole,
} from '../types/audit';
import {
  OPERATIONAL_DAYS,
  formatCashVariance,
  formatIdr,
  formatWaste,
  getActiveSessions,
} from '../utils/calculations';

type AnalyzerTab = 'cash' | 'ticket' | 'waste' | 'actions';

export function AnalyzerView({
  sessions,
  monthFilter,
  actionItems,
  role,
  onAddActionItem,
  onUpdateActionStatus,
  onDeleteActionItem,
  onInspectSession,
  onSyncActionToCalendar,
  workspaceConnected,
}: {
  sessions: AuditSession[];
  monthFilter: AcademicMonth | 'Semua';
  actionItems: ActionItemEntry[];
  role: UserRole;
  onAddActionItem: (item: Omit<ActionItemEntry, 'id'>) => void;
  onUpdateActionStatus: (id: string, status: ActionItemEntry['status']) => void;
  onDeleteActionItem: (id: string) => void;
  onInspectSession: (session: AuditSession) => void;
  onSyncActionToCalendar: (item: ActionItemEntry) => void;
  workspaceConnected: boolean;
}) {
  const [tab, setTab] = useState<AnalyzerTab>('cash');

  // Action item form
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Raka Pratama');
  const [priority, setPriority] = useState<ActionItemEntry['priority']>('Sedang');
  const [category, setCategory] = useState<ActionItemEntry['category']>('Kas & POS');
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ActionItemEntry['status']>('Semua');

  const active = useMemo(() => {
    const base =
      monthFilter === 'Semua'
        ? sessions
        : sessions.filter((s) => s.month === monthFilter);
    return getActiveSessions(base).sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, monthFilter]);

  // 1. Cash & POS Transition Analytics
  const cashAnalytics = useMemo(() => {
    const manual = active.filter((s) => !s.isPosTransition);
    const pos = active.filter((s) => s.isPosTransition);

    const calcMode = (list: AuditSession[]) => {
      const count = list.length;
      if (count === 0) return { count: 0, exact: 0, netVar: 0, avgAbsVar: 0 };
      const exact = list.filter((s) => s.cashVarianceIdr === 0).length;
      const netVar = list.reduce((a, s) => a + s.cashVarianceIdr, 0);
      const absVar = list.reduce((a, s) => a + Math.abs(s.cashVarianceIdr), 0);
      return {
        count,
        exact,
        netVar,
        avgAbsVar: Math.round(absVar / count),
      };
    };

    const managersMap = new Map<string, { sessions: number; exact: number; absVar: number }>();
    for (const s of active) {
      const curr = managersMap.get(s.shiftManager) || { sessions: 0, exact: 0, absVar: 0 };
      curr.sessions += 1;
      if (s.cashVarianceIdr === 0) curr.exact += 1;
      curr.absVar += Math.abs(s.cashVarianceIdr);
      managersMap.set(s.shiftManager, curr);
    }

    const byDay = OPERATIONAL_DAYS.map((day) => {
      const dList = active.filter((s) => s.day === day);
      return { day, ...calcMode(dList) };
    });

    return {
      manual: calcMode(manual),
      pos: calcMode(pos),
      byManager: Array.from(managersMap.entries()).map(([name, val]) => ({
        name,
        ...val,
        accuracyPct: Math.round((val.exact / val.sessions) * 100),
      })),
      byDay,
    };
  }, [active]);

  // 2. Ticket Time & Service Bottleneck Analytics
  const ticketAnalytics = useMemo(() => {
    const n = active.length || 1;
    const avgDrink = active.reduce((a, s) => a + s.avgDrinkTicketMin, 0) / n;
    const avgFood = active.reduce((a, s) => a + s.avgFoodTicketMin, 0) / n;
    const drinkPass = active.filter((s) => s.avgDrinkTicketMin <= 5).length;
    const foodPass = active.filter((s) => s.avgFoodTicketMin <= 10).length;
    const totalQr = active.reduce((a, s) => a + s.qrFeedbackCount, 0);
    const totalLast = active.reduce((a, s) => a + s.lastRecoveryCases, 0);

    const bottlenecks = active.filter(
      (s) => s.avgDrinkTicketMin > 5 || s.avgFoodTicketMin > 10
    );

    return {
      avgDrink: avgDrink.toFixed(1),
      avgFood: avgFood.toFixed(1),
      drinkPassPct: Math.round((drinkPass / n) * 100),
      foodPassPct: Math.round((foodPass / n) * 100),
      totalQr,
      totalLast,
      bottlenecks,
    };
  }, [active]);

  // 3. Kitchen Waste & SRC Compliance Analytics
  const wasteAnalytics = useMemo(() => {
    const totalGrams = active.reduce((a, s) => a + s.kitchenWasteGrams, 0);
    const avgGrams = active.length > 0 ? Math.round(totalGrams / active.length) : 0;
    const srcCompliant = active.filter((s) => {
      const item8 = s.checklist.find((c) => c.itemNumber === 8);
      return item8?.status === 'sesuai';
    }).length;
    const miseCompliant = active.filter((s) => {
      const item3 = s.checklist.find((c) => c.itemNumber === 3);
      return item3?.status === 'sesuai';
    }).length;
    const claygoDone = active.filter((s) => {
      const item14 = s.checklist.find((c) => c.itemNumber === 14);
      return item14?.checked;
    }).length;

    const maxWaste = Math.max(1500, ...active.map((s) => s.kitchenWasteGrams));

    return {
      totalGrams,
      avgGrams,
      srcPct: active.length ? Math.round((srcCompliant / active.length) * 100) : 0,
      misePct: active.length ? Math.round((miseCompliant / active.length) * 100) : 0,
      claygoPct: active.length ? Math.round((claygoDone / active.length) * 100) : 0,
      maxWaste,
    };
  }, [active]);

  // 4. Incidental Meetings & Action Items
  const incidentalMeetings = useMemo(() => {
    return active.filter((s) => {
      const item14 = s.checklist.find((c) => c.itemNumber === 14);
      return (
        item14?.item14Outcome === 'Rapat Insidental Terlaksana [Ada Kendala]' ||
        s.isPosTransition
      );
    });
  }, [active]);

  const filteredActions = useMemo(() => {
    return actionItems.filter((a) =>
      statusFilter === 'Semua' ? true : a.status === statusFilter
    );
  }, [actionItems, statusFilter]);

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddActionItem({
      sessionId: active[active.length - 1]?.id || 'manual',
      sessionDate: active[active.length - 1]?.date || '2026-11-18',
      title: title.trim(),
      owner: owner.trim() || 'Shift Manager',
      priority,
      status: 'Open',
      dueDate,
      category,
    });
    setTitle('');
  };

  return (
    <div className="space-y-5">
      {/* Segmented Analyzer Switcher */}
      <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'cash', label: 'Cash Variance & POS Transition', icon: DollarSign },
            { id: 'ticket', label: 'Ticket Time & Service Bottleneck', icon: Clock },
            { id: 'waste', label: 'Kitchen Waste & SRC Compliance', icon: UtensilsCrossed },
            { id: 'actions', label: 'Action Items & Rapat Insidental', icon: ListChecks },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CASH VARIANCE & POS TRANSITION */}
      {tab === 'cash' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                Pencatatan Kas Manual (Reguler)
              </p>
              <div className="flex items-baseline justify-between">
                <span className="font-mono-num text-2xl font-bold text-slate-900">
                  {cashAnalytics.manual.exact} / {cashAnalytics.manual.count} Sesi
                </span>
                <span className="text-xs font-medium text-emerald-700">Akurasi IDR 0</span>
              </div>
              <p className="text-xs text-slate-600">
                Net selisih:{' '}
                <span className="font-mono-num font-semibold">
                  {formatCashVariance(cashAnalytics.manual.netVar)}
                </span>{' '}
                · Rata-rata deviasi absolut:{' '}
                <span className="font-mono-num">{formatIdr(cashAnalytics.manual.avgAbsVar)}</span>
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <p className="text-xs font-semibold text-amber-800">
                Periode Penyesuaian / Masa Transisi POS
              </p>
              <div className="flex items-baseline justify-between">
                <span className="font-mono-num text-2xl font-bold text-slate-900">
                  {cashAnalytics.pos.exact} / {cashAnalytics.pos.count} Sesi
                </span>
                <span className="text-xs font-medium text-amber-700">Akurasi IDR 0</span>
              </div>
              <p className="text-xs text-slate-600">
                Net selisih:{' '}
                <span className="font-mono-num font-semibold">
                  {formatCashVariance(cashAnalytics.pos.netVar)}
                </span>{' '}
                · Rata-rata deviasi absolut:{' '}
                <span className="font-mono-num">{formatIdr(cashAnalytics.pos.avgAbsVar)}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Akurasi Kas per Shift Manager
              </h3>
              <div className="divide-y divide-slate-200/70">
                {cashAnalytics.byManager.map((m) => (
                  <div key={m.name} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-slate-500">
                        {m.exact}/{m.sessions} shift sesuai IDR 0
                      </p>
                    </div>
                    <div className="text-right font-mono-num">
                      <p className="font-bold text-blue-700">{m.accuracyPct}% akurat</p>
                      <p className="text-slate-500">Total deviasi {formatIdr(m.absVar)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Pola Selisih Kas per Hari Operasional (Sel–Jum)
              </h3>
              <div className="space-y-3">
                {cashAnalytics.byDay.map((d) => (
                  <div key={d.day} className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2.5">
                    <div>
                      <span className="font-semibold text-slate-900">{d.day}</span>
                      <span className="text-slate-500 ml-2">({d.count} sesi)</span>
                    </div>
                    <div className="font-mono-num text-right">
                      <span className={d.netVar === 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        {formatCashVariance(d.netVar)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKET TIME & SERVICE BOTTLENECK */}
      {tab === 'ticket' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Avg Ticket Time Minuman</p>
              <p className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
                {ticketAnalytics.avgDrink} mnt
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Target SLA &lt; 5 mnt ({ticketAnalytics.drinkPassPct}% patuh)
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Avg Ticket Time Makanan</p>
              <p className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
                {ticketAnalytics.avgFood} mnt
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Target SLA &lt; 10 mnt ({ticketAnalytics.foodPassPct}% patuh)
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Total QR Feedback Terkumpul</p>
              <p className="font-mono-num text-2xl font-bold text-blue-700 mt-1">
                {ticketAnalytics.totalQr}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Rata-rata {(ticketAnalytics.totalQr / (active.length || 1)).toFixed(1)} per shift
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Kasus Service Recovery (L.A.S.T)</p>
              <p className="font-mono-num text-2xl font-bold text-amber-700 mt-1">
                {ticketAnalytics.totalLast} kasus
              </p>
              <p className="text-xs text-slate-500 mt-1">Tercatat &amp; ditangani FOH</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Audit Kepatuhan SLA per Sesi (Minuman &lt; 5 mnt · Makanan &lt; 10 mnt)
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {active.map((s) => {
                const drinkOver = s.avgDrinkTicketMin > 5;
                const foodOver = s.avgFoodTicketMin > 10;
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200/80 bg-white/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 font-mono-num">
                        {s.day}, {s.date} · {s.shiftManager}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        QR Feedback: {s.qrFeedbackCount} · Kasus L.A.S.T: {s.lastRecoveryCases}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 font-mono-num">
                      <span className={drinkOver ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
                        Minuman: {s.avgDrinkTicketMin.toFixed(1)} mnt {drinkOver ? '(Lewat SLA)' : '(OK)'}
                      </span>
                      <span className={foodOver ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
                        Makanan: {s.avgFoodTicketMin.toFixed(1)} mnt {foodOver ? '(Lewat SLA)' : '(OK)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspectSession(s)}
                        className="text-blue-700 font-sans font-semibold hover:underline"
                      >
                        Lihat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KITCHEN WASTE & SRC COMPLIANCE */}
      {tab === 'waste' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Total Kitchen Waste Periode</p>
              <p className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
                {formatWaste(wasteAnalytics.totalGrams).kgText}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Rata-rata {wasteAnalytics.avgGrams} g / sesi aktif
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Kepatuhan Takaran &amp; Resep SRC</p>
              <p className="font-mono-num text-2xl font-bold text-emerald-700 mt-1">
                {wasteAnalytics.srcPct}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mise en place BOH: {wasteAnalytics.misePct}% sesuai
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs text-slate-500">Penyelesaian CLAYGO Closing</p>
              <p className="font-mono-num text-2xl font-bold text-blue-700 mt-1">
                {wasteAnalytics.claygoPct}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Deep cleaning BOH &amp; FOH</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Profil Kitchen Waste per Sesi (Ambang Anomali: 1.100 g / 1.10 kg)
            </h3>
            <div className="space-y-3">
              {active.map((s) => {
                const pct = Math.min(100, Math.round((s.kitchenWasteGrams / wasteAnalytics.maxWaste) * 100));
                const high = s.kitchenWasteGrams >= 1100;
                return (
                  <div key={s.id} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono-num text-slate-700 font-medium">
                        {s.date} ({s.day}) · {s.shiftManager}
                      </span>
                      <span
                        className={`font-mono-num font-semibold ${
                          high ? 'text-rose-700' : 'text-slate-800'
                        }`}
                      >
                        {s.kitchenWasteGrams} g ({(s.kitchenWasteGrams / 1000).toFixed(2)} kg)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/75 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${high ? 'bg-rose-600' : 'bg-teal-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTION ITEMS & RAPAT INSIDENTAL TRACKER */}
      {tab === 'actions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Tracker Action Items Lintas Pertemuan
                </h3>
                <p className="text-xs text-slate-500">
                  Pemantauan tindak lanjut perbaikan dosen &amp; mahasiswa
                </p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'Semua' | ActionItemEntry['status'])
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="Semua">Semua Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <form onSubmit={handleCreateAction} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tambah action item perbaikan baru..."
                className="sm:col-span-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="PIC"
                className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionItemEntry['category'])}
                className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900"
              >
                <option value="Kas & POS">Kas &amp; POS</option>
                <option value="Ticket Time & SLA">Ticket Time &amp; SLA</option>
                <option value="Kitchen Waste & SRC">Kitchen Waste &amp; SRC</option>
                <option value="Service & CLAYGO">Service &amp; CLAYGO</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-mono-num text-slate-900"
              />
              <button
                type="submit"
                className="sm:col-span-1 inline-flex items-center justify-center rounded-lg bg-blue-700 py-2 text-white hover:bg-blue-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="divide-y divide-slate-200/70">
              {filteredActions.map((act) => (
                <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-700">{act.category}</span>
                      <span>·</span>
                      <span>Prioritas {act.priority}</span>
                      <span>·</span>
                      <span className="font-mono-num">Target {act.dueDate}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-500">PIC: {act.owner}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={act.status}
                      onChange={(e) =>
                        onUpdateActionStatus(act.id, e.target.value as ActionItemEntry['status'])
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                        act.status === 'Resolved'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : act.status === 'In Progress'
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    {workspaceConnected && (
                      <button
                        type="button"
                        onClick={() => onSyncActionToCalendar(act)}
                        title="Tambah pengingat ke Google Calendar"
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-blue-700 hover:bg-slate-50"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {role === 'dosen' && (
                      <button
                        type="button"
                        onClick={() => onDeleteActionItem(act.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Log Rapat Insidental &amp; Masa Transisi POS
            </h3>
            <p className="text-xs text-slate-500">
              Catatan evaluasi kondisional ketika muncul kendala operasional atau penyesuaian kasir
            </p>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {incidentalMeetings.map((s) => {
                const item14 = s.checklist.find((c) => c.itemNumber === 14);
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white/75 p-3.5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num font-semibold text-slate-900">
                        {s.day}, {s.date}
                      </span>
                      <span className="font-medium text-amber-700">
                        {s.isPosTransition ? 'Masa Transisi POS' : 'Rapat Insidental'}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800">{item14?.item14Outcome}</p>
                    <p className="text-slate-600 leading-relaxed">{s.auditorSummaryNote}</p>
                    <div className="pt-1 flex justify-between items-center text-[11px] text-slate-500">
                      <span>Shift: {s.shiftManager}</span>
                      <button
                        type="button"
                        onClick={() => onInspectSession(s)}
                        className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Buka Audit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
