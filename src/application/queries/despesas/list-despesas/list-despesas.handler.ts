import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListDespesasQuery } from "./list-despesas.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";

@QueryHandler(ListDespesasQuery)
export class ListDespesasHandler implements ICommandHandler<ListDespesasQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
    ) { }

    async execute(query: ListDespesasQuery): Promise<Despesas[]> {
        const despesas = await this.repository.findAll(query.ano, query.mes);
        return despesas
    }
}