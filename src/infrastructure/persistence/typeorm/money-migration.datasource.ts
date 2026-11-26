import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { DataSource } from 'typeorm';
import { NormalizeMoneyColumns1793923200000 } from './entity/migrations/1793923200000-NormalizeMoneyColumns';

// Explicit maintenance command only; never imported by application bootstrap.
if (existsSync('.env')) loadEnvFile('.env');
export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  migrationsRun: false,
  migrationsTransactionMode: 'all',
  migrations: [NormalizeMoneyColumns1793923200000],
});
