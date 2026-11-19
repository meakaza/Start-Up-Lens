import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { ActionItemEntry, AuditSession, GoogleWorkspaceUser } from '../types/audit';
import { formatCashVariance } from '../utils/calculations';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events',
];

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

// Memory-only OAuth access token cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export function initWorkspaceAuth(
  onAuthSuccess: (user: GoogleWorkspaceUser, token: string) => void,
  onAuthCleared: () => void
) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess(
        {
          displayName: user.displayName || user.email || 'Pengguna Google',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
        },
        cachedAccessToken
      );
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onAuthCleared();
    }
  });
}

export async function signInWithGoogleWorkspace(loginHintEmail?: string): Promise<{
  user: GoogleWorkspaceUser;
  accessToken: string;
}> {
  isSigningIn = true;
  try {
    if (loginHintEmail && loginHintEmail.trim()) {
      provider.setCustomParameters({
        login_hint: loginHintEmail.trim(),
        prompt: 'select_account',
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Token akses Google Workspace tidak tersedia dari hasil login.');
    }
    cachedAccessToken = credential.accessToken;
    const user: GoogleWorkspaceUser = {
      displayName: result.user.displayName || result.user.email || 'Pengguna Google',
      email: result.user.email || '',
      photoURL: result.user.photoURL || undefined,
    };
    return { user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutGoogleWorkspace(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
}

export function getWorkspaceAccessToken(): string | null {
  return cachedAccessToken;
}

// ---------- GOOGLE SHEETS API v4 ----------

export interface SpreadsheetTabInfo {
  sheetId: number;
  title: string;
}

export interface SpreadsheetMetadataResult {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SpreadsheetTabInfo[];
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadataResult> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal membaca metadata Google Spreadsheet.');
  }
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Spreadsheet Tanpa Judul',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets: (data.sheets || []).map((s: { properties: { sheetId: number; title: string } }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })),
  };
}

export async function createAuditSpreadsheet(
  sessions: AuditSession[],
  actionItems: ActionItemEntry[],
  groupName: string,
  avgScore: number,
  letterGrade: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowsWritten: number }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Audit Operasional Cafe Lab (Okt 2026–Jan 2027) — ${groupName}`,
      },
      sheets: [
        { properties: { title: 'Rekap Sesi Harian' } },
        { properties: { title: 'Ringkasan Akumulasi' } },
        { properties: { title: 'Action Items' } },
      ],
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(created?.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const spreadsheetId: string = created.spreadsheetId;
  const spreadsheetUrl: string = created.spreadsheetUrl;

  const rowsWritten = await writeAuditTabsToSpreadsheet(
    spreadsheetId,
    'Rekap Sesi Harian',
    sessions,
    actionItems,
    avgScore,
    letterGrade,
    accessToken,
    true
  );

  return { spreadsheetId, spreadsheetUrl, rowsWritten };
}

export async function writeAuditTabsToSpreadsheet(
  spreadsheetId: string,
  targetSheetName: string,
  sessions: AuditSession[],
  actionItems: ActionItemEntry[],
  avgScore: number,
  letterGrade: string,
  accessToken: string,
  includeSummaryAndActions = false
): Promise<number> {
  const sessionRows: (string | number)[][] = [
    [
      'ID Sesi',
      'Tanggal',
      'Hari',
      'Bulan',
      'Status Sesi',
      'Shift Manager',
      'Auditor',
      'Financial (30%)',
      'Operational (25%)',
      'Service (20%)',
      'Teamwork (25%)',
      'Skor Tertimbang',
      'Omset Harian (IDR)',
      'Selisih Kas',
      'Kitchen Waste (g)',
      'Ticket Minuman (mnt)',
      'Ticket Makanan (mnt)',
      'QR Feedback',
      'Outcome Item #14',
      'Catatan Auditor',
    ],
    ...sessions.map((s) => {
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
        formatCashVariance(s.cashVarianceIdr),
        s.kitchenWasteGrams,
        s.avgDrinkTicketMin,
        s.avgFoodTicketMin,
        s.qrFeedbackCount,
        item14?.item14Outcome || '-',
        s.auditorSummaryNote,
      ];
    }),
  ];

  const dataUpdates: { range: string; values: (string | number)[][] }[] = [
    {
      range: `'${targetSheetName}'!A1`,
      values: sessionRows,
    },
  ];

  if (includeSummaryAndActions) {
    const activeCount = sessions.filter((s) => s.sessionStatus !== 'Libur / Tidak Beroperasi').length;
    const holidayCount = sessions.length - activeCount;
    dataUpdates.push({
      range: `'Ringkasan Akumulasi'!A1`,
      values: [
        ['Metrik Akumulasi 3 Bulan (Okt 2026–Jan 2027)', 'Nilai'],
        ['Mata Kuliah', 'Cafe and Restaurant Business (MAN1106508)'],
        ['Total Sesi Aktif Dihitung', activeCount],
        ['Total Sesi Libur (Dikecualikan)', holidayCount],
        ['Rata-Rata Skor Tertimbang', avgScore],
        ['Konversi Huruf Mutu', letterGrade],
        ['Waktu Sinkronisasi', new Date().toLocaleString('id-ID')],
      ],
    });
    dataUpdates.push({
      range: `'Action Items'!A1`,
      values: [
        ['ID', 'Tanggal Sesi', 'Tindak Lanjut', 'Penanggung Jawab', 'Prioritas', 'Status', 'Batas Waktu', 'Kategori'],
        ...actionItems.map((a) => [
          a.id,
          a.sessionDate,
          a.title,
          a.owner,
          a.priority,
          a.status,
          a.dueDate,
          a.category,
        ]),
      ],
    });
  }

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates,
      }),
    }
  );
  const batchData = await batchRes.json();
  if (!batchRes.ok) {
    throw new Error(batchData?.error?.message || 'Gagal menulis data ke Google Sheets.');
  }

  return sessionRows.length - 1;
}

// ---------- GOOGLE CALENDAR API v3 ----------

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export async function listCalendarEvents(
  accessToken: string,
  timeMinIso?: string
): Promise<GoogleCalendarEventItem[]> {
  const minParam = timeMinIso || new Date(Date.now() - 7 * 86400000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    minParam
  )}&maxResults=15&singleEvents=true&orderBy=startTime`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal membaca jadwal dari Google Calendar.');
  }
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  payload: {
    summary: string;
    description: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }
): Promise<GoogleCalendarEventItem> {
  const eventBody = {
    summary: payload.summary,
    description: payload.description,
    location: 'Cafe Lab — MAN1106508',
    start: {
      dateTime: `${payload.date}T${payload.startTime}:00+07:00`,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: `${payload.date}T${payload.endTime}:00+07:00`,
      timeZone: 'Asia/Jakarta',
    },
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal membuat event di Google Calendar.');
  }
  return data;
}
