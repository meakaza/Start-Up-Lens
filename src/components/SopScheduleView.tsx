import React, { useState } from 'react';
import { Calendar, CalendarPlus, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import type { GoogleCalendarEventItem } from '../services/googleWorkspace';
import { GoogleSignInButton } from './GlassPrimitives';

export function SopScheduleView({
  workspaceConnected,
  workspaceEmail,
  authLoading,
  onSignInGoogle,
  calendarEvents,
  calendarLoading,
  onRefreshCalendar,
  onCreateScheduleEvent,
}: {
  workspaceConnected: boolean;
  workspaceEmail: string | null;
  authLoading: boolean;
  onSignInGoogle: () => void;
  calendarEvents: GoogleCalendarEventItem[];
  calendarLoading: boolean;
  onRefreshCalendar: () => void;
  onCreateScheduleEvent: (payload: {
    summary: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
}) {
  const [eventTitle, setEventTitle] = useState('Audit Operasional Cafe Lab (MAN1106508)');
  const [eventDate, setEventDate] = useState('2026-11-19');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('22:00');
  const [eventDesc, setEventDesc] = useState(
    'Observasi operasional harian (Pre-opening, Service Rush, Closing & Rekonsiliasi Kas).'
  );

  return (
    <div className="space-y-6">
      {/* Schedule & Field Reality Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-700" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Jadwal Operasional Reguler &amp; Periode Penilaian
              </h2>
              <p className="text-xs text-slate-500">
                Mata Kuliah Cafe and Restaurant Business (MAN1106508) · 3 Bulan (Akhir Oktober 2026–Januari 2027)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { day: 'Selasa', hours: '10.00 – 22.00', status: 'Aktif Reguler' },
              { day: 'Rabu', hours: '10.00 – 22.00', status: 'Aktif Reguler' },
              { day: 'Kamis', hours: '10.00 – 22.00', status: 'Aktif Reguler' },
              { day: 'Jumat', hours: '10.00 – 22.00', status: 'Aktif Reguler' },
            ].map((slot) => (
              <div
                key={slot.day}
                className="rounded-xl border border-slate-200/80 bg-white/75 p-3.5 space-y-1"
              >
                <p className="text-sm font-bold text-slate-900">{slot.day}</p>
                <p className="font-mono-num text-xs font-semibold text-blue-700">{slot.hours}</p>
                <p className="text-[11px] text-emerald-700">{slot.status}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/75 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">
              Catatan Penyesuaian Realita Operasional Lapangan
            </h3>
            <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li>
                Briefing Pagi / Morning Briefing dihilangkan dari indikator wajib karena tidak
                dilaksanakan oleh mahasiswa sebelum jam buka.
              </li>
              <li>
                Evaluasi Penutupan / Closing Rapat Sore bersifat <strong>Kondisional / Insidental</strong>{' '}
                (hanya dijalankan jika terjadi kendala operasional, keterlambatan SLA, atau selisih kas).
              </li>
              <li>
                Penilaian berfokus penuh pada kesiapan mandiri pre-opening, eksekusi live service,
                pencatatan kas manual/POS transisi, kebersihan CLAYGO, serta closing &amp; rekonsiliasi.
              </li>
            </ol>
          </div>
        </div>

        {/* Google Calendar Live Schedule Panel */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Google Calendar Cafe Lab</h2>
                <p className="text-xs text-slate-500">
                  {workspaceConnected
                    ? `Terhubung: ${workspaceEmail}`
                    : 'Hubungkan akun Google untuk melihat & menjadwalkan sesi'}
                </p>
              </div>
            </div>
            {workspaceConnected && (
              <button
                type="button"
                onClick={onRefreshCalendar}
                disabled={calendarLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calendarLoading ? 'animate-spin' : ''}`} />
                Muat
              </button>
            )}
          </div>

          {!workspaceConnected ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center space-y-3">
              <p className="text-xs text-slate-600">
                Aktifkan koneksi Google Calendar untuk menampilkan agenda operasional Selasa–Jumat
                dan menambahkan jadwal evaluasi atau rapat insidental.
              </p>
              <div className="flex justify-center">
                <GoogleSignInButton onClick={onSignInGoogle} loading={authLoading} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {calendarEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Belum ada event terdekat atau klik &ldquo;Muat&rdquo; untuk menyinkronkan jadwal.
                  </p>
                ) : (
                  calendarEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{ev.summary}</p>
                        <p className="font-mono-num text-[11px] text-slate-500">
                          {ev.start.dateTime
                            ? new Date(ev.start.dateTime).toLocaleString('id-ID')
                            : ev.start.date}
                        </p>
                      </div>
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:text-blue-900 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                <p className="text-xs font-semibold text-slate-800">
                  Jadwalkan Sesi Baru ke Google Calendar
                </p>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-num text-slate-900"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-num text-slate-900"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-num text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                />
                <button
                  type="button"
                  onClick={() =>
                    onCreateScheduleEvent({
                      summary: eventTitle,
                      description: eventDesc,
                      date: eventDate,
                      startTime,
                      endTime,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Simpan ke Google Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOP Cards: SRC, L.A.S.T, CLAYGO & Cash Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Standar Resep &amp; SLA (SRC)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>• Wajib menggunakan timbangan digital &amp; jigger sesuai Standard Recipe Card.</li>
            <li>• SLA Ticket Time Minuman: maksimal &lt; 5 menit sejak bon tercetak.</li>
            <li>• SLA Ticket Time Makanan: maksimal &lt; 10 menit termasuk plating.</li>
            <li>• Sisa bahan &amp; porsi rusak wajib ditimbang dalam gram sebelum dibuang (Waste Audit).</li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Metode Service Recovery (L.A.S.T)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>
              <strong>L — Listen:</strong> Dengarkan keluhan pelanggan tanpa menyela dan catat inti
              masalah.
            </li>
            <li>
              <strong>A — Apologize:</strong> Sampaikan permohonan maaf tulus atas nama tim Cafe Lab.
            </li>
            <li>
              <strong>S — Solve:</strong> Berikan solusi cepat (remake menu, penyesuaian suhu/rasa).
            </li>
            <li>
              <strong>T — Thank:</strong> Ucapkan terima kasih atas masukan dan arahkan ke QR Feedback.
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            CLAYGO, Kasir &amp; Rapat Insidental
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>• Hitung Modal Kasir (Float) sebelum buka &amp; cocokkan kas fisik saat closing.</li>
            <li>• Pada masa transisi POS, setiap void atau diskon wajib ditandatangani Shift Manager.</li>
            <li>• Terapkan Clean As You Go (CLAYGO) menyeluruh pada stasiun BOH &amp; FOH.</li>
            <li>• Rapat evaluasi sore hanya dilaksanakan jika ada kendala kas, SLA, atau komplain berat.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
