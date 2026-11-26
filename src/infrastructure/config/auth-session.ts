export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
export const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = '30d';

const durationUnits = {
  s: 1_000,
  m: 60_000,
  h: 60 * 60_000,
  d: 24 * 60 * 60_000,
} as const;

export function durationToMilliseconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Duração inválida: ${duration}`);
  }

  const amount = Number(match[1]);
  const milliseconds =
    amount * durationUnits[match[2] as keyof typeof durationUnits];
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
    throw new Error(`Duração inválida: ${duration}`);
  }

  return milliseconds;
}
