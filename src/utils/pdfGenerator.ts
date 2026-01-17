import { pdf } from '@react-pdf/renderer';
import GeneratePDF from './renderer';
import dataExtractor from './dataExtractor';
import { xmlToJson } from './xmlParser';
import type { FatturaSettings } from '../types/FatturaSettings';
import type { Options } from '../types/Options';

export async function generatePDFFromXML(
  xmlContent: string,
  settings: FatturaSettings,
  languageOverride?: 'it' | 'de' | 'en' | 'es'
): Promise<Blob> {
  try {
    // Parse XML to JSON
    const invoiceJson = await xmlToJson(xmlContent);
    
    // Extract invoice data using dataExtractor
    const invoice = dataExtractor(invoiceJson);
    
    // Prepare options
    const options: Options = {
      locale: languageOverride || settings.defaultLocale,
      footer: settings.footerEnabled,
      colors: {
        primary: settings.primaryColor
      },
      headingImage: settings.headingImage,
      createdBy: {
        text: settings.createdByText,
        link: settings.createdByLink
      }
    };
    
    // Generate PDF
    const pdfDocument = <GeneratePDF invoice={invoice} options={options} />;
    const blob = await pdf(pdfDocument).toBlob();
    
    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(invoiceNumber?: string, invoiceDate?: string): string {
  const numero = invoiceNumber || 'unknown';
  const data = invoiceDate ? invoiceDate.replace(/\//g, '-') : 'unknown';
  return `fattura_${numero}_${data}.pdf`;
}
