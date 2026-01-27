/**
 * Format a currency amount with Italian locale.
 * Shows decimals only if the amount has cents.
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "1.234" or "1.234,50")
 */
export const formatCurrency = (amount: number): string => {
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
    useGrouping: true,
  }).format(amount);
};

export type CurrencyPartType = 'integer' | 'group' | 'decimal' | 'fraction';

export interface CurrencyPart {
  type: CurrencyPartType;
  value: string;
  isDigit: boolean;
}

/**
 * Parse a user-entered string (Italian locale) into a number.
 * Handles "1.000,50" → 1000.50 by removing thousand separators (dots)
 * before treating comma as decimal separator.
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (hasComma) {
    return parseFloat(cleaned.replace(',', '.')) || 0;
  }

  return parseFloat(cleaned) || 0;
};

/**
 * Render a currency amount with monospace digits and proportional separators.
 * This reduces visual width while keeping digits aligned.
 * @param amount - The amount to format
 * @returns Array of parts for custom rendering
 */
export const formatCurrencyParts = (amount: number): CurrencyPart[] => {
  const hasDecimals = amount % 1 !== 0;
  const parts = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
    useGrouping: true,
  }).formatToParts(amount);

  return parts.map(part => ({
    type: part.type as CurrencyPartType,
    value: part.value,
    isDigit: part.type === 'integer' || part.type === 'fraction',
  }));
};
