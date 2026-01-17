// @ts-nocheck
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './pdfRenderer';
import { Invoice, FatturaSettings, Company, Line, Tax } from '../types/Invoice';

// Types from the main app
interface Fattura {
  id: string;
  numero?: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  dataIncasso?: string;
  importo: number;
}

interface Cliente {
  id: string;
  nome: string;
  piva?: string;
  email?: string;
}

interface Config {
  id: string;
  nomeAttivita?: string;
  partitaIva?: string;
}

/**
 * Convert app's fattura data to PDF Invoice format
 */
export function convertFatturaToInvoice(
  fattura: Fattura,
  cliente: Cliente,
  config: Config
): Invoice {
  // Invoicer (fornitore - the user)
  const invoicer: Company = {
    name: config.nomeAttivita || 'Attività',
    vat: config.partitaIva || ''
  };

  // Invoicee (cliente)
  const invoicee: Company = {
    name: cliente.nome,
    vat: cliente.piva || '',
    email: cliente.email || ''
  };

  // Create a simple line item for the invoice amount
  // Since forfettAIro doesn't store detailed line items, we create a generic one
  const lines: Line[] = [
    {
      description: `Fattura ${fattura.numero || 'N/A'}`,
      quantity: 1,
      unitPrice: fattura.importo,
      vatRate: 0, // Forfettario regime has no VAT
      total: fattura.importo
    }
  ];

  // No VAT for regime forfettario
  const taxes: Tax[] = [];

  // Payment info (optional)
  const payment = undefined; // Can be extended in the future

  const invoice: Invoice = {
    invoicer,
    invoicee,
    installment: {
      number: fattura.numero || 'N/A',
      issueDate: fattura.data,
      dueDate: fattura.dataIncasso,
      totalAmount: fattura.importo
    },
    lines,
    taxes,
    payment,
    totalBeforeVat: fattura.importo,
    totalVat: 0,
    totalAmount: fattura.importo,
    notes: 'Operazione effettuata ai sensi dell\'articolo 1, commi da 54 a 89, della Legge n. 190/2014 - Regime forfettario - Operazione senza applicazione dell\'IVA ai sensi dell\'art. 1, comma 58, Legge n. 190/2014'
  };

  return invoice;
}

/**
 * Generate and download PDF invoice
 */
export async function generateInvoicePDF(
  fattura: Fattura,
  cliente: Cliente,
  config: Config,
  settings: FatturaSettings
): Promise<void> {
  try {
    // Convert fattura to invoice format
    const invoice = convertFatturaToInvoice(fattura, cliente, config);

    // Generate PDF
    const blob = await pdf(<InvoicePDF invoice={invoice} settings={settings} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const fileName = `fattura_${fattura.numero || 'NA'}_${fattura.data.replace(/-/g, '')}.pdf`;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Errore generazione PDF: ' + (error?.message || 'errore sconosciuto'));
  }
}
