import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Printer,
  ShieldCheck,
  Table2,
  UserCheck,
} from 'lucide-react';
import type {
  ActionItemEntry,
  AuditSession,
  DosenAccount,
  GoogleWorkspaceUser,
  GradingSchemeConfig,
  UserRole,
} from '../types/audit';
import {
  fetchSpreadsheetMetadata,
  type SpreadsheetMetadataResult,
} from '../services/googleWorkspace';
import {
  computeTermAccumulation,
  exportSessionsToCsv,
  formatIdr,
  getLetterGrade,
} from '../utils/calculations';
import { GoogleSignInButton } from './GlassPrimitives';

export function WorkspaceExportView({
  role,
  onChangeRole,
  dosenAccount,
  onOpenLogin,
  onLogout,
  sessions,
  actionItems,
  gradingScheme,
  workspaceUser,
  accessToken,
  authLoading,
  onSignInGoogle,
  onSignOutGoogle,
  onRequestCreateSheet,
  onRequestSyncExistingSheet,
  onOpenPrintReport,
}: {
  role: UserRole;
  onChangeRole: (next: UserRole) => void;
  dosenAccount: DosenAccount | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  sessions: AuditSession[];
  actionItems: ActionItemEntry[];
  gradingScheme: GradingSchemeConfig;
  workspaceUser: GoogleWorkspaceUser | null;
  accessToken: string | null;
  authLoading: boolean;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onRequestCreateSheet: (avgScore: number, letterGrade: string) => void;
  onRequestSyncExistingSheet: (
    spreadsheetId: string,
    spreadsheetTitle: string,
    sheetTabName: string,
    avgScore: number,
    letterGrade: string
  ) => void;
  onOpenPrintReport: (session: AuditSession | null) => void;
}) {
  const stats = useMemo(() => computeTermAccumulation(sessions), [sessions]);
  const letter = getLetterGrade(stats.avgWeightedScore, gradingScheme.thresholds);

  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [sheetMeta, setSheetMeta] = useState<SpreadsheetMetadataResult | null>(null);
  const [selectedTabName, setSelectedTabName] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const extractSpreadsheetId = (raw: string) => {
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw.trim();
  };

  const handleLookupSheet = async () => {
    if (!accessToken || !existingSheetInput.trim()) return;
    setMetaLoading(true);
    setMetaError(null);
    try {
      const id = extractSpreadsheetId(existingSheetInput);
      const meta = await fetchSpreadsheetMetadata(id, accessToken);
      setSheetMeta(meta);
      setSelectedTabName(meta.sheets[0]?.title || '');
    } catch (err: unknown) {
      setMetaError(err instanceof Error ? err.message : 'Gagal membaca spreadsheet.');
      setSheetMeta(null);
    } finally {
      setMetaLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const csv = exportSessionsToCsv(sessions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-operasional-cafe-lab-sep-jan.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      course: 'Cafe and Restaurant Business (MAN1106508)',
      termSummary: stats,
      sessions,
      actionItems,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-operasional-cafe-lab-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Mode Peran & Hak Akses */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Mode Peran &amp; Kontrol Akses Audit
              </h2>
              <p className="text-xs text-slate-500">
                Ubah tampilan antara hak penuh Dosen / Evaluator dan pantauan Mahasiswa / Grup Start-up
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {dosenAccount ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-600">
                  Masuk sebagai{' '}
                  <strong className="font-mono-num text-emerald-800">{dosenAccount.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Ganti Akun
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login Akun Dosen
              </button>
            )}

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => onChangeRole('dosen')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  role === 'dosen' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dosen / Evaluator
              </button>
              <button
                type="button"
                onClick={() => onChangeRole('mahasiswa')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  role === 'mahasiswa'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mahasiswa / Grup Start-up
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div
            className={`rounded-xl border p-4 space-y-1.5 ${
              role === 'dosen'
                ? 'border-blue-300 bg-blue-50/55'
                : 'border-slate-200 bg-white/60'
            }`}
          >
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Hak Akses Dosen / Evaluator
            </p>
            <p className="text-slate-600">
              • Input lembar observasi baru, edit nilai/checklist tersimpan, &amp; buka kunci sesi.
            </p>
            <p className="text-slate-600">
              • Mengatur ambang konversi huruf mutu, menandatangani audit, dan ekspor laporan resmi.
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-1.5 ${
              role === 'mahasiswa'
                ? 'border-blue-300 bg-blue-50/55'
                : 'border-slate-200 bg-white/60'
            }`}
          >
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Hak Akses Mahasiswa / Grup Start-up
            </p>
            <p className="text-slate-600">
              • Memantau akumulasi nilai 3 bulan, simulator proyeksi nilai, dan catatan feedback auditor.
            </p>
            <p className="text-slate-600">
              • Memperbarui progres Action Items lintas pertemuan serta melihat jadwal operasional.
            </p>
          </div>
        </div>
      </div>

      {/* Google Sheets Live Workspace Sync */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Sinkronisasi Google Sheets (Live Workspace)
              </h2>
              <p className="text-xs text-slate-500">
                Ekspor rekap harian, akumulasi 3 bulan, dan action items langsung ke Google Sheets
              </p>
            </div>
          </div>

          {workspaceUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-semibold text-slate-900">{workspaceUser.displayName}</p>
                <p className="text-slate-500">{workspaceUser.email}</p>
              </div>
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          ) : (
            <GoogleSignInButton onClick={onSignInGoogle} loading={authLoading} />
          )}
        </div>

        {workspaceUser && accessToken ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Buat Google Spreadsheet Baru Otomatis
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Membuat spreadsheet baru berisi 3 tab lengkap:{' '}
                <span className="font-medium">Rekap Sesi Harian</span> ({sessions.length} baris),{' '}
                <span className="font-medium">Ringkasan Akumulasi</span>, dan{' '}
                <span className="font-medium">Action Items</span> ({actionItems.length} item).
              </p>
              <button
                type="button"
                onClick={() => onRequestCreateSheet(stats.avgWeightedScore, letter.letter)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <Table2 className="w-4 h-4" />
                Buat &amp; Sinkronkan Spreadsheet Baru
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Perbarui Spreadsheet yang Sudah Ada
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={existingSheetInput}
                  onChange={(e) => setExistingSheetInput(e.target.value)}
                  placeholder="Tempel URL atau Spreadsheet ID Google Sheets..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleLookupSheet}
                  disabled={metaLoading || !existingSheetInput.trim()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
                >
                  {metaLoading ? 'Membaca...' : 'Baca Tab'}
                </button>
              </div>

              {metaError && <p className="text-xs text-rose-700">{metaError}</p>}

              {sheetMeta && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/55 p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 truncate">{sheetMeta.title}</span>
                    <a
                      href={sheetMeta.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline shrink-0"
                    >
                      Buka <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTabName}
                      onChange={(e) => setSelectedTabName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {sheetMeta.sheets.map((tab) => (
                        <option key={tab.sheetId} value={tab.title}>
                          Tab: {tab.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        onRequestSyncExistingSheet(
                          sheetMeta.spreadsheetId,
                          sheetMeta.title,
                          selectedTabName,
                          stats.avgWeightedScore,
                          letter.letter
                        )
                      }
                      className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                    >
                      Tulis ke Tab Ini
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
            Silakan masuk menggunakan tombol <strong>Sign in with Google</strong> di atas untuk
            membuat atau memperbarui Google Sheets langsung dari data audit.
          </div>
        )}
      </div>

      {/* Offline Print / PDF & CSV / JSON Export */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Ekspor Laporan Akademik (Cetak PDF / CSV / JSON)
          </h2>
          <p className="text-xs text-slate-500">
            Ringkasan siap cetak atau olah lanjut di Excel · Total omset {formatIdr(stats.totalRevenueIdr)} ·
            Rata-rata {stats.avgWeightedScore.toFixed(1)} ({letter.letter})
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenPrintReport(sessions[0] || null)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan Audit (PDF)
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Unduh CSV Rekap Sesi
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Unduh Backup JSON Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}
