const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const DEVPORTAL_TOKEN = process.env.DEVPORTAL_API_TOKEN || 'travingat-devportal-dev-token';

export async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${DEVPORTAL_TOKEN}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

