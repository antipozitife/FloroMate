declare const __API_BASE_URL__: string;
declare const __DEMO_MODE__: boolean;

/**
 * In development, an empty base URL uses Webpack Dev Server's /api proxy.
 * In production, set API_BASE_URL in Vercel before the Webpack build.
 */
export const API_BASE_URL =
  typeof __API_BASE_URL__ === 'string' ? __API_BASE_URL__ : '';

export const DEMO_MODE =
  typeof __DEMO_MODE__ === 'boolean' ? __DEMO_MODE__ : false;

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
