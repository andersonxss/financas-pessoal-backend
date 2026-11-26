
import {
  IDespesasRepository,
  type DespesaCategoriaMensal,
  type DespesaCategoriaTotal,
  type DespesaPagamentoTotal,
} from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { DespesasOrmEntity } from "../typeorm/entity/despesas.orm-entity";
import { Between, Repository } from "typeorm";
import { Despesas } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class DespesasRepositoryTypeorm implements IDespesasRepository {
    constructor(
        @InjectRepository(DespesasOrmEntity)
        private readonly ormRepository: Repository<DespesasOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<DespesasOrmEntity> {
        return this.tenantContext.manager?.getRepository(DespesasOrmEntity) ?? this.ormRepository;
    }

    async save(despesas: Despesas): Promise<Despesas> {
        const despesasCreated = await this.repository.save({ ...despesas, tenantId: this.tenantContext.requireTenantId() });
        return despesasCreated;
    }

    async update(despesas: Despesas): Promise<Despesas> {
        const despesasUpdated = await this.repository.save({ ...despesas, tenantId: this.tenantContext.requireTenantId() });
        return despesasUpdated;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }

    async findAll(ano: number, mes: number): Promise<Despesas[]> {
        const mesEscolhido = Number(mes);
        const primeiroDia = new Date(ano, mesEscolhido - 1, 1);
        const ultimoDia = new Date(ano, mesEscolhido, 0, 23, 59, 59, 999);
        const despesas = await this.repository.find({
            where: {
                tenantId: this.tenantContext.requireTenantId(),
                vencimento: Between(primeiroDia, ultimoDia),
            },
        });
        return despesas;
    }

    async findById(id: string): Promise<Despesas | any> {
        const despesas = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return despesas
    }

    async findAllAno(ano: number): Promise<Despesas[] | []> {
        const despesas = await this.repository.find({
            where: {
                tenantId: this.tenantContext.requireTenantId(),
                vencimento: Between(
                    new Date(`${ano}-01-01`),
                    new Date(`${ano}-12-31`),
                ),
            },
        });
        return despesas;
    }

    async findAllMes(mes: number): Promise<Despesas[] | []> {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesEscolhido = Number(mes); // Certifique-se de que seja um número válido

        // Obtém o primeiro e último dia do mês escolhido
        const primeiroDia = new Date(anoAtual, mesEscolhido - 1, 1); // Meses no JS começam do 0
        const ultimoDia = new Date(anoAtual, mesEscolhido, 0, 23, 59, 59, 999); // Último dia do mês

        const despesas = await this.repository.find({
            where: {
                tenantId: this.tenantContext.requireTenantId(),
                vencimento: Between(primeiroDia, ultimoDia),
            },
        });

        return despesas;
    }

    async findAllSomalTotalDespesas(ano: number): Promise<Despesas[] | []> {

        const result = await this.repository
            .createQueryBuilder('gastos')
            .select('EXTRACT(MONTH FROM gastos.vencimento)', 'month') // Extrai o mês
            .addSelect('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'total') // Soma os valores
            .where('EXTRACT(YEAR FROM gastos.vencimento) = :year', {
                year: ano,
            })
            .andWhere('gastos.tenantId = :tenantId', { tenantId: this.tenantContext.requireTenantId() }) // Filtra pelo ano atual
            .groupBy('EXTRACT(MONTH FROM gastos.vencimento)') // Agrupa por mês
            .orderBy('EXTRACT(MONTH FROM gastos.vencimento)', 'ASC') // Ordena pelo mês
            .getRawMany();

        return result;
    }

    async findTotalByCategoria(ano: number): Promise<DespesaCategoriaTotal[]> {
        const tenantId = this.tenantContext.requireTenantId();
        const result = await this.repository
            .createQueryBuilder('gastos')
            .innerJoin('gastos.categoria', 'categoria')
            .select('gastos.categoria_id', 'categoria_id')
            .addSelect('categoria.name', 'categoria')
            .addSelect('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'total')
            .where('EXTRACT(YEAR FROM gastos.vencimento) = :year', { year: ano })
            .andWhere('gastos.tenantId = :tenantId', { tenantId })
            .groupBy('gastos.categoria_id')
            .addGroupBy('categoria.name')
            .orderBy('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'DESC')
            .getRawMany<{ categoria_id: string; categoria: string; total: string }>();

        return result.map((item) => ({
            categoria_id: item.categoria_id,
            categoria: item.categoria,
            total: Number(item.total),
        }));
    }

    async findTotalByCategoriaMes(ano: number): Promise<DespesaCategoriaMensal[]> {
        const tenantId = this.tenantContext.requireTenantId();
        const result = await this.repository
            .createQueryBuilder('gastos')
            .innerJoin('gastos.categoria', 'categoria')
            .select('EXTRACT(MONTH FROM gastos.vencimento)', 'month')
            .addSelect('gastos.categoria_id', 'categoria_id')
            .addSelect('categoria.name', 'categoria')
            .addSelect('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'total')
            .where('EXTRACT(YEAR FROM gastos.vencimento) = :year', { year: ano })
            .andWhere('gastos.tenantId = :tenantId', { tenantId })
            .groupBy('EXTRACT(MONTH FROM gastos.vencimento)')
            .addGroupBy('gastos.categoria_id')
            .addGroupBy('categoria.name')
            .orderBy('EXTRACT(MONTH FROM gastos.vencimento)', 'ASC')
            .addOrderBy('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'DESC')
            .getRawMany<{
                month: string;
                categoria_id: string;
                categoria: string;
                total: string;
            }>();

        return result.map((item) => ({
            month: Number(item.month),
            categoria_id: item.categoria_id,
            categoria: item.categoria,
            total: Number(item.total),
        }));
    }

    async findTotalByPagamento(ano: number): Promise<DespesaPagamentoTotal[]> {
        const tenantId = this.tenantContext.requireTenantId();
        const result = await this.repository
            .createQueryBuilder('gastos')
            .innerJoin('gastos.pagamento', 'pagamento')
            .select('gastos.pagamento_id', 'pagamento_id')
            .addSelect('pagamento.name', 'pagamento')
            .addSelect('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'total')
            .where('EXTRACT(YEAR FROM gastos.vencimento) = :year', { year: ano })
            .andWhere('gastos.tenantId = :tenantId', { tenantId })
            .groupBy('gastos.pagamento_id')
            .addGroupBy('pagamento.name')
            .orderBy('SUM(CAST(gastos.valor AS DECIMAL(10,2)))', 'DESC')
            .getRawMany<{
                pagamento_id: string;
                pagamento: string;
                total: string;
            }>();

        return result.map((item) => ({
            pagamento_id: item.pagamento_id,
            pagamento: item.pagamento,
            total: Number(item.total),
        }));
    }

    async findAllTotalDespesas(): Promise<Despesas[] | []> {
        const gastos = this.repository
            .createQueryBuilder('gastos')
            .select(['gastos.id', 'gastos.valor', 'gastos.status_id'])
            .where('gastos.tenantId = :tenantId', { tenantId: this.tenantContext.requireTenantId() })
            .getMany();
        return gastos;
    }

}
