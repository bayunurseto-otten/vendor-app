import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getVendorById, getCompanySettings, saveCompanySettings } from '../data/localStorage';
import type { DocumentType, CompanySettings } from '../types/document';
import VendorFormDoc from '../modules/documents/VendorFormDoc';
import BankStatementDoc from '../modules/documents/BankStatementDoc';
import AntiCorruptionDoc from '../modules/documents/AntiCorruptionDoc';
import { sendPdfToTelegram } from '../services/n8nService';

const DOC_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'vendor-form', label: 'Form Vendor' },
  { type: 'bank-statement', label: 'Pernyataan Rekening' },
  { type: 'anti-corruption', label: 'Supresi Korupsi' },
];

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendor = id ? getVendorById(id) : null;
  const [docType, setDocType] = useState<DocumentType>('vendor-form');
  const [settings, setSettings] = useState<CompanySettings>(getCompanySettings);
  const [showSettings, setShowSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  if (!vendor) {
    return <div className="p-8 text-gray-500">Vendor tidak ditemukan.</div>;
  }

  const fileBaseName = useMemo(() => {
    const company = (vendor.companyName || 'vendor')
      .replace(/[\/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return `${docType}-${company}`.slice(0, 120);
  }, [docType, vendor.companyName]);

  async function generatePdfBlob(): Promise<{ blob: Blob; filename: string }> {
    const el = document.getElementById('doc-content');
    if (!el) {
      throw new Error('Konten dokumen tidak ditemukan. Coba refresh halaman.');
    }

    // Workaround for html2canvas issue with oklch colors (used by Tailwind v4)
    // We clone the element and replace oklch colors with rgb/rgba before rendering
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    // Replace all oklch colors in the cloned tree with computed rgb values
    // This requires getting the computed styles from the original elements
    const originalElements = el.getElementsByTagName('*');
    const clonedElements = clone.getElementsByTagName('*');

    // Also handle the root element
    const originalStyle = window.getComputedStyle(el);
    clone.style.backgroundColor = originalStyle.backgroundColor.includes('oklch') ? '#ffffff' : originalStyle.backgroundColor;
    clone.style.color = originalStyle.color.includes('oklch') ? '#000000' : originalStyle.color;
    clone.style.borderColor = originalStyle.borderColor.includes('oklch') ? '#e5e7eb' : originalStyle.borderColor;

    for (let i = 0; i < originalElements.length; i++) {
      const origEl = originalElements[i];
      const cloneEl = clonedElements[i] as HTMLElement;
      const compStyle = window.getComputedStyle(origEl);

      // Fallbacks for common tailwind colors if they compute to oklch
      if (compStyle.color && compStyle.color.includes('oklch')) {
        // Simple heuristic based on classes if possible, or fallback to dark gray
        if (origEl.className.includes('text-gray-500')) cloneEl.style.color = 'rgb(107, 114, 128)';
        else if (origEl.className.includes('text-gray-600')) cloneEl.style.color = 'rgb(75, 85, 99)';
        else if (origEl.className.includes('text-gray-900')) cloneEl.style.color = 'rgb(17, 24, 39)';
        else if (origEl.className.includes('text-white')) cloneEl.style.color = 'rgb(255, 255, 255)';
        else cloneEl.style.color = 'rgb(0, 0, 0)';
      }

      if (compStyle.backgroundColor && compStyle.backgroundColor.includes('oklch')) {
        if (origEl.className.includes('bg-gray-50')) cloneEl.style.backgroundColor = 'rgb(249, 250, 251)';
        else if (origEl.className.includes('bg-gray-200')) cloneEl.style.backgroundColor = 'rgb(229, 231, 235)';
        else if (origEl.className.includes('bg-white')) cloneEl.style.backgroundColor = 'rgb(255, 255, 255)';
        else cloneEl.style.backgroundColor = 'rgb(255, 255, 255)';
      }

      if (compStyle.borderColor && compStyle.borderColor.includes('oklch')) {
        if (origEl.className.includes('border-gray-800')) cloneEl.style.borderColor = 'rgb(31, 41, 55)';
        else if (origEl.className.includes('border-gray-300')) cloneEl.style.borderColor = 'rgb(209, 213, 219)';
        else cloneEl.style.borderColor = 'rgb(229, 231, 235)'; // gray-200 default
      }
    }

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    } finally {
      // Clean up clone safely even if html2canvas throws an error
      document.body.removeChild(clone);
    }

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
      if (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
      }
    }

    const filename = `${fileBaseName}.pdf`;
    const blob = pdf.output('blob');
    return { blob, filename };
  }

  function triggerBrowserDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownload() {
    setActionStatus('idle');
    setActionMessage('');
    setGenerating(true);
    try {
      const { blob, filename } = await generatePdfBlob();
      triggerBrowserDownload(blob, filename);
      setActionStatus('success');
      setActionMessage('PDF berhasil diunduh.');
    } catch (err: unknown) {
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : 'Gagal membuat PDF.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendToTelegram() {
    setActionStatus('idle');
    setActionMessage('');
    setSending(true);
    console.log('MASUK');
    try {
      const { blob, filename } = await generatePdfBlob();
      const file = new File([blob], filename, { type: 'application/pdf' });
      console.log("🚀 ~ handleSendToTelegram ~ file:", file)
      await sendPdfToTelegram(file, { vendorId: vendor!.id, docType, companyName: vendor!.companyName });
      setActionStatus('success');
      setActionMessage('Berhasil dikirim ke Telegram.');
    } catch (err: unknown) {
      console.log("🚀 ~ handleSendToTelegram ~ err:", err)
      setActionStatus('error');
      setActionMessage(err instanceof Error ? err.message : 'Gagal mengirim ke Telegram.');
    } finally {
      setSending(false);
    }
  }

  function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    saveCompanySettings(settings);
    setShowSettings(false);
  }

  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 className="font-semibold text-gray-900 text-sm">{vendor.companyName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Preview Dokumen</p>
        </div>

        <div className="p-4 space-y-2 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pilih Dokumen</p>
          {DOC_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setDocType(type)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                docType === type ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={15} /> Pengaturan Kop Surat
          </button>

          {showSettings && (
            <form onSubmit={handleSaveSettings} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <label className="text-xs text-gray-600">Nama Perusahaan</label>
                <input
                  value={settings.companyName}
                  onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Alamat</label>
                <input
                  value={settings.companyAddress}
                  onChange={e => setSettings(s => ({ ...s, companyAddress: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition-colors">
                Simpan
              </button>
            </form>
          )}

          <button
            onClick={handleDownload}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Download size={15} />
            {generating ? 'Memproses...' : 'Download PDF'}
          </button>
          <button
            onClick={handleSendToTelegram}
            disabled={sending || generating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send size={15} />
            {sending ? 'Mengirim...' : 'Kirim ke Telegram'}
          </button>
          {actionStatus !== 'idle' && (
            <div className={`text-xs ${actionStatus === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {actionMessage}
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div ref={previewRef} className="flex-1 overflow-auto bg-gray-200 p-8">
        <div className="shadow-lg inline-block">
          {docType === 'vendor-form' && <VendorFormDoc vendor={vendor} settings={settings} />}
          {docType === 'bank-statement' && <BankStatementDoc vendor={vendor} settings={settings} />}
          {docType === 'anti-corruption' && <AntiCorruptionDoc vendor={vendor} settings={settings} />}
        </div>
      </div>
    </div>
  );
}
