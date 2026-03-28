import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions } from 'bullmq';
import {
  QUEUE_CONNECTION_OPTIONS,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from './queue.constants';
import { QueueMonitoringService } from './queue-monitoring.service';

type QueueConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
};

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_CONNECTION_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): QueueConnectionOptions => ({
        host: config.get<string>('redis.host') ?? 'localhost',
        port: config.get<number>('redis.port') ?? 6379,
        password: config.get<string>('redis.password') ?? undefined,
        maxRetriesPerRequest: null,
      }),
    },
    {
      provide: QUEUE_DEFAULT_JOB_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): JobsOptions => ({
        attempts: config.get<number>('queue.attempts') ?? 3,
        backoff: {
          type: 'exponential',
          delay: config.get<number>('queue.backoffMs') ?? 2000,
        },
        removeOnComplete: {
          age: config.get<number>('queue.removeOnCompleteAgeSeconds') ?? 86400,
          count: config.get<number>('queue.removeOnCompleteCount') ?? 1000,
        },
        removeOnFail: {
          age: config.get<number>('queue.removeOnFailAgeSeconds') ?? 604800,
          count: config.get<number>('queue.removeOnFailCount') ?? 5000,
        },
      }),
    },
    QueueMonitoringService,
  ],
  exports: [
    QUEUE_CONNECTION_OPTIONS,
    QUEUE_DEFAULT_JOB_OPTIONS,
    QueueMonitoringService,
  ],
})
export class QueueModule {}
