import { TenantContextService } from '../../auth/tenant-context.service';
import { DespesasOrmEntity } from '../typeorm/entity/despesas.orm-entity';
import { Repository } from 'typeorm';
import { DespesasRepositoryTypeorm } from './despesas.repository.typeorm';

describe('DespesasRepositoryTypeorm', () => {
  describe('findTotalByCategoria', () => {
    it('agrega os gastos do ano somente para o tenant atual', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            categoria_id: 'categoria-1',
            categoria: 'Moradia',
            total: '1234.56',
          },
        ]),
      };
      const ormRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as unknown as Repository<DespesasOrmEntity>;
      const tenantContext = {
        manager: undefined,
        requireTenantId: jest.fn().mockReturnValue('tenant-1'),
      } as unknown as TenantContextService;
      const repository = new DespesasRepositoryTypeorm(
        ormRepository,
        tenantContext,
      );

      await expect(repository.findTotalByCategoria(2026)).resolves.toEqual([
        {
          categoria_id: 'categoria-1',
          categoria: 'Moradia',
          total: 1234.56,
        },
      ]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM gastos.vencimento) = :year',
        { year: 2026 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'gastos.tenantId = :tenantId',
        { tenantId: 'tenant-1' },
      );
    });
  });

  describe('findTotalByCategoriaMes', () => {
    it('agrega os gastos por mês e categoria somente para o tenant atual', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            month: '3',
            categoria_id: 'categoria-1',
            categoria: 'Moradia',
            total: '987.65',
          },
        ]),
      };
      const ormRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as unknown as Repository<DespesasOrmEntity>;
      const tenantContext = {
        manager: undefined,
        requireTenantId: jest.fn().mockReturnValue('tenant-1'),
      } as unknown as TenantContextService;
      const repository = new DespesasRepositoryTypeorm(
        ormRepository,
        tenantContext,
      );

      await expect(repository.findTotalByCategoriaMes(2026)).resolves.toEqual([
        {
          month: 3,
          categoria_id: 'categoria-1',
          categoria: 'Moradia',
          total: 987.65,
        },
      ]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM gastos.vencimento) = :year',
        { year: 2026 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'gastos.tenantId = :tenantId',
        { tenantId: 'tenant-1' },
      );
      expect(queryBuilder.groupBy).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM gastos.vencimento)',
      );
    });
  });

  describe('findTotalByPagamento', () => {
    it('agrega os gastos do ano por forma de pagamento e tenant', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            pagamento_id: 'pagamento-1',
            pagamento: 'Cartão',
            total: '2450.75',
          },
        ]),
      };
      const ormRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as unknown as Repository<DespesasOrmEntity>;
      const tenantContext = {
        manager: undefined,
        requireTenantId: jest.fn().mockReturnValue('tenant-1'),
      } as unknown as TenantContextService;
      const repository = new DespesasRepositoryTypeorm(
        ormRepository,
        tenantContext,
      );

      await expect(repository.findTotalByPagamento(2026)).resolves.toEqual([
        {
          pagamento_id: 'pagamento-1',
          pagamento: 'Cartão',
          total: 2450.75,
        },
      ]);
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'gastos.pagamento',
        'pagamento',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM gastos.vencimento) = :year',
        { year: 2026 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'gastos.tenantId = :tenantId',
        { tenantId: 'tenant-1' },
      );
    });
  });
});
