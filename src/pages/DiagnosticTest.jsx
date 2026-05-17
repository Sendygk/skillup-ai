import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Mic, Volume2, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { updateStudentScores } from '../logic/studentModel';

const questions = [
  {
    id: 'confidence',
    icon: <Sparkles className="text-yellow-400" />,
    title: "Kehadiran Panggung",
    text: "Pikirkan tentang presentasi terakhir Anda. Seberapa besar 'demam panggung' yang Anda alami?",
    options: [
      { label: "Kecemasan Ekstrim", sub: "Saya menghindari berbicara jika memungkinkan", score: 0.2 },
      { label: "Sangat Gugup", sub: "Telapak tangan berkeringat, suara bergetar", score: 0.4 },
      { label: "Cukup Percaya Diri", sub: "Saya merasa baik-baik saja setelah memulai", score: 0.7 },
      { label: "Sangat Nyaman", sub: "Saya suka menjadi pusat perhatian", score: 1.0 }
    ]
  },
  {
    id: 'articulation',
    icon: <Volume2 className="text-blue-400" />,
    title: "Kejelasan Vokal",
    text: "Dapatkah orang memahami setiap kata yang Anda ucapkan dengan jelas, bahkan dari kejauhan?",
    options: [
      { label: "Gumam / Lembut", sub: "Sering diminta bicara lebih keras", score: 0.2 },
      { label: "Tidak Konsisten", sub: "Beberapa kata tidak terdengar jelas", score: 0.5 },
      { label: "Umumnya Jelas", sub: "Sebagian besar dapat dimengerti", score: 0.8 },
      { label: "Artikulasi Sempurna", sub: "Ahli dalam diksi", score: 1.0 }
    ]
  },
  {
    id: 'fillers',
    icon: <Zap className="text-purple-400" />,
    title: "Kata Pengisi (Filler)",
    text: "Seberapa banyak 'sampah kata' dalam ucapan Anda? (em, ee, anu, kayaknya)",
    options: [
      { label: "Banyak Kata Pengisi", sub: "Mengganggu pendengar", score: 0.2 },
      { label: "Penggunaan Teratur", sub: "Terjadi setiap beberapa kalimat", score: 0.5 },
      { label: "Minimal", sub: "Hanya sesekali terdengar", score: 0.8 },
      { label: "Tanpa Kata Pengisi", sub: "Ucapan yang sangat bersih", score: 1.0 }
    ]
  },
  {
    id: 'speed',
    icon: <Mic className="text-emerald-400" />,
    title: "Kecepatan Berbicara",
    text: "Bagaimana Anda mendeskripsikan kecepatan bicara Anda dalam situasi tekanan tinggi?",
    options: [
      { label: "Sangat Cepat / Terburu-buru", sub: "Seperti kereta tanpa rem", score: 0.3 },
      { label: "Agak Cepat", sub: "Perlu mengingatkan diri untuk melambat", score: 0.6 },
      { label: "Seimbang & Stabil", sub: "Alami dan terkontrol", score: 1.0 },
      { label: "Lambat / Bertele-tele", sub: "Butuh waktu lama untuk sampai ke poin utama", score: 0.5 }
    ]
  }
];

export default function DiagnosticTest({ student, setStudent }) {
  const [step, setStep] = useState(-1); // -1 is the intro splash
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const handleSelect = (score) => {
    const q = questions[step];
    const updatedAnswers = { ...answers, [q.id]: score };
    setAnswers(updatedAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      finishTest(updatedAnswers);
    }
  };

  const finishTest = (finalAnswers) => {
    const newStudent = updateStudentScores(student, finalAnswers);
    setStudent(newStudent);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07070c] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />
      
      <div className="max-w-xl w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === -1 ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center"
            >
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(99,102,241,0.5)] mx-auto mb-10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Zap className="text-white fill-white relative z-10" size={48} />
              </div>
              <h1 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-[1.05]">
                Analisis <span className="accent-text">Skor Vokal</span> Anda
              </h1>
              <p className="text-slate-400 text-xl mb-12 leading-relaxed max-w-lg mx-auto font-medium">
                SkillUp AI memetakan pola bicara unik Anda untuk membuat jalur pelatihan berbasis data.
              </p>
              <button 
                onClick={() => setStep(0)}
                className="btn-primary w-full py-6 text-xl rounded-[24px]"
              >
                Mulai Penilaian <ArrowRight size={24} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setStep(step - 1)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-6 bg-indigo-500' : 'w-2 bg-white/10'}`} 
                    />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Langkah {step + 1} / {questions.length}
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    {questions[step].icon}
                  </div>
                  <h2 className="text-3xl font-black text-white">{questions[step].title}</h2>
                </div>
                <p className="text-lg text-slate-400 leading-relaxed">{questions[step].text}</p>
              </div>

              <div className="grid gap-5">
                {questions[step].options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(opt.score)}
                    className="w-full text-left p-6 lg:p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group flex justify-between items-center shadow-lg"
                  >
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-1">{opt.label}</h4>
                      <p className="text-slate-500 group-hover:text-slate-400 font-medium">{opt.sub}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all shadow-inner">
                      <CheckCircle2 size={20} className="text-transparent group-hover:text-white" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
