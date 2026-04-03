import test from 'node:test';
import assert from 'node:assert/strict';

import { calcolaFiscale } from './calculations';
import {
  calcolaAccontiForfettario,
  calcolaContributiPrevidenziali,
  calcolaCoefficienteMedioAteco,
  getAliquotaImpostaSostitutiva,
  getCoefficienteRedditivita,
  getGestionePrevidenzialeLabel,
  getRegimeThresholdStatus,
} from './forfettario';

test('maps ambulantato non alimentare ATECO 47.82 to 54%', () => {
  assert.equal(getCoefficienteRedditivita('47.82.10'), 54);
});

test('maps professional ATECO 72 to 78%', () => {
  assert.equal(getCoefficienteRedditivita('72.11.00'), 78);
});

test('averages full official ATECO coefficients instead of two-digit shortcuts', () => {
  assert.equal(calcolaCoefficienteMedioAteco(['47.82.10', '72.11.00']), 66);
});

test('keeps the 5% startup rate for the fifth fiscal year', () => {
  assert.equal(
    getAliquotaImpostaSostitutiva({
      annoApertura: 2021,
      annoImposta: 2025,
      aliquotaOverride: null,
    }),
    0.05,
  );
});

test('prefers manual tax-rate override when present', () => {
  assert.equal(
    getAliquotaImpostaSostitutiva({
      annoApertura: 2021,
      annoImposta: 2025,
      aliquotaOverride: 12.5,
    }),
    0.125,
  );
});

test('distinguishes delayed exit over 85k from immediate exit over 100k', () => {
  assert.equal(getRegimeThresholdStatus(90000), 'next_year_exit');
  assert.equal(getRegimeThresholdStatus(100001), 'immediate_exit');
});

test('calculates saldo and acconti with 50/50 substitute tax and 40/40 INPS split', () => {
  assert.deepEqual(
    calcolaAccontiForfettario({
      impostaSostitutiva: 7274,
      inps: 13684,
      accontiImpostaPagati: 1594,
      accontiInpsPagati: 5287,
    }),
    {
      taxSaldoLordo: 7274,
      taxSaldo: 5680,
      tax1stAcconto: 3637,
      tax2ndAcconto: 3637,
      inpsSaldoLordo: 13684,
      inpsSaldo: 8397,
      inps1stAcconto: 5473.6,
      inps2ndAcconto: 5473.6,
      accontiIrpefPagati: 1594,
      accontiInpsPagati: 5287,
    },
  );
});

test('never returns a negative saldo when previous acconti exceed annual tax', () => {
  const result = calcolaAccontiForfettario({
    impostaSostitutiva: 1000,
    inps: 2000,
    accontiImpostaPagati: 1500,
    accontiInpsPagati: 2500,
  });

  assert.equal(result.taxSaldo, 0);
  assert.equal(result.inpsSaldo, 0);
  assert.equal(result.tax1stAcconto + result.tax2ndAcconto, 1000);
  assert.equal(result.inps1stAcconto + result.inps2ndAcconto, 1600);
});

test('computes gestione separata contributions from imponibile percentage', () => {
  const result = calcolaContributiPrevidenziali(33500, {
    gestionePrevidenziale: 'gestione_separata',
    contributiInpsFissi: null,
    riduzioneContributiva: false,
  });

  assert.equal(result.label, 'Gestione Separata');
  assert.equal(result.usesFixedAmount, false);
  assert.equal(result.includeInpsInScadenze, true);
  assert.equal(result.amount, 8733.45);
  assert.equal(result.effectiveRate, 0.2607);
});

test('applies 35 percent reduction to fixed artigiani contributions', () => {
  const result = calcolaContributiPrevidenziali(33500, {
    gestionePrevidenziale: 'artigiani',
    contributiInpsFissi: 4521.36,
    riduzioneContributiva: true,
  });

  assert.equal(result.label, 'Gestione Artigiani');
  assert.equal(result.usesFixedAmount, true);
  assert.equal(result.includeInpsInScadenze, false);
  assert.equal(result.amount, 2938.88);
  assert.equal(result.reductionApplied, true);
});

test('uses fixed INPS amount as deductible contribution in fiscal calculation', () => {
  const result = calcolaFiscale(50000, 67, 0.15, { annualAmount: 2938.88 });

  assert.equal(result.imponibile, 33500);
  assert.equal(result.inps, 2938.88);
  assert.equal(result.irpef, 4584.17);
  assert.equal(result.totaleTasse, 7523.05);
  assert.equal(result.nettoStimato, 42476.95);
});

test('does not create INPS acconti in scadenze for artigiani fixed contributions', () => {
  const result = calcolaAccontiForfettario({
    gestionePrevidenziale: 'artigiani',
    impostaSostitutiva: 7274,
    inps: 2938.88,
    accontiImpostaPagati: 1594,
    accontiInpsPagati: 1200,
  });

  assert.equal(result.inpsSaldo, 1738.88);
  assert.equal(result.inps1stAcconto, 0);
  assert.equal(result.inps2ndAcconto, 0);
});

test('deduces only contributi versati (not full INPS) when provided', () => {
  const result = calcolaFiscale(78343.02, 67, 0.15, 0.2607, 3995);

  assert.equal(result.imponibile, 52489.82);
  assert.equal(result.inps, 13684.10);
  assert.equal(result.irpef, 7274.22);
});

test('deduces full INPS when contributiVersati is omitted', () => {
  const result = calcolaFiscale(78343.02, 67, 0.15, 0.2607);

  assert.equal(result.imponibile, 52489.82);
  assert.equal(result.inps, 13684.10);
  assert.equal(result.irpef, 5820.86);
});

test('returns readable labels for previdenziale management types', () => {
  assert.equal(getGestionePrevidenzialeLabel('gestione_separata'), 'Gestione Separata');
  assert.equal(getGestionePrevidenzialeLabel('artigiani'), 'Gestione Artigiani');
  assert.equal(getGestionePrevidenzialeLabel('commercianti'), 'Gestione Commercianti');
});
