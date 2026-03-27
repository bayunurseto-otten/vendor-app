export type DocumentType = 'vendor-form' | 'bank-statement' | 'anti-corruption';

export interface DocumentTemplate {
  type: DocumentType;
  title: string;
}

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  logoUrl?: string;
}
