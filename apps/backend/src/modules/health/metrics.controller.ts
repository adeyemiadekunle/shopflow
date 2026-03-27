import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { register } from 'prom-client';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@ApiExcludeController()
@Controller()
export class MetricsController {
  @Get()
  @Public()
  async index(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', register.contentType);
    response.send(await register.metrics());
  }
}
