import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/roles.guard';
import { TenantContextService } from '../infrastructure/auth/tenant-context.service';
import { TenantInterceptor } from '../infrastructure/auth/tenant.interceptor';
import { EmailService } from '../infrastructure/email/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Global()
@Module({
  providers: [
    TenantContextService,
    EmailService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [TenantContextService, EmailService],
})
export class SecurityModule {}
