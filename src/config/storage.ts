/**
 * Configuration Storage Adapter
 *
 * Provides storage abstraction with multiple backends:
 * - SillyTavern extension settings (primary)
 * - IndexedDB (fallback)
 */

import type { MultiAgentPromptConfig, ConfigStorageAdapter } from './types';
import { getDefaultConfig } from './defaults';

const STORAGE_KEY = 'multi_agent_prompt_config';
const DB_NAME = 'MultiAgentConfigDB';
const STORE_NAME = 'config';
const DB_VERSION = 1;

/**
 * SillyTavern extension settings interface
 */
interface SillyTavernContext {
  extensionSettings?: {
    multiAgent?: MultiAgentPromptConfig;
  };
  saveSettingsDebounced?: () => void;
}

/**
 * Get SillyTavern context from global scope
 */
function getSillyTavernContext(): SillyTavernContext | null {
  const win = typeof window !== 'undefined' ? window : null;
  if (!win) return null;

  // Check for SillyTavern global context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stContext = (win as any).SillyTavern?.getContext?.();
  if (stContext?.extensionSettings !== undefined) {
    return stContext;
  }

  return null;
}

/**
 * IndexedDB storage backend
 */
class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[MultiAgent] IndexedDB open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  async save(config: MultiAgentPromptConfig): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id: STORAGE_KEY, config });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(): Promise<MultiAgentPromptConfig | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.config || null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Configuration Storage class
 * Implements storage with SillyTavern primary, IndexedDB fallback
 */
export class ConfigStorage implements ConfigStorageAdapter {
  private indexedDB: IndexedDBStorage;
  private cachedConfig: MultiAgentPromptConfig | null = null;

  constructor() {
    this.indexedDB = new IndexedDBStorage();
  }

  /**
   * Save configuration to storage
   */
  async save(config: MultiAgentPromptConfig): Promise<void> {
    this.cachedConfig = config;

    // Try SillyTavern first
    const stContext = getSillyTavernContext();
    if (stContext?.extensionSettings) {
      stContext.extensionSettings.multiAgent = config;
      stContext.saveSettingsDebounced?.();
      console.log('[MultiAgent] Config saved to SillyTavern settings');
    }

    // Also save to IndexedDB as backup
    try {
      await this.indexedDB.save(config);
      console.log('[MultiAgent] Config backed up to IndexedDB');
    } catch (e) {
      console.warn('[MultiAgent] IndexedDB backup failed:', e);
    }
  }

  /**
   * Load configuration from storage
   */
  async load(): Promise<MultiAgentPromptConfig | null> {
    // Return cached if available
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    // Try SillyTavern first
    const stContext = getSillyTavernContext();
    if (stContext?.extensionSettings?.multiAgent) {
      const config = stContext.extensionSettings.multiAgent;
      this.cachedConfig = config;
      console.log('[MultiAgent] Config loaded from SillyTavern settings');
      return config;
    }

    // Fallback to IndexedDB
    try {
      const config = await this.indexedDB.load();
      if (config) {
        this.cachedConfig = config;
        console.log('[MultiAgent] Config loaded from IndexedDB');
        return config;
      }
    } catch (e) {
      console.warn('[MultiAgent] IndexedDB load failed:', e);
    }

    return null;
  }

  /**
   * Export configuration as JSON string
   */
  async export(): Promise<string> {
    const config = await this.load() || getDefaultConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  async import(json: string): Promise<void> {
    try {
      const config = JSON.parse(json) as MultiAgentPromptConfig;

      // Validate structure
      if (!config.version || !config.narrator || !config.director ||
          !config.persona || !config.composer) {
        throw new Error('Invalid configuration structure');
      }

      await this.save(config);
      console.log('[MultiAgent] Config imported successfully');
    } catch (e) {
      console.error('[MultiAgent] Config import failed:', e);
      throw e;
    }
  }

  /**
   * Clear cached configuration
   */
  clearCache(): void {
    this.cachedConfig = null;
  }
}

/**
 * Singleton storage instance
 */
let storageInstance: ConfigStorage | null = null;

/**
 * Get the storage singleton
 */
export function getStorage(): ConfigStorage {
  if (!storageInstance) {
    storageInstance = new ConfigStorage();
  }
  return storageInstance;
}
