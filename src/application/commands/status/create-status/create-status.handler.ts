import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateStatusCommand } from "./create-status.command";
import * as Repositories from "@repositories";
import { Status } from "@entities";
import { randomUUID } from "crypto";
import { StatusAlreadyExistsError } from "@errors";


@CommandHandler(CreateStatusCommand)
export class CreateStatusHandler implements ICommandHandler<CreateStatusCommand> {
    constructor(
        @Inject('StatusRepository')
        private readonly repository: Repositories.IStatusRepository,
    ) { }

    async execute(command: CreateStatusCommand): Promise<Status> {
        const { name } = command;

        const statusExists = await this.repository.findByName(name);
        if (statusExists) {
            throw new StatusAlreadyExistsError();
        }

        const status = new Status(randomUUID(), name, new Date(), new Date());
        const statusCreated = await this.repository.save(status);
        return statusCreated;
    }
}