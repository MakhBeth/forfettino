# [PRODUKTNAMN] - Product Requirements Document

> Genererad av Ralph Inferno Discovery Loop
> Datum: [DATUM]

---

## Vision & Problem

### Vad löser vi?
{Beskriv problemet som produkten löser}

### Varför behövs detta?
{Marknadsbehov, pain points}

### Framgångskriterier
{Hur vet vi att vi lyckats?}

---

## Market Research

### Konkurrenter
| Namn | Styrkor | Svagheter | Pris |
|------|---------|-----------|------|
| {namn} | {styrkor} | {svagheter} | {pris} |

### Marknadsstorlek
{TAM/SAM/SOM om tillgängligt}

### Trender
{Relevanta marknadstrender}

---

## Target Users & Personas

### Persona 1: {Namn}
- **Roll:** {roll}
- **Mål:** {vad vill de uppnå}
- **Pain points:** {problem de har idag}
- **Tech-vana:** {låg/medel/hög}

### Persona 2: {Namn}
- **Roll:** {roll}
- **Mål:** {vad vill de uppnå}
- **Pain points:** {problem de har idag}
- **Tech-vana:** {låg/medel/hög}

---

## User Flows

### Flow 1: {Namn på flow}
```
1. Användaren {gör X}
2. Systemet {visar Y}
3. Användaren {väljer Z}
4. ...
```

### Flow 2: {Namn på flow}
```
1. ...
```

---

## Core Features (MVP)

### Must Have (P0)
- [ ] {Feature 1} - {kort beskrivning}
- [ ] {Feature 2} - {kort beskrivning}
- [ ] {Feature 3} - {kort beskrivning}

### Should Have (P1)
- [ ] {Feature 4}
- [ ] {Feature 5}

### Nice to Have (P2)
- [ ] {Feature 6}

---

## Future Features (Post-MVP)

| Feature | Prioritet | Anledning att vänta |
|---------|-----------|---------------------|
| {feature} | {v2/v3} | {varför inte nu} |

---

## Technical Requirements

### Tech Stack
| Layer | Teknologi | Motivering |
|-------|-----------|------------|
| Frontend | {tech} | {varför} |
| Backend | {tech} | {varför} |
| Database | {tech} | {varför} |
| Auth | {tech} | {varför} |
| Hosting | {tech} | {varför} |
| **Testing** | Playwright + Vitest | E2E + Unit |

### Arkitektur
{Övergripande arkitekturbeslut}

### Constraints
- {teknisk begränsning 1}
- {teknisk begränsning 2}

---

## Testing Strategy

### E2E Testing (Playwright)
> ⚠️ Playwright MÅSTE installeras i 01-project-setup

**Kritiska flöden att testa:**
- [ ] {User flow 1} - t.ex. login → dashboard
- [ ] {User flow 2} - t.ex. skapa item → se i lista
- [ ] {User flow 3} - t.ex. checkout → bekräftelse

**Test-setup:**
```bash
npx playwright install    # Installera browsers
npx playwright test       # Kör tester
```

### Unit Testing
- Framework: Vitest (för Vite-projekt)
- Fokus: Hooks, utilities, business logic
- Mål: >70% coverage på kritisk kod

---

## Non-Functional Requirements (NFR)

### Performance
| Metric | Mål | Hur mäta |
|--------|-----|----------|
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| Bundle size | <500KB | npm run build |

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation fungerar
- [ ] Screen reader kompatibel
- [ ] Kontrast-ratio >4.5:1

### Browser Support
- Chrome (senaste 2 versioner)
- Firefox (senaste 2 versioner)
- Safari (senaste 2 versioner)
- Mobile: iOS Safari, Chrome Android

### Security
- [ ] HTTPS only
- [ ] XSS-skydd
- [ ] CSRF-skydd (om forms)
- [ ] Rate limiting på API

---

## Design System

### Design Direction
**Känsla:** {adjektiv}, {adjektiv}, {adjektiv}
> Exempel: "Modern, minimalistisk, professionell"

**Inspiration:**
- {App 1} - {varför}
- {App 2} - {varför}

**INTE:**
- {Anti-pattern 1}
- {Anti-pattern 2}

### Design Tokens

**Färger:**
```css
--color-primary: {hex};      /* Huvudfärg */
--color-accent: {hex};       /* Accent, sparsamt */
--color-background: {hex};   /* Bakgrund */
--color-surface: {hex};      /* Kort, modaler */
--color-text: {hex};         /* Brödtext */
--color-text-muted: {hex};   /* Sekundär text */
--color-error: {hex};        /* Felmeddelanden */
--color-success: {hex};      /* Bekräftelser */
```

**Typografi:**
- Font: {font-family}
- Scale: 12/14/16/20/24/32px

**Spacing:**
- Base: 4px
- Scale: 4/8/12/16/24/32/48px

**Komponenter:**
- Border radius: {px}
- Shadows: {subtle/none/prominent}
- Animations: {snappy/smooth/none}

---

## Integrations Required

| Integration | Syfte | API Docs | Kostnad |
|-------------|-------|----------|---------|
| {namn} | {varför} | {url} | {pris} |

### API-nycklar som behövs
- [ ] `{ENV_VAR_NAME}` - {beskrivning}

---

## Business Model

### Revenue Streams
{Hur tjänar vi pengar?}

### Pricing
{Prismodell}

### Costs
| Kostnad | Uppskattning/mån |
|---------|------------------|
| Hosting | {belopp} |
| API:er | {belopp} |
| Övrigt | {belopp} |

---

## Legal/Compliance

### Krav
- [ ] **GDPR** - {hur hanterar vi?}
- [ ] **PCI-DSS** - {relevant? hur?}
- [ ] **Cookies** - {consent-hantering}

### Terms & Policies
- [ ] Privacy Policy behövs
- [ ] Terms of Service behövs
- [ ] Cookie Policy behövs

---

## Open Questions

> ⚠️ Denna sektion MÅSTE vara tom innan development kan starta

- [ ] {Öppen fråga 1}
- [ ] {Öppen fråga 2}

---

## Appendix

### Research Sources
- {url 1}
- {url 2}

### Notes
{Övriga anteckningar}
