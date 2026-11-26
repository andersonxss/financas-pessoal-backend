import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import {
    CreateDataProcessDespesasHandler,
    CreateDespesasHandler,
    DeleteDespesasHandler,
    DeleteUploadDespesasHandler,
    UpdateDespesasHandler,
    UpdateDespesasStatusHandler
} from "@commands";
import { DespesasController } from "@controllers";
import { DespesasOrmEntity, DespesasRepositoryTypeorm } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
    GetDespesasAnoHandler,
    GetDespesasHandler,
    GetDespesasMesHandler,
    GetDespesasSomaTotalMesHandler,
    GetDespesasSomaTotalCategoriaHandler,
    GetDespesasSomaTotalCategoriaMesHandler,
    GetDespesasSomaTotalPagamentoHandler,
    GetDespesasTotalHandler,
    GetUploadDespesasHandler,
    ListUploadDespesasHandler,
    ListDespesasHandler,
} from "@queries";
import { ParcelasModule } from "./parcelas.module";
import { RedisModule } from "./redis.module";
import { RabbitMQModule } from "./rabbitMQ.module";
import { SocketIoModule } from "./socketIo.module";


@Module({
    imports: [TypeOrmModule.forFeature([DespesasOrmEntity]), CqrsModule, ParcelasModule, RedisModule, RabbitMQModule, SocketIoModule],
    controllers: [DespesasController],
    providers: [
        CreateDespesasHandler,
        UpdateDespesasHandler,
        UpdateDespesasStatusHandler,
        DeleteDespesasHandler,
        DeleteUploadDespesasHandler,
        ListDespesasHandler,
        GetDespesasHandler,
        GetDespesasMesHandler,
        GetDespesasAnoHandler,
        GetDespesasTotalHandler,
        GetDespesasSomaTotalMesHandler,
        GetDespesasSomaTotalCategoriaHandler,
        GetDespesasSomaTotalCategoriaMesHandler,
        GetDespesasSomaTotalPagamentoHandler,
        GetUploadDespesasHandler,
        ListUploadDespesasHandler,
        CreateDataProcessDespesasHandler,
        {
            provide: 'DespesasRepository',
            useClass: DespesasRepositoryTypeorm,
        },
    ],

})
export class DespesasModule { }
