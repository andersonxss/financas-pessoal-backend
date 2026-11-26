import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { DespesaCategoriaTotal, IDespesasRepository } from '@repositories';
import { GetDespesasSomaTotalCategoriaQuery } from './get-despesas-soma-total-categoria.query';
import type { RedisService } from '@domain/services';
import { getCachedHomeReport, homeReportCacheKeys } from '@application/utils';

@QueryHandler(GetDespesasSomaTotalCategoriaQuery)
export class GetDespesasSomaTotalCategoriaHandler implements IQueryHandler<GetDespesasSomaTotalCategoriaQuery> {
  constructor(
    @Inject('DespesasRepository')
    private readonly repository: IDespesasRepository,
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) {}

  execute(
    query: GetDespesasSomaTotalCategoriaQuery,
  ): Promise<DespesaCategoriaTotal[]> {
    return getCachedHomeReport(
      this.redisService,
      homeReportCacheKeys.despesasCategorias(query.ano),
      () => this.repository.findTotalByCategoria(query.ano),
    );
  }
}
