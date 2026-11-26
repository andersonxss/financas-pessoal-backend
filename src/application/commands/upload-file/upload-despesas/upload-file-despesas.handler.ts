import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UploadFileDespesasCommand } from './upload-file-despesas.command';
import { PDFParse } from 'pdf-parse';
import { extractData } from '@application/utils';
import { randomUUID } from 'crypto';
import type { AIService, RedisService } from '@domain/services';
import fs from 'fs';
import {
  categoriasEnum,
  parcelasEnum,
  statusEnum,
  tipoPagamentoEnum,
} from '@application/enums';

@CommandHandler(UploadFileDespesasCommand)
export class UploadFileDespesasHandler implements ICommandHandler<UploadFileDespesasCommand> {
  constructor(
    @Inject('RedisService')
    private readonly redisService: RedisService,
    @Inject('AIService')
    private readonly aiService: AIService,
  ) {}

  async execute(command: UploadFileDespesasCommand): Promise<any> {
    const { file, vencimento, tipo, tenantId } = command;

    if (!file) {
      throw new Error('No file uploaded');
    }

    try {
      if (
        !tipo ||
        (tipo !== 'extracaoFaturaCartao' && tipo !== 'extracaoPorIA')
      ) {
        throw new Error('Tipo inválido.');
      }

      if (tipo === 'extracaoFaturaCartao') {
        return await this.getExtractFaturaCartao(
          file.path,
          vencimento,
          tenantId,
        );
      }

      return await this.getExtractIA(file.path, vencimento);
    } finally {
      await fs.promises.unlink(file.path).catch(() => undefined);
    }
  }

  async getExtractIA(file: string, vencimento: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(file);
      const responseAi = await this.aiService.generateText([
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: fileBuffer.toString('base64'),
              },
            },
            {
              text: `Você é um sistema de extração de dados de fatura de cartão.

                                    Analise o documento e extraia todas as linhas de compras.

                                    Cada compra possui:
                                    - vencimento (formato YYYY-MM-DD, atualize esse dados com a variável ${vencimento})
                                    - descricao (nome do estabelecimento)
                                    - parcela (ex: "1/10", opcional, se não existir use null)
                                    - prazoInicio (quando tiver a parcela ex: 1/10, pegue o primeiro número, se não existir use null)
                                    - prazoFim (quando tiver a parcela ex: 1/10, pegue o segundo número, se não existir use null)
                                    - categoria_id (id da categoria, atualize esse dados com a variável ${categoriasEnum.outros})
                                    - parcela_id (id da parcela, atualize esse dados com a variável ${parcelasEnum.p1})
                                    - pagamento_id (id do pagamento, atualize esse dados com a variável ${tipoPagamentoEnum.cartao})
                                    - status_id (id do status, atualize esse dados com a variável ${statusEnum.pago})
                                    - tipo (despesa ou receita)
                                    - valor (number, sem vírgula, use ponto como decimal)

                                    IMPORTANTE:

                                    1. Ignore completamente linhas que contenham:
                                    - PAG BOLETO BANCARIO
                                    - SALDO ANTERIOR
                                    - Total para ANDERSON S SOUZA
                                    - Total da Fatura em Real
                                    - Se a linha tiver parcela já recorrente de mes anterior não inclua exemplo: 2/10, 3/10, 4/10, etc.
                                    
                                    2. Ignore também:
                                    - Cabeçalhos
                                    - Linhas vazias
                                    - Textos institucionais

                                    3. Normalize os valores:
                                    - "196,20" → 196.20
                                    - "-221,45" → -221.45

                                    4. Se a linha tiver parcelamento:
                                    Exemplo: "MAGALU FL 892 1/10 196,20"
                                    → parcela = "1/10"

                                    5. Retorne APENAS JSON válido

                                    6.Não use markdown.

                                    7.Nunca invente compras.

                                    Formato de saída:

                                    [
                                    {
                                        "vencimento": "YYYY-MM-DD",
                                        "descricao": "string",
                                        "parcela": "string | null",
                                        "prazoInicio": "number | null",
                                        "prazoFim": "number | null",
                                        "valor": number,
                                        "categoria_id": "string",
                                        "parcela_id": "string",
                                        "pagamento_id": "string",
                                        "status_id": "string",
                                        "tipo": 'despesa'
                                    }
                                    ]
                                    `,
            },
          ],
        },
      ]);
      const id = randomUUID();
      const ttl = 60 * 60 * 24; // 24 horas em segundos

      await this.redisService.set(`pdf:${id}`, responseAi, ttl);

      return {
        message: 'PDF processado com sucesso',
        id: id,
        dataCount: Array.isArray(responseAi) ? responseAi.length : 0,
      };
    } catch (error) {
      throw new Error('Error processing PDF');
    }
  }

  async getExtractFaturaCartao(
    file: string,
    vencimento: string,
    tenantId: string,
  ): Promise<any> {
    const parser = new PDFParse({ url: file });
    try {
      const textResult = await parser.getText();

      if (!textResult.text.trim()) {
        throw new Error('Nenhum texto foi encontrado no PDF.');
      }

      const parsedData = extractData(textResult.text, vencimento, tenantId);

      if (parsedData.length === 0) {
        throw new Error('Nenhum lançamento foi encontrado no PDF.');
      }

      const id = randomUUID();
      const ttl = 60 * 60 * 24;

      await this.redisService.set(`pdf:${id}`, parsedData, ttl);

      return {
        message: 'PDF processado com sucesso',
        id,
        dataCount: parsedData.length,
        data: parsedData,
      };
    } finally {
      await parser.destroy();
    }
  }
}
