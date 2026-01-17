import { parseString } from 'xml2js';
import type { DigitalInvoiceJson } from '../types/DigitalInvoiceJson';

export async function xmlToJson(xmlContent: string): Promise<DigitalInvoiceJson> {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { 
      explicitArray: true,
      mergeAttrs: true,
      explicitRoot: true
    }, (err, result) => {
      if (err) {
        reject(new Error(`XML parsing error: ${err.message}`));
      } else {
        resolve(result as DigitalInvoiceJson);
      }
    });
  });
}
