import { EventEmitter } from 'events';
import {
  WebhookEventType,
  WebhookPayload,
  ShippingOrder,
  FreeShippingNotification,
} from './types';

/**
 * Event emitter for OneShip events
 */
export class OneShipEventEmitter extends EventEmitter {
  /**
   * Emit order created event
   */
  emitOrderCreated(order: ShippingOrder): void {
    this.emit('order.created', {
      event: WebhookEventType.ORDER_CREATED,
      timestamp: new Date(),
      data: order,
      orderId: order.id,
      provider: order.provider,
    } as WebhookPayload);
  }

  /**
   * Emit order updated event
   */
  emitOrderUpdated(order: ShippingOrder): void {
    this.emit('order.updated', {
      event: WebhookEventType.ORDER_UPDATED,
      timestamp: new Date(),
      data: order,
      orderId: order.id,
      provider: order.provider,
    } as WebhookPayload);
  }

  /**
   * Emit order delivered event
   */
  emitOrderDelivered(order: ShippingOrder): void {
    this.emit('order.delivered', {
      event: WebhookEventType.ORDER_DELIVERED,
      timestamp: new Date(),
      data: order,
      orderId: order.id,
      provider: order.provider,
    } as WebhookPayload);
  }

  /**
   * Emit free shipping detected event
   */
  emitFreeShippingDetected(notification: FreeShippingNotification): void {
    this.emit('free_shipping.detected', {
      event: WebhookEventType.FREE_SHIPPING_DETECTED,
      timestamp: new Date(),
      data: notification,
      orderId: notification.orderId,
      provider: notification.provider,
    } as WebhookPayload);
  }

  /**
   * Emit free shipping expired event
   */
  emitFreeShippingExpired(notification: FreeShippingNotification): void {
    this.emit('free_shipping.expired', {
      event: WebhookEventType.FREE_SHIPPING_EXPIRED,
      timestamp: new Date(),
      data: notification,
      orderId: notification.orderId,
      provider: notification.provider,
    } as WebhookPayload);
  }
}

