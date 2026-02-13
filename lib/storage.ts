import type { TaxFiling } from '@/types/tax-filing';
import type { StoredUser } from '@/types/auth';

const STORAGE_KEYS = {
  USERS: 'taxxon_users',
  CURRENT_USER: 'taxxon_current_user',
  TAX_FILINGS: 'taxxon_filings',
  CURRENT_FILING: 'taxxon_current_filing',
} as const;

// User storage
export function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Tax filing storage
export function getStoredFilings(): Record<string, TaxFiling[]> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.TAX_FILINGS);
  return data ? JSON.parse(data) : {};
}

export function saveStoredFilings(filings: Record<string, TaxFiling[]>): void {
  localStorage.setItem(STORAGE_KEYS.TAX_FILINGS, JSON.stringify(filings));
}

export function getUserFilings(userId: string): TaxFiling[] {
  const allFilings = getStoredFilings();
  return allFilings[userId] || [];
}

export function saveUserFilings(userId: string, filings: TaxFiling[]): void {
  const allFilings = getStoredFilings();
  allFilings[userId] = filings;
  saveStoredFilings(allFilings);
}

export function getCurrentFilingId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_FILING);
}

export function setCurrentFilingId(filingId: string | null): void {
  if (filingId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FILING, filingId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_FILING);
  }
}

// Simple password hashing (for demo purposes - use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
