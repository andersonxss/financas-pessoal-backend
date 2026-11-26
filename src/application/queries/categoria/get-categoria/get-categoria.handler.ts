import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetCategoriaQuery } from "./get-categoria.query";
import * as Repositories from "@repositories";
import { Categoria } from "@entities";
import { CategoriaNotFound } from "@errors";

@QueryHandler(GetCategoriaQuery)
export class GetCategoriaHandler implements ICommandHandler<GetCategoriaQuery> {
    constructor(
        @Inject('CategoriaRepository')
        private readonly repository: Repositories.ICategoriaRepository,
    ) { }

    async execute(command: GetCategoriaQuery): Promise<Categoria> {
        const categoria = await this.repository.findById(command.id);
        if (!categoria) {
            throw new CategoriaNotFound();
        }
        return categoria;
    }
}