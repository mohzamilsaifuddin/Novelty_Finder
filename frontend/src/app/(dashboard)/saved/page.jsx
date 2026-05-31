'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Loader2, Trash2, ExternalLink, Calendar, Award, StickyNote, X, Check } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function NoteCell({ paperId, savedId, notes, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(notes || '');

  const save = async () => {
    try {
      await api.put(`/saved/${savedId}`, { notes: val });
      onSaved(val);
      setEditing(false);
      toast.success('Catatan disimpan');
    } catch { toast.error('Gagal menyimpan catatan'); }
  };

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer text-xs text-slate-500 hover:text-slate-800 line-clamp-2 min-w-[100px] transition-colors" title="Klik untuk edit catatan">
        {val || <span className="text-slate-300 italic">Tambah catatan...</span>}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1">
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={2}
        className="text-xs px-2 py-1 border border-primary-400 rounded w-full focus:outline-none resize-none"
      />
      <div className="flex flex-col gap-1 mt-0.5">
        <button onClick={save} className="text-emerald-500 hover:text-emerald-700"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { user } = useAuth();
  const [savedPapers, setSavedPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/saved');
      setSavedPapers(data.saved);
    } catch { toast.error('Gagal memuat koleksi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleRemove = async (savedId) => {
    if (!confirm('Hapus paper ini dari koleksi Anda?')) return;
    try {
      await api.delete(`/saved/${savedId}`);
      setSavedPapers(prev => prev.filter(s => s.id !== savedId));
      toast.success('Dihapus dari koleksi');
    } catch { toast.error('Gagal menghapus'); }
  };

  const updateNotes = (savedId, newNotes) => {
    setSavedPapers(prev => prev.map(s => s.id === savedId ? { ...s, notes: newNotes } : s));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Koleksi Saya</h2>
        <p className="section-sub">Paper yang telah Anda tandai untuk referensi pribadi • {savedPapers.length} item</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
        </div>
      ) : savedPapers.length === 0 ? (
        <div className="card text-center py-20 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center mb-4">
            <Bookmark size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Koleksi Anda masih kosong</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Tandai paper penting dari hasil pencarian jurnal untuk mudah diakses nanti.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPapers.map((saved) => {
            const paper = saved.paper;
            const authors = (() => { try { return JSON.parse(paper.authors || '[]').join(', '); } catch { return paper.authors; } })();

            return (
              <div key={saved.id} className="card-hover border border-slate-100 p-5 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                      paper.sourceApi === 'openalex' ? 'bg-blue-100 text-blue-700' :
                      paper.sourceApi === 'crossref' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>{paper.sourceApi}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                    {paper.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mb-3">{authors}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={11} />{paper.year || 'N/A'}</span>
                    {paper.journal && <span className="truncate max-w-[180px]">📖 {paper.journal}</span>}
                    <span className="flex items-center gap-1"><Award size={11} />{paper.citations || 0} Sitasi</span>
                  </div>

                  <div className="border-t border-slate-50 pt-3">
                    <div className="flex items-start gap-2">
                      <StickyNote size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <NoteCell
                        paperId={paper.id}
                        savedId={saved.id}
                        notes={saved.notes}
                        onSaved={(val) => updateNotes(saved.id, val)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                  {paper.url && (
                    <a href={paper.url} target="_blank" rel="noreferrer"
                      className="btn-sm btn-secondary text-xs"
                    >
                      <ExternalLink size={13} /> Buka
                    </a>
                  )}
                  <button
                    onClick={() => handleRemove(saved.id)}
                    className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all"
                    title="Hapus dari koleksi"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
