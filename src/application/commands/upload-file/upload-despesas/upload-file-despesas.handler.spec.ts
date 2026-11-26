import { access, mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AIService, RedisService } from '@domain/services';
import { statusEnum } from '@application/enums';
import { UploadFileDespesasCommand } from './upload-file-despesas.command';
import { UploadFileDespesasHandler } from './upload-file-despesas.handler';

describe('UploadFileDespesasHandler', () => {
  let directory: string;
  let filePath: string;
  let redisService: jest.Mocked<RedisService>;
  let aiService: jest.Mocked<AIService>;
  let handler: UploadFileDespesasHandler;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'finance-upload-'));
    filePath = join(directory, 'documento.pdf');
    await writeFile(filePath, Buffer.from('%PDF-diagnostico'));

    redisService = {
      get: jest.fn(),
      findByPattern: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    aiService = {
      generateText: jest.fn(),
    };
    handler = new UploadFileDespesasHandler(redisService, aiService);
  });

  afterEach(async () => {
    await rm(filePath, { force: true });
    await rmdir(directory).catch(() => undefined);
  });

  const command = (tipo: string) =>
    new UploadFileDespesasCommand(
      { path: filePath } as Express.Multer.File,
      '2026-11-16',
      tipo,
      'tenant-id',
    );

  it('remove o arquivo quando o tipo de extração é inválido', async () => {
    await expect(handler.execute(command('invalido'))).rejects.toThrow(
      'Tipo inválido.',
    );

    await expect(access(filePath)).rejects.toThrow();
    expect(redisService.set).not.toHaveBeenCalled();
  });

  it('remove o arquivo após uma extração por IA bem-sucedida', async () => {
    aiService.generateText.mockResolvedValue('[]');

    await expect(
      handler.execute(command('extracaoPorIA')),
    ).resolves.toMatchObject({
      message: 'PDF processado com sucesso',
      dataCount: 0,
    });

    await expect(access(filePath)).rejects.toThrow();
    expect(redisService.set).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(aiService.generateText.mock.calls[0][0])).toContain(
      statusEnum.pago,
    );
    expect(JSON.stringify(aiService.generateText.mock.calls[0][0])).not.toContain(
      statusEnum.aberto,
    );
  });

  it('remove o arquivo quando a extração por IA falha', async () => {
    aiService.generateText.mockRejectedValue(new Error('falha externa'));

    await expect(handler.execute(command('extracaoPorIA'))).rejects.toThrow(
      'Error processing PDF',
    );

    await expect(access(filePath)).rejects.toThrow();
    expect(redisService.set).not.toHaveBeenCalled();
  });
});
