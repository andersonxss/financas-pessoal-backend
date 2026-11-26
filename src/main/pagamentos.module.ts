import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreatePagamentosHandler, UpdatePagamentosHandler, UpdatePagamentosStatusHandler } from "@commands";
import { PagamentosController } from "@controllers";
import { PagamentosRepositoryTypeorm, PagamentosOrmEntity } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetPagamentosHandler, ListPagamentosHandler } from "@queries";

@Module({
    imports: [TypeOrmModule.forFeature([PagamentosOrmEntity]), CqrsModule],
    controllers: [PagamentosController],
    providers: [
        CreatePagamentosHandler,
        UpdatePagamentosHandler,
        UpdatePagamentosStatusHandler,
        ListPagamentosHandler,
        GetPagamentosHandler,
        {
            provide: 'PagamentosRepository',
            useClass: PagamentosRepositoryTypeorm,
        },
    ],
})
export class PagamentosModule { }
