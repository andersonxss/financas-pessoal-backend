import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { CreateDataProcessDespesasCommand } from './create-data-process-despesas.command';
import type { EventBus } from '../../../../application/event-bus/event-bus';
import {
  ProcessDespesaData,
  ProcessDespesaEvent,
} from '../../../../domain/events/despesas/process-despesa.event';
import {
  ProcessReceitaData,
  ProcessReceitaEvent,
} from '../../../../domain/events/receitas/process-receita.event';
import type { SocketIoService } from '@domain/services';

interface ProcessDataResult {
  message: string;
  total: number;
  processados: number;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidFinancialDate = (value: unknown): value is string | Date => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime());
  }

  return isNonEmptyString(value) && Number.isFinite(new Date(value).getTime());
};

type ProcessDespesaItem = ProcessDespesaData & { tipo: 'despesa' };
type ProcessReceitaItem = ProcessReceitaData & { tipo: 'receita' };
type ProcessFinancialItem = ProcessDespesaItem | ProcessReceitaItem;

const hasBaseFinancialData = (
  value: unknown,
): value is {
  descricao: string;
  valor: number;
  categoria_id: string;
  status_id: string;
} => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Partial<ProcessDespesaData & ProcessReceitaData>;
  return (
    isNonEmptyString(item.descricao) &&
    typeof item.valor === 'number' &&
    Number.isFinite(item.valor) &&
    isNonEmptyString(item.categoria_id) &&
    isNonEmptyString(item.status_id)
  );
};

const isProcessFinancialItem = (
  value: unknown,
): value is ProcessFinancialItem => {
  if (!hasBaseFinancialData(value)) {
    return false;
  }

  const item = value as Partial<ProcessDespesaData & ProcessReceitaData> & {
    tipo?: unknown;
  };

  if (item.tipo === 'receita') {
    return (
      typeof item.valor === 'number' &&
      item.valor > 0 &&
      isValidFinancialDate(item.recebimento)
    );
  }

  return (
    item.tipo === 'despesa' &&
    isValidFinancialDate(item.vencimento) &&
    isNonEmptyString(item.parcela_id) &&
    isNonEmptyString(item.pagamento_id)
  );
};

@CommandHandler(CreateDataProcessDespesasCommand)
export class CreateDataProcessDespesasHandler implements ICommandHandler<CreateDataProcessDespesasCommand> {
  constructor(
    @Inject('EventBus')
    private readonly eventBus: EventBus,
    @Inject('SocketIoService')
    private readonly socketIo: SocketIoService,
  ) {}

  async execute(
    command: CreateDataProcessDespesasCommand,
  ): Promise<ProcessDataResult> {
    const { itens, jobId, context } = command;
    let data: unknown;

    try {
      data = JSON.parse(itens) as unknown;
    } catch {
      throw new BadRequestException('Lista inválida');
    }

    if (!Array.isArray(data) || !data.every(isProcessFinancialItem)) {
      throw new BadRequestException('Lista inválida');
    }

    const total = data.length;
    let processados = 0;
    for (const item of data) {
      try {
        const event =
          item.tipo === 'despesa'
            ? new ProcessDespesaEvent({
                context,
                despesa: {
                  descricao: item.descricao,
                  valor: item.valor,
                  vencimento: item.vencimento,
                  categoria_id: item.categoria_id,
                  status_id: item.status_id,
                  parcela_id: item.parcela_id,
                  pagamento_id: item.pagamento_id,
                },
              })
            : new ProcessReceitaEvent({
                context,
                receita: {
                  descricao: item.descricao,
                  valor: item.valor,
                  recebimento: item.recebimento,
                  categoria_id: item.categoria_id,
                  status_id: item.status_id,
                },
              });

        await this.eventBus.publish(event);
        processados++;
        // Emite evento de progresso
        this.socketIo.to(jobId).emit('progress', {
          percent: Math.round((processados / total) * 100),
          processados,
          total,
        });
      } catch (error) {
        console.error(`Erro ao publicar evento para item:`, error);
      }
    }

    return { message: 'Itens enviados para processamento', total, processados };
  }
}
