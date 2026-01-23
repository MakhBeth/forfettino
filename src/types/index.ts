// Type definitions for Forfettino

// Special client ID for vacation/holiday entries (not shown in client list)
export const VACATION_CLIENT_ID = '__vacation__';

export type StoreName = 'config' | 'clienti' | 'fatture' | 'workLogs' | 'scadenze';

export interface Cliente {
  id: string;
  nome: string;
  piva?: string;
  email?: string;
  billingUnit?: 'ore' | 'giornata';
  rate?: number;
  billingStartDate?: string; // YYYY-MM-DD
  color?: string; // Hex color for calendar display
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
  iban?: string;
  courtesyInvoice?: CourtesyInvoiceConfig;
  emittente?: EmittenteConfig;
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

// Configurazione emittente per fatture XML FatturaPA
export interface EmittenteConfig {
  // Dati anagrafici
  codiceFiscale: string;
  nome: string;
  cognome: string;
  // Sede
  indirizzo: string;
  numeroCivico: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
}

// Riga fattura per generazione XML
export interface NuovaFatturaRiga {
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
}

// Draft per nuova fattura XML
export interface NuovaFatturaDraft {
  clienteId: string;
  numero: string;
  data: string; // YYYY-MM-DD
  righe: NuovaFatturaRiga[];
}

// Payment Scheduling Types (Regime Forfettario)
export interface PaymentScheduleInput {
  totalTaxSaldo: number;         // Balance for previous year (IRPEF)
  totalTax1stAcconto: number;    // 40% Tax Advance
  totalTax2ndAcconto: number;    // 60% Tax Advance
  totalInpsSaldo: number;        // Social Security Balance
  totalInps1stAcconto: number;   // 40% INPS Advance
  totalInps2ndAcconto: number;   // 60% INPS Advance
  numberOfTranches: 1 | 2 | 3 | 4 | 5 | 6;
  fiscalYear: number;
}

export interface PaymentComponents {
  taxSaldo: number;
  taxAcconto: number;
  inpsSaldo: number;
  inpsAcconto: number;
}

export interface PaymentScheduleItem {
  date: string; // YYYY-MM-DD
  label: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  components: PaymentComponents;
}

export type ScadenzaTipo = 'saldo_irpef' | 'acconto_irpef' | 'saldo_inps' | 'acconto_inps';

export interface Scadenza {
  id: string;
  visibleId: string;
  annoRiferimento: number;
  annoVersamento: number;
  date: string; // YYYY-MM-DD
  tipo: ScadenzaTipo;
  label: string;
  importo: number;
  interessi: number;
  totale: number;
  pagato: boolean;
  dataPagamento?: string; // YYYY-MM-DD
  trancheIndex?: number;
  totalTranches?: number;
  // Acconti values used when generating this scadenza (for display/regeneration)
  accontiIrpefUsed?: number;
  accontiInpsUsed?: number;
}
