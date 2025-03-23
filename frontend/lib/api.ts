// Function to build API endpoint URLs
export const buildApiUrl = (endpoint: string): string => {
  // Ensure the endpoint has a leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Use localhost:8000 API if NEXT_DEV is true
  const isDevMode = process.env.NEXT_PUBLIC_NEXT_DEV === 'true';
  const baseUrl = isDevMode ? 'http://localhost:8000' : '';
  
  // For the single-app Vercel deployment, all API routes have the /api prefix
  return `${baseUrl}/api${cleanEndpoint}`;
};