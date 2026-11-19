import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  LogIn,
  PenLine,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Unlock,
} from 'lucide-react';
import type {
  ActionItemEntry,
  AuditSession,
  ChecklistItemStatus,
  ChecklistPhase,
  Item14Outcome,
  OperationalDay,
  RubricCriterionKey,
  SessionStatus,
  UserRole,
} from '../types/audit';
import {
  COURSE_NAME,
  OPERATIONAL_DAYS,
  calculateWeightedScore,
  createDefaultChecklist,
  createDefaultRubric,
  formatCashVariance,
  formatIdr,
  getMonthFromDate,
  getOperationalDayFromDate,
} from '../utils/calculations';
import { SignaturePadBox } from './GlassPrimitives';

function createBlankSession(defaultAuditorName?: string): AuditSession {
  const todayStr = '2026-11-18';
  return {
    id: `ses-${Date.now()}`,
    courseName: COURSE_NAME,
    groupName: 'Kelompok 01 — LAHAP Cafe Lab',
    day: getOperationalDayFromDate(todayStr),
    date: todayStr,
    month: getMonthFromDate(todayStr),
    shiftManager: 'Raka Pratama',
    auditorName: defaultAuditorName || 'Dr. Hendra Wijaya, M.M.',
    sessionStatus: 'Operasional Normal',
    isPosTransition: false,
    checklist: createDefaultChecklist(),
    rubric: createDefaultRubric({ financial: 88, operational: 86, service: 87, teamwork: 88 }),
    weightedScore: 87.3,
    totalRevenueIdr: 2750000,
    recordedCashIdr: 2750000,
    actualCashIdr: 2750000,
    cashVarianceIdr: 0,
    kitchenWasteGrams: 580,
    avgDrinkTicketMin: 3.9,
    avgFoodTicketMin: 8.6,
    qrFeedbackCount: 28,
    lastRecoveryCases: 0,
    auditorSummaryNote: '',
    shiftManagerSignature: null,
    auditorSignature: null,
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editHistory: [],
  };
}

export function ObservationFormView({
  editingSession,
  role,
  defaultAuditorName,
  onSaveSession,
  onCancelEdit,
  onUnlockSession,
  onAddActionItem,
  onPrintSession,
  onRequestLogin,
}: {
  editingSession: AuditSession | null;
  role: UserRole;
  defaultAuditorName?: string;
  onSaveSession: (session: AuditSession, editReason?: string, isEdit?: boolean) => void;
  onCancelEdit: () => void;
  onUnlockSession: (sessionId: string) => void;
  onAddActionItem: (item: Omit<ActionItemEntry, 'id'>) => void;
  onPrintSession?: (session: AuditSession) => void;
  onRequestLogin?: () => void;
}) {
  const isEditing = editingSession !== null;
  const [form, setForm] = useState<AuditSession>(() =>
    editingSession ? structuredClone(editingSession) : createBlankSession(defaultAuditorName)
  );
  const [editReason, setEditReason] = useState('');
  const [showFieldNotes, setShowFieldNotes] = useState(true);

  // Inline Action Item draft
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Shift Manager');
  const [newActionPriority, setNewActionPriority] = useState<ActionItemEntry['priority']>('Sedang');
  const [newActionCategory, setNewActionCategory] =
    useState<ActionItemEntry['category']>('Kas & POS');
  const [pendingActionItems, setPendingActionItems] = useState<Omit<ActionItemEntry, 'id'>[]>([]);

  // Gemini Quick Draft state
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSession) {
      setForm(structuredClone(editingSession));
    } else {
      setForm(createBlankSession(defaultAuditorName));
    }
    setEditReason('');
    setPendingActionItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSession]);

  useEffect(() => {
    if (!editingSession && defaultAuditorName) {
      setForm((prev) =>
        prev.auditorName === 'Dr. Hendra Wijaya, M.M.' || !prev.auditorName.trim()
          ? { ...prev, auditorName: defaultAuditorName }
          : prev
      );
    }
  }, [defaultAuditorName, editingSession]);

  const isReadOnly = role !== 'dosen' || (isEditing && form.isLocked);
  const isHoliday = form.sessionStatus === 'Libur / Tidak Beroperasi';

  const updateRubricScore = (key: RubricCriterionKey, score: number) => {
    const clamped = Math.max(1, Math.min(100, Number.isNaN(score) ? 1 : score));
    const nextRubric = {
      ...form.rubric,
      [key]: { ...form.rubric[key], score: clamped },
    };
    setForm({
      ...form,
      rubric: nextRubric,
      weightedScore: isHoliday ? 0 : calculateWeightedScore(nextRubric),
    });
  };

  const updateRubricNote = (key: RubricCriterionKey, note: string) => {
    setForm({
      ...form,
      rubric: {
        ...form.rubric,
        [key]: { ...form.rubric[key], note },
      },
    });
  };

  const updateChecklistItem = (
    itemNumber: number,
    patch: Partial<AuditSession['checklist'][number]>
  ) => {
    setForm({
      ...form,
      checklist: form.checklist.map((item) =>
        item.itemNumber === itemNumber ? { ...item, ...patch } : item
      ),
    });
  };

  const handlePhotoUpload = (itemNumber: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const rawDataUrl = reader.result;

      const commitImage = (finalDataUrl: string) => {
        setForm((prev) => ({
          ...prev,
          checklist: prev.checklist.map((c) => {
            if (c.itemNumber !== itemNumber) return c;
            return {
              ...c,
              evidenceList: [
                ...c.evidenceList,
                {
                  id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: file.name,
                  dataUrl: finalDataUrl,
                  caption: `Bukti temuan #${itemNumber}`,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            };
          }),
        }));
      };

      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetW, targetH);
          commitImage(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          commitImage(rawDataUrl);
        }
      };
      img.onerror = () => commitImage(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEvidence = (itemNumber: number, evId: string) => {
    const target = form.checklist.find((c) => c.itemNumber === itemNumber);
    if (!target) return;
    updateChecklistItem(itemNumber, {
      evidenceList: target.evidenceList.filter((e) => e.id !== evId),
    });
  };

  const handleDateChange = (nextDate: string) => {
    setForm({
      ...form,
      date: nextDate,
      month: getMonthFromDate(nextDate),
      day: getOperationalDayFromDate(nextDate),
    });
  };

  const handleCashChange = (field: 'recordedCashIdr' | 'actualCashIdr', val: number) => {
    const nextRecorded = field === 'recordedCashIdr' ? val : form.recordedCashIdr;
    const nextActual = field === 'actualCashIdr' ? val : form.actualCashIdr;
    setForm({
      ...form,
      recordedCashIdr: nextRecorded,
      actualCashIdr: nextActual,
      cashVarianceIdr: nextActual - nextRecorded,
    });
  };

  const handleGeminiDraftNote = async () => {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const flaggedItems = form.checklist
        .filter((c) => c.status !== 'sesuai' || c.findingNote.trim().length > 0)
        .map((c) => `#${c.itemNumber} (${c.status}): ${c.findingNote || c.label}`);

      const res = await fetch('/api/gemini/draft-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionSnapshot: {
            date: form.date,
            day: form.day,
            shiftManager: form.shiftManager,
            sessionStatus: form.sessionStatus,
            weightedScore: form.weightedScore,
            cashVarianceIdr: form.cashVarianceIdr,
            kitchenWasteGrams: form.kitchenWasteGrams,
            avgDrinkTicketMin: form.avgDrinkTicketMin,
            avgFoodTicketMin: form.avgFoodTicketMin,
            flaggedChecklistItems: flaggedItems,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyusun draf catatan.');
      setForm((prev) => ({
        ...prev,
        auditorSummaryNote: data.auditorNote || prev.auditorSummaryNote,
      }));
      if (data.suggestedActionItem && !newActionTitle) {
        setNewActionTitle(data.suggestedActionItem);
      }
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Gagal menyusun draf catatan otomatis.');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleAddLocalActionItem = () => {
    if (!newActionTitle.trim()) return;
    setPendingActionItems((prev) => [
      ...prev,
      {
        sessionId: form.id,
        sessionDate: form.date,
        title: newActionTitle.trim(),
        owner: newActionOwner.trim() || form.shiftManager,
        priority: newActionPriority,
        status: 'Open',
        dueDate: form.date,
        category: newActionCategory,
      },
    ]);
    setNewActionTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const finalSession: AuditSession = {
      ...form,
      shiftManager: form.shiftManager.trim() || 'Shift Manager',
      auditorName: form.auditorName.trim() || defaultAuditorName || 'Dosen Evaluator',
      isPosTransition: form.sessionStatus === 'Penyesuaian Jam / Masa Transisi POS',
      weightedScore: isHoliday ? 0 : calculateWeightedScore(form.rubric),
      updatedAt: new Date().toISOString(),
    };

    for (const item of pendingActionItems) {
      onAddActionItem(item);
    }

    onSaveSession(finalSession, editReason.trim() || undefined, isEditing);
    if (!isEditing) {
      setForm(createBlankSession(defaultAuditorName));
      setPendingActionItems([]);
      setEditReason('');
    }
  };

  const phases: ChecklistPhase[] = [
    'PRE-OPENING (Setup Mandiri)',
    'SERVICE RUSH (Live Operations)',
    'POST-CLOSING (Closing & Audit)',
  ];

  const completedChecklistCount = form.checklist.filter((c) => c.checked).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Banner: Edit / Locked / Student View */}
      {role !== 'dosen' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/75 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-900">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-700" />
            <div>
              Mode <span className="font-semibold">Mahasiswa / Grup Start-up</span> aktif. Anda dapat
              meninjau struktur lembar observasi harian, namun penginputan &amp; pengubahan nilai hanya
              tersedia setelah login <span className="font-semibold">Dosen / Evaluator</span>.
            </div>
          </div>
          {onRequestLogin && (
            <button
              type="button"
              onClick={onRequestLogin}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login Dosen Sekarang
            </button>
          )}
        </div>
      )}

      {isEditing && (
        <div className="glass-panel-elevated rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-blue-300/80">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-blue-900">
              Mode Edit Lembar Observasi · {form.day}, {form.date} ({form.month})
            </p>
            <p className="text-xs text-slate-600">
              Perubahan yang disimpan akan otomatis memperbarui akumulasi 3 bulan, analyzer, dan
              dicatat ke Audit Trail Edit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onPrintSession && (
              <button
                type="button"
                onClick={() => onPrintSession(form)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Laporan Audit
              </button>
            )}
            {form.isLocked && role === 'dosen' && (
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, isLocked: false }));
                  onUnlockSession(form.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-amber-700 whitespace-nowrap"
              >
                <Unlock className="w-3.5 h-3.5" />
                Buka Kunci Sesi
              </button>
            )}
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Batal Edit
            </button>
          </div>
        </div>
      )}

      {/* Header & Metadata Sesi */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div>
            <p className="text-xs font-medium text-blue-700">{form.courseName}</p>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Lembar Observasi &amp; Checklist Harian Operasional Cafe Lab
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Skor Tertimbang Harian</p>
            <p className="font-mono-num text-2xl font-bold text-blue-700">
              {isHoliday ? 'Libur' : `${form.weightedScore.toFixed(1)} / 100`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kelompok</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tanggal Sesi (Sel–Jum)
            </label>
            <div className="flex gap-2">
              <select
                disabled={isReadOnly}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value as OperationalDay })}
                className="rounded-lg border border-slate-200 bg-white/85 px-2.5 py-2 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
              >
                {OPERATIONAL_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="date"
                disabled={isReadOnly}
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Bulan Periode (Okt 2026–Jan 2027)
            </label>
            <input
              type="text"
              readOnly
              value={form.month}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Shift Manager / Leader
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={form.shiftManager}
              onChange={(e) => setForm({ ...form, shiftManager: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dosen / Auditor</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={form.auditorName}
              onChange={(e) => setForm({ ...form, auditorName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status Sesi</label>
            <select
              disabled={isReadOnly}
              value={form.sessionStatus}
              onChange={(e) => {
                const nextStatus = e.target.value as SessionStatus;
                setForm({
                  ...form,
                  sessionStatus: nextStatus,
                  isPosTransition: nextStatus === 'Penyesuaian Jam / Masa Transisi POS',
                  weightedScore:
                    nextStatus === 'Libur / Tidak Beroperasi'
                      ? 0
                      : calculateWeightedScore(form.rubric),
                });
              }}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            >
              <option value="Operasional Normal">Operasional Normal</option>
              <option value="Penyesuaian Jam / Masa Transisi POS">
                Penyesuaian Jam / Masa Transisi POS
              </option>
              <option value="Libur / Tidak Beroperasi">Libur / Tidak Beroperasi</option>
            </select>
          </div>
        </div>

        {/* Catatan Penyesuaian Realita Operasional Lapangan */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/75 p-4">
          <button
            type="button"
            onClick={() => setShowFieldNotes((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-xs font-semibold text-slate-800">
              Catatan Penyesuaian Realita Operasional Lapangan
            </span>
            {showFieldNotes ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {showFieldNotes && (
            <ol className="mt-2.5 space-y-1 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
              <li>
                Briefing Pagi / Morning Briefing dihilangkan dari indikator wajib (tidak dilaksanakan
                oleh mahasiswa).
              </li>
              <li>
                Evaluasi Penutupan / Closing Rapat Sore disesuaikan menjadi &lsquo;Kondisional /
                Insidental&rsquo; (hanya dilakukan jika terjadi masalah operasional/kas).
              </li>
              <li>
                Penilaian difokuskan penuh pada kesiapan mandiri pre-opening, eksekusi live service,
                pencatatan kas/POS, kebersihan, serta closing &amp; rekonsiliasi kas.
              </li>
            </ol>
          )}
        </div>
      </div>

      {/* Bagian 1: Checklist Tugas Harian Mahasiswa (14 Item) */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Bagian 1: Checklist Tugas Harian Mahasiswa (14 Item)
            </h3>
            <p className="text-xs text-slate-500">
              Tandai status kepatuhan per fase, catat temuan, dan lampirkan bukti foto jika diperlukan
            </p>
          </div>
          <span className="font-mono-num text-xs font-semibold text-blue-700">
            {completedChecklistCount} / 14 terpenuhi
          </span>
        </div>

        <div className="space-y-6">
          {phases.map((phase) => {
            const phaseItems = form.checklist.filter((c) => c.phase === phase);
            return (
              <div key={phase} className="space-y-2.5">
                <h4 className="text-xs font-semibold text-blue-800 border-b border-slate-200/80 pb-1.5">
                  {phase}
                </h4>
                <div className="divide-y divide-slate-200/70">
                  {phaseItems.map((item) => (
                    <div key={item.itemNumber} className="py-3.5 space-y-2.5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={item.checked}
                            onChange={(e) =>
                              updateChecklistItem(item.itemNumber, {
                                checked: e.target.checked,
                                status: e.target.checked ? 'sesuai' : 'perhatian',
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          />
                          <span className="text-sm text-slate-800 leading-snug">
                            {item.label}
                          </span>
                        </label>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                            {(
                              [
                                { id: 'sesuai', label: 'Sesuai' },
                                { id: 'perhatian', label: 'Perhatian' },
                                { id: 'tidak_sesuai', label: 'Tidak Sesuai' },
                              ] as { id: ChecklistItemStatus; label: string }[]
                            ).map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() =>
                                  updateChecklistItem(item.itemNumber, {
                                    status: st.id,
                                    checked: st.id !== 'tidak_sesuai',
                                  })
                                }
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                  item.status === st.id
                                    ? st.id === 'sesuai'
                                      ? 'bg-emerald-600 text-white'
                                      : st.id === 'perhatian'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-rose-600 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>

                          {!isReadOnly && (
                            <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                              <Camera className="w-3.5 h-3.5 text-blue-700" />
                              <span>Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(item.itemNumber, e.target.files)}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Item 14 conditional outcome */}
                      {item.itemNumber === 14 && (
                        <div className="pl-7 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">
                            Status Penutupan &amp; Rapat Insidental:
                          </span>
                          {(
                            [
                              'CLAYGO Selesai',
                              'Rapat Insidental Terlaksana [Ada Kendala]',
                              'Tidak Ada Kendala / Tidak Diperlukan',
                            ] as Item14Outcome[]
                          ).map((outcome) => (
                            <button
                              key={outcome}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() =>
                                updateChecklistItem(14, { item14Outcome: outcome })
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                                item.item14Outcome === outcome
                                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {outcome}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="pl-7 space-y-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={item.findingNote}
                          onChange={(e) =>
                            updateChecklistItem(item.itemNumber, { findingNote: e.target.value })
                          }
                          placeholder="Catatan temuan untuk item ini (opsional)..."
                          className="w-full rounded-lg border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none disabled:opacity-60"
                        />

                        {item.evidenceList.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {item.evidenceList.map((ev) => (
                              <div
                                key={ev.id}
                                className="relative rounded-lg border border-slate-200 bg-white p-1.5 flex items-center gap-2"
                              >
                                <img
                                  src={ev.dataUrl}
                                  alt={ev.name}
                                  referrerPolicy="no-referrer"
                                  className="h-12 w-12 rounded object-cover"
                                />
                                <div className="text-[11px] max-w-[140px]">
                                  <p className="font-medium text-slate-800 truncate">{ev.name}</p>
                                  <p className="text-slate-500">Bukti visual</p>
                                </div>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEvidence(item.itemNumber, ev.id)}
                                    className="rounded p-1 text-slate-400 hover:text-rose-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 2: Penilaian Harian Evaluator (1-100) */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Bagian 2: Penilaian Harian Evaluator (Skor 1–100)
            </h3>
            <p className="text-xs text-slate-500">
              Geser slider atau isi angka presisi; bobot otomatis membentuk Skor Tertimbang Harian
            </p>
          </div>
          <span className="font-mono-num text-sm font-bold text-blue-700">
            Total: {isHoliday ? '0.0 (Libur)' : form.weightedScore.toFixed(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['financial', 'operational', 'service', 'teamwork'] as RubricCriterionKey[]).map(
            (key) => {
              const crit = form.rubric[key];
              const weightedPart = (crit.score * crit.weight).toFixed(1);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200/90 bg-white/70 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {crit.title.replace(/^\d+\.\s*/, '')}
                      </p>
                      <p className="text-xs font-mono-num text-blue-700">
                        Bobot {Math.round(crit.weight * 100)}% · Kontribusi {weightedPart} pts
                      </p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      disabled={isReadOnly || isHoliday}
                      value={crit.score}
                      onChange={(e) => updateRubricScore(key, Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-mono-num text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={100}
                    disabled={isReadOnly || isHoliday}
                    value={crit.score}
                    onChange={(e) => updateRubricScore(key, Number(e.target.value))}
                    className="w-full accent-blue-700 disabled:opacity-50"
                  />

                  <ul className="space-y-1 text-xs text-slate-600">
                    {crit.indicators.map((ind, idx) => (
                      <li key={idx}>• {ind}</li>
                    ))}
                  </ul>

                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={crit.note}
                    onChange={(e) => updateRubricNote(key, e.target.value)}
                    placeholder="Catatan / Temuan kriteria ini..."
                    className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none disabled:opacity-60"
                  />
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Bagian 3: Ringkasan Rekapitulasi Harian, Operasional & Tanda Tangan */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Bagian 3: Ringkasan Rekapitulasi Harian &amp; Tanda Tangan
            </h3>
            <p className="text-xs text-slate-500">
              Rekonsiliasi kas, omset, kitchen waste, SLA ticket time, tindak lanjut, dan validasi
            </p>
          </div>
          {role === 'dosen' && !isReadOnly && (
            <button
              type="button"
              onClick={handleGeminiDraftNote}
              disabled={draftLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap"
            >
              <PenLine className="w-3.5 h-3.5" />
              {draftLoading ? 'Menyusun Draf...' : 'Susun Draf Catatan Otomatis'}
            </button>
          )}
        </div>

        {draftError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            {draftError}
          </div>
        )}

        {/* Financial & Operational Telemetry Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Total Omset Hari Ini (IDR)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              disabled={isReadOnly || isHoliday}
              value={form.totalRevenueIdr}
              onChange={(e) => setForm({ ...form, totalRevenueIdr: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
            <p className="text-[11px] font-mono-num text-slate-500 mt-1">
              {formatIdr(form.totalRevenueIdr)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kas Tercatat / POS (IDR)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              disabled={isReadOnly || isHoliday}
              value={form.recordedCashIdr}
              onChange={(e) => handleCashChange('recordedCashIdr', Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kas Fisik Aktual (IDR)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              disabled={isReadOnly || isHoliday}
              value={form.actualCashIdr}
              onChange={(e) => handleCashChange('actualCashIdr', Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
            <p
              className={`text-[11px] font-mono-num font-semibold mt-1 ${
                form.cashVarianceIdr === 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              Selisih Kas: {formatCashVariance(form.cashVarianceIdr)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Total Waste Harian (gram)
            </label>
            <input
              type="number"
              min={0}
              step={10}
              disabled={isReadOnly || isHoliday}
              value={form.kitchenWasteGrams}
              onChange={(e) => setForm({ ...form, kitchenWasteGrams: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
            <p className="text-[11px] font-mono-num text-slate-500 mt-1">
              Konversi otomatis: {(form.kitchenWasteGrams / 1000).toFixed(2)} kg
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Ticket Time Minuman (SLA &lt; 5 mnt)
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              disabled={isReadOnly || isHoliday}
              value={form.avgDrinkTicketMin}
              onChange={(e) => setForm({ ...form, avgDrinkTicketMin: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Ticket Time Makanan (SLA &lt; 10 mnt)
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              disabled={isReadOnly || isHoliday}
              value={form.avgFoodTicketMin}
              onChange={(e) => setForm({ ...form, avgFoodTicketMin: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Jumlah QR Feedback Terkumpul
            </label>
            <input
              type="number"
              min={0}
              disabled={isReadOnly || isHoliday}
              value={form.qrFeedbackCount}
              onChange={(e) => setForm({ ...form, qrFeedbackCount: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kasus Service Recovery (L.A.S.T)
            </label>
            <input
              type="number"
              min={0}
              disabled={isReadOnly || isHoliday}
              value={form.lastRecoveryCases}
              onChange={(e) => setForm({ ...form, lastRecoveryCases: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Catatan Evaluasi Penting Auditor Hari Ini
          </label>
          <textarea
            rows={3}
            disabled={isReadOnly}
            value={form.auditorSummaryNote}
            onChange={(e) => setForm({ ...form, auditorSummaryNote: e.target.value })}
            placeholder="Tuliskan ringkasan kekuatan, temuan kritis, dan catatan evaluasi auditor..."
            className="w-full rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Action Items / Tindak Lanjut Perbaikan */}
        {!isReadOnly && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/75 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-800">
              Action Items / Tindak Lanjut Perbaikan (Opsional untuk dipantau lintas sesi)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Contoh: Cek selisih void QRIS sebelum closing..."
                className="sm:col-span-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                value={newActionOwner}
                onChange={(e) => setNewActionOwner(e.target.value)}
                placeholder="PIC / Penanggung jawab"
                className="sm:col-span-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <select
                value={newActionCategory}
                onChange={(e) =>
                  setNewActionCategory(e.target.value as ActionItemEntry['category'])
                }
                className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900"
              >
                <option value="Kas & POS">Kas &amp; POS</option>
                <option value="Ticket Time & SLA">Ticket Time &amp; SLA</option>
                <option value="Kitchen Waste & SRC">Kitchen Waste &amp; SRC</option>
                <option value="Service & CLAYGO">Service &amp; CLAYGO</option>
              </select>
              <div className="sm:col-span-2 flex gap-1.5">
                <select
                  value={newActionPriority}
                  onChange={(e) =>
                    setNewActionPriority(e.target.value as ActionItemEntry['priority'])
                  }
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900"
                >
                  <option value="Tinggi">Tinggi</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rendah">Rendah</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLocalActionItem}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {pendingActionItems.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {pendingActionItems.map((act, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <span className="text-slate-800">
                      <span className="font-semibold text-blue-700">[{act.category}]</span>{' '}
                      {act.title} — <span className="text-slate-500">{act.owner}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingActionItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Digital Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignaturePadBox
            roleTitle="Shift Manager / Perwakilan Kelompok"
            signerName={form.shiftManagerSignature?.signedBy || form.shiftManager}
            onSignerNameChange={(name) => setForm({ ...form, shiftManager: name })}
            existingDataUrl={form.shiftManagerSignature?.signatureDataUrl}
            signedAt={form.shiftManagerSignature?.signedAt}
            readOnly={isReadOnly}
            onSaveSignature={(dataUrl) =>
              setForm({
                ...form,
                shiftManagerSignature: {
                  signedBy: form.shiftManager,
                  signatureDataUrl: dataUrl,
                  signedAt: new Date().toISOString(),
                },
              })
            }
            onClearSignature={() => setForm({ ...form, shiftManagerSignature: null })}
          />

          <SignaturePadBox
            roleTitle="Dosen Evaluator / Auditor"
            signerName={form.auditorSignature?.signedBy || form.auditorName}
            onSignerNameChange={(name) => setForm({ ...form, auditorName: name })}
            existingDataUrl={form.auditorSignature?.signatureDataUrl}
            signedAt={form.auditorSignature?.signedAt}
            readOnly={isReadOnly}
            onSaveSignature={(dataUrl) =>
              setForm({
                ...form,
                auditorSignature: {
                  signedBy: form.auditorName,
                  signatureDataUrl: dataUrl,
                  signedAt: new Date().toISOString(),
                },
              })
            }
            onClearSignature={() => setForm({ ...form, auditorSignature: null })}
          />
        </div>

        {/* Edit Reason + Lock Toggle + Save CTA */}
        {role === 'dosen' && (
          <div className="pt-4 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {isEditing && (
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Alasan perubahan untuk Audit Trail Edit (misal: koreksi kuitansi nota)..."
                  className="flex-1 min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
                />
              )}
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={form.isLocked}
                  onChange={(e) => setForm({ ...form, isLocked: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                {form.isLocked ? (
                  <span className="inline-flex items-center gap-1 text-amber-800">
                    <Lock className="w-3.5 h-3.5" /> Kunci Sesi (Finalisasi Audit)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Finalisasi / Kunci
                    setelah simpan
                  </span>
                )}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isEditing && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Batal
                </button>
              )}
              {isEditing && form.isLocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, isLocked: false }));
                    onUnlockSession(form.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
                >
                  <Unlock className="w-4 h-4" />
                  Buka Kunci untuk Mengedit
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Simpan Perubahan & Perbarui Nilai' : 'Simpan Lembar Observasi'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
