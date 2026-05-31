'use client';
import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Loader2, Table2, AlertCircle, Plus, Save, Trash2, ChevronDown, Check, X, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const analysisFields = [
  { key: 'method', label: 'Metode Penelitian' },
  { key: 'researchObject', label: 'Objek Penelitian' },
  { key: 'variables', label: 'Variabel' },
  { key: 'location', label: 'Lokasi' },
  { key: 'technology', label: 'Teknologi' },
  { key: 'results', label: 'Hasil' },
  { key: 'limitations', label: 'Keterbatasan' },
  { key: 'opportunities', label: 'Peluang Novelty' },
];

function EditableCell({ value, onSave, isJson }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  const displayValue = isJson && value
    ? (() => { try { return JSON.parse(value).join(', '); } catch { return value; } })()
    : value;

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 min-w-[80px] text-xs text-slate-600 transition-colors"
        title="Klik untuk edit"
      >
        {displayValue || <span className="text-slate-300 italic">—</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-[120px]">
      <input
        autoFocus
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onSave(val); setEditing(false); }
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-full text-xs px-2 py-1 border border-primary-400 rounded focus:outline-none bg-white"
        placeholder={isJson ? 'val1, val2' : ''}
      />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-500 hover:text-emerald-700"><Check size={14} /></button>
      <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
    </div>
  );
}

export default function MatrixPage() {
  const { activeProject } = useProject();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [extracting, setExtracting] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchPapers = useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const { data } = await api.get('/papers', {
        params: { projectId: activeProject.id, page, limit },
      });
      setPapers(data.papers);
      setTotal(data.total);
    } catch {
      toast.error('Gagal memuat data paper');
    } finally {
      setLoading(false);
    }
  }, [activeProject, page]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const handleCellSave = async (paperId, analysisId, field, rawValue) => {
    const data = { [field]: rawValue };
    setSaving(prev => ({ ...prev, [`${paperId}-${field}`]: true }));
    try {
      if (analysisId) {
        await api.put(`/analysis/${analysisId}`, data);
      } else {
        const res = await api.post('/analysis', { paperId, ...data });
        setPapers(prev => prev.map(p =>
          p.id === paperId ? { ...p, analysis: res.data.analysis } : p
        ));
        toast.success('Analisis disimpan');
        return;
      }
      toast.success('Disimpan');
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(prev => ({ ...prev, [`${paperId}-${field}`]: false }));
    }
    fetchPapers();
  };

  const handleAutoExtract = async (paperId) => {
    setExtracting(prev => ({ ...prev, [paperId]: true }));
    try {
      const res = await api.post('/analysis/auto-extract', { paperId });
      setPapers(prev => prev.map(p =>
        p.id === paperId ? { ...p, analysis: res.data.analysis } : p
      ));
      return true;
    } catch (err) {
      toast.error(`Gagal mengekstrak paper #${paperId}`);
      return false;
    } finally {
      setExtracting(prev => ({ ...prev, [paperId]: false }));
    }
  };

  const handleAutoExtractAll = async () => {
    // Cari paper yang belum dianalisis (misal method-nya kosong/belum ada)
    const pendingPapers = papers.filter(p => !p.analysis || !p.analysis.method || p.analysis.method === 'Tidak disebutkan');
    
    if (pendingPapers.length === 0) {
      toast.success('Semua artikel di halaman ini sudah diekstrak!');
      return;
    }

    const toastId = toast.loading(`Mengekstrak ${pendingPapers.length} artikel... Mohon tunggu.`);
    let successCount = 0;

    for (const paper of pendingPapers) {
      const success = await handleAutoExtract(paper.id);
      if (success) successCount++;
      // Jeda 1 detik antar request untuk menghindari Rate Limit API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success(`Berhasil mengekstrak ${successCount} dari ${pendingPapers.length} artikel!`, { id: toastId });
  };

  const handleDeletePaper = async (id) => {
    if (!confirm('Hapus paper ini dari matriks?')) return;
    try {
      await api.delete(`/papers/${id}`);
      toast.success('Paper dihapus');
      fetchPapers();
    } catch { toast.error('Gagal menghapus'); }
  };

  if (!activeProject) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4"><Table2 size={32} /></div>
        <h3 className="text-lg font-bold text-slate-800">Proyek Riset Belum Dipilih</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mt-1 mb-6">Pilih proyek riset aktif di bar atas untuk melihat dan mengisi matriks literatur.</p>
        <Link href="/dashboard" className="btn-md btn-primary">Buka Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title">Matriks Literatur</h2>
          <p className="section-sub">
            Proyek: <span className="font-semibold text-slate-800">{activeProject.name}</span> •{' '}
            <span className="text-primary-600 font-bold">{total} artikel</span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 hidden md:block">
            💡 Klik sel untuk mengedit secara langsung
          </p>
          <button 
            onClick={handleAutoExtractAll}
            className="btn-sm btn-primary shadow-lg shadow-primary-500/20 flex items-center gap-2"
          >
            <Sparkles size={14} />
            Auto-Extract Semua
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
        </div>
      ) : papers.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 mx-auto"><AlertCircle size={24} /></div>
          <h4 className="text-sm font-bold text-slate-700">Belum ada paper</h4>
          <p className="text-xs text-slate-400 mt-1 mb-5">Lakukan crawling jurnal di menu Cari Jurnal terlebih dahulu.</p>
          <Link href="/search" className="btn-md btn-primary inline-flex">Cari Jurnal</Link>
        </div>
      ) : (
        <>
          <div className="table-wrapper mb-4">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8">#</th>
                  <th className="min-w-[200px]">Judul</th>
                  <th>Penulis</th>
                  <th>Tahun</th>
                  {analysisFields.map(f => <th key={f.key}>{f.label}</th>)}
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper, idx) => {
                  const authors = (() => { try { return JSON.parse(paper.authors).join(', '); } catch { return paper.authors; } })();
                  const analysis = paper.analysis;
                  return (
                    <tr key={paper.id}>
                      <td className="text-slate-400 text-xs">{(page - 1) * limit + idx + 1}</td>
                      <td>
                        <p className="text-xs font-semibold text-slate-800 max-w-[220px] line-clamp-2" title={paper.title}>
                          {paper.title}
                        </p>
                        {paper.doi && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{paper.doi}</p>}
                      </td>
                      <td className="text-xs text-slate-500 max-w-[130px] truncate" title={authors}>{authors}</td>
                      <td className="text-center text-xs">{paper.year || '—'}</td>
                      {analysisFields.map(f => (
                        <td key={f.key}>
                          <EditableCell
                            value={analysis?.[f.key] || ''}
                            isJson={f.key === 'variables'}
                            onSave={(v) => handleCellSave(paper.id, analysis?.id, f.key, v)}
                          />
                        </td>
                      ))}
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAutoExtract(paper.id)}
                            disabled={extracting[paper.id]}
                            title="Auto-Extract dengan AI"
                            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded bg-slate-50 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                          >
                            {extracting[paper.id] ? (
                              <Loader2 size={13} className="animate-spin text-indigo-500" />
                            ) : (
                              <Sparkles size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePaper(paper.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded bg-slate-50 hover:bg-red-50 transition-colors"
                            title="Hapus Paper"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total} artikel</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-sm btn-secondary disabled:opacity-40"
              >← Sebelumnya</button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="btn-sm btn-secondary disabled:opacity-40"
              >Selanjutnya →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
