export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class Tenant {
  constructor(
    public readonly id: string,
    public name: string,
    public slug: string,
    public active = true,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
