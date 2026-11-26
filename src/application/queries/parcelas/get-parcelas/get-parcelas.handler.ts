import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetParcelasQuery } from "./get-parcelas.query";
import * as Repositories from "@repositories";
import { Parcelas } from "@entities";
import { ParcelasNotFound } from "@errors";

@QueryHandler(GetParcelasQuery)
export class GetParcelasHandler implements ICommandHandler<GetParcelasQuery> {
    constructor(
        @Inject('ParcelasRepository')
        private readonly repository: Repositories.IParcelasRepository,
    ) { }

    async execute(command: GetParcelasQuery): Promise<Parcelas> {
        const parcelas = await this.repository.findById(command.id);
        if (!parcelas) {
            throw new ParcelasNotFound();
        }
        return parcelas;
    }
}