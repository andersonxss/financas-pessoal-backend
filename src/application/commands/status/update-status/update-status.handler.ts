import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateStatusCommand } from "./update-status.command";
import * as Repositories from "@repositories";
import { Status } from "@entities";
import { StatusNotFound } from "@errors";

@CommandHandler(UpdateStatusCommand)
export class UpdateStatusHandler implements ICommandHandler<UpdateStatusCommand> {
    constructor(
        @Inject('StatusRepository')
        private readonly repository: Repositories.IStatusRepository,
    ) { }

    async execute(command: UpdateStatusCommand): Promise<Status> {
        let { id, name } = command;

        const statusExists = await this.repository.findById(id);
        if (!statusExists) {
            throw new StatusNotFound();
        }

        const status = new Status(id, name);
        return await this.repository.update(status);
    }
}