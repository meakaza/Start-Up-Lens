import type {
  AcademicMonth,
  AnomalyAlert,
  AuditSession,
  ChecklistItemEntry,
  EditAuditLogEntry,
  GradeThreshold,
  GradingSchemeConfig,
  OperationalDay,
  RubricCriterionKey,
  RubricCriterionScore,
  UserRole,
} from '../types/audit';

export const COURSE_NAME = 'Cafe and Restaurant Business (MAN1106508)';
export const ACADEMIC_MONTHS: AcademicMonth[] = [
  'Oktober',
  'November',
  'Desember',
  'Januari',
];
export const OPERATIONAL_DAYS: OperationalDay[] = ['Sel', 'Rab', 'Kam', 'Jum'];

export const DEFAULT_GRADE_THRESHOLDS: GradeThreshold[] = [
  { letter: 'A', minScore: 85, gpaPoint: 4.0 },
  { letter: 'A-', minScore: 80, gpaPoint: 3.7 },
  { letter: 'B+', minScore: 75, gpaPoint: 3.3 },
  { letter: 'B', minScore: 70, gpaPoint: 3.0 },
  { letter: 'B-', minScore: 65, gpaPoint: 2.7 },
  { letter: 'C+', minScore: 60, gpaPoint: 2.3 },
  { letter: 'C', minScore: 55, gpaPoint: 2.0 },
  { letter: 'D', minScore: 45, gpaPoint: 1.0 },
  { letter: 'E', minScore: 0, gpaPoint: 0.0 },
];

export const DEFAULT_GRADING_SCHEME: GradingSchemeConfig = {
  dailyAccumulationWeight: 70,
  finalPresentationWeight: 30,
  simulatedFinalPresentationScore: 86,
  simulatedRemainingDailyScore: 85,
  simulatedRemainingSessionsCount: 4,
  thresholds: DEFAULT_GRADE_THRESHOLDS,
};

export function createDefaultChecklist(): ChecklistItemEntry[] {
  return [
    {
      itemNumber: 1,
      phase: 'PRE-OPENING (Setup Mandiri)',
      label: 'Tim hadir tepat waktu & menggunakan seragam/apron/atribut higienis lengkap.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 2,
      phase: 'PRE-OPENING (Setup Mandiri)',
      label: 'Menerima & menghitung Modal Kasir Harian (Float) secara presisi.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 3,
      phase: 'PRE-OPENING (Setup Mandiri)',
      label: 'Mise en Place BOH: Prep bahan baku & stasiun dapur sesuai SRC.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 4,
      phase: 'PRE-OPENING (Setup Mandiri)',
      label: 'Kebersihan & kesiapan area dining, meja, serta kasir/POS 100%.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 5,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Front-of-House (FOH): Menyapa tamu, menawarkan menu, & aktif upselling.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 6,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Pencatatan Penjualan: Melakukan pencatatan kas/penjualan manual (atau input POS jika periode transisi).',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 7,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Back-of-House (BOH): Menjaga ticket time (Minuman < 5 mnt, Makanan < 10 mnt).',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 8,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Kepatuhan Porsi & Resep: Menggunakan timbangan/penakar sesuai SRC.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 9,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Customer Feedback: FOH mengarahkan pelanggan mengisi QR Feedback.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 10,
      phase: 'SERVICE RUSH (Live Operations)',
      label: 'Service Recovery: Mengaplikasikan metode L.A.S.T jika ada komplain.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 11,
      phase: 'POST-CLOSING (Closing & Audit)',
      label: 'Rekonsiliasi Kas: Menghitung kas fisik vs. Catatan Manual/POS Summary.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 12,
      phase: 'POST-CLOSING (Closing & Audit)',
      label: 'Menyiapkan Setoran Kas & merapikan nota/kuitansi belanja harian.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 13,
      phase: 'POST-CLOSING (Closing & Audit)',
      label: 'Kitchen Waste Audit: Menimbang & mencatat sisa bahan/porsi rusak.',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      evidenceList: [],
    },
    {
      itemNumber: 14,
      phase: 'POST-CLOSING (Closing & Audit)',
      label: 'CLAYGO & Rapat Insidental: Deep cleaning BOH/FOH & rapat evaluasi (khusus jika ada kendala/masalah hari ini).',
      checked: true,
      status: 'sesuai',
      findingNote: '',
      item14Outcome: 'Tidak Ada Kendala / Tidak Diperlukan',
      evidenceList: [],
    },
  ];
}

export function createDefaultRubric(scores?: Partial<Record<RubricCriterionKey, number>>): Record<RubricCriterionKey, RubricCriterionScore> {
  return {
    financial: {
      key: 'financial',
      title: '1. Financial Accuracy & Cash Flow',
      weight: 0.3,
      indicators: [
        'Kerapian buku kas/sheet pencatatan manual.',
        'Akurasi kas fisik vs catatan (selisih kas).',
        'Kerapian nota belanja/kuitansi harian.',
        'Kelancaran input POS (pada masa transisi).',
      ],
      score: scores?.financial ?? 85,
      note: '',
    },
    operational: {
      key: 'operational',
      title: '2. BOH & FOH Operational Execution',
      weight: 0.25,
      indicators: [
        'Kecepatan ticket time makanan & minuman (Minuman < 5 mnt, Makanan < 10 mnt).',
        'Konsistensi porsi & plating sesuai SRC.',
        'Kesiapan mandiri pre-opening & kebersihan CLAYGO.',
      ],
      score: scores?.operational ?? 85,
      note: '',
    },
    service: {
      key: 'service',
      title: '3. Customer Service & Recovery',
      weight: 0.2,
      indicators: [
        'Keramahan FOH & keaktifan upselling.',
        'Keaktifan pengumpulan QR feedback.',
        'Penanganan komplain pelanggan (L.A.S.T).',
      ],
      score: scores?.service ?? 85,
      note: '',
    },
    teamwork: {
      key: 'teamwork',
      title: '4. Teamwork & Shift Discipline',
      weight: 0.25,
      indicators: [
        'Kedisiplinan hadir & koordinasi BOH-FOH.',
        'Tanggung jawab tugas tanpa briefing formal.',
        'Efektivitas rapat insidental jika terjadi masalah.',
      ],
      score: scores?.teamwork ?? 85,
      note: '',
    },
  };
}

export function calculateWeightedScore(rubric: Record<RubricCriterionKey, RubricCriterionScore>): number {
  const total =
    rubric.financial.score * rubric.financial.weight +
    rubric.operational.score * rubric.operational.weight +
    rubric.service.score * rubric.service.weight +
    rubric.teamwork.score * rubric.teamwork.weight;
  return Math.round(total * 10) / 10;
}

export function formatIdr(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  if (amount < 0) return `-IDR ${formatted}`;
  return `IDR ${formatted}`;
}

export function formatCashVariance(variance: number): string {
  if (variance === 0) return 'Sesuai (IDR 0)';
  const abs = new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(variance)));
  return variance > 0 ? `Lebih +IDR ${abs}` : `Kurang -IDR ${abs}`;
}

export function formatWaste(grams: number): { gramsText: string; kgText: string } {
  const kg = grams / 1000;
  return {
    gramsText: `${new Intl.NumberFormat('id-ID').format(Math.round(grams))} g`,
    kgText: `${kg.toFixed(2)} kg`,
  };
}

export function getLetterGrade(score: number, thresholds: GradeThreshold[] = DEFAULT_GRADE_THRESHOLDS): GradeThreshold {
  const sorted = [...thresholds].sort((a, b) => b.minScore - a.minScore);
  for (const t of sorted) {
    if (score >= t.minScore) return t;
  }
  return sorted[sorted.length - 1] ?? { letter: 'E', minScore: 0, gpaPoint: 0 };
}

export function getMonthFromDate(dateStr: string): AcademicMonth {
  const parts = dateStr.split('-');
  const monthNum = Number(parts[1] ?? 10);
  switch (monthNum) {
    case 10:
      return 'Oktober';
    case 11:
      return 'November';
    case 12:
      return 'Desember';
    case 1:
      return 'Januari';
    default:
      return 'Oktober';
  }
}

export function getOperationalDayFromDate(dateStr: string): OperationalDay {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay(); // 0=Sun..6=Sat
  if (day === 2) return 'Sel';
  if (day === 3) return 'Rab';
  if (day === 4) return 'Kam';
  if (day === 5) return 'Jum';
  return 'Sel';
}

export function getLiveOperationalStatus(now: Date): {
  dayLabel: string;
  timeLabel: string;
  dateLabel: string;
  isOperationalDay: boolean;
  isWithinHours: boolean;
  statusTitle: string;
  statusDetail: string;
} {
  const dayIndex = now.getDay(); // 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const isOperationalDay = dayIndex >= 2 && dayIndex <= 5;
  const isWithinHours = isOperationalDay && hours >= 10 && hours < 22;

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeLabel = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const dateLabel = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const dayLabel = dayNames[dayIndex];

  if (isWithinHours) {
    return {
      dayLabel,
      timeLabel,
      dateLabel,
      isOperationalDay,
      isWithinHours,
      statusTitle: 'Live Operational Window: Buka 10.00–22.00',
      statusDetail: 'Sesi operasional reguler sedang berlangsung (Selasa–Jumat).',
    };
  }
  return {
    dayLabel,
    timeLabel,
    dateLabel,
    isOperationalDay,
    isWithinHours,
    statusTitle: 'Di Luar Jam Operasional Reguler',
    statusDetail: isOperationalDay
      ? 'Jadwal hari ini pukul 10.00–22.00.'
      : 'Operasional reguler berjalan setiap Selasa–Jumat, 10.00–22.00.',
  };
}

export function getActiveSessions(sessions: AuditSession[]): AuditSession[] {
  return sessions.filter((s) => s.sessionStatus !== 'Libur / Tidak Beroperasi');
}

export function computeTermAccumulation(sessions: AuditSession[]) {
  const active = getActiveSessions(sessions);
  const holidays = sessions.filter((s) => s.sessionStatus === 'Libur / Tidak Beroperasi');
  const posTransitionSessions = active.filter(
    (s) => s.sessionStatus === 'Penyesuaian Jam / Masa Transisi POS' || s.isPosTransition
  );

  if (active.length === 0) {
    return {
      activeCount: 0,
      holidayCount: holidays.length,
      posTransitionCount: 0,
      avgWeightedScore: 0,
      totalRevenueIdr: 0,
      avgRevenueIdr: 0,
      netCashVarianceIdr: 0,
      absCashVarianceIdr: 0,
      exactCashCount: 0,
      totalWasteGrams: 0,
      avgWasteGrams: 0,
      avgDrinkTicketMin: 0,
      avgFoodTicketMin: 0,
      drinkSlaRate: 0,
      foodSlaRate: 0,
      totalQrFeedback: 0,
      totalLastCases: 0,
      avgRubric: { financial: 0, operational: 0, service: 0, teamwork: 0 },
    };
  }

  const n = active.length;
  const sumScore = active.reduce((acc, s) => acc + s.weightedScore, 0);
  const totalRevenueIdr = active.reduce((acc, s) => acc + s.totalRevenueIdr, 0);
  const netCashVarianceIdr = active.reduce((acc, s) => acc + s.cashVarianceIdr, 0);
  const absCashVarianceIdr = active.reduce((acc, s) => acc + Math.abs(s.cashVarianceIdr), 0);
  const exactCashCount = active.filter((s) => s.cashVarianceIdr === 0).length;
  const totalWasteGrams = active.reduce((acc, s) => acc + s.kitchenWasteGrams, 0);
  const avgDrinkTicketMin = active.reduce((acc, s) => acc + s.avgDrinkTicketMin, 0) / n;
  const avgFoodTicketMin = active.reduce((acc, s) => acc + s.avgFoodTicketMin, 0) / n;
  const drinkSlaPass = active.filter((s) => s.avgDrinkTicketMin <= 5).length;
  const foodSlaPass = active.filter((s) => s.avgFoodTicketMin <= 10).length;
  const totalQrFeedback = active.reduce((acc, s) => acc + s.qrFeedbackCount, 0);
  const totalLastCases = active.reduce((acc, s) => acc + s.lastRecoveryCases, 0);

  const avgRubric = {
    financial: Math.round((active.reduce((a, s) => a + s.rubric.financial.score, 0) / n) * 10) / 10,
    operational: Math.round((active.reduce((a, s) => a + s.rubric.operational.score, 0) / n) * 10) / 10,
    service: Math.round((active.reduce((a, s) => a + s.rubric.service.score, 0) / n) * 10) / 10,
    teamwork: Math.round((active.reduce((a, s) => a + s.rubric.teamwork.score, 0) / n) * 10) / 10,
  };

  return {
    activeCount: n,
    holidayCount: holidays.length,
    posTransitionCount: posTransitionSessions.length,
    avgWeightedScore: Math.round((sumScore / n) * 10) / 10,
    totalRevenueIdr,
    avgRevenueIdr: Math.round(totalRevenueIdr / n),
    netCashVarianceIdr,
    absCashVarianceIdr,
    exactCashCount,
    totalWasteGrams,
    avgWasteGrams: Math.round(totalWasteGrams / n),
    avgDrinkTicketMin: Math.round(avgDrinkTicketMin * 10) / 10,
    avgFoodTicketMin: Math.round(avgFoodTicketMin * 10) / 10,
    drinkSlaRate: Math.round((drinkSlaPass / n) * 100),
    foodSlaRate: Math.round((foodSlaPass / n) * 100),
    totalQrFeedback,
    totalLastCases,
    avgRubric,
  };
}

export function detectAnomalies(sessions: AuditSession[]): AnomalyAlert[] {
  const active = getActiveSessions(sessions).sort((a, b) => a.date.localeCompare(b.date));
  if (active.length === 0) return [];

  const avgScore = active.reduce((acc, s) => acc + s.weightedScore, 0) / active.length;
  const alerts: AnomalyAlert[] = [];

  for (const s of active) {
    if (Math.abs(s.cashVarianceIdr) >= 25000) {
      alerts.push({
        id: `anom-cash-${s.id}`,
        sessionId: s.id,
        date: s.date,
        month: s.month,
        severity: Math.abs(s.cashVarianceIdr) >= 50000 ? 'critical' : 'warning',
        category: 'Selisih Kas',
        title: `Selisih Kas ${formatCashVariance(s.cashVarianceIdr)}`,
        description: `Shift ${s.shiftManager} (${s.day}, ${s.date}) mencatat selisih kas antara kas fisik dan ${s.isPosTransition ? 'POS Summary masa transisi' : 'buku kas manual'}.`,
        metricValue: formatCashVariance(s.cashVarianceIdr),
      });
    }

    if (s.kitchenWasteGrams >= 1100) {
      alerts.push({
        id: `anom-waste-${s.id}`,
        sessionId: s.id,
        date: s.date,
        month: s.month,
        severity: s.kitchenWasteGrams >= 1400 ? 'critical' : 'warning',
        category: 'Kitchen Waste Tinggi',
        title: `Kitchen Waste Tinggi (${(s.kitchenWasteGrams / 1000).toFixed(2)} kg)`,
        description: `Sisa bahan dan porsi rusak pada ${s.date} melebihi ambang 1.10 kg/sesi. Periksa kepatuhan SRC & mise en place BOH.`,
        metricValue: `${s.kitchenWasteGrams} g`,
      });
    }

    if (s.weightedScore < 75 || s.weightedScore <= avgScore - 8) {
      alerts.push({
        id: `anom-score-${s.id}`,
        sessionId: s.id,
        date: s.date,
        month: s.month,
        severity: s.weightedScore < 72 ? 'critical' : 'warning',
        category: 'Skor Turun Tajam',
        title: `Penurunan Skor Harian (${s.weightedScore.toFixed(1)}/100)`,
        description: `Skor sesi ${s.date} terpaut signifikan di bawah rata-rata periode (${avgScore.toFixed(1)}). ${s.auditorSummaryNote.slice(0, 90)}`,
        metricValue: `${s.weightedScore.toFixed(1)} pts`,
      });
    }

    const item14 = s.checklist.find((c) => c.itemNumber === 14);
    if (item14?.item14Outcome === 'Rapat Insidental Terlaksana [Ada Kendala]') {
      alerts.push({
        id: `anom-meeting-${s.id}`,
        sessionId: s.id,
        date: s.date,
        month: s.month,
        severity: 'warning',
        category: 'Rapat Insidental / Kendala',
        title: `Rapat Insidental Kendala Operasional`,
        description: item14.findingNote || `Terjadi kendala operasional pada ${s.date} yang memicu rapat evaluasi penutupan.`,
        metricValue: `${s.day} · ${s.month}`,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

export function buildAuditDiffLogs(
  previous: AuditSession,
  updated: AuditSession,
  editorName: string,
  editorRole: UserRole,
  reason?: string
): EditAuditLogEntry[] {
  const logs: EditAuditLogEntry[] = [];
  const nowIso = new Date().toISOString();

  const pushLog = (fieldLabel: string, oldVal: string, newVal: string) => {
    if (oldVal === newVal) return;
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: nowIso,
      editorName,
      editorRole,
      fieldLabel,
      oldValue: oldVal,
      newValue: newVal,
      reason,
    });
  };

  pushLog('Kelompok', previous.groupName, updated.groupName);
  pushLog('Tanggal Sesi', `${previous.day}, ${previous.date}`, `${updated.day}, ${updated.date}`);
  pushLog('Shift Manager', previous.shiftManager, updated.shiftManager);
  pushLog('Dosen / Auditor', previous.auditorName, updated.auditorName);
  pushLog('Status Sesi', previous.sessionStatus, updated.sessionStatus);

  const rubricKeys: RubricCriterionKey[] = ['financial', 'operational', 'service', 'teamwork'];
  for (const key of rubricKeys) {
    pushLog(
      `Skor ${updated.rubric[key].title}`,
      String(previous.rubric[key].score),
      String(updated.rubric[key].score)
    );
    pushLog(
      `Catatan ${updated.rubric[key].title}`,
      previous.rubric[key].note || '-',
      updated.rubric[key].note || '-'
    );
  }

  pushLog('Skor Tertimbang Harian', previous.weightedScore.toFixed(1), updated.weightedScore.toFixed(1));
  pushLog('Total Omset Harian', formatIdr(previous.totalRevenueIdr), formatIdr(updated.totalRevenueIdr));
  pushLog('Selisih Kas Harian', formatCashVariance(previous.cashVarianceIdr), formatCashVariance(updated.cashVarianceIdr));
  pushLog('Total Waste Harian', `${previous.kitchenWasteGrams} g`, `${updated.kitchenWasteGrams} g`);
  pushLog('Ticket Time Minuman', `${previous.avgDrinkTicketMin} mnt`, `${updated.avgDrinkTicketMin} mnt`);
  pushLog('Ticket Time Makanan', `${previous.avgFoodTicketMin} mnt`, `${updated.avgFoodTicketMin} mnt`);
  pushLog('Catatan Evaluasi Auditor', previous.auditorSummaryNote || '-', updated.auditorSummaryNote || '-');
  pushLog('Status Kunci Sesi', previous.isLocked ? 'Terkunci' : 'Terbuka', updated.isLocked ? 'Terkunci' : 'Terbuka');

  for (let i = 0; i < updated.checklist.length; i++) {
    const prevItem = previous.checklist[i];
    const nextItem = updated.checklist[i];
    if (!prevItem || !nextItem) continue;
    if (prevItem.status !== nextItem.status || prevItem.checked !== nextItem.checked) {
      pushLog(
        `Checklist #${nextItem.itemNumber}`,
        `${prevItem.checked ? 'Selesai' : 'Belum'} (${prevItem.status})`,
        `${nextItem.checked ? 'Selesai' : 'Belum'} (${nextItem.status})`
      );
    }
    if (prevItem.findingNote !== nextItem.findingNote) {
      pushLog(
        `Temuan Checklist #${nextItem.itemNumber}`,
        prevItem.findingNote || '-',
        nextItem.findingNote || '-'
      );
    }
    if (prevItem.item14Outcome !== nextItem.item14Outcome) {
      pushLog(
        'Outcome Item #14 (CLAYGO & Rapat Insidental)',
        prevItem.item14Outcome || '-',
        nextItem.item14Outcome || '-'
      );
    }
  }

  return logs;
}

export function exportSessionsToCsv(sessions: AuditSession[]): string {
  const headers = [
    'ID',
    'Tanggal',
    'Hari',
    'Bulan',
    'Status Sesi',
    'Shift Manager',
    'Auditor',
    'Skor Financial (30%)',
    'Skor Ops (25%)',
    'Skor Service (20%)',
    'Skor Teamwork (25%)',
    'Skor Tertimbang Harian',
    'Omset Harian (IDR)',
    'Kas Tercatat (IDR)',
    'Kas Fisik (IDR)',
    'Selisih Kas (IDR)',
    'Kitchen Waste (gram)',
    'Kitchen Waste (kg)',
    'Avg Ticket Minuman (mnt)',
    'Avg Ticket Makanan (mnt)',
    'QR Feedback',
    'Kasus L.A.S.T',
    'Outcome Item 14',
    'Catatan Auditor',
  ];

  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sessions.map((s) => {
    const item14 = s.checklist.find((c) => c.itemNumber === 14);
    return [
      s.id,
      s.date,
      s.day,
      s.month,
      s.sessionStatus,
      s.shiftManager,
      s.auditorName,
      s.rubric.financial.score,
      s.rubric.operational.score,
      s.rubric.service.score,
      s.rubric.teamwork.score,
      s.weightedScore,
      s.totalRevenueIdr,
      s.recordedCashIdr,
      s.actualCashIdr,
      s.cashVarianceIdr,
      s.kitchenWasteGrams,
      (s.kitchenWasteGrams / 1000).toFixed(2),
      s.avgDrinkTicketMin,
      s.avgFoodTicketMin,
      s.qrFeedbackCount,
      s.lastRecoveryCases,
      item14?.item14Outcome ?? '-',
      s.auditorSummaryNote,
    ]
      .map(escape)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escape).join(','), ...rows].join('\n');
}
