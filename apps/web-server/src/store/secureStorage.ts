// apps/web-server/src/store/secureStorage.ts

import { getDatabase } from './db';

/**
 * Simple API key storage for web server.
 * In a production deployment, you should:
 * 1. Use environment variables for API keys
 * 2. Implement proper user authentication
 * 3. Store encrypted API keys per user in database
 * 4. Use HTTPS only
 * 
 * For now, this stores API keys in the SQLite database with basic encryption.
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'change-me-in-production';

// Simple XOR encryption (NOT secure for production, just for demo)
function simpleEncrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return Buffer.from(result).toString('base64');
}

function simpleDecrypt(encrypted: string): string {
  const text = Buffer.from(encrypted, 'base64').toString();
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return result;
}

/**
 * Store an API key for a provider
 */
export async function storeApiKey(provider: string, key: string, label?: string): Promise<void> {
  const db = getDatabase();
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      encrypted_key TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  const encrypted = simpleEncrypt(key);
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO api_keys (provider, encrypted_key, label, created_at, updated_at)
    VALUES (?, ?, ?, COALESCE((SELECT created_at FROM api_keys WHERE provider = ?), ?), ?)
  `);
  
  stmt.run(provider, encrypted, label || null, provider, now, now);
}

/**
 * Get an API key for a provider
 */
export async function getApiKey(provider: string): Promise<string | null> {
  const db = getDatabase();
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      encrypted_key TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  const stmt = db.prepare('SELECT encrypted_key FROM api_keys WHERE provider = ?');
  const row = stmt.get(provider) as { encrypted_key: string } | undefined;
  
  if (!row) return null;
  
  return simpleDecrypt(row.encrypted_key);
}

/**
 * Delete an API key for a provider
 */
export async function deleteApiKey(provider: string): Promise<void> {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM api_keys WHERE provider = ?');
  stmt.run(provider);
}

/**
 * Get all stored API keys (returns which providers have keys, not the keys themselves)
 */
export async function getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>> {
  const db = getDatabase();
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      encrypted_key TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  const stmt = db.prepare('SELECT provider, encrypted_key FROM api_keys');
  const rows = stmt.all() as Array<{ provider: string; encrypted_key: string }>;
  
  const result: Record<string, { exists: boolean; prefix?: string }> = {};
  
  for (const row of rows) {
    const decrypted = simpleDecrypt(row.encrypted_key);
    result[row.provider] = {
      exists: true,
      prefix: decrypted.substring(0, 8) + '...',
    };
  }
  
  return result;
}

/**
 * Check if any API key exists
 */
export async function hasAnyApiKey(): Promise<boolean> {
  const db = getDatabase();
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      encrypted_key TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  const stmt = db.prepare('SELECT COUNT(*) as count FROM api_keys');
  const row = stmt.get() as { count: number };
  return row.count > 0;
}
