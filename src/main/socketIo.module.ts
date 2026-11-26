import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChatGateway } from '../infrastructure/websocket/chat.gateway';
import { SendMessageHandler } from '@commands';
import { SocketIoGetway } from '../infrastructure/websocket/socketIo.getway';

const CommandHandlers = [SendMessageHandler];

@Module({
    imports: [CqrsModule],
    providers: [
        ChatGateway,
        ...CommandHandlers,
        SocketIoGetway,
        {
            provide: 'SocketIoService',
            useClass: SocketIoGetway,
        },
    ],
    exports: [ChatGateway, 'SocketIoService'],
})
export class SocketIoModule { }
