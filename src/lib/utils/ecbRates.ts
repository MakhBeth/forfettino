// ECB (BCE) Daily Exchange Rate Utility
// Rates are expressed as: 1 EUR = X foreign currency
// e.g., GBP rate = 0.835 means 1 EUR = 0.835 GBP

const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

let cachedRates: Record<string, number> | null = null;
let cachedRateDate: string | null = null;

/**
 * Fetch latest ECB reference exchange rates.
 * Returns a map of currency code → rate (1 EUR = X currency).
 * Rates are published ~16:00 CET on business days; weekends return Friday's rates.
 */
export async function fetchECBRates(): Promise<{ rates: Record<string, number>; date: string }> {
  const response = await fetch(ECB_DAILY_URL);
  if (!response.ok) throw new Error(`ECB API error: ${response.status}`);

  const xml = await response.text();

  // Extract date from <Cube time='2026-03-31'>
  const dateMatch = xml.match(/<Cube time='(\d{4}-\d{2}-\d{2})'>/);
  const date = dateMatch?.[1] || new Date().toISOString().split('T')[0];

  const rates: Record<string, number> = { EUR: 1 };
  const regex = /<Cube currency='(\w+)' rate='([\d.]+)'\/>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    rates[match[1]] = parseFloat(match[2]);
  }

  cachedRates = rates;
  cachedRateDate = date;

  return { rates, date };
}

/**
 * Get cached rates or fetch if not available.
 */
export async function getECBRates(): Promise<{ rates: Record<string, number>; date: string }> {
  if (cachedRates && cachedRateDate) {
    return { rates: cachedRates, date: cachedRateDate };
  }
  return fetchECBRates();
}

/**
 * Get rate for a specific currency. Returns null if not available.
 */
export async function getECBRate(currency: string): Promise<{ rate: number; date: string } | null> {
  if (currency === 'EUR') return { rate: 1, date: new Date().toISOString().split('T')[0] };

  const { rates, date } = await getECBRates();
  const rate = rates[currency];
  if (rate === undefined) return null;
  return { rate, date };
}

/**
 * Convert amount from foreign currency to EUR.
 * rate = how many units of foreign currency per 1 EUR (ECB convention)
 * e.g., 1000 GBP with rate 0.835 → 1000 / 0.835 = 1197.60 EUR
 */
export function convertToEUR(amount: number, rate: number): number {
  if (rate === 0) return 0;
  return amount / rate;
}

/**
 * Convert amount from EUR to foreign currency.
 */
export function convertFromEUR(amount: number, rate: number): number {
  return amount * rate;
}
