import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileCheck2, Printer, X } from 'lucide-react';
import type { AuditSession } from '../types/audit';
import {
  formatCashVariance,
  formatIdr,
  formatWaste,
  getLetterGrade,
} from '../utils/calculations';

export function PrintAuditReportModal({
  isOpen,
  initialSession,
  allSessions,
  onClose,
}: {
  isOpen: boolean;
  initialSession: AuditSession | null;
  allSessions: AuditSession[];
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(initialSession?.id || '');

  useEffect(() => {
    if (initialSession) {
      setSelectedId(initialSession.id);
    } else if (allSessions.length > 0 && !selectedId) {
      setSelectedId(allSessions[0].id);
    }
  }, [initialSession, allSessions, selectedId]);

  useEffect(() => {
    const cleanup = () => document.body.classList.remove('printing-audit-report');
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  if (!isOpen) return null;

  const session =
    allSessions.find((s) => s.id === selectedId) || initialSession || allSessions[0];
  if (!session) return null;

  const isHoliday = session.sessionStatus === 'Libur / Tidak Beroperasi';
  const letter = getLetterGrade(session.weightedScore);
  const waste = formatWaste(session.kitchenWasteGrams);
  const item14 = session.checklist.find((c) => c.itemNumber === 14);
  const flaggedChecklist = session.checklist.filter(
    (c) => c.status !== 'sesuai' || c.findingNote.trim().length > 0 || c.itemNumber === 14
  );

  const handleTriggerPdfPrint = () => {
    document.body.classList.add('printing-audit-report');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-audit-report');
      }, 300);
    }, 60);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print-report-sheet"
      >
        {/* Modal Control Header (Hidden on Print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Cetak Laporan Audit — Start-Up Lens
              </h3>
              <p className="text-[11px] text-slate-500">
                Format siap cetak A4 · Pilih sesi lalu klik Unduh PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={session.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
            >
              {allSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.date} ({s.day}) · {s.shiftManager}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTriggerPdfPrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh sebagai PDF
            </button>

            <button
              type="button"
              onClick={handleTriggerPdfPrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="Tutup pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Document Letterhead */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 tracking-wide">
                START-UP LENS · LAPORAN AUDIT OPERASIONAL HARIAN
              </p>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                Lembar Ringkasan Evaluasi &amp; Audit Cafe Lab
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{session.courseName}</p>
            </div>
            <div className="text-right text-xs font-mono-num">
              <p className="font-semibold text-slate-900">ID: {session.id}</p>
              <p className="text-slate-600">
                Status: {session.isLocked ? 'Terkunci (Final)' : 'Terbuka (Draft/Revisi)'}
              </p>
              <p className="text-slate-500">
                Dicetak: {new Date().toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/60 print:bg-white">
            <div>
              <span className="text-slate-500 block">Kelompok</span>
              <span className="font-semibold text-slate-900">{session.groupName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Hari &amp; Tanggal</span>
              <span className="font-semibold font-mono-num text-slate-900">
                {session.day}, {session.date} ({session.month})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Status Sesi</span>
              <span className="font-semibold text-slate-900">{session.sessionStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Shift Manager / Leader</span>
              <span className="font-semibold text-slate-900">{session.shiftManager}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dosen Evaluator / Auditor</span>
              <span className="font-semibold text-slate-900">{session.auditorName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Skor &amp; Huruf Mutu Sesi</span>
              <span className="font-bold font-mono-num text-emerald-800">
                {isHoliday ? 'Libur' : `${session.weightedScore.toFixed(1)} / 100 (${letter.letter})`}
              </span>
            </div>
          </div>

          {/* Key Operational & Financial Figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block">Total Omset Harian</span>
              <span className="font-mono-num text-sm font-bold text-slate-900">
                {isHoliday ? '-' : formatIdr(session.totalRevenueIdr)}
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block">Rekonsiliasi &amp; Selisih Kas</span>
              <span className="font-mono-num text-sm font-bold text-slate-900">
                {isHoliday ? '-' : formatCashVariance(session.cashVarianceIdr)}
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block">Kitchen Waste Harian</span>
              <span className="font-mono-num text-sm font-bold text-slate-900">
                {isHoliday ? '-' : `${waste.kgText} (${waste.gramsText})`}
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block">SLA Ticket &amp; Service</span>
              <span className="font-mono-num text-xs font-semibold text-slate-900">
                {isHoliday
                  ? '-'
                  : `Minum ${session.avgDrinkTicketMin}m · Makan ${session.avgFoodTicketMin}m · ${session.qrFeedbackCount} QR`}
              </span>
            </div>
          </div>

          {/* 4-Criteria Rubric Evaluation Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ringkasan Penilaian Evaluator Berbobot
            </h2>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100/80 print:bg-slate-100 border-b border-slate-200">
                  <th className="py-2 px-3 font-semibold">Kriteria Penilaian</th>
                  <th className="py-2 px-3 text-right font-semibold">Bobot</th>
                  <th className="py-2 px-3 text-right font-semibold">Skor</th>
                  <th className="py-2 px-3 text-right font-semibold">Kontribusi</th>
                  <th className="py-2 px-3 font-semibold">Catatan Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Object.values(session.rubric).map((r) => (
                  <tr key={r.key}>
                    <td className="py-2 px-3 font-medium text-slate-900">{r.title}</td>
                    <td className="py-2 px-3 text-right font-mono-num">
                      {Math.round(r.weight * 100)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono-num font-bold">
                      {isHoliday ? '-' : r.score}
                    </td>
                    <td className="py-2 px-3 text-right font-mono-num">
                      {isHoliday ? '-' : (r.score * r.weight).toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{r.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Checklist Highlights & Item 14 Outcome */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <h2 className="font-bold text-slate-900 uppercase tracking-wider">
                Temuan Checklist Operasional (14 Item)
              </h2>
              <span className="font-mono-num text-slate-600">
                Terpenuhi: {session.checklist.filter((c) => c.checked).length} / 14 · Penutupan:{' '}
                {item14?.item14Outcome || '-'}
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-xs">
              {flaggedChecklist.length === 0 ? (
                <p className="p-3 text-slate-600">Seluruh 14 item checklist berjalan sesuai standar.</p>
              ) : (
                flaggedChecklist.map((c) => (
                  <div key={c.itemNumber} className="p-2.5 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-900">
                        #{c.itemNumber}. {c.label}
                      </span>
                      {c.findingNote && (
                        <p className="text-slate-600 mt-0.5">Temuan: {c.findingNote}</p>
                      )}
                    </div>
                    <span className="font-semibold shrink-0 text-slate-700 capitalize">
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auditor Summary Note */}
          <div className="border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
            <p className="font-bold text-slate-900">Catatan Evaluasi Penting Auditor Hari Ini:</p>
            <p className="text-slate-700 leading-relaxed">
              {session.auditorSummaryNote || 'Tidak ada catatan tambahan.'}
            </p>
          </div>

          {/* Digital Signatures Block */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="border border-slate-200 rounded-lg p-4 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Shift Manager / Perwakilan Kelompok
              </p>
              {session.shiftManagerSignature?.signatureDataUrl ? (
                <img
                  src={session.shiftManagerSignature.signatureDataUrl}
                  alt={`Tanda tangan ${session.shiftManager}`}
                  referrerPolicy="no-referrer"
                  className="h-16 mx-auto object-contain"
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                  Belum ditandatangani
                </div>
              )}
              <div className="border-t border-slate-200 pt-1.5 text-xs">
                <p className="font-semibold text-slate-900">{session.shiftManager}</p>
                {session.shiftManagerSignature?.signedAt && (
                  <p className="font-mono-num text-[10px] text-slate-500">
                    Disahkan: {new Date(session.shiftManagerSignature.signedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">Dosen Evaluator / Auditor</p>
              {session.auditorSignature?.signatureDataUrl ? (
                <img
                  src={session.auditorSignature.signatureDataUrl}
                  alt={`Tanda tangan ${session.auditorName}`}
                  referrerPolicy="no-referrer"
                  className="h-16 mx-auto object-contain"
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                  Belum ditandatangani
                </div>
              )}
              <div className="border-t border-slate-200 pt-1.5 text-xs">
                <p className="font-semibold text-slate-900">{session.auditorName}</p>
                {session.auditorSignature?.signedAt && (
                  <p className="font-mono-num text-[10px] text-slate-500">
                    Disahkan: {new Date(session.auditorSignature.signedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail Edit Log */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Log Audit &amp; Riwayat Perubahan ({session.editHistory.length} entri)
            </h2>
            {session.editHistory.length === 0 ? (
              <p className="text-xs text-slate-500">
                Tidak ada perubahan data setelah lembar observasi dibuat.
              </p>
            ) : (
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-1.5 px-2.5">Waktu</th>
                    <th className="py-1.5 px-2.5">Editor</th>
                    <th className="py-1.5 px-2.5">Bagian / Field</th>
                    <th className="py-1.5 px-2.5">Perubahan</th>
                    <th className="py-1.5 px-2.5">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {session.editHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="py-1.5 px-2.5 font-mono-num whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2.5">{log.editorName}</td>
                      <td className="py-1.5 px-2.5 font-medium">{log.fieldLabel}</td>
                      <td className="py-1.5 px-2.5">
                        {log.oldValue} → <strong>{log.newValue}</strong>
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-600">{log.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
