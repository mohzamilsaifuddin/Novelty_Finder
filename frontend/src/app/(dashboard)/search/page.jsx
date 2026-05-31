'use client';
import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Search, Loader2, ArrowRight, FolderPlus, Database, Calendar, Award, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SearchPage() {
  const { activeProject } = useProject();
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState(['openalex', 'crossref', 'semanticscholar', 'scholar']);
  const [limit, setLimit] = useState(20);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSourceChange = (src) => {
    setSources(prev =>
      prev.includes(src)
        ? prev.filter(s => s !== src)
        : [...prev, src]
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!activeProject) {
      toast.error('Silakan pilih proyek riset terlebih dahulu di menu atas');
      return;
    }
    if (!query.trim()) {
      toast.error('Masukkan kata kunci pencarian');
      return;
    }
    if (sources.length === 0) {
      toast.error('Pilih minimal satu sumber database');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/papers/search', {
        projectId: activeProject.id,
        keywords: query,
        sources,
        limit: parseInt(limit),
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined,
      });
      setResults(data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mencari jurnal, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 animate-bounce">
          <Database size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Proyek Riset Belum Dipilih</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center mt-1 mb-6">
          Anda perlu memilih proyek riset aktif terlebih dahulu di bar atas, atau membuat proyek baru untuk mulai mencari jurnal.
        </p>
        <Link href="/dashboard" className="btn-md btn-primary">
          <FolderPlus size={16} />
          Buka Dashboard Proyek
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Cari Jurnal Ilmiah</h2>
        <p className="section-sub">
          Cari, unduh meta-data, dan simpan jurnal secara otomatis ke proyek:{' '}
          <span className="font-semibold text-slate-800">{activeProject.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Search Panel */}
        <div className="card lg:col-span-1 space-y-5">
          <h3 className="text-sm font-bold text-slate-800">Filter & Konfigurasi</h3>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="form-label font-semibold">Kata Kunci Utama</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. machine learning crop yield"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label font-semibold">Sumber Database</label>
              <div className="space-y-2 mt-2">
                {[
                  { id: 'openalex', name: 'OpenAlex' },
                  { id: 'crossref', name: 'Crossref' },
                  { id: 'semanticscholar', name: 'Semantic Scholar' },
                  { id: 'scholar', name: 'Google Scholar (Beta)' },
                  { id: 'scopus', name: 'Scopus (Butuh API Key)' }
                ].map(src => (
                  <label key={src.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.includes(src.id)}
                      onChange={() => handleSourceChange(src.id)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    />
                    {src.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label font-semibold">Tahun Mulai</label>
                <input
                  type="number"
                  min="1900"
                  max="2099"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  placeholder="e.g. 2019"
                  className="form-input text-xs py-2"
                />
              </div>
              <div>
                <label className="form-label font-semibold">Tahun Selesai</label>
                <input
                  type="number"
                  min="1900"
                  max="2099"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="form-input text-xs py-2"
                />
              </div>
            </div>

            <div>
              <label className="form-label font-semibold">Batas Hasil per Database</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="form-select"
              >
                <option value="10">10 Artikel</option>
                <option value="20">20 Artikel</option>
                <option value="50">50 Artikel</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-md btn-primary mt-2 shadow-lg shadow-primary-500/10"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Search size={16} />
                  Mulai Crawling
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <div className="card text-center py-20 flex flex-col items-center justify-center">
              <Loader2 size={40} className="text-primary-600 animate-spin mb-4" />
              <h4 className="text-base font-bold text-slate-800">Menghubungi Database Eksternal...</h4>
              <p className="text-sm text-slate-400 max-w-sm mt-1">
                Kami sedang melakukan crawling, deduplikasi, dan menyimpan data jurnal ke MySQL. Mohon tunggu beberapa detik.
              </p>
            </div>
          )}

          {!loading && !results && (
            <div className="card text-center py-20 flex flex-col items-center justify-center border-dashed border-slate-200">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                <Search size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Masukkan parameter pencarian</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Ketikkan topik atau kata kunci penelitian Anda dan klik tombol Mulai Crawling untuk memproses.
              </p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-500">
                  Ditemukan <span className="font-bold text-slate-800">{results.total}</span> artikel unik.{' '}
                  <span className="font-semibold text-emerald-600">{results.stored} disimpan</span>,{' '}
                  <span className="font-semibold text-slate-400">{results.skipped} duplikat diabaikan</span>.
                </div>
                <button
                  onClick={() => setResults(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  Bersihkan Hasil
                </button>
              </div>

              {results.papers.length === 0 ? (
                <div className="card text-center py-16">
                  <p className="text-sm text-slate-500">Tidak ada artikel baru yang berhasil ditambahkan ke proyek Anda (semua terdeteksi sebagai duplikat).</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.papers.map((paper) => {
                    const authors = JSON.parse(paper.authors || '[]');
                    const keywords = JSON.parse(paper.keywords || '[]');
                    
                    return (
                      <div key={paper.id} className="card-hover bg-white border border-slate-100 p-5 rounded-2xl">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            paper.sourceApi === 'openalex'
                              ? 'bg-blue-100 text-blue-800'
                              : paper.sourceApi === 'crossref'
                              ? 'bg-amber-100 text-amber-800'
                              : paper.sourceApi === 'semanticscholar'
                              ? 'bg-indigo-100 text-indigo-800'
                              : paper.sourceApi === 'scholar'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {paper.sourceApi}
                          </span>
                          
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-primary-600 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {paper.title}
                        </h4>

                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          {authors.join(', ')}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {paper.year || 'N/A'}
                          </span>
                          {paper.journal && (
                            <span className="truncate max-w-[200px]" title={paper.journal}>
                              📖 {paper.journal}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Award size={13} />
                            {paper.citations || 0} Sitasi
                          </span>
                          {paper.doi && (
                            <span className="font-mono text-[10px]">
                              DOI: {paper.doi}
                            </span>
                          )}
                        </div>

                        {paper.abstract && (
                          <div className="mt-3 bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 line-clamp-3">
                            <span className="font-bold text-slate-700 block mb-0.5">Abstract:</span>
                            {paper.abstract}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
