import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { InitializeCheckoutDto, VerifyPaymentDto } from './dto/payments.dto';
import { MonnifyService } from './monnify.service';
import { PaymentProvider } from './enums/payment-provider.enum';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { Request } from 'express';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
    private readonly monnifyService: MonnifyService,
  ) {}

  @Post('checkout/:orderId')
  @Roles(UserRole.BUYER)
  @ApiOperation({
    summary: 'Initialize a checkout transaction for an order using the configured default provider',
  })
  initializeCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: InitializeCheckoutDto,
  ) {
    return this.paymentsService.initializeCheckout(user, orderId, dto);
  }

  @Post('verify')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify a payment transaction by reference' })
  verifyCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyCheckout(dto.reference, user);
  }

  @Post('reconciliation/run')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Queue an immediate payment reconciliation run' })
  enqueueReconciliationRun(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.enqueueReconciliationRun(
      'manual',
      user.id,
      true,
    );
  }

  @Get('reconciliation/runs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent payment reconciliation runs' })
  getReconciliationRuns(@Query('limit') limit?: string) {
    return this.paymentsService.getRecentReconciliationRuns(
      Number.parseInt(limit ?? '20', 10),
    );
  }

  @Get('reconciliation/issues')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent payment reconciliation issues' })
  getReconciliationIssues(@Query('limit') limit?: string) {
    return this.paymentsService.getRecentReconciliationIssues(
      Number.parseInt(limit ?? '50', 10),
    );
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook receiver' })
  async handlePaystackWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody;
    if (
      !rawBody ||
      !this.paystackService.verifyWebhookSignature(rawBody, signature)
    ) {
      this.logger.warn('Rejected Paystack webhook - invalid signature');
      return { received: false };
    }

    return this.paymentsService.enqueueWebhook(PaymentProvider.PAYSTACK, body);
  }

  @Post('webhook/monnify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Monnify webhook receiver' })
  async handleMonnifyWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('monnify-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody;
    if (
      !rawBody ||
      !this.monnifyService.verifyWebhookSignature(rawBody, signature)
    ) {
      this.logger.warn('Rejected Monnify webhook - invalid signature');
      return { received: false };
    }

    return this.paymentsService.enqueueWebhook(PaymentProvider.MONNIFY, body);
  }
}
