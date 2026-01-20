/**
 * Multi-Agent Prompt Configuration Types
 *
 * Type definitions for the configurable prompt system
 */

/**
 * Agent type identifiers
 */
export type AgentType = 'narrator' | 'director' | 'persona' | 'composer';

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name used in template: {{variableName}} */
  name: string;
  /** Human-readable description */
  description: string;
  /** Example value for preview */
  example?: string;
}

/**
 * Single Agent prompt configuration
 */
export interface AgentPromptConfig {
  /** System prompt template */
  systemPrompt: string;
  /** User message template (optional) */
  userPromptTemplate?: string;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Model name override */
  modelName?: string;
  /** Available template variables with descriptions */
  variables: TemplateVariable[];
}

/**
 * Complete Multi-Agent prompt configuration
 */
export interface MultiAgentPromptConfig {
  /** Config version for migration */
  version: string;
  /** Narrator agent configuration */
  narrator: AgentPromptConfig;
  /** Director agent configuration */
  director: AgentPromptConfig;
  /** Persona agent configuration */
  persona: AgentPromptConfig;
  /** Composer agent configuration */
  composer: AgentPromptConfig;
}

/**
 * Configuration storage interface
 */
export interface ConfigStorageAdapter {
  /** Save configuration */
  save(config: MultiAgentPromptConfig): Promise<void>;
  /** Load configuration */
  load(): Promise<MultiAgentPromptConfig | null>;
  /** Export as JSON string */
  export(): Promise<string>;
  /** Import from JSON string */
  import(json: string): Promise<void>;
}

/**
 * Configurator window state
 */
export interface ConfiguratorState {
  /** Currently selected agent */
  selectedAgent: AgentType;
  /** Is the config modified */
  isDirty: boolean;
  /** Preview variables */
  previewVariables: Record<string, string>;
}

/**
 * Window position and size
 */
export interface WindowState {
  width: number;
  height: number;
  top?: number;
  left?: number;
  isMaximized: boolean;
}
