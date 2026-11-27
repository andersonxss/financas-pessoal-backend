import { IsNotEmpty } from "class-validator";

export class UpdatePagamentosDto {
   
    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    status_id!: string;

}