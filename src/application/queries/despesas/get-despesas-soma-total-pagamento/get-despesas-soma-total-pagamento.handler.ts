import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { DespesaPagamentoTotal, IDespesasRepository } from '@repositories';
import { GetDespesasSomaTotalPagamentoQuery } from './get-despesas-soma-total-pagamento.query';
import type { RedisService } from '@domain/services';
import { getCachedHomeReport, homeReportCacheKeys } from '@application/utils';

@QueryHandler(GetDespesasSomaTotalPagamentoQuery)
export class GetDespesasSomaTotalPagamentoHandler
  implements IQueryHandler<GetDespesasSomaTotalPagamentoQuery> {
  constructor(
    @Inject('DespesasRepository')
    private readonly repository: IDespesasRepository,
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) { }

  async execute(
    query: GetDespesasSomaTotalPagamentoQuery,
  ): Promise<DespesaPagamentoTotal[]> {
    return getCachedHomeReport(
      this.redisService,
      homeReportCacheKeys.despesasPagamentos(query.ano),
      () => this.repository.findTotalByPagamento(query.ano),
    );
  }
}
