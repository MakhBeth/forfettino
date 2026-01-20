# {SPEC_NUMBER}-{spec-name}

> Epic: {EPIC_NAME}
> Dependencies: {lista tidigare specs som måste vara klara}

---

## Mål

{Kort beskrivning av vad denna spec ska åstadkomma}

---

## Functional Requirements (FR)

### FR1: {Krav 1}
{Detaljerad beskrivning}

**Acceptance Criteria:**
- [ ] {Testbart kriterium 1}
- [ ] {Testbart kriterium 2}

### FR2: {Krav 2}
{Detaljerad beskrivning}

**Acceptance Criteria:**
- [ ] {Testbart kriterium}

---

## Technical Implementation

### Filer att skapa/ändra
- `src/path/to/file.ts` - {vad}
- `src/path/to/other.ts` - {vad}

### Datamodell (om relevant)
```typescript
interface Example {
  id: string;
  // ...
}
```

### API/Endpoints (om relevant)
- `GET /api/resource` - {beskrivning}
- `POST /api/resource` - {beskrivning}

---

## E2E Test

> ⚠️ KRITISKT: Skriv Playwright-test som verifierar funktionaliteten

**Testfil:** `e2e/{spec-name}.spec.ts`

**Tester att skriva:**
```typescript
test('{beskrivning av test 1}', async ({ page }) => {
  // 1. {Steg 1}
  // 2. {Steg 2}
  // 3. Verifiera {resultat}
});

test('{beskrivning av test 2}', async ({ page }) => {
  // ...
});
```

**Vad testet ska verifiera:**
- [ ] {User flow fungerar}
- [ ] {Edge case hanteras}
- [ ] {Error state visas korrekt}

---

## Design Requirements

> Följ Design System från PRD.md

- [ ] Använd korrekta färg-tokens
- [ ] Följ spacing-scale
- [ ] Responsiv (mobile-first)
- [ ] Tillgänglig (keyboard, screen reader)

---

## Klart när

- [ ] Alla FR implementerade
- [ ] E2E-tester skrivna och passerar
- [ ] `npm run build` passerar
- [ ] Inga TypeScript-errors
- [ ] Följer design system
