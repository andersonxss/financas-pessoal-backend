import { Post, HttpCode, Body, Controller, HttpException, Put, Param, Get } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateParcelasDto, UpdateParcelasDto } from "@dtos";
import { CreateParcelasCommand, UpdateParcelasCommand } from "@commands";
import { AppError } from "@errors";
import { GetParcelasQuery, ListParcelasQuery } from "@queries";
import { UpdateDesativarStatusParcelasCommand } from "src/application/commands/parcelas/update-desativar-status-parcelas/update-desativar-status-parcelas.command";
import { UserRole } from "@entities";
import { Roles } from "../../auth";

@Controller('parcelas')
export class ParcelaController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Post()
    @HttpCode(201)
    async create(@Body() dto: CreateParcelasDto) {
        try {
            const status = await this.commandBus.execute(
                new CreateParcelasCommand(dto.name, dto.status_id)
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
    async update(@Param('id') id: string, @Body() dto: UpdateParcelasDto) {
        try {
            const status = await this.commandBus.execute(
                new UpdateParcelasCommand(id, dto.name, dto.status_id)
            );
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Put('/status/desativar/:id')
    @HttpCode(200)
    async updateDesativarStatus(@Param('id') id: string) {
        try {
            const status = await this.commandBus.execute(
                new UpdateDesativarStatusParcelasCommand(id)
            );
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
            const status = await this.queryBus.execute(new ListParcelasQuery());
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
            const status = await this.queryBus.execute(new GetParcelasQuery(id));
            return status;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

}
