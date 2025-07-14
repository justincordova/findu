// Core/Framework Imports
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Middleware & Security
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Custom Middleware
import { injectSupabase } from './middleware/injectSupabase';

// Route Imports
import userRoutes from './routes/users';


const app = express();

// Built-in Middleware
app.use(express.json());

// Third-party Middleware
app.use(cors());
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

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
