// apps/desktop/src/renderer/lib/environment.ts

/**
 * Detect the current runtime environment
 */

// Define types for window extensions
interface AccomplishShell {
  isElectron: boolean;
  version: string;
  platform: string;
}

declare global {
  interface Window {
    accomplishShell?: AccomplishShell;
    accomplish?: any; // Full type defined in accomplish.ts
  }
}

export function isElectron(): boolean {
  // Check for Electron-specific window.accomplishShell marker
  return typeof window !== 'undefined' && 
         window.accomplishShell !== undefined && 
         window.accomplishShell.isElectron === true;
}

/**
 * Detect if running in a browser
 */
export function isBrowser(): boolean {
  return !isElectron();
}

/**
 * Get the runtime mode
 */
export function getRuntimeMode(): 'electron' | 'browser' {
  return isElectron() ? 'electron' : 'browser';
}

/**
 * Get the API base URL for browser mode
 */
export function getApiBaseUrl(): string {
  if (isElectron()) {
    throw new Error('getApiBaseUrl should not be called in Electron mode');
  }
  
  // Allow override via environment variable or use default
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
}

/**
 * Get the WebSocket URL for browser mode
 */
export function getWebSocketUrl(): string {
  if (isElectron()) {
    throw new Error('getWebSocketUrl should not be called in Electron mode');
  }
  
  // Allow override via environment variable or use default
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
}
