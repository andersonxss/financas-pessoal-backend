import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateCategoriaCommand } from "./update-categoria.command";
import * as Repositories from "@repositories";
import { Categoria } from "@entities";
import { CategoriaNotFound } from "@errors";

@CommandHandler(UpdateCategoriaCommand)
export class UpdateCategoriaHandler implements ICommandHandler<UpdateCategoriaCommand> {
    constructor(
        @Inject('CategoriaRepository')
        private readonly repository: Repositories.ICategoriaRepository,
    ) { }

    async execute(command: UpdateCategoriaCommand): Promise<Categoria> {
        let { id, name, status_id } = command;
        const categoriaExists = await this.repository.findById(id);
        if (!categoriaExists) {
            throw new CategoriaNotFound();
        }
        const categoria = new Categoria(id, name, status_id);
        return await this.repository.update(categoria);
    }
}