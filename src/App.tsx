import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Printer,
  X,
} from 'lucide-react';
import type {
  AcademicMonth,
  ActionItemEntry,
  AppView,
  AuditSession,
  DosenAccount,
  GoogleWorkspaceUser,
  GradingSchemeConfig,
  UserRole,
} from './types/audit';
import {
  ACADEMIC_MONTHS,
  DEFAULT_GRADING_SCHEME,
  OPERATIONAL_DAYS,
  buildAuditDiffLogs,
  getLiveOperationalStatus,
} from './utils/calculations';
import { SEED_ACTION_ITEMS, buildSeedSessions } from './data/seedData';
import {
  createAuditSpreadsheet,
  createCalendarEvent,
  initWorkspaceAuth,
  listCalendarEvents,
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  writeAuditTabsToSpreadsheet,
  type GoogleCalendarEventItem,
} from './services/googleWorkspace';
import { DashboardView } from './components/DashboardView';
import { ObservationFormView } from './components/ObservationFormView';
import { HistoryView } from './components/HistoryView';
import { AnalyzerView } from './components/AnalyzerView';
import { SopScheduleView } from './components/SopScheduleView';
import { WorkspaceExportView } from './components/WorkspaceExportView';
import { PrintAuditReportModal } from './components/PrintAuditReportModal';
import { BackgroundVisualLayer, MenuVisualBanner } from './components/MenuHeroVisuals';
import { DosenAccountMenu, DosenLoginModal } from './components/DosenAuthControls';
import {
  WorkspaceConfirmModal,
  type WorkspaceConfirmState,
} from './components/GlassPrimitives';
import {
  STORAGE_ACTIONS_KEY,
  STORAGE_DOSEN_KEY,
  STORAGE_SCHEME_KEY,
  STORAGE_SESSIONS_KEY,
  loadAllPersistedState,
  readLocalStorageJson,
  savePersistedKey,
} from './services/auditStorage';

interface ToastBanner {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  linkUrl?: string;
  linkLabel?: string;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dosenAccount, setDosenAccount] = useState<DosenAccount | null>(() => {
    const parsed = readLocalStorageJson<DosenAccount>(STORAGE_DOSEN_KEY);
    return parsed?.email ? parsed : null;
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [role, setRole] = useState<UserRole>(() => {
    const parsed = readLocalStorageJson<DosenAccount>(STORAGE_DOSEN_KEY);
    return parsed?.email ? 'dosen' : 'mahasiswa';
  });
  const [monthFilter, setMonthFilter] = useState<AcademicMonth | 'Semua'>('Semua');

  // Persistent Audit State (hydrated immediately from localStorage, then upgraded from IndexedDB if available)
  const [sessions, setSessions] = useState<AuditSession[]>(() => {
    const parsed = readLocalStorageJson<AuditSession[]>(STORAGE_SESSIONS_KEY);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildSeedSessions();
  });

  const [actionItems, setActionItems] = useState<ActionItemEntry[]>(() => {
    const parsed = readLocalStorageJson<ActionItemEntry[]>(STORAGE_ACTIONS_KEY);
    return Array.isArray(parsed) ? parsed : SEED_ACTION_ITEMS;
  });

  const [gradingScheme, setGradingScheme] = useState<GradingSchemeConfig>(() => {
    const parsed = readLocalStorageJson<GradingSchemeConfig>(STORAGE_SCHEME_KEY);
    return parsed || DEFAULT_GRADING_SCHEME;
  });

  // Track user mutations before async IndexedDB hydration completes
  const mutatedSessionsRef = useRef(false);
  const mutatedActionsRef = useRef(false);
  const mutatedSchemeRef = useRef(false);
  const mutatedDosenRef = useRef(false);
  const idbHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadAllPersistedState().then((persisted) => {
      if (cancelled) return;
      if (!mutatedSessionsRef.current && persisted.sessions && persisted.sessions.length > 0) {
        setSessions(persisted.sessions);
      }
      if (!mutatedActionsRef.current && persisted.actionItems) {
        setActionItems(persisted.actionItems);
      }
      if (!mutatedSchemeRef.current && persisted.gradingScheme) {
        setGradingScheme(persisted.gradingScheme);
      }
      if (!mutatedDosenRef.current && persisted.dosenAccount?.email) {
        setDosenAccount(persisted.dosenAccount);
        setRole('dosen');
      }
      idbHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!idbHydratedRef.current && !mutatedSessionsRef.current) return;
    void savePersistedKey(STORAGE_SESSIONS_KEY, sessions);
  }, [sessions]);

  useEffect(() => {
    if (!idbHydratedRef.current && !mutatedActionsRef.current) return;
    void savePersistedKey(STORAGE_ACTIONS_KEY, actionItems);
  }, [actionItems]);

  useEffect(() => {
    if (!idbHydratedRef.current && !mutatedSchemeRef.current) return;
    void savePersistedKey(STORAGE_SCHEME_KEY, gradingScheme);
  }, [gradingScheme]);

  useEffect(() => {
    if (!idbHydratedRef.current && !mutatedDosenRef.current) return;
    void savePersistedKey(STORAGE_DOSEN_KEY, dosenAccount);
  }, [dosenAccount]);

  // Live Operational Clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const liveWindow = useMemo(() => getLiveOperationalStatus(now), [now]);

  // Edit, Detail Modal, & Print Report Modal state
  const [editingSession, setEditingSession] = useState<AuditSession | null>(null);
  const [modalSession, setModalSession] = useState<AuditSession | null>(null);
  const [printReportOpen, setPrintReportOpen] = useState(false);
  const [printSessionTarget, setPrintSessionTarget] = useState<AuditSession | null>(null);

  const handleOpenPrintReport = (session: AuditSession | null) => {
    setPrintSessionTarget(session || sessions[0] || null);
    setPrintReportOpen(true);
  };

  // Google Workspace Auth & Calendar State (in-memory token only)
  const [workspaceUser, setWorkspaceUser] = useState<GoogleWorkspaceUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<ToastBanner | null>(null);
  const showToast = (
    type: ToastBanner['type'],
    message: string,
    linkUrl?: string,
    linkLabel?: string
  ) => {
    setToast({ id: Date.now(), type, message, linkUrl, linkLabel });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(t);
  }, [toast]);

  // Workspace Confirmation Modal State
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<WorkspaceConfirmState>({
    isOpen: false,
    title: '',
    description: '',
    affectedDetails: [],
    confirmLabel: 'Konfirmasi',
    onConfirm: () => {},
  });

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user, token) => {
        setWorkspaceUser(user);
        setAccessToken(token);
      },
      () => {
        setWorkspaceUser(null);
        setAccessToken(null);
        setCalendarEvents([]);
      }
    );
    return () => unsub();
  }, []);

  const handleSignInGoogle = async (loginHintEmail?: string, rethrowOnError = false) => {
    setAuthLoading(true);
    try {
      const { user, accessToken: token } = await signInWithGoogleWorkspace(loginHintEmail);
      const nextAccount: DosenAccount = {
        email: user.email,
        displayName: user.displayName || user.email,
        authMethod: 'google',
        photoURL: user.photoURL,
        loggedInAt: new Date().toISOString(),
      };
      mutatedDosenRef.current = true;
      setWorkspaceUser(user);
      setAccessToken(token);
      setDosenAccount(nextAccount);
      void savePersistedKey(STORAGE_DOSEN_KEY, nextAccount);
      setRole('dosen');
      setLoginModalOpen(false);
      showToast('success', `Berhasil login sebagai Dosen (${user.email}) dan terhubung Google Workspace.`);
      setCalendarLoading(true);
      try {
        const events = await listCalendarEvents(token);
        setCalendarEvents(events);
      } catch {
        // Silent if calendar empty
      } finally {
        setCalendarLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.';
      showToast('error', message);
      if (rethrowOnError) {
        throw err instanceof Error ? err : new Error(message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginDosenEmail = (email: string, displayName: string) => {
    const nextAccount: DosenAccount = {
      email,
      displayName,
      authMethod: 'email',
      loggedInAt: new Date().toISOString(),
    };
    mutatedDosenRef.current = true;
    setDosenAccount(nextAccount);
    void savePersistedKey(STORAGE_DOSEN_KEY, nextAccount);
    setRole('dosen');
    setLoginModalOpen(false);
    showToast('success', `Berhasil login sebagai Dosen (${email}).`);
  };

  const handleLogoutDosen = async () => {
    if (workspaceUser || accessToken) {
      try {
        await signOutGoogleWorkspace();
      } catch {
        // Ignore signOut cleanup errors
      }
    }
    mutatedDosenRef.current = true;
    setWorkspaceUser(null);
    setAccessToken(null);
    setCalendarEvents([]);
    setDosenAccount(null);
    void savePersistedKey(STORAGE_DOSEN_KEY, null);
    setRole('mahasiswa');
    setEditingSession(null);
    showToast('info', 'Anda telah logout. Aplikasi beralih ke mode Mahasiswa / Tamu.');
  };

  const handleSignOutGoogle = async () => {
    await signOutGoogleWorkspace();
    setWorkspaceUser(null);
    setAccessToken(null);
    setCalendarEvents([]);
    showToast('info', 'Koneksi Google Workspace ditutup.');
  };

  const handleRequestRoleChange = (nextRole: UserRole) => {
    if (nextRole === 'dosen' && !dosenAccount) {
      setLoginModalOpen(true);
      showToast('info', 'Masukkan Gmail atau email dosen untuk masuk ke Mode Dosen.');
      return;
    }
    setRole(nextRole);
  };

  const handleRefreshCalendar = async () => {
    if (!accessToken) return;
    setCalendarLoading(true);
    try {
      const events = await listCalendarEvents(accessToken);
      setCalendarEvents(events);
      showToast('success', `Berhasil memuat ${events.length} agenda dari Google Calendar.`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal membaca Google Calendar.');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Workspace Mutating Operations (ALL gated behind explicit confirmation dialog)
  const handleRequestCreateSheet = (avgScore: number, letterGrade: string) => {
    if (!accessToken) {
      showToast('error', 'Silakan Sign in with Google terlebih dahulu.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: 'Buat & Sinkronkan Google Spreadsheet Baru?',
      description:
        'Tindakan ini akan membuat file Google Spreadsheet baru pada Google Drive akun Anda dan menuliskan seluruh rekap audit operasional Start-Up Lens.',
      affectedDetails: [
        `Tab 1: Rekap Sesi Harian (${sessions.length} sesi Okt 2026–Jan 2027)`,
        `Tab 2: Ringkasan Akumulasi (Skor ${avgScore.toFixed(1)} · Mutu ${letterGrade})`,
        `Tab 3: Action Items (${actionItems.length} item tindak lanjut)`,
      ],
      confirmLabel: 'Buat & Tulis Spreadsheet',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const result = await createAuditSpreadsheet(
            sessions,
            actionItems,
            sessions[0]?.groupName || 'Kelompok 01',
            avgScore,
            letterGrade,
            accessToken
          );
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          showToast(
            'success',
            `Spreadsheet dibuat (${result.rowsWritten} baris ditulis).`,
            result.spreadsheetUrl,
            'Buka Google Sheets'
          );
        } catch (err: unknown) {
          showToast('error', err instanceof Error ? err.message : 'Gagal membuat Google Sheets.');
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const handleRequestSyncExistingSheet = (
    spreadsheetId: string,
    spreadsheetTitle: string,
    sheetTabName: string,
    avgScore: number,
    letterGrade: string
  ) => {
    if (!accessToken) return;
    setConfirmState({
      isOpen: true,
      title: `Perbarui Spreadsheet "${spreadsheetTitle}"?`,
      description: `Data pada tab "${sheetTabName}" mulai sel A1 akan ditimpa dengan data terbaru (${sessions.length} sesi audit).`,
      affectedDetails: [
        `Spreadsheet: ${spreadsheetTitle}`,
        `Target Tab: ${sheetTabName}`,
        `Jumlah baris: ${sessions.length} sesi + 1 header`,
      ],
      confirmLabel: 'Konfirmasi Pembaruan',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const rows = await writeAuditTabsToSpreadsheet(
            spreadsheetId,
            sheetTabName,
            sessions,
            actionItems,
            avgScore,
            letterGrade,
            accessToken,
            false
          );
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          showToast(
            'success',
            `Berhasil menulis ${rows} baris ke tab "${sheetTabName}".`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
            'Buka Spreadsheet'
          );
        } catch (err: unknown) {
          showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui spreadsheet.');
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const handleRequestCreateCalendarEvent = (payload: {
    summary: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!accessToken) {
      showToast('error', 'Hubungkan Google Calendar melalui Sign in with Google terlebih dahulu.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: 'Tambahkan Event ke Google Calendar?',
      description:
        'Event baru akan dibuat pada kalender utama (primary) akun Google Anda untuk pengingat operasional atau rapat evaluasi.',
      affectedDetails: [
        `Judul: ${payload.summary}`,
        `Tanggal: ${payload.date} (${payload.startTime}–${payload.endTime} WIB)`,
        `Lokasi: Cafe Lab — MAN1106508`,
      ],
      confirmLabel: 'Buat Event Calendar',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const created = await createCalendarEvent(accessToken, payload);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          const refreshed = await listCalendarEvents(accessToken);
          setCalendarEvents(refreshed);
          showToast(
            'success',
            `Event "${created.summary}" ditambahkan ke Google Calendar.`,
            created.htmlLink,
            'Lihat di Calendar'
          );
        } catch (err: unknown) {
          showToast('error', err instanceof Error ? err.message : 'Gagal membuat event Calendar.');
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  // Audit Session CRUD + Audit Trail Edit + Delete
  const handleSaveSession = async (
    saved: AuditSession,
    editReason?: string,
    isEdit?: boolean
  ) => {
    if (role !== 'dosen') {
      setLoginModalOpen(true);
      showToast('info', 'Silakan login sebagai Dosen terlebih dahulu untuk menyimpan penilaian.');
      return;
    }

    mutatedSessionsRef.current = true;
    let nextSessions: AuditSession[];

    if (isEdit) {
      nextSessions = sessions.map((existing) => {
        if (existing.id !== saved.id) return existing;
        const diffLogs = buildAuditDiffLogs(
          existing,
          saved,
          saved.auditorName || dosenAccount?.displayName || dosenAccount?.email || 'Dosen Evaluator',
          role,
          editReason
        );
        return {
          ...saved,
          editHistory: [...diffLogs, ...existing.editHistory],
        };
      });
    } else {
      nextSessions = [saved, ...sessions];
    }

    setSessions(nextSessions);
    const persistRes = await savePersistedKey(STORAGE_SESSIONS_KEY, nextSessions);

    if (!persistRes.saved) {
      showToast(
        'error',
        'Penilaian diperbarui di layar, namun penyimpanan browser gagal menulis permanen.'
      );
    } else if (isEdit) {
      showToast(
        'success',
        `Perubahan sesi ${saved.date} tersimpan permanen. Akumulasi nilai & ringkasan diperbarui.`
      );
    } else {
      showToast('success', `Lembar observasi baru (${saved.date}) berhasil disimpan.`);
    }

    setEditingSession(null);
    setModalSession((prev) => (prev?.id === saved.id ? saved : prev));
    setActiveView('history');
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (role !== 'dosen') {
      setLoginModalOpen(true);
      return;
    }
    const target = sessions.find((s) => s.id === sessionId);
    mutatedSessionsRef.current = true;
    mutatedActionsRef.current = true;

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    const nextActions = actionItems.filter((a) => a.sessionId !== sessionId);

    setSessions(nextSessions);
    setActionItems(nextActions);
    await Promise.all([
      savePersistedKey(STORAGE_SESSIONS_KEY, nextSessions),
      savePersistedKey(STORAGE_ACTIONS_KEY, nextActions),
    ]);

    if (editingSession?.id === sessionId) setEditingSession(null);
    if (modalSession?.id === sessionId) setModalSession(null);
    if (printSessionTarget?.id === sessionId) setPrintSessionTarget(nextSessions[0] || null);

    showToast(
      'success',
      `Riwayat penilaian ${target ? `${target.day}, ${target.date}` : ''} telah dihapus.`
    );
  };

  const handleUnlockSession = (sessionId: string) => {
    mutatedSessionsRef.current = true;
    const unlockLog = {
      id: `log-unlock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      editorName: dosenAccount?.displayName || dosenAccount?.email || 'Dosen Evaluator',
      editorRole: role,
      fieldLabel: 'Status Kunci Sesi',
      oldValue: 'Terkunci',
      newValue: 'Terbuka',
      reason: 'Sesi dibuka kuncinya oleh Dosen untuk revisi audit.',
    };

    const nextSessions = sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            isLocked: false,
            editHistory: [unlockLog, ...s.editHistory],
          }
        : s
    );

    setSessions(nextSessions);
    void savePersistedKey(STORAGE_SESSIONS_KEY, nextSessions);

    setEditingSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, isLocked: false, editHistory: [unlockLog, ...prev.editHistory] }
        : prev
    );
    setModalSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, isLocked: false, editHistory: [unlockLog, ...prev.editHistory] }
        : prev
    );

    showToast('info', 'Kunci sesi dibuka. Data lembar observasi kini dapat diperbarui.');
  };

  const handleStartEditSession = (session: AuditSession) => {
    if (role !== 'dosen') {
      setLoginModalOpen(true);
      showToast('info', 'Login sebagai Dosen untuk mengedit lembar penilaian.');
      return;
    }
    setEditingSession(session);
    setActiveView('form');
  };

  const handleAddActionItem = (item: Omit<ActionItemEntry, 'id'>) => {
    mutatedActionsRef.current = true;
    setActionItems((prev) => [
      { ...item, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ...prev,
    ]);
  };

  const handleUpdateActionStatus = (id: string, status: ActionItemEntry['status']) => {
    mutatedActionsRef.current = true;
    setActionItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleDeleteActionItem = (id: string) => {
    mutatedActionsRef.current = true;
    setActionItems((prev) => prev.filter((a) => a.id !== id));
  };

  const navItems: {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'form', label: 'Penilaian', icon: ClipboardCheck },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'analyzer', label: 'Analyzer', icon: Activity },
    { id: 'sop', label: 'Jadwal & SOP', icon: BookOpen },
    { id: 'export', label: 'Ekspor & Sheets', icon: FileSpreadsheet },
  ];

  return (
    <>
      <div className="app-shell-root min-h-screen relative overflow-x-hidden bg-architectural-mesh text-slate-900">
        {/* Architectural Geometric Grid & Organic Emerald Topographic Backdrop */}
        <BackgroundVisualLayer />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 3-Zone Top Header with Horizontal Menu */}
          <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 sm:px-6 no-print">
            <div className="max-w-[1440px] h-full mx-auto flex items-center justify-between gap-8">
              {/* Zone 1: Brand Wordmark */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Buka menu navigasi"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <a
                  href="#dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingSession(null);
                    setActiveView('dashboard');
                  }}
                  className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
                >
                  Start-Up Lens
                </a>
              </div>

              {/* Zone 2: Horizontal Header Navigation Links with Spring Layout Transition */}
              <LayoutGroup id="header-main-nav">
                <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
                  {navItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        layout
                        whileHover={{ y: -1, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        onClick={() => {
                          if (item.id !== 'form') setEditingSession(null);
                          setActiveView(item.id);
                        }}
                        className={`relative px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'text-emerald-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="headerNavHighlight"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-emerald-50/90 border border-emerald-200/80 -z-10"
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="headerNavUnderline"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-emerald-700"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>
              </LayoutGroup>

              {/* Zone 3: Account Login/Logout Menu & Primary Header CTA */}
              <div className="flex items-center gap-2.5 shrink-0">
                <DosenAccountMenu
                  dosenAccount={dosenAccount}
                  role={role}
                  workspaceConnected={Boolean(accessToken)}
                  authLoading={authLoading}
                  onOpenLogin={() => setLoginModalOpen(true)}
                  onLogout={handleLogoutDosen}
                  onChangeRole={handleRequestRoleChange}
                  onConnectGoogle={() => handleSignInGoogle(dosenAccount?.email)}
                />

                {role === 'dosen' ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    onClick={() => {
                      setEditingSession(null);
                      setActiveView('form');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Observasi Baru</span>
                    <span className="sm:hidden">Baru</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    onClick={() => handleOpenPrintReport(sessions[0] || null)}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Laporan</span>
                  </motion.button>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Header Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ x: -288 }}
                  animate={{ x: 0 }}
                  exit={{ x: -288 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                  className="relative z-10 w-72 bg-white/95 backdrop-blur-xl h-full border-r border-slate-200 p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <span className="font-display text-base font-bold text-slate-900">
                      Start-Up Lens
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="mt-4 space-y-1 flex-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (item.id !== 'form') setEditingSession(null);
                            setActiveView(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                            isActive
                              ? 'bg-emerald-700 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </nav>

                  {/* Mobile Drawer Lecturer Login/Logout Footer */}
                  <div className="pt-4 border-t border-slate-200 space-y-2.5">
                    {dosenAccount ? (
                      <>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900 truncate">
                            {dosenAccount.displayName}
                          </p>
                          <p className="font-mono-num text-slate-500 truncate">{dosenAccount.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogoutDosen();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout Dosen</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setLoginModalOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Login Dosen (Gmail / Email)</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Below-header Workspace Toolbar: Live Operational Window, Month Filter, Role Switch & Workspace Auth */}
          <div className="border-b border-slate-200/70 bg-white/55 backdrop-blur-md px-4 sm:px-6 py-2.5 no-print">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
              {/* Live Operational Window & Active Days */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                <CalendarClock
                  className={`w-4 h-4 shrink-0 ${
                    liveWindow.isWithinHours ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                />
                <span className="font-semibold text-slate-900 whitespace-nowrap">
                  {liveWindow.dayLabel}, {liveWindow.dateLabel}
                </span>
                <span className="font-mono-num font-semibold text-emerald-700 whitespace-nowrap">
                  {liveWindow.timeLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-semibold whitespace-nowrap ${
                    liveWindow.isWithinHours ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {liveWindow.statusTitle}
                </span>
                <span className="hidden xl:inline text-slate-400">|</span>
                <div className="hidden xl:flex items-center gap-1">
                  {OPERATIONAL_DAYS.map((d) => {
                    const isToday = liveWindow.dayLabel.startsWith(d);
                    return (
                      <span
                        key={d}
                        className={`px-1.5 py-0.5 rounded font-mono-num ${
                          isToday ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600'
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Month Filter + Role Switcher + Google Workspace + Print Report */}
              <div className="flex flex-wrap items-center gap-2.5">
                <LayoutGroup id="month-filter-group">
                  <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/80">
                    {(['Semua', ...ACADEMIC_MONTHS] as const).map((m) => {
                      const isActive = monthFilter === m;
                      return (
                        <motion.button
                          key={m}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setMonthFilter(m)}
                          className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            isActive
                              ? 'text-emerald-800 font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="monthFilterActiveBg"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              className="absolute inset-0 rounded-md bg-white shadow-xs"
                            />
                          )}
                          <span className="relative z-10">
                            {m === 'Semua' ? 'Okt 26–Jan 27' : m.slice(0, 3)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </LayoutGroup>

                <LayoutGroup id="role-switcher-group">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                    {(['dosen', 'mahasiswa'] as const).map((r) => {
                      const isActive = role === r;
                      return (
                        <motion.button
                          key={r}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleRequestRoleChange(r)}
                          className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            isActive
                              ? 'text-slate-900 font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="roleSwitcherActiveBg"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              className="absolute inset-0 rounded-md bg-white shadow-xs"
                            />
                          )}
                          <span className="relative z-10">
                            {r === 'dosen' ? 'Dosen' : 'Mahasiswa'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </LayoutGroup>

                <motion.button
                  type="button"
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleOpenPrintReport(sessions[0] || null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Laporan Audit</span>
                </motion.button>

                {workspaceUser ? (
                  <button
                    type="button"
                    onClick={() => setActiveView('export')}
                    className="text-xs font-medium text-emerald-700 hover:underline whitespace-nowrap"
                  >
                    Sheets: {workspaceUser.email}
                  </button>
                ) : dosenAccount ? (
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleSignInGoogle(dosenAccount.email)}
                    className="text-xs font-medium text-slate-600 hover:text-emerald-700 hover:underline whitespace-nowrap disabled:opacity-50"
                  >
                    {authLoading ? 'Menghubungkan...' : 'Hubungkan Google Sheets'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Toast Feedback Banner */}
          {toast && (
            <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-4 no-print">
              <div
                className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium ${
                  toast.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
                    : toast.type === 'error'
                    ? 'border-rose-200 bg-rose-50/95 text-rose-900'
                    : 'border-blue-200 bg-blue-50/95 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{toast.message}</span>
                </div>
                <div className="flex items-center gap-3">
                  {toast.linkUrl && (
                    <a
                      href={toast.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      {toast.linkLabel || 'Buka Tautan'}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="opacity-70 hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Body with Smooth LayoutGroup Fade-In + Slide-Up View Transitions */}
          <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
            <LayoutGroup id="main-view-stage">
              <MenuVisualBanner
                view={activeView}
                summaryBadge={role === 'dosen' ? 'Mode Dosen' : 'Mode Mahasiswa'}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  layout="position"
                  initial={{ opacity: 0, y: 20, scale: 0.992 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    layout: { type: 'spring', stiffness: 320, damping: 30 },
                  }}
                >
                  {activeView === 'dashboard' && (
                    <DashboardView
                      sessions={sessions}
                      monthFilter={monthFilter}
                      role={role}
                      gradingScheme={gradingScheme}
                      onUpdateGradingScheme={(next) => {
                        mutatedSchemeRef.current = true;
                        setGradingScheme(next);
                      }}
                      onInspectSession={(s) => {
                        setModalSession(s);
                        setActiveView('history');
                      }}
                      onEditSession={handleStartEditSession}
                      onNavigateForm={() => {
                        setEditingSession(null);
                        setActiveView('form');
                      }}
                      onOpenPrintReport={handleOpenPrintReport}
                      onNavigateAnalyzer={() => setActiveView('analyzer')}
                    />
                  )}

                  {activeView === 'form' && (
                    <ObservationFormView
                      editingSession={editingSession}
                      role={role}
                      defaultAuditorName={dosenAccount?.displayName || dosenAccount?.email}
                      onSaveSession={handleSaveSession}
                      onCancelEdit={() => {
                        setEditingSession(null);
                        setActiveView('history');
                      }}
                      onUnlockSession={handleUnlockSession}
                      onAddActionItem={handleAddActionItem}
                      onPrintSession={(s) => handleOpenPrintReport(s)}
                      onRequestLogin={() => setLoginModalOpen(true)}
                    />
                  )}

                  {activeView === 'history' && (
                    <HistoryView
                      sessions={sessions}
                      monthFilter={monthFilter}
                      role={role}
                      selectedSessionForModal={modalSession}
                      onSelectSessionForModal={setModalSession}
                      onEditSession={handleStartEditSession}
                      onDeleteSession={handleDeleteSession}
                      onUnlockSession={handleUnlockSession}
                      onPrintSession={(s) => handleOpenPrintReport(s)}
                      onRequestLogin={() => setLoginModalOpen(true)}
                      workspaceConnected={Boolean(accessToken)}
                      onSyncSessionToCalendar={(s) =>
                        handleRequestCreateCalendarEvent({
                          summary: `Audit Start-Up Lens: ${s.day}, ${s.date} (${s.shiftManager})`,
                          description: `Skor: ${s.weightedScore.toFixed(1)}/100 · ${s.auditorSummaryNote}`,
                          date: s.date,
                          startTime: '10:00',
                          endTime: '22:00',
                        })
                      }
                    />
                  )}

                  {activeView === 'analyzer' && (
                    <AnalyzerView
                      sessions={sessions}
                      monthFilter={monthFilter}
                      actionItems={actionItems}
                      role={role}
                      onAddActionItem={handleAddActionItem}
                      onUpdateActionStatus={handleUpdateActionStatus}
                      onDeleteActionItem={handleDeleteActionItem}
                      onInspectSession={(s) => {
                        setModalSession(s);
                        setActiveView('history');
                      }}
                      workspaceConnected={Boolean(accessToken)}
                      onSyncActionToCalendar={(act) =>
                        handleRequestCreateCalendarEvent({
                          summary: `Tindak Lanjut Start-Up Lens: ${act.category}`,
                          description: `${act.title} (PIC: ${act.owner}, Prioritas: ${act.priority})`,
                          date: act.dueDate,
                          startTime: '10:00',
                          endTime: '11:00',
                        })
                      }
                    />
                  )}

                  {activeView === 'sop' && (
                    <SopScheduleView
                      workspaceConnected={Boolean(accessToken)}
                      workspaceEmail={workspaceUser?.email || null}
                      authLoading={authLoading}
                      onSignInGoogle={() => handleSignInGoogle(dosenAccount?.email)}
                      calendarEvents={calendarEvents}
                      calendarLoading={calendarLoading}
                      onRefreshCalendar={handleRefreshCalendar}
                      onCreateScheduleEvent={handleRequestCreateCalendarEvent}
                    />
                  )}

                  {activeView === 'export' && (
                    <WorkspaceExportView
                      role={role}
                      onChangeRole={handleRequestRoleChange}
                      dosenAccount={dosenAccount}
                      onOpenLogin={() => setLoginModalOpen(true)}
                      onLogout={handleLogoutDosen}
                      sessions={sessions}
                      actionItems={actionItems}
                      gradingScheme={gradingScheme}
                      workspaceUser={workspaceUser}
                      accessToken={accessToken}
                      authLoading={authLoading}
                      onSignInGoogle={() => handleSignInGoogle(dosenAccount?.email)}
                      onSignOutGoogle={handleSignOutGoogle}
                      onRequestCreateSheet={handleRequestCreateSheet}
                      onRequestSyncExistingSheet={handleRequestSyncExistingSheet}
                      onOpenPrintReport={handleOpenPrintReport}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>
          </main>
        </div>

        {/* Lecturer Email / Gmail Login Modal */}
        <DosenLoginModal
          isOpen={loginModalOpen}
          authLoading={authLoading}
          initialEmail={dosenAccount?.email || ''}
          initialName={dosenAccount?.displayName || ''}
          onClose={() => setLoginModalOpen(false)}
          onLoginWithEmail={handleLoginDosenEmail}
          onLoginWithGoogle={(hint) => handleSignInGoogle(hint, true)}
        />

        {/* Explicit Confirmation Modal for Google Sheets & Calendar Writes */}
        <WorkspaceConfirmModal
          state={confirmState}
          busy={confirmBusy}
          onClose={() => !confirmBusy && setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>

      {/* Print-Friendly A4 Audit Report Modal (isolated cleanly on window.print) */}
      <PrintAuditReportModal
        isOpen={printReportOpen}
        initialSession={printSessionTarget}
        allSessions={sessions}
        onClose={() => setPrintReportOpen(false)}
      />
    </>
  );
}
