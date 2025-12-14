import { ProviderId } from '@oneship/core';

/**
 * Workflow step definition
 */
export interface WorkflowStepDefinition {
  id: string;
  name: string;
  type: 'create_order' | 'query_order' | 'check_free_shipping' | 'webhook' | 'delay' | 'condition';
  provider?: ProviderId;
  config?: Record<string, any>;
  onSuccess?: string; // Next step ID on success
  onFailure?: string; // Next step ID on failure
  retry?: {
    maxAttempts: number;
    delay: number; // in milliseconds
  };
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStepDefinition[];
  trigger: 'manual' | 'order_created' | 'order_updated' | 'free_shipping_detected';
}

/**
 * Default workflow for creating shipping order
 */
export const DEFAULT_CREATE_ORDER_WORKFLOW: WorkflowDefinition = {
  id: 'default-create-order',
  name: 'Default Create Order Workflow',
  description: 'Standard workflow for creating a shipping order',
  trigger: 'manual',
  steps: [
    {
      id: 'step-1',
      name: 'Create Order',
      type: 'create_order',
      config: {},
    },
    {
      id: 'step-2',
      name: 'Send Webhook',
      type: 'webhook',
      config: {
        event: 'order.created',
      },
      onSuccess: undefined,
      onFailure: 'step-3',
    },
    {
      id: 'step-3',
      name: 'Handle Failure',
      type: 'webhook',
      config: {
        event: 'order.failed',
      },
    },
  ],
};

/**
 * Default workflow for checking free shipping
 */
export const DEFAULT_FREE_SHIPPING_WORKFLOW: WorkflowDefinition = {
  id: 'default-free-shipping',
  name: 'Default Free Shipping Check Workflow',
  description: 'Workflow for checking and notifying about free shipping',
  trigger: 'free_shipping_detected',
  steps: [
    {
      id: 'step-1',
      name: 'Check Free Shipping',
      type: 'check_free_shipping',
      config: {},
    },
    {
      id: 'step-2',
      name: 'Notify Webhook',
      type: 'webhook',
      config: {
        event: 'free_shipping.detected',
      },
    },
  ],
};

