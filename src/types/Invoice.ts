// Type definitions for PDF invoice generation
export interface Company {
  name: string;
  vat?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  pec?: string;
}

export interface Line {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Installment {
  number: string;
  issueDate: string;
  dueDate?: string;
  paymentMethod?: string;
  iban?: string;
  totalAmount: number;
}

export interface Payment {
  method: string;
  iban?: string;
  conditions?: string;
}

export interface Tax {
  rate: number;
  base: number;
  amount: number;
}

export interface Invoice {
  invoicer: Company;
  invoicee: Company;
  installment: Installment;
  lines: Line[];
  taxes: Tax[];
  payment?: Payment;
  totalBeforeVat: number;
  totalVat: number;
  totalAmount: number;
  stampDuty?: number;
  notes?: string;
}

export interface FatturaSettings {
  id: string;
  colors: {
    primary: string;
    text: string;
    lighterText: string;
    footerText: string;
    lighterGray: string;
    tableHeader: string;
  };
  headingImage?: string; // base64
  footer: boolean;
  createdByText: string;
  createdByLink: string;
  defaultLocale: 'it' | 'de';
}

export const DEFAULT_FATTURA_SETTINGS: FatturaSettings = {
  id: 'main',
  colors: {
    primary: '#6699cc',
    text: '#033243',
    lighterText: '#476976',
    footerText: '#8CA1A9',
    lighterGray: '#E8ECED',
    tableHeader: '#D1D9DC'
  },
  footer: true,
  createdByText: 'Davide Di Pumpo',
  createdByLink: 'mailto:davide.dipumpo@gmail.com',
  defaultLocale: 'it'
};
