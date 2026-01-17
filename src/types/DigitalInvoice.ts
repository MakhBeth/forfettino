export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
}

export interface Party {
  name?: string;
  vatNumber?: string;
  taxCode?: string;
  address?: Address;
}

export interface LineItem {
  number?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  vatRate?: number;
  vatAmount?: number;
}

export interface TaxSummary {
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
}

export interface PaymentDetails {
  method?: string;
  iban?: string;
  bank?: string;
  dueDate?: string;
}

export interface DigitalInvoice {
  number?: string;
  date?: string;
  supplier?: Party;
  customer?: Party;
  intermediary?: Party;
  lineItems?: LineItem[];
  taxSummaries?: TaxSummary[];
  stampDuty?: number;
  totalProductsServices?: number;
  totalTax?: number;
  total?: number;
  paymentDetails?: PaymentDetails;
  cause?: string;
}
