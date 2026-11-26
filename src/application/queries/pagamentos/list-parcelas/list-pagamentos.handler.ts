import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListPagamentosQuery } from "./list-pagamentos.query";
import * as Repositories from "@repositories";
import { Pagamentos } from "@entities";

@QueryHandler(ListPagamentosQuery)
export class ListPagamentosHandler implements ICommandHandler<ListPagamentosQuery> {
    constructor(
        @Inject('PagamentosRepository')
        private readonly repository: Repositories.IPagamentosRepository,
    ) { }

    async execute(): Promise<Pagamentos[]> {
        const pagamentos = await this.repository.findAll();
        return pagamentos
    }
}