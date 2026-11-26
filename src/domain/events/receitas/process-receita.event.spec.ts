import { UserRole } from '../../entities/tenant.entity';
import { ProcessReceitaEvent } from './process-receita.event';

describe('ProcessReceitaEvent', () => {
  it('usa a fila de receita e preserva o envelope autenticado', () => {
    const payload = {
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: UserRole.MEMBER,
      },
      receita: {
        descricao: 'Crédito recebido',
        valor: 100,
        recebimento: '2026-11-16',
        categoria_id: 'categoria-1',
        status_id: 'status-1',
      },
    };

    const event = new ProcessReceitaEvent(payload);

    expect(event.eventName()).toBe('process_receita');
    expect(event.data).toEqual(payload);
  });
});
