/**
 * Application Environment Configuration
 * 
 * Centralized module for accessing environment variables across the app.
 * Can be imported into any component or service:
 * `import { env } from '../config/env';`
 */

const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

export const env = {
  // Firebase Configuration (Public client identifiers)
  firebase: {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
    measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
  },

  // ElevenLabs Voice Widget Configuration (Public Agent ID only)
  elevenLabs: {
    agentId: metaEnv.VITE_ELEVENLABS_AGENT_ID || '',
  },

  // AWS Infrastructure Endpoints (Public API Gateway)
  aws: {
    httpEndpoint: metaEnv.VITE_AWS_HTTP_ENDPOINT || '',
    wsEndpoint: metaEnv.VITE_AWS_WS_ENDPOINT || '',
  },

  // Backend API Base URL (empty string = relative /api for local proxy or Vercel)
  apiBaseUrl: metaEnv.VITE_API_BASE_URL || '',

  // Onboarding / Landing website URL
  onboardingUrl: metaEnv.VITE_ONBOARDING_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5174' : 'https://arca-onboarding-six.vercel.app'),
};

export default env;
