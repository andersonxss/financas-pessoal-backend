import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateParcelasHandler, UpdateParcelasHandler, UpdateDesativarStatusParcelasHandler } from "@commands";
import { ParcelaController } from "@controllers";
import { ParcelaOrmEntity, ParcelasRepositoryTypeorm } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetParcelasHandler, ListParcelasHandler } from "@queries";

@Module({
    imports: [TypeOrmModule.forFeature([ParcelaOrmEntity]), CqrsModule],
    controllers: [ParcelaController],
    providers: [
        CreateParcelasHandler,
        UpdateParcelasHandler,
        UpdateDesativarStatusParcelasHandler,
        ListParcelasHandler,
        GetParcelasHandler,
        {
            provide: 'ParcelasRepository',
            useClass: ParcelasRepositoryTypeorm,
        },
    ],
    exports: [ListParcelasHandler]
})
export class ParcelasModule { }
