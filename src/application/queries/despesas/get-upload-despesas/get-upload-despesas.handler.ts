import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUploadDespesasQuery } from './get-upload-despesas.query';
import type { RedisService } from '@domain/services';

@QueryHandler(GetUploadDespesasQuery)
export class GetUploadDespesasHandler implements IQueryHandler<GetUploadDespesasQuery> {
  constructor(
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) {}

  async execute(command: GetUploadDespesasQuery): Promise<unknown[] | null> {
    const { id } = command;
    const data = await this.redisService.get<unknown[]>(`pdf:${id}`);
    return data;
  }
}
