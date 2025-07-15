export const SCREEN_NAMES = {
    LOGIN: 'Login',
    REGISTER: 'Register',
    HOME: 'Home',
    PROFILE: 'Profile',
    CHAT: 'Chat',
    MATCHES: 'Matches',
    SETTINGS: 'Settings',
  } as const;
  
  export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];
  
  export const API_ENDPOINTS = {
    AUTH: '/auth',
    USERS: '/users',
    MATCHES: '/matches',
    MESSAGES: '/messages',
    PAYMENTS: '/payments',
  } as const;
  
  export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
  
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    PREFERENCES: 'preferences',
  } as const;
  
  export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
  
  export const LIMITS = {
    MAX_PHOTOS: 6,
    MAX_BIO_LENGTH: 500,
    SWIPE_DISTANCE: 100,
    MAX_MESSAGE_LENGTH: 1000,
  } as const;
  
  export const DATING_CONSTANTS = {
    MIN_AGE: 18,
    MAX_AGE: 99,
    MAX_DISTANCE: 100,
    SUPER_LIKES_PER_DAY: 5,
  } as const;