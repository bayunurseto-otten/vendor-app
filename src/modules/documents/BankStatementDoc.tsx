import type { Vendor } from '../../types/vendor';
import type { CompanySettings } from '../../types/document';

interface Props {
  vendor: Vendor;
  settings: CompanySettings;
}

export default function BankStatementDoc({ vendor, settings }: Props) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="doc-content" className="bg-white p-10 text-sm text-gray-900 font-sans" style={{ width: '794px', minHeight: '1123px' }}>
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
        <h1 className="text-lg font-bold uppercase">{settings.companyName}</h1>
        <p className="text-xs text-gray-600">{settings.companyAddress}</p>
      </div>

      <h2 className="text-center font-bold text-base uppercase mb-8">SURAT PERNYATAAN REKENING BANK</h2>

      <p className="mb-4">Yang bertanda tangan di bawah ini:</p>

      <table className="mb-6 w-full text-sm">
        <tbody>
          {[
            ['Nama Perusahaan', vendor.companyName],
            ['Alamat', vendor.companyAddress],
            ['NPWP', vendor.npwp || '-'],
          ].map(([l, v]) => (
            <tr key={l}>
              <td className="w-48 py-1 align-top">{l}</td>
              <td className="w-4 py-1">:</td>
              <td className="py-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mb-4">Dengan ini menyatakan bahwa rekening bank yang digunakan untuk keperluan transaksi adalah sebagai berikut:</p>

      <table className="w-full border-collapse mb-6">
        <tbody>
          {[
            ['Nama Bank', vendor.bankName],
            ['Nomor Rekening', vendor.bankAccount],
            ['Atas Nama', vendor.accountHolder],
          ].map(([l, v]) => (
            <tr key={l} className="border border-gray-300">
              <td className="px-3 py-2 bg-gray-50 font-medium w-1/3">{l}</td>
              <td className="px-3 py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mb-6">
        Demikian surat pernyataan ini dibuat dengan sebenar-benarnya dan dapat dipertanggungjawabkan. Apabila terjadi kesalahan data, maka kami bersedia menanggung segala risiko yang timbul.
      </p>

      <p>Jakarta, {today}</p>
      <p className="mb-16">Hormat kami,</p>
      <div className="border-t border-gray-800 pt-1 w-48">
        <p className="font-medium">{vendor.contactPerson}</p>
        <p className="text-xs text-gray-500">{vendor.companyName}</p>
      </div>
    </div>
  );
}
