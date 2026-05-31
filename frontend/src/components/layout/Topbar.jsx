'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, FolderOpen, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useState } from 'react';

const pageTitles = {
  '/dashboard':  { title: 'Dashboard', sub: 'Selamat datang di Novelty Finder' },
  '/search':     { title: 'Cari Jurnal', sub: 'Cari artikel dari berbagai sumber jurnal ilmiah' },
  '/monitoring': { title: 'Monitoring Topik', sub: 'Tren penelitian berdasarkan tahun dan keyword' },
  '/matrix':     { title: 'Matriks Literatur', sub: 'Analisis terstruktur dari artikel yang dikumpulkan' },
  '/novelty':    { title: 'Analisis Novelty', sub: 'Rekomendasi research gap dan novelty penelitian' },
  '/saved':      { title: 'Koleksi Saya', sub: 'Artikel yang disimpan untuk referensi' },
  '/export':     { title: 'Export Data', sub: 'Export matriks literatur ke Excel atau PDF' },
  '/profile':    { title: 'Profil Saya', sub: 'Kelola informasi akun' },
  '/admin':      { title: 'Admin Panel', sub: 'Kelola pengguna dan data platform' },
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { projects, selectedProjectId, selectProject } = useProject();

  const current = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key));
  const { title, sub } = current?.[1] || { title: 'Novelty Finder', sub: '' };

  const handleProjectChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      router.push('/dashboard?newProject=true');
    } else {
      selectProject(val ? parseInt(val) : null);
    }
  };

  // We only show project selector on pages that depend on project context
  const showProjectSelector = ['/search', '/monitoring', '/matrix', '/novelty', '/export'].some(
    path => pathname.startsWith(path)
  );

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>

      <div className="flex items-center gap-4">
        {showProjectSelector && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
            <FolderOpen size={15} className="text-primary-500" />
            <select
              value={selectedProjectId || ''}
              onChange={handleProjectChange}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none pr-6 cursor-pointer"
            >
              <option value="">-- Pilih Proyek Riset --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}
                </option>
              ))}
              <option value="__new__" className="text-primary-600 font-bold">
                + Buat Proyek Baru
              </option>
            </select>
          </div>
        )}

        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Mahasiswa'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
