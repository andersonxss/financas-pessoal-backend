import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CreateCategoriaHandler, DeleteCategoriaHandler, UpdateCategoriaHandler } from "@commands";
import { CategoriaController } from "@controllers";
import { CategoriaOrmEntity, CategoriaRepositoryTypeorm } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetCategoriaHandler, ListCategoriaHandler } from "@queries";

@Module({
    imports: [TypeOrmModule.forFeature([CategoriaOrmEntity]), CqrsModule],
    controllers: [CategoriaController],
    providers: [
        CreateCategoriaHandler,
        UpdateCategoriaHandler,
        DeleteCategoriaHandler,
        ListCategoriaHandler,
        GetCategoriaHandler,
        {
            provide: 'CategoriaRepository',
            useClass: CategoriaRepositoryTypeorm,
        },
    ],
})
export class CategoriaModule { }
