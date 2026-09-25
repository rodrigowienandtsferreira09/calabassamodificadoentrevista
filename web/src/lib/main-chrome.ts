export function hideMainSiteChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/buyer/') ||
    pathname.startsWith('/admin/')
  );
}
