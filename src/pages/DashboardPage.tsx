import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, FileText, Trash2 } from 'lucide-react';
import { getVendors, deleteVendor } from '../data/localStorage';
import type { Vendor } from '../types/vendor';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>(() => getVendors());

  const filtered = vendors.filter(v =>
    v.companyName.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    if (!confirm('Hapus vendor ini?')) return;
    deleteVendor(id);
    setVendors(getVendors());
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} vendor terdaftar</p>
        </div>
        <button
          onClick={() => navigate('/vendor/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Tambah Vendor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari vendor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada vendor. Klik "Tambah Vendor" untuk mulai.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Perusahaan</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Contact Person</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">NPWP</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Bank</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{vendor.companyName}</div>
                    <div className="text-gray-400 text-xs">{vendor.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{vendor.contactPerson}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{vendor.npwp || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{vendor.bankName}</div>
                    <div className="text-xs text-gray-400">{vendor.bankAccount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/vendor/${vendor.id}/edit`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/vendor/${vendor.id}/document`)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Generate Dokumen"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
