export type UserRole = 'dosen' | 'mahasiswa';

export type OperationalDay = 'Sel' | 'Rab' | 'Kam' | 'Jum';

export type AcademicMonth = 'Oktober' | 'November' | 'Desember' | 'Januari';

export type SessionStatus =
  | 'Operasional Normal'
  | 'Penyesuaian Jam / Masa Transisi POS'
  | 'Libur / Tidak Beroperasi';

export type ChecklistPhase =
  | 'PRE-OPENING (Setup Mandiri)'
  | 'SERVICE RUSH (Live Operations)'
  | 'POST-CLOSING (Closing & Audit)';

export type ChecklistItemStatus = 'sesuai' | 'perhatian' | 'tidak_sesuai' | 'belum';

export type Item14Outcome =
  | 'CLAYGO Selesai'
  | 'Rapat Insidental Terlaksana [Ada Kendala]'
  | 'Tidak Ada Kendala / Tidak Diperlukan';

export interface PhotoEvidence {
  id: string;
  name: string;
  dataUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface ChecklistItemEntry {
  itemNumber: number; // 1..14
  phase: ChecklistPhase;
  label: string;
  checked: boolean;
  status: ChecklistItemStatus;
  findingNote: string;
  item14Outcome?: Item14Outcome;
  evidenceList: PhotoEvidence[];
}

export type RubricCriterionKey =
  | 'financial'
  | 'operational'
  | 'service'
  | 'teamwork';

export interface RubricCriterionScore {
  key: RubricCriterionKey;
  title: string;
  weight: number; // 0.30, 0.25, 0.20, 0.25
  indicators: string[];
  score: number; // 1..100
  note: string;
}

export interface ActionItemEntry {
  id: string;
  sessionId: string;
  sessionDate: string;
  title: string;
  owner: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Open' | 'In Progress' | 'Resolved';
  dueDate: string;
  category: 'Kas & POS' | 'Ticket Time & SLA' | 'Kitchen Waste & SRC' | 'Service & CLAYGO';
}

export interface EditAuditLogEntry {
  id: string;
  timestamp: string;
  editorName: string;
  editorRole: UserRole;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface DigitalSignature {
  signedBy: string;
  signatureDataUrl: string;
  signedAt: string;
}

export interface AuditSession {
  id: string;
  courseName: string;
  groupName: string;
  day: OperationalDay;
  date: string; // YYYY-MM-DD
  month: AcademicMonth;
  shiftManager: string;
  auditorName: string;
  sessionStatus: SessionStatus;
  isPosTransition: boolean;
  checklist: ChecklistItemEntry[];
  rubric: Record<RubricCriterionKey, RubricCriterionScore>;
  weightedScore: number; // 0..100
  totalRevenueIdr: number;
  recordedCashIdr: number;
  actualCashIdr: number;
  cashVarianceIdr: number; // actualCashIdr - recordedCashIdr
  kitchenWasteGrams: number;
  avgDrinkTicketMin: number;
  avgFoodTicketMin: number;
  qrFeedbackCount: number;
  lastRecoveryCases: number;
  auditorSummaryNote: string;
  shiftManagerSignature: DigitalSignature | null;
  auditorSignature: DigitalSignature | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  editHistory: EditAuditLogEntry[];
}

export interface GradeThreshold {
  letter: string;
  minScore: number;
  gpaPoint: number;
}

export interface GradingSchemeConfig {
  dailyAccumulationWeight: number; // e.g., 70 (%)
  finalPresentationWeight: number; // e.g., 30 (%)
  simulatedFinalPresentationScore: number; // 0..100
  simulatedRemainingDailyScore: number; // 0..100
  simulatedRemainingSessionsCount: number; // 0..16
  thresholds: GradeThreshold[];
}

export interface AnomalyAlert {
  id: string;
  sessionId: string;
  date: string;
  month: AcademicMonth;
  severity: 'critical' | 'warning';
  category: 'Selisih Kas' | 'Kitchen Waste Tinggi' | 'Skor Turun Tajam' | 'Rapat Insidental / Kendala';
  title: string;
  description: string;
  metricValue: string;
}

export type AppView =
  | 'dashboard'
  | 'form'
  | 'history'
  | 'analyzer'
  | 'sop'
  | 'export';

export interface GoogleWorkspaceUser {
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface DosenAccount {
  email: string;
  displayName: string;
  authMethod: 'email' | 'google';
  photoURL?: string;
  loggedInAt: string;
}
