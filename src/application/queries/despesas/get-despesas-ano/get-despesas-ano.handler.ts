import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetDespesasAnoQuery } from "./get-despesas-ano.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";

@QueryHandler(GetDespesasAnoQuery)
export class GetDespesasAnoHandler implements ICommandHandler<GetDespesasAnoQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
    ) { }

    async execute(command: GetDespesasAnoQuery): Promise<Despesas[]> {
        const { ano } = command;
        const despesas = await this.repository.findAllAno(ano);
        return despesas
    }
}