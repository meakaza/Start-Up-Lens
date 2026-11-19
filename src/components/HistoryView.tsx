import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarPlus,
  Edit3,
  Eye,
  History,
  Lock,
  Printer,
  Search,
  Unlock,
  X,
} from 'lucide-react';
import type {
  AcademicMonth,
  AuditSession,
  SessionStatus,
  UserRole,
} from '../types/audit';
import {
  ACADEMIC_MONTHS,
  formatCashVariance,
  formatIdr,
  formatWaste,
} from '../utils/calculations';

export function HistoryView({
  sessions,
  monthFilter,
  role,
  selectedSessionForModal,
  onSelectSessionForModal,
  onEditSession,
  onUnlockSession,
  onSyncSessionToCalendar,
  onPrintSession,
  workspaceConnected,
}: {
  sessions: AuditSession[];
  monthFilter: AcademicMonth | 'Semua';
  role: UserRole;
  selectedSessionForModal: AuditSession | null;
  onSelectSessionForModal: (session: AuditSession | null) => void;
  onEditSession: (session: AuditSession) => void;
  onUnlockSession: (sessionId: string) => void;
  onSyncSessionToCalendar: (session: AuditSession) => void;
  onPrintSession: (session: AuditSession) => void;
  workspaceConnected: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localMonth, setLocalMonth] = useState<AcademicMonth | 'Semua'>(monthFilter);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'Semua'>('Semua');
  const [cashFilter, setCashFilter] = useState<'Semua' | 'Sesuai' | 'Selisih'>('Semua');

  const filtered = useMemo(() => {
    const activeMonth = localMonth;
    return sessions
      .filter((s) => (activeMonth === 'Semua' ? true : s.month === activeMonth))
      .filter((s) => (statusFilter === 'Semua' ? true : s.sessionStatus === statusFilter))
      .filter((s) => {
        if (cashFilter === 'Sesuai') return s.cashVarianceIdr === 0;
        if (cashFilter === 'Selisih') return s.cashVarianceIdr !== 0;
        return true;
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.date.includes(q) ||
          s.shiftManager.toLowerCase().includes(q) ||
          s.auditorSummaryNote.toLowerCase().includes(q) ||
          s.month.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, localMonth, statusFilter, cashFilter, searchQuery]);

  const totalEditLogs = useMemo(
    () => sessions.reduce((acc, s) => acc + s.editHistory.length, 0),
    [sessions]
  );

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Rekap &amp; Riwayat Sesi Operasional (Audit Trail)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selasa–Jumat 10.00–22.00 · {filtered.length} sesi ditampilkan · {totalEditLogs} riwayat
              perubahan tercatat
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tanggal, shift manager, catatan..."
              className="w-full rounded-lg border border-slate-200 bg-white/85 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={localMonth}
            onChange={(e) => setLocalMonth(e.target.value as AcademicMonth | 'Semua')}
            className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="Semua">Semua Bulan (Okt 2026–Jan 2027)</option>
            {ACADEMIC_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'Semua')}
            className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="Semua">Semua Status Sesi</option>
            <option value="Operasional Normal">Operasional Normal</option>
            <option value="Penyesuaian Jam / Masa Transisi POS">
              Penyesuaian Jam / Masa Transisi POS
            </option>
            <option value="Libur / Tidak Beroperasi">Libur / Tidak Beroperasi</option>
          </select>

          <select
            value={cashFilter}
            onChange={(e) => setCashFilter(e.target.value as 'Semua' | 'Sesuai' | 'Selisih')}
            className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="Semua">Semua Status Kas</option>
            <option value="Sesuai">Kas Sesuai (IDR 0)</option>
            <option value="Selisih">Ada Selisih Kas</option>
          </select>
        </div>
      </div>

      {/* High-Density Session Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Tanggal &amp; Shift</th>
                <th className="py-3 px-4">Status Sesi</th>
                <th className="py-3 px-4 text-right">Skor</th>
                <th className="py-3 px-4 text-right">Omset</th>
                <th className="py-3 px-4 text-right">Selisih Kas</th>
                <th className="py-3 px-4 text-right">Waste</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Tidak ada sesi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((session) => {
                  const isHoliday = session.sessionStatus === 'Libur / Tidak Beroperasi';
                  const waste = formatWaste(session.kitchenWasteGrams);
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono-num">
                          {session.day}, {session.date}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {session.month} · {session.shiftManager}
                          {session.editHistory.length > 0 && (
                            <span className="text-blue-700 font-medium">
                              {' '}
                              · {session.editHistory.length}x diedit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            isHoliday
                              ? 'text-slate-500'
                              : session.isPosTransition
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {session.sessionStatus}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {session.isLocked ? (
                            <>
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Terkunci</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 text-blue-600" />
                              <span>Terbuka</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                        {isHoliday ? '-' : session.weightedScore.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-800">
                        {isHoliday ? '-' : formatIdr(session.totalRevenueIdr)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-num font-medium ${
                          isHoliday
                            ? 'text-slate-400'
                            : session.cashVarianceIdr === 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {isHoliday ? '-' : formatCashVariance(session.cashVarianceIdr)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                        {isHoliday ? '-' : `${waste.kgText}`}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectSessionForModal(session)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintSession(session)}
                            title="Cetak Laporan Audit (PDF)"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            PDF
                          </button>
                          {role === 'dosen' && (
                            <button
                              type="button"
                              onClick={() => onEditSession(session)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          {workspaceConnected && (
                            <button
                              type="button"
                              onClick={() => onSyncSessionToCalendar(session)}
                              title="Simpan ke Google Calendar"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-blue-700" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Detail & Audit Trail Modal */}
      {selectedSessionForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-elevated w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {selectedSessionForModal.courseName} · {selectedSessionForModal.groupName}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Detail Audit Harian — {selectedSessionForModal.day},{' '}
                  {selectedSessionForModal.date} ({selectedSessionForModal.month})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shift Manager: {selectedSessionForModal.shiftManager} · Auditor:{' '}
                  {selectedSessionForModal.auditorName} · Status:{' '}
                  {selectedSessionForModal.sessionStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSessionForModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white/75 p-3">
                <p className="text-[11px] text-slate-500">Skor Tertimbang</p>
                <p className="font-mono-num text-lg font-bold text-blue-700">
                  {selectedSessionForModal.sessionStatus === 'Libur / Tidak Beroperasi'
                    ? 'Libur'
                    : `${selectedSessionForModal.weightedScore.toFixed(1)} / 100`}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/75 p-3">
                <p className="text-[11px] text-slate-500">Total Omset</p>
                <p className="font-mono-num text-lg font-bold text-slate-900">
                  {formatIdr(selectedSessionForModal.totalRevenueIdr)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/75 p-3">
                <p className="text-[11px] text-slate-500">Selisih Kas</p>
                <p
                  className={`font-mono-num text-sm font-bold mt-1 ${
                    selectedSessionForModal.cashVarianceIdr === 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {formatCashVariance(selectedSessionForModal.cashVarianceIdr)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/75 p-3">
                <p className="text-[11px] text-slate-500">Kitchen Waste</p>
                <p className="font-mono-num text-lg font-bold text-slate-900">
                  {(selectedSessionForModal.kitchenWasteGrams / 1000).toFixed(2)} kg
                </p>
              </div>
            </div>

            {/* Rubric Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(selectedSessionForModal.rubric).map((r) => (
                <div key={r.key} className="rounded-xl border border-slate-200 bg-white/70 p-3.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-900">
                    <span>{r.title}</span>
                    <span className="font-mono-num text-blue-700">
                      {r.score} ({Math.round(r.weight * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{r.note || 'Tidak ada catatan.'}</p>
                </div>
              ))}
            </div>

            {/* Auditor Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-4">
              <p className="text-xs font-semibold text-slate-800 mb-1">
                Catatan Evaluasi Penting Auditor
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedSessionForModal.auditorSummaryNote || 'Belum ada catatan ringkasan.'}
              </p>
            </div>

            {/* Checklist Findings Highlight */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-800">
                Ringkasan Checklist 14 Item
              </p>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200/70 rounded-xl border border-slate-200 bg-white/75 px-4">
                {selectedSessionForModal.checklist.map((item) => (
                  <div key={item.itemNumber} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-800 font-medium">
                        {item.itemNumber}. {item.label}
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          item.status === 'sesuai'
                            ? 'text-emerald-700'
                            : item.status === 'perhatian'
                            ? 'text-amber-700'
                            : item.status === 'tidak_sesuai'
                            ? 'text-rose-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.status === 'sesuai'
                          ? 'Sesuai'
                          : item.status === 'perhatian'
                          ? 'Perhatian'
                          : item.status === 'tidak_sesuai'
                          ? 'Tidak Sesuai'
                          : 'Libur'}
                      </span>
                    </div>
                    {item.findingNote && (
                      <p className="text-slate-500">Temuan: {item.findingNote}</p>
                    )}
                    {item.evidenceList.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.evidenceList.map((ev) => (
                          <img
                            key={ev.id}
                            src={ev.dataUrl}
                            alt={ev.name}
                            referrerPolicy="no-referrer"
                            className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Edit Log */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <History className="w-4 h-4 text-blue-700" />
                <span>Audit Trail Edit ({selectedSessionForModal.editHistory.length} entri)</span>
              </div>
              {selectedSessionForModal.editHistory.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Belum ada riwayat perubahan setelah sesi pertama kali disimpan.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white/75 divide-y divide-slate-200/70">
                  {selectedSessionForModal.editHistory.map((log) => (
                    <div key={log.id} className="p-3 text-xs space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{log.fieldLabel}</span>
                        <span className="font-mono-num text-slate-500">
                          {new Date(log.timestamp).toLocaleString('id-ID')} · {log.editorName}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        <span className="line-through text-rose-700">{log.oldValue}</span>{' '}
                        <span className="mx-1 text-slate-400">→</span>{' '}
                        <span className="font-semibold text-emerald-700">{log.newValue}</span>
                      </p>
                      {log.reason && (
                        <p className="text-slate-500 italic">Alasan: {log.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200/80">
              {role === 'dosen' && selectedSessionForModal.isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    onUnlockSession(selectedSessionForModal.id);
                    onSelectSessionForModal({
                      ...selectedSessionForModal,
                      isLocked: false,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 whitespace-nowrap"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Buka Kunci Sesi
                </button>
              )}
              {role === 'dosen' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedSessionForModal;
                    onSelectSessionForModal(null);
                    onEditSession(target);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Lembar Observasi
                </button>
              )}
              <button
                type="button"
                onClick={() => onPrintSession(selectedSessionForModal)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Laporan Audit (PDF)
              </button>
              <button
                type="button"
                onClick={() => onSelectSessionForModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
