/**
 * Shipping order status
 */
export enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Courier provider identifier
 */
export type ProviderId = 
  | 'sf-express'  // 顺丰
  | 'yto'         // 圆通
  | 'zto'         // 中通
  | 'sto'         // 申通
  | 'yunda'       // 韵达
  | string;

/**
 * Address information
 */
export interface Address {
  name: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Shipping item
 */
export interface ShippingItem {
  name: string;
  quantity: number;
  weight: number; // in kg
  value?: number; // in CNY
  description?: string;
}

/**
 * Shipping order
 */
export interface ShippingOrder {
  id: string;
  provider: ProviderId;
  orderNumber?: string; // Provider's order number
  status: OrderStatus;
  from: Address;
  to: Address;
  items: ShippingItem[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Free shipping notification
 */
export interface FreeShippingNotification {
  id: string;
  orderId: string;
  provider: ProviderId;
  detectedAt: Date;
  amount: number; // Free shipping amount
  conditions: string[];
  metadata?: Record<string, any>;
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_DELIVERED = 'order.delivered',
  FREE_SHIPPING_DETECTED = 'free_shipping.detected',
  FREE_SHIPPING_EXPIRED = 'free_shipping.expired',
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: Date;
  data: any;
  orderId?: string;
  provider?: ProviderId;
}

/**
 * Workflow step status
 */
export enum WorkflowStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Workflow execution
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  orderId: string;
  status: WorkflowStepStatus;
  steps: WorkflowStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStepStatus;
  provider?: ProviderId;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

