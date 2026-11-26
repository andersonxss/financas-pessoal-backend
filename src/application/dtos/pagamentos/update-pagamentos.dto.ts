import { IsNotEmpty } from "class-validator";

export class UpdatePagamentosDto {
    id!: string;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    status_id!: string;

}