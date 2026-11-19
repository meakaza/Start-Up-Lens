import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Eraser, ShieldAlert, X } from 'lucide-react';

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const startVal = prevRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(endVal);
      prevRef.current = endVal;
      return;
    }

    const duration = 420;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current);
      if (elapsed < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevRef.current = endVal;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : new Intl.NumberFormat('id-ID').format(Math.round(display));

  return (
    <span className={`font-mono-num tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function ScoreProgressRing({
  score,
  size = 88,
  strokeWidth = 8,
  color = '#1d4ed8',
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.22)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono-num text-lg font-bold text-slate-900 leading-none">
          {clamped.toFixed(1)}
        </span>
        {label && <span className="text-[11px] font-medium text-slate-500 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

export function GoogleSignInButton({
  onClick,
  loading = false,
  label = 'Sign in with Google',
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="gsi-material-button shrink-0"
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents whitespace-nowrap">
          {loading ? 'Menghubungkan...' : label}
        </span>
      </div>
    </button>
  );
}

export function SignaturePadBox({
  roleTitle,
  signerName,
  onSignerNameChange,
  existingDataUrl,
  signedAt,
  readOnly = false,
  onSaveSignature,
  onClearSignature,
}: {
  roleTitle: string;
  signerName: string;
  onSignerNameChange: (name: string) => void;
  existingDataUrl?: string;
  signedAt?: string;
  readOnly?: boolean;
  onSaveSignature: (dataUrl: string) => void;
  onClearSignature: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || existingDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasStroke(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || readOnly || existingDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStroke(false);
    onClearSignature();
  };

  const commitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) return;
    onSaveSignature(canvas.toDataURL('image/png'));
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/65 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">{roleTitle}</span>
        {signedAt && (
          <span className="text-xs font-mono-num text-emerald-700">
            Disetujui · {new Date(signedAt).toLocaleString('id-ID')}
          </span>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Nama Penandatangan</label>
        <input
          type="text"
          value={signerName}
          disabled={readOnly}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder="Nama lengkap..."
          className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60"
        />
      </div>

      {existingDataUrl ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 flex flex-col items-center justify-center">
          <img
            src={existingDataUrl}
            alt={`Tanda tangan ${signerName}`}
            referrerPolicy="no-referrer"
            className="h-20 object-contain"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={clearCanvas}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              Ulangi Tanda Tangan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={340}
            height={110}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`w-full h-24 rounded-lg border border-dashed border-slate-300 bg-white/90 touch-none ${
              readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'
            }`}
          />
          {!readOnly && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Eraser className="w-3.5 h-3.5" />
                Bersihkan
              </button>
              <button
                type="button"
                disabled={!hasStroke || !signerName.trim()}
                onClick={commitCanvas}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                Sahkan Tanda Tangan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface WorkspaceConfirmState {
  isOpen: boolean;
  title: string;
  description: string;
  affectedDetails: string[];
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
}

export function WorkspaceConfirmModal({
  state,
  onClose,
  busy,
}: {
  state: WorkspaceConfirmState;
  onClose: () => void;
  busy: boolean;
}) {
  if (!state.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">{state.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{state.description}</p>

        {state.affectedDetails.length > 0 && (
          <ul className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 text-xs text-slate-700">
            {state.affectedDetails.map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-700 font-semibold">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={state.onConfirm}
            disabled={busy}
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
          >
            {busy ? 'Memproses...' : state.confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
