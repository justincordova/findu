import Fastify, { FastifyInstance } from 'fastify'; // Type Safety using FastifyInstance
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables!');
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create Fastify instance with logger enabled
const app: FastifyInstance = Fastify({
  logger: true,
});

// Register CORS (adjust origin as needed)
app.register(cors, {
  origin: true, // allow all origins (adjust this in production)
});

// Security headers
app.register(helmet);

// Sample health check route
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

export default app;
