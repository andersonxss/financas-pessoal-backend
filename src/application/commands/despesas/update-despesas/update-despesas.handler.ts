import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateDespesasCommand } from "./update-despesas.command";
import * as Repositories from "@repositories";
import { Despesas } from "@entities";
import { DespesasNotFound } from "@errors";
import { incrementeParcelas, invalidateHomeDespesasCache, spliDateFormate } from "@application/utils";
import type { RedisService } from "@domain/services";

@CommandHandler(UpdateDespesasCommand)
export class UpdateDespesasHandler implements ICommandHandler<UpdateDespesasCommand> {
    constructor(
        @Inject('DespesasRepository')
        private readonly repository: Repositories.IDespesasRepository,
        @Inject('RedisService')
        private readonly redisService: RedisService,
    ) { }

    async execute(command: UpdateDespesasCommand): Promise<Despesas> {
        let { id, descricao, valor, vencimento, categoria_id, status_id, parcela_id, pagamento_id } = command;

        const despesasExists = await this.repository.findById(id);
        if (!despesasExists) {
            throw new DespesasNotFound();
        }
        let { ano, mes, dia }: { ano: number; mes: number; dia: number; } = spliDateFormate(vencimento);

        const index = 1;
        vencimento = new Date(incrementeParcelas({ dia, mes, ano, index }));
        console.log("valor:", valor)

        const despesas = new Despesas(id, descricao, valor, vencimento, categoria_id, status_id, parcela_id, pagamento_id, new Date(), new Date());
        const updated = await this.repository.update(despesas);
        await invalidateHomeDespesasCache(this.redisService);
        return updated;
    }
}
