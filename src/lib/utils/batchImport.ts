import type { Fattura, Cliente, ImportSummary } from '../../types';
import type { IndexedDBManager } from '../db/IndexedDBManager';

// Generate unique ID for entities
export const generateUniqueId = (index: number): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${index}`;
};

// Compute duplicate key: normalize invoice number + date + amount
export const computeDuplicateKey = (numero: string | undefined, data: string, importo: number): string => {
  const normalizedNumero = (numero || '').trim();
  const date = new Date(data);
  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error('Data fattura non valida');
  }
  const normalizedData = date.toISOString().split('T')[0]; // yyyy-mm-dd
  const normalizedImporto = importo.toFixed(2);
  return `${normalizedNumero}|${normalizedData}|${normalizedImporto}`;
};

// Get duplicate key for existing fattura (compute on-the-fly if missing for backward compatibility)
export const getDuplicateKey = (fattura: Fattura): string => {
  if (fattura.duplicateKey) return fattura.duplicateKey;
  return computeDuplicateKey(fattura.numero, fattura.data, fattura.importo);
};

// Types without userId for batch import (userId will be added by hooks)
type NewCliente = Omit<Cliente, 'userId'>;
type NewFattura = Omit<Fattura, 'userId'>;

// Shared function to process batch import
// dbManager is optional - if null, DB save is skipped (caller handles persistence)
export const processBatchXmlFiles = async (
  xmlFiles: Array<{ name: string; content: string }>,
  existingFatture: Fattura[],
  existingClienti: Cliente[],
  parseFatturaXML: (xmlContent: string) => any,
  dbManager?: IndexedDBManager | null
): Promise<{
  summary: ImportSummary;
  newFatture: NewFattura[];
  newClienti: NewCliente[];
}> => {
  const summary: ImportSummary = {
    total: xmlFiles.length,
    imported: 0,
    duplicates: 0,
    failed: 0,
    failedFiles: []
  };

  const newFatture: NewFattura[] = [];
  const newClienti: NewCliente[] = [];
  const existingDuplicateKeys = new Set(existingFatture.map(f => getDuplicateKey(f)));

  for (let i = 0; i < xmlFiles.length; i++) {
    const { name, content } = xmlFiles[i];
    try {
      // Check if file content is missing (read error)
      if (!content) {
        summary.failed++;
        summary.failedFiles.push({ filename: name, error: 'Impossibile leggere il file' });
        continue;
      }

      const parsed = parseFatturaXML(content);

      if (!parsed) {
        summary.failed++;
        summary.failedFiles.push({ filename: name, error: 'Errore parsing XML' });
        continue;
      }

      // Check for duplicate - catch errors from invalid dates
      let duplicateKey: string;
      try {
        duplicateKey = computeDuplicateKey(parsed.numero, parsed.data, parsed.importo);
      } catch (error: any) {
        summary.failed++;
        summary.failedFiles.push({
          filename: name,
          error: error?.message || String(error) || 'Errore validazione dati'
        });
        continue;
      }

      if (existingDuplicateKeys.has(duplicateKey)) {
        summary.duplicates++;
        continue;
      }

      // Mark as processed to avoid duplicates within the batch
      existingDuplicateKeys.add(duplicateKey);

      // Find or create cliente
      let clienteId = existingClienti.find(c => c.piva === parsed.clientePiva)?.id;
      if (!clienteId) {
        clienteId = newClienti.find(c => c.piva === parsed.clientePiva)?.id;
      }

      if (!clienteId && parsed.clienteNome) {
        const nuovoCliente: NewCliente = {
          id: generateUniqueId(i),
          nome: parsed.clienteNome,
          piva: parsed.clientePiva || '',
          email: parsed.clienteEmail || '',
          indirizzo: parsed.clienteIndirizzo || '',
          numeroCivico: parsed.clienteNumeroCivico || '',
          cap: parsed.clienteCap || '',
          comune: parsed.clienteComune || '',
          provincia: parsed.clienteProvincia || '',
          nazione: parsed.clienteNazione || ''
        };
        newClienti.push(nuovoCliente);
        clienteId = nuovoCliente.id;
      }

      const nuovaFattura: NewFattura = {
        id: generateUniqueId(i),
        numero: parsed.numero,
        importo: parsed.importo,
        data: parsed.data,
        dataIncasso: parsed.dataIncasso,
        clienteId: clienteId || '',
        clienteNome: parsed.clienteNome,
        duplicateKey
      };

      newFatture.push(nuovaFattura);
      summary.imported++;
    } catch (error: any) {
      summary.failed++;
      summary.failedFiles.push({
        filename: name,
        error: error?.message || String(error) || 'Errore sconosciuto'
      });
    }
  }

  // Save all new clienti and fatture in parallel for better performance
  // Only if dbManager is provided (otherwise caller handles persistence)
  if (dbManager) {
    await Promise.all([
      ...newClienti.map(cliente => dbManager.put('clienti', cliente)),
      ...newFatture.map(fattura => dbManager.put('fatture', fattura))
    ]);
  }

  return { summary, newFatture, newClienti };
};
