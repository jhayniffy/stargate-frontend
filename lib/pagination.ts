/** Builds a query string for page-based pagination endpoints. */
export function buildPageQuery(params: { page?: number; limit?: number; [key: string]: string | number | undefined }): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

/** Returns the next page number, or null when all items have been loaded. */
export function nextPage(current: number, limit: number, total: number): number | null {
  return current * limit < total ? current + 1 : null;
}

/** Returns true when a list response contains no items. */
export function isEmpty(total: number): boolean {
  return total === 0;
}
