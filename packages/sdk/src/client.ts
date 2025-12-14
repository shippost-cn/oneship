import {
  CreateOrderRequest,
  ShippingOrder,
  QueryOrderRequest,
  FreeShippingNotification,
  WebhookEventType,
} from '@oneship/core';
import {
  CreateOrderApiRequest,
  WebhookSubscriptionRequest,
  WebhookSubscription,
  ProviderConfigRequest,
  ApiResponse,
} from '@oneship/api';
import { OneShipConfig } from './types';

/**
 * OneShip SDK Client
 */
export class OneShip {
  private apiKey: string;
  private apiUrl: string;
  private timeout: number;

  public readonly orders: OrdersClient;
  public readonly webhooks: WebhooksClient;
  public readonly providers: ProvidersClient;
  public readonly freeShipping: FreeShippingClient;

  constructor(config: OneShipConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'http://localhost:3000';
    this.timeout = config.timeout || 30000;

    this.orders = new OrdersClient(this);
    this.webhooks = new WebhooksClient(this);
    this.providers = new ProvidersClient(this);
    this.freeShipping = new FreeShippingClient(this);
  }

  /**
   * Make API request
   */
  async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.apiUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}

/**
 * Orders client
 */
export class OrdersClient {
  constructor(private client: OneShip) {}

  /**
   * Create shipping order
   */
  async create(
    request: CreateOrderRequest,
    options?: { webhookUrl?: string }
  ): Promise<ShippingOrder> {
    const apiRequest: CreateOrderApiRequest = {
      ...request,
      webhookUrl: options?.webhookUrl,
    };

    const response = await this.client.request<ShippingOrder>(
      'POST',
      '/v1/orders',
      apiRequest
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create order');
    }

    return response.data;
  }

  /**
   * Get order by ID
   */
  async get(orderId: string): Promise<ShippingOrder> {
    const response = await this.client.request<ShippingOrder>(
      'GET',
      `/v1/orders/${orderId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Order not found');
    }

    return response.data;
  }

  /**
   * Query order status
   */
  async query(orderId: string): Promise<ShippingOrder> {
    const response = await this.client.request<ShippingOrder>(
      'POST',
      `/v1/orders/${orderId}/query`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to query order');
    }

    return response.data;
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string): Promise<void> {
    const response = await this.client.request<void>(
      'POST',
      `/v1/orders/${orderId}/cancel`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to cancel order');
    }
  }
}

/**
 * Webhooks client
 */
export class WebhooksClient {
  constructor(private client: OneShip) {}

  /**
   * Subscribe to webhook
   */
  async subscribe(request: WebhookSubscriptionRequest): Promise<WebhookSubscription> {
    const response = await this.client.request<WebhookSubscription>(
      'POST',
      '/v1/webhooks',
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to subscribe webhook');
    }

    return response.data;
  }

  /**
   * List webhook subscriptions
   */
  async list(): Promise<WebhookSubscription[]> {
    const response = await this.client.request<WebhookSubscription[]>(
      'GET',
      '/v1/webhooks'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list webhooks');
    }

    return response.data;
  }

  /**
   * Get webhook subscription
   */
  async get(webhookId: string): Promise<WebhookSubscription> {
    const response = await this.client.request<WebhookSubscription>(
      'GET',
      `/v1/webhooks/${webhookId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Webhook not found');
    }

    return response.data;
  }

  /**
   * Delete webhook subscription
   */
  async delete(webhookId: string): Promise<void> {
    const response = await this.client.request<void>(
      'DELETE',
      `/v1/webhooks/${webhookId}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete webhook');
    }
  }
}

/**
 * Providers client
 */
export class ProvidersClient {
  constructor(private client: OneShip) {}

  /**
   * List available providers
   */
  async list(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.client.request<Array<{ id: string; name: string }>>(
      'GET',
      '/v1/providers'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list providers');
    }

    return response.data;
  }

  /**
   * Configure provider
   */
  async configure(providerId: string, config: ProviderConfigRequest): Promise<void> {
    const response = await this.client.request<void>(
      'POST',
      `/v1/providers/${providerId}/configure`,
      config
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to configure provider');
    }
  }
}

/**
 * Free shipping client
 */
export class FreeShippingClient {
  constructor(private client: OneShip) {}

  /**
   * Check for free shipping
   */
  async check(orderId: string): Promise<FreeShippingNotification | null> {
    const response = await this.client.request<FreeShippingNotification | null>(
      'POST',
      `/v1/orders/${orderId}/free-shipping`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to check free shipping');
    }

    return response.data || null;
  }

  /**
   * List free shipping notifications
   */
  async list(): Promise<FreeShippingNotification[]> {
    const response = await this.client.request<FreeShippingNotification[]>(
      'GET',
      '/v1/free-shipping'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to list free shipping notifications');
    }

    return response.data;
  }
}

