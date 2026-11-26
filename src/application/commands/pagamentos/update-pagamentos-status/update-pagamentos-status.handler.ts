import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdatePagamentosStatusCommand } from "./update-pagamentos-status.command";
import * as Repositories from "@repositories";
import { Pagamentos } from "@entities";
import { PagamentosNotFound } from "@errors";
import { statusEnum } from "@application/enums";

@CommandHandler(UpdatePagamentosStatusCommand)
export class UpdatePagamentosStatusHandler implements ICommandHandler<UpdatePagamentosStatusCommand> {
    constructor(
        @Inject('PagamentosRepository')
        private readonly repository: Repositories.IPagamentosRepository,
    ) { }

    async execute(command: UpdatePagamentosStatusCommand): Promise<Pagamentos> {
        let { id } = command;

        const pagamentosExists = await this.repository.findById(id);
        if (!pagamentosExists) {
            throw new PagamentosNotFound();
        }

        const pagamentos = new Pagamentos(
            id,
            pagamentosExists.name,
            statusEnum.inativo,
            new Date(),
            new Date()
        );

        return await this.repository.update(pagamentos);
    }
}