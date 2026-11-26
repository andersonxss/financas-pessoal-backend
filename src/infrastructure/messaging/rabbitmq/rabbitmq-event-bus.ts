import { Channel, Message } from 'amqplib';
import { CommandBus } from '@nestjs/cqrs';
import { EventBus } from '../../../application/event-bus/event-bus';
import { DomainEvent } from '../../../domain/events/domain-event';
import { ProcessDespesaPayload } from '../../../domain/events/despesas/process-despesa.event';
import { ProcessFinancialContext } from '../../../domain/events/process-financial-context';
import { ProcessReceitaPayload } from '../../../domain/events/receitas/process-receita.event';
import { CreateDespesasCommand } from '../../../application/commands/despesas/create-despesas/create-despesas.command';
import { CreateReceitasCommand } from '../../../application/commands/receitas/create-receitas/create-receitas.command';
import { TenantContextService } from '../../auth/tenant-context.service';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../domain/entities/tenant.entity';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toFinancialDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return value;
  }

  return new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  );
};

const isValidFinancialDate = (value: unknown): value is string | Date => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime());
  }

  return (
    isNonEmptyString(value) && Number.isFinite(toFinancialDate(value).getTime())
  );
};

const isProcessFinancialContext = (
  value: unknown,
): value is ProcessFinancialContext => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const context = value as Partial<ProcessFinancialContext>;
  return (
    isNonEmptyString(context.tenantId) &&
    isNonEmptyString(context.userId) &&
    Object.values(UserRole).includes(context.role as UserRole)
  );
};

const isProcessDespesaPayload = (
  value: unknown,
): value is ProcessDespesaPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Partial<ProcessDespesaPayload>;
  const despesa = payload.despesa;

  return (
    isProcessFinancialContext(payload.context) &&
    typeof despesa === 'object' &&
    despesa !== null &&
    isNonEmptyString(despesa.descricao) &&
    typeof despesa.valor === 'number' &&
    Number.isFinite(despesa.valor) &&
    isValidFinancialDate(despesa.vencimento) &&
    isNonEmptyString(despesa.categoria_id) &&
    isNonEmptyString(despesa.status_id) &&
    isNonEmptyString(despesa.parcela_id) &&
    isNonEmptyString(despesa.pagamento_id)
  );
};

const isProcessReceitaPayload = (
  value: unknown,
): value is ProcessReceitaPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Partial<ProcessReceitaPayload>;
  const receita = payload.receita;

  return (
    isProcessFinancialContext(payload.context) &&
    typeof receita === 'object' &&
    receita !== null &&
    isNonEmptyString(receita.descricao) &&
    typeof receita.valor === 'number' &&
    Number.isFinite(receita.valor) &&
    receita.valor > 0 &&
    isValidFinancialDate(receita.recebimento) &&
    isNonEmptyString(receita.categoria_id) &&
    isNonEmptyString(receita.status_id)
  );
};

export class RabbitMQEventBus implements EventBus {
  constructor(
    private readonly channel: Channel,
    private readonly exchange: string,
    private readonly commandBus: CommandBus,
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const routingKey = event.eventName();
    const queue = routingKey;
    if (!('data' in event)) {
      throw new Error('Event data not found');
    }
    await this.channel.assertQueue(queue, { durable: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const payload: unknown = event.data;

    if (payload === null || payload === undefined) {
      throw new Error('Event data not found');
    }

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  }

  async consume(event: DomainEvent): Promise<void> {
    const queue = event.eventName();
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.prefetch(1);
    console.log(`⏳ Aguardando mensagens na fila: ${queue}`);

    await this.channel.consume(queue, (message) => {
      if (message !== null) {
        void this.processMessage(queue, message);
      }
    });
  }

  private async processMessage(queue: string, message: Message): Promise<void> {
    try {
      const content: unknown = JSON.parse(
        message.content.toString(),
      ) as unknown;
      await this.executeEvent(queue, content);
      this.channel.ack(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao processar mensagem:', errorMessage);
      this.channel.nack(message, false, false);
    }
  }

  private async executeEvent(queue: string, content: unknown): Promise<void> {
    if (queue === 'process_despesa') {
      if (!isProcessDespesaPayload(content)) {
        throw new Error('Mensagem de despesa inválida');
      }

      const { context, despesa } = content;
      await this.tenantContext.runInTransaction(this.dataSource, context, () =>
        this.commandBus.execute(
          new CreateDespesasCommand(
            despesa.descricao,
            despesa.valor,
            toFinancialDate(despesa.vencimento),
            despesa.categoria_id,
            despesa.status_id,
            despesa.parcela_id,
            despesa.pagamento_id,
          ),
        ),
      );
      return;
    }

    if (queue === 'process_receita') {
      if (!isProcessReceitaPayload(content)) {
        throw new Error('Mensagem de receita inválida');
      }

      const { context, receita } = content;
      await this.tenantContext.runInTransaction(this.dataSource, context, () =>
        this.commandBus.execute(
          new CreateReceitasCommand(
            receita.descricao,
            receita.valor,
            toFinancialDate(receita.recebimento),
            receita.categoria_id,
            receita.status_id,
          ),
        ),
      );
      return;
    }

    throw new Error(`Evento não suportado: ${queue}`);
  }
}
