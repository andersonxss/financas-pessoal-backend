import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendMessageCommand } from './send-message.command';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler
    implements ICommandHandler<SendMessageCommand> {
    async execute(command: SendMessageCommand) {
        // regra de negócio
        const user = { id: '1', name: command.userId, message: command.message };

        return user;
    }
}
