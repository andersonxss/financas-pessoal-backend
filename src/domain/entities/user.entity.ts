import { UserRole } from './tenant.entity';

export class User {
    constructor(
        public readonly id: string,
        public name: string,
        public email: string,
        public password?: string,
        public createdAt?: Date,
        public updatedAt?: Date,
        public tenantId?: string,
        public role: UserRole = UserRole.MEMBER,
        public active = true,
    ) { }

    get userId(): string {
        return this.id;
    }
}
