import { formatCurrencyParts } from '../../lib/utils/formatting';

interface CurrencyProps {
  amount: number;
  showSymbol?: boolean;
  /** When true, reserves space for decimals to align numbers in tables */
  tabular?: boolean;
}

const DECIMAL_SCALE = 0.6; // Decimals are 60% of the main font size

/**
 * Renders a currency amount with monospace digits and proportional separators.
 * This keeps numbers aligned while reducing visual width of dots and commas.
 * Decimal part (cents) is rendered smaller for visual hierarchy.
 */
export function Currency({ amount, showSymbol = true, tabular = false }: CurrencyProps) {
  const parts = formatCurrencyParts(amount);
  const hasDecimals = amount % 1 !== 0;

  // When tabular and no decimals, add invisible placeholder for ",00" alignment
  const decimalPlaceholder = tabular && !hasDecimals ? (
    <span style={{ visibility: 'hidden', fontSize: `${DECIMAL_SCALE}em`, fontFamily: 'Inter, system-ui, sans-serif' }}>
      ,<span style={{ fontFamily: 'Space Mono, monospace' }}>00</span>
    </span>
  ) : null;

  return (
    <span style={tabular ? { display: 'inline-block', textAlign: 'right' } : undefined}>
      {showSymbol && '€'}
      {parts.map((part, i) => {
        const isDecimalPart = part.type === 'decimal' || part.type === 'fraction';
        const fontSize = isDecimalPart ? `${DECIMAL_SCALE}em` : undefined;

        return part.isDigit ? (
          <span key={i} style={{ fontFamily: 'Space Mono, monospace', fontSize }}>{part.value}</span>
        ) : (
          <span key={i} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize }}>{part.value}</span>
        );
      })}
      {decimalPlaceholder}
    </span>
  );
}
