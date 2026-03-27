export interface Vendor {
  id: string;
  companyName: string;
  companyAddress: string;
  contactPerson: string;
  phone: string;
  email: string;
  natureOfBusiness: string;
  supplierType: string;
  npwp: string;
  nib: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorFormData = Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>;
