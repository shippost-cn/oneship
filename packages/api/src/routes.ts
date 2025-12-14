/**
 * API route definitions
 */

export const API_ROUTES = {
  // Orders
  CREATE_ORDER: '/v1/orders',
  GET_ORDER: '/v1/orders/:orderId',
  QUERY_ORDER: '/v1/orders/:orderId/query',
  CANCEL_ORDER: '/v1/orders/:orderId/cancel',

  // Providers
  LIST_PROVIDERS: '/v1/providers',
  CONFIGURE_PROVIDER: '/v1/providers/:providerId/configure',

  // Webhooks
  CREATE_WEBHOOK: '/v1/webhooks',
  LIST_WEBHOOKS: '/v1/webhooks',
  GET_WEBHOOK: '/v1/webhooks/:webhookId',
  UPDATE_WEBHOOK: '/v1/webhooks/:webhookId',
  DELETE_WEBHOOK: '/v1/webhooks/:webhookId',

  // Free Shipping
  CHECK_FREE_SHIPPING: '/v1/orders/:orderId/free-shipping',
  LIST_FREE_SHIPPING: '/v1/free-shipping',

  // Health
  HEALTH: '/health',
} as const;

