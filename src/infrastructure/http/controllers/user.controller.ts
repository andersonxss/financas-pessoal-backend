import { Post, HttpCode, Body, Controller, HttpException, Put, Delete, Param, Get } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateUserDto, UpdateUserDto } from "@dtos";
import { CreateUserCommand, DeleteUserCommand, UpdateUserCommand } from "@commands";
import { AppError } from "@errors";
import { GetUserQuery, ListUsersQuery } from "@queries";
import { UserRole } from "@entities";
import { Roles } from "../../auth";

@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('users')
export class UserController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @Post()
    @HttpCode(201)
    async create(@Body() dto: CreateUserDto) {
        try {
            const user = await this.commandBus.execute(
                new CreateUserCommand(dto.name, dto.email, dto.password)
            );
            return user;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Put()
    @HttpCode(200)
    async update(@Body() dto: UpdateUserDto) {
        try {
            const user = await this.commandBus.execute(
                new UpdateUserCommand(dto.id, dto.name, dto.email, dto.password)
            );
            return user;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id') id: string) {
        try {
            const response = await this.commandBus.execute(new DeleteUserCommand(id));
            return response;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Get()
    @HttpCode(200)
    async findAll() {
        try {
            const users = await this.queryBus.execute(new ListUsersQuery());
            return users;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Get(':id')
    @HttpCode(200)
    async findOne(@Param('id') id: string) {
        try {
            const user = await this.queryBus.execute(new GetUserQuery(id));
            return user;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

}
