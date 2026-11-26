import { IsNotEmpty } from "class-validator";

export class UpdateCategoriaDto {
    id: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    status_id: string;

}