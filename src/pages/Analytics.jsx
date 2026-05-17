import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Calendar, Award, Target } from 'lucide-react';
import Layout from '../components/Layout';

export default function Analytics({ student }) {
  // Derive real data from student model
  const scores = student.scores;
  const history = student.history || [];

  const metrics = useMemo(() => [
    {
      label: 'Kepercayaan Diri',
      value: Math.round(scores.confidence * 100),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      positive: true,
      desc: 'Kemampuan tampil tenang di depan audiens',
    },
    {
      label: 'Artikulasi',
      value: Math.round(scores.articulation * 100),
      color: 'text-blue-400',
      bgColor: 'bg-blue-400',
      positive: true,
      desc: 'Kejelasan dan diksi setiap kata yang diucapkan',
    },
    {
      label: 'Kecepatan',
      value: Math.round(scores.speed * 100),
      color: 'text-purple-400',
      bgColor: 'bg-purple-400',
      positive: true,
      desc: 'Ritme dan tempo berbicara yang stabil',
    },
    {
      label: 'Kata Pengisi',
      value: Math.round(scores.fillers * 100),
      color: 'text-pink-400',
      bgColor: 'bg-pink-400',
      positive: false,  // Lower is better for fillers
      desc: 'Frekuensi kata pengisi (em, ah, anu)',
    },
  ], [scores]);

  const avgScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length);
  }, [history]);

  const completedCount = student.progress.length;

  // Build sparkline data from history (last 6 sessions each metric — simulated)
  const sparklineData = [20, 35, 30, 50, 65, Math.round(scores.confidence * 100)];

  // Predict days to next level
  const overallAvg = (scores.confidence + scores.articulation + scores.speed + (1 - scores.fillers)) / 4;
  const targetAvg = student.level === 'Pemula' ? 0.4 : student.level === 'Menengah' ? 0.7 : 1.0;
  const gap = Math.max(0, targetAvg - overallAvg);
  const predictedDays = gap > 0 ? Math.ceil(gap / 0.015) : 0; // ~1.5% gain per session/day
  const nextLevel = student.level === 'Pemula' ? 'Menengah' : student.level === 'Menengah' ? 'Mahir' : null;

  // Weekly activity based on history (last 7 days)
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const weekActivity = useMemo(() => {
    return daysOfWeek.map((day, i) => {
      // Check if any history entry matches this day of week
      const hasSession = history.some(h => {
        const d = new Date(h.date);
        return d.getDay() === (i + 1) % 7;
      });
      return { day, active: hasSession, width: hasSession ? 70 + Math.random() * 30 : 5 + Math.random() * 20 };
    });
  }, [history]);

  return (
    <Layout student={student} activePage="Analitik">
      <div className="max-w-6xl mx-auto py-4">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
            <Activity size={14} />
            <span>Laporan Performa Mendalam</span>
          </div>
          <h1 className="text-5xl font-black text-white">Analitik <span className="accent-text">Data</span></h1>
          <p className="text-slate-400 mt-3 text-lg font-medium">Pantau progres vokal Anda dari waktu ke waktu.</p>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Sesi Selesai', value: history.length, icon: <Target size={20} />, color: 'text-indigo-400' },
            { label: 'Modul Tuntas', value: completedCount, icon: <Award size={20} />, color: 'text-yellow-400' },
            { label: 'Rata-rata Skor', value: avgScore > 0 ? `${avgScore}%` : '—', icon: <TrendingUp size={20} />, color: 'text-emerald-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Metric Cards with real scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              className="glass p-6 group overflow-hidden relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-3xl font-black text-white">{m.value}%</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-xs font-bold ${m.color}`}>
                  {m.positive
                    ? m.value >= 60 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                    : m.value <= 40 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                  }
                  {m.positive ? (m.value >= 60 ? 'Baik' : 'Perlu Latihan') : (m.value <= 40 ? 'Baik' : 'Tinggi')}
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-3">{m.desc}</p>
              {/* Progress bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.positive ? m.value : (100 - m.value)}%` }}
                  transition={{ duration: 1.2, delay: 0.5 + i * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    m.label === 'Kepercayaan Diri' ? 'from-emerald-600 to-emerald-400' :
                    m.label === 'Artikulasi' ? 'from-blue-600 to-blue-400' :
                    m.label === 'Kecepatan' ? 'from-purple-600 to-purple-400' :
                    'from-pink-600 to-pink-400'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Activity */}
          <section className="glass p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Calendar size={22} className="text-indigo-400" />
              Aktivitas Mingguan
            </h3>
            <div className="space-y-4">
              {weekActivity.map(({ day, active, width }) => (
                <div key={day} className="flex items-center gap-5">
                  <span className="w-14 text-xs font-bold text-slate-500 uppercase tracking-widest">{day.substring(0,3)}</span>
                  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full rounded-full ${active ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`}
                    />
                  </div>
                  {active && <span className="text-[10px] font-black text-indigo-400 uppercase">Aktif</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Prediction / Target */}
          <section className="glass p-8 bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Award size={22} className="text-yellow-400" />
              Prediksi Target ITS
            </h3>
            <div className="space-y-6">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                {nextLevel ? (
                  <p className="text-slate-300 text-base leading-relaxed">
                    Berdasarkan kemajuan Anda, estimasi mencapai level{' '}
                    <span className="text-emerald-400 font-black">{nextLevel}</span>{' '}
                    dalam sekitar <span className="text-white font-black">{predictedDays} hari</span> latihan lagi.
                  </p>
                ) : (
                  <p className="text-slate-300 text-base leading-relaxed">
                    🎉 Selamat! Anda telah mencapai level tertinggi, <span className="text-emerald-400 font-black">Mahir</span>. Pertahankan konsistensi!
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Fokus Perbaikan:</p>
                <ul className="space-y-2">
                  {scores.confidence < 0.7 && (
                    <li className="flex items-center gap-3 text-white font-bold text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      Tingkatkan sesi Kehadiran Panggung
                    </li>
                  )}
                  {scores.articulation < 0.7 && (
                    <li className="flex items-center gap-3 text-white font-bold text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      Latih artikulasi dengan membaca keras-keras
                    </li>
                  )}
                  {scores.fillers > 0.4 && (
                    <li className="flex items-center gap-3 text-white font-bold text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                      Kurangi kata pengisi — ganti dengan jeda diam
                    </li>
                  )}
                  {scores.confidence >= 0.7 && scores.articulation >= 0.7 && scores.fillers <= 0.4 && (
                    <li className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Semua metrik utama sudah di level baik!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Session History */}
        {history.length > 0 && (
          <section className="glass p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <BarChart3 size={22} className="text-purple-400" />
              Riwayat Sesi Latihan
            </h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{entry.moduleTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${entry.score >= 80 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {entry.score}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {history.length === 0 && (
          <section className="glass p-12 text-center border-dashed border-white/10">
            <p className="text-slate-500 text-lg font-medium">Belum ada riwayat sesi latihan.</p>
            <p className="text-slate-600 text-sm mt-2">Selesaikan satu modul latihan dari Dashboard untuk melihat data di sini.</p>
          </section>
        )}
      </div>
    </Layout>
  );
}
