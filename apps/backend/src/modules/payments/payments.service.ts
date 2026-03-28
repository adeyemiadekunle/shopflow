import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from '../orders/entities/fulfilment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { PAYMENTS_QUEUE, PaymentJobName } from '../queue/queue.constants';
import {
  InitializeCheckoutDto,
  PaystackCheckoutChannel,
} from './dto/payments.dto';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from './entities/payment-intent.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import {
  PaystackInitResponse,
  PaystackService,
  PaystackVerifyResponse,
} from './paystack.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    @InjectRepository(WebhookEvent)
    private readonly webhookRepo: Repository<WebhookEvent>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(FulfilmentEvent)
    private readonly fulfilmentEventRepo: Repository<FulfilmentEvent>,
    @Inject(PAYMENTS_QUEUE)
    private readonly paymentsQueue: Queue,
    private readonly paystackService: PaystackService,
    private readonly usersService: UsersService,
  ) {}

  private generateReference(orderReference: string): string {
    return `PAY-${orderReference}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  private normalizeChannels(
    channels?: PaystackCheckoutChannel[],
  ): PaystackCheckoutChannel[] | undefined {
    if (!channels?.length) {
      return undefined;
    }

    return Array.from(new Set(channels));
  }

  private isSuccessfulVerifyResponse(
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return verifyResponse.status === 'success';
  }

  private isFailedVerifyResponse(
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return (
      verifyResponse.status === 'failed' ||
      verifyResponse.status === 'abandoned'
    );
  }

  private isSameFinalOutcome(
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): boolean {
    return (
      (intent.status === PaymentIntentStatus.SUCCEEDED &&
        this.isSuccessfulVerifyResponse(verifyResponse)) ||
      (intent.status === PaymentIntentStatus.FAILED &&
        this.isFailedVerifyResponse(verifyResponse))
    );
  }

  private async findExistingWebhookEvent(
    eventType: string,
    paystackEventId?: string,
    reference?: string,
  ): Promise<WebhookEvent | null> {
    const orWhere: Array<Partial<WebhookEvent>> = [];

    if (paystackEventId) {
      orWhere.push({ paystackEventId });
    }

    if (reference) {
      orWhere.push({ eventType, reference });
    }

    if (orWhere.length === 0) {
      return null;
    }

    return this.webhookRepo.findOne({
      where: orWhere,
      order: { createdAt: 'DESC' },
    });
  }

  private async getIntentByReferenceOrThrow(
    reference: string,
  ): Promise<PaymentIntent> {
    const intent = await this.paymentIntentRepo.findOne({
      where: { paystackReference: reference },
    });

    if (!intent) {
      throw new NotFoundException(`Payment intent ${reference} not found`);
    }

    return intent;
  }

  private async ensureBuyerOwnsIntent(
    reference: string,
    user: AuthenticatedUser,
  ): Promise<PaymentIntent> {
    const intent = await this.getIntentByReferenceOrThrow(reference);

    if (user.role !== UserRole.ADMIN && intent.buyerId !== user.id) {
      throw new ForbiddenException('You can only verify your own payments');
    }

    return intent;
  }

  private async getOrderByIdOrThrow(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['buyer', 'sellerProfile'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  private async ensureBuyerOwnsOrderForCheckout(
    orderId: string,
    user: AuthenticatedUser,
  ) {
    const order = await this.getOrderByIdOrThrow(orderId);

    if (user.role !== UserRole.ADMIN && order.buyerId !== user.id) {
      throw new ForbiddenException(
        'You can only initialize payment for your own order',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('This order has already been paid for');
    }

    if (
      order.status !== OrderStatus.QUOTE_ACCEPTED &&
      order.status !== OrderStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException(
        'Payment can only be initialized after the delivery quote is accepted',
      );
    }

    if (Number(order.totalAmount) <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    return order;
  }

  private async markOrderPaid(
    order: Order,
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): Promise<void> {
    if (order.status === OrderStatus.PAID) {
      return;
    }

    if (order.status === OrderStatus.QUOTE_ACCEPTED) {
      order.status = OrderStatus.PAYMENT_PENDING;
    }

    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException(
        `Cannot mark order ${order.id} as paid from status ${order.status}`,
      );
    }

    order.status = OrderStatus.PAID;
    order.paidAt = new Date(verifyResponse.paid_at);
    await this.orderRepo.save(order);

    await this.fulfilmentEventRepo.save(
      this.fulfilmentEventRepo.create({
        orderId: order.id,
        type: FulfilmentEventType.PAYMENT_RECEIVED,
        actorId: intent.buyerId,
        notes: `Payment confirmed via Paystack (${verifyResponse.channel})`,
        metadata: {
          reference: verifyResponse.reference,
          amount: verifyResponse.amount,
          currency: verifyResponse.currency,
        },
      }),
    );
  }

  private async finalizeVerifiedPayment(
    intent: PaymentIntent,
    verifyResponse: PaystackVerifyResponse,
  ): Promise<PaymentIntent> {
    if (verifyResponse.reference !== intent.paystackReference) {
      throw new BadRequestException('Payment reference mismatch');
    }

    if (verifyResponse.amount !== Number(intent.amountKobo)) {
      throw new BadRequestException('Payment amount mismatch');
    }

    if (verifyResponse.currency !== intent.currency) {
      throw new BadRequestException('Payment currency mismatch');
    }

    if (this.isSameFinalOutcome(intent, verifyResponse)) {
      return intent;
    }

    if (
      intent.status === PaymentIntentStatus.SUCCEEDED &&
      this.isFailedVerifyResponse(verifyResponse)
    ) {
      throw new BadRequestException(
        'Refusing to overwrite a successful payment with a failed verification result',
      );
    }

    const nextStatus =
      verifyResponse.status === 'success'
        ? PaymentIntentStatus.SUCCEEDED
        : verifyResponse.status === 'failed' ||
            verifyResponse.status === 'abandoned'
          ? PaymentIntentStatus.FAILED
          : PaymentIntentStatus.PROCESSING;

    const savedIntent = await this.paymentIntentRepo.save({
      ...intent,
      status: nextStatus,
      rawVerifyPayload: verifyResponse as unknown as Record<string, unknown>,
      verifiedAt:
        verifyResponse.status === 'success'
          ? new Date(verifyResponse.paid_at)
          : undefined,
    });

    if (nextStatus !== PaymentIntentStatus.SUCCEEDED) {
      return savedIntent;
    }

    const order = await this.getOrderByIdOrThrow(intent.orderId);
    await this.markOrderPaid(order, intent, verifyResponse);

    return savedIntent;
  }

  async initializeCheckout(
    user: AuthenticatedUser,
    orderId: string,
    dto: InitializeCheckoutDto,
  ) {
    const order = await this.ensureBuyerOwnsOrderForCheckout(orderId, user);
    const buyer = await this.usersService.findById(user.id);

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const idempotencyKey =
      dto.idempotencyKey?.trim() || this.generateIdempotencyKey();
    const existingIntent = await this.paymentIntentRepo.findOne({
      where: { idempotencyKey },
    });

    if (existingIntent) {
      if (
        existingIntent.buyerId !== user.id ||
        existingIntent.orderId !== orderId
      ) {
        throw new ForbiddenException(
          'This idempotency key belongs to another payment',
        );
      }

      return existingIntent;
    }

    if (order.status === OrderStatus.QUOTE_ACCEPTED) {
      await this.orderRepo.save({
        ...order,
        status: OrderStatus.PAYMENT_PENDING,
      });
    }

    const reference = this.generateReference(order.orderReference);
    const amountKobo = Math.round(Number(order.totalAmount) * 100);
    const paystackResponse: PaystackInitResponse =
      await this.paystackService.initializeTransaction({
        email: buyer.email,
        amountKobo,
        currency: order.currency,
        reference,
        callbackUrl: dto.callbackUrl,
        channels: this.normalizeChannels(dto.channels),
        orderId: order.id,
        buyerId: user.id,
        sellerProfileId: order.sellerProfileId,
        metadata: {
          order_reference: order.orderReference,
        },
      });

    const intent = await this.paymentIntentRepo.save(
      this.paymentIntentRepo.create({
        orderId: order.id,
        buyerId: user.id,
        paystackReference: paystackResponse.reference,
        idempotencyKey,
        amountKobo,
        currency: order.currency,
        status: PaymentIntentStatus.PROCESSING,
        authorizationUrl: paystackResponse.authorization_url,
      }),
    );

    return {
      ...intent,
      accessCode: paystackResponse.access_code,
      authorizationUrl: paystackResponse.authorization_url,
      reference: paystackResponse.reference,
    };
  }

  async verifyCheckout(reference: string, user: AuthenticatedUser) {
    const intent = await this.ensureBuyerOwnsIntent(reference, user);
    const verifyResponse =
      await this.paystackService.verifyTransaction(reference);
    const updatedIntent = await this.finalizeVerifiedPayment(
      intent,
      verifyResponse,
    );

    return {
      paymentIntent: updatedIntent,
      paystack: verifyResponse,
    };
  }

  async enqueueWebhook(body: Record<string, unknown>) {
    const data = body['data'] as Record<string, unknown> | undefined;
    const paystackEventIdValue = data?.['id'];
    const paystackEventId =
      typeof paystackEventIdValue === 'string' ||
      typeof paystackEventIdValue === 'number'
        ? String(paystackEventIdValue)
        : '';
    const eventTypeValue = body['event'];
    const eventType =
      typeof eventTypeValue === 'string' ? eventTypeValue : 'unknown';
    const reference =
      typeof data?.['reference'] === 'string' ? data['reference'] : undefined;
    const existingEvent = await this.findExistingWebhookEvent(
      eventType,
      paystackEventId || undefined,
      reference,
    );

    if (existingEvent?.processed) {
      return {
        received: true,
        queued: false,
        eventId: existingEvent.id,
        status: 'already_processed',
      };
    }

    const event = existingEvent
      ? await this.webhookRepo.save({
          ...existingEvent,
          eventType,
          reference: reference ?? existingEvent.reference,
          rawPayload: body,
          error: undefined,
        })
      : await this.webhookRepo.save(
          this.webhookRepo.create({
            eventType,
            paystackEventId: paystackEventId || undefined,
            reference,
            rawPayload: body,
            processed: false,
          }),
        );

    await this.paymentsQueue.add(
      PaymentJobName.PROCESS_WEBHOOK_EVENT,
      {
        webhookEventId: event.id,
      },
      {
        jobId: `payment-webhook:${event.id}`,
      },
    );

    return {
      received: true,
      queued: true,
      eventId: event.id,
    };
  }

  async processWebhookEvent(webhookEventId: string): Promise<void> {
    const event = await this.webhookRepo.findOne({
      where: { id: webhookEventId },
    });

    if (!event) {
      throw new NotFoundException(`Webhook event ${webhookEventId} not found`);
    }

    if (event.processed) {
      return;
    }

    const body = event.rawPayload;

    try {
      if (event.eventType === 'charge.success' && event.reference) {
        const intent = await this.getIntentByReferenceOrThrow(event.reference);
        if (intent.status !== PaymentIntentStatus.SUCCEEDED) {
          const verifyResponse = await this.paystackService.verifyTransaction(
            event.reference,
          );
          await this.finalizeVerifiedPayment(intent, verifyResponse);
        }
      }

      if (event.eventType === 'charge.failed' && event.reference) {
        const intent = await this.getIntentByReferenceOrThrow(event.reference);
        if (intent.status !== PaymentIntentStatus.SUCCEEDED) {
          if (intent.status !== PaymentIntentStatus.FAILED) {
            await this.paymentIntentRepo.save({
              ...intent,
              status: PaymentIntentStatus.FAILED,
              rawVerifyPayload: body,
            });
          }
        } else {
          this.logger.warn(
            `Ignoring charge.failed webhook for already successful payment ${event.reference}`,
          );
        }
      }

      await this.webhookRepo.save({
        ...event,
        processed: true,
        processedAt: new Date(),
        error: undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook processing error';
      await this.webhookRepo.save({
        ...event,
        processed: false,
        error: message,
      });
      this.logger.error(`Failed to process Paystack webhook: ${message}`);
      throw error;
    }
  }
}
