import { Module } from "@nestjs/common";
import { RedisProvider } from "src/infrastructure/providers/redis.provider";
import { RedisController } from "@controllers";

@Module({
    controllers: [RedisController],
    providers: [RedisProvider],
    exports: ['RedisService'],
})

export class RedisModule { }