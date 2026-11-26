import { IsNotEmpty } from "class-validator";

export class CreateParcelasDto {

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    status_id: string;
}