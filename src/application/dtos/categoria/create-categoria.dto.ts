import { IsNotEmpty } from "class-validator";

export class CreateCategoriaDto {

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    status_id: string;
}