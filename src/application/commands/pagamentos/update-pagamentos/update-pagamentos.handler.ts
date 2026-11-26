import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdatePagamentosCommand } from "./update-pagamentos.command";
import * as Repositories from "@repositories";
import { Pagamentos } from "@entities";
import { PagamentosNotFound } from "@errors";

@CommandHandler(UpdatePagamentosCommand)
export class UpdatePagamentosHandler implements ICommandHandler<UpdatePagamentosCommand> {
    constructor(
        @Inject('PagamentosRepository')
        private readonly repository: Repositories.IPagamentosRepository,
    ) { }

    async execute(command: UpdatePagamentosCommand): Promise<Pagamentos> {
        let { id, name, status_id } = command;

        const pagamentosExists = await this.repository.findById(id);
        if (!pagamentosExists) {
            throw new PagamentosNotFound();
        }

        const pagamentos = new Pagamentos(id, name, status_id);
        return await this.repository.update(pagamentos);
    }
}