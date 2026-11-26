import { AppError } from './app.error';

describe('AppError', () => {
  it('preserves the message and status of a known error', () => {
    const error = Object.assign(new Error('Despesa não encontrada'), { status: 404 });
    expect(new AppError(error)).toEqual({ message: error.message, status: 404 });
  });

  it('uses status 500 for a standard Error', () => {
    expect(new AppError(new Error('Falha'))).toEqual({ message: 'Falha', status: 500 });
  });

  it.each([undefined, null, 'falha', 42, {}, { message: 42 }, { message: '   ' }])(
    'handles an unknown thrown value: %p',
    (error) => {
      expect(new AppError(error)).toEqual({ message: 'Erro interno do servidor', status: 500 });
    },
  );

  it.each([0, 200, 399, 600, 400.5, NaN, Infinity, '400'])('rejects invalid status %p', (status) => {
    expect(new AppError({ message: 'Falha', status }).status).toBe(500);
  });
});
