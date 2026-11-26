import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { RedisService } from '@domain/services';
import { DeleteUploadDespesasCommand } from './delete-upload-despesas.command';

@CommandHandler(DeleteUploadDespesasCommand)
export class DeleteUploadDespesasHandler implements ICommandHandler<DeleteUploadDespesasCommand> {
  constructor(
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) {}

  async execute(command: DeleteUploadDespesasCommand): Promise<boolean> {
    return this.redisService.del(`pdf:${command.id}`);
  }
}
