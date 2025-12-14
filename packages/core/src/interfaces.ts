import {
  ProviderId,
  ShippingOrder,
  OrderStatus,
  Address,
  ShippingItem,
  FreeShippingNotification,
} from './types';

/**
 * Provider configuration
 */
export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  apiSecret?: string;
  apiUrl?: string;
  [key: string]: any;
}

/**
 * Create order request
 */
export interface CreateOrderRequest {
  provider: ProviderId;
  from: Address;
  to: Address;
  items: ShippingItem[];
  metadata?: Record<string, any>;
}

/**
 * Create order response
 */
export interface CreateOrderResponse {
  order: ShippingOrder;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

/**
 * Query order request
 */
export interface QueryOrderRequest {
  orderId: string;
  provider: ProviderId;
}

/**
 * Query order response
 */
export interface QueryOrderResponse {
  order: ShippingOrder;
  trackingEvents?: TrackingEvent[];
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  timestamp: Date;
  status: OrderStatus;
  location?: string;
  description: string;
}

/**
 * Provider interface - all courier providers must implement this
 */
export interface IProvider {
  /**
   * Provider identifier
   */
  readonly id: ProviderId;

  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Initialize provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Create shipping order
   */
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;

  /**
   * Query order status
   */
  queryOrder(request: QueryOrderRequest): Promise<QueryOrderResponse>;

  /**
   * Cancel order
   */
  cancelOrder(orderId: string): Promise<void>;

  /**
   * Check for free shipping opportunities
   * This method should be called periodically to detect free shipping
   */
  checkFreeShipping?(orderId: string): Promise<FreeShippingNotification | null>;

  /**
   * Start listening for free shipping notifications
   */
  startFreeShippingListener?(callback: (notification: FreeShippingNotification) => void): Promise<void>;

  /**
   * Stop listening for free shipping notifications
   */
  stopFreeShippingListener?(): Promise<void>;
}

