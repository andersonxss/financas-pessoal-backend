import { Module } from "@nestjs/common";
import { UploadController } from "@controllers";
import { UploadFileDespesasHandler } from "@commands";
import { CqrsModule } from "@nestjs/cqrs";
import { RedisModule } from "./redis.module";
import { AIModule } from "./ai.module";

@Module({
    imports: [CqrsModule, RedisModule, AIModule],
    controllers: [UploadController],
    providers: [UploadFileDespesasHandler],
})
export class UploadModule { }
