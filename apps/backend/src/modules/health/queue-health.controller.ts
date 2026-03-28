import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { QueueMonitoringService } from '../queue/queue-monitoring.service';

@ApiTags('health')
@Controller('health/queues')
export class QueueHealthController {
  constructor(private readonly queueMonitoring: QueueMonitoringService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Queue summary health and backlog counts' })
  async getQueueSummary() {
    const queues = await this.queueMonitoring.getSummary();

    return {
      status: 'ok',
      queues,
    };
  }
}
