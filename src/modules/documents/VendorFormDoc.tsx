import type { Vendor } from '../../types/vendor';
import type { CompanySettings } from '../../types/document';

interface Props {
  vendor: Vendor;
  settings: CompanySettings;
}

export default function VendorFormDoc({ vendor, settings }: Props) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="doc-content" className="bg-white p-10 text-sm text-gray-900 font-sans" style={{ width: '794px', minHeight: '1123px' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-lg font-bold uppercase">{settings.companyName}</h1>
        <p className="text-xs text-gray-600">{settings.companyAddress}</p>
      </div>

      <h2 className="text-center font-bold text-base uppercase mb-6">FORM DATA VENDOR BARU</h2>

      <table className="w-full text-sm border-collapse mb-6">
        <tbody>
          {[
            ['Nama Perusahaan', vendor.companyName],
            ['Alamat Perusahaan', vendor.companyAddress],
            ['Contact Person', vendor.contactPerson],
            ['Nomor Telepon', vendor.phone],
            ['Email', vendor.email],
            ['Nature of Business', vendor.natureOfBusiness],
            ['Supplier Type', vendor.supplierType],
            ['NPWP', vendor.npwp || '-'],
            ['NIB', vendor.nib || '-'],
            ['Nama Bank', vendor.bankName],
            ['Nomor Rekening', vendor.bankAccount],
            ['Atas Nama', vendor.accountHolder],
          ].map(([label, value]) => (
            <tr key={label} className="border border-gray-300">
              <td className="px-3 py-2 bg-gray-50 font-medium w-1/3">{label}</td>
              <td className="px-3 py-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 flex justify-between text-sm">
        <div className="text-center">
          <p className="mb-16">Dibuat oleh,</p>
          <div className="border-t border-gray-800 pt-1">
            <p className="font-medium">(________________)</p>
            <p className="text-xs text-gray-500">Nama & Jabatan</p>
          </div>
        </div>
        <div className="text-center">
          <p className="mb-2">Jakarta, {today}</p>
          <p className="mb-14">Disetujui oleh,</p>
          <div className="border-t border-gray-800 pt-1">
            <p className="font-medium">(________________)</p>
            <p className="text-xs text-gray-500">Nama & Jabatan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
