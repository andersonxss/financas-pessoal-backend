import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateUserCommand } from "./update-user.command";
import * as Repositories from "@repositories";
import { Email } from "@value-objects/user";
import { User } from "@entities";
import { UserAlreadyExistsError, UserNotFound } from "@errors";
import bcrypt from "bcryptjs";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
    ) { }

    async execute(command: UpdateUserCommand): Promise<any> {
        let { id, name, email, password } = command;

        const userExists = await this.repository.findById(id);
        if (!userExists) {
            throw new UserNotFound();
        }
        if (email && email !== userExists.email) {
            const existing = await this.repository.findByEmail(email);
            if (existing) {
                throw new UserAlreadyExistsError();
            }
        }
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            password = passwordHash;
        }

        const emailVo = Email.create(email);
        const user = new User(id, name, emailVo.getValue(), password, userExists.createdAt, new Date());
        return await this.repository.update(user);
    }
}