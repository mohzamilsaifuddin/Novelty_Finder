'use client';
import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ExportPage() {
  const { activeProject, projects, selectedProjectId, selectProject } = useProject();
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleExcelExport = async () => {
    if (!activeProject) { toast.error('Pilih proyek riset terlebih dahulu'); return; }
    setLoadingExcel(true);
    try {
      const response = await api.get('/export/excel', {
        params: { projectId: activeProject.id },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_matrix.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File Excel berhasil diunduh');
    } catch {
      toast.error('Gagal mengekspor Excel. Pastikan sudah ada data di proyek ini.');
    } finally {
      setLoadingExcel(false);
    }
  };

  const handlePdfExport = async () => {
    if (!activeProject) { toast.error('Pilih proyek riset terlebih dahulu'); return; }
    setLoadingPdf(true);
    try {
      const response = await api.get('/export/pdf', {
        params: { projectId: activeProject.id },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File PDF berhasil diunduh');
    } catch {
      toast.error('Gagal mengekspor PDF. Pastikan sudah ada data di proyek ini.');
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Export Data</h2>
        <p className="section-sub">Export matriks literatur dan laporan analisis novelty ke berbagai format</p>
      </div>

      {/* Project selector info */}
      {!activeProject ? (
        <div className="card border border-amber-200 bg-amber-50/50 flex items-start gap-3 mb-8">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Proyek Riset Belum Dipilih</p>
            <p className="text-xs text-amber-700 mt-0.5">Pilih proyek riset aktif melalui bar menu di atas untuk mengaktifkan fitur export.</p>
          </div>
        </div>
      ) : (
        <div className="card border border-emerald-200 bg-emerald-50/30 flex items-start gap-3 mb-8">
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Proyek Aktif: {activeProject.name}</p>
            <p className="text-xs text-emerald-700 mt-0.5">Siap untuk diekspor. Pilih format yang Anda inginkan di bawah.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Card */}
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={28} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export ke Excel</h3>
              <p className="text-xs text-slate-400">Format .xlsx — Google Sheets, Microsoft Excel</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 text-sm mb-3">Konten yang akan diekspor:</p>
            {[
              'Daftar seluruh paper dalam proyek',
              'Kolom: Judul, Penulis, Tahun, Jurnal, DOI, Citasi',
              'Sheet analisis: Metode, Objek, Variabel, Lokasi',
              'Sheet teknologi, hasil, keterbatasan, peluang',
              'Rekomendasi novelty (jika sudah dianalisis)',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={handleExcelExport}
            disabled={loadingExcel || !activeProject}
            className="btn-md w-full mt-auto"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
          >
            {loadingExcel ? (
              <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            ) : (
              <><Download size={16} /> Unduh Excel</>
            )}
          </button>
        </div>

        {/* PDF Card */}
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <FileText size={28} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export ke PDF</h3>
              <p className="text-xs text-slate-400">Format .pdf — Laporan siap cetak</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 text-sm mb-3">Konten yang akan diekspor:</p>
            {[
              'Halaman judul laporan penelitian',
              'Ringkasan proyek dan kata kunci',
              'Matriks literatur lengkap (tabel)',
              'Distribusi tahun, sumber, dan metode',
              'Laporan analisis novelty & rekomendasi',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={handlePdfExport}
            disabled={loadingPdf || !activeProject}
            className="btn-md w-full mt-auto"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
          >
            {loadingPdf ? (
              <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            ) : (
              <><Download size={16} /> Unduh PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 card bg-slate-50 border border-slate-100">
        <p className="text-xs text-slate-400">
          💡 <strong>Tips:</strong> Untuk hasil export terbaik, pastikan semua paper sudah memiliki analisis yang lengkap di menu{' '}
          <Link href="/matrix" className="text-primary-600 font-semibold hover:underline">Matriks Literatur</Link> dan telah dilakukan{' '}
          <Link href="/novelty" className="text-primary-600 font-semibold hover:underline">Analisis Novelty</Link>.
        </p>
      </div>
    </div>
  );
}
