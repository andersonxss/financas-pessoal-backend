import { IsNotEmpty, IsString } from "class-validator";

export class CreateUploadDespesasDto {

    @IsNotEmpty()
    @IsString()
    vencimento: string;

}