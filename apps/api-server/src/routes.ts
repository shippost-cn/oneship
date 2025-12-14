import { Router, Request, Response } from 'express';
import { OneShipService } from './service';
import { API_ROUTES } from '@oneship/api';
import {
  CreateOrderApiRequest,
  QueryOrderApiRequest,
  WebhookSubscriptionRequest,
  ProviderConfigRequest,
  ApiResponse,
} from '@oneship/api';

export function createRouter(service: OneShipService): Router {
  const router = Router();

  // Middleware for API key authentication (simplified)
  const authenticate = (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required',
      });
    }
    // In production, validate API key against database
    next();
  };

  // Orders
  router.post(API_ROUTES.CREATE_ORDER, authenticate, async (req: Request, res: Response) => {
    try {
      const request = req.body as CreateOrderApiRequest;
      const { webhookUrl, ...orderRequest } = request;
      const order = await service.createOrder(orderRequest, webhookUrl);
      res.json({
        success: true,
        data: order,
      } as ApiResponse<typeof order>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  router.get(API_ROUTES.GET_ORDER, authenticate, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = service.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }
      res.json({
        success: true,
        data: order,
      } as ApiResponse<typeof order>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  router.post(API_ROUTES.QUERY_ORDER, authenticate, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await service.queryOrder(orderId);
      res.json({
        success: true,
        data: order,
      } as ApiResponse<typeof order>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  router.post(API_ROUTES.CANCEL_ORDER, authenticate, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      await service.cancelOrder(orderId);
      res.json({
        success: true,
        message: 'Order cancelled',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  // Providers
  router.get(API_ROUTES.LIST_PROVIDERS, authenticate, (req: Request, res: Response) => {
    // Return list of available providers
    res.json({
      success: true,
      data: [
        { id: 'sf-express', name: 'SF Express (顺丰)' },
        { id: 'yto', name: 'YTO Express (圆通)' },
        { id: 'zto', name: 'ZTO Express (中通)' },
        { id: 'sto', name: 'STO Express (申通)' },
        { id: 'yunda', name: 'Yunda Express (韵达)' },
      ],
    });
  });

  router.post(
    '/v1/providers/:providerId/configure',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const config = req.body as ProviderConfigRequest;
        await service.configureProvider(providerId, config);
        res.json({
          success: true,
          message: 'Provider configured',
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: (error as Error).message,
        });
      }
    }
  );

  // Webhooks
  router.post(API_ROUTES.CREATE_WEBHOOK, authenticate, async (req: Request, res: Response) => {
    try {
      const request = req.body as WebhookSubscriptionRequest;
      const subscription = await service.subscribeWebhook(request.url, request.events, request.secret);
      res.json({
        success: true,
        data: subscription,
      } as ApiResponse<typeof subscription>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  router.get(API_ROUTES.LIST_WEBHOOKS, authenticate, (req: Request, res: Response) => {
    const webhooks = service.listWebhooks();
    res.json({
      success: true,
      data: webhooks,
    });
  });

  router.get(API_ROUTES.GET_WEBHOOK, authenticate, (req: Request, res: Response) => {
    const { webhookId } = req.params;
    const webhook = service.getWebhook(webhookId);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }
    res.json({
      success: true,
      data: webhook,
    });
  });

  router.delete(API_ROUTES.DELETE_WEBHOOK, authenticate, (req: Request, res: Response) => {
    const { webhookId } = req.params;
    service.deleteWebhook(webhookId);
    res.json({
      success: true,
      message: 'Webhook deleted',
    });
  });

  // Free Shipping
  router.post(
    '/v1/orders/:orderId/free-shipping',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { orderId } = req.params;
        const notification = await service.checkFreeShipping(orderId);
        res.json({
          success: true,
          data: notification,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: (error as Error).message,
        });
      }
    }
  );

  router.get(API_ROUTES.LIST_FREE_SHIPPING, authenticate, (req: Request, res: Response) => {
    const notifications = service.listFreeShippingNotifications();
    res.json({
      success: true,
      data: notifications,
    });
  });

  return router;
}

