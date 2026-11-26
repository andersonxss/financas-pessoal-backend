import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteReceitasCommand } from "./delete-receitas.command";
import * as Repositories from "@repositories";
import { ReceitasNotFound } from "@errors";
import type { RedisService } from "@domain/services";
import { invalidateHomeReceitasCache } from "@application/utils";


@CommandHandler(DeleteReceitasCommand)
export class DeleteReceitasHandler implements ICommandHandler<DeleteReceitasCommand> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: DeleteReceitasCommand): Promise<void> {
        const { id } = command;

        const receitasExists = await this.repository.findById(id);

        if (!receitasExists) {
            throw new ReceitasNotFound();
        }

        await this.repository.delete(id);
        await invalidateHomeReceitasCache(this.redisService);
    }
}
