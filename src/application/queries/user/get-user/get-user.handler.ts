import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUserQuery } from "./get-user.query";
import * as Repositories from "@repositories";
import { User } from "@entities";
import { UserNotFound } from "@errors";

@QueryHandler(GetUserQuery)
export class GetUserHandler implements ICommandHandler<GetUserQuery> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
    ) { }

    async execute(command: GetUserQuery): Promise<User> {
        const user = await this.repository.findById(command.id);
        if (!user) {
            throw new UserNotFound();
        }
        return user;
    }
}