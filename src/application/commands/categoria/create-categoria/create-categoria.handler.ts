import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateCategoriaCommand } from "./create-categoria.command";
import * as Repositories from "@repositories";
import { Categoria } from "@entities";
import { randomUUID } from "crypto";
import { CategoriaAlreadyExistsError } from "@errors";


@CommandHandler(CreateCategoriaCommand)
export class CreateCategoriaHandler implements ICommandHandler<CreateCategoriaCommand> {
    constructor(
        @Inject('CategoriaRepository')
        private readonly repository: Repositories.ICategoriaRepository,
    ) { }

    async execute(command: CreateCategoriaCommand): Promise<Categoria> {
        const { name, status_id } = command;

        const categoriaExists = await this.repository.findByName(name);
        if (categoriaExists) {
            throw new CategoriaAlreadyExistsError();
        }

        const categoria = new Categoria(randomUUID(), name, status_id, new Date(), new Date());
        const categoriaCreated = await this.repository.save(categoria);
        return categoriaCreated;
    }
}