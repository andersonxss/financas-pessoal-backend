import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateUserDto {
    id!: string;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    password!: string;


}