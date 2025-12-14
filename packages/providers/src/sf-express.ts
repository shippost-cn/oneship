import { BaseProvider } from './base-provider';
import {
  ProviderId,
  CreateOrderRequest,
  CreateOrderResponse,
  QueryOrderRequest,
  QueryOrderResponse,
  ShippingOrder,
  OrderStatus,
  FreeShippingNotification,
} from '@oneship/core';
// UUID generation - in production, use a proper UUID library
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * SF Express (顺丰) provider implementation
 */
export class SFExpressProvider extends BaseProvider {
  readonly id: ProviderId = 'sf-express';
  readonly name = 'SF Express (顺丰)';

  private apiClient: any; // In real implementation, this would be the SF Express API client

  protected async onInitialize(config: any): Promise<void> {
    // Initialize SF Express API client
    // this.apiClient = new SFExpressClient(config.apiKey, config.apiSecret);
  }

  protected async doCreateOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // In real implementation, call SF Express API
    // const response = await this.apiClient.createOrder({...});

    // Mock implementation
    const order: ShippingOrder = {
      id: uuidv4(),
      provider: this.id,
      orderNumber: `SF${Date.now()}`,
      status: OrderStatus.CREATED,
      from: request.from,
      to: request.to,
      items: request.items,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      order,
      trackingNumber: order.orderNumber,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    };
  }

  protected async doQueryOrder(request: QueryOrderRequest): Promise<QueryOrderResponse> {
    // In real implementation, call SF Express API
    // const response = await this.apiClient.queryOrder(request.orderId);

    // Mock implementation
    const order: ShippingOrder = {
      id: request.orderId,
      provider: this.id,
      orderNumber: `SF${Date.now()}`,
      status: OrderStatus.IN_TRANSIT,
      from: { name: '', phone: '', address: '' },
      to: { name: '', phone: '', address: '' },
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      order,
      trackingEvents: [
        {
          timestamp: new Date(),
          status: OrderStatus.IN_TRANSIT,
          location: 'Shanghai',
          description: 'Package is in transit',
        },
      ],
    };
  }

  protected async doCancelOrder(orderId: string): Promise<void> {
    // In real implementation, call SF Express API
    // await this.apiClient.cancelOrder(orderId);
  }

  protected async doCheckFreeShipping(orderId: string): Promise<FreeShippingNotification | null> {
    // In real implementation, check SF Express free shipping promotions
    // This could involve checking their API for active promotions

    // Mock implementation - randomly return free shipping notification
    if (Math.random() > 0.7) {
      return {
        id: uuidv4(),
        orderId,
        provider: this.id,
        detectedAt: new Date(),
        amount: 15,
        conditions: ['Order over 100 CNY', 'First-time user'],
        metadata: {},
      };
    }

    return null;
  }

  protected async doStartFreeShippingListener(
    callback: (notification: FreeShippingNotification) => void
  ): Promise<void> {
    // In real implementation, set up webhook or polling for SF Express free shipping notifications
    // This could be:
    // 1. Register webhook with SF Express
    // 2. Poll their API periodically
    // 3. Listen to their event stream

    // Mock implementation - simulate periodic checks
    const interval = setInterval(async () => {
      // In real implementation, check for new free shipping opportunities
      // For now, this is just a placeholder
    }, 60000); // Check every minute

    // Store interval for cleanup
    (this as any).freeShippingInterval = interval;
  }

  protected async doStopFreeShippingListener(): Promise<void> {
    const interval = (this as any).freeShippingInterval;
    if (interval) {
      clearInterval(interval);
      delete (this as any).freeShippingInterval;
    }
  }
}

