import type { ValueTransformer } from 'typeorm';

// Keep the existing numeric API contract, but serialize exact decimal text to SQL.
function decimalText(value: number | string): string {
  const text = String(value);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text)) || Math.abs(Number(text)) > 99999999.99) {
    throw new RangeError('Valor monet?rio inv?lido');
  }
  const [whole, fraction = ''] = text.split('.');
  return whole + '.' + fraction.padEnd(2, '0');
}

export const moneyTransformer: ValueTransformer = {
  to: (value: number | string) => decimalText(value),
  from: (value: string) => Number(decimalText(value)),
};
