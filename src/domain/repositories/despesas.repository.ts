import { Despesas } from '@entities';

export interface DespesaCategoriaTotal {
  categoria_id: string;
  categoria: string;
  total: number;
}

export interface DespesaCategoriaMensal extends DespesaCategoriaTotal {
  month: number;
}

export interface DespesaPagamentoTotal {
  pagamento_id: string;
  pagamento: string;
  total: number;
}

export interface IDespesasRepository {
  findById(id: string): Promise<Despesas | null>;
  findAll(ano: number, mes: number): Promise<Despesas[] | []>;
  findAllAno(ano: number): Promise<Despesas[] | []>;
  findAllMes(mes: number): Promise<Despesas[] | []>;
  findAllTotalDespesas(): Promise<Despesas[] | []>;
  findAllSomalTotalDespesas(ano: number): Promise<Despesas[] | []>;
  findTotalByCategoria(ano: number): Promise<DespesaCategoriaTotal[]>;
  findTotalByCategoriaMes(ano: number): Promise<DespesaCategoriaMensal[]>;
  findTotalByPagamento(ano: number): Promise<DespesaPagamentoTotal[]>;
  save(data: Despesas): Promise<Despesas>;
  update(data: Despesas): Promise<Despesas>;
  delete(id: string): Promise<void>;
}
