import {
  CreateOrderRequest,
  QueryOrderRequest,
  ProviderId,
  WebhookEventType,
} from '@oneship/core';

/**
 * API request/response types
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateOrderApiRequest extends CreateOrderRequest {
  webhookUrl?: string;
}

export interface QueryOrderApiRequest {
  orderId: string;
}

export interface WebhookSubscriptionRequest {
  url: string;
  events: WebhookEventType[];
  secret?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  createdAt: Date;
  active: boolean;
}

export interface ProviderConfigRequest {
  provider: ProviderId;
  apiKey: string;
  apiSecret?: string;
  apiUrl?: string;
  [key: string]: any;
}

