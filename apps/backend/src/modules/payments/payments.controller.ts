import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { InitializeCheckoutDto, VerifyPaymentDto } from './dto/payments.dto';
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
  ) {}

  @Post('checkout/:orderId')
  @Roles(UserRole.BUYER)
  @ApiOperation({
    summary: 'Initialize a Paystack Checkout transaction for an order',
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
  @ApiOperation({ summary: 'Verify a Paystack transaction by reference' })
  verifyCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyCheckout(dto.reference, user);
  }

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
      this.logger.warn('Rejected webhook - invalid signature');
      return { received: false };
    }

    return this.paymentsService.enqueueWebhook(body);
  }
}
