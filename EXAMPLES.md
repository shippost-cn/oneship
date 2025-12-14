# OneShip Examples

## Using the SDK

### Basic Usage

```typescript
import { OneShip } from '@oneship/sdk';

// Initialize client
const client = new OneShip({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.oneship.com', // or 'http://localhost:3000' for local
});

// Create a shipping order
const order = await client.orders.create({
  provider: 'sf-express',
  from: {
    name: '张三',
    phone: '13800138000',
    address: '上海市浦东新区XX路XX号',
    city: '上海',
    province: '上海',
  },
  to: {
    name: '李四',
    phone: '13900139000',
    address: '北京市朝阳区XX街XX号',
    city: '北京',
    province: '北京',
  },
  items: [
    {
      name: '商品A',
      quantity: 1,
      weight: 1.5,
      value: 100,
      description: '测试商品',
    },
  ],
  metadata: {
    orderId: 'your-order-id',
    customerId: 'customer-123',
  },
});

console.log('Order created:', order.id);
console.log('Tracking number:', order.orderNumber);

// Query order status
const updatedOrder = await client.orders.query(order.id);
console.log('Order status:', updatedOrder.status);

// Check for free shipping
const freeShipping = await client.freeShipping.check(order.id);
if (freeShipping) {
  console.log('Free shipping detected!', freeShipping);
}

// Subscribe to webhooks
const webhook = await client.webhooks.subscribe({
  url: 'https://your-app.com/webhook',
  events: [
    'order.created',
    'order.updated',
    'order.delivered',
    'free_shipping.detected',
  ],
  secret: 'your-webhook-secret',
});

console.log('Webhook subscribed:', webhook.id);
```

### Using REST API

#### Create Order

```bash
curl -X POST https://api.oneship.com/v1/orders \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sf-express",
    "from": {
      "name": "张三",
      "phone": "13800138000",
      "address": "上海市浦东新区XX路XX号",
      "city": "上海",
      "province": "上海"
    },
    "to": {
      "name": "李四",
      "phone": "13900139000",
      "address": "北京市朝阳区XX街XX号",
      "city": "北京",
      "province": "北京"
    },
    "items": [
      {
        "name": "商品A",
        "quantity": 1,
        "weight": 1.5,
        "value": 100
      }
    ],
    "metadata": {
      "orderId": "your-order-id"
    },
    "webhookUrl": "https://your-app.com/webhook"
  }'
```

#### Query Order

```bash
curl -X POST https://api.oneship.com/v1/orders/{orderId}/query \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"
```

#### Subscribe to Webhook

```bash
curl -X POST https://api.oneship.com/v1/webhooks \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": [
      "order.created",
      "order.updated",
      "order.delivered",
      "free_shipping.detected"
    ],
    "secret": "your-webhook-secret"
  }'
```

#### Check Free Shipping

```bash
curl -X POST https://api.oneship.com/v1/orders/{orderId}/free-shipping \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"
```

## Webhook Payload Example

When an event occurs, OneShip will send a POST request to your webhook URL:

```json
{
  "event": "order.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "orderId": "order-123",
  "provider": "sf-express",
  "data": {
    "id": "order-123",
    "provider": "sf-express",
    "orderNumber": "SF123456789",
    "status": "created",
    "from": { ... },
    "to": { ... },
    "items": [ ... ],
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

## Provider Configuration

Before using a provider, you need to configure it with API credentials:

```typescript
// Using SDK
await client.providers.configure('sf-express', {
  provider: 'sf-express',
  apiKey: 'your-sf-express-api-key',
  apiSecret: 'your-sf-express-api-secret',
  apiUrl: 'https://api.sf-express.com',
});

// Using REST API
curl -X POST https://api.oneship.com/v1/providers/sf-express/configure \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sf-express",
    "apiKey": "your-sf-express-api-key",
    "apiSecret": "your-sf-express-api-secret",
    "apiUrl": "https://api.sf-express.com"
  }'
```

## Creating Custom Provider

```typescript
import { BaseProvider } from '@oneship/providers';
import {
  ProviderId,
  CreateOrderRequest,
  CreateOrderResponse,
  QueryOrderRequest,
  QueryOrderResponse,
} from '@oneship/core';

export class CustomProvider extends BaseProvider {
  readonly id: ProviderId = 'custom-provider';
  readonly name = 'Custom Courier';

  protected async doCreateOrder(
    request: CreateOrderRequest
  ): Promise<CreateOrderResponse> {
    // Implement your courier API integration
    // ...
  }

  protected async doQueryOrder(
    request: QueryOrderRequest
  ): Promise<QueryOrderResponse> {
    // Implement order query
    // ...
  }

  protected async doCancelOrder(orderId: string): Promise<void> {
    // Implement order cancellation
    // ...
  }

  protected async doCheckFreeShipping(
    orderId: string
  ): Promise<FreeShippingNotification | null> {
    // Implement free shipping check
    // ...
  }
}
```

