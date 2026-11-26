import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Throttle, hours, minutes } from '@nestjs/throttler';
import { LoginDto, RecoveryRequestDto, ResetPasswordDto } from '@dtos';
import {
    DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
    DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
    durationToMilliseconds,
} from '../../config/auth-session';
import {
    ACCESS_COOKIE,
    AuthFacadeService,
    type AuthenticatedUser,
    Public,
    readCookie,
    REFRESH_COOKIE,
} from '../../auth';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly auth: AuthFacadeService,
        private readonly config: ConfigService,
    ) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: minutes(1) } })
    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
        const result = await this.auth.login(dto.tenant, dto.email, dto.password);
        this.setSessionCookies(response, result.accessToken, result.refreshToken);
        return { accessToken: result.accessToken, user: result.user };
    }

    @Public()
    @Throttle({ default: { limit: 20, ttl: minutes(1) } })
    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
        const token = readCookie(request.headers.cookie, REFRESH_COOKIE);
        const result = await this.auth.refresh(token ?? '');
        this.setSessionCookies(response, result.accessToken, result.refreshToken);
        return { accessToken: result.accessToken, user: result.user };
    }

    @Post('logout')
    @HttpCode(204)
    async logout(
        @Req() request: Request & { user: AuthenticatedUser },
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        await this.auth.logout(request.user.userId);
        const domain = this.config.get<string>('COOKIE_DOMAIN');
        response.clearCookie(ACCESS_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
        response.clearCookie(REFRESH_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
    }

    @Get('me')
    async me(@Req() request: Request & { user: AuthenticatedUser }) {
        return this.auth.me(request.user.userId);
    }

    @Public()
    @Throttle({ default: { limit: 3, ttl: hours(1) } })
    @Post('recovery')
    @HttpCode(202)
    async recovery(@Body() dto: RecoveryRequestDto) {
        await this.auth.requestRecovery(dto.tenant, dto.email);
        return { message: 'Se os dados estiverem corretos, você receberá as instruções por e-mail.' };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: minutes(15) } })
    @Post('reset-password')
    @HttpCode(204)
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
        await this.auth.resetPassword(dto.token, dto.password);
    }

    private setSessionCookies(response: Response, accessToken: string, refreshToken: string): void {
        const secure = this.config.get('NODE_ENV') === 'production';
        const domain = this.config.get<string>('COOKIE_DOMAIN');
        const accessMaxAge = durationToMilliseconds(
            this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
        );
        const refreshMaxAge = durationToMilliseconds(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
        );
        const base = { httpOnly: true, secure, sameSite: 'strict' as const, path: '/', ...(domain ? { domain } : {}) };
        response.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: accessMaxAge });
        response.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: refreshMaxAge });
    }
}
