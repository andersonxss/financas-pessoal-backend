import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommandBus } from '@nestjs/cqrs';
import { SendMessageCommand } from '@commands';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ACCESS_COOKIE, type AuthenticatedUser, readCookie } from '../auth';

@WebSocketGateway()

export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly commandBus: CommandBus,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    async handleConnection(client: Socket): Promise<void> {
        try {
            const token = readCookie(client.handshake.headers.cookie, ACCESS_COOKIE);
            if (!token) throw new Error('missing token');
            const user = await this.jwtService.verifyAsync<AuthenticatedUser>(token, {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
            });
            if (user.type !== 'access' || !user.tenantId) throw new Error('invalid token');
            client.data.user = user;
            await client.join(`tenant:${user.tenantId}`);
        } catch {
            client.disconnect(true);
        }
    }

    @SubscribeMessage('subscribe')
    async subscribe(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
        const user = client.data.user as AuthenticatedUser | undefined;
        if (!user || typeof room !== 'string' || !/^[0-9a-f-]{36}$/i.test(room)) return;
        await client.join(`tenant:${user.tenantId}:${room}`);
    }

    @SubscribeMessage('send_message')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() dados: any) {
        const user = client.data.user as AuthenticatedUser | undefined;
        if (!user) return;
        const { data } = dados;
        const result = await this.commandBus.execute(
            new SendMessageCommand(user.userId, data.message),
        );
        this.server.to(`tenant:${user.tenantId}`).emit('receive_message', result);
    }
}
