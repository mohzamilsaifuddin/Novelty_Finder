'use client';
import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Lightbulb, Loader2, AlertCircle, Zap, RefreshCw, ChevronRight, BookOpen, FlaskConical } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { clsx } from 'clsx';

const dimensionLabels = {
  topic: { label: 'Topik', color: '#3b82f6' },
  method: { label: 'Metode', color: '#10b981' },
  object: { label: 'Objek', color: '#8b5cf6' },
  location: { label: 'Lokasi', color: '#f59e0b' },
  variable: { label: 'Variabel', color: '#ec4899' },
  technology: { label: 'Teknologi', color: '#06b6d4' },
};

function formatBoldText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function ScoreRing({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Tinggi' : score >= 50 ? 'Sedang' : 'Rendah';
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900">{score}</span>
          <span className="text-xs font-semibold text-slate-400">/ 100</span>
        </div>
      </div>
      <span className={clsx(
        'text-xs font-bold px-3 py-1 rounded-full',
        score >= 70 ? 'bg-emerald-100 text-emerald-700' :
        score >= 50 ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      )}>
        Potensi Novelty: {label}
      </span>
    </div>
  );
}

export default function NoveltyPage() {
  const { activeProject } = useProject();
  const [latest, setLatest] = useState(null);
  const [details, setDetails] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      if (!activeProject) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data } = await api.get('/novelty', { params: { projectId: activeProject.id } });
        if (data.recommendations?.length > 0) {
          setLatest(data.recommendations[0]);
        }
      } catch {
        // no recommendations yet
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, [activeProject]);

  const handleAnalyze = async () => {
    if (!activeProject) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post('/novelty/analyze', { projectId: activeProject.id });
      setLatest(data.recommendation);
      setDetails(data.details);
      toast.success(`Analisis selesai! Skor Novelty: ${data.details.noveltyScore}%`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analisis gagal, pastikan paper sudah diisi analisisnya');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4"><Lightbulb size={32} /></div>
        <h3 className="text-lg font-bold text-slate-800">Proyek Riset Belum Dipilih</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mt-1 mb-6">Pilih proyek riset aktif di bar atas untuk menganalisis novelty.</p>
        <Link href="/dashboard" className="btn-md btn-primary">Buka Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="text-primary-600 animate-spin" />
      </div>
    );
  }

  // Prepare radar data from latest recommendation or details
  const score = details?.noveltyScore ?? latest?.noveltyScore ?? null;
  const dims = details?.dimensions;

  const radarData = dims
    ? Object.entries(dimensionLabels).map(([key, cfg]) => ({
        subject: cfg.label,
        score: dims[key]?.score ?? 0,
        fullMark: 100,
      }))
    : latest
    ? [
        { subject: 'Topik', score: 50, fullMark: 100 },
        { subject: 'Metode', score: 50, fullMark: 100 },
        { subject: 'Objek', score: 50, fullMark: 100 },
        { subject: 'Lokasi', score: 50, fullMark: 100 },
        { subject: 'Variabel', score: 50, fullMark: 100 },
        { subject: 'Teknologi', score: 50, fullMark: 100 },
      ]
    : null;

  return (
    <div className="page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="section-title">Analisis Novelty</h2>
          <p className="section-sub">
            Proyek: <span className="font-semibold text-slate-800">{activeProject.name}</span>
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-md btn-primary shadow-lg shadow-primary-500/20"
        >
          {analyzing ? (
            <><Loader2 size={16} className="animate-spin" /> Menganalisis...</>
          ) : (
            <><Zap size={16} /> {latest ? 'Re-Analisis Novelty' : 'Mulai Analisis Novelty'}</>
          )}
        </button>
      </div>

      {!latest && !details ? (
        <div className="card text-center py-20 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mb-4">
            <FlaskConical size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Belum ada analisis novelty</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
            Pastikan Anda sudah menambahkan jurnal dan mengisi analisis di Matriks Literatur, lalu klik tombol <strong>Mulai Analisis Novelty</strong>.
          </p>
          <div className="flex gap-3">
            <Link href="/search" className="btn-sm btn-secondary">Cari Jurnal</Link>
            <Link href="/matrix" className="btn-sm btn-secondary">Isi Matriks</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Ring */}
          <div className="card flex flex-col items-center justify-center py-8 gap-6">
            <h3 className="text-sm font-bold text-slate-700">Skor Novelty Keseluruhan</h3>
            {score !== null && <ScoreRing score={score} />}
            {(details?.analysisCoverage || latest) && (
              <div className="text-center text-xs text-slate-400 space-y-1">
                {details?.analysisCoverage && (
                  <p>Cakupan analisis: <span className="font-semibold text-slate-700">{details.analysisCoverage.percentage}%</span> ({details.analysisCoverage.analyzed}/{details.analysisCoverage.total} paper)</p>
                )}
                {latest && (
                  <p className="text-slate-300">
                    Dianalisis: {new Date(latest.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-700 mb-6">Radar Dimensi Novelty</h3>
            {radarData && (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar name="Skor Novelty" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val) => [`${val}/100`, 'Skor']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary */}
          {(latest?.analysisSummary || details?.summary) && (
            <div className="card lg:col-span-3 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary-800 mb-1">Ringkasan Analisis</h4>
                  <p className="text-xs text-primary-700 leading-relaxed whitespace-pre-wrap text-justify">
                    {formatBoldText(details?.summary || latest?.analysisSummary)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dimension Cards */}
          {(dims || latest) && Object.entries(dimensionLabels).map(([key, cfg]) => {
            const dim = dims?.[key];
            const savedGap = latest?.[`novelty${key.charAt(0).toUpperCase() + key.slice(1)}`];
            const gapText = dim?.gap || savedGap || 'Belum ada data';
            const dimScore = dim?.score;
            const suggestions = dim?.suggestions || [];

            return (
              <div key={key} className="card lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <h4 className="text-sm font-bold text-slate-800">{cfg.label}</h4>
                  </div>
                  {dimScore !== undefined && (
                    <span className={clsx(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      dimScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                      dimScore >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {dimScore}%
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-slate-600 leading-relaxed">{gapText}</p>
                </div>

                {suggestions.length > 0 && (
                  <ul className="space-y-1.5">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <ChevronRight size={12} className="text-primary-400 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
