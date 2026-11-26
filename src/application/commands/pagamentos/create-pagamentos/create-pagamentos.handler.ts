import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreatePagamentosCommand } from "./create-pagamentos.command";
import * as Repositories from "@repositories";
import { Pagamentos } from "@entities";
import { randomUUID } from "crypto";
import { PagamentosAlreadyExistsError } from "@errors";


@CommandHandler(CreatePagamentosCommand)
export class CreatePagamentosHandler implements ICommandHandler<CreatePagamentosCommand> {
    constructor(
        @Inject('PagamentosRepository')
        private readonly repository: Repositories.IPagamentosRepository,
    ) { }

    async execute(command: CreatePagamentosCommand): Promise<Pagamentos> {
        const { name, status_id } = command;

        const pagamentosExists = await this.repository.findByName(name);
        if (pagamentosExists) {
            throw new PagamentosAlreadyExistsError();
        }

        const pagamentos = new Pagamentos(randomUUID(), name, status_id, new Date(), new Date());
        const pagamentosCreated = await this.repository.save(pagamentos);
        return pagamentosCreated;
    }
}