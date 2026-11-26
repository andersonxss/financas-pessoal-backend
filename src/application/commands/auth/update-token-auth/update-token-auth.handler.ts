import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import * as Repositories from "@repositories";
import { UserCredentialError } from "@errors";
import { JwtService } from '@nestjs/jwt';
import { UpdateTokenAuthCommand } from "./update-token-auth.command";

@CommandHandler(UpdateTokenAuthCommand)
export class UpdateTokenAuthHandler implements ICommandHandler<UpdateTokenAuthCommand> {
    constructor(
        @Inject('UserRepository')
        private readonly repository: Repositories.IUserRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(command: UpdateTokenAuthCommand): Promise<any> {
        const { token } = command;

        const { id } = await this.jwtService.verifyAsync(token);

        const userExists = await this.repository.findById(id);
        if (!userExists) {
            throw new UserCredentialError();
        }

        const payload = { id: userExists.id, email: userExists.email, name: userExists.name };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };

    }

}