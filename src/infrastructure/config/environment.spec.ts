import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  const valid = {
    NODE_ENV: 'development',
    JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
    JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    POSTGRES_USER: 'migration_owner',
    POSTGRES_APP_USER: 'finance_app',
  };

  it('rejects using the migration owner as the runtime role', () => {
    expect(() => validateEnvironment({
      ...valid,
      POSTGRES_APP_USER: valid.POSTGRES_USER,
    })).toThrow('POSTGRES_APP_USER deve ser diferente de POSTGRES_USER');
  });

  it('accepts distinct migration and runtime roles', () => {
    expect(validateEnvironment(valid)).toBe(valid);
  });

  it('rejects token durations that cannot be applied to the cookies', () => {
    expect(() => validateEnvironment({
      ...valid,
      JWT_REFRESH_EXPIRES_IN: 'thirty-days',
    })).toThrow('JWT_REFRESH_EXPIRES_IN deve usar um valor positivo seguido de s, m, h ou d');
  });
});
