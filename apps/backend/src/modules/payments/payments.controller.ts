import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { PaystackService } from './paystack.service';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paystackService: PaystackService,
    @InjectRepository(WebhookEvent)
    private readonly webhookRepo: Repository<WebhookEvent>,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook receiver' })
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody;
    if (
      !rawBody ||
      !this.paystackService.verifyWebhookSignature(rawBody, signature)
    ) {
      this.logger.warn('Rejected webhook — invalid signature');
      return { received: false };
    }

    const event = this.webhookRepo.create({
      eventType: body['event'] as string,
      reference: (body['data'] as Record<string, unknown>)?.['reference'] as
        | string
        | undefined,
      rawPayload: body,
      processed: false,
    });
    await this.webhookRepo.save(event);

    this.logger.log(
      `Webhook received: ${event.eventType} ref=${event.reference}`,
    );
    // TODO: dispatch to queue for async processing
    return { received: true };
  }
}
