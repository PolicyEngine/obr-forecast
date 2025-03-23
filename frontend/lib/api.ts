// Function to build API endpoint URLs
export const buildApiUrl = (endpoint: string): string => {
  // Ensure the endpoint has a leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // For the single-app Vercel deployment, all API routes have the /api prefix
  return `/api${cleanEndpoint}`;
};