import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { from, lastValueFrom, Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './auth.constants';
import type { AuthenticatedUser } from './auth.types';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return next.handle();

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      tenantId?: string;
    }>();
    if (!request.user?.tenantId) {
      throw new UnauthorizedException('Tenant não identificado');
    }
    request.tenantId = request.user.tenantId;

    return from(
      this.tenantContext.runInTransaction(
        this.dataSource,
        {
          tenantId: request.user.tenantId,
          userId: request.user.userId,
          role: request.user.role,
        },
        () => lastValueFrom(next.handle()),
      ),
    );
  }
}
