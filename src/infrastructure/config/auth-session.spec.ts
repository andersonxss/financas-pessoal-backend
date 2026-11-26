import {
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
  durationToMilliseconds,
} from './auth-session';

describe('auth session configuration', () => {
  it('keeps access short and refresh valid for thirty days by default', () => {
    expect(DEFAULT_ACCESS_TOKEN_EXPIRES_IN).toBe('15m');
    expect(DEFAULT_REFRESH_TOKEN_EXPIRES_IN).toBe('30d');
    expect(durationToMilliseconds(DEFAULT_ACCESS_TOKEN_EXPIRES_IN)).toBe(
      15 * 60_000,
    );
    expect(durationToMilliseconds(DEFAULT_REFRESH_TOKEN_EXPIRES_IN)).toBe(
      30 * 24 * 60 * 60_000,
    );
  });

  it.each(['', '0m', '15', '30days', '-1h'])(
    'rejects invalid duration %j',
    (duration) => {
      expect(() => durationToMilliseconds(duration)).toThrow(
        'Duração inválida',
      );
    },
  );
});
