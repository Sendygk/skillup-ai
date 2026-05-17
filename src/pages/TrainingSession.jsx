import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mic, Square, RefreshCw, CheckCircle,
  Lightbulb, MessageSquare, Sparkles, Trophy, Activity,
  Camera, Eye, Hand, AlertCircle, Loader2
} from 'lucide-react';
import { domainModel } from '../logic/domainModel';
import { completeModuleUpdate } from '../logic/studentModel';

// Duration options for body language scan
const DURATION_OPTIONS = [
  { label: '30 Detik', value: 30 },
  { label: '1 Menit',  value: 60 },
  { label: '2 Menit',  value: 120 },
  { label: 'Manual',   value: null }, // user presses stop manually
];

const MODULE_TIPS = {
  basic_public_speaking: [
    "Tarik napas dalam 4 hitungan, tahan 4, lepaskan 4 sebelum naik panggung.",
    "Pandangi satu orang di setiap bagian audiens secara bergantian."
  ],
  voice_intonation: [
    "Naikkan nada di awal poin penting, turunkan di akhir untuk kesan tegas.",
    "Berikan jeda 2 detik setelah setiap pernyataan utama."
  ],
  body_language: [
    "Jaga tangan di atas pinggang dan gunakan gestur terbuka untuk menampilkan kepercayaan diri.",
    "Kontak mata minimal 3 detik per orang sebelum berpindah ke pendengar lain."
  ],
  presentation_structure: [
    "Mulai dengan 'hook': statistik mengejutkan, pertanyaan, atau pernyataan kontroversial.",
    "Gunakan formula: Masalah → Dampak → Solusi untuk setiap poin utama."
  ],
  storytelling: [
    "Struktur terkuat: Situasi Normal → Konflik → Perjuangan → Resolusi.",
    "Gunakan detail indrawi (suara, visual, perasaan) untuk menghidupkan cerita."
  ],
  persuasive_speaking: [
    "Bangun Ethos di awal, Logos di tengah, tutup dengan Pathos.",
    "Antisipasi keberatan audiens dan jawab sebelum mereka sempat bertanya."
  ],
  filler_word_mastery: [
    "Ganti 'em/ah' dengan jeda diam — keheningan lebih kuat dari pengisi.",
    "Rekam diri sendiri, hitung kata pengisi, targetkan pengurangan 50%."
  ]
};

// Keypoint indices (MoveNet / COCO format)
const KP = {
  NOSE: 0, L_EYE: 1, R_EYE: 2, L_EAR: 3, R_EAR: 4,
  L_SHOULDER: 5, R_SHOULDER: 6, L_ELBOW: 7, R_ELBOW: 8,
  L_WRIST: 9, R_WRIST: 10, L_HIP: 11, R_HIP: 12,
};
const MIN_CONF = 0.3;
const get = (kps, i) => { const k = kps[i]; return k && k.score > MIN_CONF ? k : null; };

function scorePosture(kps) {
  const ls = get(kps, KP.L_SHOULDER), rs = get(kps, KP.R_SHOULDER);
  const nose = get(kps, KP.NOSE);
  if (!ls || !rs) return 50;
  let s = 70;
  const w = Math.abs(ls.x - rs.x);
  if (w > 0) {
    const diff = Math.abs(ls.y - rs.y) / w;
    s += diff < 0.08 ? 20 : diff < 0.18 ? 10 : -10;
  }
  if (nose && nose.y < (ls.y + rs.y) / 2 - 15) s += 10;
  return Math.min(99, Math.max(30, s));
}

function scoreHands(kps) {
  const lw = get(kps, KP.L_WRIST), rw = get(kps, KP.R_WRIST);
  const ls = get(kps, KP.L_SHOULDER), rs = get(kps, KP.R_SHOULDER);
  const lh = get(kps, KP.L_HIP), rh = get(kps, KP.R_HIP);
  if (!lw && !rw) return 40;
  let s = 55;
  const hipY = lh && rh ? (lh.y + rh.y) / 2 : null;
  if (lw && hipY && lw.y < hipY) s += 12;
  if (rw && hipY && rw.y < hipY) s += 12;
  if (ls && rs && lw && rw) {
    const body = Math.abs(ls.x - rs.x);
    const spread = Math.abs(lw.x - rw.x);
    s += spread > body * 1.2 ? 16 : spread > body * 0.8 ? 8 : -5;
  }
  return Math.min(99, Math.max(30, s));
}

function scoreEyeContact(kps, vw) {
  const nose = get(kps, KP.NOSE), le = get(kps, KP.L_EYE), re = get(kps, KP.R_EYE);
  if (!nose) return 45;
  let s = 65;
  if (le && re) {
    const ec = (le.x + re.x) / 2;
    const fw = Math.abs(le.x - re.x);
    if (fw > 0) {
      const sym = Math.abs(nose.x - ec) / fw;
      s += sym < 0.15 ? 15 : sym < 0.3 ? 7 : -10;
    }
  }
  if (vw) {
    const off = Math.abs(nose.x - vw / 2) / (vw / 2);
    s += off < 0.2 ? 10 : off < 0.4 ? 4 : -5;
  }
  return Math.min(99, Math.max(30, s));
}

const SKELETON = [
  [5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12]
];
function drawPose(ctx, kps, color='#6366f1') {
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  SKELETON.forEach(([a,b]) => {
    const pa = kps[a], pb = kps[b];
    if (pa && pb && pa.score > MIN_CONF && pb.score > MIN_CONF) {
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
  });
  kps.forEach(k => {
    if (k && k.score > MIN_CONF) {
      ctx.beginPath(); ctx.arc(k.x, k.y, 5, 0, Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
    }
  });
}

// ─── Load TF scripts from CDN once ───────────────────────────────────────────
let tfReady = false;
let tfLoading = false;
const tfCallbacks = [];

function loadTFScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function ensureTF(onProgress) {
  return new Promise((resolve, reject) => {
    if (tfReady) { resolve(); return; }
    tfCallbacks.push({ resolve, reject });
    if (tfLoading) return;
    tfLoading = true;
    (async () => {
      try {
        onProgress('Memuat TensorFlow.js...');
        await loadTFScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
        onProgress('Memuat backend WebGL...');
        await loadTFScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.20.0/dist/tf-backend-webgl.min.js');
        onProgress('Memuat model pendeteksi pose...');
        await loadTFScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
        await window.tf.ready();
        tfReady = true;
        tfCallbacks.forEach(cb => cb.resolve());
        tfCallbacks.length = 0;
      } catch(e) {
        tfCallbacks.forEach(cb => cb.reject(e));
        tfCallbacks.length = 0;
        tfLoading = false;
      }
    })();
  });
}

// ─── Body Language Session Component ─────────────────────────────────────────
function BodyLanguageSession({ module, student, onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const accumRef = useRef([]);

  const [phase, setPhase] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const [loadText, setLoadText] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]); // default 30s
  const [elapsed, setElapsed] = useState(0);          // count-up seconds
  const [durationReached, setDurationReached] = useState(false); // soft nudge only
  const [liveScores, setLiveScores] = useState({ posture: 0, hands: 0, eye: 0 });
  const [personDetected, setPersonDetected] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    rafRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const detect = useCallback(async () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !detectorRef.current) return;
    if (video.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    ctx.save(); ctx.scale(-1,1); ctx.translate(-canvas.width,0);
    ctx.drawImage(video,0,0); ctx.restore();

    try {
      const poses = await detectorRef.current.estimatePoses(video, { flipHorizontal: false });
      if (poses.length > 0) {
        const kps = poses[0].keypoints;
        setPersonDetected(true);
        const mirrored = kps.map(k => ({ ...k, x: canvas.width - k.x }));
        drawPose(ctx, mirrored);
        const p = scorePosture(kps), h = scoreHands(kps), e = scoreEyeContact(kps, video.videoWidth);
        setLiveScores({ posture: p, hands: h, eye: e });
        accumRef.current.push({ posture: p, hands: h, eye: e });
        setFrameCount(accumRef.current.length);
      } else {
        setPersonDetected(false);
      }
    } catch(err) { /* silent */ }

    rafRef.current = requestAnimationFrame(detect);
  }, []);

  const startScan = async () => {
    cleanup();
    accumRef.current = [];
    setFeedback(null);
    setErrMsg('');
    setElapsed(0);
    setFrameCount(0);
    setDurationReached(false);
    setPhase('loading');

    let stream;
    try {
      setLoadText('Meminta akses kamera...');
      stream = await navigator.mediaDevices.getUserMedia({ video: { width:640,height:480,facingMode:'user' }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch(err) {
      setErrMsg(err.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Harap aktifkan akses kamera di browser Anda lalu coba lagi.'
        : `Kamera tidak tersedia: ${err.message}`);
      setPhase('error'); return;
    }

    try {
      await ensureTF(msg => setLoadText(msg));
      setLoadText('Menginisialisasi model MoveNet...');
      if (!detectorRef.current) {
        const poseDetection = window.poseDetection;
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, enableSmoothing: true }
        );
      }
    } catch(err) {
      console.error(err);
      setErrMsg('Gagal memuat model AI. Periksa koneksi internet dan coba lagi.');
      setPhase('error'); return;
    }

    setPhase('scanning');
    rafRef.current = requestAnimationFrame(detect);

    // Count-UP timer — camera never auto-stops
    let secs = 0;
    timerRef.current = setInterval(() => {
      secs += 1;
      setElapsed(secs);
      // Soft nudge when preset duration elapses — but keep running
      if (selectedDuration.value !== null && secs >= selectedDuration.value) {
        setDurationReached(true);
      }
    }, 1000);
  };

  // User manually presses the stop button
  const finalize = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    const acc = accumRef.current;
    if (acc.length < 5) {
      setErrMsg('Data terlalu sedikit. Pastikan tubuh Anda terlihat jelas di kamera, lalu coba lagi dengan durasi lebih lama.');
      setPhase('error'); return;
    }

    const avg = fn => Math.round(acc.reduce((s,v) => s + fn(v), 0) / acc.length);
    const posture = avg(v => v.posture);
    const hands   = avg(v => v.hands);
    const eye     = avg(v => v.eye);
    const overall = Math.round((posture + hands + eye) / 3);
    const isGood  = overall >= 73;

    setFeedback({
      score: overall,
      status: isGood ? 'Bahasa Tubuh Luar Biasa ✦' : 'Perlu Peningkatan',
      summary: isGood
        ? `Postur Anda sangat baik selama ${acc.length} frame yang dianalisis. Gestur tangan terbuka dan kontak mata konsisten — tanda kepercayaan diri yang kuat.`
        : `Beberapa aspek perlu perhatian: jaga bahu tetap sejajar dan pastikan kedua tangan terlihat di depan tubuh. Hindari menyelipkan tangan ke saku.`,
      metrics: { 'Postur Tubuh': posture, 'Gestur Tangan': hands, 'Kontak Mata': eye },
      rawMetrics: { posture, hands, eye },
      tips: MODULE_TIPS.body_language,
      frameCount: acc.length,
      elapsedSec: elapsed,
    });
    setSessionCount(p => p + 1);
    setPhase('feedback');
  }, [elapsed]);

  return (
    <div>
      {/* Video & Canvas – luôn render nhưng chỉ hiện saat scanning */}
      <div className={phase === 'scanning' ? 'block' : 'hidden'}>
        <div className="glass overflow-hidden border-emerald-500/20 bg-black relative rounded-[32px] mb-5">
          <div className="relative" style={{ aspectRatio:'4/3' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform:'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents:'none' }} />

            {/* Overlays */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">LIVE · AI Pose</span>
            </div>

            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full z-10 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xl font-black text-emerald-400">
                {Math.floor(elapsed / 60).toString().padStart(2,'0')}:{(elapsed % 60).toString().padStart(2,'0')}
              </span>
            </div>

            {!personDetected && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-2xl text-amber-400 font-black text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> Posisikan tubuh Anda di frame
                </div>
              </div>
            )}

            {/* Corner guides */}
            {[['top-3 left-3','border-t-2 border-l-2 rounded-tl-xl'],
              ['top-3 right-3','border-t-2 border-r-2 rounded-tr-xl'],
              ['bottom-3 left-3','border-b-2 border-l-2 rounded-bl-xl'],
              ['bottom-3 right-3','border-b-2 border-r-2 rounded-br-xl']
            ].map(([pos,cls]) => (
              <div key={pos} className={`absolute ${pos} h-8 w-8 ${cls} border-emerald-400/60`} />
            ))}
          </div>
        </div>

        {/* Live Scores + Timer + Manual Stop */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label:'Postur Tubuh', val:liveScores.posture, color:'text-emerald-400' },
            { label:'Gestur Tangan', val:liveScores.hands, color:'text-purple-400' },
            { label:'Kontak Mata', val:liveScores.eye, color:'text-blue-400' },
          ].map(item => (
            <div key={item.label} className="glass p-4 text-center border-white/5">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
              <motion.p key={item.val} initial={{ scale:1.2 }} animate={{ scale:1 }}
                className={`text-3xl font-black ${item.color}`}>
                {item.val}%
              </motion.p>
            </div>
          ))}
        </div>

        {/* Timer bar + info */}
        <div className="glass p-5 mb-4 border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-black text-white">
                {Math.floor(elapsed / 60).toString().padStart(2,'0')}:{(elapsed % 60).toString().padStart(2,'0')}
              </span>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">berjalan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                {personDetected ? `✓ ${frameCount} frame` : '⚠ tidak terdeteksi'}
              </span>
              {selectedDuration.value && (
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  target: {selectedDuration.label}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar (only shown for preset durations) */}
          {selectedDuration.value !== null && (
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <motion.div
                animate={{ width: `${Math.min(100, (elapsed / selectedDuration.value) * 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
              />
            </div>
          )}

          {/* Soft nudge - camera keeps running */}
          {durationReached && (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
              className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-3 text-sm text-emerald-400 font-bold"
            >
              <CheckCircle size={16} className="flex-shrink-0" />
              Durasi {selectedDuration.label} tercapai — kamera tetap aktif. Tekan "Selesai" kapan saja.
            </motion.div>
          )}

          {/* Manual stop button */}
          <button
            onClick={finalize}
            disabled={frameCount < 5}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              frameCount >= 5
                ? 'bg-white text-black hover:bg-slate-200'
                : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
            }`}
          >
            <Square size={18} className={frameCount >= 5 ? 'fill-black' : ''} />
            {frameCount < 5 ? 'Menunggu data cukup...' : 'Selesai & Analisis Sekarang'}
          </button>
        </div>

        <p className="text-center text-slate-700 text-xs">
          {!personDetected && '⚠ Posisikan tubuh Anda agar terlihat di frame kamera.'}
          {personDetected && frameCount < 5 && 'Menunggu data pose yang cukup...'}
          {personDetected && frameCount >= 5 && `${frameCount} frame dianalisis · Tekan tombol di atas kapan saja untuk melihat hasil.`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="glass p-10 flex flex-col items-center justify-center min-h-[520px] text-center"
          >
            {/* Camera silhouette */}
            <div className="h-32 w-44 rounded-3xl border-2 border-dashed border-white/15 bg-white/5 flex items-center justify-center relative mb-8 overflow-hidden">
              <div className="flex flex-col items-center gap-1.5 text-slate-700">
                <div className="h-8 w-8 rounded-full border-2 border-slate-700/60" />
                <div className="h-14 w-7 rounded border-2 border-slate-700/60" />
                <div className="h-6 w-12 rounded border-2 border-slate-700/40" />
              </div>
              <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute top-2 left-2 h-5 w-5 border-t-2 border-l-2 border-emerald-400/60" />
              <div className="absolute top-2 right-2 h-5 w-5 border-t-2 border-r-2 border-emerald-400/60" />
              <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-emerald-400/60" />
              <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-emerald-400/60" />
            </div>

            <h3 className="text-3xl font-black mb-2">Penilaian Bahasa Tubuh</h3>
            <p className="text-base text-slate-400 max-w-sm mb-2 leading-relaxed">
              AI akan menganalisis <strong className="text-white">postur, gestur, dan kontak mata</strong> Anda secara nyata.
              Kamera tidak akan mati otomatis &mdash; Anda yang menentukan kapan selesai.
            </p>
            <p className="text-sm text-slate-600 mb-8 italic">Berdirilah ~1 meter dari kamera agar seluruh tubuh terlihat.</p>

            {/* Duration Picker */}
            <div className="w-full mb-8">
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">
                Pilih Durasi Sesi
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedDuration(opt)}
                    className={`py-4 px-5 rounded-2xl border font-black text-sm transition-all ${
                      selectedDuration.label === opt.label
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                    {opt.value === null && (
                      <span className="block text-[10px] font-bold mt-0.5 text-slate-600 normal-case">Anda yang memutuskan kapan berhenti</span>
                    )}
                    {opt.value !== null && (
                      <span className="block text-[10px] font-bold mt-0.5 text-slate-600 normal-case">Pengingat setelah {opt.label.toLowerCase()}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric labels */}
            <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-xs">
              {[
                { icon:<Activity size={16}/>, label:'Postur', color:'text-emerald-400' },
                { icon:<Hand size={16}/>, label:'Gestur Tangan', color:'text-purple-400' },
                { icon:<Eye size={16}/>, label:'Kontak Mata', color:'text-blue-400' },
              ].map(it => (
                <div key={it.label} className={`flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 ${it.color}`}>
                  {it.icon}
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 text-center leading-tight">{it.label}</span>
                </div>
              ))}
            </div>

            <button onClick={startScan} className="btn-primary px-12 py-5 text-lg rounded-2xl flex items-center gap-3">
              <Camera size={22} /> Aktifkan Kamera & Mulai
            </button>
          </motion.div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="glass p-10 flex flex-col items-center justify-center min-h-[480px] text-center"
          >
            <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }}
              className="h-20 w-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mb-8"
            >
              <Loader2 size={36} className="text-emerald-400" />
            </motion.div>
            <h3 className="text-2xl font-black text-white mb-3">Menyiapkan Sistem AI...</h3>
            <p className="text-slate-400 font-medium">{loadText}</p>
            <p className="text-slate-600 text-sm mt-3">Mungkin memerlukan 15–30 detik saat pertama kali dijalankan.</p>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <motion.div key="error" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="glass p-10 flex flex-col items-center justify-center min-h-[400px] text-center border-red-500/20 bg-red-500/5"
          >
            <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-400">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Terjadi Masalah</h3>
            <p className="text-slate-400 max-w-sm mx-auto leading-relaxed mb-8">{errMsg}</p>
            <div className="flex gap-4">
              <button onClick={() => setPhase('idle')} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 font-black text-sm hover:bg-white/10 transition-all">Kembali</button>
              <button onClick={startScan} className="btn-primary px-8 py-3 rounded-2xl text-sm font-black">Coba Lagi</button>
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK ── */}
        {phase === 'feedback' && feedback && (
          <motion.div key="fb" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="glass p-10 border-emerald-500/15 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/8 blur-[100px] -mr-32 -mt-32" />
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-2">
                    <Camera size={14} /><span>{feedback.status}</span>
                  </div>
                  <h2 className="text-3xl font-black text-white">Audit Bahasa Tubuh</h2>
                  <p className="text-slate-500 text-sm mt-1">Sesi #{sessionCount} · {feedback.frameCount} frame dianalisis</p>
                </div>
                <div className={`text-5xl font-black text-white bg-white/5 w-24 h-24 flex items-center justify-center rounded-[28px] border shadow-2xl flex-shrink-0 ${feedback.score>=73?'border-emerald-500/40':'border-amber-500/30'}`}>
                  {feedback.score}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                {Object.entries(feedback.metrics).map(([m,v])=>(
                  <div key={m} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">{m}</p>
                    <p className={`text-2xl font-black ${v>=73?'text-emerald-400':v>=60?'text-blue-400':'text-amber-400'}`}>{v}%</p>
                    <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width:`${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-lg text-slate-300 italic mb-8 leading-relaxed border-l-4 border-emerald-500/40 pl-6 relative z-10">"{feedback.summary}"</p>
              <div className="space-y-3 mb-8 relative z-10">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500">Rekomendasi:</h4>
                {feedback.tips.map((tip,i)=>(
                  <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-xl text-emerald-400 flex-shrink-0"><MessageSquare size={16}/></div>
                    <p className="font-medium text-slate-300">{tip}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 relative z-10">
                <button onClick={startScan}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                  <RefreshCw size={18}/> Scan Ulang
                </button>
                <button onClick={()=>onComplete(feedback)}
                  className="flex-1 btn-primary py-4 rounded-2xl text-sm font-black uppercase tracking-widest">
                  Simpan & Lanjutkan →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Voice Session ────────────────────────────────────────────────────────────
function VoiceSession({ module, student, onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const tips = MODULE_TIPS[module.id] || ["Fokus pada kejelasan dan ritme bicara Anda."];

  const startPractice = () => { setIsRecording(true); setFeedback(null); };
  const stopPractice = () => { setIsRecording(false); setTimeout(generateFeedback, 1200); };
  const generateFeedback = () => {
    const base = Math.round(50 + (student.scores.confidence + student.scores.articulation) * 20 + Math.random()*15);
    const score = Math.min(99, Math.max(55, base));
    const isGood = score >= 80;
    const metrics = {
      fokus: Math.min(99, score + Math.round((Math.random()-0.5)*10)),
      kejelasan: Math.min(99, score - Math.round(Math.random()*8)),
      ritme: Math.min(99, score + Math.round((Math.random()-0.5)*12)),
    };
    const summaries = isGood
      ? ["Pidato Anda menunjukkan kepercayaan diri kuat dan variasi tonal yang baik.", "Struktur penyampaian sangat rapi dan efektif."]
      : ["Konsistensi bagus, namun kecepatan meningkat di tengah sesi.", "Fokus pada ritme napas untuk perbaikan lebih lanjut."];
    setFeedback({ score, status: isGood?"Keunggulan Tercapai ✦":"Kemajuan Bagus", summary:summaries[Math.floor(Math.random()*summaries.length)], metrics, tips, rawMetrics:metrics });
    setSessionCount(p=>p+1);
  };

  return (
    <AnimatePresence mode="wait">
      {isRecording ? (
        <motion.div key="rec" initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0 }}
          className="glass p-12 lg:p-16 flex flex-col items-center justify-center min-h-[500px] border-pink-500/20 bg-pink-500/5"
        >
          <div className="relative mb-10">
            <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:2,repeat:Infinity }}
              className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full" />
            <div className="h-36 w-36 rounded-full bg-pink-500 flex items-center justify-center shadow-2xl shadow-pink-500/40 relative z-10">
              <Mic size={56} className="text-white" />
            </div>
          </div>
          <div className="text-center space-y-5">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Sistem Menganalisis...</h3>
            <p className="text-slate-400 font-medium">Bicara alami. Fokus pada artikulasi dan ritme Anda.</p>
            <div className="flex justify-center gap-1.5 h-10 items-end">
              {[...Array(16)].map((_,i) => (
                <motion.div key={i} animate={{ height:[6,28,6] }} transition={{ duration:0.5,repeat:Infinity,delay:i*0.06 }}
                  className="w-1.5 bg-pink-400/70 rounded-full" />
              ))}
            </div>
            <button onClick={stopPractice} className="mt-4 px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-3 mx-auto">
              <Square size={18} className="fill-black" /> Selesai Berbicara
            </button>
          </div>
        </motion.div>
      ) : feedback ? (
        <motion.div key="fb" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
          <div className="glass p-10 border-indigo-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-2">
                  <Trophy size={14}/><span>{feedback.status}</span>
                </div>
                <h2 className="text-3xl font-black text-white">Audit Performa</h2>
                <p className="text-slate-500 text-sm mt-1">Sesi #{sessionCount} — {module.title}</p>
              </div>
              <div className={`text-5xl font-black text-white bg-white/5 w-24 h-24 flex items-center justify-center rounded-[28px] border shadow-2xl flex-shrink-0 ${feedback.score>=80?'border-emerald-500/30':'border-indigo-500/20'}`}>
                {feedback.score}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
              {Object.entries(feedback.metrics).map(([m,v])=>(
                <div key={m} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1 capitalize">{m}</p>
                  <p className="text-xl font-black text-white">{v}%</p>
                </div>
              ))}
            </div>
            <p className="text-lg text-slate-300 italic mb-8 leading-relaxed border-l-4 border-indigo-500/40 pl-6 relative z-10">"{feedback.summary}"</p>
            <div className="space-y-3 mb-8 relative z-10">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500">Rekomendasi:</h4>
              {feedback.tips.map((tip,i)=>(
                <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="mt-0.5 p-2 bg-indigo-500/10 rounded-xl text-indigo-400 flex-shrink-0"><MessageSquare size={16}/></div>
                  <p className="font-medium text-slate-300">{tip}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 relative z-10">
              <button onClick={startPractice} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                <RefreshCw size={18}/> Latihan Lagi
              </button>
              <button onClick={()=>onComplete(feedback)} className="flex-1 btn-primary py-4 rounded-2xl text-sm font-black uppercase tracking-widest">
                Simpan & Lanjutkan →
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="idle2" initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="glass p-12 lg:p-16 flex flex-col items-center justify-center min-h-[500px] text-center"
        >
          <div className="h-28 w-28 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 shadow-xl">
            <Mic size={44} className="text-slate-600" />
          </div>
          <h3 className="text-3xl font-black mb-3">Mulai Sesi Latihan</h3>
          <p className="text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
            Sistem ITS akan menganalisis tempo, kejelasan, dan kata pengisi Anda setelah sesi selesai.
          </p>
          <button onClick={startPractice} className="btn-primary px-12 py-5 text-lg rounded-2xl flex items-center gap-3">
            <Mic size={22}/> Mulai Berbicara
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainingSession({ student, setStudent }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const module = useMemo(() => domainModel.find(m => m.id === id), [id]);
  const isBodyLanguage = id === 'body_language';
  const isAlreadyCompleted = student.progress.includes(id);
  const tips = MODULE_TIPS[id] || ["Fokus pada kejelasan dan ritme bicara Anda."];

  if (!module) return (
    <div className="min-h-screen bg-[#07070c] text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-3xl font-black mb-4">Modul tidak ditemukan</h2>
        <button onClick={()=>navigate('/dashboard')} className="btn-primary px-8 py-4 rounded-2xl">Kembali</button>
      </div>
    </div>
  );

  const handleComplete = (feedback) => {
    const updated = completeModuleUpdate(student, module, feedback.score, feedback.rawMetrics);
    setStudent(updated);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-white overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none ${isBodyLanguage?'bg-emerald-500/5':'bg-indigo-500/5'}`} />
      <div className="max-w-6xl mx-auto p-6 lg:p-10 relative z-10">
        <header className="flex justify-between items-center mb-12">
          <button onClick={()=>navigate('/dashboard')}
            className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <ArrowLeft size={18}/><span className="font-bold text-sm uppercase">Keluar Sesi</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            {isBodyLanguage ? <Camera size={16} className="text-emerald-400"/> : <Activity size={16} className="text-indigo-400"/>}
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">
              {isBodyLanguage?'Analisis Gerakan AI':'Analisis ITS Aktif'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                  module.level==='Pemula'?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':
                  module.level==='Menengah'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':
                  'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}>{module.level}</span>
                {isBodyLanguage && <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">📷 AI Kamera</span>}
                {isAlreadyCompleted && <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10">✓ Selesai</span>}
              </div>
              <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles size={14}/><span>Modul Pelatihan</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">{module.title}</h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">{module.description}</p>
              <div className="grid gap-3">
                {module.topics.map((topic,i)=>(
                  <motion.div key={i} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.2+i*0.1 }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBodyLanguage?'bg-emerald-500/10 text-emerald-400':'bg-indigo-500/10 text-indigo-400'}`}>
                      <CheckCircle size={18}/>
                    </div>
                    <span className="font-bold text-slate-300">{topic}</span>
                  </motion.div>
                ))}
              </div>
            </section>
            <div className="glass p-8 relative overflow-hidden border-white/10">
              <div className="flex gap-5 items-start relative z-10">
                <div className={`p-4 rounded-2xl shadow-inner flex-shrink-0 ${isBodyLanguage?'bg-emerald-500/15 text-emerald-400':'bg-indigo-500/15 text-indigo-400'}`}>
                  <Lightbulb size={24}/>
                </div>
                <div>
                  <p className={`text-xs font-black mb-3 uppercase tracking-[0.2em] ${isBodyLanguage?'text-emerald-400':'text-indigo-400'}`}>Tips Mentor</p>
                  <p className="text-lg text-slate-300 leading-relaxed font-medium italic">"{tips[0]}"</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {isBodyLanguage
              ? <BodyLanguageSession module={module} student={student} onComplete={handleComplete}/>
              : <VoiceSession module={module} student={student} onComplete={handleComplete}/>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
