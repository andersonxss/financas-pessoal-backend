import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetDespesasSomaTotalMesQuery } from "./get-despesas-soma-total-mes.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";
import type { RedisService } from "@domain/services";
import { getCachedHomeReport, homeReportCacheKeys } from "@application/utils";

@QueryHandler(GetDespesasSomaTotalMesQuery)
export class GetDespesasSomaTotalMesHandler implements ICommandHandler<GetDespesasSomaTotalMesQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(query: GetDespesasSomaTotalMesQuery): Promise<Despesas[] | []> {
        const { ano } = query;
        return getCachedHomeReport(
            this.redisService,
            homeReportCacheKeys.despesasMensais(ano),
            () => this.repository.findAllSomalTotalDespesas(ano),
        );
    }
}
