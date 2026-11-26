import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetReceitasSomaTotalAnoQuery } from "./get-receitas-soma-total-ano.query";
import * as Repositories from "@repositories";
import type { IReceitasTotalMensal } from "@repositories";
import type { RedisService } from "@domain/services";
import { getCachedHomeReport, homeReportCacheKeys } from "@application/utils";

@QueryHandler(GetReceitasSomaTotalAnoQuery)
export class GetReceitasSomaTotalAnoHandler implements IQueryHandler<GetReceitasSomaTotalAnoQuery> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

	async execute(query: GetReceitasSomaTotalAnoQuery): Promise<IReceitasTotalMensal[]> {
        const { ano } = query;
        return getCachedHomeReport(
            this.redisService,
            homeReportCacheKeys.receitasMensais(ano),
            () => this.repository.findAllSomalTotalReceitasAno(ano),
        );
    }
}
