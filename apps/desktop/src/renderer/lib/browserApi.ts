// apps/desktop/src/renderer/lib/browserApi.ts

import { getApiBaseUrl, getWebSocketUrl } from './environment';

/**
 * Browser-compatible API client using fetch and WebSocket
 * Mimics the Electron IPC API
 */

class BrowserApiClient {
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.baseUrl = getApiBaseUrl();
    this.wsUrl = getWebSocketUrl();
  }

  /**
   * Connect to WebSocket for real-time events
   */
  connectWebSocket() {
    if (this.ws) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('[BrowserApi] WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { channel, data } = message;
        
        const listeners = this.eventListeners.get(channel);
        if (listeners) {
          listeners.forEach(listener => listener(data));
        }
      } catch (error) {
        console.error('[BrowserApi] Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[BrowserApi] WebSocket disconnected, reconnecting...');
      this.ws = null;
      setTimeout(() => this.connectWebSocket(), 1000);
    };

    this.ws.onerror = (error) => {
      console.error('[BrowserApi] WebSocket error:', error);
    };
  }

  /**
   * Subscribe to events
   */
  on(channel: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(channel)) {
      this.eventListeners.set(channel, new Set());
    }
    this.eventListeners.get(channel)!.add(callback);

    // Connect WebSocket if not already connected
    this.connectWebSocket();

    // Return cleanup function
    return () => {
      const listeners = this.eventListeners.get(channel);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Make HTTP request
   */
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // App info
  async getVersion(): Promise<string> {
    const { version } = await this.request('/api/app/version');
    return version;
  }

  async getPlatform(): Promise<string> {
    const { platform } = await this.request('/api/app/platform');
    return platform;
  }

  // API Keys
  async hasAnyApiKey(): Promise<boolean> {
    const { exists } = await this.request('/api/api-keys/has-any');
    return exists;
  }

  async getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>> {
    return this.request('/api/api-keys/all');
  }

  async hasApiKey(provider: string): Promise<boolean> {
    const { exists } = await this.request(`/api/api-keys/${provider}/exists`);
    return exists;
  }

  async getApiKey(provider: string): Promise<string | null> {
    const { key } = await this.request(`/api/api-keys/${provider}`);
    return key;
  }

  async setApiKey(provider: string, key: string, label?: string): Promise<void> {
    await this.request(`/api/api-keys/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ key, label }),
    });
  }

  async removeApiKey(provider: string): Promise<void> {
    await this.request(`/api/api-keys/${provider}`, {
      method: 'DELETE',
    });
  }

  async validateApiKey(provider: string, key: string): Promise<{ valid: boolean; error?: string }> {
    return this.request(`/api/api-keys/${provider}/validate`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  // Shell operations (not available in browser)
  async openExternal(url: string): Promise<void> {
    window.open(url, '_blank');
  }

  // Onboarding
  async getOnboardingComplete(): Promise<boolean> {
    // For browser mode, check localStorage for now
    return localStorage.getItem('onboardingComplete') === 'true';
  }

  async setOnboardingComplete(complete: boolean): Promise<void> {
    localStorage.setItem('onboardingComplete', complete.toString());
  }

  // Tasks (placeholder - will implement later)
  async startTask(config: { description: string }): Promise<any> {
    throw new Error('Task execution not yet implemented in browser mode');
  }

  async cancelTask(taskId: string): Promise<void> {
    throw new Error('Task operations not yet implemented in browser mode');
  }

  async interruptTask(taskId: string): Promise<void> {
    throw new Error('Task operations not yet implemented in browser mode');
  }

  async getTask(taskId: string): Promise<any> {
    throw new Error('Task operations not yet implemented in browser mode');
  }

  async listTasks(): Promise<any[]> {
    return [];
  }

  async deleteTask(taskId: string): Promise<void> {
    throw new Error('Task operations not yet implemented in browser mode');
  }

  async clearTaskHistory(): Promise<void> {
    throw new Error('Task operations not yet implemented in browser mode');
  }
}

export const browserApi = new BrowserApiClient();
