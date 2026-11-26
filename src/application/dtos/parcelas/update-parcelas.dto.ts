import { IsNotEmpty } from "class-validator";

export class UpdateParcelasDto {
    id: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    status_id: string;

}