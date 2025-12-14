# OneShip Architecture

## Overview

OneShip is a headless shipping integration platform that provides a unified API for integrating with multiple courier companies. It follows a provider-based architecture similar to Novu, with a workflow engine for asynchronous processing.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Node.js    │  │   Python     │  │   REST API   │      │
│  │     SDK      │  │     SDK      │  │   (Direct)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Server Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              REST API Endpoints                        │  │
│  │  - /v1/orders                                          │  │
│  │  - /v1/providers                                       │  │
│  │  - /v1/webhooks                                        │  │
│  │  - /v1/free-shipping                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              OneShipService                           │  │
│  │  - Order Management                                   │  │
│  │  - Provider Registry                                  │  │
│  │  - Webhook Management                                 │  │
│  │  - Event Emitter                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────┐          ┌──────────────────────┐
│   Workflow Engine    │          │  Provider System    │
│                      │          │                      │
│  - Step Executors    │          │  - BaseProvider      │
│  - Workflow Runner   │          │  - SFExpressProvider │
│  - Retry Logic       │          │  - YTOProvider       │
│  - Error Handling    │          │  - ZTOProvider       │
└──────────────────────┘          └──────────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Courier APIs                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   SF     │  │   YTO    │  │   ZTO    │  │   ...    │    │
│  │ Express  │  │ Express  │  │ Express  │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Service                           │
│  - Event Delivery                                            │
│  - Retry Mechanism                                           │
│  - Signature Verification                                    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Core Package (`@oneship/core`)

Defines the fundamental types, interfaces, and event system:

- **Types**: Order status, provider IDs, addresses, items, etc.
- **Interfaces**: `IProvider` interface that all providers must implement
- **Events**: Event emitter for order and free shipping events

### 2. Provider System (`@oneship/providers`)

Provider-based architecture for courier integrations:

- **BaseProvider**: Abstract base class for all providers
- **ProviderRegistry**: Manages provider registration and initialization
- **Provider Implementations**: SF Express, YTO, ZTO, etc.

Each provider implements:
- `createOrder()`: Create shipping order
- `queryOrder()`: Query order status
- `cancelOrder()`: Cancel order
- `checkFreeShipping()`: Check for free shipping opportunities
- `startFreeShippingListener()`: Start listening for free shipping notifications

### 3. Workflow Engine (`@oneship/workflow`)

Asynchronous workflow processing:

- **WorkflowDefinition**: Defines workflow steps and flow
- **WorkflowEngine**: Executes workflows asynchronously
- **StepExecutors**: Execute individual workflow steps
  - `CreateOrderStepExecutor`
  - `QueryOrderStepExecutor`
  - `CheckFreeShippingStepExecutor`
  - `WebhookStepExecutor`
  - `DelayStepExecutor`

Workflow features:
- Step-by-step execution
- Success/failure branching
- Retry logic
- Error handling

### 4. API Server (`@oneship/api-server`)

REST API server built with Express:

- **Routes**: RESTful endpoints for orders, providers, webhooks
- **Service**: Main business logic service
- **Authentication**: API key-based authentication

### 5. SDK (`@oneship/sdk`)

Node.js SDK for easy integration:

- **OneShip Client**: Main client class
- **Sub-clients**: Orders, Webhooks, Providers, FreeShipping
- **Type-safe**: Full TypeScript support

## Data Flow

### Creating an Order

1. Client calls `client.orders.create()`
2. API server receives request and validates
3. Service creates workflow execution
4. Workflow engine executes steps:
   - Create order via provider
   - Send webhook notification
5. Order is stored and events are emitted
6. Response returned to client

### Free Shipping Detection

1. Provider's free shipping listener detects opportunity
2. Notification is created and stored
3. Event is emitted
4. Webhook service sends notification to subscribed webhooks
5. Client receives webhook callback

## Extension Points

### Adding a New Provider

1. Extend `BaseProvider` class
2. Implement required methods
3. Register provider in API server
4. Configure provider with credentials

### Custom Workflow Steps

1. Create a new step executor implementing `IStepExecutor`
2. Register executor in workflow engine
3. Use in workflow definitions

## Design Principles

1. **Headless**: No UI, all operations via API
2. **Provider Pattern**: Extensible provider system
3. **Workflow-Based**: Asynchronous workflow processing
4. **Event-Driven**: Event emitter for notifications
5. **Webhook Support**: Real-time callbacks
6. **Type-Safe**: Full TypeScript support

## Future Enhancements

- Database persistence (PostgreSQL/MongoDB)
- Job queue (Bull/BullMQ)
- Caching layer (Redis)
- Rate limiting
- Webhook signature verification
- More provider implementations
- Python SDK
- Go SDK

