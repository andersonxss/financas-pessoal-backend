import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateAuthCommand } from "./create-auth.command";
import * as Repositories from "@repositories";
import { UserCredentialError } from "@errors";
import { JwtService } from '@nestjs/jwt';

@CommandHandler(CreateAuthCommand)
export class CreateAuthHandler implements ICommandHandler<CreateAuthCommand> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(command: CreateAuthCommand): Promise<any> {
        const { email, password } = command;

        const userExists = await this.repository.findByEmail(email);
        if (!userExists) {
            throw new UserCredentialError();
        }
        if (!(await this.repository.validatePassword(userExists, password))) {
            throw new UserCredentialError();
        }

        const payload = { id: userExists.id, email: userExists.email, name: userExists.name };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };

    }
}