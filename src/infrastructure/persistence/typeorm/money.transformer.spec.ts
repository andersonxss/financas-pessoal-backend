import { moneyTransformer } from './money.transformer';

describe('moneyTransformer', () => {
  it.each([[0.01, '0.01'], [1, '1.00'], [1234.56, '1234.56'], [0, '0.00'], [-0.01, '-0.01'], [99999999.99, '99999999.99']])('round trips %s reais', (value, decimal) => {
    expect(moneyTransformer.to(value)).toBe(decimal);
    expect(moneyTransformer.from(decimal)).toBe(value);
  });
  it.each([NaN, Infinity, 0.001, 100000000, '1.234,56', '1abc'])('rejects %s without rounding', value => {
    expect(() => moneyTransformer.to(value)).toThrow();
  });
});
