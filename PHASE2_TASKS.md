# Phase 2: Fattura di Cortesia Implementation

**Status**: ✅ COMPLETE
**Date**: 2026-01-18

---

## Summary

Added "Fattura di Cortesia" (courtesy invoice) feature that converts FatturaPA XML to branded PDF.

### Features Implemented

1. **Dedicated Page** (`/fattura-cortesia`)
   - XML file upload with drag-and-drop support
   - Edit invoice data before generating (collapsible sections)
   - Language selector (IT/EN/DE)
   - Primary color customization
   - Footer toggle
   - One-click PDF generation

2. **PDF Generation Library** (`src/lib/pdf/`)
   - Full FatturaPA XML parser
   - PDF renderer adapted from `digital-invoice-to-pdf`
   - Multi-language support
   - Custom branding (logo, colors)

3. **Settings Integration** (Impostazioni page)
   - Company info for invoices
   - Logo upload (base64)
   - Color customization
   - Service templates management

---

## Files Created

```
src/lib/pdf/
├── types.ts         # Invoice, Company, Line, etc.
├── renderer.tsx     # PDF component (@react-pdf/renderer)
├── generator.ts     # PDF generation helper
├── translations.ts  # IT/EN/DE translations
├── xmlParser.ts     # FatturaPA XML → Invoice parser
└── index.ts         # Exports

src/components/pages/
└── FatturaCortesia.tsx    # Dedicated page

src/components/modals/
├── CourtesyInvoiceModal.tsx   # Alternative modal (not used)
└── ManageServicesModal.tsx    # Service templates CRUD

public/fonts/
└── RobotoMono-Regular.ttf     # PDF font
```

## Files Modified

- `package.json` - Added `@react-pdf/renderer`, `file-saver`
- `src/types/index.ts` - Added `CourtesyInvoiceConfig`, etc.
- `src/lib/constants/fiscali.ts` - Added default config
- `src/components/ForfettarioApp.tsx` - Added sidebar nav + page
- `src/components/pages/Impostazioni.tsx` - Added settings section
- `src/components/pages/Fatture.tsx` - Cleanup

---

## Usage

1. Go to **Fattura di Cortesia** in sidebar
2. Configure colors/footer if desired
3. Upload FatturaPA XML file
4. Edit invoice data if needed (collapsible sections)
5. Select language
6. Click **Genera PDF**

---

## Technical Notes

- PDF renderer adapted from `digital-invoice-to-pdf` for browser use
- Font loaded from `/fonts/RobotoMono-Regular.ttf`
- Logo stored as base64 in IndexedDB config
- Bundle size increased by ~700KB (react-pdf library)

---

## Next Steps

- [x] Edit invoice data before generating
- [x] Add drag-and-drop for XML upload
- [ ] Add settings to override footer text and link
