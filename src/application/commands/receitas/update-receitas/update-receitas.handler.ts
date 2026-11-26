import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateReceitasCommand } from "./update-receitas.command";
import * as Repositories from "@repositories";
import { Receitas } from "@entities";
import { ReceitasNotFound } from "@errors";
import type { RedisService } from "@domain/services";
import { invalidateHomeReceitasCache } from "@application/utils";

@CommandHandler(UpdateReceitasCommand)
export class UpdateReceitasHandler implements ICommandHandler<UpdateReceitasCommand> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: UpdateReceitasCommand): Promise<Receitas> {
		const { id, descricao, valor, recebimento, categoria_id, status_id } = command;

        const receitasExists = await this.repository.findById(id);
        if (!receitasExists) {
            throw new ReceitasNotFound();
        }

        const receitas = new Receitas(id, descricao, valor, recebimento, categoria_id, status_id);
		const updated = await this.repository.update(receitas);
        await invalidateHomeReceitasCache(this.redisService);
        return updated;
    }
}
