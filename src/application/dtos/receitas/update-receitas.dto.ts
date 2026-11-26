import {
	IsDateString,
	IsNotEmpty,
	IsNumber,
	IsString,
	IsUUID,
	Max,
	Min,
} from "class-validator";

export class UpdateReceitasDto {
	@IsString()
	@IsNotEmpty()
	descricao: string;

	@IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
	@Min(-99999999.99)
	@Max(99999999.99)
	valor: number;

	@IsDateString({ strict: true })
	recebimento: string;

	@IsUUID()
	categoria_id: string;

	@IsUUID()
	status_id: string;
}
