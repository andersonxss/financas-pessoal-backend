import { UserRole } from '../../../domain/entities/tenant.entity';
import { ProcessDespesaEvent } from '../../../domain/events/despesas/process-despesa.event';
import { ProcessReceitaEvent } from '../../../domain/events/receitas/process-receita.event';
import { CreateDespesasCommand } from '../../../application/commands/despesas/create-despesas/create-despesas.command';
import { CreateReceitasCommand } from '../../../application/commands/receitas/create-receitas/create-receitas.command';
import { RabbitMQEventBus } from './rabbitmq-event-bus';

describe('RabbitMQEventBus', () => {
  const flushPromises = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  const payload = {
    context: {
      tenantId: '00000000-0000-4000-8000-000000000001',
      userId: '00000000-0000-4000-8000-000000000002',
      role: UserRole.MEMBER,
    },
    despesa: {
      descricao: 'Compra',
      valor: 10.5,
      vencimento: '2026-11-10',
      categoria_id: '00000000-0000-4000-8000-000000000003',
      status_id: '00000000-0000-4000-8000-000000000004',
      parcela_id: '00000000-0000-4000-8000-000000000005',
      pagamento_id: '00000000-0000-4000-8000-000000000006',
    },
  };

  const receitaPayload = {
    context: payload.context,
    receita: {
      descricao: 'Crédito recebido',
      valor: 100,
      recebimento: '2026-11-11',
      categoria_id: '00000000-0000-4000-8000-000000000003',
      status_id: '00000000-0000-4000-8000-000000000004',
    },
  };

  const createSubject = () => {
    const consumers = new Map<string, (message: any) => Promise<void> | void>();
    const channel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockImplementation(async (queue, callback) => {
        consumers.set(queue, callback);
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    const commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    const tenantContext = {
      runInTransaction: jest
        .fn()
        .mockImplementation(async (_dataSource, _context, callback) =>
          callback(),
        ),
    };
    const dataSource = {};
    const eventBus = new RabbitMQEventBus(
      channel as any,
      'events',
      commandBus as any,
      tenantContext as any,
      dataSource as any,
    );

    return {
      eventBus,
      channel,
      commandBus,
      tenantContext,
      dataSource,
      getConsumer: (queue = 'process_despesa') => consumers.get(queue),
    };
  };

  it('restaura o contexto e confirma a mensagem somente após executar o comando', async () => {
    const subject = createSubject();
    await subject.eventBus.consume(new ProcessDespesaEvent());
    const message = { content: Buffer.from(JSON.stringify(payload)) };

    await subject.getConsumer()?.(message);
    await flushPromises();

    expect(subject.tenantContext.runInTransaction).toHaveBeenCalledWith(
      subject.dataSource,
      payload.context,
      expect.any(Function),
    );
    expect(subject.commandBus.execute).toHaveBeenCalledTimes(1);
    expect(subject.commandBus.execute.mock.calls[0][0]).toBeInstanceOf(
      CreateDespesasCommand,
    );
    expect(subject.channel.ack).toHaveBeenCalledWith(message);
    expect(subject.channel.nack).not.toHaveBeenCalled();
    expect(subject.commandBus.execute.mock.invocationCallOrder[0]).toBeLessThan(
      subject.channel.ack.mock.invocationCallOrder[0],
    );
  });

  it('rejeita a mensagem quando o comando falha', async () => {
    const subject = createSubject();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    subject.commandBus.execute.mockRejectedValueOnce(new Error('falha'));
    await subject.eventBus.consume(new ProcessDespesaEvent());
    const message = { content: Buffer.from(JSON.stringify(payload)) };

    await subject.getConsumer()?.(message);
    await flushPromises();

    expect(subject.channel.ack).not.toHaveBeenCalled();
    expect(subject.channel.nack).toHaveBeenCalledWith(message, false, false);
    errorSpy.mockRestore();
  });

  it('roteia a fila de receita para CreateReceitasCommand no contexto autenticado', async () => {
    const subject = createSubject();
    await subject.eventBus.consume(new ProcessReceitaEvent());
    const message = {
      content: Buffer.from(JSON.stringify(receitaPayload)),
    };

    await subject.getConsumer('process_receita')?.(message);
    await flushPromises();

    expect(subject.tenantContext.runInTransaction).toHaveBeenCalledWith(
      subject.dataSource,
      receitaPayload.context,
      expect.any(Function),
    );
    const command = subject.commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateReceitasCommand);
    expect(command).toEqual(
      expect.objectContaining({
        descricao: receitaPayload.receita.descricao,
        valor: receitaPayload.receita.valor,
        recebimento: new Date('2026-11-11T12:00:00'),
        categoria_id: receitaPayload.receita.categoria_id,
        status_id: receitaPayload.receita.status_id,
      }),
    );
    expect(subject.channel.ack).toHaveBeenCalledWith(message);
    expect(subject.channel.nack).not.toHaveBeenCalled();
  });

  it('rejeita payload de receita inválido sem executar comando', async () => {
    const subject = createSubject();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    await subject.eventBus.consume(new ProcessReceitaEvent());
    const message = {
      content: Buffer.from(
        JSON.stringify({
          ...receitaPayload,
          receita: { ...receitaPayload.receita, recebimento: 'data-invalida' },
        }),
      ),
    };

    await subject.getConsumer('process_receita')?.(message);
    await flushPromises();

    expect(subject.commandBus.execute).not.toHaveBeenCalled();
    expect(subject.channel.ack).not.toHaveBeenCalled();
    expect(subject.channel.nack).toHaveBeenCalledWith(message, false, false);
    errorSpy.mockRestore();
  });

  it('rejeita receita não positiva sem executar comando', async () => {
    const subject = createSubject();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    await subject.eventBus.consume(new ProcessReceitaEvent());
    const message = {
      content: Buffer.from(
        JSON.stringify({
          ...receitaPayload,
          receita: { ...receitaPayload.receita, valor: -100 },
        }),
      ),
    };

    await subject.getConsumer('process_receita')?.(message);
    await flushPromises();

    expect(subject.commandBus.execute).not.toHaveBeenCalled();
    expect(subject.channel.ack).not.toHaveBeenCalled();
    expect(subject.channel.nack).toHaveBeenCalledWith(message, false, false);
    errorSpy.mockRestore();
  });
});
