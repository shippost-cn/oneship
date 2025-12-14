import {
  IProvider,
  ProviderId,
  ProviderConfig,
  CreateOrderRequest,
  CreateOrderResponse,
  QueryOrderRequest,
  QueryOrderResponse,
  FreeShippingNotification,
} from '@oneship/core';

/**
 * Base provider class that all courier providers should extend
 */
export abstract class BaseProvider implements IProvider {
  protected config: ProviderConfig | null = null;
  protected freeShippingListeners: Map<string, (notification: FreeShippingNotification) => void> = new Map();

  abstract readonly id: ProviderId;
  abstract readonly name: string;

  /**
   * Initialize provider with configuration
   */
  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    await this.onInitialize(config);
  }

  /**
   * Hook for provider-specific initialization
   */
  protected async onInitialize(config: ProviderConfig): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Create shipping order
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    if (!this.config) {
      throw new Error(`Provider ${this.id} is not initialized`);
    }

    // Validate request
    this.validateCreateOrderRequest(request);

    // Call provider-specific implementation
    return await this.doCreateOrder(request);
  }

  /**
   * Provider-specific order creation implementation
   */
  protected abstract doCreateOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;

  /**
   * Validate create order request
   */
  protected validateCreateOrderRequest(request: CreateOrderRequest): void {
    if (!request.from || !request.to || !request.items || request.items.length === 0) {
      throw new Error('Invalid create order request: missing required fields');
    }
    if (!request.from.phone || !request.to.phone) {
      throw new Error('Invalid create order request: phone number is required');
    }
  }

  /**
   * Query order status
   */
  async queryOrder(request: QueryOrderRequest): Promise<QueryOrderResponse> {
    if (!this.config) {
      throw new Error(`Provider ${this.id} is not initialized`);
    }

    return await this.doQueryOrder(request);
  }

  /**
   * Provider-specific order query implementation
   */
  protected abstract doQueryOrder(request: QueryOrderRequest): Promise<QueryOrderResponse>;

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<void> {
    if (!this.config) {
      throw new Error(`Provider ${this.id} is not initialized`);
    }

    await this.doCancelOrder(orderId);
  }

  /**
   * Provider-specific order cancellation implementation
   */
  protected abstract doCancelOrder(orderId: string): Promise<void>;

  /**
   * Check for free shipping opportunities
   */
  async checkFreeShipping?(orderId: string): Promise<FreeShippingNotification | null> {
    if (!this.config) {
      return null;
    }

    if (this.doCheckFreeShipping) {
      return await this.doCheckFreeShipping(orderId);
    }

    return null;
  }

  /**
   * Provider-specific free shipping check implementation
   */
  protected doCheckFreeShipping?(orderId: string): Promise<FreeShippingNotification | null>;

  /**
   * Start listening for free shipping notifications
   */
  async startFreeShippingListener?(callback: (notification: FreeShippingNotification) => void): Promise<void> {
    const listenerId = `${this.id}-${Date.now()}`;
    this.freeShippingListeners.set(listenerId, callback);

    if (this.doStartFreeShippingListener) {
      await this.doStartFreeShippingListener(callback);
    }
  }

  /**
   * Provider-specific free shipping listener start implementation
   */
  protected doStartFreeShippingListener?(callback: (notification: FreeShippingNotification) => void): Promise<void>;

  /**
   * Stop listening for free shipping notifications
   */
  async stopFreeShippingListener?(): Promise<void> {
    this.freeShippingListeners.clear();

    if (this.doStopFreeShippingListener) {
      await this.doStopFreeShippingListener();
    }
  }

  /**
   * Notify all listeners about free shipping
   */
  protected notifyFreeShippingListeners(notification: FreeShippingNotification): void {
    this.freeShippingListeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error(`Error in free shipping listener for provider ${this.id}:`, error);
      }
    });
  }
}

