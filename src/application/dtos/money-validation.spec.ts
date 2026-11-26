import { validate } from 'class-validator';
import { CreateDespesasDto } from './despesas/create-despesas.dto';
import { UpdateDespesasDto } from './despesas/update-despesas.dto';
import { CreateReceitasDto } from './receitas/create-receitas.dto';
import { UpdateReceitasDto } from './receitas/update-receitas.dto';

for (const Dto of [CreateDespesasDto, UpdateDespesasDto, CreateReceitasDto, UpdateReceitasDto]) {
  describe(Dto.name + ' valor', () => {
    it.each([0.01, 0.29, 1.10, 1234.56, 0, -0.01, 99999999.99])('accepts %s reais', async valor => {
      const errors = await validate(Object.assign(new Dto(), { valor }));
      expect(errors.filter(error => error.property === 'valor')).toEqual([]);
    });
    it.each([undefined, null, '', '0.01', 'R$ 1,00', NaN, Infinity, 0.001, 100000000])('rejects %s', async valor => {
      const errors = await validate(Object.assign(new Dto(), { valor }));
      expect(errors.some(error => error.property === 'valor')).toBe(true);
    });
  });
}
