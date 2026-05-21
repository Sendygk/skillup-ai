import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Award, 
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  Zap,
  Sparkles
} from 'lucide-react';

export default function Layout({ children, student, activePage }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('skillup_student');
    // Menggunakan BASE_URL agar tidak error 404 saat di-hosting di GitHub Pages (subdirectory)
    window.location.href = import.meta.env.BASE_URL;
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Analitik', icon: <BarChart3 size={20} />, path: '/analytics' },
    { name: 'Pencapaian', icon: <Award size={20} />, path: '/achievements' },
    { name: 'Pengaturan', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#07070c] text-slate-200">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/10 bg-[#0a0a14]/60 backdrop-blur-3xl p-8 hidden lg:flex flex-col sticky top-0 h-screen z-50">
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="text-white fill-white" size={28} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">SkillUp AI</span>
        </div>

        <nav className="flex-1 space-y-2">
          {sidebarLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => link.path && navigate(link.path)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activePage === link.name
                  ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 shadow-[0_0_20px_-10px_rgba(99,102,241,0.5)]' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className={`transition-transform duration-300 group-hover:scale-110 ${activePage === link.name ? 'text-indigo-400' : ''}`}>
                {link.icon}
              </div>
              <span className="text-[15px]">{link.name}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activePage === 'Profil' ? 'text-white bg-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={20} />
            <span>Profil</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-pink-500/80 hover:text-pink-400 hover:bg-pink-500/5 transition-all"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        {/* Global User Widget */}
        <div className="fixed top-8 right-8 z-[100] hidden lg:block">
           <div 
             onClick={() => navigate('/profile')}
             className="flex items-center gap-4 bg-white/5 p-3 pr-5 rounded-[24px] border border-white/10 backdrop-blur-2xl shadow-xl cursor-pointer hover:bg-white/10 transition-all border-indigo-500/20"
           >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-1 border border-white/10">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rayyan" 
                  alt="Avatar Rayyan" 
                  className="h-full w-full rounded-lg bg-indigo-900/40"
                />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">Rayyan</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{student?.level || 'Pengguna'}</p>
              </div>
           </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
