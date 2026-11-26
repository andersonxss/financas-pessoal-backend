import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateParcelasCommand } from "./create-parcelas.command";
import * as Repositories from "@repositories";
import { Parcelas } from "@entities";
import { randomUUID } from "crypto";
import { ParcelasAlreadyExistsError } from "@errors";

@CommandHandler(CreateParcelasCommand)
export class CreateParcelasHandler implements ICommandHandler<CreateParcelasCommand> {
    constructor(
        @Inject('ParcelasRepository')
        private readonly repository: Repositories.IParcelasRepository,

    ) { }

    async execute(command: CreateParcelasCommand): Promise<Parcelas> {
        const { name, status_id } = command;

        const parcelasExists = await this.repository.findByName(name);
        if (parcelasExists) {
            throw new ParcelasAlreadyExistsError();
        }

        const parcelas = new Parcelas(randomUUID(), name, status_id, new Date(), new Date());
        const parcelasCreated = await this.repository.save(parcelas);
        return parcelasCreated;
    }
}