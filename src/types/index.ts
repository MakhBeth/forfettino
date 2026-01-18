// Type definitions for ForfettAIro

export type StoreName = 'config' | 'clienti' | 'fatture' | 'workLogs';

export interface Cliente {
  id: string;
  nome: string;
  piva?: string;
  email?: string;
  billingUnit?: 'ore' | 'giornata';
  rate?: number;
  billingStartDate?: string; // YYYY-MM-DD
}

export interface Fattura {
  id: string;
  numero?: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  dataIncasso?: string;
  importo: number;
  duplicateKey?: string;
}

export interface WorkLog {
  id: string;
  clienteId: string;
  data: string;
  ore?: string; // Legacy field, kept for backward compatibility
  tipo: 'ore' | 'giornata';
  quantita?: number; // Fractional quantity (hours or days)
  note?: string;
}

export interface Config {
  id: string;
  coefficiente: number;
  aliquota: number;
  ateco: string[];
  aliquotaOverride: number | null;
  nomeAttivita?: string;
  partitaIva?: string;
  annoApertura: number;
  codiciAteco: string[];
  courtesyInvoice?: CourtesyInvoiceConfig;
}

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

export interface ImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
  failedFiles: Array<{ filename: string; error: string }>;
}

// Courtesy Invoice Types
export interface ServiceTemplate {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface CourtesyInvoiceConfig {
  // Branding
  logoBase64?: string;
  logoMimeType?: string;
  primaryColor: string;
  textColor: string;

  // Company info
  companyName: string;
  vatNumber: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  iban?: string;
  bankName?: string;

  // Service templates
  defaultServices: ServiceTemplate[];

  // Settings
  includeFooter: boolean;
  footerText?: string;
  footerLink?: string;
  locale: string;
}

export interface CourtesyInvoiceLine {
  id: string;
  number: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface CourtesyInvoiceDraft {
  number: string;
  issueDate: Date;
  dueDate?: Date;
  clientId?: string;
  clientName: string;
  clientVat?: string;
  clientAddress?: string;
  description?: string;
  lines: CourtesyInvoiceLine[];
  paymentMethod?: string;
}
