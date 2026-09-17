/**
 * Application Environment Configuration
 * 
 * Centralized module for accessing environment variables across the app.
 * Can be imported into any component or service:
 * `import { env } from '../config/env';`
 */

export const env = {
  // Firebase Configuration (Public client identifiers)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  },

  // ElevenLabs Voice Widget Configuration (Public Agent ID only)
  elevenLabs: {
    agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || '',
  },

  // AWS Infrastructure Endpoints (Public API Gateway)
  aws: {
    httpEndpoint: import.meta.env.VITE_AWS_HTTP_ENDPOINT || '',
    wsEndpoint: import.meta.env.VITE_AWS_WS_ENDPOINT || '',
  },

  // Backend API Base URL (empty string = relative /api for local proxy or Vercel)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};

export default env;
