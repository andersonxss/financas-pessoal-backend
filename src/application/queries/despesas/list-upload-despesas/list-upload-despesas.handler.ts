import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RedisService } from '@domain/services';
import { ListUploadDespesasQuery } from './list-upload-despesas.query';

export interface TemporaryPdfData {
  id: string;
  dataCount: number;
  data: unknown[];
}

@QueryHandler(ListUploadDespesasQuery)
export class ListUploadDespesasHandler implements IQueryHandler<ListUploadDespesasQuery> {
  constructor(
    @Inject('RedisService')
    private readonly redisService: RedisService,
  ) {}

  async execute(): Promise<TemporaryPdfData[]> {
    const entries = await this.redisService.findByPattern<unknown[]>('pdf:*');

    return entries
      .map(({ key, value }) => ({
        id: key.slice('pdf:'.length),
        dataCount: Array.isArray(value) ? value.length : 0,
        data: Array.isArray(value) ? value : [],
      }))
      .sort((first, second) => first.id.localeCompare(second.id));
  }
}
