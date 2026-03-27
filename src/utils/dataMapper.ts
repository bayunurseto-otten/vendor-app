/**
 * Data mapping dan normalisasi untuk OCR results
 * Menangani berbagai variasi istilah dan format dari dokumen vendor yang berbeda
 */

/**
 * Mapping untuk variasi istilah contact information
 * Mengenali berbagai istilah seperti Contact Person, PIC, Phone, Mobile, dll
 */
const CONTACT_FIELD_MAPPINGS: Record<string, 'name' | 'phone' | 'email' | 'website'> = {
  // Contact Person / PIC
  'name': 'name',
  'contactperson': 'name',
  'pic': 'name',
  'personincharge': 'name',
  'rperson': 'name',
  'nperson': 'name',
  'kontak': 'name',
  'namakontak': 'name',
  'kontakperson': 'name',

  // Phone
  'phone': 'phone',
  'phonenumber': 'phone',
  'mobilenumber': 'phone',
  'mobile': 'phone',
  'phonemobile': 'phone',
  'telepon': 'phone',
  'nomortelefon': 'phone',
  'nomorponsel': 'phone',
  'hpphone': 'phone',
  'hp': 'phone',
  'phonenumbercontact': 'phone',
  'contactnumber': 'phone',

  // Email
  'email': 'email',
  'emailaddress': 'email',
  'emailcontact': 'email',
  'contactemail': 'email',
  'emailperson': 'email',

  // Website
  'website': 'website',
  'webite': 'website',
  'web': 'website',
  'url': 'website',
  'websiteurl': 'website',
};

/**
 * Mapping untuk variasi istilah informasi perusahaan
 */
const COMPANY_FIELD_MAPPINGS: Record<string, string> = {
  'companyname': 'companyName',
  'company': 'companyName',
  'nama': 'companyName',
  'namapt': 'companyName',
  'naiperusahaan': 'companyName',

  'companyaddress': 'companyAddress',
  'address': 'companyAddress',
  'alamat': 'companyAddress',
  'ptaddress': 'companyAddress',

  'businessnature': 'businessNature',
  'businesstype': 'businessNature',
  'nature': 'businessNature',
  'jenisbisnis': 'businessNature',
  'jenisuaha': 'businessNature',

  'suppliertype': 'supplierType',
  'supplier': 'supplierType',
  'type': 'supplierType',
};

const BANK_NAME_TO_DROPDOWN: Record<string, string> = {
  bca: 'BCA',
  bankcentralasia: 'BCA',
  ptbankcentralasiatbk: 'BCA',
  centralasia: 'BCA',

  bni: 'BNI',
  banknegarainodnesia: 'BNI',
  banknegaraindonesia: 'BNI',
  ptbanknegaraindonesiaperserotbk: 'BNI',

  bri: 'BRI',
  bankrakyatindonesia: 'BRI',
  ptbankrakyatindonesiatbk: 'BRI',

  mandiri: 'Mandiri',
  bankmandiri: 'Mandiri',
  ptbankmandiri: 'Mandiri',
  ptbankmandiritbk: 'Mandiri',

  cimb: 'CIMB Niaga',
  cimbniaga: 'CIMB Niaga',
  niaga: 'CIMB Niaga',

  permata: 'Permata',
  bankpermata: 'Permata',
  ptbankpermata: 'Permata',
  ptbankpermatatbk: 'Permata',

  danamon: 'Danamon',
  bankdanamon: 'Danamon',
  ptbankdanamon: 'Danamon',
  ptbankdanamontbk: 'Danamon',
};

/**
 * Mapping untuk field bank information
 */
const BANK_FIELD_MAPPINGS: Record<string, string> = {
  'bankname': 'bankName',
  'bank': 'bankName',
  'namabank': 'bankName',

  'bankaccount': 'bankAccount',
  'accountnumber': 'bankAccount',
  'account': 'bankAccount',
  'nomorrekening': 'bankAccount',
  'rekening': 'bankAccount',

  'accountholder': 'accountHolder',
  'holder': 'accountHolder',
  'namapemilikrekening': 'accountHolder',
  'pemilikrekening': 'accountHolder',
  'atasnamapemilik': 'accountHolder',
  'atasnama': 'accountHolder',

  'bankbranch': 'bankBranch',
  'branch': 'bankBranch',
  'cabang': 'bankBranch',
  'namakantor': 'bankBranch',
};

/**
 * Normalisasi key name ke camelCase dan sanitasi
 */
function normalizeKeyName(key: string): string {
  if (!key) return '';

  // Remove special characters dan konversi ke lowercase
  let normalized = key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

  return normalized;
}

/**
 * Normalisasi string value - trim, handle encoding issues
 */
function normalizeStringValue(value: string): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Deteksi jenis field berdasarkan normalized key
 */
function detectFieldType(normalizedKey: string): {
  type: 'contact' | 'company' | 'bank' | 'document' | 'unknown';
  mappedKey?: string;
} {
  // Check contact fields
  if (normalizedKey in CONTACT_FIELD_MAPPINGS) {
    return { type: 'contact', mappedKey: CONTACT_FIELD_MAPPINGS[normalizedKey] };
  }

  // Check company fields
  if (normalizedKey in COMPANY_FIELD_MAPPINGS) {
    return { type: 'company', mappedKey: COMPANY_FIELD_MAPPINGS[normalizedKey] };
  }

  // Check bank fields
  if (normalizedKey in BANK_FIELD_MAPPINGS) {
    return { type: 'bank', mappedKey: BANK_FIELD_MAPPINGS[normalizedKey] };
  }

  // Check document fields
  if (['documentdate', 'date', 'tanggaldokumen', 'tanggal'].includes(normalizedKey)) {
    return { type: 'document', mappedKey: 'documentDate' };
  }
  if (['recipient', 'penerima', 'tujuan'].includes(normalizedKey)) {
    return { type: 'document', mappedKey: 'recipient' };
  }
  if (['currency', 'mata', 'matauan', 'idr', 'usd', 'eur'].includes(normalizedKey)) {
    return { type: 'document', mappedKey: 'currency' };
  }

  return { type: 'unknown' };
}

/**
 * Normalisasi bank name - recognize singkatan dan variasi
 */
function normalizeBankName(value: string): string {
  if (!value) return '';

  const original = normalizeStringValue(value);
  const normalized = normalizeKeyName(original);

  if (normalized in BANK_NAME_TO_DROPDOWN) {
    return BANK_NAME_TO_DROPDOWN[normalized];
  }

  if (normalized.includes('centralasia') || normalized.includes('bankcentralasia')) return 'BCA';
  if (normalized.includes('negarain') || normalized.includes('banknegarain') || normalized.includes('negaraindonesia')) return 'BNI';
  if (normalized.includes('rakyatindonesia') || normalized.includes('bankrakyatindonesia')) return 'BRI';
  if (normalized.includes('bankmandiri') || normalized.includes('mandiri')) return 'Mandiri';
  if (normalized.includes('cimb') || normalized.includes('niaga')) return 'CIMB Niaga';
  if (normalized.includes('permata')) return 'Permata';
  if (normalized.includes('danamon')) return 'Danamon';

  return 'Lainnya';
}

/**
 * Map rawData ke normalized OcrResult dengan support untuk berbagai variasi
 */
export function mapAndNormalizeOcrData(rawData: unknown): Record<string, any> {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return {};
  }

  const data = rawData as Record<string, any>;
  const result: Record<string, any> = {};
  const contactFields: Record<string, any> = {};
  let hasContactData = false;

  // Process each field dari raw data
  for (const [originalKey, originalValue] of Object.entries(data)) {
    // Skip empty atau null values
    if (originalValue === null || originalValue === undefined || originalValue === '') {
      continue;
    }

    // Skip empty objects/arrays
    if (
      (typeof originalValue === 'object' &&
        !Array.isArray(originalValue) &&
        Object.keys(originalValue).length === 0) ||
      (Array.isArray(originalValue) && originalValue.length === 0)
    ) {
      continue;
    }

    const normalizedKey = normalizeKeyName(originalKey);
    const fieldType = detectFieldType(normalizedKey);

    if (fieldType.type === 'contact') {
      // Map ke contact info
      const mappedKey = fieldType.mappedKey!;
      let value = originalValue;

      // Normalize string values
      if (typeof value === 'string') {
        value = normalizeStringValue(value);
      }

      if (value) {
        contactFields[mappedKey] = value;
        hasContactData = true;
      }
    } else if (fieldType.type === 'bank') {
      // Map field bank dengan normalisasi spesial untuk bank name
      const mappedKey = fieldType.mappedKey!;
      let value = originalValue;

      if (typeof value === 'string') {
        value = normalizeStringValue(value);

        // Special handling untuk bank name - normalize singkatan
        if (mappedKey === 'bankName') {
          const originalBankName = value;
          value = normalizeBankName(value);
          if (value === 'Lainnya') {
            result.bankNameFull = originalBankName;
          }
        }
      }

      if (value) {
        result[mappedKey] = value;
      }
    } else if (fieldType.type === 'company') {
      // Map field company
      const mappedKey = fieldType.mappedKey!;
      let value = originalValue;

      if (typeof value === 'string') {
        value = normalizeStringValue(value);
      }

      if (value) {
        result[mappedKey] = value;
      }
    } else if (fieldType.type === 'document') {
      // Map field document
      const mappedKey = fieldType.mappedKey!;
      let value = originalValue;

      if (typeof value === 'string') {
        value = normalizeStringValue(value);
      }

      if (value) {
        result[mappedKey] = value;
      }
    } else {
      // Unknown field - add as-is dengan camelCase key jika terlihat relevan
      // Convert key ke camelCase format
      const camelCaseKey = toCamelCase(originalKey);

      let value = originalValue;
      if (typeof value === 'string') {
        value = normalizeStringValue(value);
      }

      // Only add jika value significant
      if (value && typeof value !== 'object') {
        result[camelCaseKey] = value;
      } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
        result[camelCaseKey] = value;
      }
    }
  }

  // Tambahkan contact info jika ada data kontak
  if (hasContactData) {
    result.contactInfo = contactFields;
  }

  // Ensure core fields exist
  const coreFields = [
    'companyName',
    'companyAddress',
    'npwp',
    'nib',
    'bankName',
    'bankAccount',
    'accountHolder',
    'documentDate',
    'recipient',
    'bankBranch',
    'currency',
  ];

  for (const field of coreFields) {
    if (!(field in result)) {
      result[field] = null;
    }
  }

  return result;
}

/**
 * Convert string ke camelCase format
 * e.g., "contact person" -> "contactPerson", "contact_person" -> "contactPerson"
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s_-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
}

/**
 * Extract contact information dari berbagai struktur data
 */
export function extractContactInfo(data: Record<string, any>): Record<string, any> | null {
  const contactInfo = data.contactInfo;

  if (!contactInfo) {
    return null;
  }

  return {
    name: contactInfo.name ?? null,
    phone: contactInfo.phone ?? null,
    email: contactInfo.email ?? null,
    website: contactInfo.website ?? null,
  };
}
