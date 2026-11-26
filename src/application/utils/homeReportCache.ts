import type { RedisService } from '@domain/services';
import { Logger } from '@nestjs/common';

const logger = new Logger('HomeReportCache');

export const homeReportCacheKeys = {
  despesasTotal: 'home:despesas:total',
  despesasMensais: (ano: number) => `home:despesas:mensais:${ano}`,
  despesasCategorias: (ano: number) => `home:despesas:categorias:${ano}`,
  despesasCategoriasMensais: (ano: number) =>
    `home:despesas:categorias:mensais:${ano}`,
  despesasPagamentos: (ano: number) => `home:despesas:pagamentos:${ano}`,
  receitasMensais: (ano: number) => `home:receitas:mensais:${ano}`,
} as const;

const homeReportCachePatterns = {
  despesas: 'home:despesas:*',
  receitas: 'home:receitas:*',
} as const;

export async function getCachedHomeReport<T>(
  redisService: RedisService,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redisService.get<T>(key);
    if (cached !== null) return cached;
  } catch (error) {
    logger.warn(
      `Falha ao consultar cache do relatório: ${errorMessage(error)}`,
    );
  }

  const result = await load();

  try {
    await redisService.set(key, result);
  } catch (error) {
    logger.warn(
      `Falha ao preencher cache do relatório: ${errorMessage(error)}`,
    );
  }

  return result;
}

export async function invalidateHomeDespesasCache(
  redisService: RedisService,
): Promise<void> {
  await invalidateByPattern(redisService, homeReportCachePatterns.despesas);
}

export async function invalidateHomeReceitasCache(
  redisService: RedisService,
): Promise<void> {
  await invalidateByPattern(redisService, homeReportCachePatterns.receitas);
}

async function invalidateByPattern(
  redisService: RedisService,
  pattern: string,
): Promise<void> {
  try {
    await redisService.invalidateByPattern(pattern);
  } catch (error) {
    logger.warn(
      `Falha ao invalidar cache do relatório: ${errorMessage(error)}`,
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'erro desconhecido';
}
