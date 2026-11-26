import { IsNotEmpty } from "class-validator";

export class UpdateStatusDto {
    id: string;

    @IsNotEmpty()
    name: string;

}