import { IsNotEmpty } from "class-validator";

export class CreatePagamentosDto {

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    status_id: string;
}