import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListReceitasQuery } from "./list-receitas.query";
import * as Repositories from "@repositories";
import { Receitas } from "@entities";

@QueryHandler(ListReceitasQuery)
export class ListReceitasHandler implements IQueryHandler<ListReceitasQuery> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
    ) { }

	async execute(query: ListReceitasQuery): Promise<Receitas[]> {
        const { ano, mes } = query;
        const receitas = await this.repository.findAll(ano, mes);
		return receitas;
    }
}
