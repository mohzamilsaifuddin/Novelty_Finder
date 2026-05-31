'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, Loader2, Camera, Save, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nama tidak boleh kosong'); return; }
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { name, avatar });
      await refetch();
      toast.success('Profil berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { toast.error('Isi semua field password'); return; }
    if (newPassword !== confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page max-w-2xl">
      <div className="page-header">
        <h2 className="section-title">Profil Saya</h2>
        <p className="section-sub">Kelola informasi akun dan keamanan login Anda</p>
      </div>

      {/* Avatar & Basic Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-50">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-primary-200">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
              user?.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role === 'admin' ? 'Administrator' : 'Mahasiswa'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Edit Informasi Profil</h4>

          <div>
            <label className="form-label font-semibold">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={15} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input pl-10"
                placeholder="Nama Lengkap"
              />
            </div>
          </div>

          <div>
            <label className="form-label font-semibold">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={15} />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="form-input pl-10 opacity-50 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Email tidak dapat diubah</p>
          </div>

          <div>
            <label className="form-label font-semibold">URL Avatar (opsional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Camera size={15} />
              </div>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="form-input pl-10"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingProfile} className="btn-md btn-primary min-w-[120px]">
              {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Simpan Profil</>}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="card">
        <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <KeyRound size={16} className="text-primary-500" />
          Ubah Password
        </h4>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="form-label font-semibold">Password Saat Ini</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-input pl-10"
                placeholder="Password lama"
              />
            </div>
          </div>

          <div>
            <label className="form-label font-semibold">Password Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input pl-10"
                placeholder="Min. 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="form-label font-semibold">Konfirmasi Password Baru</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input pl-10"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPassword} className="btn-md btn-primary min-w-[140px]">
              {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <><KeyRound size={15} /> Ubah Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
