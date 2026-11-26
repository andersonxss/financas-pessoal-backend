import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	Param,
	ParseIntPipe,
	ParseUUIDPipe,
	Post,
	Put,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
	CreateReceitasCommand,
	DeleteReceitasCommand,
	UpdateReceitasCommand,
	UpdateReceitasStatusCommand,
} from "@commands";
import { CreateReceitasDto, UpdateReceitasDto } from "@dtos";
import { AppError } from "@errors";
import {
	GetReceitasAnoQuery,
	GetReceitasMesQuery,
	GetReceitasQuery,
	GetReceitasSomaTotalAnoQuery,
	ListReceitasQuery,
} from "@queries";

function validateYear(ano: number): void {
	if (ano < 1900 || ano > 2100) {
		throw new BadRequestException("Ano inválido.");
	}
}

function validateMonth(mes: number): void {
	if (mes < 1 || mes > 12) {
		throw new BadRequestException("Mês deve estar entre 1 e 12.");
	}
}

function parseRecebimento(recebimento: string): Date {
	const normalized = /^\d{4}-\d{2}-\d{2}$/.test(recebimento)
		? `${recebimento}T12:00:00`
		: recebimento;
	return new Date(normalized);
}

@Controller("receitas")
export class ReceitasController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
	@HttpCode(201)
	async create(@Body() dto: CreateReceitasDto) {
		try {
			return await this.commandBus.execute(
				new CreateReceitasCommand(
					dto.descricao,
					dto.valor,
					parseRecebimento(dto.recebimento),
					dto.categoria_id,
					dto.status_id,
				),
			);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Put("status/:id/:status_id")
	@HttpCode(200)
	async updateStatus(
		@Param("id", ParseUUIDPipe) id: string,
		@Param("status_id", ParseUUIDPipe) statusId: string,
	) {
		try {
			return await this.commandBus.execute(
				new UpdateReceitasStatusCommand(id, statusId),
			);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Put(":id")
	@HttpCode(200)
	async update(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateReceitasDto,
	) {
		try {
			return await this.commandBus.execute(
				new UpdateReceitasCommand(
					id,
					dto.descricao,
					dto.valor,
					parseRecebimento(dto.recebimento),
					dto.categoria_id,
					dto.status_id,
				),
			);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Delete(":id")
	@HttpCode(204)
	async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		try {
			await this.commandBus.execute(new DeleteReceitasCommand(id));
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Get("soma/total/mes/:ano")
	@HttpCode(200)
	async findSomaTotalAno(@Param("ano", ParseIntPipe) ano: number) {
		try {
			validateYear(ano);
			return await this.queryBus.execute(
				new GetReceitasSomaTotalAnoQuery(ano),
			);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Get("mes/:mes")
	@HttpCode(200)
	async findAllMes(@Param("mes", ParseIntPipe) mes: number) {
		try {
			validateMonth(mes);
			return await this.queryBus.execute(new GetReceitasMesQuery(mes));
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Get("ano/:ano")
	@HttpCode(200)
	async findAllAno(@Param("ano", ParseIntPipe) ano: number) {
		try {
			validateYear(ano);
			return await this.queryBus.execute(new GetReceitasAnoQuery(ano));
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Get(":ano/:mes")
	@HttpCode(200)
	async findAll(
		@Param("ano", ParseIntPipe) ano: number,
		@Param("mes", ParseIntPipe) mes: number,
	) {
		try {
			validateYear(ano);
			validateMonth(mes);
			return await this.queryBus.execute(new ListReceitasQuery(ano, mes));
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	@Get(":id")
	@HttpCode(200)
	async findById(@Param("id", ParseUUIDPipe) id: string) {
		try {
			return await this.queryBus.execute(new GetReceitasQuery(id));
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	private handleError(error: unknown): never {
		const appError = new AppError(error);
		throw new HttpException(appError.message, appError.status);
	}
}
