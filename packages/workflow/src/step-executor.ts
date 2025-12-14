import {
  WorkflowStep,
  WorkflowStepStatus,
  CreateOrderRequest,
  QueryOrderRequest,
  IProvider,
  FreeShippingNotification,
} from '@oneship/core';
import { WorkflowStepDefinition } from './workflow-definition';

/**
 * Context passed to step executors
 */
export interface StepExecutionContext {
  orderId?: string;
  provider?: string;
  input?: Record<string, any>;
  previousSteps?: WorkflowStep[];
  [key: string]: any;
}

/**
 * Step executor interface
 */
export interface IStepExecutor {
  execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }>;
}

/**
 * Create order step executor
 */
export class CreateOrderStepExecutor implements IStepExecutor {
  async execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }> {
    const providerId = step.provider || context.provider;
    if (!providerId) {
      throw new Error('Provider is required for create_order step');
    }

    const provider = providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const request: CreateOrderRequest = {
      provider: providerId,
      from: context.input?.from,
      to: context.input?.to,
      items: context.input?.items,
      metadata: context.input?.metadata,
    };

    const response = await provider.createOrder(request);

    return {
      output: {
        order: response.order,
        trackingNumber: response.trackingNumber,
        estimatedDelivery: response.estimatedDelivery,
      },
      nextStepId: step.onSuccess,
    };
  }
}

/**
 * Query order step executor
 */
export class QueryOrderStepExecutor implements IStepExecutor {
  async execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }> {
    const providerId = step.provider || context.provider;
    if (!providerId) {
      throw new Error('Provider is required for query_order step');
    }

    if (!context.orderId) {
      throw new Error('Order ID is required for query_order step');
    }

    const provider = providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const request: QueryOrderRequest = {
      orderId: context.orderId,
      provider: providerId,
    };

    const response = await provider.queryOrder(request);

    return {
      output: {
        order: response.order,
        trackingEvents: response.trackingEvents,
      },
      nextStepId: step.onSuccess,
    };
  }
}

/**
 * Check free shipping step executor
 */
export class CheckFreeShippingStepExecutor implements IStepExecutor {
  async execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }> {
    const providerId = step.provider || context.provider;
    if (!providerId) {
      throw new Error('Provider is required for check_free_shipping step');
    }

    if (!context.orderId) {
      throw new Error('Order ID is required for check_free_shipping step');
    }

    const provider = providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    if (!provider.checkFreeShipping) {
      return {
        output: { notification: null },
        nextStepId: step.onFailure,
      };
    }

    const notification = await provider.checkFreeShipping(context.orderId);

    return {
      output: { notification },
      nextStepId: notification ? step.onSuccess : step.onFailure,
    };
  }
}

/**
 * Webhook step executor
 */
export class WebhookStepExecutor implements IStepExecutor {
  private webhookCaller: (url: string, payload: any) => Promise<void>;

  constructor(webhookCaller: (url: string, payload: any) => Promise<void>) {
    this.webhookCaller = webhookCaller;
  }

  async execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }> {
    const webhookUrl = step.config?.url || context.input?.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook URL is required for webhook step');
    }

    const payload = {
      event: step.config?.event,
      data: context.input,
      orderId: context.orderId,
      provider: context.provider,
      timestamp: new Date(),
    };

    try {
      await this.webhookCaller(webhookUrl, payload);
      return {
        output: { success: true },
        nextStepId: step.onSuccess,
      };
    } catch (error) {
      return {
        output: { success: false, error: (error as Error).message },
        nextStepId: step.onFailure,
      };
    }
  }
}

/**
 * Delay step executor
 */
export class DelayStepExecutor implements IStepExecutor {
  async execute(
    step: WorkflowStepDefinition,
    context: StepExecutionContext,
    providers: Map<string, IProvider>
  ): Promise<{ output?: Record<string, any>; nextStepId?: string }> {
    const delay = step.config?.delay || 1000; // Default 1 second

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      output: { delayed: delay },
      nextStepId: step.onSuccess,
    };
  }
}

