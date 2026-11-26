import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthTokenOrmEntity, InviteOrmEntity, TenantOrmEntity, UserOrmEntity } from '@persistence';
import { InviteController } from '../infrastructure/http/controllers/invite.controller';
import { TenantController } from '../infrastructure/http/controllers/tenant.controller';
import { TenantAdminService } from '../infrastructure/auth/tenant-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOrmEntity, UserOrmEntity, InviteOrmEntity, AuthTokenOrmEntity])],
  controllers: [TenantController, InviteController],
  providers: [TenantAdminService],
})
export class TenantModule {}
