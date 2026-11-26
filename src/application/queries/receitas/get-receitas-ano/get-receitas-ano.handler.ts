import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetReceitasAnoQuery } from "./get-receitas-ano.query";
import * as Repositories from "@repositories";
import { Receitas } from "@entities";

@QueryHandler(GetReceitasAnoQuery)
export class GetReceitasAnoHandler implements IQueryHandler<GetReceitasAnoQuery> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
    ) { }

	async execute(query: GetReceitasAnoQuery): Promise<Receitas[]> {
		const { ano } = query;
        const receitas = await this.repository.findAllAno(ano);
		return receitas;
    }
}
