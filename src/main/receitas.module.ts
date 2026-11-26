import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateReceitasHandler, DeleteReceitasHandler, UpdateReceitasHandler, UpdateReceitasStatusHandler } from "@commands";
import { ReceitasController } from "@controllers";
import { ReceitasOrmEntity, ReceitasRepositoryTypeorm } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetReceitasHandler, ListReceitasHandler, GetReceitasMesHandler, GetReceitasAnoHandler, GetReceitasSomaTotalAnoHandler } from "@queries";
import { RedisModule } from "./redis.module";

@Module({
    imports: [TypeOrmModule.forFeature([ReceitasOrmEntity]), CqrsModule, RedisModule],
    controllers: [ReceitasController],
    providers: [
        CreateReceitasHandler,
        UpdateReceitasHandler,
        DeleteReceitasHandler,
        ListReceitasHandler,
        GetReceitasHandler,
        GetReceitasMesHandler,
        GetReceitasAnoHandler,
        GetReceitasSomaTotalAnoHandler,
        UpdateReceitasStatusHandler,
        {
            provide: 'ReceitasRepository',
            useClass: ReceitasRepositoryTypeorm,
        },
    ],
})
export class ReceitasModule { }
