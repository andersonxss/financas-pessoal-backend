import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetDespesasTotalQuery } from "./get-despesas-total.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";
import type { RedisService } from "@domain/services";
import { getCachedHomeReport, homeReportCacheKeys } from "@application/utils";

@QueryHandler(GetDespesasTotalQuery)
export class GetDespesasTotalHandler implements ICommandHandler<GetDespesasTotalQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(): Promise<Despesas[] | []> {
        return getCachedHomeReport(
            this.redisService,
            homeReportCacheKeys.despesasTotal,
            () => this.repository.findAllTotalDespesas(),
        );
    }
}
