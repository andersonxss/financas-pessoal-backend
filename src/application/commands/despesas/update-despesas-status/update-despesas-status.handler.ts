import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateDespesasStatusCommand } from "./update-despesas-status.command";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";
import { DespesasNotFound } from "@errors";
import type { RedisService } from "@domain/services";
import { invalidateHomeDespesasCache } from "@application/utils";

@CommandHandler(UpdateDespesasStatusCommand)
export class UpdateDespesasStatusHandler implements ICommandHandler<UpdateDespesasStatusCommand> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: UpdateDespesasStatusCommand): Promise<Despesas> {
        let { id, status_id } = command;

        const despesasExists = await this.repository.findById(id);
        if (!despesasExists) {
            throw new DespesasNotFound();
        }

        const despesas = new Despesas(
            id,
            despesasExists.descricao,
            despesasExists.valor,
            despesasExists.vencimento,
            despesasExists.categoria_id,
            status_id,
            despesasExists.parcela_id,
            despesasExists.pagamento_id,
            new Date(),
            new Date()
        );

        const updated = await this.repository.update(despesas);
        await invalidateHomeDespesasCache(this.redisService);
        return updated;
    }
}
