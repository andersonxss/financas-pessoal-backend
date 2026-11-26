import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteCategoriaCommand } from "./delete-categoria.command";
import * as Repositories from "@repositories";
import { CategoriaNotFound } from "@errors";


@CommandHandler(DeleteCategoriaCommand)
export class DeleteCategoriaHandler implements ICommandHandler<DeleteCategoriaCommand> {
    constructor(
        @Inject('CategoriaRepository')
        private readonly repository: Repositories.ICategoriaRepository,
    ) { }

    async execute(command: DeleteCategoriaCommand): Promise<void> {
        const { id } = command;

        const categoriaExists = await this.repository.findById(id);

        if (!categoriaExists) {
            throw new CategoriaNotFound();
        }

        await this.repository.delete(id);
    }
}