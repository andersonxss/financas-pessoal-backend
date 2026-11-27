import { IsNotEmpty } from "class-validator";

export class UpdateTokenAuthDto {

    @IsNotEmpty()
    token!: string;

}