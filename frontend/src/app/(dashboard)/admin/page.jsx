'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Users, FileText, Folder, Loader2, Trash2, Crown, RefreshCw, Search } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card bg-white">
      <div className={`stat-icon ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</h3>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch { toast.error('Gagal memuat statistik admin'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, limit: 50 } });
      setUsers(data.users);
    } catch { toast.error('Gagal memuat daftar user'); }
    finally { setLoading(false); }
  }, [search]);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/papers', { params: { limit: 50 } });
      setPapers(data.papers);
    } catch { toast.error('Gagal memuat daftar paper'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'overview') fetchOverview();
    else if (tab === 'users') fetchUsers();
    else if (tab === 'papers') fetchPapers();
  }, [tab, fetchOverview, fetchUsers, fetchPapers]);

  const handleDeleteUser = async (id) => {
    if (!confirm('Hapus pengguna ini beserta seluruh data proyeknya?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Pengguna dihapus');
      fetchUsers();
    } catch { toast.error('Gagal menghapus pengguna'); }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      toast.success(`Role diubah ke ${newRole}`);
      fetchUsers();
    } catch { toast.error('Gagal mengubah role'); }
  };

  if (!user || user.role !== 'admin') return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'papers', label: 'Paper Global', icon: FileText },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Shield size={16} />
          </div>
          <h2 className="section-title mb-0">Admin Panel</h2>
        </div>
        <p className="section-sub">Kelola pengguna, proyek, dan data platform secara global</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Pengguna" value={stats.stats.users} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Folder} label="Total Proyek" value={stats.stats.projects} color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={FileText} label="Total Paper" value={stats.stats.papers} color="bg-purple-50 text-purple-600" />
                <StatCard icon={Shield} label="Paper Tersimpan" value={stats.stats.saved} color="bg-orange-50 text-orange-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Pengguna Terbaru</h4>
                  <div className="space-y-3">
                    {stats.recentUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Distribusi Sumber Database</h4>
                  <div className="space-y-3">
                    {stats.sourceDistribution.map(src => (
                      <div key={src.sourceApi} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 uppercase">{src.sourceApi}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min(100, (src._count.id / (stats.stats.papers || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-8 text-right">{src._count.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    placeholder="Cari nama atau email..."
                    className="form-input pl-9 text-xs py-2"
                  />
                </div>
                <button onClick={fetchUsers} className="btn-sm btn-secondary">
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Proyek</th>
                      <th>Bergabung</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold text-slate-800">{u.name}</td>
                        <td className="text-slate-500">{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-center">{u._count.projects}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className="text-slate-400 hover:text-amber-500 p-1 rounded transition-colors"
                              title={u.role === 'admin' ? 'Jadikan Student' : 'Jadikan Admin'}
                            >
                              <Crown size={14} />
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                                title="Hapus Pengguna"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAPERS TAB */}
          {tab === 'papers' && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Sumber</th>
                    <th>Tahun</th>
                    <th>Proyek</th>
                    <th>User</th>
                    <th>Sitasi</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p.id}>
                      <td className="max-w-xs">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2" title={p.title}>{p.title}</p>
                      </td>
                      <td>
                        <span className={`badge ${
                          p.sourceApi === 'openalex' ? 'badge-blue' :
                          p.sourceApi === 'crossref' ? 'badge-orange' : 'badge-purple'
                        }`}>{p.sourceApi}</span>
                      </td>
                      <td>{p.year || '—'}</td>
                      <td className="text-xs text-slate-500 max-w-[100px] truncate">{p.project?.name}</td>
                      <td className="text-xs text-slate-500">{p.project?.user?.name}</td>
                      <td className="text-center font-semibold">{p.citations || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
