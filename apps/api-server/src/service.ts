import {
  CreateOrderRequest,
  QueryOrderRequest,
  ShippingOrder,
  IProvider,
  ProviderId,
  ProviderConfig,
  FreeShippingNotification,
  WebhookEventType,
  WebhookPayload,
  OneShipEventEmitter,
} from '@oneship/core';
import { ProviderRegistry } from '@oneship/providers';
import {
  WorkflowEngine,
  WorkflowDefinition,
  DEFAULT_CREATE_ORDER_WORKFLOW,
  DEFAULT_FREE_SHIPPING_WORKFLOW,
} from '@oneship/workflow';
import { WebhookSubscription } from '@oneship/api';

/**
 * Main OneShip service
 */
export class OneShipService {
  private providerRegistry: ProviderRegistry;
  private workflowEngine: WorkflowEngine;
  private eventEmitter: OneShipEventEmitter;
  private webhooks: Map<string, WebhookSubscription> = new Map();
  private orders: Map<string, ShippingOrder> = new Map();
  private freeShippingNotifications: Map<string, FreeShippingNotification> = new Map();

  constructor() {
    this.providerRegistry = new ProviderRegistry();
    this.eventEmitter = new OneShipEventEmitter();
    this.workflowEngine = new WorkflowEngine(this.sendWebhook.bind(this));

    // Register event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventEmitter.on('order.created', (payload: WebhookPayload) => {
      this.handleWebhookEvent(payload);
    });

    this.eventEmitter.on('order.updated', (payload: WebhookPayload) => {
      this.handleWebhookEvent(payload);
    });

    this.eventEmitter.on('order.delivered', (payload: WebhookPayload) => {
      this.handleWebhookEvent(payload);
    });

    this.eventEmitter.on('free_shipping.detected', (payload: WebhookPayload) => {
      this.handleWebhookEvent(payload);
    });

    this.eventEmitter.on('free_shipping.expired', (payload: WebhookPayload) => {
      this.handleWebhookEvent(payload);
    });
  }

  /**
   * Register a provider
   */
  registerProvider(provider: IProvider): void {
    this.providerRegistry.register(provider);
  }

  /**
   * Configure a provider
   */
  async configureProvider(providerId: ProviderId, config: ProviderConfig): Promise<void> {
    await this.providerRegistry.initializeProvider(providerId, config);
  }

  /**
   * Create shipping order
   */
  async createOrder(request: CreateOrderRequest, webhookUrl?: string): Promise<ShippingOrder> {
    // Execute workflow
    const workflow: WorkflowDefinition = {
      ...DEFAULT_CREATE_ORDER_WORKFLOW,
      steps: DEFAULT_CREATE_ORDER_WORKFLOW.steps.map((step) => {
        if (step.type === 'webhook' && webhookUrl) {
          return {
            ...step,
            config: { ...step.config, url: webhookUrl },
          };
        }
        return step;
      }),
    };

    const providers = new Map<string, IProvider>();
    this.providerRegistry.getAll().forEach((p) => {
      if (this.providerRegistry.isInitialized(p.id)) {
        providers.set(p.id, p);
      }
    });

    const execution = await this.workflowEngine.execute(
      workflow,
      {
        provider: request.provider,
        input: request,
      },
      providers
    );

    // Get order from execution output
    const createOrderStep = execution.steps.find((s) => s.name === 'Create Order');
    if (!createOrderStep || createOrderStep.status !== 'success') {
      throw new Error('Failed to create order');
    }

    const order = createOrderStep.output?.order as ShippingOrder;
    this.orders.set(order.id, order);

    // Emit event
    this.eventEmitter.emitOrderCreated(order);

    return order;
  }

  /**
   * Query order status
   */
  async queryOrder(orderId: string): Promise<ShippingOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const provider = this.providerRegistry.getInitialized(order.provider);
    if (!provider) {
      throw new Error(`Provider ${order.provider} is not initialized`);
    }

    const request: QueryOrderRequest = {
      orderId: order.orderNumber || orderId,
      provider: order.provider,
    };

    const response = await provider.queryOrder(request);
    const updatedOrder = response.order;
    this.orders.set(orderId, updatedOrder);

    // Emit event
    this.eventEmitter.emitOrderUpdated(updatedOrder);

    if (updatedOrder.status === 'delivered') {
      this.eventEmitter.emitOrderDelivered(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const provider = this.providerRegistry.getInitialized(order.provider);
    if (!provider) {
      throw new Error(`Provider ${order.provider} is not initialized`);
    }

    await provider.cancelOrder(order.orderNumber || orderId);
    order.status = 'cancelled';
    this.orders.set(orderId, order);

    this.eventEmitter.emitOrderUpdated(order);
  }

  /**
   * Check for free shipping
   */
  async checkFreeShipping(orderId: string): Promise<FreeShippingNotification | null> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const provider = this.providerRegistry.getInitialized(order.provider);
    if (!provider || !provider.checkFreeShipping) {
      return null;
    }

    const notification = await provider.checkFreeShipping(orderId);
    if (notification) {
      this.freeShippingNotifications.set(notification.id, notification);
      this.eventEmitter.emitFreeShippingDetected(notification);
    }

    return notification;
  }

  /**
   * Subscribe to webhook
   */
  async subscribeWebhook(
    url: string,
    events: WebhookEventType[],
    secret?: string
  ): Promise<WebhookSubscription> {
    const subscription: WebhookSubscription = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      events,
      secret,
      createdAt: new Date(),
      active: true,
    };

    this.webhooks.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Get webhook subscription
   */
  getWebhook(webhookId: string): WebhookSubscription | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List webhook subscriptions
   */
  listWebhooks(): WebhookSubscription[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Delete webhook subscription
   */
  deleteWebhook(webhookId: string): void {
    this.webhooks.delete(webhookId);
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): ShippingOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * List free shipping notifications
   */
  listFreeShippingNotifications(): FreeShippingNotification[] {
    return Array.from(this.freeShippingNotifications.values());
  }

  /**
   * Send webhook
   */
  private async sendWebhook(url: string, payload: any): Promise<void> {
    // In production, use a proper HTTP client like axios or fetch
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to send webhook to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  private handleWebhookEvent(payload: WebhookPayload): void {
    // Send to all subscribed webhooks
    this.webhooks.forEach((webhook) => {
      if (webhook.active && webhook.events.includes(payload.event)) {
        this.sendWebhook(webhook.url, payload).catch((error) => {
          console.error(`Failed to send webhook ${webhook.id}:`, error);
        });
      }
    });
  }

  /**
   * Start free shipping listeners for all providers
   */
  async startFreeShippingListeners(): Promise<void> {
    const providers = this.providerRegistry.getAll();
    for (const provider of providers) {
      if (
        this.providerRegistry.isInitialized(provider.id) &&
        provider.startFreeShippingListener
      ) {
        await provider.startFreeShippingListener((notification) => {
          this.freeShippingNotifications.set(notification.id, notification);
          this.eventEmitter.emitFreeShippingDetected(notification);
        });
      }
    }
  }
}

