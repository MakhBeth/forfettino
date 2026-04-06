import {
  ALIQUOTA_RIDOTTA,
  ALIQUOTA_STANDARD,
  COEFFICIENTI_ATECO,
  INPS_GESTIONE_SEPARATA,
  LIMITE_FATTURATO,
  LIMITE_USCITA_IMMEDIATA,
  RIDUZIONE_CONTRIBUTIVA_FORFETTARIO,
} from '../constants/fiscali';
import type { Config, GestionePrevidenziale } from '../../types';
import type { InpsCalculationInput } from './calculations';

export type RegimeThresholdStatus = 'within_limit' | 'next_year_exit' | 'immediate_exit';

export interface AccontiForfettarioInput {
  gestionePrevidenziale?: GestionePrevidenziale;
  impostaSostitutiva: number;
  inps: number;
  accontiImpostaPagati?: number;
  accontiInpsPagati?: number;
}

export interface AccontiForfettarioBreakdown {
  taxSaldoLordo: number;
  taxSaldo: number;
  tax1stAcconto: number;
  tax2ndAcconto: number;
  inpsSaldoLordo: number;
  inpsSaldo: number;
  inps1stAcconto: number;
  inps2ndAcconto: number;
  accontiIrpefPagati: number;
  accontiInpsPagati: number;
}

type PrevidenzialeConfig = Pick<Config, 'gestionePrevidenziale' | 'contributiInpsFissi' | 'riduzioneContributiva'>;

export interface ContributiPrevidenzialiBreakdown {
  label: string;
  amount: number;
  usesFixedAmount: boolean;
  includeInpsInScadenze: boolean;
  effectiveRate: number | null;
  baseFixedAmount: number | null;
  reductionApplied: boolean;
}

interface AliquotaImpostaOptions {
  annoApertura: number;
  annoImposta?: number;
  aliquotaOverride: number | null;
}

const normalizeAtecoCode = (code: string): string => code.replace(/\D/g, '');
const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

export const getGestionePrevidenzialeLabel = (gestionePrevidenziale: GestionePrevidenziale): string => {
  switch (gestionePrevidenziale) {
    case 'artigiani':
      return 'Gestione Artigiani';
    case 'commercianti':
      return 'Gestione Commercianti';
    case 'gestione_separata':
    default:
      return 'Gestione Separata';
  }
};

export const usesFixedContributiPrevidenziali = (gestionePrevidenziale: GestionePrevidenziale): boolean => {
  return gestionePrevidenziale === 'artigiani' || gestionePrevidenziale === 'commercianti';
};

export const includeInpsInScadenze = (gestionePrevidenziale: GestionePrevidenziale): boolean => {
  return gestionePrevidenziale === 'gestione_separata';
};

export const getRiduzioneContributivaMultiplier = (riduzioneContributiva: boolean): number => {
  return riduzioneContributiva ? 1 - RIDUZIONE_CONTRIBUTIVA_FORFETTARIO : 1;
};

export const getInpsCalculationInput = (config: PrevidenzialeConfig): InpsCalculationInput => {
  if (usesFixedContributiPrevidenziali(config.gestionePrevidenziale)) {
    const baseAmount = Math.max(0, config.contributiInpsFissi ?? 0);
    return {
      annualAmount: roundToTwoDecimals(baseAmount * getRiduzioneContributivaMultiplier(config.riduzioneContributiva)),
    };
  }

  return INPS_GESTIONE_SEPARATA;
};

export const calcolaContributiPrevidenziali = (
  imponibile: number,
  config: PrevidenzialeConfig,
): ContributiPrevidenzialiBreakdown => {
  const usesFixedAmount = usesFixedContributiPrevidenziali(config.gestionePrevidenziale);
  const label = getGestionePrevidenzialeLabel(config.gestionePrevidenziale);

  if (usesFixedAmount) {
    const baseFixedAmount = Math.max(0, config.contributiInpsFissi ?? 0);
    const amount = roundToTwoDecimals(baseFixedAmount * getRiduzioneContributivaMultiplier(config.riduzioneContributiva));

    return {
      label,
      amount,
      usesFixedAmount: true,
      includeInpsInScadenze: false,
      effectiveRate: null,
      baseFixedAmount,
      reductionApplied: config.riduzioneContributiva,
    };
  }

  return {
    label,
    amount: roundToTwoDecimals(imponibile * INPS_GESTIONE_SEPARATA),
    usesFixedAmount: false,
    includeInpsInScadenze: true,
    effectiveRate: INPS_GESTIONE_SEPARATA,
    baseFixedAmount: null,
    reductionApplied: false,
  };
};

export const getCoefficienteRedditivita = (codiceAteco: string): number => {
  const normalized = normalizeAtecoCode(codiceAteco);
  if (normalized.length < 2) {
    return COEFFICIENTI_ATECO.default;
  }

  const firstTwo = Number(normalized.slice(0, 2));
  const firstThree = normalized.length >= 3 ? Number(normalized.slice(0, 3)) : NaN;
  const firstFour = normalized.length >= 4 ? Number(normalized.slice(0, 4)) : NaN;

  if (firstFour === 4781) return 40;
  if (firstFour >= 4782 && firstFour <= 4789) return 54;
  if (firstThree === 461) return 62;
  if (firstThree >= 462 && firstThree <= 469) return 40;
  if (firstThree >= 471 && firstThree <= 477) return 40;

  if (firstTwo >= 10 && firstTwo <= 11) return 40;
  if (firstTwo >= 55 && firstTwo <= 56) return 40;

  if (
    (firstTwo >= 1 && firstTwo <= 3) ||
    (firstTwo >= 5 && firstTwo <= 9) ||
    (firstTwo >= 12 && firstTwo <= 33) ||
    firstTwo === 35 ||
    (firstTwo >= 36 && firstTwo <= 39) ||
    (firstTwo >= 53 && firstTwo <= 63) ||
    (firstTwo >= 77 && firstTwo <= 82) ||
    firstTwo === 84 ||
    (firstTwo >= 90 && firstTwo <= 93) ||
    (firstTwo >= 94 && firstTwo <= 99)
  ) {
    return 67;
  }

  if (
    (firstTwo >= 64 && firstTwo <= 66) ||
    (firstTwo >= 69 && firstTwo <= 75) ||
    firstTwo === 85 ||
    (firstTwo >= 86 && firstTwo <= 88)
  ) {
    return 78;
  }

  if ((firstTwo >= 41 && firstTwo <= 43) || firstTwo === 68) {
    return 86;
  }

  return COEFFICIENTI_ATECO.default;
};

export const calcolaCoefficienteMedioAteco = (codiciAteco: string[]): number => {
  if (codiciAteco.length === 0) {
    return COEFFICIENTI_ATECO.default;
  }

  const somma = codiciAteco.reduce((acc, code) => acc + getCoefficienteRedditivita(code), 0);
  return somma / codiciAteco.length;
};

export const getAliquotaImpostaSostitutiva = ({
  annoApertura,
  annoImposta = new Date().getFullYear(),
  aliquotaOverride,
}: AliquotaImpostaOptions): number => {
  if (aliquotaOverride !== null && aliquotaOverride >= 0 && aliquotaOverride <= 100) {
    return aliquotaOverride / 100;
  }

  const anniAttivita = annoImposta - annoApertura;
  return anniAttivita < 5 ? ALIQUOTA_RIDOTTA : ALIQUOTA_STANDARD;
};

export const getRegimeThresholdStatus = (fatturato: number): RegimeThresholdStatus => {
  if (fatturato > LIMITE_USCITA_IMMEDIATA) {
    return 'immediate_exit';
  }

  if (fatturato > LIMITE_FATTURATO) {
    return 'next_year_exit';
  }

  return 'within_limit';
};

export const calcolaAccontiForfettario = ({
  gestionePrevidenziale = 'gestione_separata',
  impostaSostitutiva,
  inps,
  accontiImpostaPagati = 0,
  accontiInpsPagati = 0,
}: AccontiForfettarioInput): AccontiForfettarioBreakdown => {
  const taxSaldoLordo = roundToTwoDecimals(impostaSostitutiva);
  const inpsSaldoLordo = roundToTwoDecimals(inps);

  return {
    taxSaldoLordo,
    taxSaldo: roundToTwoDecimals(Math.max(0, taxSaldoLordo - accontiImpostaPagati)),
    tax1stAcconto: roundToTwoDecimals(taxSaldoLordo * 0.5),
    tax2ndAcconto: roundToTwoDecimals(taxSaldoLordo * 0.5),
    inpsSaldoLordo,
    inpsSaldo: roundToTwoDecimals(Math.max(0, inpsSaldoLordo - accontiInpsPagati)),
    inps1stAcconto: includeInpsInScadenze(gestionePrevidenziale) ? roundToTwoDecimals(inpsSaldoLordo * 0.4) : 0,
    inps2ndAcconto: includeInpsInScadenze(gestionePrevidenziale) ? roundToTwoDecimals(inpsSaldoLordo * 0.4) : 0,
    accontiIrpefPagati: roundToTwoDecimals(accontiImpostaPagati),
    accontiInpsPagati: roundToTwoDecimals(accontiInpsPagati),
  };
};
