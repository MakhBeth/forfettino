import { unzipSync } from 'fflate';

// Extract XML files from ZIP
export const extractXmlFromZip = async (zipFile: File): Promise<Array<{ name: string; content: string }>> => {
  try {
    const arrayBuffer = await zipFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const unzipped = unzipSync(uint8Array);

    const xmlFiles: Array<{ name: string; content: string }> = [];

    for (const [filename, data] of Object.entries(unzipped)) {
      // Skip directories, __MACOSX, and non-XML files
      if (filename.endsWith('/') || filename.includes('__MACOSX') || filename.startsWith('.')) {
        continue;
      }

      if (filename.toLowerCase().endsWith('.xml')) {
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(data);
        xmlFiles.push({ name: filename, content });
      }
    }

    return xmlFiles;
  } catch (error: any) {
    throw new Error('Errore estrazione ZIP: ' + (error?.message || 'errore sconosciuto'));
  }
};

// Parse FatturaPA XML
export const parseFatturaXML = (xmlContent: string): any | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  try {
    const dataEmissione = doc.querySelector('Data')?.textContent || new Date().toISOString().split('T')[0];
    const dataRiferimentoPagamento = doc.querySelector('DettaglioPagamento DataRiferimentoTerminiPagamento')?.textContent;

    // Extract cliente address from CessionarioCommittente Sede
    const clienteSede = doc.querySelector('CessionarioCommittente Sede');

    return {
      importo: parseFloat(doc.querySelector('ImportoTotaleDocumento, ImponibileImporto')?.textContent || '0'),
      data: dataEmissione,
      dataIncasso: dataRiferimentoPagamento || dataEmissione,
      numero: doc.querySelector('Numero')?.textContent || '',
      clienteNome: doc.querySelector('CessionarioCommittente Denominazione, CessionarioCommittente DatiAnagrafici Anagrafica Denominazione')?.textContent || 'Cliente',
      clientePiva: doc.querySelector('CessionarioCommittente IdFiscaleIVA IdCodice, CessionarioCommittente CodiceFiscale')?.textContent || '',
      // Cliente address fields
      clienteIndirizzo: clienteSede?.querySelector('Indirizzo')?.textContent || '',
      clienteNumeroCivico: clienteSede?.querySelector('NumeroCivico')?.textContent || '',
      clienteCap: clienteSede?.querySelector('CAP')?.textContent || '',
      clienteComune: clienteSede?.querySelector('Comune')?.textContent || '',
      clienteProvincia: clienteSede?.querySelector('Provincia')?.textContent || '',
      clienteNazione: clienteSede?.querySelector('Nazione')?.textContent || '',
      // Cliente email from Contatti
      clienteEmail: doc.querySelector('CessionarioCommittente Contatti Email')?.textContent || ''
    };
  } catch (e) {
    return null;
  }
};
