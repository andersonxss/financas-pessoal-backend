import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetReceitasMesQuery } from "./get-receitas-mes.query";
import * as Repositories from "@repositories";
import { Receitas } from "@entities";

@QueryHandler(GetReceitasMesQuery)
export class GetReceitasMesHandler implements IQueryHandler<GetReceitasMesQuery> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
    ) { }

	async execute(query: GetReceitasMesQuery): Promise<Receitas[]> {
		const { mes } = query;
        const receitas = await this.repository.findAllMes(mes);
		return receitas;
    }
}
