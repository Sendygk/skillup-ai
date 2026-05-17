import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  Award, 
  TrendingUp, 
  PlayCircle, 
  CheckCircle2,
  Calendar,
  ChevronRight,
  Sparkles,
  BookOpen,
  Camera,
  Mic
} from 'lucide-react';
import { domainModel } from '../logic/domainModel';
import { recommendModules } from '../logic/recommendationEngine';
import Layout from '../components/Layout';

export default function Dashboard({ student }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rekomendasi'); // 'rekomendasi' | 'semua'

  const recommendations = useMemo(() => {
    return recommendModules(student.scores, domainModel);
  }, [student.scores]);

  const levelLabels = {
    "Beginner": "Pemula", "Intermediate": "Menengah", "Advanced": "Mahir",
    "Unassessed": "Belum Dinilai", "Pemula": "Pemula",
    "Menengah": "Menengah", "Mahir": "Mahir", "Belum Dinilai": "Belum Dinilai"
  };
  const statusValue = levelLabels[student.level] || student.level;

  const stats = [
    { label: 'Level Keahlian', value: statusValue, icon: <TrendingUp size={20} />, color: 'text-emerald-400', path: '/analytics' },
    { label: 'Modul Selesai', value: `${student.progress.length} / 7`, icon: <CheckCircle2 size={20} />, color: 'text-blue-400', path: null },
    { label: 'Sesi Latihan', value: `${(student.history || []).length} Sesi`, icon: <Calendar size={20} />, color: 'text-orange-400', path: null },
  ];

  const metricLabels = {
    confidence: "Kepercayaan Diri",
    articulation: "Artikulasi",
    speed: "Kecepatan",
    fillers: "Kata Pengisi"
  };

  // Determine if a module is accessible (no level gate — all modules can be tried)
  const getModuleStatus = (mod) => {
    if (student.progress.includes(mod.id)) return 'completed';
    return 'available';
  };

  const displayedModules = activeTab === 'rekomendasi' ? recommendations : domainModel;

  return (
    <Layout student={student} activePage="Dashboard">
      {/* Header */}
      <header className="flex justify-between items-center mb-16 animate-fade-in py-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-4">
            <Sparkles size={14} />
            <span>Pusat Belajar Personal</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
            Halo, <span className="accent-text">Rayyan!</span>
          </h1>
          <p className="text-slate-400 mt-5 text-xl max-w-lg font-medium">Keahlian public speaking apa yang ingin Anda kuasai hari ini?</p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => stat.path && navigate(stat.path)}
            className={`glass p-6 group transition-all duration-300 ${stat.path ? 'hover:translate-y-[-4px] cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Modules */}
        <div className="lg:col-span-8">
          {/* Tab switcher */}
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-black text-white flex items-center gap-3 mr-4">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                <Target size={24} />
              </div>
              Modul Latihan
            </h2>
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 gap-1 ml-auto">
              {[
                { key: 'rekomendasi', label: 'Rekomendasi', icon: <Sparkles size={13} /> },
                { key: 'semua', label: 'Semua Modul', icon: <BookOpen size={13} /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeTab === tab.key
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {displayedModules.map((rec, idx) => {
                const status = getModuleStatus(rec);
                const isBodyLanguage = rec.id === 'body_language';
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    onClick={() => navigate(`/training/${rec.id}`)}
                    className={`glass group cursor-pointer border transition-all duration-500 overflow-hidden relative ${
                      status === 'completed'
                        ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                        : 'border-white/5 hover:bg-white/5 hover:border-indigo-500/30'
                    }`}
                  >
                    {/* Left accent bar */}
                    {status !== 'completed' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {status === 'completed' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
                    )}

                    <div className="p-6 flex items-center gap-6">
                      <div className={`h-20 w-20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-500 border flex-shrink-0 ${
                        isBodyLanguage 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 text-indigo-400 border-white/5'
                      }`}>
                        {isBodyLanguage
                          ? <Camera size={32} />
                          : status === 'completed'
                            ? <CheckCircle2 size={36} />
                            : <Mic size={32} />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                            rec.level === 'Pemula' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            rec.level === 'Menengah' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {rec.level}
                          </span>
                          {isBodyLanguage && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              📷 AI Kamera
                            </span>
                          )}
                          {status === 'completed' && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ✓ Selesai
                            </span>
                          )}
                          {activeTab === 'rekomendasi' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              #{idx + 1} Rekomendasi
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl lg:text-2xl font-extrabold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
                          {rec.title}
                        </h3>
                        <p className="text-slate-500 line-clamp-1 text-sm lg:text-base">{rec.description}</p>
                      </div>

                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-indigo-500 group-hover:text-white transition-all text-slate-600 flex-shrink-0">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-4 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-6 text-white font-bold text-lg">
              <BarChart3 size={20} className="text-purple-400" />
              <h4>Metrik Keahlian</h4>
            </div>
            <div className="glass p-8 space-y-8">
              {Object.entries(student.scores).map(([key, val], i) => (
                <div key={key}>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-bold capitalize text-slate-400 uppercase tracking-widest">{metricLabels[key]}</span>
                    <span className="text-xl font-black text-white">{Math.round(val * 100)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${val * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + i * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        val > 0.7 ? 'from-emerald-600 to-emerald-400' : 
                        val > 0.4 ? 'from-indigo-600 to-indigo-400' : 
                        'from-pink-600 to-pink-400'
                      } shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]`}
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => navigate('/analytics')}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                Laporan Keahlian Lengkap
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 text-white font-bold text-lg">
              <Award size={20} className="text-yellow-400" />
              <h4>Lencana Terbuka</h4>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/achievements')}
                  className={`aspect-square rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                    i <= Math.max(1, student.progress.length)
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' 
                      : 'bg-white/5 border-white/5 text-slate-700'
                  }`}
                >
                  <Award size={24} strokeWidth={i > Math.max(1, student.progress.length) ? 1 : 2} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
