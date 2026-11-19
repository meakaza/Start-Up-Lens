import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import type { DosenAccount, UserRole } from '../types/audit';
import { GoogleSignInButton } from './GlassPrimitives';

function deriveDisplayNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Dosen Evaluator';
  const cleaned = local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return cleaned || 'Dosen Evaluator';
}

function getInitials(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase() || 'DS';
}

export function DosenLoginModal({
  isOpen,
  authLoading,
  initialEmail = '',
  initialName = '',
  onClose,
  onLoginWithEmail,
  onLoginWithGoogle,
}: {
  isOpen: boolean;
  authLoading: boolean;
  initialEmail?: string;
  initialName?: string;
  onClose: () => void;
  onLoginWithEmail: (email: string, displayName: string) => void;
  onLoginWithGoogle: (loginHintEmail?: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState(initialName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setDisplayName(initialName);
      setErrorMsg(null);
      const timer = setTimeout(() => emailInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialEmail, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !authLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, authLoading, onClose]);

  const validateEmail = (raw: string) => {
    const trimmed = raw.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      setErrorMsg('Masukkan alamat Gmail atau email dosen yang valid (contoh: nama@gmail.com).');
      return;
    }
    setErrorMsg(null);
    const finalName = displayName.trim() || deriveDisplayNameFromEmail(trimmedEmail);
    onLoginWithEmail(trimmedEmail, finalName);
  };

  const handleGoogleClick = async () => {
    const trimmed = email.trim();
    if (trimmed && !validateEmail(trimmed)) {
      setErrorMsg('Format email tidak valid. Perbaiki atau kosongkan kolom email untuk memilih akun Google.');
      return;
    }
    setErrorMsg(null);
    try {
      await onLoginWithGoogle(trimmed || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login Google gagal.';
      setErrorMsg(
        `${msg} Jika popup diblokir browser, Anda dapat langsung login memakai form Email Dosen di atas.`
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dosen-login-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            onClick={() => !authLoading && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100/80 text-emerald-700 border border-emerald-200/80 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="dosen-login-title"
                    className="text-base font-semibold tracking-tight text-slate-900"
                  >
                    Login Akun Dosen
                  </h2>
                  <p className="text-xs text-slate-500">
                    Masukkan Gmail atau email dosen untuk mengakses fitur audit &amp; penilaian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={authLoading}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup dialog login"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email / Gmail Login Form */}
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="dosen-email-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  Alamat Gmail / Email Dosen <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={emailInputRef}
                    id="dosen-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="contoh: dosen.pengampu@gmail.com"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dosen-name-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  Nama &amp; Gelar Dosen <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="dosen-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="contoh: Dr. Hendra Wijaya, M.M."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/85 px-3.5 py-2.5 text-xs text-rose-800">
                  {errorMsg}
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:from-emerald-800 hover:to-teal-800 shadow-sm disabled:opacity-60 transition-all whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk dengan Email Dosen</span>
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-[11px] font-medium text-slate-400">
                atau autentikasi Google
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Google OAuth Sign-In */}
            <div className="flex justify-center">
              <GoogleSignInButton
                onClick={handleGoogleClick}
                loading={authLoading}
                label="Masuk dengan Google (Gmail)"
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Mode Mahasiswa tetap dapat memantau grafik &amp; rekap tanpa login. Login dosen
              membuka akses input observasi, edit skor, pengaturan skala mutu, dan pengesahan audit.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DosenAccountMenu({
  dosenAccount,
  role,
  workspaceConnected,
  authLoading,
  onOpenLogin,
  onLogout,
  onChangeRole,
  onConnectGoogle,
}: {
  dosenAccount: DosenAccount | null;
  role: UserRole;
  workspaceConnected: boolean;
  authLoading: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onChangeRole: (next: UserRole) => void;
  onConnectGoogle: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  if (!dosenAccount) {
    return (
      <motion.button
        type="button"
        whileHover={{ y: -1, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        onClick={onOpenLogin}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Login Dosen</span>
      </motion.button>
    );
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
      >
        {dosenAccount.photoURL ? (
          <img
            src={dosenAccount.photoURL}
            alt={dosenAccount.displayName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white shrink-0">
            {getInitials(dosenAccount.displayName || dosenAccount.email)}
          </span>
        )}
        <span className="max-w-[140px] sm:max-w-[170px] truncate font-medium text-slate-800">
          {dosenAccount.email}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            menuOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xl p-2 z-50 space-y-1"
          >
            {/* Account Summary */}
            <div className="px-3 py-2.5 border-b border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {dosenAccount.displayName}
              </p>
              <p className="text-xs font-mono-num text-slate-500 truncate">{dosenAccount.email}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {dosenAccount.authMethod === 'google' ? 'Akun Google' : 'Email Dosen'} ·{' '}
                  {role === 'dosen' ? 'Mode Dosen' : 'Pratinjau Mahasiswa'}
                </span>
              </div>
            </div>

            {/* Role Preview Switch */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onChangeRole(role === 'dosen' ? 'mahasiswa' : 'dosen');
                setMenuOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100/80 transition-colors text-left"
            >
              <span className="inline-flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>{role === 'dosen' ? 'Pratinjau Mode Mahasiswa' : 'Kembali ke Mode Dosen'}</span>
              </span>
            </button>

            {/* Switch Email / Account */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100/80 transition-colors text-left"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti Email / Akun Dosen</span>
            </button>

            {/* Connect Google Workspace if not yet connected */}
            {!workspaceConnected && (
              <button
                type="button"
                role="menuitem"
                disabled={authLoading}
                onClick={() => {
                  setMenuOpen(false);
                  onConnectGoogle();
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50/80 transition-colors text-left disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Hubungkan Google Sheets &amp; Calendar</span>
              </button>
            )}

            <div className="border-t border-slate-100 my-1" />

            {/* Logout */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
