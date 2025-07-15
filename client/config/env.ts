import Constants from 'expo-constants';

interface EnvConfig {
  API_BASE_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GOOGLE_OAUTH_CLIENT_ID: string;
  IS_DEV: boolean;
  APP_VERSION: string;
}

export const ENV: EnvConfig = {
  API_BASE_URL: Constants.expoConfig?.extra?.API_BASE_URL || '',
  STRIPE_PUBLISHABLE_KEY: Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || '',
  SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '',
  GOOGLE_OAUTH_CLIENT_ID: Constants.expoConfig?.extra?.GOOGLE_OAUTH_CLIENT_ID || '',
  IS_DEV: __DEV__,
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
};