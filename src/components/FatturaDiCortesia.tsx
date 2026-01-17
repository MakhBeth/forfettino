import React, { useState } from 'react';
import { FileText, Upload, Download } from 'lucide-react';
import { xmlToPDF } from '../utils/parser';
import type { Options } from '../utils/types/Options';

export interface FatturaSettings {
  primaryColor: string;
  footer: boolean;
}

export const DEFAULT_FATTURA_SETTINGS: FatturaSettings = {
  primaryColor: '#6699cc',
  footer: true,
};

interface FatturaDiCortesiaProps {
  settings: FatturaSettings;
  onSaveSettings: (settings: FatturaSettings) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const FatturaDiCortesia: React.FC<FatturaDiCortesiaProps> = ({
  settings,
  onSaveSettings,
  showToast,
}) => {
  const [localSettings, setLocalSettings] = useState<FatturaSettings>(settings);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfLanguage, setPdfLanguage] = useState<'it' | 'de' | 'en' | 'es'>('it');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSaveSettings = async () => {
    try {
      await onSaveSettings(localSettings);
      showToast('Impostazioni salvate con successo', 'success');
    } catch (error) {
      showToast('Errore nel salvare le impostazioni', 'error');
    }
  };

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setXmlFile(file);
    }
  };

  const handleGeneratePDF = async () => {
    if (!xmlFile) {
      showToast('Seleziona un file XML', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const xmlContent = await xmlFile.text();
      
      const options: Options = {
        locale: pdfLanguage,
        footer: localSettings.footer,
        colors: {
          primary: localSettings.primaryColor,
        },
      };
      
      const blob = await xmlToPDF(xmlContent, options);
      
      // Extract invoice number and date for filename
      const filename = `fattura_${xmlFile.name.replace('.xml', '')}.pdf`;
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('PDF generato con successo', 'success');
    } catch (error) {
      showToast(`Errore nella generazione del PDF: ${error}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fattura di Cortesia</h1>
        <p className="page-subtitle">Genera PDF da FatturaPA XML</p>
      </div>

      <div className="card">
        <div className="card-title">Impostazioni PDF</div>
        
        <div className="input-group">
          <label className="input-label">Colore Primario</label>
          <input
            type="color"
            className="input-field"
            value={localSettings.primaryColor}
            onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
            style={{ height: '50px', cursor: 'pointer' }}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <input
              type="checkbox"
              checked={localSettings.footer}
              onChange={(e) => setLocalSettings({ ...localSettings, footer: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Mostra footer nel PDF
          </label>
        </div>

        <button className="btn btn-primary" onClick={handleSaveSettings}>
          Salva Impostazioni
        </button>
      </div>

      <div className="card">
        <div className="card-title">Genera PDF</div>
        
        <div className="input-group">
          <label className="input-label">Seleziona file XML FatturaPA</label>
          <label className="upload-zone" style={{ padding: '24px', cursor: 'pointer' }}>
            <input
              type="file"
              accept=".xml"
              onChange={handleXmlUpload}
              style={{ display: 'none' }}
            />
            <Upload size={32} style={{ marginBottom: '12px', color: 'var(--accent-primary)' }} />
            <p style={{ fontWeight: 500 }}>
              {xmlFile ? xmlFile.name : 'Clicca per selezionare un file XML'}
            </p>
          </label>
        </div>

        <div className="input-group">
          <label className="input-label">Lingua del PDF</label>
          <select
            className="input-field"
            value={pdfLanguage}
            onChange={(e) => setPdfLanguage(e.target.value as 'it' | 'de' | 'en' | 'es')}
          >
            <option value="it">Italiano</option>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <button
          className="btn btn-success"
          onClick={handleGeneratePDF}
          disabled={!xmlFile || isGenerating}
          style={{ width: '100%' }}
        >
          <Download size={18} />
          {isGenerating ? 'Generazione in corso...' : 'Genera PDF'}
        </button>
      </div>

      {xmlFile && (
        <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={24} color="var(--accent-green)" />
            <div>
              <div style={{ fontWeight: 600 }}>File selezionato</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{xmlFile.name}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FatturaDiCortesia;
