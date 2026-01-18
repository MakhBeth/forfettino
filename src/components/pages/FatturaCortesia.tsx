import { useState, useRef } from 'react';
import { Upload, Download, FileText, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseXmlToInvoice } from '../../lib/pdf/xmlParser';
import GeneratePDF from '../../lib/pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { Invoice, PDFOptions, Line } from '../../lib/pdf/types';

export function FatturaCortesia() {
  const { config, setConfig, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Settings (from config)
  const [primaryColor, setPrimaryColor] = useState(config.courtesyInvoice?.primaryColor || '#6699cc');
  const [textColor, setTextColor] = useState(config.courtesyInvoice?.textColor || '#033243');
  const [showFooter, setShowFooter] = useState(config.courtesyInvoice?.includeFooter !== false);
  const [footerText, setFooterText] = useState(config.courtesyInvoice?.footerText || '');
  const [footerLink, setFooterLink] = useState(config.courtesyInvoice?.footerLink || '');
  const [locale, setLocale] = useState(config.courtesyInvoice?.locale || 'it');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(config.courtesyInvoice?.logoBase64);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedInvoice, setParsedInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleSaveSettings = () => {
    setConfig({
      ...config,
      courtesyInvoice: {
        companyName: config.courtesyInvoice?.companyName || '',
        vatNumber: config.courtesyInvoice?.vatNumber || '',
        country: config.courtesyInvoice?.country || 'IT',
        defaultServices: config.courtesyInvoice?.defaultServices || [],
        ...config.courtesyInvoice,
        primaryColor,
        textColor,
        includeFooter: showFooter,
        footerText: footerText || undefined,
        footerLink: footerLink || undefined,
        locale,
        logoBase64,
      }
    });
    showToast('Impostazioni salvate!', 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      showToast('Immagine troppo grande (max 500KB)', 'error');
      return;
    }

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      showToast('Formato non supportato (solo PNG/JPG)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoBase64(undefined);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      showToast('Seleziona un file XML', 'error');
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const invoice = parseXmlToInvoice(text);
      setParsedInvoice(invoice);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore parsing XML';
      showToast(message, 'error');
      setParsedInvoice(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!parsedInvoice) {
      showToast('Seleziona prima un file XML', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const options: PDFOptions = {
        colors: {
          primary: primaryColor,
          text: textColor,
        },
        footer: showFooter,
        footerText: footerText || undefined,
        footerLink: footerLink || undefined,
        locale,
        logoSrc: logoBase64,
      };

      const pdfDoc = GeneratePDF(parsedInvoice, options);
      const blob = await pdf(pdfDoc).toBlob();

      const filename = `fattura-cortesia-${parsedInvoice.installments[0]?.number || 'new'}.pdf`;
      saveAs(blob, filename.replace(/\//g, '-'));

      showToast('PDF generato!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore generazione PDF';
      showToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fattura di Cortesia</h1>
        <p className="page-subtitle">Genera PDF da fattura elettronica XML</p>
      </div>

      {/* IMPOSTAZIONI PDF */}
      <div className="card">
        <div className="card-title" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
          IMPOSTAZIONI PDF
        </div>

        {/* Logo */}
        <div className="input-group">
          <label className="input-label">Logo (PNG/JPG, max 500KB)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoBase64 ? (
              <>
                <img
                  src={logoBase64}
                  alt="Logo"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'contain',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}
                />
                <button className="btn btn-danger btn-sm" onClick={removeLogo}>
                  <X size={14} /> Rimuovi
                </button>
              </>
            ) : (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <Upload size={18} />
                <span>Carica logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="input-group">
            <label className="input-label">Colore Primario</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: 50, height: 40, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4 }}
              />
              <input
                type="text"
                className="input-field"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Colore Testo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: 50, height: 40, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4 }}
              />
              <input
                type="text"
                className="input-field"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="input-group" style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showFooter}
              onChange={(e) => setShowFooter(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-green)' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Mostra footer nel PDF</span>
          </label>
        </div>

        {showFooter && (
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div className="input-group">
              <label className="input-label">Testo Footer (opzionale)</label>
              <input
                type="text"
                className="input-field"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Generato con"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Link Footer (opzionale)</label>
              <input
                type="url"
                className="input-field"
                value={footerLink}
                onChange={(e) => setFooterLink(e.target.value)}
                placeholder="https://esempio.com"
              />
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSaveSettings}
          style={{ marginTop: 20 }}
        >
          Salva Impostazioni
        </button>
      </div>

      {/* GENERA PDF */}
      <div className="card">
        <div className="card-title" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
          GENERA PDF
        </div>

        <div className="input-group">
          <label className="input-label">Seleziona file XML FatturaPA</label>

          {/* Drop zone */}
          <div
            onClick={handleDropZoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-green)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: 30,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: isDragging ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
            onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Upload size={32} style={{ color: isDragging ? 'var(--accent-green)' : 'var(--accent-blue)' }} />
            {selectedFile ? (
              <span style={{ fontFamily: 'Space Mono', color: 'var(--text-primary)' }}>
                {selectedFile.name}
              </span>
            ) : (
              <span style={{ color: isDragging ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {isDragging ? 'Rilascia il file qui' : 'Trascina un file XML o clicca per selezionare'}
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="input-group" style={{ marginTop: 16 }}>
          <label className="input-label">Lingua del PDF</label>
          <select
            className="input-field"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <button
          className="btn btn-success"
          onClick={handleGenerate}
          disabled={!parsedInvoice || isGenerating}
          style={{ marginTop: 20, width: '100%' }}
        >
          {isGenerating ? (
            'Generando...'
          ) : (
            <>
              <Download size={18} /> Genera PDF
            </>
          )}
        </button>
      </div>

      {/* MODIFICA DATI FATTURA */}
      {selectedFile && parsedInvoice && (
        <InvoiceEditor
          invoice={parsedInvoice}
          onInvoiceChange={setParsedInvoice}
          fileName={selectedFile.name}
        />
      )}
    </>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = false
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          cursor: 'pointer',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && <div style={{ paddingTop: 16 }}>{children}</div>}
    </div>
  );
}

// Invoice Editor Component
function InvoiceEditor({
  invoice,
  onInvoiceChange,
  fileName,
}: {
  invoice: Invoice;
  onInvoiceChange: (invoice: Invoice) => void;
  fileName: string;
}) {
  const inst = invoice.installments[0];

  const updateInvoicer = (updates: Partial<typeof invoice.invoicer>) => {
    onInvoiceChange({
      ...invoice,
      invoicer: { ...invoice.invoicer, ...updates },
    });
  };

  const updateInvoicerOffice = (updates: Partial<NonNullable<typeof invoice.invoicer.office>>) => {
    onInvoiceChange({
      ...invoice,
      invoicer: {
        ...invoice.invoicer,
        office: { ...invoice.invoicer.office, ...updates },
      },
    });
  };

  const updateInvoicerContacts = (updates: Partial<NonNullable<typeof invoice.invoicer.contacts>>) => {
    onInvoiceChange({
      ...invoice,
      invoicer: {
        ...invoice.invoicer,
        contacts: { ...invoice.invoicer.contacts, ...updates },
      },
    });
  };

  const updateInvoicee = (updates: Partial<typeof invoice.invoicee>) => {
    onInvoiceChange({
      ...invoice,
      invoicee: { ...invoice.invoicee, ...updates },
    });
  };

  const updateInvoiceeOffice = (updates: Partial<NonNullable<typeof invoice.invoicee.office>>) => {
    onInvoiceChange({
      ...invoice,
      invoicee: {
        ...invoice.invoicee,
        office: { ...invoice.invoicee.office, ...updates },
      },
    });
  };

  const updateInstallment = (updates: Partial<typeof inst>) => {
    onInvoiceChange({
      ...invoice,
      installments: [{ ...inst, ...updates }],
    });
  };

  const updateLine = (index: number, updates: Partial<Line>) => {
    const newLines = [...inst.lines];
    newLines[index] = { ...newLines[index], ...updates };

    // Recalculate amount if quantity or price changed
    if ('quantity' in updates || 'singlePrice' in updates) {
      newLines[index].amount = newLines[index].quantity * newLines[index].singlePrice;
    }

    updateInstallment({ lines: newLines });
  };

  const addLine = () => {
    const newLine: Line = {
      number: inst.lines.length + 1,
      description: '',
      quantity: 1,
      singlePrice: 0,
      amount: 0,
      tax: inst.taxSummary?.taxPercentage || 0,
    };
    updateInstallment({ lines: [...inst.lines, newLine] });
  };

  const removeLine = (index: number) => {
    const newLines = inst.lines.filter((_, i) => i !== index);
    // Renumber lines
    newLines.forEach((line, i) => { line.number = i + 1; });
    updateInstallment({ lines: newLines });
  };

  const updatePayment = (updates: Partial<NonNullable<typeof inst.payment>>) => {
    updateInstallment({
      payment: { ...inst.payment, amount: inst.payment?.amount || 0, ...updates },
    });
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <FileText size={24} style={{ color: 'var(--accent-green)' }} />
        <div style={{ flex: 1 }}>
          <div className="card-title" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
            MODIFICA DATI FATTURA
          </div>
          <div style={{ fontSize: '0.9rem', fontFamily: 'Space Mono', color: 'var(--text-secondary)' }}>
            {fileName}
          </div>
        </div>
        <Check size={20} style={{ color: 'var(--accent-green)' }} />
      </div>

      {/* FORNITORE */}
      <CollapsibleSection title="Fornitore (Cedente/Prestatore)" defaultOpen={false}>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Ragione Sociale</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.name || ''}
              onChange={(e) => updateInvoicer({ name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">P.IVA / CF</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.vat || ''}
              onChange={(e) => updateInvoicer({ vat: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Indirizzo</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.address || ''}
              onChange={(e) => updateInvoicerOffice({ address: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">N. Civico</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.number || ''}
              onChange={(e) => updateInvoicerOffice({ number: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">CAP</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.cap || ''}
              onChange={(e) => updateInvoicerOffice({ cap: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Città</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.city || ''}
              onChange={(e) => updateInvoicerOffice({ city: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Provincia</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.district || ''}
              onChange={(e) => updateInvoicerOffice({ district: e.target.value })}
              maxLength={2}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Nazione</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.office?.country || ''}
              onChange={(e) => updateInvoicerOffice({ country: e.target.value })}
              maxLength={2}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Telefono</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicer.contacts?.tel || ''}
              onChange={(e) => updateInvoicerContacts({ tel: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={invoice.invoicer.contacts?.email || ''}
              onChange={(e) => updateInvoicerContacts({ email: e.target.value })}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* CLIENTE */}
      <CollapsibleSection title="Cliente (Cessionario/Committente)" defaultOpen={false}>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Ragione Sociale</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.name || ''}
              onChange={(e) => updateInvoicee({ name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">P.IVA / CF</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.vat || ''}
              onChange={(e) => updateInvoicee({ vat: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Indirizzo</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.address || ''}
              onChange={(e) => updateInvoiceeOffice({ address: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">N. Civico</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.number || ''}
              onChange={(e) => updateInvoiceeOffice({ number: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">CAP</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.cap || ''}
              onChange={(e) => updateInvoiceeOffice({ cap: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Città</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.city || ''}
              onChange={(e) => updateInvoiceeOffice({ city: e.target.value })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Provincia</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.district || ''}
              onChange={(e) => updateInvoiceeOffice({ district: e.target.value })}
              maxLength={2}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Nazione</label>
            <input
              type="text"
              className="input-field"
              value={invoice.invoicee.office?.country || ''}
              onChange={(e) => updateInvoiceeOffice({ country: e.target.value })}
              maxLength={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* DATI FATTURA */}
      <CollapsibleSection title="Dati Fattura" defaultOpen={true}>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Numero Fattura</label>
            <input
              type="text"
              className="input-field"
              value={inst.number || ''}
              onChange={(e) => updateInstallment({ number: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Data Emissione</label>
            <input
              type="date"
              className="input-field"
              value={formatDate(inst.issueDate)}
              onChange={(e) => updateInstallment({ issueDate: new Date(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Valuta</label>
            <input
              type="text"
              className="input-field"
              value={inst.currency || 'EUR'}
              onChange={(e) => updateInstallment({ currency: e.target.value })}
              maxLength={3}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Bollo (se presente)</label>
            <input
              type="number"
              className="input-field"
              value={inst.stampDuty || ''}
              onChange={(e) => updateInstallment({ stampDuty: e.target.value ? parseFloat(e.target.value) : undefined })}
              step="0.01"
            />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Causale / Descrizione</label>
          <textarea
            className="input-field"
            value={inst.description || ''}
            onChange={(e) => updateInstallment({ description: e.target.value })}
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>
      </CollapsibleSection>

      {/* RIGHE FATTURA */}
      <CollapsibleSection title={`Righe Fattura (${inst.lines.length})`} defaultOpen={true}>
        {inst.lines.map((line, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Riga {line.number}</span>
              {inst.lines.length > 1 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeLine(index)}
                  style={{ padding: '4px 8px' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">Descrizione</label>
              <textarea
                className="input-field"
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="grid-2" style={{ marginTop: 8 }}>
              <div className="input-group">
                <label className="input-label">Quantità</label>
                <input
                  type="number"
                  className="input-field"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Prezzo Unitario</label>
                <input
                  type="number"
                  className="input-field"
                  value={line.singlePrice}
                  onChange={(e) => updateLine(index, { singlePrice: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                />
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: 8 }}>
              <div className="input-group">
                <label className="input-label">IVA %</label>
                <input
                  type="number"
                  className="input-field"
                  value={line.tax}
                  onChange={(e) => updateLine(index, { tax: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Importo Riga</label>
                <input
                  type="number"
                  className="input-field"
                  value={line.amount.toFixed(2)}
                  readOnly
                  style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addLine} style={{ marginTop: 8 }}>
          <Plus size={18} /> Aggiungi Riga
        </button>
      </CollapsibleSection>

      {/* PAGAMENTO */}
      <CollapsibleSection title="Dati Pagamento" defaultOpen={false}>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Importo Totale</label>
            <input
              type="number"
              className="input-field"
              value={inst.totalAmount}
              onChange={(e) => updateInstallment({ totalAmount: parseFloat(e.target.value) || 0 })}
              step="0.01"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Data Scadenza</label>
            <input
              type="date"
              className="input-field"
              value={formatDate(inst.payment?.regularPaymentDate)}
              onChange={(e) => updatePayment({ regularPaymentDate: e.target.value ? new Date(e.target.value) : undefined })}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">IBAN</label>
            <input
              type="text"
              className="input-field"
              value={inst.payment?.iban || ''}
              onChange={(e) => updatePayment({ iban: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Banca</label>
            <input
              type="text"
              className="input-field"
              value={inst.payment?.bank || ''}
              onChange={(e) => updatePayment({ bank: e.target.value })}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
