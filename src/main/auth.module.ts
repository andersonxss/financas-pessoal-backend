import { Module } from "@nestjs/common";
import { AuthController } from "@controllers";
import { AuthTokenOrmEntity, TenantOrmEntity, UserOrmEntity } from "@persistence";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthFacadeService } from "../infrastructure/auth/auth-facade.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserOrmEntity, TenantOrmEntity, AuthTokenOrmEntity]),
        JwtModule.register({ global: true }),
    ],
    controllers: [AuthController],
    providers: [
        AuthFacadeService,
    ],
    exports: [AuthFacadeService],
})
export class AuthModule { }
