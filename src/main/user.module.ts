import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateUserHandler, DeleteUserHandler, UpdateUserHandler } from "@commands";
import { UserController } from "@controllers";
import { UserRepositoryTypeorm, UserOrmEntity } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetUserHandler, ListUsersHandler } from "@queries";

@Module({
    imports: [TypeOrmModule.forFeature([UserOrmEntity]), CqrsModule],
    controllers: [UserController],
    providers: [
        CreateUserHandler,
        UpdateUserHandler,
        DeleteUserHandler,
        ListUsersHandler,
        GetUserHandler,
        {
            provide: 'UserRepository',
            useClass: UserRepositoryTypeorm,
        },
    ],
})
export class UserModule { }
