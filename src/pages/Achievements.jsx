import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Star, Shield, Trophy, Flame, Target, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';

// Badge definitions — each has an unlock condition checked against student state
const BADGE_DEFINITIONS = [
  {
    id: 'first_diagnostic',
    title: 'Pembicara Berani',
    desc: 'Selesaikan tes diagnostik pertama',
    icon: <Zap />, color: 'from-amber-400 to-orange-500',
    check: (student) => student.level !== 'Belum Dinilai',
  },
  {
    id: 'first_module',
    title: 'Langkah Pertama',
    desc: 'Selesaikan satu modul latihan',
    icon: <Star />, color: 'from-blue-400 to-indigo-500',
    check: (student) => student.progress.length >= 1,
  },
  {
    id: 'three_modules',
    title: 'Konsisten',
    desc: 'Selesaikan 3 modul latihan',
    icon: <Shield />, color: 'from-emerald-400 to-teal-500',
    check: (student) => student.progress.length >= 3,
  },
  {
    id: 'high_confidence',
    title: 'Percaya Diri',
    desc: 'Raih kepercayaan diri ≥ 70%',
    icon: <Trophy />, color: 'from-yellow-400 to-amber-500',
    check: (student) => student.scores.confidence >= 0.7,
  },
  {
    id: 'high_articulation',
    title: 'Master Artikulasi',
    desc: 'Raih skor artikulasi ≥ 80%',
    icon: <Sparkles />, color: 'from-purple-400 to-pink-500',
    check: (student) => student.scores.articulation >= 0.8,
  },
  {
    id: 'low_fillers',
    title: 'Ritme Sempurna',
    desc: 'Kurangi kata pengisi ≤ 20%',
    icon: <Flame />, color: 'from-rose-400 to-red-500',
    check: (student) => student.scores.fillers <= 0.2,
  },
  {
    id: 'intermediate_level',
    title: 'Naik Kelas',
    desc: 'Capai level Menengah',
    icon: <Target />, color: 'from-indigo-400 to-blue-600',
    check: (student) => student.level === 'Menengah' || student.level === 'Mahir',
  },
  {
    id: 'advanced_level',
    title: 'Elite Speaker',
    desc: 'Capai level Mahir',
    icon: <Award />, color: 'from-amber-300 to-yellow-500',
    check: (student) => student.level === 'Mahir',
  },
];

export default function Achievements({ student }) {
  const badges = useMemo(() =>
    BADGE_DEFINITIONS.map(b => ({ ...b, unlocked: b.check(student) })),
    [student]
  );

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Layout student={student} activePage="Pencapaian">
      <div className="max-w-6xl mx-auto py-4">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">
            <Trophy size={14} />
            <span>Koleksi Lencana Anda</span>
          </div>
          <h1 className="text-5xl font-black text-white">Ruang <span className="accent-text">Pencapaian</span></h1>
          <p className="text-slate-400 mt-3 text-lg font-medium">
            {unlockedCount} dari {badges.length} lencana terbuka — terus berlatih!
          </p>
        </header>

        {/* Progress Bar */}
        <div className="glass p-6 mb-10 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-slate-400">Progres Lencana</span>
              <span className="text-sm font-black text-white">{unlockedCount}/{badges.length}</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / badges.length) * 100}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
              />
            </div>
          </div>
          <div className="text-3xl font-black text-yellow-400">
            {Math.round((unlockedCount / badges.length) * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {badges.map((badge, i) => (
            <motion.div 
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className={`glass p-7 relative overflow-hidden transition-all duration-500 group ${
                badge.unlocked ? 'border-white/20' : 'opacity-50 grayscale'
              }`}
            >
              {badge.unlocked && (
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${badge.color} blur-[80px] opacity-15 group-hover:opacity-30 transition-opacity`} />
              )}
              
              <div className="flex flex-col items-center text-center">
                <div className={`h-20 w-20 rounded-3xl flex items-center justify-center mb-5 relative z-10 transition-transform group-hover:scale-110 duration-300 ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color} text-white shadow-xl` 
                    : 'bg-white/5 text-slate-700'
                }`}>
                  {React.cloneElement(badge.icon, { size: 34 })}
                </div>
                
                <h3 className={`text-lg font-black mb-1.5 ${badge.unlocked ? 'text-white' : 'text-slate-600'}`}>
                  {badge.title}
                </h3>
                <p className={`text-xs font-medium leading-relaxed ${badge.unlocked ? 'text-slate-400' : 'text-slate-700'}`}>
                  {badge.desc}
                </p>
                
                {!badge.unlocked && (
                  <div className="mt-4 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Terkunci
                  </div>
                )}
                {badge.unlocked && (
                  <div className="mt-4 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    ✓ Terbuka
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special Challenge */}
        <section className="glass p-10 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-[0.04]">
            <Sparkles size={200} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">
              <Flame size={14} />
              <span>Tantangan Spesial</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">The Flawless Speaker</h2>
            <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed font-medium">
              Selesaikan <strong className="text-white">semua 7 modul</strong> dan raih skor rata-rata di atas 85% untuk mendapatkan gelar tertinggi SkillUp AI.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-sm font-bold text-slate-500">
                Progress: <span className="text-white font-black">{student.progress.length}/7 modul</span>
              </div>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden max-w-xs">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(student.progress.length / 7) * 100}%` }}
                  transition={{ duration: 1.2 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
