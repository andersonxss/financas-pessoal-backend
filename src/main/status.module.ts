import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateStatusHandler, DeleteStatusHandler, UpdateStatusHandler } from "@commands";
import { StatusController } from "@controllers";
import { StatusOrmEntity, StatusRepositoryTypeorm } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetStatusHandler, ListStatusHandler } from "@queries";

@Module({
    imports: [TypeOrmModule.forFeature([StatusOrmEntity]), CqrsModule],
    controllers: [StatusController],
    providers: [
        CreateStatusHandler,
        UpdateStatusHandler,
        DeleteStatusHandler,
        ListStatusHandler,
        GetStatusHandler,
        {
            provide: 'StatusRepository',
            useClass: StatusRepositoryTypeorm,
        },
    ],
})
export class StatusModule { }
