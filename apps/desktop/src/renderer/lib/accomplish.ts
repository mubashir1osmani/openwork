/**
 * Accomplish API - Interface to both Electron and Browser modes
 *
 * This module provides type-safe access to the accomplish API
 * which can work in both Electron (via IPC) and Browser (via HTTP/WS) modes.
 */

import type {
  Task,
  TaskConfig,
  TaskUpdateEvent,
  TaskStatus,
  PermissionRequest,
  PermissionResponse,
  TaskProgress,
  ApiKeyConfig,
  TaskMessage,
  BedrockCredentials,
  ProviderSettings,
  ProviderId,
  ConnectedProvider,
} from '@accomplish/shared';
import { isElectron } from './environment';
import { browserApi } from './browserApi';

// Define the API interface
interface AccomplishAPI {
  // App info
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;

  // Shell
  openExternal(url: string): Promise<void>;

  // Task operations
  startTask(config: TaskConfig): Promise<Task>;
  cancelTask(taskId: string): Promise<void>;
  interruptTask(taskId: string): Promise<void>;
  getTask(taskId: string): Promise<Task | null>;
  listTasks(): Promise<Task[]>;
  deleteTask(taskId: string): Promise<void>;
  clearTaskHistory(): Promise<void>;

  // Permission responses
  respondToPermission(response: PermissionResponse): Promise<void>;

  // Session management
  resumeSession(sessionId: string, prompt: string, taskId?: string): Promise<Task>;

  // Settings
  getApiKeys(): Promise<ApiKeyConfig[]>;
  addApiKey(provider: 'anthropic' | 'openai' | 'openrouter' | 'google' | 'xai' | 'deepseek' | 'zai' | 'azure-foundry' | 'custom' | 'bedrock' | 'litellm', key: string, label?: string): Promise<ApiKeyConfig>;
  removeApiKey(id: string): Promise<void>;
  getDebugMode(): Promise<boolean>;
  setDebugMode(enabled: boolean): Promise<void>;
  getAppSettings(): Promise<{ debugMode: boolean; onboardingComplete: boolean }>;

  // API Key management
  hasApiKey(): Promise<boolean>;
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  validateApiKey(key: string): Promise<{ valid: boolean; error?: string }>;
  validateApiKeyForProvider(provider: string, key: string, options?: Record<string, any>): Promise<{ valid: boolean; error?: string }>;
  clearApiKey(): Promise<void>;

  // Multi-provider API keys
  getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>>;
  hasAnyApiKey(): Promise<boolean>;

  // Onboarding
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(complete: boolean): Promise<void>;

  // Claude CLI
  checkClaudeCli(): Promise<{ installed: boolean; version: string | null; installCommand: string }>;
  getClaudeVersion(): Promise<string | null>;

  // Model selection
  getSelectedModel(): Promise<{ provider: string; model: string; baseUrl?: string; deploymentName?: string } | null>;
  setSelectedModel(model: { provider: string; model: string; baseUrl?: string; deploymentName?: string }): Promise<void>;

  // Ollama configuration
  testOllamaConnection(url: string): Promise<{
    success: boolean;
    models?: Array<{ id: string; displayName: string; size: number }>;
    error?: string;
  }>;
  getOllamaConfig(): Promise<{ baseUrl: string; enabled: boolean; lastValidated?: number; models?: Array<{ id: string; displayName: string; size: number }> } | null>;
  setOllamaConfig(config: { baseUrl: string; enabled: boolean; lastValidated?: number; models?: Array<{ id: string; displayName: string; size: number }> } | null): Promise<void>;

  // Azure Foundry configuration
  getAzureFoundryConfig(): Promise<{ baseUrl: string; deploymentName: string; authType: 'api-key' | 'entra-id'; enabled: boolean; lastValidated?: number } | null>;
  setAzureFoundryConfig(config: { baseUrl: string; deploymentName: string; authType: 'api-key' | 'entra-id'; enabled: boolean; lastValidated?: number } | null): Promise<void>;
  testAzureFoundryConnection(config: { endpoint: string; deploymentName: string; authType: 'api-key' | 'entra-id'; apiKey?: string }): Promise<{ success: boolean; error?: string }>;
  saveAzureFoundryConfig(config: { endpoint: string; deploymentName: string; authType: 'api-key' | 'entra-id'; apiKey?: string }): Promise<void>;

  // OpenRouter configuration
  fetchOpenRouterModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;

  // LiteLLM configuration
  testLiteLLMConnection(url: string, apiKey?: string): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;
  fetchLiteLLMModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;
  getLiteLLMConfig(): Promise<{ baseUrl: string; enabled: boolean; lastValidated?: number; models?: Array<{ id: string; name: string; provider: string; contextLength: number }> } | null>;
  setLiteLLMConfig(config: { baseUrl: string; enabled: boolean; lastValidated?: number; models?: Array<{ id: string; name: string; provider: string; contextLength: number }> } | null): Promise<void>;

  // Bedrock configuration
  validateBedrockCredentials(credentials: string): Promise<{ valid: boolean; error?: string }>;
  saveBedrockCredentials(credentials: string): Promise<ApiKeyConfig>;
  getBedrockCredentials(): Promise<BedrockCredentials | null>;
  fetchBedrockModels(credentials: string): Promise<{ success: boolean; models: Array<{ id: string; name: string; provider: string }>; error?: string }>;

  // E2E Testing
  isE2EMode(): Promise<boolean>;

  // Provider Settings API
  getProviderSettings(): Promise<ProviderSettings>;
  setActiveProvider(providerId: ProviderId | null): Promise<void>;
  getConnectedProvider(providerId: ProviderId): Promise<ConnectedProvider | null>;
  setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): Promise<void>;
  removeConnectedProvider(providerId: ProviderId): Promise<void>;
  updateProviderModel(providerId: ProviderId, modelId: string | null): Promise<void>;
  setProviderDebugMode(enabled: boolean): Promise<void>;
  getProviderDebugMode(): Promise<boolean>;

  // Event subscriptions
  onTaskUpdate(callback: (event: TaskUpdateEvent) => void): () => void;
  onTaskUpdateBatch?(callback: (event: { taskId: string; messages: TaskMessage[] }) => void): () => void;
  onPermissionRequest(callback: (request: PermissionRequest) => void): () => void;
  onTaskProgress(callback: (progress: TaskProgress) => void): () => void;
  onDebugLog(callback: (log: unknown) => void): () => void;
  onDebugModeChange?(callback: (data: { enabled: boolean }) => void): () => void;
  onTaskStatusChange?(callback: (data: { taskId: string; status: TaskStatus }) => void): () => void;
  onTaskSummary?(callback: (data: { taskId: string; summary: string }) => void): () => void;

  // Logging
  logEvent(payload: { level?: string; message: string; context?: Record<string, unknown> }): Promise<unknown>;
}

interface AccomplishShell {
  version: string;
  platform: string;
  isElectron: true;
}

// Extend Window interface
declare global {
  interface Window {
    accomplish?: AccomplishAPI;
    accomplishShell?: AccomplishShell;
  }
}

/**
 * Get the accomplish API
 * Works in both Electron and browser modes
 */
export function getAccomplish() {
  // Browser mode - use HTTP/WS API
  if (!isElectron()) {
    return createBrowserAccomplishAPI();
  }
  
  // Electron mode - use IPC API
  if (!window.accomplish) {
    throw new Error('Accomplish API not available - not running in Electron');
  }
  return {
    ...window.accomplish,

    validateBedrockCredentials: async (credentials: BedrockCredentials): Promise<{ valid: boolean; error?: string }> => {
      return window.accomplish!.validateBedrockCredentials(JSON.stringify(credentials));
    },

    saveBedrockCredentials: async (credentials: BedrockCredentials): Promise<ApiKeyConfig> => {
      return window.accomplish!.saveBedrockCredentials(JSON.stringify(credentials));
    },

    getBedrockCredentials: async (): Promise<BedrockCredentials | null> => {
      return window.accomplish!.getBedrockCredentials();
    },

    fetchBedrockModels: (credentials: string) => window.accomplish!.fetchBedrockModels(credentials),
  };
}

/**
 * Create browser-compatible API wrapper
 */
function createBrowserAccomplishAPI(): AccomplishAPI {
  return {
    // App info
    getVersion: () => browserApi.getVersion(),
    getPlatform: () => browserApi.getPlatform(),
    
    // Shell
    openExternal: (url: string) => browserApi.openExternal(url),
    
    // Task operations
    startTask: (config: TaskConfig) => browserApi.startTask({ description: config.prompt }),
    cancelTask: (taskId: string) => browserApi.cancelTask(taskId),
    interruptTask: (taskId: string) => browserApi.interruptTask(taskId),
    getTask: (taskId: string) => browserApi.getTask(taskId),
    listTasks: () => browserApi.listTasks(),
    deleteTask: (taskId: string) => browserApi.deleteTask(taskId),
    clearTaskHistory: () => browserApi.clearTaskHistory(),
    
    // Permission responses
    respondToPermission: () => Promise.reject(new Error('Not implemented in browser mode')),
    
    // Session management
    resumeSession: () => Promise.reject(new Error('Not implemented in browser mode')),
    
    // Settings (not all implemented for browser mode yet)
    getApiKeys: () => Promise.resolve([]),
    addApiKey: () => Promise.reject(new Error('Not implemented in browser mode')),
    removeApiKey: () => Promise.reject(new Error('Not implemented in browser mode')),
    getDebugMode: () => Promise.resolve(false),
    setDebugMode: () => Promise.resolve(),
    getAppSettings: async () => ({ debugMode: false, onboardingComplete: await browserApi.getOnboardingComplete() }),
    
    // API Key management (simplified for browser)
    hasApiKey: () => browserApi.hasAnyApiKey(),
    setApiKey: (key: string) => browserApi.setApiKey('default', key),
    getApiKey: () => browserApi.getApiKey('default'),
    validateApiKey: (key: string) => browserApi.validateApiKey('default', key),
    validateApiKeyForProvider: (provider: string, key: string) => browserApi.validateApiKey(provider, key),
    clearApiKey: () => browserApi.removeApiKey('default'),
    
    // Onboarding
    getOnboardingComplete: () => browserApi.getOnboardingComplete(),
    setOnboardingComplete: (complete: boolean) => browserApi.setOnboardingComplete(complete),
    
    // OpenCode CLI status
    checkClaudeCli: () => Promise.resolve({ installed: false, version: null, installCommand: '' }),
    getClaudeVersion: () => Promise.resolve(null),
    
    // Model selection
    getSelectedModel: () => Promise.resolve(null),
    setSelectedModel: () => Promise.resolve(),
    
    // Multi-provider API keys
    getAllApiKeys: () => browserApi.getAllApiKeys(),
    hasAnyApiKey: () => browserApi.hasAnyApiKey(),
    
    // Ollama configuration
    testOllamaConnection: () => Promise.reject(new Error('Not implemented in browser mode')),
    getOllamaConfig: () => Promise.resolve(null),
    setOllamaConfig: () => Promise.resolve(),
    
    // Azure Foundry
    getAzureFoundryConfig: () => Promise.resolve(null),
    setAzureFoundryConfig: () => Promise.resolve(),
    testAzureFoundryConnection: () => Promise.reject(new Error('Not implemented in browser mode')),
    saveAzureFoundryConfig: () => Promise.resolve(),
    
    // LiteLLM
    testLiteLLMConnection: () => Promise.reject(new Error('Not implemented in browser mode')),
    fetchLiteLLMModels: () => Promise.reject(new Error('Not implemented in browser mode')),
    getLiteLLMConfig: () => Promise.resolve(null),
    setLiteLLMConfig: () => Promise.resolve(),
    
    // OpenRouter
    fetchOpenRouterModels: () => Promise.reject(new Error('Not implemented in browser mode')),
    
    // Bedrock
    validateBedrockCredentials: () => Promise.reject(new Error('Not implemented in browser mode')),
    fetchBedrockModels: () => Promise.reject(new Error('Not implemented in browser mode')),
    saveBedrockCredentials: () => Promise.reject(new Error('Not implemented in browser mode')),
    getBedrockCredentials: () => Promise.resolve(null),
    
    // E2E Testing
    isE2EMode: () => Promise.resolve(false),
    
    // Provider settings
    getProviderSettings: () => Promise.resolve({ activeProvider: null, activeProviderId: null, connectedProviders: {}, debugMode: false }),
    setActiveProvider: () => Promise.resolve(),
    getConnectedProvider: () => Promise.resolve(null),
    setConnectedProvider: () => Promise.resolve(),
    removeConnectedProvider: () => Promise.resolve(),
    updateProviderModel: () => Promise.resolve(),
    setProviderDebugMode: () => Promise.resolve(),
    getProviderDebugMode: () => Promise.resolve(false),
    
    // Event subscriptions
    onTaskUpdate: (callback: (event: TaskUpdateEvent) => void) => browserApi.on('task:update', callback),
    onTaskProgress: (callback: (progress: TaskProgress) => void) => browserApi.on('task:progress', callback),
    onPermissionRequest: (callback: (request: PermissionRequest) => void) => browserApi.on('permission:request', callback),
    onTaskSummary: (callback: (data: { taskId: string; summary: string }) => void) => browserApi.on('task:summary', callback),
    onQuestionRequest: (callback: any) => browserApi.on('question:request', callback),
    onDebugLog: (callback: (log: unknown) => void) => browserApi.on('debug:log', callback),
    
    // Logging
    logEvent: () => Promise.resolve(undefined),
  };
}

/**
 * Check if running in Electron shell
 */
export function isRunningInElectron(): boolean {
  return isElectron();
}

/**
 * Get shell version if available
 */
export function getShellVersion(): string | null {
  return window.accomplishShell?.version ?? null;
}

/**
 * Get shell platform if available
 */
export function getShellPlatform(): string | null {
  return window.accomplishShell?.platform ?? null;
}

/**
 * React hook to use the accomplish API
 */
export function useAccomplish(): AccomplishAPI {
  const api = window.accomplish;
  if (!api) {
    throw new Error('Accomplish API not available - not running in Electron');
  }
  return api;
}
