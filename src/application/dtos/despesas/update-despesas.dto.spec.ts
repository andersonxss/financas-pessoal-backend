import { ValidationPipe } from '@nestjs/common';
import { UpdateDespesasDto } from './update-despesas.dto';

describe('UpdateDespesasDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = { type: 'body' as const, metatype: UpdateDespesasDto };
  const payload = {
    descricao: 'Despesa de teste',
    valor: 100,
    vencimento: '2026-11-05',
    categoria_id: 'categoria',
    status_id: 'status',
    parcela_id: 'parcela',
    pagamento_id: 'pagamento',
  };

  it('accepts the update body without duplicating the route id', async () => {
    await expect(pipe.transform(payload, metadata)).resolves.toEqual(payload);
  });

  it('strips a body id so the route remains the source of the identifier', async () => {
    await expect(pipe.transform({ ...payload, id: 'outro-id' }, metadata)).resolves.toEqual(payload);
  });

  it('still rejects missing required fields', async () => {
    await expect(pipe.transform({ ...payload, descricao: '' }, metadata)).rejects.toMatchObject({
      response: { statusCode: 400, message: ['descricao should not be empty'] },
    });
  });
});
