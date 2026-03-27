import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { saveVendor, getVendorById } from '../data/localStorage';
import { generateId } from '../utils/id';
import { sendFileForOcr } from '../services/n8nService';

const schema = z.object({
  companyName: z.string().min(1, 'Wajib diisi'),
  companyAddress: z.string().min(1, 'Wajib diisi'),
  contactPerson: z.string().min(1, 'Wajib diisi'),
  phone: z.string().min(1, 'Wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  natureOfBusiness: z.string().min(1, 'Wajib diisi'),
  supplierType: z.string().min(1, 'Wajib diisi'),
  npwp: z.string(),
  nib: z.string(),
  bankName: z.string().min(1, 'Wajib diisi'),
  bankAccount: z.string().min(1, 'Wajib diisi'),
  accountHolder: z.string().min(1, 'Wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

type OcrStatus = 'idle' | 'loading' | 'success' | 'error';

const SUPPLIER_TYPES = ['Goods', 'Services', 'Both'];
const BANK_LIST = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'Permata', 'Danamon', 'Lainnya'];

function Field({
  name,
  label,
  required,
  register,
  errors,
}: {
  name: keyof FormValues;
  label: string;
  required?: boolean;
  register: any;
  errors: any;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...register(name)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>}
    </div>
  );
}

export default function VendorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrMessage, setOcrMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '', companyAddress: '', contactPerson: '',
      phone: '', email: '', natureOfBusiness: '', supplierType: '',
      npwp: '', nib: '', bankName: '', bankAccount: '', accountHolder: '',
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      const vendor = getVendorById(id);
      if (vendor) reset(vendor);
    }
  }, [id, isEdit, reset]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrStatus('loading');
    setOcrMessage('Membaca dokumen...');

    try {
      const result = await sendFileForOcr(file);

      // Auto-fill form fields dengan OCR results
      if (result.companyName) setValue('companyName', result.companyName);
      if (result.companyAddress) setValue('companyAddress', result.companyAddress);
      if (result.npwp) setValue('npwp', result.npwp);
      if (result.nib) setValue('nib', result.nib);
      if (result.bankName) setValue('bankName', result.bankName);
      if (result.bankAccount) setValue('bankAccount', result.bankAccount);
      if (result.accountHolder) setValue('accountHolder', result.accountHolder);

      // Handle contact information - bisa dari contactInfo nested object atau dari root level
      const contactInfo = result.contactInfo;
      setValue('contactPerson', contactInfo?.name || result.contactPerson || '');
      setValue('phone', contactInfo?.phone || result.phone || '');
      setValue('email', contactInfo?.email || result.email || '');

      setOcrStatus('success');
      setOcrMessage('Data berhasil diekstrak dari dokumen!');
    } catch (err: unknown) {
      setOcrStatus('error');
      setOcrMessage(err instanceof Error ? err.message : 'Gagal membaca dokumen.');
    }
    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onSubmit(data: FormValues) {
    const now = new Date().toISOString();
    const vendor = isEdit && id
      ? { ...data, id, createdAt: getVendorById(id)!.createdAt, updatedAt: now }
      : { ...data, id: generateId(), createdAt: now, updatedAt: now };
    saveVendor(vendor);
    navigate('/');
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Vendor' : 'Tambah Vendor Baru'}</h1>
          <p className="text-sm text-gray-500">Lengkapi data vendor atau upload dokumen untuk auto-fill</p>
        </div>
      </div>

      {/* OCR Upload */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-800 mb-2">Upload Dokumen (Auto-fill dengan AI OCR)</p>
        <p className="text-xs text-gray-500 mb-3">Upload KTP, NPWP, rekening koran, atau dokumen vendor lainnya. AI akan membaca dan mengisi form secara otomatis.</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrStatus === 'loading'}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {ocrStatus === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {ocrStatus === 'loading' ? 'Memproses...' : 'Upload Dokumen'}
          </button>
          {ocrStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-green-700 text-sm">
              <CheckCircle size={15} /> {ocrMessage}
            </div>
          )}
          {ocrStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle size={15} /> {ocrMessage}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informasi Perusahaan</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field name="companyName" label="Nama Perusahaan" required register={register} errors={errors} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Perusahaan <span className="text-red-500">*</span></label>
              <textarea
                {...register('companyAddress')}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.companyAddress && <p className="text-xs text-red-500 mt-1">{errors.companyAddress.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field name="npwp" label="NPWP" register={register} errors={errors} />
              <Field name="nib" label="NIB" register={register} errors={errors} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business <span className="text-red-500">*</span></label>
                <input {...register('natureOfBusiness')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.natureOfBusiness && <p className="text-xs text-red-500 mt-1">{errors.natureOfBusiness.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type <span className="text-red-500">*</span></label>
                <select {...register('supplierType')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih tipe</option>
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.supplierType && <p className="text-xs text-red-500 mt-1">{errors.supplierType.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Kontak</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field name="contactPerson" label="Contact Person" required register={register} errors={errors} />
            <Field name="phone" label="Nomor Telepon" required register={register} errors={errors} />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
        </section>

        {/* Bank Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informasi Bank</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank <span className="text-red-500">*</span></label>
              <select {...register('bankName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih bank</option>
                {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field name="bankAccount" label="Nomor Rekening" required register={register} errors={errors} />
              <Field name="accountHolder" label="Atas Nama" required register={register} errors={errors} />
            </div>
          </div>
        </section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            {isEdit ? 'Simpan Perubahan' : 'Simpan Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
