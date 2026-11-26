import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetDespesasMesQuery } from "./get-despesas-mes.query";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";

@QueryHandler(GetDespesasMesQuery)
export class GetDespesasMesHandler implements ICommandHandler<GetDespesasMesQuery> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
    ) { }

    async execute(command: GetDespesasMesQuery): Promise<Despesas[] | []> {
        const { mes } = command;
        const despesas = await this.repository.findAllMes(mes);
        return despesas
    }
}