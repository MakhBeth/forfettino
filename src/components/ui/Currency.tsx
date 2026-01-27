import { formatCurrencyParts } from '../../lib/utils/formatting';

interface CurrencyProps {
  amount: number;
  showSymbol?: boolean;
  /** When true, reserves space for decimals to align numbers in tables */
  tabular?: boolean;
}

/**
 * Renders a currency amount with monospace digits and proportional separators.
 * This keeps numbers aligned while reducing visual width of dots and commas.
 */
export function Currency({ amount, showSymbol = true, tabular = false }: CurrencyProps) {
  const parts = formatCurrencyParts(amount);
  const hasDecimals = amount % 1 !== 0;

  // When tabular and no decimals, add invisible placeholder for ",00" alignment
  // Width: comma (~0.25em in Inter) + 2 digits (~1.2em in Space Mono) ≈ 1.45em
  const decimalPlaceholder = tabular && !hasDecimals ? (
    <span style={{ visibility: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      ,<span style={{ fontFamily: 'Space Mono, monospace' }}>00</span>
    </span>
  ) : null;

  return (
    <span style={tabular ? { display: 'inline-block', textAlign: 'right' } : undefined}>
      {showSymbol && '€'}
      {parts.map((part, i) => (
        part.digits ? (
          <span key={i} style={{ fontFamily: 'Space Mono, monospace' }}>{part.formatted}</span>
        ) : (
          <span key={i} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{part.formatted}</span>
        )
      ))}
      {decimalPlaceholder}
    </span>
  );
}
