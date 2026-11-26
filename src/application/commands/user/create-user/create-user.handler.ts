import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateUserCommand } from "./create-user.command";
import * as Repositories from "@repositories";
import { Email } from "@value-objects/user";
import { User } from "@entities";
import { randomUUID } from "crypto";
import { UserAlreadyExistsError } from "@errors";
import bcrypt from "bcryptjs";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
    ) { }

    async execute(command: CreateUserCommand): Promise<User> {
        const { name, email, password } = command;

        const userExists = await this.repository.findByEmail(email);
        if (userExists) {
            throw new UserAlreadyExistsError();
        }

        const emailVo = Email.create(email);
        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User(randomUUID(), name, emailVo.getValue(), passwordHash, new Date(), new Date());
        const userCreated = await this.repository.save(user);
        return userCreated;
    }
}