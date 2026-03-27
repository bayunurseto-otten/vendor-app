import axios from 'axios';
import { mapAndNormalizeOcrData } from '../utils/dataMapper';

const N8N_WEBHOOK_URL = (import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim();
const N8N_TELEGRAM_WEBHOOK_URL = (import.meta.env.VITE_N8N_TELEGRAM_WEBHOOK_URL || '').trim();

/**
 * Core fields yang selalu ada dalam OCR result
 * Support nested objects seperti contactInfo, dan field dinamis lainnya
 */
export interface OcrResult {
  // Company Information
  companyName?: string | null;
  companyAddress?: string | null;
  businessNature?: string | null;

  // Government Identifiers
  npwp?: string | null;
  nib?: string | null;

  // Bank Information
  bankName?: string | null;
  bankAccount?: string | null;
  accountHolder?: string | null;
  bankBranch?: string | null;

  // Document Information
  documentDate?: string | null;
  recipient?: string | null;
  currency?: string | null;

  // Contact Information (nested)
  contactInfo?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    [key: string]: any;
  } | null;

  // Support untuk field dan nested object dinamis lainnya
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Generate system prompt untuk AI model agar menghasilkan JSON extraction yang konsisten
 * Instruksi ini dikirim ke n8n workflow untuk memandu AI dalam ekstraksi data
 */
export function generateOcrExtractionPrompt(): string {
  return `You are an OCR system that extracts data from vendor documents.

EXTRACTION RULES:
1. Extract ALL relevant information found in the document
2. Use ONLY English keys with camelCase format (e.g., companyName, contactPerson, bankAccount)
3. Group related information into nested objects when applicable:
   - contactInfo: for contact details (name, phone, email, website)
   - bankInfo: for bank details if multiple pieces

4. Recognize and normalize variations:
   CONTACT FIELDS: Contact Person, PIC, Phone, Mobile, Email, Website
   Map to: name, phone, email, website in contactInfo

   BANK NAMES: Recognize abbreviations and full names:
   - BCA = Bank Central Asia
   - BNI = Bank Negara Indonesia
   - BRI = Bank Rakyat Indonesia
   - Mandiri = Bank Mandiri
   - CIMB = CIMB Niaga
   - Permata = Bank Permata
   - Danamon = Bank Danamon
   Always use full bank name in output

5. Core fields (use when found):
   - companyName, companyAddress, npwp, nib
   - bankName, bankAccount, accountHolder, bankBranch
   - documentDate, recipient, currency
   - contactInfo: {name, phone, email, website}

6. Additional fields: Extract any other relevant information dynamically

7. Value normalization:
   - Trim whitespace from all strings
   - Use null for missing or empty values (NOT empty strings)
   - Format phone numbers consistently (keep original if unclear)

8. Output format:
   Return ONLY valid JSON object.
   Do NOT include markdown formatting (no \`\`\`json or \`\`\`).
   Do NOT include any explanatory text.
   Do NOT include comments.

EXAMPLE OUTPUT FORMAT:
{
  "companyName": "PT Otten Coffee Indonesia",
  "companyAddress": "Jl. Example No. 123",
  "npwp": null,
  "nib": null,
  "bankName": "Bank Central Asia",
  "bankAccount": "0069993666",
  "accountHolder": "PT Otten Coffee Indonesia",
  "bankBranch": "SCBD",
  "documentDate": "13 Februari 2026",
  "recipient": "ASCOTT COMPANY",
  "currency": "IDR",
  "contactInfo": {
    "name": "John Doe",
    "phone": "0804-1-999-666",
    "email": "customer.care@domain.co.id",
    "website": "www.domain.co.id"
  }
}
`;
}

export async function sendFileForOcr(file: File): Promise<OcrResult> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('OCR belum dikonfigurasi. Set VITE_N8N_WEBHOOK_URL di .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name);
  formData.append('fileType', file.type);

  try {
    const response = await axios.post<unknown>(N8N_WEBHOOK_URL, formData, {
      timeout: 60000,
    });

    const data = response.data;
    let rawOcrData: unknown = data;

    // Parse respons jika dalam format string
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (!trimmed) throw new Error('OCR tidak mengembalikan data.');
      try {
        rawOcrData = JSON.parse(trimmed);
      } catch {
        throw new Error('OCR mengembalikan respons non-JSON.');
      }
    }

    // Ekstrak data dari nested structure jika ada
    if (rawOcrData && typeof rawOcrData === 'object' && !Array.isArray(rawOcrData)) {
      if ('data' in rawOcrData) {
        const nested = (rawOcrData as { data?: unknown }).data;
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
          rawOcrData = nested;
        }
      }
    } else if (!rawOcrData || typeof rawOcrData !== 'object' || Array.isArray(rawOcrData)) {
      throw new Error('OCR mengembalikan format data yang tidak dikenali.');
    }

    // Map dan normalisasi data OCR menggunakan intelligent mapper
    // yang mengenali berbagai variasi istilah dan format
    const mappedData = mapAndNormalizeOcrData(rawOcrData);
    const normalizedResult = mappedData as OcrResult;

    return normalizedResult;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as unknown;
      const headers = err.response?.headers as Record<string, unknown> | undefined;
      const requestIdHeader = headers?.['x-request-id'];
      const requestId = typeof requestIdHeader === 'string' ? requestIdHeader : undefined;
      let serverMessage: string | undefined;
      if (typeof data === 'string') {
        serverMessage = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === 'string') serverMessage = message;
      }

      throw new Error(
        status
          ? `Gagal memproses OCR (HTTP ${status})${requestId ? `, requestId ${requestId}` : ''}${serverMessage ? `: ${serverMessage}` : ''}`
          : `Gagal memproses OCR: ${err.message}`,
      );
    }

    throw err instanceof Error ? err : new Error('Gagal memproses OCR.');
  }
}

export async function sendPdfToTelegram(
  file: File,
  meta?: { vendorId?: string; docType?: string; companyName?: string; caption?: string },
): Promise<void> {
  if (!N8N_TELEGRAM_WEBHOOK_URL) {
    throw new Error('Webhook Telegram belum dikonfigurasi. Set VITE_N8N_TELEGRAM_WEBHOOK_URL di .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name);
  formData.append('fileType', file.type);
  if (meta?.vendorId) formData.append('vendorId', meta.vendorId);
  if (meta?.docType) formData.append('docType', meta.docType);
  if (meta?.companyName) formData.append('companyName', meta.companyName);
  if (meta?.caption) formData.append('caption', meta.caption);

  try {
    await axios.post(N8N_TELEGRAM_WEBHOOK_URL, formData, { timeout: 60000 });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as unknown;
      let serverMessage: string | undefined;
      if (typeof data === 'string') {
        serverMessage = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === 'string') serverMessage = message;
      }

      throw new Error(
        status
          ? `Gagal kirim Telegram (HTTP ${status})${serverMessage ? `: ${serverMessage}` : ''}`
          : `Gagal kirim Telegram: ${err.message}`,
      );
    }

    throw err instanceof Error ? err : new Error('Gagal kirim Telegram.');
  }
}
