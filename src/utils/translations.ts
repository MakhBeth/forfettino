// Translations for PDF invoice generation
export interface Translations {
  invoicerData: string;
  invoiceeData: string;
  invoiceNumber: string;
  invoiceDate: string;
  productsAndServices: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  total: string;
  totalBeforeVat: string;
  totalVat: string;
  vatSummary: string;
  paymentDetails: string;
  paymentMethod: string;
  iban: string;
  dueDate: string;
  totalAmount: string;
  stampDuty: string;
  digitalInvoiceGeneratedBy: string;
}

export const translations: Record<'it' | 'de', Translations> = {
  it: {
    invoicerData: 'Dati fornitore',
    invoiceeData: 'Dati cliente',
    invoiceNumber: 'Numero',
    invoiceDate: 'Data',
    productsAndServices: 'Prodotti e servizi',
    description: 'Descrizione',
    quantity: 'Quantità',
    unitPrice: 'Prezzo unitario',
    vatRate: 'IVA',
    total: 'Totale',
    totalBeforeVat: 'Totale imponibile',
    totalVat: 'Totale IVA',
    vatSummary: 'Riepilogo IVA',
    paymentDetails: 'Dettagli pagamento',
    paymentMethod: 'Metodo di pagamento',
    iban: 'IBAN',
    dueDate: 'Scadenza',
    totalAmount: 'Importo',
    stampDuty: 'Imposta di bollo',
    digitalInvoiceGeneratedBy: 'Fattura digitale generata da'
  },
  de: {
    invoicerData: 'Lieferantendaten',
    invoiceeData: 'Kundendaten',
    invoiceNumber: 'Nummer',
    invoiceDate: 'Datum',
    productsAndServices: 'Produkte und Dienstleistungen',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    vatRate: 'MwSt',
    total: 'Gesamt',
    totalBeforeVat: 'Zwischensumme',
    totalVat: 'MwSt Gesamt',
    vatSummary: 'MwSt Zusammenfassung',
    paymentDetails: 'Zahlungsdetails',
    paymentMethod: 'Zahlungsmethode',
    iban: 'IBAN',
    dueDate: 'Fälligkeit',
    totalAmount: 'Betrag',
    stampDuty: 'Stempelsteuer',
    digitalInvoiceGeneratedBy: 'Digitale Rechnung erstellt von'
  }
};
