import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type {
  DespesaCategoriaMensal,
  IDespesasRepository,
} from '@repositories';
import type { RedisService } from '@domain/services';
import { getCachedHomeReport, homeReportCacheKeys } from '@application/utils';
import { GetDespesasSomaTotalCategoriaMesQuery } from './get-despesas-soma-total-categoria-mes.query';

@QueryHandler(GetDespesasSomaTotalCategoriaMesQuery)
export class GetDespesasSomaTotalCategoriaMesHandler implements IQueryHandler<GetDespesasSomaTotalCategoriaMesQuery> {
  constructor(
    @Inject('DespesasRepository')
    private readonly repository: IDespesasRepository,
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) {}

  execute(
    query: GetDespesasSomaTotalCategoriaMesQuery,
  ): Promise<DespesaCategoriaMensal[]> {
    return getCachedHomeReport(
      this.redisService,
      homeReportCacheKeys.despesasCategoriasMensais(query.ano),
      () => this.repository.findTotalByCategoriaMes(query.ano),
    );
  }
}
