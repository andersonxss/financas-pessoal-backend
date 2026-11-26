import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteStatusCommand } from "./delete-status.command";
import * as Repositories from "@repositories";
import { StatusNotFound } from "@errors";


@CommandHandler(DeleteStatusCommand)
export class DeleteStatusHandler implements ICommandHandler<DeleteStatusCommand> {
    constructor(
        @Inject('StatusRepository')
        private readonly repository: Repositories.IStatusRepository,
    ) { }

    async execute(command: DeleteStatusCommand): Promise<void> {
        const { id } = command;

        const statusExists = await this.repository.findById(id);

        if (!statusExists) {
            throw new StatusNotFound();
        }

        await this.repository.delete(id);
    }
}