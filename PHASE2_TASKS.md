# Phase 2: Fattura di Cortesia Implementation Tasks

**Status**: Phase 1 (Refactoring) Complete ✅
**Next**: Phase 2 (Add courtesy invoice PDF generation feature)
**Date**: 2026-01-18
**Commit**: e367083

---

## Phase 1 Completion Summary

### What Was Done
Successfully refactored the monolithic 2,146-line ForfettarioApp.tsx into a modular architecture:

- **Size Reduction**: 2,146 → 294 lines (86% reduction)
- **Files Created**: 33 new modular files
- **Architecture**: Implemented clean separation using types, utilities, hooks, context, and components
- **State Management**: Migrated from 20+ useState hooks to centralized Context API
- **Build Status**: ✅ All TypeScript errors resolved, clean production build

### New File Structure
```
src/
├── types/index.ts                      # All TypeScript interfaces
├── lib/
│   ├── constants/fiscali.ts            # Fiscal constants
│   ├── db/IndexedDBManager.ts          # Database layer
│   └── utils/                          # 5 utility modules
├── hooks/                              # 6 custom hooks
├── context/AppContext.tsx              # Global state management
├── components/
│   ├── pages/                          # 4 page components
│   ├── modals/                         # 9 modal components
│   ├── shared/                         # 2 shared components
│   └── ForfettarioApp.tsx              # Main container (294 lines)
└── styles/theme.css                    # Extracted CSS
```

### Key Discoveries & Fixes

1. **Config Type Issue**:
   - **Problem**: `codiciAteco` was defined as `Record<string, number>` but used as `string[]`
   - **Fix**: Changed to `codiciAteco: string[]` in Config interface
   - **Impact**: All calculation logic now works correctly

2. **Date Helper Missing**:
   - **Problem**: `getDaysInMonth` from original code was different from extracted utility
   - **Added**: `getCalendarDays()` function for calendar grid generation
   - **Location**: `src/lib/utils/dateHelpers.ts:10-24`

3. **Modal Integration Pattern**:
   - **Discovery**: Modal components expect event handlers, not direct context methods
   - **Solution**: Created bridge handlers in ForfettarioApp.tsx (lines 35-110)
   - **Pattern**: `handleFatturaUpload`, `handleBatchUpload`, `handleZipUpload`, `handleImport`

4. **TypeScript Strict Mode**:
   - Fixed implicit `any` types in clientHours calculation (Calendario.tsx:76)
   - Added proper type annotations for Date arithmetic operations
   - Removed unused imports (React, Icons)

---

## Phase 2: Implementation Plan

### Goal
Add "Fattura di Cortesia" (courtesy invoice) feature with client-side PDF generation.

### User Requirements (from original request)
1. **Settings Section**: New "Fattura di Cortesia" configuration
   - Image upload (replaces panda.png logo)
   - Primary color picker
   - Default language selector
   - "Created by" text/link editor

2. **Generation Flow**:
   - XML upload OR manual entry
   - Language selector
   - Service list editor (modify line items)
   - Generate PDF button
   - Download PDF file

3. **Integration**: Toggle switch on Fatture page

### Architecture Decisions (already made by user)
- ✅ Client-side only (no backend)
- ✅ Upload custom images (user's logo)
- ✅ Full editing capability for service lists

---

## Detailed Task Breakdown

### Task 1: Install Dependencies
**Estimated effort**: 5 minutes

```bash
npm install @react-pdf/renderer file-saver
npm install --save-dev @types/file-saver
```

**Files**:
- `package.json` (add dependencies)
- `public/fonts/` (create directory)
- `public/assets/` (create directory)

**Assets to copy from digital-invoice-to-pdf**:
- `public/fonts/RobotoMono-Regular.ttf`
- `public/assets/default-invoice-logo.png` (or create a default)

---

### Task 2: Extend Data Model
**Estimated effort**: 15 minutes

**File**: `src/types/index.ts`

Add new interfaces:
```typescript
export interface CourtesyInvoiceConfig {
  // Branding
  logoBase64?: string;
  logoMimeType?: string;
  primaryColor: string;         // Default: '#6699cc'
  textColor: string;             // Default: '#033243'

  // Company info
  companyName: string;
  vatNumber: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;              // Default: 'IT'
  phone?: string;
  email?: string;
  iban?: string;
  bankName?: string;

  // Service templates
  defaultServices: ServiceTemplate[];

  // Settings
  includeFooter: boolean;        // Default: true
  locale: string;                // Default: 'it'
}

export interface ServiceTemplate {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface CourtesyInvoiceDraft {
  number: string;
  issueDate: Date;
  dueDate?: Date;
  clientId?: string;
  clientName: string;
  clientVat?: string;
  clientAddress?: string;
  description?: string;
  lines: CourtesyInvoiceLine[];
  paymentMethod?: string;
}

export interface CourtesyInvoiceLine {
  id: string;
  number: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}
```

**Update Config interface**:
```typescript
export interface Config {
  // ... existing fields
  courtesyInvoice?: CourtesyInvoiceConfig;
}
```

**Update DEFAULT_CONFIG**:
`src/lib/constants/fiscali.ts:23-33`
```typescript
export const DEFAULT_CONFIG: Config = {
  // ... existing fields
  courtesyInvoice: {
    primaryColor: '#6699cc',
    textColor: '#033243',
    companyName: '',
    vatNumber: '',
    country: 'IT',
    defaultServices: [],
    includeFooter: true,
    locale: 'it'
  }
};
```

---

### Task 3: Create PDF Generation Library
**Estimated effort**: 2-3 hours

**Files to create**:

1. **`src/lib/pdf/types.ts`** (~100 lines)
   - Copy Invoice structure from digital-invoice-to-pdf
   - Adapt browser-compatible types

2. **`src/lib/pdf/renderer.tsx`** (~500 lines)
   - Copy from digital-invoice-to-pdf's PDF component
   - **Critical changes**:
     - Replace `Font.register(__dirname + '/fonts/...')`
     - With: `Font.register({ family: "Roboto-Mono", src: "/fonts/RobotoMono-Regular.ttf" })`
     - Replace `fs.readFileSync(imagePath, 'base64')`
     - With: Accept `logoSrc` as prop (base64 or URL)
   - Use React.createElement instead of JSX if needed

3. **`src/lib/pdf/generator.ts`** (~150 lines)
   ```typescript
   import { pdf } from '@react-pdf/renderer';
   import { saveAs } from 'file-saver';

   export async function generateCourtesyInvoicePDF(
     draft: CourtesyInvoiceDraft,
     config: Config
   ): Promise<Blob> {
     // Validate inputs
     if (!config.courtesyInvoice) {
       throw new Error('Configurazione mancante');
     }
     if (draft.lines.length === 0) {
       throw new Error('Aggiungi almeno una riga');
     }

     // Transform draft → Invoice structure
     const invoice = transformDraftToInvoice(draft, config);

     // Options from config
     const options = {
       colors: {
         primary: config.courtesyInvoice.primaryColor,
         text: config.courtesyInvoice.textColor
       },
       footer: config.courtesyInvoice.includeFooter,
       locale: config.courtesyInvoice.locale
     };

     const logoSrc = config.courtesyInvoice.logoBase64
       || '/assets/default-invoice-logo.png';

     // Generate PDF
     const pdfDoc = <InvoicePDF invoice={invoice} options={options} logoSrc={logoSrc} />;
     const blob = await pdf(pdfDoc).toBlob();

     return blob;
   }

   function transformDraftToInvoice(
     draft: CourtesyInvoiceDraft,
     config: Config
   ): Invoice {
     // Map draft structure to Invoice structure
     // This adapts our app's data model to the PDF renderer's expected format
   }
   ```

4. **`src/lib/pdf/translations.json`** (~50 lines)
   - Copy from digital-invoice-to-pdf
   - i18n labels for invoice PDF

---

### Task 4: Add Settings UI
**Estimated effort**: 1-2 hours

**File**: `src/components/pages/Impostazioni.tsx`

Add new section after the ATECO card:

```tsx
<div className="card">
  <div className="card-title">Fatture di Cortesia</div>

  {/* Company Info */}
  <div className="grid-2">
    <div className="input-group">
      <label className="input-label">Ragione Sociale *</label>
      <input
        type="text"
        className="input-field"
        value={config.courtesyInvoice?.companyName || ''}
        onChange={(e) => setConfig({
          ...config,
          courtesyInvoice: {
            ...(config.courtesyInvoice || {}),
            companyName: e.target.value
          }
        })}
      />
    </div>
    <div className="input-group">
      <label className="input-label">Partita IVA *</label>
      <input
        type="text"
        className="input-field"
        value={config.courtesyInvoice?.vatNumber || ''}
        onChange={(e) => setConfig({
          ...config,
          courtesyInvoice: {
            ...(config.courtesyInvoice || {}),
            vatNumber: e.target.value
          }
        })}
      />
    </div>
  </div>

  {/* Logo Upload */}
  <div className="input-group">
    <label className="input-label">Logo Aziendale (PNG/JPG, max 500KB)</label>
    <input
      type="file"
      accept="image/png,image/jpeg"
      onChange={handleLogoUpload}
    />
    {config.courtesyInvoice?.logoBase64 && (
      <img
        src={config.courtesyInvoice.logoBase64}
        style={{width: 80, height: 80, marginTop: 12, borderRadius: 8}}
        alt="Logo preview"
      />
    )}
  </div>

  {/* Color Pickers */}
  <div className="grid-2">
    <div className="input-group">
      <label className="input-label">Colore Primario</label>
      <input
        type="color"
        className="input-field"
        value={config.courtesyInvoice?.primaryColor || '#6699cc'}
        onChange={(e) => setConfig({
          ...config,
          courtesyInvoice: {
            ...(config.courtesyInvoice || {}),
            primaryColor: e.target.value
          }
        })}
      />
    </div>
    <div className="input-group">
      <label className="input-label">Colore Testo</label>
      <input
        type="color"
        className="input-field"
        value={config.courtesyInvoice?.textColor || '#033243'}
        onChange={(e) => setConfig({
          ...config,
          courtesyInvoice: {
            ...(config.courtesyInvoice || {}),
            textColor: e.target.value
          }
        })}
      />
    </div>
  </div>

  {/* Service Templates Button */}
  <button
    className="btn btn-primary"
    onClick={() => setShowModal('manage-services')}
  >
    Gestisci Servizi Predefiniti
  </button>
</div>
```

**Add handler** for logo upload:
```typescript
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file size (max 500KB)
  if (file.size > 500 * 1024) {
    showToast('Immagine troppo grande (max 500KB)', 'error');
    return;
  }

  // Validate file type
  if (!file.type.match(/^image\/(png|jpeg)$/)) {
    showToast('Formato non supportato (solo PNG/JPG)', 'error');
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onload = (event) => {
    setConfig({
      ...config,
      courtesyInvoice: {
        ...(config.courtesyInvoice || {}),
        logoBase64: event.target?.result as string,
        logoMimeType: file.type
      }
    });
    showToast('Logo caricato!');
  };
  reader.readAsDataURL(file);
};
```

---

### Task 5: Create Courtesy Invoice Modal
**Estimated effort**: 2-3 hours

**File**: `src/components/modals/CourtesyInvoiceModal.tsx`

Create a comprehensive modal with:
- Invoice header (number, date, client selector)
- Line items table with add/remove/edit
- Live totals calculation (subtotal, tax, total)
- Generate PDF button

```typescript
import { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateCourtesyInvoicePDF } from '../../lib/pdf/generator';
import { saveAs } from 'file-saver';
import type { CourtesyInvoiceDraft, CourtesyInvoiceLine } from '../../types';

interface CourtesyInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CourtesyInvoiceModal({ isOpen, onClose }: CourtesyInvoiceModalProps) {
  const { config, clienti, showToast } = useApp();

  const [draft, setDraft] = useState<CourtesyInvoiceDraft>({
    number: '',
    issueDate: new Date(),
    clientName: '',
    lines: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const addLine = () => {
    const newLine: CourtesyInvoiceLine = {
      id: Date.now().toString(),
      number: draft.lines.length + 1,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 22
    };
    setDraft({ ...draft, lines: [...draft.lines, newLine] });
  };

  const removeLine = (id: string) => {
    setDraft({
      ...draft,
      lines: draft.lines.filter(l => l.id !== id)
        .map((l, i) => ({ ...l, number: i + 1 }))
    });
  };

  const updateLine = (id: string, updates: Partial<CourtesyInvoiceLine>) => {
    setDraft({
      ...draft,
      lines: draft.lines.map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  const calculateTotals = () => {
    const subtotal = draft.lines.reduce((sum, line) =>
      sum + (line.quantity * line.unitPrice), 0
    );
    const tax = draft.lines.reduce((sum, line) =>
      sum + (line.quantity * line.unitPrice * line.taxRate / 100), 0
    );
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleGenerate = async () => {
    // Validation
    if (!draft.number) {
      showToast('Inserisci il numero fattura', 'error');
      return;
    }
    if (draft.lines.length === 0) {
      showToast('Aggiungi almeno una riga', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateCourtesyInvoicePDF(draft, config);
      saveAs(blob, `fattura-${draft.number}.pdf`);
      showToast('PDF generato con successo!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error?.message || 'Errore nella generazione PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h3 className="modal-title">Genera Fattura di Cortesia</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Invoice Header */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="input-group">
            <label className="input-label">Numero Fattura *</label>
            <input
              type="text"
              className="input-field"
              value={draft.number}
              onChange={(e) => setDraft({ ...draft, number: e.target.value })}
              placeholder="Es: 001/2026"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Data Emissione *</label>
            <input
              type="date"
              className="input-field"
              value={draft.issueDate.toISOString().split('T')[0]}
              onChange={(e) => setDraft({ ...draft, issueDate: new Date(e.target.value) })}
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Cliente</label>
          <select
            className="input-field"
            value={draft.clientId || ''}
            onChange={(e) => {
              const cliente = clienti.find(c => c.id === e.target.value);
              setDraft({
                ...draft,
                clientId: e.target.value,
                clientName: cliente?.nome || '',
                clientVat: cliente?.piva
              });
            }}
          >
            <option value="">Seleziona cliente o inserisci manualmente...</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {!draft.clientId && (
            <input
              type="text"
              className="input-field"
              style={{ marginTop: 8 }}
              value={draft.clientName}
              onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
              placeholder="Nome cliente"
            />
          )}
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="input-label">Righe Fattura</label>
            <button className="btn btn-primary btn-sm" onClick={addLine}>
              <Plus size={16} /> Aggiungi Riga
            </button>
          </div>

          {draft.lines.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Descrizione</th>
                  <th style={{ width: '15%' }}>Qta</th>
                  <th style={{ width: '20%' }}>Prezzo</th>
                  <th style={{ width: '15%' }}>IVA %</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map(line => (
                  <tr key={line.id}>
                    <td>
                      <input
                        type="text"
                        className="input-field"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                        placeholder="Descrizione servizio"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-field"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-field"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-field"
                        value={line.taxRate}
                        onChange={(e) => updateLine(line.id, { taxRate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="1"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              Nessuna riga. Clicca "Aggiungi Riga" per iniziare.
            </div>
          )}
        </div>

        {/* Totals */}
        {draft.lines.length > 0 && (
          <div style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Imponibile:</span>
              <span style={{ fontFamily: 'Space Mono', fontWeight: 600 }}>
                €{subtotal.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>IVA:</span>
              <span style={{ fontFamily: 'Space Mono', fontWeight: 600 }}>
                €{tax.toFixed(2)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: '2px solid var(--border)',
              fontSize: '1.1rem'
            }}>
              <span style={{ fontWeight: 700 }}>Totale:</span>
              <span style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--accent-green)' }}>
                €{total.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleGenerate}
          disabled={isGenerating || !draft.number || draft.lines.length === 0}
        >
          {isGenerating ? 'Generando...' : <><Check size={18} /> Genera PDF</>}
        </button>
      </div>
    </div>
  );
}
```

---

### Task 6: Create Manage Services Modal
**Estimated effort**: 1 hour

**File**: `src/components/modals/ManageServicesModal.tsx`

Simple CRUD for service templates:
```typescript
// Allow user to add/edit/delete default service templates
// Store in config.courtesyInvoice.defaultServices
// Can be used to quickly populate invoice lines
```

---

### Task 7: Integrate into Fatture Page
**Estimated effort**: 30 minutes

**File**: `src/components/pages/Fatture.tsx`

Add button in page header:
```tsx
<button
  className="btn btn-primary"
  onClick={() => setShowModal('courtesy-invoice')}
>
  <FileText size={18} /> Genera Fattura di Cortesia
</button>
```

**Wire up modal** in ForfettarioApp.tsx:
```tsx
import { CourtesyInvoiceModal } from './modals/CourtesyInvoiceModal';

// In render:
<CourtesyInvoiceModal
  isOpen={showModal === 'courtesy-invoice'}
  onClose={() => setShowModal(null)}
/>
```

---

### Task 8: Testing Checklist

**Settings Testing**:
- [ ] Upload logo (PNG) - verify preview appears
- [ ] Upload logo (JPG) - verify preview appears
- [ ] Upload oversized image (>500KB) - verify error message
- [ ] Upload non-image file - verify error message
- [ ] Change primary color - verify persists on refresh
- [ ] Change text color - verify persists on refresh
- [ ] Add company info - verify persists

**Invoice Generation Testing**:
- [ ] Open courtesy invoice modal
- [ ] Add invoice number and date
- [ ] Select client from dropdown - verify auto-fills name
- [ ] Add manual client name (no dropdown selection)
- [ ] Add line item with all fields
- [ ] Add multiple line items
- [ ] Verify totals calculate correctly (subtotal, IVA, total)
- [ ] Remove line item - verify renumbering
- [ ] Edit line item - verify totals update
- [ ] Try to generate without invoice number - verify validation error
- [ ] Try to generate without line items - verify validation error
- [ ] Generate PDF - verify download starts
- [ ] Open PDF - verify all fields present and correct
- [ ] Verify logo appears in PDF (if configured)
- [ ] Verify colors match config
- [ ] Test PDF with 10+ line items - verify multi-page works

**Service Templates Testing**:
- [ ] Add default service template
- [ ] Edit service template
- [ ] Delete service template
- [ ] Use template to populate invoice lines (if implemented)

**Browser Compatibility**:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari

---

## Critical Implementation Notes

### 1. Browser vs Node.js Compatibility
The digital-invoice-to-pdf project was built for Node.js. Key changes needed:

**Font Loading**:
```typescript
// ❌ Node.js version (won't work in browser)
Font.register(__dirname + '/fonts/RobotoMono-Regular.ttf');

// ✅ Browser version (correct)
Font.register({
  family: "Roboto-Mono",
  src: "/fonts/RobotoMono-Regular.ttf"
});
```

**Image Loading**:
```typescript
// ❌ Node.js version (won't work in browser)
const logoData = fs.readFileSync(logoPath, 'base64');

// ✅ Browser version (correct)
const logoSrc = config.courtesyInvoice?.logoBase64 || '/assets/default-logo.png';
<Image src={logoSrc} style={{width: 70, height: 70}} />
```

### 2. PDF Generation API
```typescript
import { pdf } from '@react-pdf/renderer';

// Generate blob for download
const blob = await pdf(<MyDocument />).toBlob();

// Download file
import { saveAs } from 'file-saver';
saveAs(blob, 'filename.pdf');
```

### 3. Config Persistence
The `courtesyInvoice` config is automatically persisted via:
- `src/hooks/useConfig.ts` - Auto-saves on change
- `src/lib/db/IndexedDBManager.ts` - IndexedDB storage
- No additional code needed for persistence!

### 4. TypeScript Considerations
When adapting digital-invoice-to-pdf code:
- Remove Node.js types (e.g., `fs`, `path`)
- Add browser types (e.g., `FileReader`, `Blob`)
- Ensure @react-pdf/renderer types are imported
- May need `@types/file-saver`

---

## Potential Issues & Solutions

### Issue 1: Large Bundle Size
**Problem**: @react-pdf/renderer adds ~260KB gzipped

**Solutions**:
- ✅ Acceptable for feature value (one-time load)
- If needed: Lazy load with `React.lazy()` and `Suspense`
- If needed: Code splitting via dynamic imports

### Issue 2: Logo Size Limit
**Problem**: Base64 encoding increases size by ~33%

**Solution**:
- Enforce 500KB limit on upload
- Consider image compression library if needed
- Could use canvas API to resize/compress before base64

### Issue 3: PDF Generation Performance
**Problem**: Large invoices (50+ lines) may be slow

**Solutions**:
- Show loading state (already implemented: `isGenerating`)
- Consider Web Worker for generation (advanced)
- Current implementation should be fine for typical use

---

## File Locations Reference

### Files to Modify
- `src/types/index.ts` - Add new interfaces
- `src/lib/constants/fiscali.ts` - Update DEFAULT_CONFIG
- `src/components/pages/Impostazioni.tsx` - Add settings section
- `src/components/pages/Fatture.tsx` - Add button
- `src/components/ForfettarioApp.tsx` - Wire up new modal

### Files to Create
- `src/lib/pdf/types.ts` - PDF data structures
- `src/lib/pdf/renderer.tsx` - PDF layout component
- `src/lib/pdf/generator.ts` - PDF generation logic
- `src/lib/pdf/translations.json` - i18n labels
- `src/components/modals/CourtesyInvoiceModal.tsx` - Invoice editor
- `src/components/modals/ManageServicesModal.tsx` - Service templates
- `public/fonts/RobotoMono-Regular.ttf` - Font file
- `public/assets/default-invoice-logo.png` - Default logo

### Files to Reference
Look at these files for patterns:
- `src/context/AppContext.tsx` - How to add new context methods
- `src/components/modals/EditClienteModal.tsx` - Form modal pattern
- `src/components/modals/BatchUploadModal.tsx` - File upload pattern
- `src/hooks/useConfig.ts` - Config update pattern

---

## Quick Start Commands for Next Session

```bash
# 1. Install dependencies
npm install @react-pdf/renderer file-saver
npm install --save-dev @types/file-saver

# 2. Create directory structure
mkdir -p public/fonts public/assets
mkdir -p src/lib/pdf

# 3. Copy assets from digital-invoice-to-pdf
# (manually copy RobotoMono-Regular.ttf and logo)

# 4. Start development server
npm run dev

# 5. Build and test
npm run build
```

---

## Success Criteria

Phase 2 is complete when:
- [ ] User can configure company info and logo in settings
- [ ] User can create courtesy invoice with line items
- [ ] User can generate PDF with correct formatting
- [ ] PDF includes custom logo and colors
- [ ] All validations work correctly
- [ ] No TypeScript errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Build passes and deploys successfully

---

## Additional Resources

### digital-invoice-to-pdf Repository
- URL: (reference in original conversation)
- Key files to adapt: renderer component, types, translations
- License: Check and comply with license terms

### @react-pdf/renderer Documentation
- Docs: https://react-pdf.org/
- Examples: https://react-pdf.org/examples
- API: https://react-pdf.org/components

### file-saver Documentation
- GitHub: https://github.com/eligrey/FileSaver.js
- Usage: `saveAs(blob, filename)`

---

## Notes for Next Session

1. **Start with Task 1**: Install dependencies first
2. **Test incrementally**: Build and test after each task
3. **Reference the plan**: This file in `/Users/davidedipumpo/Projects/forfettAIro/bubbly-watching-duckling.md` has detailed architecture
4. **Commit frequently**: Use meaningful commit messages
5. **Ask questions**: If anything is unclear, ask before implementing

Good luck! 🚀
