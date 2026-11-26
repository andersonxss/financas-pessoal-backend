import {
  Post,
  HttpCode,
  Body,
  Controller,
  HttpException,
  Put,
  Delete,
  Param,
  Get,
  NotFoundException,
  ParseUUIDPipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { CreateDespesasDto, UpdateDespesasDto } from '@dtos';
import {
  CreateDespesasCommand,
  CreateDataProcessDespesasCommand,
  DeleteDespesasCommand,
  DeleteUploadDespesasCommand,
  UpdateDespesasCommand,
  UpdateDespesasStatusCommand,
} from '@commands';
import { AppError } from '@errors';
import {
  GetDespesasQuery,
  ListDespesasQuery,
  GetDespesasMesQuery,
  GetDespesasAnoQuery,
  GetDespesasTotalQuery,
  GetDespesasSomaTotalMesQuery,
  GetDespesasSomaTotalCategoriaQuery,
  GetDespesasSomaTotalCategoriaMesQuery,
  GetDespesasSomaTotalPagamentoQuery,
  GetUploadDespesasQuery,
  ListUploadDespesasQuery,
} from '@queries';
import type { AuthenticatedUser } from '../../auth';

interface CreateProcessDataBody {
  jobId: string;
  itens: string;
}

@Controller('despesas')
export class DespesasController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  // @UseGuards(GuardAuthHandler)
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateDespesasDto) {
    try {
      const status = await this.commandBus.execute(
        new CreateDespesasCommand(
          dto.descricao,
          dto.valor,
          dto.vencimento,
          dto.categoria_id,
          dto.status_id,
          dto.parcela_id,
          dto.pagamento_id,
        ),
      );
      return status;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Post('temporias')
  @HttpCode(201)
  async createProcessData(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateProcessDataBody,
  ) {
    try {
      const result = await this.commandBus.execute(
        new CreateDataProcessDespesasCommand(dto.jobId, dto.itens, {
          tenantId: request.user.tenantId,
          userId: request.user.userId,
          role: request.user.role,
        }),
      );
      return result;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() dto: UpdateDespesasDto) {
    try {
      const status = await this.commandBus.execute(
        new UpdateDespesasCommand(
          id,
          dto.descricao,
          dto.valor,
          dto.vencimento,
          dto.categoria_id,
          dto.status_id,
          dto.parcela_id,
          dto.pagamento_id,
        ),
      );
      return status;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Put('status/:id/:status_id')
  @HttpCode(200)
  async updateStatus(
    @Param('id') id: string,
    @Param('status_id') status_id: string,
  ) {
    try {
      const status = await this.commandBus.execute(
        new UpdateDespesasStatusCommand(id, status_id),
      );
      return status;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Delete('upload/:id')
  @HttpCode(200)
  async deleteUpload(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    try {
      const removed = await this.commandBus.execute(
        new DeleteUploadDespesasCommand(id),
      );

      if (!removed) {
        throw new NotFoundException(
          'Dados do PDF não encontrados ou expirados',
        );
      }

      return { message: 'Dados temporários removidos com sucesso' };
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    try {
      const response = await this.commandBus.execute(
        new DeleteDespesasCommand(id),
      );
      return response;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('upload')
  @HttpCode(200)
  async listUploads() {
    try {
      return await this.queryBus.execute(new ListUploadDespesasQuery());
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('upload/:id')
  @HttpCode(200)
  async getUpload(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    try {
      const despesas = await this.queryBus.execute(
        new GetUploadDespesasQuery(id),
      );

      if (despesas === null) {
        throw new NotFoundException(
          'Dados do PDF não encontrados ou expirados',
        );
      }

      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get(':ano/:mes')
  @HttpCode(200)
  async findAll(@Param('ano') ano: string, @Param('mes') mes: string) {
    try {
      const despesas = await this.queryBus.execute(
        new ListDespesasQuery(Number(ano), Number(mes)),
      );
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('total')
  @HttpCode(200)
  async findTotal() {
    try {
      const despesas = await this.queryBus.execute(new GetDespesasTotalQuery());
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('soma/total/mes/:ano')
  @HttpCode(200)
  async findSomaTotal(@Param('ano') ano: string) {
    try {
      const despesas = await this.queryBus.execute(
        new GetDespesasSomaTotalMesQuery(Number(ano)),
      );
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('soma/total/categoria/:ano')
  @HttpCode(200)
  async findSomaTotalPorCategoria(
    @Param('ano', ParseIntPipe) ano: number,
  ) {
    try {
      return await this.queryBus.execute(
        new GetDespesasSomaTotalCategoriaQuery(ano),
      );
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('soma/total/categoria/mes/:ano')
  @HttpCode(200)
  async findSomaTotalPorCategoriaMes(
    @Param('ano', ParseIntPipe) ano: number,
  ) {
    try {
      return await this.queryBus.execute(
        new GetDespesasSomaTotalCategoriaMesQuery(ano),
      );
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('soma/total/pagamento/:ano')
  @HttpCode(200)
  async findSomaTotalPorPagamento(
    @Param('ano', ParseIntPipe) ano: number,
  ) {
    try {
      return await this.queryBus.execute(
        new GetDespesasSomaTotalPagamentoQuery(ano),
      );
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('mes/:mes')
  @HttpCode(200)
  async findByMes(@Param('mes') mes: number) {
    try {
      const despesas = await this.queryBus.execute(
        new GetDespesasMesQuery(mes),
      );
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get('ano/:ano')
  @HttpCode(200)
  async findByAno(@Param('ano') ano: number) {
    try {
      const despesas = await this.queryBus.execute(
        new GetDespesasAnoQuery(ano),
      );
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }

  @Get(':id')
  @HttpCode(200)
  async findOne(@Param('id') id: string) {
    try {
      const despesas = await this.queryBus.execute(new GetDespesasQuery(id));
      return despesas;
    } catch (error) {
      const appError = new AppError(error);
      throw new HttpException(appError.message, appError.status);
    }
  }
}
