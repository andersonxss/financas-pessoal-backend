import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListUsersQuery } from "./list-users.query";
import * as Repositories from "@repositories";
import { User } from "@entities";

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements ICommandHandler<ListUsersQuery> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
    ) { }

    async execute(): Promise<User[]> {
        const users = await this.repository.findAll();
        return users
    }
}