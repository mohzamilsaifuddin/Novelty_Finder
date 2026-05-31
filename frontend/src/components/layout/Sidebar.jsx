'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Search, TrendingUp, Table2, Lightbulb,
  Bookmark, Download, User, LogOut, BookOpen, Shield, ChevronRight, ChevronLeft
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/search',      label: 'Cari Jurnal',       icon: Search },
  { href: '/monitoring',  label: 'Monitoring Topik',  icon: TrendingUp },
  { href: '/matrix',      label: 'Matriks Literatur', icon: Table2 },
  { href: '/novelty',     label: 'Analisis Novelty',  icon: Lightbulb },
  { href: '/saved',       label: 'Koleksi Saya',      icon: Bookmark },
  { href: '/export',      label: 'Export',            icon: Download },
  { href: '/profile',     label: 'Profil',            icon: User },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 bg-sidebar flex flex-col z-40 shadow-xl transition-all duration-300",
      isOpen ? "w-64" : "w-20"
    )}>
      {/* Logo */}
      <div className={clsx("flex items-center gap-3 py-5 border-b border-white/5 relative", isOpen ? "px-6" : "px-0 justify-center")}>
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/30 flex-shrink-0">
          <BookOpen size={18} className="text-white" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-base leading-tight whitespace-nowrap">Novelty Finder</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Jurnal Research</p>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={clsx(
            "absolute top-6 right-[-12px] bg-slate-800 text-slate-400 hover:text-white rounded-full p-1 shadow-lg border border-slate-700 z-50 transition-transform",
            !isOpen && "rotate-180 right-[-12px]"
          )}
          title="Toggle Sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        <p className={clsx("text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3", isOpen ? "px-6" : "px-2 text-center text-[8px]")}>
          {isOpen ? "Menu Utama" : "Menu"}
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={!isOpen ? label : undefined}
              className={clsx(
                'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mx-3',
                isOpen ? 'px-3' : 'px-0 justify-center',
                active
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              {isOpen && <span className="flex-1 whitespace-nowrap">{label}</span>}
              {isOpen && active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <p className={clsx("text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3 mt-5", isOpen ? "px-6" : "px-2 text-center text-[8px]")}>
              {isOpen ? "Admin" : "Adm"}
            </p>
            <Link
              href="/admin"
              title={!isOpen ? "Admin Panel" : undefined}
              className={clsx(
                'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mx-3',
                isOpen ? 'px-3' : 'px-0 justify-center',
                pathname.startsWith('/admin')
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              )}
            >
              <Shield size={17} className="flex-shrink-0" />
              {isOpen && <span className="whitespace-nowrap">Admin Panel</span>}
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className={clsx("border-t border-white/5", isOpen ? "p-3" : "p-2")}>
        <div className={clsx("flex items-center gap-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors", isOpen ? "px-3" : "px-0 justify-center flex-col")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.role === 'admin' ? 'Administrator' : 'Mahasiswa'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
