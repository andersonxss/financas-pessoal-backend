import { Post, HttpCode, Body, Controller, HttpException, Put, Delete, Param, Get } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateStatusDto, UpdateStatusDto } from "@dtos";
import { CreateStatusCommand, UpdateStatusCommand, DeleteStatusCommand } from "@commands";
import { AppError } from "@errors";
import { GetStatusQuery, ListStatusQuery } from "@queries";
import { UserRole } from "@entities";
import { Roles } from "../../auth";

@Controller('status')
export class StatusController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Post()
    @HttpCode(201)
    async create(@Body() dto: CreateStatusDto) {
        try {
            const status = await this.commandBus.execute(
                new CreateStatusCommand(dto.name)
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
    async update(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
        try {
            const status = await this.commandBus.execute(
                new UpdateStatusCommand(id, dto.name)
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
            const response = await this.commandBus.execute(new DeleteStatusCommand(id));
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
            const status = await this.queryBus.execute(new ListStatusQuery());
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
            const status = await this.queryBus.execute(new GetStatusQuery(id));
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

}
