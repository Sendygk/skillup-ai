import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Mic2, LogOut, Trash2, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout';
import { createInitialStudentModel } from '../logic/studentModel';

export default function Settings({ student, setStudent }) {
  const [preferences, setPreferences] = useState({
    realtimeAnalysis: true,
    mentorTips: true,
    noisyMic: false,
    cloudSync: true,
    twoFactor: false,
  });

  const [resetConfirm, setResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, persist to localStorage/backend
    localStorage.setItem('skillup_preferences', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    localStorage.removeItem('skillup_student');
    localStorage.removeItem('skillup_preferences');
    if (setStudent) setStudent(createInitialStudentModel());
    window.location.href = import.meta.env.BASE_URL;
  };

  const handleSignOut = () => {
    localStorage.removeItem('skillup_student');
    window.location.href = import.meta.env.BASE_URL;
  };

  const prefSections = [
    {
      title: 'Preferensi Belajar',
      icon: <Mic2 size={22} />,
      items: [
        { key: 'realtimeAnalysis', label: 'Analisis Suara Real-time', desc: 'Aktifkan deteksi tempo dan ritme saat berbicara' },
        { key: 'mentorTips', label: 'Instruksi Mentor', desc: 'Tampilkan tips latihan spesifik setiap modul' },
        { key: 'noisyMic', label: 'Mode Mikrofon Berisik', desc: 'Optimalkan untuk lingkungan dengan kebisingan tinggi' },
      ]
    },
    {
      title: 'Keamanan & Data',
      icon: <Shield size={22} />,
      items: [
        { key: 'cloudSync', label: 'Sinkronisasi Cloud', desc: 'Simpan progres secara otomatis ke server' },
        { key: 'twoFactor', label: 'Otentikasi Dua Faktor', desc: 'Tambahkan lapisan keamanan ekstra untuk akun Anda' },
      ]
    },
  ];

  return (
    <Layout student={student} activePage="Pengaturan">
      <div className="max-w-3xl mx-auto py-4">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">
            <SettingsIcon size={14} />
            <span>Konfigurasi Aplikasi</span>
          </div>
          <h1 className="text-5xl font-black text-white">Sistem <span className="accent-text">Pengaturan</span></h1>
          <p className="text-slate-400 mt-3 text-lg font-medium">Kustomisasi pengalaman belajar SkillUp AI Anda.</p>
        </header>

        <div className="space-y-10">
          {prefSections.map((section, sIdx) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sIdx * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-5 text-white">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/10">
                  {section.icon}
                </div>
                <h3 className="text-xl font-black">{section.title}</h3>
              </div>
              
              <div className="glass overflow-hidden">
                {section.items.map((item, idx) => (
                  <div
                    key={item.key}
                    className={`p-7 flex items-center justify-between ${
                      idx !== section.items.length - 1 ? 'border-b border-white/5' : ''
                    } hover:bg-white/[0.02] transition-colors`}
                  >
                    <div className="pr-6">
                      <h4 className="text-base font-black text-white mb-1">{item.label}</h4>
                      <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(item.key)}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative flex-shrink-0 ${
                        preferences[item.key] ? 'bg-indigo-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ${
                        preferences[item.key] ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'btn-primary'
            }`}
          >
            {saved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}
          </button>

          {/* Account Actions */}
          <section className="space-y-4">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest px-1">Aksi Akun</p>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-7 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                  <LogOut size={22} />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black">Keluar</h4>
                  <p className="text-slate-500 text-sm font-medium">Keluar dari sesi ini — data tetap tersimpan</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleReset}
              className={`w-full flex items-center justify-between p-7 rounded-[28px] border transition-all group ${
                resetConfirm
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10 text-red-500/80'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                  {resetConfirm ? <RotateCcw size={22} /> : <Trash2 size={22} />}
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black">
                    {resetConfirm ? 'Klik sekali lagi untuk konfirmasi' : 'Hapus Data & Reset Akun'}
                  </h4>
                  <p className={`text-sm font-medium ${resetConfirm ? 'text-red-400/70' : 'text-red-500/40'}`}>
                    {resetConfirm ? 'Semua progres, skor, dan riwayat akan dihapus permanen!' : 'Tindakan ini tidak dapat dibatalkan'}
                  </p>
                </div>
              </div>
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
