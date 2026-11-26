import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteUserCommand } from "./delete-user.command";
import * as Repositories from "@repositories";
import { UserNotFound } from "@errors";
import { response } from "express";

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
    ) { }

    async execute(command: DeleteUserCommand): Promise<any> {
        const { id } = command;

        const userExists = await this.repository.findById(id);

        if (!userExists) {
            throw new UserNotFound();
        }

        await this.repository.delete(id);
    }
}