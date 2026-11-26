import { Post, HttpCode, Body, Controller, HttpException, Put, Delete, Param, Get } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateCategoriaDto, UpdateCategoriaDto } from "@dtos";
import { CreateCategoriaCommand, DeleteCategoriaCommand, UpdateCategoriaCommand } from "@commands";
import { AppError } from "@errors";
import { GetCategoriaQuery, ListCategoriaQuery } from "@queries";
import { UserRole } from "@entities";
import { Roles } from "../../auth";

@Controller('categorias')
export class CategoriaController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Post()
    @HttpCode(201)
    async create(@Body() dto: CreateCategoriaDto) {
        try {
            const status = await this.commandBus.execute(
                new CreateCategoriaCommand(dto.name, dto.status_id)
            );
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Put(':id')
    @HttpCode(200)
    async update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
        try {
            const status = await this.commandBus.execute(
                new UpdateCategoriaCommand(id, dto.name, dto.status_id)
            );
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id') id: string) {
        try {
            const response = await this.commandBus.execute(new DeleteCategoriaCommand(id));
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
            const status = await this.queryBus.execute(new ListCategoriaQuery());
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Get(':id')
    @HttpCode(200)
    async findOne(@Param('id') id: string) {
        try {
            const status = await this.queryBus.execute(new GetCategoriaQuery(id));
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

}
