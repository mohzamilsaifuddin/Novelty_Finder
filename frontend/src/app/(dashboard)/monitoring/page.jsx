'use client';
import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, AlertCircle, Award, Database, FileText, BarChart3, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export default function MonitoringPage() {
  const { activeProject } = useProject();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!activeProject) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/projects/${activeProject.id}/stats`);
        setStats(data);
      } catch (err) {
        toast.error('Gagal memuat statistik proyek');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 animate-bounce">
          <TrendingUp size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Proyek Riset Belum Dipilih</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mt-1 mb-6">
          Anda perlu memilih proyek riset aktif terlebih dahulu di bar atas, atau membuat proyek baru untuk melihat monitoring topik.
        </p>
        <Link href="/dashboard" className="btn-md btn-primary">
          Buka Dashboard Proyek
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Memuat statistik dan visualisasi data...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="section-title">Monitoring Tren Topik</h2>
          <p className="section-sub">Analisis statistik dan tren data jurnal ilmiah</p>
        </div>
        
        <div className="card text-center py-20 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Belum ada data jurnal</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
            Proyek ini belum memiliki jurnal ilmiah yang disimpan. Buka menu Cari Jurnal untuk melakukan crawling terlebih dahulu.
          </p>
          <Link href="/search" className="btn-md btn-primary">
            Cari Jurnal Sekarang
          </Link>
        </div>
      </div>
    );
  }

  // Format Recharts data
  const yearData = Object.entries(stats.yearDistribution || {})
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  const sourceData = Object.entries(stats.sourceDistribution || {})
    .map(([name, value]) => ({ name: name.toUpperCase(), value }))
    .filter(d => d.value > 0);

  const methodData = Object.entries(stats.methodDistribution || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Monitoring Tren Topik</h2>
        <p className="section-sub">
          Visualisasi tren publikasi ilmiah, distribusi database, dan persebaran metode penelitian untuk proyek:{' '}
          <span className="font-semibold text-slate-800">{activeProject.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="stat-card bg-white">
          <div className="stat-icon bg-blue-50 text-blue-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Literatur</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.total} Artikel</h3>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-emerald-50 text-emerald-600">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rentang Tahun</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {yearData.length > 0 ? `${yearData[0].year} — ${yearData[yearData.length - 1].year}` : 'N/A'}
            </h3>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-purple-50 text-purple-600">
            <Award size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Metode Terpopuler</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5 truncate max-w-[180px]" title={methodData[0]?.name || 'N/A'}>
              {methodData[0]?.name || 'N/A'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Year Distribution */}
        <div className="card">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Tren Publikasi per Tahun</h4>
          <div className="h-[300px]">
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearData}>
                  <XAxis dataKey="year" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" name="Jumlah Artikel" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Tidak ada data tahun</div>
            )}
          </div>
        </div>

        {/* Source API Distribution */}
        <div className="card">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Distribusi Sumber Database</h4>
          <div className="h-[300px] flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-full sm:w-[50%] h-[240px]">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">Tidak ada data database</div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {sourceData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="text-slate-400">({item.value} paper)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Distribution */}
        <div className="card lg:col-span-1">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Persebaran Metode Penelitian</h4>
          <div className="h-[300px]">
            {methodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodData.slice(0, 5)} layout="vertical">
                  <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} stroke="#94a3b8" width={90} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Frekuensi" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center py-20">
                Belum ada analisis metode. Lakukan ekstraksi metode di menu Matriks Literatur.
              </div>
            )}
          </div>
        </div>

        {/* Top Cited Papers */}
        <div className="card lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Paper Paling Banyak Disitasi</h4>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>Judul Artikel</th>
                  <th className="w-24 text-center">Tahun</th>
                  <th className="w-24 text-center">Citations</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCited?.map((paper, index) => (
                  <tr key={paper.id}>
                    <td className="text-center font-semibold text-slate-400">{index + 1}</td>
                    <td className="font-bold text-slate-800 max-w-sm truncate" title={paper.title}>
                      {paper.title}
                    </td>
                    <td className="text-center">{paper.year || 'N/A'}</td>
                    <td className="text-center">
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                        {paper.citations || 0}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats.topCited || stats.topCited.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-400 py-6">Tidak ada data sitasi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
