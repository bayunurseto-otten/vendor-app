import type { Vendor } from '../../types/vendor';
import type { CompanySettings } from '../../types/document';

interface Props {
  vendor: Vendor;
  settings: CompanySettings;
}

export default function AntiCorruptionDoc({ vendor, settings }: Props) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="doc-content" className="bg-white p-10 text-sm text-gray-900 font-sans" style={{ width: '794px', minHeight: '1123px' }}>
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
        <h1 className="text-lg font-bold uppercase">{settings.companyName}</h1>
        <p className="text-xs text-gray-600">{settings.companyAddress}</p>
      </div>

      <h2 className="text-center font-bold text-base uppercase mb-8">SURAT PERNYATAAN SUPRESI PRAKTIK KORUPSI</h2>

      <p className="mb-4">Yang bertanda tangan di bawah ini:</p>

      <table className="mb-6 w-full text-sm">
        <tbody>
          {[
            ['Nama Perusahaan', vendor.companyName],
            ['Alamat', vendor.companyAddress],
            ['Contact Person', vendor.contactPerson],
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

      <p className="mb-4">Dengan ini menyatakan bahwa:</p>

      <ol className="list-decimal list-inside space-y-2 mb-6 pl-2">
        <li>Kami berkomitmen untuk tidak melakukan, mendukung, atau terlibat dalam praktik korupsi, suap, gratifikasi, dan tindakan tidak etis lainnya dalam menjalankan bisnis dengan {settings.companyName}.</li>
        <li>Kami tidak akan memberikan imbalan dalam bentuk apapun kepada karyawan, pejabat, atau pihak terkait dari {settings.companyName} untuk mendapatkan keuntungan bisnis yang tidak semestinya.</li>
        <li>Kami akan mematuhi semua peraturan hukum yang berlaku di Republik Indonesia terkait anti-korupsi dan praktik bisnis yang bersih.</li>
        <li>Apabila kami melanggar pernyataan ini, kami bersedia menerima sanksi pemutusan hubungan bisnis dan tuntutan hukum yang berlaku.</li>
      </ol>

      <p className="mb-6">
        Demikian surat pernyataan ini dibuat dengan penuh kesadaran dan tanpa paksaan dari pihak manapun.
      </p>

      <p>Jakarta, {today}</p>
      <p className="mb-16">Yang membuat pernyataan,</p>
      <div className="border-t border-gray-800 pt-1 w-48">
        <p className="font-medium">{vendor.contactPerson}</p>
        <p className="text-xs text-gray-500">{vendor.companyName}</p>
      </div>
    </div>
  );
}
