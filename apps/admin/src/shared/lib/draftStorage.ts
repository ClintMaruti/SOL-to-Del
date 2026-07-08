/**
 * Generic localStorage-based draft persistence.
 * Use with any key and typed data; not tied to a specific feature.
 */

export function getDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setDraft<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function clearDraft(key: string): void {
  localStorage.removeItem(key);
}
