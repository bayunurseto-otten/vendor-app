import type { Vendor } from '../types/vendor';
import type { FormTemplate } from '../types/form';
import type { CompanySettings } from '../types/document';

const KEYS = {
  vendors: 'vendors',
  formTemplates: 'form_templates',
  companySettings: 'company_settings',
};

// --- Vendors ---
export function getVendors(): Vendor[] {
  const raw = localStorage.getItem(KEYS.vendors);
  return raw ? JSON.parse(raw) : [];
}

export function saveVendor(vendor: Vendor): void {
  const vendors = getVendors();
  const index = vendors.findIndex(v => v.id === vendor.id);
  if (index >= 0) {
    vendors[index] = vendor;
  } else {
    vendors.push(vendor);
  }
  localStorage.setItem(KEYS.vendors, JSON.stringify(vendors));
}

export function deleteVendor(id: string): void {
  const vendors = getVendors().filter(v => v.id !== id);
  localStorage.setItem(KEYS.vendors, JSON.stringify(vendors));
}

export function getVendorById(id: string): Vendor | undefined {
  return getVendors().find(v => v.id === id);
}

// --- Form Templates ---
export function getFormTemplates(): FormTemplate[] {
  const raw = localStorage.getItem(KEYS.formTemplates);
  return raw ? JSON.parse(raw) : [];
}

export function saveFormTemplate(template: FormTemplate): void {
  const templates = getFormTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(KEYS.formTemplates, JSON.stringify(templates));
}

export function deleteFormTemplate(id: string): void {
  const templates = getFormTemplates().filter(t => t.id !== id);
  localStorage.setItem(KEYS.formTemplates, JSON.stringify(templates));
}

// --- Company Settings ---
export function getCompanySettings(): CompanySettings {
  const raw = localStorage.getItem(KEYS.companySettings);
  return raw ? JSON.parse(raw) : {
    companyName: 'PT. Otten Coffee Indonesia',
    companyAddress: 'Jakarta, Indonesia',
  };
}

export function saveCompanySettings(settings: CompanySettings): void {
  localStorage.setItem(KEYS.companySettings, JSON.stringify(settings));
}
