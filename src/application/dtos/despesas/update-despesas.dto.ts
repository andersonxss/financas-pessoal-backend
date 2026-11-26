import { IsNotEmpty, IsNumber, Min, Max } from "class-validator";

export class UpdateDespesasDto {
    @IsNotEmpty()
    descricao!: string;

    @IsNotEmpty()
    @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
    @Min(-99999999.99)
    @Max(99999999.99)
    valor!: number;

    @IsNotEmpty()
    vencimento!: Date;

    @IsNotEmpty()
    categoria_id!: string;

    @IsNotEmpty()
    status_id!: string;

    @IsNotEmpty()
    parcela_id!: string;

    @IsNotEmpty()
    pagamento_id!: string;

}