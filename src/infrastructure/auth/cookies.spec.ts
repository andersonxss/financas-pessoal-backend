import { readCookie } from './cookies';

describe('readCookie', () => {
  it('reads the requested cookie without exposing neighboring values', () => {
    expect(readCookie('other=one; finance_access=token%20value; last=three', 'finance_access'))
      .toBe('token value');
  });

  it('returns undefined for absent or malformed headers', () => {
    expect(readCookie(undefined, 'finance_access')).toBeUndefined();
    expect(readCookie('other=value', 'finance_access')).toBeUndefined();
  });
});
