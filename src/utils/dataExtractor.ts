import type { DigitalInvoiceJson } from '../types/DigitalInvoiceJson';
import type { DigitalInvoice, Address, Party, LineItem, TaxSummary, PaymentDetails } from '../types/DigitalInvoice';

// Helper function to safely extract first array element
const getFirst = <T,>(arr: T[] | undefined): T | undefined => {
  return arr && arr.length > 0 ? arr[0] : undefined;
};

// Helper to get text from array
const getText = (arr: string[] | undefined): string | undefined => {
  return arr && arr.length > 0 ? arr[0] : undefined;
};

const extractAddress = (sede: any): Address | undefined => {
  if (!sede || !sede.length) return undefined;
  const s = sede[0];
  return {
    street: getText(s.Indirizzo),
    city: getText(s.Comune),
    postalCode: getText(s.CAP),
    province: getText(s.Provincia),
    country: getText(s.Nazione)
  };
};

const extractParty = (party: any): Party | undefined => {
  if (!party || !party.length) return undefined;
  const p = party[0];
  const anagrafica = getFirst(p.DatiAnagrafici);
  const anag = anagrafica ? getFirst(anagrafica.Anagrafica) : undefined;
  const idFiscale = anagrafica ? getFirst(anagrafica.IdFiscaleIVA) : undefined;
  
  let name = '';
  if (anag) {
    name = getText(anag.Denominazione) || '';
    if (!name && anag.Nome && anag.Cognome) {
      const nome = getText(anag.Nome) || '';
      const cognome = getText(anag.Cognome) || '';
      name = `${nome} ${cognome}`.trim();
    }
  }
  
  let vatNumber = '';
  if (idFiscale) {
    const paese = getText(idFiscale.IdPaese) || '';
    const codice = getText(idFiscale.IdCodice) || '';
    vatNumber = paese && codice ? `${paese}${codice}` : codice;
  }
  
  return {
    name: name || undefined,
    vatNumber: vatNumber || undefined,
    taxCode: anagrafica ? getText(anagrafica.CodiceFiscale) : undefined,
    address: extractAddress(p.Sede)
  };
};

export default function dataExtractor(json: DigitalInvoiceJson): DigitalInvoice {
  const fattura = json.FatturaElettronica;
  if (!fattura) {
    return {};
  }
  
  const header = getFirst(fattura.FatturaElettronicaHeader);
  const body = getFirst(fattura.FatturaElettronicaBody);
  
  // Extract parties
  const supplier = header ? extractParty(header.CedentePrestatore) : undefined;
  const customer = header ? extractParty(header.CessionarioCommittente) : undefined;
  
  // Extract intermediary if present
  let intermediary: Party | undefined;
  if (header && header.TerzoIntermediarioOSoggettoEmittente) {
    const terzo = getFirst(header.TerzoIntermediarioOSoggettoEmittente);
    if (terzo) {
      const anagrafica = getFirst(terzo.DatiAnagrafici);
      const anag = anagrafica ? getFirst(anagrafica.Anagrafica) : undefined;
      if (anag) {
        const name = getText(anag.Denominazione) || '';
        intermediary = { name: name || undefined };
      }
    }
  }
  
  // Extract general document data
  const datiGenerali = body ? getFirst(body.DatiGenerali) : undefined;
  const datiDoc = datiGenerali ? getFirst(datiGenerali.DatiGeneraliDocumento) : undefined;
  
  const number = datiDoc ? getText(datiDoc.Numero) : undefined;
  const date = datiDoc ? getText(datiDoc.Data) : undefined;
  const cause = datiDoc ? getText(datiDoc.Causale) : undefined;
  
  // Extract stamp duty
  let stampDuty: number | undefined;
  if (datiDoc && datiDoc.DatiBollo) {
    const bollo = getFirst(datiDoc.DatiBollo);
    if (bollo && bollo.ImportoBollo) {
      stampDuty = parseFloat(getText(bollo.ImportoBollo) || '0');
    }
  }
  
  // Extract line items
  const lineItems: LineItem[] = [];
  const datiBeniServizi = body ? getFirst(body.DatiBeniServizi) : undefined;
  if (datiBeniServizi && datiBeniServizi.DettaglioLinee) {
    for (const linea of datiBeniServizi.DettaglioLinee) {
      const item: LineItem = {
        number: getText(linea.NumeroLinea),
        description: getText(linea.Descrizione),
        quantity: linea.Quantita ? parseFloat(getText(linea.Quantita) || '0') : undefined,
        unitPrice: linea.PrezzoUnitario ? parseFloat(getText(linea.PrezzoUnitario) || '0') : undefined,
        amount: linea.PrezzoTotale ? parseFloat(getText(linea.PrezzoTotale) || '0') : undefined,
        vatRate: linea.AliquotaIVA ? parseFloat(getText(linea.AliquotaIVA) || '0') : undefined
      };
      lineItems.push(item);
    }
  }
  
  // Extract tax summaries
  const taxSummaries: TaxSummary[] = [];
  if (datiBeniServizi && datiBeniServizi.DatiRiepilogo) {
    for (const riepilogo of datiBeniServizi.DatiRiepilogo) {
      const summary: TaxSummary = {
        taxableAmount: parseFloat(getText(riepilogo.ImponibileImporto) || '0'),
        vatRate: parseFloat(getText(riepilogo.AliquotaIVA) || '0'),
        vatAmount: parseFloat(getText(riepilogo.Imposta) || '0')
      };
      taxSummaries.push(summary);
    }
  }
  
  // Calculate totals
  const totalProductsServices = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTax = taxSummaries.reduce((sum, ts) => sum + ts.vatAmount, 0);
  const total = totalProductsServices + totalTax + (stampDuty || 0);
  
  // Extract payment details
  let paymentDetails: PaymentDetails | undefined;
  const datiPagamento = body ? getFirst(body.DatiPagamento) : undefined;
  if (datiPagamento && datiPagamento.DettaglioPagamento) {
    const dettaglio = getFirst(datiPagamento.DettaglioPagamento);
    if (dettaglio) {
      paymentDetails = {
        method: getText(dettaglio.ModalitaPagamento),
        iban: getText(dettaglio.IBAN),
        bank: getText(dettaglio.IstitutoFinanziario),
        dueDate: getText(dettaglio.DataScadenzaPagamento)
      };
    }
  }
  
  return {
    number,
    date,
    supplier,
    customer,
    intermediary,
    lineItems: lineItems.length > 0 ? lineItems : undefined,
    taxSummaries: taxSummaries.length > 0 ? taxSummaries : undefined,
    stampDuty,
    totalProductsServices,
    totalTax,
    total,
    paymentDetails,
    cause
  };
}
