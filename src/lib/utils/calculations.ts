import type { WorkLog } from '../../types';
import { LIMITE_FATTURATO, INPS_GESTIONE_SEPARATA, COEFFICIENTI_ATECO } from '../constants/fiscali';

// Get work log quantity (handles legacy ore field)
export const getWorkLogQuantita = (log: WorkLog): number => {
  // If quantita is defined, use it
  if (log.quantita !== undefined && log.quantita !== null) {
    return log.quantita;
  }
  // Backward compatibility: derive from ore or tipo
  if (log.tipo === 'giornata') {
    return 1;
  }
  if (log.tipo === 'ore' && log.ore) {
    return parseFloat(log.ore) || 0;
  }
  return 0;
};

// Calculate average ATECO coefficient
export const calcolaCoefficientiMedio = (codiciAteco: Record<string, number>): number => {
  const valori = Object.values(codiciAteco);
  if (valori.length === 0) return COEFFICIENTI_ATECO.default;
  const somma = valori.reduce((acc, val) => acc + val, 0);
  return somma / valori.length;
};

export interface CalcoloFiscale {
  imponibile: number;
  inps: number;
  irpef: number;
  totaleTasse: number;
  nettoStimato: number;
  percentualeNetto: number;
  percentualeLimite: number;
}

// Calcolo fiscale forfettario completo.
// I contributi previdenziali (INPS) sono deducibili dal reddito imponibile
// prima di applicare l'imposta sostitutiva (art. 1, c. 64, L. 190/2014).
export const calcolaFiscale = (
  fatturato: number,
  coefficiente: number,
  aliquotaIrpef: number,
  aliquotaInps: number = INPS_GESTIONE_SEPARATA,
): CalcoloFiscale => {
  const imponibile = fatturato * (coefficiente / 100);
  const inps = imponibile * aliquotaInps;
  const irpef = (imponibile - inps) * aliquotaIrpef;
  const totaleTasse = irpef + inps;
  const nettoStimato = fatturato - totaleTasse;
  const percentualeNetto = fatturato > 0 ? (nettoStimato / fatturato) * 100 : 0;
  const percentualeLimite = (fatturato / LIMITE_FATTURATO) * 100;
  return { imponibile, inps, irpef, totaleTasse, nettoStimato, percentualeNetto, percentualeLimite };
};

// Calculate progress percentage towards limit
export const calcolaProgressoLimite = (fatturato: number): number => {
  return (fatturato / LIMITE_FATTURATO) * 100;
};

// Check if approaching limit
export const isApproachingLimit = (fatturato: number): boolean => {
  return fatturato >= LIMITE_FATTURATO * 0.8; // 80% threshold
};

// Check if over limit
export const isOverLimit = (fatturato: number): boolean => {
  return fatturato > LIMITE_FATTURATO;
};
