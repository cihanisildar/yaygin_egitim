export const getBaseUrl = () => {
  // For server-side rendering, prioritize VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For client-side rendering, prioritize NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback for local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Final fallback (should rarely be used)
  return '';
};

export const getApiUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  // If we have a baseUrl, use it; otherwise use relative path
  return baseUrl ? `${baseUrl}${path}` : path;
};

// Helper function to get absolute URL for client-side navigation
export const getAbsoluteUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  // If we have a baseUrl, use it; otherwise use relative path
  return baseUrl ? `${baseUrl}${path}` : path;
}; 