import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { UserModule } from './user.module';
import { AuthModule } from './auth.module';
import { StatusModule } from './status.module';
import { CategoriaModule } from './categoria.module';
import { ParcelasModule } from './parcelas.module';
import { PagamentosModule } from './pagamentos.module';
import { RabbitMQModule } from './rabbitMQ.module';
import { RedisModule } from './redis.module';
import { UploadModule } from './upload.module';
import { DespesasModule } from './despesas.module';
import { SocketIoModule } from './socketIo.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig, validateEnvironment } from '@infrastructure/config';
import { AIModule } from './ai.module';
import { ReceitasModule } from './receitas.module';
import { SecurityModule } from './security.module';
import { TenantModule } from './tenant.module';
import { ThrottlerModule, minutes } from '@nestjs/throttler';


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return getTypeOrmConfig(configService);
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: minutes(1), limit: 120 },
    ]),
    SecurityModule,
    TenantModule,
    UserModule,
    AuthModule,
    StatusModule,
    CategoriaModule,
    ParcelasModule,
    PagamentosModule,
    RedisModule,
    RabbitMQModule,
    UploadModule,
    DespesasModule,
    SocketIoModule,
    AIModule,
    ReceitasModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
