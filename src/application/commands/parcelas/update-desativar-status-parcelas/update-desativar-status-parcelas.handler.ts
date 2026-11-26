import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateDesativarStatusParcelasCommand } from "./update-desativar-status-parcelas.command";
import * as Repositories from "@repositories";
import { Parcelas } from "@entities";
import { ParcelasNotFound } from "@errors";
import { statusEnum } from "@application/enums";

@CommandHandler(UpdateDesativarStatusParcelasCommand)
export class UpdateDesativarStatusParcelasHandler implements ICommandHandler<UpdateDesativarStatusParcelasCommand> {
    constructor(
        @Inject('ParcelasRepository')
        private readonly repository: Repositories.IParcelasRepository,
    ) { }

    async execute(command: UpdateDesativarStatusParcelasCommand): Promise<Parcelas> {
        let { id } = command;

        const parcelasExists = await this.repository.findById(id);
        if (!parcelasExists) {
            throw new ParcelasNotFound();
        }

        const parcelas = new Parcelas(id, parcelasExists.name, statusEnum.inativo, new Date(), new Date());
        return await this.repository.update(parcelas);
    }
}