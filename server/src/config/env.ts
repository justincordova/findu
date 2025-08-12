import dotenv from 'dotenv';

dotenv.config();

// ----- Server -----
export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// ----- App Info -----
export const APP_NAME = process.env.APP_NAME || 'FindU';

// ----- Supabase -----
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''; // public, safe
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // secret

// ----- Database -----
export const DATABASE_URL = process.env.DATABASE_URL || ''; // secret

// ----- Auth -----
export const JWT_SECRET = process.env.JWT_SECRET || ''; // secret
export const SESSION_SECRET = process.env.SESSION_SECRET || ''; // secret
export const REFRESH_SECRET = process.env.REFRESH_SECRET || ''; // secret

// ----- Email -----
export const EMAIL_SMTP_HOST = process.env.EMAIL_SMTP_HOST || 'smtp.sendgrid.net';
export const EMAIL_SMTP_PORT = Number(process.env.EMAIL_SMTP_PORT) || 587;
export const EMAIL_SMTP_USER = process.env.EMAIL_SMTP_USER || ''; // secret if using non-anon key
export const EMAIL_SMTP_PASS = process.env.EMAIL_SMTP_PASS || ''; // secret
export const EMAIL_FROM = process.env.EMAIL_FROM || 'FindU <findu.team@gmail.com>';

// ----- Stripe -----
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''; // secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''; // secret

// ----- Misc -----
export const CLEANUP_MINUTES = Number(process.env.CLEANUP_MINUTES) || 30;