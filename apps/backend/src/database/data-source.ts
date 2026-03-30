import 'dotenv/config';
import { DataSource } from 'typeorm';

const isTsRuntime = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USERNAME'] ?? 'shopflow',
  password: process.env['DB_PASSWORD'] ?? 'shopflow_secret',
  database: process.env['DB_NAME'] ?? 'shopflow_db',
  synchronize: false,
  logging: process.env['DB_LOGGING'] === 'true',
  entities: [isTsRuntime ? 'src/**/*.entity.ts' : 'dist/**/*.entity.js'],
  migrations: [
    isTsRuntime
      ? 'src/database/migrations/*.ts'
      : 'dist/database/migrations/*.js',
  ],
});
