import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SocketIoService } from '@domain/services';
import { ChatGateway } from './chat.gateway';
import { TenantContextService } from '../auth/tenant-context.service';

@Injectable()
export class SocketIoGetway implements SocketIoService {
    constructor(
        @Inject(forwardRef(() => ChatGateway))
        private readonly gateway: ChatGateway,
        private readonly tenantContext: TenantContextService,
    ) { }

    emit(event: string, payload: any): void {
        this.gateway.server.to(`tenant:${this.tenantContext.requireTenantId()}`).emit(event, payload);
    }

    to(room: string): SocketIoService {
        return this.gateway.server.to(`tenant:${this.tenantContext.requireTenantId()}:${room}`);
    }
}
