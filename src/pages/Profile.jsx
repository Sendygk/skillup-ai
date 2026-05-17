import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, MapPin, CheckCircle, Clock, Award, BarChart3, TrendingUp, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { domainModel } from '../logic/domainModel';

// Nama pengguna — satu titik perubahan
const USER_NAME = 'Rayyan';
const USER_EMAIL = 'rayyan@skillupai.id';
const USER_LOCATION = 'Indonesia';
const AVATAR_SEED = 'Rayyan';

export default function Profile({ student }) {
  const navigate = useNavigate();
  const history = student.history || [];

  // Stats yang dihitung dari data nyata
  const avgScore = useMemo(() => {
    if (history.length === 0) return null;
    return Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);
  }, [history]);

  const totalMinutes = history.length * 8; // ~8 menit per sesi
  const totalDisplay = totalMinutes >= 60
    ? `${(totalMinutes / 60).toFixed(1)} Jam`
    : `${totalMinutes} Menit`;

  const scores = student.scores;
  const metricLabels = {
    confidence: 'Kepercayaan Diri',
    articulation: 'Artikulasi',
    speed: 'Kecepatan',
    fillers: 'Kata Pengisi',
  };

  const levelConfig = {
    'Pemula':       { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', next: 'Menengah' },
    'Menengah':     { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', next: 'Mahir' },
    'Mahir':        { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', next: null },
    'Belum Dinilai':{ color: 'text-slate-400 bg-white/5 border-white/10', next: 'Pemula' },
  };
  const levelStyle = (levelConfig[student.level] || levelConfig['Belum Dinilai']).color;

  // Map moduleId → title dari domainModel (single source of truth)
  const moduleMap = useMemo(() => {
    return Object.fromEntries(domainModel.map(m => [m.id, m]));
  }, []);

  // Best score per modul dari history
  const bestScoreMap = useMemo(() => {
    const map = {};
    history.forEach(h => {
      if (!map[h.moduleId] || h.score > map[h.moduleId]) {
        map[h.moduleId] = h.score;
      }
    });
    return map;
  }, [history]);

  return (
    <Layout student={student} activePage="Profil">
      <div className="max-w-6xl mx-auto py-4">

        {/* ── Profile Header ── */}
        <div className="glass p-8 lg:p-12 relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/8 blur-[120px] -mr-32 -mt-32 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-1.5 border border-white/10 relative z-10 shadow-2xl">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${AVATAR_SEED}`}
                  alt={`Avatar ${USER_NAME}`}
                  className="h-full w-full rounded-full bg-indigo-900/40"
                />
              </div>
              {/* Online dot */}
              <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-500 border-4 border-[#07070c] z-20" />
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl lg:text-5xl font-black text-white">{USER_NAME}</h1>
                <span className={`px-3 py-1 border rounded-full text-xs font-black uppercase tracking-widest ${levelStyle}`}>
                  {student.level}
                </span>
              </div>
              <p className="text-base text-slate-500 mb-6 font-medium">
                {USER_EMAIL} · {USER_LOCATION}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Latihan</p>
                  <p className="text-2xl font-black text-white">
                    {history.length > 0 ? totalDisplay : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rata-rata Skor</p>
                  <p className="text-2xl font-black text-indigo-400">{avgScore !== null ? `${avgScore}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Modul Selesai</p>
                  <p className="text-2xl font-black text-purple-400">{student.progress.length} <span className="text-slate-600 font-medium text-lg">/ 7</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Sesi</p>
                  <p className="text-2xl font-black text-emerald-400">{history.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Kolom Kiri ── */}
          <div className="lg:col-span-5 space-y-8">

            {/* Informasi Akun */}
            <section className="glass p-8">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <User size={20} className="text-indigo-400" />
                Informasi Akun
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nama', value: USER_NAME, icon: <User size={15} /> },
                  { label: 'Email', value: USER_EMAIL, icon: <Mail size={15} /> },
                  { label: 'Lokasi', value: USER_LOCATION, icon: <MapPin size={15} /> },
                  { label: 'Level Saat Ini', value: student.level, icon: <TrendingUp size={15} /> },
                  { label: 'Modul Diselesaikan', value: `${student.progress.length} dari 7 modul`, icon: <Award size={15} /> },
                  { label: 'Total Sesi', value: `${history.length} sesi latihan`, icon: <Calendar size={15} /> },
                ].map(info => (
                  <div key={info.label} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-slate-500 flex-shrink-0">{info.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">{info.label}</p>
                      <p className="text-white font-bold truncate">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Snapshot Keahlian — sinkron dari student.scores */}
            <section className="glass p-8">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <BarChart3 size={20} className="text-purple-400" />
                Snapshot Keahlian
              </h3>
              <div className="space-y-5">
                {Object.entries(scores).map(([key, val], i) => {
                  const isFillers = key === 'fillers';
                  const effectiveVal = isFillers ? (1 - val) : val; // fillers inverted
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{metricLabels[key]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">{Math.round(val * 100)}%</span>
                          {isFillers && (
                            <span className="text-[9px] text-slate-600 italic">(lebih rendah = lebih baik)</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${effectiveVal * 100}%` }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            effectiveVal > 0.7 ? 'from-emerald-600 to-emerald-400' :
                            effectiveVal > 0.4 ? 'from-indigo-600 to-indigo-400' :
                            'from-pink-600 to-pink-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate('/analytics')}
                className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                Lihat Analitik Lengkap →
              </button>
            </section>
          </div>

          {/* ── Kolom Kanan ── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Modul yang Diselesaikan — sinkron dari student.progress */}
            {student.progress.length > 0 && (
              <section className="glass p-8">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <BookOpen size={20} className="text-emerald-400" />
                  Modul yang Diselesaikan
                </h3>
                <div className="space-y-3">
                  {student.progress.map(moduleId => {
                    const mod = moduleMap[moduleId];
                    const bestScore = bestScoreMap[moduleId];
                    const lastEntry = history.find(h => h.moduleId === moduleId);
                    return (
                      <div
                        key={moduleId}
                        onClick={() => navigate(`/training/${moduleId}`)}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <CheckCircle size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {mod?.title || moduleId}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {mod && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  mod.level === 'Pemula' ? 'text-emerald-400 bg-emerald-500/10' :
                                  mod.level === 'Menengah' ? 'text-blue-400 bg-blue-500/10' :
                                  'text-purple-400 bg-purple-500/10'
                                }`}>{mod.level}</span>
                              )}
                              {lastEntry && (
                                <span className="text-xs text-slate-600">
                                  {new Date(lastEntry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {bestScore !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <span className={`text-lg font-black ${bestScore >= 80 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                              {bestScore}%
                            </span>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">skor terbaik</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Aktivitas Terakhir — sinkron dari student.history */}
            <section className="glass p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Clock size={20} className="text-indigo-400" />
                  Riwayat Sesi Terakhir
                </h3>
                {history.length > 4 && (
                  <button onClick={() => navigate('/analytics')}
                    className="text-xs font-black text-indigo-400 hover:text-indigo-300 tracking-widest transition-all">
                    LIHAT SEMUA
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10">
                  <Clock size={40} className="mx-auto mb-3 text-slate-700" />
                  <p className="font-bold text-slate-600">Belum ada riwayat sesi.</p>
                  <p className="text-sm text-slate-700 mt-1">Selesaikan modul latihan pertama dari Dashboard.</p>
                  <button onClick={() => navigate('/dashboard')} className="mt-5 px-6 py-3 rounded-2xl bg-indigo-500/10 text-indigo-400 font-black text-sm border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                    Ke Dashboard →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((act, i) => {
                    const mod = moduleMap[act.moduleId];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => navigate(`/training/${act.moduleId}`)}
                        className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                            <CheckCircle size={22} />
                          </div>
                          <div>
                            <p className="font-black text-white group-hover:text-indigo-400 transition-colors">
                              {act.moduleTitle || mod?.title || act.moduleId}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-slate-500">{act.level || mod?.level}</span>
                              <div className="h-1 w-1 rounded-full bg-slate-700" />
                              <span className="text-xs font-bold text-slate-500">
                                {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-xl font-black flex-shrink-0 ${act.score >= 80 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                          {act.score}%
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
