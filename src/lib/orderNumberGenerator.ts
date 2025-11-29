/**
 * Order Number Generator for Multi-Tenant System
 * Generates organization-specific order and quote numbers
 */

export function getOrgPrefix(subdomain: string): string {
  if (!subdomain || subdomain === 'main') return 'WPW';
  
  // Convert 'vinyl-vixen' → 'VV', 'wrap-kings' → 'WK'
  return subdomain
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3);
}

export function generateQuoteNumber(subdomain: string): string {
  const prefix = getOrgPrefix(subdomain);
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-Q${timestamp}`;
}

export function generateOrderNumber(subdomain: string): string {
  const prefix = getOrgPrefix(subdomain);
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export function isInternalOrg(subdomain: string): boolean {
  return !subdomain || subdomain === 'main';
}

export function isWPWOrg(subdomain: string): boolean {
  return isInternalOrg(subdomain);
}
