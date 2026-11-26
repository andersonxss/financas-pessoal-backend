import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateDespesasCommand } from './create-despesas.command';
import type { IDespesasRepository } from '@repositories';
import { Despesas } from '@entities';
import { randomUUID } from 'crypto';
import { spliDateFormate, incrementeParcelas } from '@application/utils';
import { parcelasEnum, tipoPagamentoEnum } from '@application/enums';
import { ListParcelasHandler } from '@queries';
import type { RedisService } from '@domain/services';
import { invalidateHomeDespesasCache } from '@application/utils';

@CommandHandler(CreateDespesasCommand)
export class CreateDespesasHandler implements ICommandHandler<CreateDespesasCommand> {
  constructor(
    @Inject('DespesasRepository')
    private readonly repository: IDespesasRepository,
    private readonly listParcelasHandler: ListParcelasHandler,
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) { }

  async execute(command: CreateDespesasCommand): Promise<any> {
    let {
      descricao,
      valor,
      vencimento,
      categoria_id,
      status_id,
      parcela_id,
      pagamento_id,
    } = command;

    let { ano, mes, dia }: { ano: number; mes: number; dia: number } =
      spliDateFormate(vencimento);

    if (parcelasEnum.p1 === parcela_id) {
      const index = 1;
      if (pagamento_id === tipoPagamentoEnum.cartao) {
        descricao = `${descricao} 1/1`;
      }

      vencimento = new Date(incrementeParcelas({ dia, mes, ano, index }));

      const data = new Despesas(
        randomUUID(),
        descricao,
        valor,
        vencimento,
        categoria_id,
        status_id,
        parcela_id,
        pagamento_id,
        new Date(),
        new Date(),
      );

      const despesa = await this.saveData(data);
      await invalidateHomeDespesasCache(this.redisService);
      return despesa;
    } else {
      const parcelas = await this.listParcelasHandler.execute();
      const getFindIndex = parcelas.findIndex((elem) => elem.id === parcela_id);
      const despesasCriadas: any[] = [];
      for (const [index, elem] of parcelas.entries()) {
        if (index <= getFindIndex) {
          if (mes === 13) {
            ano = ano + 1;
            mes = 1;
          }

          vencimento = new Date(incrementeParcelas({ dia, mes, ano, index }));
          parcela_id = elem.id;
          mes = mes + 1;
          const data = new Despesas(
            randomUUID(),
            `${descricao} ${elem.name}/${getFindIndex + 1}`,
            valor,
            vencimento,
            categoria_id,
            status_id,
            parcela_id,
            pagamento_id,
            new Date(),
            new Date(),
          );
          despesasCriadas.push(await this.saveData(data));
        }
      }
      await invalidateHomeDespesasCache(this.redisService);
      return despesasCriadas;
    }
  }

  private async saveData(data: Despesas): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const despesas = this.repository.save(data);
    return despesas;
  }
}
