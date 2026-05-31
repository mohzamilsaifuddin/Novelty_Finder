'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProject } from '@/contexts/ProjectContext';
import { Folder, Plus, Trash2, Calendar, FileText, Bookmark, ExternalLink, Loader2, X, Archive } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, selectedProjectId, selectProject, createProject, refetch } = useProject();
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({ totalProjects: 0, totalPapers: 0, totalSaved: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Check if open modal is requested in URL
  useEffect(() => {
    if (searchParams.get('newProject') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [projRes, savedRes] = await Promise.all([
          api.get('/projects'),
          api.get('/saved')
        ]);
        
        const projList = projRes.data.projects;
        const totalPapers = projList.reduce((acc, p) => acc + (p._count?.papers || 0), 0);
        
        setStats({
          totalProjects: projList.length,
          totalPapers,
          totalSaved: savedRes.data.saved?.length || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [projects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Nama proyek wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const keywords = keywordsInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      await createProject({ name, keywords, description });
      
      // Reset form
      setName('');
      setKeywordsInput('');
      setDescription('');
      setShowModal(false);
      
      // Clean up URL query param
      router.replace('/dashboard');
    } catch (err) {
      // toast.error is handled inside ProjectContext
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation(); // prevent select project trigger
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini? Semua paper di dalamnya juga akan terhapus.')) return;
    
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Proyek berhasil dihapus');
      refetch();
      if (selectedProjectId === id) selectProject(null);
    } catch (err) {
      toast.error('Gagal menghapus proyek');
    }
  };

  const totalPapers = projects.reduce((sum, p) => sum + (p._count?.papers || 0), 0);

  return (
    <div className="page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">Dashboard Utama</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola proyek riset Anda dan pantau kemajuan pencarian novelty</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-md btn-primary shadow-lg shadow-primary-500/20"
        >
          <Plus size={16} />
          Proyek Riset Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="stat-icon bg-primary-50 text-primary-600">
            <Folder size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Proyek</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {statsLoading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : stats.totalProjects}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-50 text-emerald-600">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Artikel Dipantau</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {statsLoading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : stats.totalPapers}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple-50 text-purple-600">
            <Bookmark size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Koleksi Tersimpan</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {statsLoading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : stats.totalSaved}
            </h3>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <h3 className="text-lg font-bold text-slate-900 mb-4">Proyek Riset Anda</h3>
      {projects.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
            <Folder size={32} />
          </div>
          <h4 className="text-base font-bold text-slate-800">Belum ada proyek riset</h4>
          <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
            Mulai dengan membuat proyek riset baru untuk memantau jurnal ilmiah dan menemukan novelty penelitian Anda.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-md btn-primary">
            <Plus size={16} />
            Buat Proyek Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            const keywords = JSON.parse(project.keywords || '[]');
            
            return (
              <div
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={`card-hover cursor-pointer border ${
                  isSelected ? 'border-primary-500 bg-primary-50/10' : 'border-slate-100 bg-white'
                } flex flex-col justify-between h-full`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isSelected ? 'Proyek Aktif' : 'Proyek Riset'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Hapus Proyek"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {project.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">{project.description || 'Tidak ada deskripsi'}</p>

                  <div className="flex flex-wrap gap-1 mt-4">
                    {keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {kw}
                      </span>
                    ))}
                    {keywords.length > 3 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">+{keywords.length - 3} lagi</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-50 mt-6 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText size={13} className="text-slate-400" />
                    {project._count?.papers || 0} Artikel
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(project.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Buat Proyek Riset Baru</h3>
              <button
                onClick={() => { setShowModal(false); router.replace('/dashboard'); }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="form-label font-semibold">Nama Proyek</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Analisis AI untuk Kesehatan Tanaman"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label font-semibold">Kata Kunci (pisahkan dengan koma)</label>
                <input
                  type="text"
                  required
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Contoh: machine learning, precision agriculture, crop yield"
                  className="form-input"
                />
                <p className="text-[10px] text-slate-400 mt-1">Kata kunci ini akan digunakan untuk menyarankan pencarian jurnal terkait</p>
              </div>

              <div>
                <label className="form-label font-semibold">Deskripsi Singkat (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan latar belakang penelitian atau rumusan masalah proyek Anda"
                  className="form-input min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); router.replace('/dashboard'); }}
                  className="btn-md btn-secondary"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-md btn-primary min-w-[100px]"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Buat Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
