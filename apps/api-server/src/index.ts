import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { OneShipService } from './service';
import { createRouter } from './routes';
import {
  SFExpressProvider,
  YTOProvider,
  ZTOProvider,
} from '@oneship/providers';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize service
const service = new OneShipService();

// Register providers
service.registerProvider(new SFExpressProvider());
service.registerProvider(new YTOProvider());
service.registerProvider(new ZTOProvider());

// Start free shipping listeners
service.startFreeShippingListeners().catch((error) => {
  console.error('Failed to start free shipping listeners:', error);
});

// Routes
app.use('/v1', createRouter(service));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(port, () => {
  console.log(`OneShip API Server running on port ${port}`);
});

