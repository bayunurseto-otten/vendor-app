export type FieldType = 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'date' | 'file';

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // for dropdown
  placeholder?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  fields: FormField[];
  createdAt: string;
}
