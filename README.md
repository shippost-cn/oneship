# OneShip

Headless shipping integration platform - Integrate multiple courier APIs with workflow engine.

## Features

- 🚚 **Multi-Courier Support**: Integrate with multiple courier companies (SF Express, YTO, ZTO, etc.)
- 🔄 **Workflow Engine**: Asynchronous workflow processing for shipping operations
- 📡 **Webhook Support**: Real-time callbacks for shipping status updates and free shipping notifications
- 🔌 **Provider Pattern**: Extensible provider system for easy courier integration
- 🎯 **Headless API**: No UI, all operations through REST API
- 📦 **SDK Support**: Easy integration with Node.js SDK (more languages coming soon)

## Architecture

```
┌─────────────┐
│   Client    │
│   (SDK)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Server │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Workflow   │────▶│   Provider   │
│   Engine    │     │   System     │
└──────┬──────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│  Webhook    │
│   Service   │
└─────────────┘
```

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

### Using SDK

```typescript
import { OneShip } from '@oneship/sdk';

const client = new OneShip({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.oneship.com'
});

// Create shipping order
const order = await client.orders.create({
  provider: 'sf-express',
  from: { name: 'Sender', phone: '13800138000', address: '...' },
  to: { name: 'Receiver', phone: '13900139000', address: '...' },
  items: [{ name: 'Item', quantity: 1, weight: 1.5 }]
});

// Listen for free shipping notifications
await client.webhooks.subscribe({
  url: 'https://your-app.com/webhook',
  events: ['free_shipping.detected']
});
```

### Using REST API

```bash
# Create order
curl -X POST https://api.oneship.com/v1/orders \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sf-express",
    "from": {...},
    "to": {...},
    "items": [...]
  }'

# Query order status
curl https://api.oneship.com/v1/orders/{orderId} \
  -H "Authorization: Bearer your-api-key"
```

## Providers

Currently supported courier providers:

- **SF Express (顺丰)** - `sf-express`
- **YTO (圆通)** - `yto`
- **ZTO (中通)** - `zto`
- **STO (申通)** - `sto`
- **Yunda (韵达)** - `yunda`

More providers coming soon...

## License

MIT

