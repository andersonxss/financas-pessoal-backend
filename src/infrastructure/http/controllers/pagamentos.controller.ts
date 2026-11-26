import { Post, HttpCode, Body, Controller, HttpException, Put, Param, Get } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreatePagamentosDto, UpdatePagamentosDto } from "@dtos";
import { CreatePagamentosCommand, UpdatePagamentosCommand, UpdatePagamentosStatusCommand } from "@commands";
import { AppError } from "@errors";
import { GetPagamentosQuery, ListPagamentosQuery } from "@queries";
import { UserRole } from "@entities";
import { Roles } from "../../auth";

@Controller('pagamentos')
export class PagamentosController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Post()
    @HttpCode(201)
    async create(@Body() dto: CreatePagamentosDto) {
        try {
            const status = await this.commandBus.execute(
                new CreatePagamentosCommand(dto.name, dto.status_id)
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
    async update(@Param('id') id: string, @Body() dto: UpdatePagamentosDto) {
        try {
            const status = await this.commandBus.execute(
                new UpdatePagamentosCommand(id, dto.name, dto.status_id)
            );
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Put('/status/:id')
    @HttpCode(200)
    async updateStatus(@Param('id') id: string) {
        try {
            const status = await this.commandBus.execute(new UpdatePagamentosStatusCommand(id));
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }


    @Get()
    @HttpCode(200)
    async findAll() {
        try {
            const status = await this.queryBus.execute(new ListPagamentosQuery());
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
            const status = await this.queryBus.execute(new GetPagamentosQuery(id));
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

}
