// Core/Framework Imports
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Middleware & Security (add more config later)
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Custom Middleware
import { injectSupabase } from './middleware/injectSupabase';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

// Route Imports
import userRoutes from './routes/users';


const app = express();

// Built-in Middleware
app.use(express.json());

// Third-party Middleware
// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'] // Replace with production domain later e.g.['https://findu.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use(limiter);

// Custom Middleware
app.use(injectSupabase);

// Routes
app.use('/api/users', userRoutes);

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Used for testing the errorHandler
if (process.env.NODE_ENV !== 'production') {
  app.get('/error-test', (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error('Test error')); // This will invoke your errorHandler
  });
}

app.use(notFoundHandler);  // 404 handler
app.use(errorHandler);     // global error handler


export default app;
