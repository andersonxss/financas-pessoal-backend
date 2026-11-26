import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetPagamentosQuery } from "./get-pagamentos.query";
import * as Repositories from "@repositories";
import { Pagamentos } from "@entities";
import { PagamentosNotFound } from "@errors";

@QueryHandler(GetPagamentosQuery)
export class GetPagamentosHandler implements ICommandHandler<GetPagamentosQuery> {
    constructor(
        @Inject('PagamentosRepository')
        private readonly repository: Repositories.IPagamentosRepository,
    ) { }

    async execute(command: GetPagamentosQuery): Promise<Pagamentos> {
        const pagamentos = await this.repository.findById(command.id);
        if (!pagamentos) {
            throw new PagamentosNotFound();
        }
        return pagamentos;
    }
}