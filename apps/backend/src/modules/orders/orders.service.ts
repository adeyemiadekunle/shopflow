import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import {
  FulfilmentEvent,
  FulfilmentEventType,
} from './entities/fulfilment-event.entity';
import { ORDER_TRANSITIONS, OrderStatus } from './enums/order-status.enum';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(FulfilmentEvent)
    private readonly eventRepo: Repository<FulfilmentEvent>,
  ) {}

  generateReference(): string {
    return `RND-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'items',
        'quotes',
        'fulfilmentEvents',
        'buyer',
        'sellerProfile',
      ],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async findByBuyer(buyerId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { buyerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeller(sellerProfileId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { sellerProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  async transition(
    orderId: string,
    targetStatus: OrderStatus,
    actorId: string,
    eventType: FulfilmentEventType,
    notes?: string,
    evidenceUrl?: string,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${targetStatus}`,
      );
    }

    order.status = targetStatus;
    if (targetStatus === OrderStatus.PAID) order.paidAt = new Date();
    if (targetStatus === OrderStatus.COMPLETED) order.completedAt = new Date();

    await this.orderRepo.save(order);

    await this.eventRepo.save(
      this.eventRepo.create({
        orderId,
        type: eventType,
        actorId,
        notes,
        evidenceUrl,
      }),
    );

    return order;
  }

  save(order: Partial<Order>): Promise<Order> {
    return this.orderRepo.save(order);
  }

  create(data: Partial<Order>): Order {
    return this.orderRepo.create(data);
  }
}
