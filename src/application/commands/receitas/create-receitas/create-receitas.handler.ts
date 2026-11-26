import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import type { IReceitasRepository } from "@repositories";
import { Receitas } from "@entities";
import { randomUUID } from "crypto";
import { CreateReceitasCommand } from "./create-receitas.command";
import type { RedisService } from "@domain/services";
import { invalidateHomeReceitasCache } from "@application/utils";


@CommandHandler(CreateReceitasCommand)
export class CreateReceitasHandler implements ICommandHandler<CreateReceitasCommand> {
    constructor(
        @Inject('ReceitasRepository')
        private readonly repository: IReceitasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

	async execute(command: CreateReceitasCommand): Promise<Receitas> {
		const { descricao, valor, recebimento, categoria_id, status_id } = command;
		const now = new Date();
		const receita = new Receitas(
			randomUUID(),
			descricao,
			valor,
			recebimento,
			categoria_id,
			status_id,
			now,
			now,
		);

		const created = await this.repository.save(receita);
        await invalidateHomeReceitasCache(this.redisService);
        return created;
	}
}
