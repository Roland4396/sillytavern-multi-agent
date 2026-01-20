/**
 * Configuration Manager
 *
 * Singleton manager for Multi-Agent prompt configurations.
 * Provides centralized access to prompt templates and variable substitution.
 */

import type {
  AgentType,
  AgentPromptConfig,
  MultiAgentPromptConfig,
} from './types';
import { getDefaultConfig } from './defaults';
import { getStorage } from './storage';

/**
 * Configuration change listener type
 */
type ConfigChangeListener = (
  agent: AgentType | null,
  config: MultiAgentPromptConfig
) => void;

/**
 * Configuration Manager class
 * Singleton pattern for centralized configuration management
 */
class ConfigManagerImpl {
  private config: MultiAgentPromptConfig;
  private initialized = false;
  private listeners: Set<ConfigChangeListener> = new Set();

  constructor() {
    // Start with default config
    this.config = getDefaultConfig();
  }

  /**
   * Initialize manager by loading saved configuration
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const storage = getStorage();
    const savedConfig = await storage.load();

    if (savedConfig) {
      // Merge with defaults to ensure all fields exist
      this.config = this.mergeWithDefaults(savedConfig);
    }

    this.initialized = true;
    console.log('[MultiAgent] ConfigManager initialized');
  }

  /**
   * Merge saved config with defaults to fill missing fields
   */
  private mergeWithDefaults(
    saved: MultiAgentPromptConfig
  ): MultiAgentPromptConfig {
    const defaults = getDefaultConfig();

    return {
      version: saved.version || defaults.version,
      narrator: { ...defaults.narrator, ...saved.narrator },
      director: { ...defaults.director, ...saved.director },
      persona: { ...defaults.persona, ...saved.persona },
      composer: { ...defaults.composer, ...saved.composer },
    };
  }

  /**
   * Get prompt configuration for an agent
   */
  getPrompt(agent: AgentType): AgentPromptConfig {
    return this.config[agent];
  }

  /**
   * Set prompt configuration for an agent
   */
  async setPrompt(
    agent: AgentType,
    config: Partial<AgentPromptConfig>
  ): Promise<void> {
    this.config[agent] = { ...this.config[agent], ...config };
    await this.save();
    this.notifyListeners(agent);
  }

  /**
   * Get the complete configuration
   */
  getConfig(): MultiAgentPromptConfig {
    return { ...this.config };
  }

  /**
   * Set the complete configuration
   */
  async setConfig(config: MultiAgentPromptConfig): Promise<void> {
    this.config = this.mergeWithDefaults(config);
    await this.save();
    this.notifyListeners(null);
  }

  /**
   * Reset agent to default configuration
   */
  async resetAgent(agent: AgentType): Promise<void> {
    const defaults = getDefaultConfig();
    this.config[agent] = { ...defaults[agent] };
    await this.save();
    this.notifyListeners(agent);
  }

  /**
   * Reset all agents to default configuration
   */
  async resetAll(): Promise<void> {
    this.config = getDefaultConfig();
    await this.save();
    this.notifyListeners(null);
  }

  /**
   * Render a prompt template with variable substitution
   */
  renderPrompt(agent: AgentType, variables: Record<string, string>): string {
    const promptConfig = this.config[agent];
    return this.replaceVariables(promptConfig.systemPrompt, variables);
  }

  /**
   * Render user prompt template (if exists)
   */
  renderUserPrompt(
    agent: AgentType,
    variables: Record<string, string>
  ): string | null {
    const promptConfig = this.config[agent];
    if (!promptConfig.userPromptTemplate) return null;
    return this.replaceVariables(promptConfig.userPromptTemplate, variables);
  }

  /**
   * Replace template variables: {{var}} -> value
   */
  private replaceVariables(
    template: string,
    vars: Record<string, string>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return vars[varName] !== undefined ? vars[varName] : match;
    });
  }

  /**
   * Get preview of rendered prompt with example values
   */
  getPreview(agent: AgentType): string {
    const promptConfig = this.config[agent];
    const exampleVars: Record<string, string> = {};

    for (const variable of promptConfig.variables) {
      exampleVars[variable.name] = variable.example || `[${variable.name}]`;
    }

    return this.renderPrompt(agent, exampleVars);
  }

  /**
   * Save configuration to storage
   */
  private async save(): Promise<void> {
    const storage = getStorage();
    await storage.save(this.config);
  }

  /**
   * Export configuration as JSON string
   */
  async exportConfig(): Promise<string> {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  async importConfig(json: string): Promise<void> {
    const config = JSON.parse(json) as MultiAgentPromptConfig;
    await this.setConfig(config);
  }

  /**
   * Add configuration change listener
   */
  addListener(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of configuration change
   */
  private notifyListeners(agent: AgentType | null): void {
    for (const listener of this.listeners) {
      try {
        listener(agent, this.config);
      } catch (e) {
        console.error('[MultiAgent] Listener error:', e);
      }
    }
  }

  /**
   * Get temperature for an agent
   */
  getTemperature(agent: AgentType): number | undefined {
    return this.config[agent].temperature;
  }

  /**
   * Get model name for an agent
   */
  getModelName(agent: AgentType): string | undefined {
    return this.config[agent].modelName;
  }
}

/**
 * Singleton instance
 */
let managerInstance: ConfigManagerImpl | null = null;

/**
 * Get the ConfigManager singleton
 */
export function getConfigManager(): ConfigManagerImpl {
  if (!managerInstance) {
    managerInstance = new ConfigManagerImpl();
  }
  return managerInstance;
}

/**
 * Export class type for external use
 */
export type ConfigManager = ConfigManagerImpl;
