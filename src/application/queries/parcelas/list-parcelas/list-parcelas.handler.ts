import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListParcelasQuery } from "./list-parcelas.query";
import * as Repositories from "@repositories";
import { Parcelas } from "@entities";

@QueryHandler(ListParcelasQuery)
export class ListParcelasHandler implements ICommandHandler<ListParcelasQuery> {
    constructor(
        @Inject('ParcelasRepository')
        private readonly repository: Repositories.IParcelasRepository,
    ) { }

    async execute(): Promise<Parcelas[]> {
        const parcelas = await this.repository.findAll();
        return parcelas
    }
}