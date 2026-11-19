import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppView } from '../types/audit';

export function BackgroundVisualLayer() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 no-print"
      aria-hidden="true"
    >
      {/* 1. Architectural Emerald Diamond & Cafe-Atelier Arch Lattice Motif */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.65]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="emeraldAtelierMotif" width="96" height="96" patternUnits="userSpaceOnUse">
            <path
              d="M0 48 L48 0 L96 48 L48 96 Z"
              fill="none"
              stroke="rgba(5, 150, 105, 0.11)"
              strokeWidth="1"
            />
            <path
              d="M24 24 Q48 8 72 24 Q88 48 72 72 Q48 88 24 72 Q8 48 24 24 Z"
              fill="none"
              stroke="rgba(13, 148, 136, 0.09)"
              strokeWidth="0.9"
            />
            <path
              d="M48 0 V96 M0 48 H96"
              fill="none"
              stroke="rgba(5, 150, 105, 0.06)"
              strokeWidth="0.8"
              strokeDasharray="3 5"
            />
            <circle cx="48" cy="48" r="2.2" fill="rgba(5, 150, 105, 0.2)" />
            <circle cx="0" cy="0" r="1.6" fill="rgba(29, 78, 216, 0.16)" />
            <circle cx="96" cy="0" r="1.6" fill="rgba(29, 78, 216, 0.16)" />
            <circle cx="0" cy="96" r="1.6" fill="rgba(29, 78, 216, 0.16)" />
            <circle cx="96" cy="96" r="1.6" fill="rgba(29, 78, 216, 0.16)" />
          </pattern>
          <radialGradient id="atelierMaskGrad" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="65%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0.22" />
          </radialGradient>
          <mask id="atelierMask">
            <rect width="100%" height="100%" fill="url(#atelierMaskGrad)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#emeraldAtelierMotif)" mask="url(#atelierMask)" />
      </svg>

      {/* 2. Sweeping Full-Width Organic Emerald Silk Ribbons */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.42]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ribbonEmeraldA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#0d9488" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="ribbonEmeraldB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path
          d="M-80 220 C 260 110, 510 340, 860 210 C 1130 110, 1290 220, 1520 120 L1520 265 C 1270 365, 1110 230, 840 345 C 490 485, 250 250, -80 350 Z"
          fill="url(#ribbonEmeraldA)"
        />
        <path
          d="M-100 680 C 240 530, 560 760, 920 600 C 1180 485, 1330 620, 1540 520 L1540 675 C 1310 770, 1150 635, 900 745 C 540 900, 230 670, -100 810 Z"
          fill="url(#ribbonEmeraldB)"
        />

        <path
          d="M-60 210 C 260 100, 520 330, 870 200 C 1140 100, 1300 210, 1520 110"
          stroke="rgba(5, 150, 105, 0.32)"
          strokeWidth="1.25"
        />
        <path
          d="M-60 255 C 265 145, 525 375, 875 245 C 1145 145, 1305 255, 1520 155"
          stroke="rgba(16, 185, 129, 0.25)"
          strokeWidth="1"
          strokeDasharray="6 7"
        />
        <path
          d="M-80 695 C 250 545, 565 775, 925 615 C 1185 500, 1335 635, 1540 535"
          stroke="rgba(15, 118, 110, 0.28)"
          strokeWidth="1.2"
        />
        <path
          d="M-80 735 C 250 585, 565 815, 925 655 C 1185 540, 1335 675, 1540 575"
          stroke="rgba(5, 150, 105, 0.2)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* 3. Signature "Start-Up Lens" Concentric Calibration Rings */}
      <motion.svg
        className="absolute -top-24 -right-24 w-[520px] h-[520px] opacity-[0.45]"
        viewBox="0 0 520 520"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="260" cy="260" r="140" stroke="rgba(5, 150, 105, 0.24)" strokeWidth="1.2" />
        <circle cx="260" cy="260" r="185" stroke="rgba(13, 148, 136, 0.2)" strokeWidth="1.1" strokeDasharray="8 10" />
        <circle cx="260" cy="260" r="232" stroke="rgba(29, 78, 216, 0.14)" strokeWidth="1" strokeDasharray="2 8" />
        <path d="M260 18 V44 M260 476 V502 M18 260 H44 M476 260 H502" stroke="rgba(5, 150, 105, 0.35)" strokeWidth="1.5" strokeLinecap="round" />
      </motion.svg>

      <motion.svg
        className="absolute -bottom-28 -left-24 w-[460px] h-[460px] opacity-[0.4]"
        viewBox="0 0 460 460"
        fill="none"
        animate={{ rotate: -360 }}
        transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="230" cy="230" r="120" stroke="rgba(5, 150, 105, 0.22)" strokeWidth="1.2" strokeDasharray="5 7" />
        <circle cx="230" cy="230" r="172" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.1" />
        <circle cx="230" cy="230" r="212" stroke="rgba(15, 118, 110, 0.14)" strokeWidth="1" strokeDasharray="3 9" />
      </motion.svg>

      {/* 4. Soft Ambient Light Depth */}
      <div
        className="ambient-orb absolute -top-28 -left-20 h-[440px] w-[440px] rounded-full blur-3xl opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.22), rgba(13, 148, 136, 0.06) 60%, transparent 75%)',
        }}
      />
      <div
        className="ambient-orb absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(5, 150, 105, 0.18), rgba(29, 78, 216, 0.08) 60%, transparent 75%)',
          animationDelay: '-7s',
        }}
      />
    </div>
  );
}

interface BannerConfig {
  kicker: string;
  title: string;
  subtitle: string;
  caption: string;
}

const BANNER_META: Record<AppView, BannerConfig> = {
  dashboard: {
    kicker: 'Ringkasan Eksekutif · Akhir Okt 2026–Jan 2027',
    title: 'Pantauan Performa Cafe Lab',
    subtitle:
      'Akumulasi skor harian, analisis otomatis 3 kekuatan & 3 perbaikan mendesak, serta proyeksi nilai akhir.',
    caption: 'Live Telemetry · Okt 26–Jan 27',
  },
  form: {
    kicker: 'Instrumen Observasi Lapangan · MAN1106508',
    title: 'Lembar Penilaian & Checklist Harian',
    subtitle:
      'Evaluasi mandiri pre-opening, service rush, rekonsiliasi kas, waste audit, serta pengesahan tanda tangan digital.',
    caption: 'Observasi Harian · 14 Item',
  },
  history: {
    kicker: 'Arsip Terverifikasi · Selasa–Jumat',
    title: 'Riwayat Sesi & Audit Trail Perubahan',
    subtitle:
      'Telusuri seluruh log observasi mulai akhir Oktober 2026, buka mode edit, atau cetak laporan audit PDF.',
    caption: 'Arsip Terverifikasi · Sel–Jum',
  },
  analyzer: {
    kicker: 'Diagnostik Operasional Terpadu',
    title: 'Pusat Analyzer Kas, SLA & Kitchen Waste',
    subtitle:
      'Deteksi pola selisih masa transisi POS, kepatuhan ticket time minuman/makanan, dan tindak lanjut lintas shift.',
    caption: 'Kalibrasi Kas, SLA & SRC',
  },
  sop: {
    kicker: 'Standar Operasional & Sinkronisasi Kalender',
    title: 'Jadwal Reguler & Protokol Cafe Lab',
    subtitle:
      'Jam buka Selasa–Jumat 10.00–22.00, standar porsi SRC, pemulihan komplain L.A.S.T, dan jadwal Google Calendar.',
    caption: 'Operasional 10.00–22.00 WIB',
  },
  export: {
    kicker: 'Kontrol Akses & Integrasi Dokumen',
    title: 'Peran Pengguna, Google Sheets & Ekspor Laporan',
    subtitle:
      'Atur mode Dosen/Mahasiswa, sinkronkan spreadsheet kerja langsung ke Drive, atau unduh laporan PDF/CSV.',
    caption: 'Sinkronisasi Drive & PDF',
  },
};

function MenuAnimatedArtwork({ view }: { view: AppView }) {
  switch (view) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="animDashArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="animDashLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* Subtle grid lines */}
          {[32, 62, 92, 118].map((y) => (
            <line key={y} x1="20" x2="300" y1={y} y2={y} stroke="rgba(16, 185, 129, 0.14)" strokeWidth="1" />
          ))}
          {/* Animated vertical rhythm bars */}
          {[
            { x: 38, h: 36, d: 0 },
            { x: 74, h: 48, d: 0.15 },
            { x: 110, h: 42, d: 0.3 },
            { x: 146, h: 58, d: 0.45 },
            { x: 182, h: 66, d: 0.6 },
            { x: 218, h: 74, d: 0.75 },
            { x: 254, h: 82, d: 0.9 },
          ].map((b) => (
            <motion.rect
              key={b.x}
              x={b.x}
              width="14"
              rx="4"
              fill="rgba(5, 150, 105, 0.16)"
              animate={{
                y: [118 - b.h, 118 - b.h - 6, 118 - b.h],
                height: [b.h, b.h + 6, b.h],
              }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: b.d }}
            />
          ))}
          {/* Rising area & curve */}
          <motion.path
            d="M28 102 C 72 96, 98 78, 138 82 C 176 86, 206 54, 244 48 C 268 44, 286 32, 296 28 L296 118 L28 118 Z"
            fill="url(#animDashArea)"
            animate={{ opacity: [0.65, 0.95, 0.65] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M28 102 C 72 96, 98 78, 138 82 C 176 86, 206 54, 244 48 C 268 44, 286 32, 296 28"
            stroke="url(#animDashLine)"
            strokeWidth="2.8"
            strokeLinecap="round"
            initial={{ pathLength: 0.15 }}
            animate={{ pathLength: [0.25, 1, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Target radar beacon */}
          <motion.circle
            cx="296"
            cy="28"
            r="10"
            stroke="#10b981"
            strokeWidth="1.5"
            animate={{ scale: [0.8, 1.7, 0.8], opacity: [0.7, 0.1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '296px 28px' }}
          />
          <circle cx="296" cy="28" r="4" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="138" cy="82" r="3.5" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2" />
          <circle cx="244" cy="48" r="3.5" fill="#ffffff" stroke="#059669" strokeWidth="2" />
        </svg>
      );

    case 'form':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          {/* Floating Audit Sheet */}
          <rect x="44" y="16" width="232" height="112" rx="12" fill="rgba(255,255,255,0.88)" stroke="rgba(5,150,105,0.28)" strokeWidth="1.4" />
          {/* Header bar inside sheet */}
          <rect x="60" y="28" width="94" height="8" rx="4" fill="rgba(5,150,105,0.25)" />
          <rect x="218" y="28" width="42" height="8" rx="4" fill="rgba(29,78,216,0.22)" />
          {/* Animated Checklist Rows */}
          {[48, 68, 88].map((y, i) => (
            <g key={y}>
              <motion.rect
                x="60"
                y={y}
                width="12"
                height="12"
                rx="3.5"
                fill="rgba(16, 185, 129, 0.15)"
                stroke="#059669"
                strokeWidth="1.3"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.45 }}
                style={{ transformOrigin: `66px ${y + 6}px` }}
              />
              <motion.path
                d={`M63 ${y + 6} L65.5 ${y + 8.5} L69.5 ${y + 3.5}`}
                stroke="#059669"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ pathLength: [0, 1, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.45 }}
              />
              <rect x="80" y={y + 2} width={118 - i * 16} height="7" rx="3.5" fill="rgba(100,116,139,0.2)" />
            </g>
          ))}
          {/* Animated Digital Signature Curve */}
          <motion.path
            d="M174 112 Q 192 94, 206 110 T 236 106 Q 248 98, 258 110"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      );

    case 'history':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          {/* Timeline vertical spine */}
          <line x1="72" y1="22" x2="72" y2="122" stroke="rgba(5, 150, 105, 0.25)" strokeWidth="2" strokeDasharray="3 4" />
          {[
            { y: 24, labelW: 118, accent: '#059669', delay: 0 },
            { y: 58, labelW: 142, accent: '#d97706', delay: 0.35 },
            { y: 92, labelW: 126, accent: '#1d4ed8', delay: 0.7 },
          ].map((card) => (
            <motion.g
              key={card.y}
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
            >
              <circle cx="72" cy={card.y + 14} r="5" fill="#ffffff" stroke={card.accent} strokeWidth="2.2" />
              <rect x="92" y={card.y} width="184" height="28" rx="8" fill="rgba(255,255,255,0.88)" stroke="rgba(148,163,184,0.32)" strokeWidth="1.2" />
              <rect x="104" y={card.y + 8} width={card.labelW} height="5.5" rx="2.75" fill="rgba(30,41,59,0.22)" />
              <rect x="104" y={card.y + 17} width="72" height="4.5" rx="2.25" fill="rgba(5,150,105,0.25)" />
              <rect x="242" y={card.y + 9} width="24" height="10" rx="4" fill={card.accent} fillOpacity="0.18" />
            </motion.g>
          ))}
        </svg>
      );

    case 'analyzer':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          {/* Concentric Diagnostic Calibration Dial */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '110px 72px' }}
          >
            <circle cx="110" cy="72" r="46" stroke="rgba(5,150,105,0.24)" strokeWidth="1.4" strokeDasharray="6 6" />
            <circle cx="110" cy="72" r="32" stroke="rgba(29,78,216,0.28)" strokeWidth="1.6" strokeDasharray="14 8" />
          </motion.g>
          <motion.circle
            cx="110"
            cy="72"
            r="16"
            fill="rgba(16,185,129,0.16)"
            stroke="#059669"
            strokeWidth="2"
            animate={{ scale: [0.92, 1.12, 0.92] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '110px 72px' }}
          />
          <circle cx="110" cy="72" r="4.5" fill="#059669" />
          {/* 3 Equalizer Metric Bars (Kas, SLA, Waste) */}
          {[
            { y: 36, w: 108, color: '#059669', d: 0 },
            { y: 66, w: 88, color: '#1d4ed8', d: 0.4 },
            { y: 96, w: 72, color: '#d97706', d: 0.8 },
          ].map((m) => (
            <g key={m.y}>
              <rect x="180" y={m.y} width="114" height="10" rx="5" fill="rgba(148,163,184,0.18)" />
              <motion.rect
                x="180"
                y={m.y}
                height="10"
                rx="5"
                fill={m.color}
                animate={{ width: [m.w * 0.65, m.w, m.w * 0.78, m.w] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: m.d }}
              />
            </g>
          ))}
        </svg>
      );

    case 'sop':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          {/* Operational Clock */}
          <circle cx="88" cy="72" r="40" fill="rgba(255,255,255,0.85)" stroke="rgba(5,150,105,0.34)" strokeWidth="2" />
          <circle cx="88" cy="72" r="30" stroke="rgba(13,148,136,0.18)" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="88" y1="72" x2="88" y2="48" stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" />
          <motion.line
            x1="88"
            y1="72"
            x2="110"
            y2="72"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '88px 72px' }}
          />
          <circle cx="88" cy="72" r="3.8" fill="#059669" />
          {/* Sel-Jum Shift Cards Wave */}
          {['Sel', 'Rab', 'Kam', 'Jum'].map((d, idx) => (
            <motion.g
              key={d}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.25 }}
            >
              <rect
                x={146 + idx * 39}
                y="42"
                width="33"
                height="58"
                rx="8"
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(5,150,105,0.32)"
                strokeWidth="1.3"
              />
              <text x={162.5 + idx * 39} y="64" textAnchor="middle" fontSize="10" fontWeight="700" fill="#065f46">
                {d}
              </text>
              <rect x={153 + idx * 39} y="74" width="19" height="4" rx="2" fill="#10b981" fillOpacity="0.45" />
              <rect x={156 + idx * 39} y="83" width="13" height="4" rx="2" fill="#1d4ed8" fillOpacity="0.35" />
            </motion.g>
          ))}
        </svg>
      );

    case 'export':
      return (
        <svg viewBox="0 0 320 144" className="w-full h-full" fill="none">
          {/* Left Sheet Node */}
          <rect x="34" y="30" width="96" height="84" rx="10" fill="rgba(255,255,255,0.9)" stroke="rgba(5,150,105,0.35)" strokeWidth="1.5" />
          {[46, 62, 78, 94].map((y) => (
            <g key={y}>
              <rect x="46" y={y} width="32" height="6" rx="2" fill="rgba(5,150,105,0.22)" />
              <rect x="84" y={y} width="34" height="6" rx="2" fill="rgba(148,163,184,0.24)" />
            </g>
          ))}
          {/* Right Report Node */}
          <rect x="190" y="30" width="96" height="84" rx="10" fill="rgba(255,255,255,0.9)" stroke="rgba(29,78,216,0.35)" strokeWidth="1.5" />
          <rect x="204" y="44" width="68" height="8" rx="4" fill="rgba(29,78,216,0.25)" />
          <rect x="204" y="60" width="52" height="6" rx="3" fill="rgba(100,116,139,0.22)" />
          <rect x="204" y="72" width="60" height="6" rx="3" fill="rgba(100,116,139,0.22)" />
          <rect x="204" y="88" width="40" height="12" rx="4" fill="rgba(5,150,105,0.2)" />
          {/* Animated Sync Bridge */}
          <line x1="130" y1="72" x2="190" y2="72" stroke="rgba(5,150,105,0.35)" strokeWidth="2" strokeDasharray="4 4" />
          <motion.circle
            cy="72"
            r="4.5"
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="1.5"
            animate={{ cx: [134, 186] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      );
  }
}

export function MenuVisualBanner({
  view,
  summaryBadge,
}: {
  view: AppView;
  summaryBadge?: string;
}) {
  const meta = BANNER_META[view];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.004 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="glass-panel glass-panel-interactive rounded-2xl p-4 sm:p-5 mb-5 flex flex-col md:flex-row items-stretch justify-between gap-5 overflow-hidden relative"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5 max-w-2xl flex flex-col justify-center relative z-10"
        >
          <p className="text-xs font-medium text-emerald-800">
            {meta.kicker}
            {summaryBadge ? ` · ${summaryBadge}` : ''}
          </p>
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {meta.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{meta.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Bespoke Animated Vector Scene for Each Menu (No Photos) */}
      <div className="shrink-0 w-full md:w-72 lg:w-80 h-36 md:h-auto min-h-[132px] rounded-xl overflow-hidden relative border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white/85 to-teal-50/80">
        <AnimatePresence mode="wait">
          <motion.div
            key={`artwork-${view}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pb-5"
          >
            <MenuAnimatedArtwork view={view} />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute bottom-1.5 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-emerald-900/80">
          <span>{meta.caption}</span>
          <span className="font-mono-num text-emerald-700">MAN1106508</span>
        </div>
      </div>
    </motion.div>
  );
}
