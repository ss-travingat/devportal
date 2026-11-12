/** Ends the admin session and sends the user to the login page. Shared by the sidebar and the mobile home bar. */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/admin/session', { method: 'DELETE' });
  } catch {
    // proceed: clearing the cookie client-side and redirecting still signs the user out locally
  } finally {
    try {
      document.cookie =
        'admin_session=; Path=/; Domain=.travingat.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch {}
    window.location.replace('/login?logout=1');
  }
}
