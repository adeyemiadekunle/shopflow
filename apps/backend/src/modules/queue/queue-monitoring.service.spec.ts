import { Queue } from 'bullmq';
import { QueueMonitoringService } from './queue-monitoring.service';
import { QueueName } from './queue.constants';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => ({
    name,
    close: jest.fn().mockResolvedValue(undefined),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 1,
      active: 2,
      completed: 3,
      failed: 4,
      delayed: 5,
      paused: 0,
    }),
  })),
}));

describe('QueueMonitoringService', () => {
  it('returns queue summaries for payments, orders, and dead-letter queues', async () => {
    const service = new QueueMonitoringService({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });

    service.onModuleInit();

    const result = await service.getSummary();

    expect(Queue).toHaveBeenCalledTimes(3);
    expect(result).toEqual([
      {
        name: QueueName.PAYMENTS,
        counts: {
          waiting: 1,
          active: 2,
          completed: 3,
          failed: 4,
          delayed: 5,
          paused: 0,
        },
      },
      {
        name: QueueName.ORDERS,
        counts: {
          waiting: 1,
          active: 2,
          completed: 3,
          failed: 4,
          delayed: 5,
          paused: 0,
        },
      },
      {
        name: QueueName.DEAD_LETTER,
        counts: {
          waiting: 1,
          active: 2,
          completed: 3,
          failed: 4,
          delayed: 5,
          paused: 0,
        },
      },
    ]);

    await service.onModuleDestroy();
  });
});
