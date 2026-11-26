import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListCategoriaQuery } from "./list-categoria.query";
import * as Repositories from "@repositories";
import { Categoria } from "@entities";

@QueryHandler(ListCategoriaQuery)
export class ListCategoriaHandler implements ICommandHandler<ListCategoriaQuery> {
    constructor(
        @Inject('CategoriaRepository')
        private readonly repository: Repositories.ICategoriaRepository,
    ) { }

    async execute(): Promise<Categoria[]> {
        const categoria = await this.repository.findAll();
        return categoria
    }
}