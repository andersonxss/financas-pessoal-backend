import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetDespesasQuery } from "./get-despesas.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";
import { DespesasNotFound } from "@errors";

@QueryHandler(GetDespesasQuery)
export class GetDespesasHandler implements ICommandHandler<GetDespesasQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
    ) { }

    async execute(command: GetDespesasQuery): Promise<Despesas> {
        const despesas = await this.repository.findById(command.id);
        if (!despesas) {
            throw new DespesasNotFound();
        }
        return despesas;
    }
}