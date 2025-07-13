import Fastify, { FastifyInstance } from 'fastify'; // Type Safety using FastifyInstance
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const app: FastifyInstance = Fastify({ // Type Safety using FastifyInstance
  logger: true,
});

// Register CORS (adjust origin as needed)
app.register(cors, {
  origin: true, //temp
});

// Security headers
app.register(helmet);

// Sample health check route
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

export default app;
