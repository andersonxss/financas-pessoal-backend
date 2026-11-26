import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../../../../domain/entities/tenant.entity';
import { ProcessDespesaEvent } from '../../../../domain/events/despesas/process-despesa.event';
import { ProcessReceitaEvent } from '../../../../domain/events/receitas/process-receita.event';
import { CreateDataProcessDespesasCommand } from './create-data-process-despesas.command';
import { CreateDataProcessDespesasHandler } from './create-data-process-despesas.handler';

describe('CreateDataProcessDespesasHandler', () => {
  it('publica contexto autenticado separado dos dados editáveis do item', async () => {
    const eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    const emit = jest.fn();
    const socketIo = { to: jest.fn().mockReturnValue({ emit }) };
    const handler = new CreateDataProcessDespesasHandler(
      eventBus as any,
      socketIo as any,
    );
    const context = {
      tenantId: 'tenant-autenticado',
      userId: 'usuario-autenticado',
      role: UserRole.MEMBER,
    };
    const item = {
      tipo: 'despesa',
      descricao: 'Compra',
      valor: 10.5,
      vencimento: '2026-11-10',
      categoria_id: 'categoria',
      status_id: 'status',
      parcela_id: 'parcela',
      pagamento_id: 'pagamento',
      tenant_id: 'tenant-adulterado',
    };

    await handler.execute(
      new CreateDataProcessDespesasCommand(
        'job-1',
        JSON.stringify([item]),
        context,
      ),
    );

    const event = eventBus.publish.mock.calls[0][0];
    expect(event.data.context).toEqual(context);
    expect(event.data.despesa).not.toHaveProperty('tenant_id');
    expect(event.data.despesa.descricao).toBe(item.descricao);
  });

  it('publica o evento correspondente para uma lista mista', async () => {
    const eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    const emit = jest.fn();
    const socketIo = { to: jest.fn().mockReturnValue({ emit }) };
    const handler = new CreateDataProcessDespesasHandler(
      eventBus as any,
      socketIo as any,
    );
    const context = {
      tenantId: 'tenant-autenticado',
      userId: 'usuario-autenticado',
      role: UserRole.MEMBER,
    };
    const items = [
      {
        tipo: 'despesa',
        descricao: 'Compra',
        valor: 10.5,
        vencimento: '2026-11-10',
        categoria_id: 'categoria',
        status_id: 'status',
        parcela_id: 'parcela',
        pagamento_id: 'pagamento',
      },
      {
        tipo: 'receita',
        descricao: 'Crédito recebido',
        valor: 100,
        recebimento: '2026-11-11',
        categoria_id: 'categoria',
        status_id: 'status',
        tenant_id: 'tenant-adulterado',
      },
    ];

    const result = await handler.execute(
      new CreateDataProcessDespesasCommand(
        'job-1',
        JSON.stringify(items),
        context,
      ),
    );

    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish.mock.calls[0][0]).toBeInstanceOf(
      ProcessDespesaEvent,
    );
    const receitaEvent = eventBus.publish.mock.calls[1][0];
    expect(receitaEvent).toBeInstanceOf(ProcessReceitaEvent);
    expect(receitaEvent.data).toEqual({
      context,
      receita: {
        descricao: 'Crédito recebido',
        valor: 100,
        recebimento: '2026-11-11',
        categoria_id: 'categoria',
        status_id: 'status',
      },
    });
    expect(receitaEvent.data.receita).not.toHaveProperty('tenant_id');
    expect(emit).toHaveBeenNthCalledWith(1, 'progress', {
      percent: 50,
      processados: 1,
      total: 2,
    });
    expect(emit).toHaveBeenNthCalledWith(2, 'progress', {
      percent: 100,
      processados: 2,
      total: 2,
    });
    expect(result).toEqual({
      message: 'Itens enviados para processamento',
      total: 2,
      processados: 2,
    });
  });

  it('rejeita a lista inteira antes de publicar quando um item é inválido', async () => {
    const eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    const socketIo = { to: jest.fn() };
    const handler = new CreateDataProcessDespesasHandler(
      eventBus as any,
      socketIo as any,
    );
    const context = {
      tenantId: 'tenant-autenticado',
      userId: 'usuario-autenticado',
      role: UserRole.MEMBER,
    };
    const items = [
      {
        tipo: 'despesa',
        descricao: 'Compra',
        valor: 10.5,
        vencimento: '2026-11-10',
        categoria_id: 'categoria',
        status_id: 'status',
        parcela_id: 'parcela',
        pagamento_id: 'pagamento',
      },
      {
        tipo: 'receita',
        descricao: 'Crédito sem data',
        valor: 100,
        categoria_id: 'categoria',
        status_id: 'status',
      },
    ];

    await expect(
      handler.execute(
        new CreateDataProcessDespesasCommand(
          'job-1',
          JSON.stringify(items),
          context,
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('rejeita JSON inválido como lista inválida', async () => {
    const handler = new CreateDataProcessDespesasHandler(
      { publish: jest.fn() } as any,
      { to: jest.fn() } as any,
    );
    const context = {
      tenantId: 'tenant-autenticado',
      userId: 'usuario-autenticado',
      role: UserRole.MEMBER,
    };

    await expect(
      handler.execute(
        new CreateDataProcessDespesasCommand('job-1', '{', context),
      ),
    ).rejects.toMatchObject({ message: 'Lista inválida' });
  });

  it.each([
    { valor: 100, recebimento: 'data-invalida' },
    { valor: 0, recebimento: '2026-11-11' },
    { valor: -10, recebimento: '2026-11-11' },
  ])(
    'rejeita receita com valor ou data inválidos: %o',
    async ({ valor, recebimento }) => {
      const eventBus = { publish: jest.fn() };
      const handler = new CreateDataProcessDespesasHandler(
        eventBus as any,
        { to: jest.fn() } as any,
      );
      const context = {
        tenantId: 'tenant-autenticado',
        userId: 'usuario-autenticado',
        role: UserRole.MEMBER,
      };

      await expect(
        handler.execute(
          new CreateDataProcessDespesasCommand(
            'job-1',
            JSON.stringify([
              {
                tipo: 'receita',
                descricao: 'Crédito recebido',
                valor,
                recebimento,
                categoria_id: 'categoria',
                status_id: 'status',
              },
            ]),
            context,
          ),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(eventBus.publish).not.toHaveBeenCalled();
    },
  );
});
