import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateReceitasStatusCommand } from "./update-receitas-status.command";
import { Receitas } from "@entities";
import { ReceitasNotFound } from "@errors";
import * as Repositories from "@repositories";
import type { RedisService } from "@domain/services";
import { invalidateHomeReceitasCache } from "@application/utils";

@CommandHandler(UpdateReceitasStatusCommand)
export class UpdateReceitasStatusHandler implements ICommandHandler<UpdateReceitasStatusCommand> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: Repositories.IReceitasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: UpdateReceitasStatusCommand): Promise<Receitas> {
		const { id, status_id } = command;

		const receitaExistente = await this.repository.findById(id);
		if (!receitaExistente) {
			throw new ReceitasNotFound();
		}

		const receita = new Receitas(
			id,
			receitaExistente.descricao,
			receitaExistente.valor,
			receitaExistente.recebimento,
			receitaExistente.categoria_id,
			status_id
		);

		const updated = await this.repository.update(receita);
        await invalidateHomeReceitasCache(this.redisService);
        return updated;
    }
}
