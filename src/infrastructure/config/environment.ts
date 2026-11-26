import { durationToMilliseconds } from './auth-session';

const REQUIRED = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
const TOKEN_DURATION_KEYS = ['JWT_ACCESS_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'] as const;

export function validateEnvironment(environment: Record<string, unknown>) {
  if (environment.NODE_ENV !== 'test') {
    const missing = REQUIRED.filter((key) => {
      const value = environment[key];
      return typeof value !== 'string' || value.length < 32;
    });
    if (missing.length) {
      throw new Error(`${missing.join(', ')} deve(m) conter ao menos 32 caracteres`);
    }

    for (const key of TOKEN_DURATION_KEYS) {
      const value = environment[key];
      if (typeof value === 'string') {
        try {
          durationToMilliseconds(value);
        } catch {
          throw new Error(`${key} deve usar um valor positivo seguido de s, m, h ou d`);
        }
      }
    }

    if (
      typeof environment.POSTGRES_APP_USER === 'string' &&
      environment.POSTGRES_APP_USER === environment.POSTGRES_USER
    ) {
      throw new Error('POSTGRES_APP_USER deve ser diferente de POSTGRES_USER');
    }
  }
  return environment;
}
