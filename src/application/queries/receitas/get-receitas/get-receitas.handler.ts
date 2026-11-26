import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetReceitasQuery } from "./get-receitas.query";
import * as Repositories from "@repositories";
import { Receitas } from "@entities";
import { ReceitasNotFound } from "@errors";

@QueryHandler(GetReceitasQuery)
export class GetReceitasHandler implements IQueryHandler<GetReceitasQuery> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
    ) { }

	async execute(query: GetReceitasQuery): Promise<Receitas> {
		const receitas = await this.repository.findById(query.id);
        if (!receitas) {
            throw new ReceitasNotFound();
        }
        return receitas;
    }
}
