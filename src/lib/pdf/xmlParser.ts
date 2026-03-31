/**
 * XML to Invoice parser for FatturaPA
 * Adapted from digital-invoice-to-pdf for browser use
 */

import type { Invoice, Company, Line, Installment, Payment, TaxSummary } from './types';

// Helper to safely get text content from a node
function getText(parent: Element | Document, selector: string): string | undefined {
  const el = parent.querySelector(selector);
  return el?.textContent?.trim() || undefined;
}

// Helper to get number from node
function getNumber(parent: Element | Document, selector: string, fallback = 0): number {
  const text = getText(parent, selector);
  return text ? parseFloat(text) : fallback;
}

// Parse company data from XML element
function parseCompany(companyEl: Element | null): Company {
  if (!companyEl) {
    return { vat: '', name: '' };
  }

  const denominazione = getText(companyEl, 'Denominazione');
  const nome = getText(companyEl, 'Nome');
  const cognome = getText(companyEl, 'Cognome');

  const name = denominazione || [nome, cognome].filter(Boolean).join(' ') || undefined;

  const vat = getText(companyEl, 'IdFiscaleIVA IdCodice') ||
              getText(companyEl, 'CodiceFiscale') || '';

  const company: Company = { vat, name };

  // Sede (address)
  const sede = companyEl.querySelector('Sede');
  if (sede) {
    company.office = {
      address: getText(sede, 'Indirizzo'),
      number: getText(sede, 'NumeroCivico'),
      cap: getText(sede, 'CAP'),
      city: getText(sede, 'Comune'),
      district: getText(sede, 'Provincia'),
      country: getText(sede, 'Nazione'),
    };
  }

  // Contatti
  const contatti = companyEl.querySelector('Contatti');
  if (contatti) {
    company.contacts = {
      tel: getText(contatti, 'Telefono'),
      email: getText(contatti, 'Email'),
    };
  }

  return company;
}

// Parse line item from XML element
function parseLine(lineEl: Element): Line {
  return {
    number: getNumber(lineEl, 'NumeroLinea', 1),
    description: getText(lineEl, 'Descrizione') || '',
    quantity: getNumber(lineEl, 'Quantita', 1),
    singlePrice: getNumber(lineEl, 'PrezzoUnitario'),
    amount: getNumber(lineEl, 'PrezzoTotale'),
    tax: getNumber(lineEl, 'AliquotaIVA'),
  };
}

// Parse installment (body) from XML element
function parseInstallment(bodyEl: Element): Installment {
  const generalData = bodyEl.querySelector('DatiGenerali DatiGeneraliDocumento');
  const beniServizi = bodyEl.querySelector('DatiBeniServizi');
  const pagamento = bodyEl.querySelector('DatiPagamento DettaglioPagamento');
  const riepilogo = bodyEl.querySelector('DatiBeniServizi DatiRiepilogo');

  // Parse lines
  const lineElements = beniServizi?.querySelectorAll('DettaglioLinee') || [];
  const lineElementsArray = Array.from(lineElements);
  const lines: Line[] = lineElementsArray.map(parseLine);

  // Detect multi-currency: check AltriDatiGestionali with TipoDato=VALUTA
  // When present, the XML amounts are in EUR but the original amounts are in foreign currency.
  // For the courtesy invoice (PDF), we want to show the original foreign currency amounts.
  let foreignCurrency: string | null = null;
  lineElementsArray.forEach((lineEl, idx) => {
    const altriDatiEls = lineEl.querySelectorAll('AltriDatiGestionali');
    for (const dati of Array.from(altriDatiEls)) {
      const tipoDato = getText(dati, 'TipoDato');
      if (tipoDato === 'VALUTA') {
        const refText = getText(dati, 'RiferimentoTesto') || '';
        const refNum = getNumber(dati, 'RiferimentoNumero');
        // Extract currency code (e.g., "GBP - Importo originale: 100.00" → "GBP")
        const currMatch = refText.match(/^([A-Z]{3})/);
        if (currMatch) foreignCurrency = currMatch[1];
        // Replace line amounts with original foreign currency values
        if (refNum > 0 && lines[idx]) {
          const qty = lines[idx].quantity || 1;
          lines[idx] = { ...lines[idx], amount: refNum, singlePrice: refNum / qty };
        }
      }
    }
  });

  // Parse tax summary
  const taxSummary: TaxSummary = {
    taxPercentage: getNumber(riepilogo || bodyEl, 'AliquotaIVA'),
    taxAmount: getNumber(riepilogo || bodyEl, 'Imposta'),
    paymentAmount: getNumber(riepilogo || bodyEl, 'ImponibileImporto'),
    legalRef: getText(riepilogo || bodyEl, 'RiferimentoNormativo'),
  };

  // Parse payment
  let payment: Payment | undefined;
  if (pagamento) {
    payment = {
      amount: getNumber(pagamento, 'ImportoPagamento'),
      iban: getText(pagamento, 'IBAN'),
      method: getText(pagamento, 'ModalitaPagamento'),
      bank: getText(pagamento, 'IstitutoFinanziario'),
    };
    const dataScadenza = getText(pagamento, 'DataScadenzaPagamento');
    if (dataScadenza) {
      payment.regularPaymentDate = new Date(dataScadenza);
    }
  }

  // Parse date
  const dataStr = getText(generalData || bodyEl, 'Data');
  const issueDate = dataStr ? new Date(dataStr) : new Date();

  // Parse bollo (stamp duty)
  const bolloStr = getText(generalData || bodyEl, 'DatiBollo ImportoBollo');
  const stampDuty = bolloStr ? parseFloat(bolloStr) : undefined;

  // Determine currency and totals
  // If foreign currency detected, use original amounts; otherwise use XML EUR amounts
  let currency = getText(generalData || bodyEl, 'Divisa') || 'EUR';
  let totalAmount: number;

  if (foreignCurrency) {
    currency = foreignCurrency;
    // Recalculate totals from foreign currency line amounts
    const foreignTotal = lines.reduce((sum, l) => sum + l.amount, 0);
    totalAmount = foreignTotal;
    taxSummary.paymentAmount = foreignTotal;
    if (payment) {
      payment.amount = foreignTotal;
    }
  } else {
    totalAmount = getNumber(generalData || bodyEl, 'ImportoTotaleDocumento') ||
                  (payment?.amount) ||
                  lines.reduce((sum, l) => sum + l.amount, 0);
  }

  // Parse causale (can be multiple)
  const causaleEls = generalData?.querySelectorAll('Causale') || [];
  const description = Array.from(causaleEls).map(el => el.textContent).join(' ').trim() || undefined;

  // Parse attachments
  const allegatoEls = bodyEl.querySelectorAll('Allegati');
  const attachments = allegatoEls.length > 0
    ? Array.from(allegatoEls).map(el => ({
        name: getText(el, 'NomeAttachment') || '',
        description: getText(el, 'DescrizioneAttachment') || '',
      }))
    : undefined;

  return {
    number: getText(generalData || bodyEl, 'Numero') || '',
    currency,
    totalAmount,
    issueDate,
    description,
    lines,
    taxSummary,
    payment,
    stampDuty,
    attachments,
  };
}

/**
 * Parse FatturaPA XML string into Invoice structure
 */
export function parseXmlToInvoice(xmlContent: string): Invoice {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Errore parsing XML: ' + parseError.textContent);
  }

  // Get header
  const header = doc.querySelector('FatturaElettronicaHeader');

  // Parse companies
  const invoicer = parseCompany(header?.querySelector('CedentePrestatore') || null);
  const invoicee = parseCompany(header?.querySelector('CessionarioCommittente') || null);
  const thirdPartyEl = header?.querySelector('TerzoIntermediarioOSoggettoEmittente');
  const thirdParty = thirdPartyEl ? parseCompany(thirdPartyEl) : undefined;

  // Parse body (installments)
  const bodyElements = doc.querySelectorAll('FatturaElettronicaBody');
  const installments = Array.from(bodyElements).map(parseInstallment);

  // If no body found, try to create one from the root
  if (installments.length === 0) {
    installments.push(parseInstallment(doc.documentElement));
  }

  return {
    invoicer,
    invoicee,
    thirdParty,
    installments,
  };
}

/**
 * Validate that an Invoice has minimum required data for PDF generation
 */
export function validateInvoice(invoice: Invoice): string[] {
  const errors: string[] = [];

  if (!invoice.invoicer.name && !invoice.invoicer.vat) {
    errors.push('Mancano i dati del fornitore');
  }

  if (!invoice.invoicee.name && !invoice.invoicee.vat) {
    errors.push('Mancano i dati del cliente');
  }

  if (invoice.installments.length === 0) {
    errors.push('Nessuna fattura trovata nel file');
  }

  for (let i = 0; i < invoice.installments.length; i++) {
    const inst = invoice.installments[i];
    if (!inst.number) {
      errors.push(`Fattura ${i + 1}: manca il numero`);
    }
    if (inst.lines.length === 0) {
      errors.push(`Fattura ${i + 1}: nessuna riga`);
    }
  }

  return errors;
}
