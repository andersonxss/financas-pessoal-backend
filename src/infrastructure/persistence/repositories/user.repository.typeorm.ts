
import { IUserRepository } from "@repositories";
import { InjectRepository } from "@nestjs/typeorm";
import { UserOrmEntity } from "../typeorm/entity/user.orm-entity";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import { User } from "@entities";
import { TenantContextService } from "../../auth/tenant-context.service";

export class UserRepositoryTypeorm implements IUserRepository {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly ormRepository: Repository<UserOrmEntity>,
        private readonly tenantContext: TenantContextService,
    ) { }

    private get repository(): Repository<UserOrmEntity> {
        return this.tenantContext.manager?.getRepository(UserOrmEntity) ?? this.ormRepository;
    }

    async save(user: User): Promise<User> {
        const userCreated = await this.repository.save({ ...user, tenantId: this.tenantContext.requireTenantId() });
        return this.toDomain(userCreated);
    }

    async update(user: User): Promise<User> {
        const userUpdated = await this.repository.save({ ...user, tenantId: this.tenantContext.requireTenantId() });
        return this.toDomain(userUpdated);
    }

    async findById(id: string): Promise<User | any> {
        const user = await this.repository.findOne({ where: { id, tenantId: this.tenantContext.requireTenantId() } });
        return user ? this.toDomain(user) : null
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete({ id, tenantId: this.tenantContext.requireTenantId() });
    }
    async findByEmail(email: string): Promise<any> {
        const user = await this.repository.createQueryBuilder('user')
            .addSelect('user.password')
            .where('LOWER(user.email) = LOWER(:email)', { email })
            .andWhere('user.tenantId = :tenantId', { tenantId: this.tenantContext.requireTenantId() })
            .getOne();
        return user ? this.toDomain(user) : null;
    }

    async findAll(): Promise<User[]> {
        const users = await this.repository.find({ where: { tenantId: this.tenantContext.requireTenantId() } });
        return users.map((user) => this.toDomain(user));
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        if (!user.password) {
            return false;
        }
        return await bcrypt.compare(password, user.password);
    }

    private toDomain(user: UserOrmEntity): User {
        return new User(
            user.id,
            user.name,
            user.email,
            user.password,
            user.createdAt,
            user.updatedAt,
            user.tenantId,
            user.role,
            user.active,
        );
    }

}
