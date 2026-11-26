import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteDespesasCommand } from "./delete-despesas.command";
import * as Repositories from "@repositories";
import { DespesasNotFound } from "@errors";
import type { RedisService } from "@domain/services";
import { invalidateHomeDespesasCache } from "@application/utils";


@CommandHandler(DeleteDespesasCommand)
export class DeleteDespesasHandler implements ICommandHandler<DeleteDespesasCommand> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: DeleteDespesasCommand): Promise<void> {
        const { id } = command;

        const despesasExists = await this.repository.findById(id);

        if (!despesasExists) {
            throw new DespesasNotFound();
        }

        await this.repository.delete(id);
        await invalidateHomeDespesasCache(this.redisService);
    }
}
