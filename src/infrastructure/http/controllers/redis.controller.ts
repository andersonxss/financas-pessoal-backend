import { Controller, Get, Post, Body, Delete, Param, Inject, HttpCode } from '@nestjs/common';
import * as services from '@domain/services';
import { UserRole } from '@entities';
import { Roles } from '../../auth';

@Roles(UserRole.SUPER_ADMIN)
@Controller('redis')
export class RedisController {
    constructor(
        @Inject('RedisService')
        private readonly redisService: services.RedisService,
    ) { }

    @Get('ping')
    @HttpCode(200)
    async ping() {
        try {
            // Testa se consegue escrever e ler do Redis
            const testKey = 'redis-test-ping';
            const testValue = { message: 'Redis is working!', timestamp: new Date().toISOString() };

            await this.redisService.set(testKey, testValue, 10); // TTL de 10 segundos
            const result = await this.redisService.get(testKey);

            return {
                status: 'success',
                message: 'Redis está funcionando corretamente!',
                test: result,
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Erro ao conectar com Redis',
                error: error.message,
            };
        }
    }

    @Post('set')
    @HttpCode(201)
    async set(@Body() body: { key: string; value: any; ttl?: number }) {
        try {
            await this.redisService.set(body.key, body.value, body.ttl || 60);
            return {
                status: 'success',
                message: `Chave '${body.key}' salva no Redis`,
                ttl: body.ttl || 60,
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Erro ao salvar no Redis',
                error: error.message,
            };
        }
    }

    @Get('get/:key')
    @HttpCode(200)
    async get(@Param('key') key: string) {
        try {
            const value = await this.redisService.get(key);
            if (value === null) {
                return {
                    status: 'not_found',
                    message: `Chave '${key}' não encontrada no Redis`,
                };
            }
            return {
                status: 'success',
                key,
                value,
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Erro ao buscar no Redis',
                error: error.message,
            };
        }
    }

    @Delete('delete/:key')
    @HttpCode(200)
    async delete(@Param('key') key: string) {
        try {
            await this.redisService.del(key);
            return {
                status: 'success',
                message: `Chave '${key}' deletada do Redis`,
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Erro ao deletar do Redis',
                error: error.message,
            };
        }
    }
}
