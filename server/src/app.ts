import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const app = Fastify({
  logger: true,
});

// Register CORS (adjust origin as needed)
app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests from any origin for now
    cb(null, true);
  },
});

// Security headers
app.register(helmet);

// Sample health check route
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

export default app;
