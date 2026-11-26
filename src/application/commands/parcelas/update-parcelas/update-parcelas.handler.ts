import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateParcelasCommand } from "./update-parcelas.command";
import * as Repositories from "@repositories";
import { Parcelas } from "@entities";
import { ParcelasNotFound } from "@errors";

@CommandHandler(UpdateParcelasCommand)
export class UpdateParcelasHandler implements ICommandHandler<UpdateParcelasCommand> {
    constructor(
        @Inject('ParcelasRepository')
        private readonly repository: Repositories.IParcelasRepository,
    ) { }

    async execute(command: UpdateParcelasCommand): Promise<Parcelas> {
        let { id, name, status_id } = command;

        const parcelasExists = await this.repository.findById(id);
        if (!parcelasExists) {
            throw new ParcelasNotFound();
        }

        const parcelas = new Parcelas(id, name, status_id);
        return await this.repository.update(parcelas);
    }
}