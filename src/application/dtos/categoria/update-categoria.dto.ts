import { IsNotEmpty } from "class-validator";

export class UpdateCategoriaDto {
    
    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    status_id!: string;

}