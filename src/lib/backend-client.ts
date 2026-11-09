import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const DEVPORTAL_TOKEN = process.env.DEVPORTAL_API_TOKEN || '';

export async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Ensure trailing slash for router root /api/media to avoid 301 redirects
  if (normalizedPath === '/api/media' || normalizedPath.startsWith('/api/media?')) {
    normalizedPath = normalizedPath.replace('/api/media', '/api/media/');
  }

  const url = `${BACKEND_URL}${normalizedPath}`;
  const headers = new Headers(options.headers || {});


  // Try to forward session cookies from the incoming browser request
  let hasSessionCookie = false;
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    const cmsSession = cookieStore.get('cms_session')?.value;
    const cookieParts: string[] = [];
    if (adminSession) cookieParts.push(`admin_session=${adminSession}`);
    if (cmsSession) cookieParts.push(`cms_session=${cmsSession}`);

    if (cookieParts.length > 0) {
      hasSessionCookie = true;
      if (!headers.has('Cookie')) {
        headers.set('Cookie', cookieParts.join('; '));
      }
    }
  } catch {
    // cookies() unavailable outside request context (e.g. build time)
  }

  // Supply the bearer token only for server-to-server calls where no session
  // cookie is present. When a real admin_session cookie exists, Django
  // authenticates through that instead, keeping the token out of the wire.
  if (!hasSessionCookie && !headers.has('Authorization') && DEVPORTAL_TOKEN) {
    headers.set('Authorization', `Bearer ${DEVPORTAL_TOKEN}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
