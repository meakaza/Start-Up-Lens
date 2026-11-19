import type {
  ActionItemEntry,
  AuditSession,
  ChecklistItemEntry,
  DigitalSignature,
  EditAuditLogEntry,
  Item14Outcome,
  OperationalDay,
  SessionStatus,
} from '../types/audit';
import {
  COURSE_NAME,
  calculateWeightedScore,
  createDefaultChecklist,
  createDefaultRubric,
  getMonthFromDate,
} from '../utils/calculations';

interface SeedSpec {
  id: string;
  date: string;
  day: OperationalDay;
  shiftManager: string;
  status: SessionStatus;
  scores: [number, number, number, number]; // financial, operational, service, teamwork
  revenue: number;
  cashVariance: number;
  wasteGrams: number;
  drinkMin: number;
  foodMin: number;
  qrCount: number;
  lastCases: number;
  item14: Item14Outcome;
  summary: string;
  locked: boolean;
  findings?: Record<number, { status: ChecklistItemEntry['status']; note: string }>;
  editLogs?: EditAuditLogEntry[];
}

function makeMockSig(name: string, date: string): DigitalSignature {
  const safeName = name.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72"><path d="M18 46 Q 42 18, 65 44 T 118 38 Q 145 24, 172 45 T 220 34" fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/><text x="18" y="64" font-family="sans-serif" font-size="10" fill="#475569">Signed digitally: ${safeName}</text></svg>`;
  return {
    signedBy: name,
    signatureDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    signedAt: `${date}T21:48:00`,
  };
}

const SPECS: SeedSpec[] = [
  // AKHIR OKTOBER 2026 (Pembukaan Audit & Transisi POS Awal)
  {
    id: 'ses-2026-10-22',
    date: '2026-10-22',
    day: 'Kam',
    shiftManager: 'Raka Pratama',
    status: 'Operasional Normal',
    scores: [79, 77, 81, 80],
    revenue: 2140000,
    cashVariance: -15000,
    wasteGrams: 1180,
    drinkMin: 4.8,
    foodMin: 10.5,
    qrCount: 17,
    lastCases: 1,
    item14: 'Rapat Insidental Terlaksana [Ada Kendala]',
    summary: 'Pembukaan periode perbaikan akhir Oktober 2026: mise en place cukup siap namun food ticket time masih 10.5 menit saat jam makan siang dan waste saus tercatat 1.18 kg.',
    locked: true,
    findings: {
      7: { status: 'perhatian', note: 'Rata-rata food ticket time 10.5 mnt karena antrean di stasiun grill.' },
      11: { status: 'perhatian', note: 'Selisih kas -IDR 15.000; nota pembelian es batu terlewat di buku manual.' },
      13: { status: 'tidak_sesuai', note: 'Waste tercatat 1.180 gram akibat over-prep batch saus pasta.' },
      14: { status: 'sesuai', note: 'Rapat insidental 15 menit membahas alur pemisahan bon dapur & bar.' },
    },
  },
  {
    id: 'ses-2026-10-27',
    date: '2026-10-27',
    day: 'Sel',
    shiftManager: 'Salsa Permata',
    status: 'Penyesuaian Jam / Masa Transisi POS',
    scores: [74, 80, 82, 81],
    revenue: 2420000,
    cashVariance: -45000,
    wasteGrams: 840,
    drinkMin: 4.6,
    foodMin: 9.7,
    qrCount: 22,
    lastCases: 2,
    item14: 'Rapat Insidental Terlaksana [Ada Kendala]',
    summary: 'Uji coba POS digital paralel dengan buku kas manual akhir Oktober. Terjadi double-input 1 transaksi QRIS dan selisih kas -IDR 45.000 saat closing.',
    locked: false,
    findings: {
      6: { status: 'perhatian', note: 'Kasir masih beradaptasi memindahkan modifier menu ke layar POS.' },
      11: { status: 'tidak_sesuai', note: 'Selisih -IDR 45.000 akibat void manual belum direkam di POS.' },
      14: { status: 'sesuai', note: 'Rapat insidental evaluasi SOP void transaksi POS & rekonsiliasi shift.' },
    },
    editLogs: [
      {
        id: 'log-seed-1',
        timestamp: '2026-10-28T09:15:00',
        editorName: 'Dr. Hendra Wijaya, M.M.',
        editorRole: 'dosen',
        fieldLabel: 'Skor 1. Financial Accuracy & Cash Flow',
        oldValue: '71',
        newValue: '74',
        reason: 'Penyesuaian setelah kuitansi belanja susu ditemukan pada arsip kasir.',
      },
    ],
  },
  {
    id: 'ses-2026-10-29',
    date: '2026-10-29',
    day: 'Kam',
    shiftManager: 'Nadia Kusuma',
    status: 'Penyesuaian Jam / Masa Transisi POS',
    scores: [86, 85, 87, 86],
    revenue: 2780000,
    cashVariance: 12000,
    wasteGrams: 670,
    drinkMin: 4.1,
    foodMin: 8.9,
    qrCount: 27,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Input POS membaik cepat dengan selisih kecil +IDR 12.000 (pembulatan QRIS). Kepatuhan takaran SRC membaik setelah kalibrasi ulang timbangan.',
    locked: true,
  },
  {
    id: 'ses-2026-10-30',
    date: '2026-10-30',
    day: 'Jum',
    shiftManager: 'Bima Aditya',
    status: 'Penyesuaian Jam / Masa Transisi POS',
    scores: [88, 87, 89, 88],
    revenue: 2950000,
    cashVariance: 0,
    wasteGrams: 610,
    drinkMin: 3.9,
    foodMin: 8.5,
    qrCount: 30,
    lastCases: 1,
    item14: 'CLAYGO Selesai',
    summary: 'Penutup akhir Oktober 2026: rekonsiliasi POS vs kas fisik tepat IDR 0. Nota belanja harian telah diberi nomor urut sesuai standar audit.',
    locked: true,
  },

  // NOVEMBER 2026 (Operasional Penuh & Perbaikan Berkelanjutan)
  {
    id: 'ses-2026-11-04',
    date: '2026-11-04',
    day: 'Rab',
    shiftManager: 'Bima Aditya',
    status: 'Operasional Normal',
    scores: [90, 89, 88, 90],
    revenue: 2940000,
    cashVariance: 0,
    wasteGrams: 540,
    drinkMin: 3.7,
    foodMin: 8.2,
    qrCount: 30,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Transisi POS resmi selesai di awal November. Eksekusi pre-opening mandiri dan serah terima float berjalan tanpa koreksi.',
    locked: true,
  },
  {
    id: 'ses-2026-11-06',
    date: '2026-11-06',
    day: 'Jum',
    shiftManager: 'Salsa Permata',
    status: 'Operasional Normal',
    scores: [85, 76, 84, 82],
    revenue: 3480000,
    cashVariance: -28000,
    wasteGrams: 1460,
    drinkMin: 5.4,
    foodMin: 11.3,
    qrCount: 27,
    lastCases: 2,
    item14: 'Rapat Insidental Terlaksana [Ada Kendala]',
    summary: 'Lonjakan pengunjung Jumat sore menyebabkan bottle-neck ticket time (minuman 5.4 mnt, makanan 11.3 mnt) dan waste 1.46 kg akibat 3 porsi salah order.',
    locked: false,
    findings: {
      7: { status: 'tidak_sesuai', note: 'Ticket time melewati SLA pada pukul 15.30–17.30.' },
      11: { status: 'perhatian', note: 'Selisih kas -IDR 28.000 pada shift pergantian sore.' },
      13: { status: 'tidak_sesuai', note: '3 porsi menu salah input mengakibatkan waste 1.460 g.' },
    },
  },
  {
    id: 'ses-2026-11-12',
    date: '2026-11-12',
    day: 'Kam',
    shiftManager: 'Raka Pratama',
    status: 'Operasional Normal',
    scores: [92, 91, 91, 90],
    revenue: 3150000,
    cashVariance: 0,
    wasteGrams: 480,
    drinkMin: 3.5,
    foodMin: 7.9,
    qrCount: 34,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Perbaikan signifikan pasca rapat insidental: zero cash variance, waste terendah bulan November (480 g), dan upselling FOH sangat aktif.',
    locked: true,
  },
  {
    id: 'ses-2026-11-18',
    date: '2026-11-18',
    day: 'Rab',
    shiftManager: 'Nadia Kusuma',
    status: 'Operasional Normal',
    scores: [91, 90, 92, 91],
    revenue: 2980000,
    cashVariance: 0,
    wasteGrams: 510,
    drinkMin: 3.6,
    foodMin: 8.1,
    qrCount: 33,
    lastCases: 1,
    item14: 'Tidak Ada Kendala / Tidak Diperlukan',
    summary: 'Sesi berjalan sangat stabil. L.A.S.T recovery dilakukan cepat untuk penyesuaian tingkat kemanisan matcha latte.',
    locked: false,
  },
  {
    id: 'ses-2026-11-25',
    date: '2026-11-25',
    day: 'Rab',
    shiftManager: 'Raka Pratama',
    status: 'Libur / Tidak Beroperasi',
    scores: [0, 0, 0, 0],
    revenue: 0,
    cashVariance: 0,
    wasteGrams: 0,
    drinkMin: 0,
    foodMin: 0,
    qrCount: 0,
    lastCases: 0,
    item14: 'Tidak Ada Kendala / Tidak Diperlukan',
    summary: 'Kegiatan Dies Natalis Fakultas — Cafe Lab diliburkan dan dikecualikan dari rata-rata performa.',
    locked: true,
  },

  // DESEMBER 2026 (Evaluasi Lanjutan & Libur Akhir Tahun)
  {
    id: 'ses-2026-12-03',
    date: '2026-12-03',
    day: 'Kam',
    shiftManager: 'Bima Aditya',
    status: 'Operasional Normal',
    scores: [90, 89, 90, 89],
    revenue: 3290000,
    cashVariance: 0,
    wasteGrams: 530,
    drinkMin: 3.7,
    foodMin: 8.3,
    qrCount: 35,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Konsistensi menu seasonal Desember terjaga sesuai SRC baru. Arsip nota & kas fisik 100% cocok.',
    locked: true,
  },
  {
    id: 'ses-2026-12-10',
    date: '2026-12-10',
    day: 'Kam',
    shiftManager: 'Salsa Permata',
    status: 'Operasional Normal',
    scores: [86, 87, 89, 88],
    revenue: 3560000,
    cashVariance: -12000,
    wasteGrams: 690,
    drinkMin: 4.1,
    foodMin: 8.9,
    qrCount: 37,
    lastCases: 1,
    item14: 'CLAYGO Selesai',
    summary: 'Volume penjualan tinggi menjelang UAS. Sedikit selisih kas -IDR 12.000 sudah diverifikasi pada setoran malam.',
    locked: true,
  },
  {
    id: 'ses-2026-12-17',
    date: '2026-12-17',
    day: 'Kam',
    shiftManager: 'Raka Pratama',
    status: 'Operasional Normal',
    scores: [93, 92, 91, 92],
    revenue: 3420000,
    cashVariance: 0,
    wasteGrams: 460,
    drinkMin: 3.4,
    foodMin: 7.6,
    qrCount: 36,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Rekor ticket time tercepat bulan Desember (minuman 3.4 mnt, makanan 7.6 mnt) dengan waste di bawah 500 g.',
    locked: true,
  },
  {
    id: 'ses-2026-12-24',
    date: '2026-12-24',
    day: 'Kam',
    shiftManager: 'Nadia Kusuma',
    status: 'Libur / Tidak Beroperasi',
    scores: [0, 0, 0, 0],
    revenue: 0,
    cashVariance: 0,
    wasteGrams: 0,
    drinkMin: 0,
    foodMin: 0,
    qrCount: 0,
    lastCases: 0,
    item14: 'Tidak Ada Kendala / Tidak Diperlukan',
    summary: 'Libur Akhir Tahun & Natal Kampus — tidak beroperasi, dikecualikan dari kalkulasi IP/nilai.',
    locked: true,
  },
  {
    id: 'ses-2026-12-31',
    date: '2026-12-31',
    day: 'Kam',
    shiftManager: 'Bima Aditya',
    status: 'Libur / Tidak Beroperasi',
    scores: [0, 0, 0, 0],
    revenue: 0,
    cashVariance: 0,
    wasteGrams: 0,
    drinkMin: 0,
    foodMin: 0,
    qrCount: 0,
    lastCases: 0,
    item14: 'Tidak Ada Kendala / Tidak Diperlukan',
    summary: 'Libur Tahun Baru — Cafe Lab tutup.',
    locked: true,
  },

  // JANUARI 2027 (Pekan Evaluasi Akhir Periode 3 Bulan)
  {
    id: 'ses-2027-01-07',
    date: '2027-01-07',
    day: 'Kam',
    shiftManager: 'Salsa Permata',
    status: 'Operasional Normal',
    scores: [91, 90, 92, 91],
    revenue: 3180000,
    cashVariance: 0,
    wasteGrams: 490,
    drinkMin: 3.6,
    foodMin: 8.0,
    qrCount: 34,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Pembukaan awal Januari 2027 berjalan disiplin. Seluruh 14 item checklist tercapai tanpa temuan minor.',
    locked: true,
  },
  {
    id: 'ses-2027-01-14',
    date: '2027-01-14',
    day: 'Kam',
    shiftManager: 'Raka Pratama',
    status: 'Operasional Normal',
    scores: [94, 93, 94, 93],
    revenue: 3650000,
    cashVariance: 0,
    wasteGrams: 420,
    drinkMin: 3.3,
    foodMin: 7.4,
    qrCount: 41,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Kematangan operasional kelompok terus menanjak: 41 QR feedback positif, zero cash variance, dan standar CLAYGO sangat baik.',
    locked: true,
  },
  {
    id: 'ses-2027-01-22',
    date: '2027-01-22',
    day: 'Jum',
    shiftManager: 'Nadia Kusuma',
    status: 'Operasional Normal',
    scores: [95, 94, 93, 95],
    revenue: 3890000,
    cashVariance: 0,
    wasteGrams: 390,
    drinkMin: 3.2,
    foodMin: 7.2,
    qrCount: 44,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Sesi puncak evaluasi Januari 2027 dengan omset IDR 3.890.000, akurasi kas 100%, dan efisiensi dapur terbaik.',
    locked: true,
  },
  {
    id: 'ses-2027-01-28',
    date: '2027-01-28',
    day: 'Kam',
    shiftManager: 'Bima Aditya',
    status: 'Operasional Normal',
    scores: [95, 95, 94, 94],
    revenue: 3940000,
    cashVariance: 0,
    wasteGrams: 370,
    drinkMin: 3.1,
    foodMin: 7.1,
    qrCount: 46,
    lastCases: 0,
    item14: 'CLAYGO Selesai',
    summary: 'Penutupan siklus perbaikan akhir Oktober 2026 – Januari 2027 dengan standar mutu konsisten (A) dan zero discrepancy.',
    locked: true,
  },
];

export function buildSeedSessions(): AuditSession[] {
  return SPECS.map((spec) => {
    const isHoliday = spec.status === 'Libur / Tidak Beroperasi';
    const checklist = createDefaultChecklist().map((item) => {
      if (isHoliday) {
        return {
          ...item,
          checked: false,
          status: 'belum' as const,
          findingNote: 'Sesi libur / tidak beroperasi.',
        };
      }
      const override = spec.findings?.[item.itemNumber];
      const next = { ...item };
      if (override) {
        next.status = override.status;
        next.checked = override.status !== 'tidak_sesuai';
        next.findingNote = override.note;
      }
      if (item.itemNumber === 14) {
        next.item14Outcome = spec.item14;
      }
      return next;
    });

    const rubric = createDefaultRubric({
      financial: spec.scores[0],
      operational: spec.scores[1],
      service: spec.scores[2],
      teamwork: spec.scores[3],
    });

    if (spec.cashVariance !== 0 && !isHoliday) {
      rubric.financial.note = `Tercatat selisih kas ${spec.cashVariance > 0 ? '+' : ''}IDR ${spec.cashVariance.toLocaleString('id-ID')}.`;
    } else if (!isHoliday) {
      rubric.financial.note = 'Buku kas / POS summary cocok 100% dengan kas fisik.';
    }

    if (!isHoliday) {
      rubric.operational.note = `Drink avg ${spec.drinkMin} mnt, Food avg ${spec.foodMin} mnt.`;
      rubric.service.note = `${spec.qrCount} QR feedback terkumpul; ${spec.lastCases} kasus L.A.S.T.`;
      rubric.teamwork.note = spec.item14;
    }

    const weightedScore = isHoliday ? 0 : calculateWeightedScore(rubric);
    const recordedCashIdr = spec.revenue;
    const actualCashIdr = spec.revenue + spec.cashVariance;

    return {
      id: spec.id,
      courseName: COURSE_NAME,
      groupName: 'Kelompok 01 — LAHAP Cafe Lab',
      day: spec.day,
      date: spec.date,
      month: getMonthFromDate(spec.date),
      shiftManager: spec.shiftManager,
      auditorName: 'Dr. Hendra Wijaya, M.M.',
      sessionStatus: spec.status,
      isPosTransition: spec.status === 'Penyesuaian Jam / Masa Transisi POS',
      checklist,
      rubric,
      weightedScore,
      totalRevenueIdr: spec.revenue,
      recordedCashIdr,
      actualCashIdr,
      cashVarianceIdr: spec.cashVariance,
      kitchenWasteGrams: spec.wasteGrams,
      avgDrinkTicketMin: spec.drinkMin,
      avgFoodTicketMin: spec.foodMin,
      qrFeedbackCount: spec.qrCount,
      lastRecoveryCases: spec.lastCases,
      auditorSummaryNote: spec.summary,
      shiftManagerSignature: isHoliday ? null : makeMockSig(spec.shiftManager, spec.date),
      auditorSignature: isHoliday ? null : makeMockSig('Dr. Hendra Wijaya, M.M.', spec.date),
      isLocked: spec.locked,
      createdAt: `${spec.date}T21:55:00`,
      updatedAt: `${spec.date}T22:05:00`,
      editHistory: spec.editLogs ?? [],
    };
  });
}

export const SEED_ACTION_ITEMS: ActionItemEntry[] = [
  {
    id: 'act-1',
    sessionId: 'ses-2026-10-27',
    sessionDate: '2026-10-27',
    title: 'Terapkan SOP double-check void transaksi POS dengan tanda tangan Shift Manager sebelum closing.',
    owner: 'Salsa Permata (Shift Manager)',
    priority: 'Tinggi',
    status: 'Resolved',
    dueDate: '2026-10-30',
    category: 'Kas & POS',
  },
  {
    id: 'act-2',
    sessionId: 'ses-2026-11-06',
    sessionDate: '2026-11-06',
    title: 'Pisahkan antrean order minuman dingin & espresso saat peak hour Jumat 15.00–18.00 agar ticket time < 5 mnt.',
    owner: 'Raka Pratama & Tim Bar',
    priority: 'Tinggi',
    status: 'In Progress',
    dueDate: '2026-11-20',
    category: 'Ticket Time & SLA',
  },
  {
    id: 'act-3',
    sessionId: 'ses-2026-11-06',
    sessionDate: '2026-11-06',
    title: 'Kalibrasi ulang timbangan digital stasiun BOH & tempel kartu porsi SRC di meja plating.',
    owner: 'Bima Aditya (BOH Lead)',
    priority: 'Sedang',
    status: 'Open',
    dueDate: '2026-11-22',
    category: 'Kitchen Waste & SRC',
  },
  {
    id: 'act-4',
    sessionId: 'ses-2026-11-18',
    sessionDate: '2026-11-18',
    title: 'Pertahankan konversi QR Feedback >= 30 responden per shift melalui table-tent promo & sapaan kasir.',
    owner: 'Nadia Kusuma (FOH Lead)',
    priority: 'Rendah',
    status: 'In Progress',
    dueDate: '2026-12-04',
    category: 'Service & CLAYGO',
  },
];
