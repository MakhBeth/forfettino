import type { Config, GestionePrevidenziale } from '../../types';

// Database constants
export const DB_NAME = 'ForfettarioDB';
export const DB_VERSION = 3;
export const STORES = ['config', 'clienti', 'fatture', 'workLogs', 'scadenze', 'users'] as const;

// Fiscal constants
export const LIMITE_FATTURATO = 85000;
export const LIMITE_USCITA_IMMEDIATA = 100000;
export const INPS_GESTIONE_SEPARATA = 0.2607;
export const RIDUZIONE_CONTRIBUTIVA_FORFETTARIO = 0.35;
export const ALIQUOTA_RIDOTTA = 0.05;
export const ALIQUOTA_STANDARD = 0.15;
export const MAX_HISTORICAL_YEARS = 10;

export const GESTIONI_PREVIDENZIALI: Array<{ value: GestionePrevidenziale; label: string }> = [
  { value: 'gestione_separata', label: 'Gestione Separata' },
  { value: 'artigiani', label: 'Gestione Artigiani' },
  { value: 'commercianti', label: 'Gestione Commercianti' },
];

// ATECO coefficients
export const COEFFICIENTI_ATECO: Record<string, number> = {
  '62': 67, '63': 67, '70': 78, '71': 78, '72': 78,
  '73': 78, '74': 78, '69': 78, '85': 78, '86': 78,
  'default': 78
};

// Payment scheduling constants
export const INTERESSE_RATEIZZAZIONE_MENSILE = 0.0033; // 0.33% monthly interest
export const GIORNO_SCADENZA_RATE = 16; // Standard monthly deadline
export const GIORNO_SCADENZA_AGOSTO = 20; // August exception
export const GIORNO_SCADENZA_SALDO = 30; // June 30 and November 30

// Default configuration
export const DEFAULT_CONFIG: Config = {
  id: 'main',
  userId: '',
  coefficiente: 0,
  aliquota: 0,
  ateco: [],
  partitaIva: '',
  annoApertura: new Date().getFullYear(),
  codiciAteco: [],
  nomeAttivita: '',
  aliquotaOverride: null,
  gestionePrevidenziale: 'gestione_separata',
  contributiInpsFissi: null,
  riduzioneContributiva: false,
  valute: [{ codice: 'EUR', simbolo: '€' }],
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
