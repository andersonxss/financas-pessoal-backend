import { UserRole } from '@entities';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  tenant!: string;
  @IsEmail() @MaxLength(254)
  email!: string;
  @IsString() @IsNotEmpty() @MaxLength(128)
  password!: string;
}

export class RecoveryRequestDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  tenant!: string;
  @IsEmail() @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(500)
  token!: string;
  @IsString() @MinLength(6) @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/, {
    message: 'A senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password!: string;
}

export class CreateTenantDto {
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  slug!: string;
  @IsEmail() @MaxLength(254)
  adminEmail!: string;
}

export class UpdateTenantDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  name?: string;
  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class CreateInviteDto {
  @IsEmail() @MaxLength(254)
  email!: string;
  @IsEnum(UserRole)
  role!: UserRole;
}

export class AcceptInviteDto {
  @IsString() @IsNotEmpty() @MaxLength(500)
  token!: string;
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;
  @IsString() @MinLength(6) @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).+$/, { message: 'A senha deve conter maiúscula, minúscula e caractere especial' })
  password!: string;
}

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 25;
}
