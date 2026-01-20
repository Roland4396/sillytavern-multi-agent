/**
 * Configurator Entry Point
 *
 * Main orchestrator for the Multi-Agent visual configurator
 */

import type { AgentType, AgentPromptConfig, ConfiguratorState } from '../config/types';
import { getConfigManager } from '../config/manager';
import { getDefaultConfig } from '../config/defaults';
import { createWindow, closeWindow, isWindowOpen, showToast } from './window';
import {
  createSidebarHTML,
  setupSidebarEvents,
  updateSidebarSelection,
  updateSidebarModified,
} from './components/sidebar';
import {
  createEditorHTML,
  setupEditorEvents,
  updateEditorContent,
} from './components/editor';
import {
  createToolbarHTML,
  setupToolbarEvents,
  downloadFile,
  openFilePicker,
  copyToClipboard,
  updateSaveButtonState,
} from './components/toolbar';

/**
 * Window ID constant
 */
const CONFIGURATOR_WINDOW_ID = 'ma-configurator-window';

/**
 * Configurator state
 */
let state: ConfiguratorState = {
  selectedAgent: 'narrator',
  isDirty: false,
  previewVariables: {},
};

/**
 * Track modified agents
 */
const modifiedAgents = new Set<AgentType>();

/**
 * Pending changes buffer
 */
const pendingChanges: Map<AgentType, Partial<AgentPromptConfig>> = new Map();

/**
 * Get current agent config with pending changes
 */
function getCurrentConfig(agent: AgentType): AgentPromptConfig {
  const manager = getConfigManager();
  const baseConfig = manager.getPrompt(agent);
  const pending = pendingChanges.get(agent);

  if (pending) {
    return { ...baseConfig, ...pending };
  }
  return baseConfig;
}

/**
 * Handle config change from editor
 */
function handleConfigChange(agent: AgentType, changes: Partial<AgentPromptConfig>): void {
  // Merge with existing pending changes
  const existing = pendingChanges.get(agent) || {};
  pendingChanges.set(agent, { ...existing, ...changes });

  // Mark as modified
  modifiedAgents.add(agent);
  state.isDirty = true;

  // Update UI
  const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
  if (windowEl) {
    updateSidebarModified(windowEl, modifiedAgents);
    updateSaveButtonState(windowEl, state.isDirty);
  }
}

/**
 * Save all pending changes
 */
async function saveChanges(): Promise<void> {
  const manager = getConfigManager();

  try {
    // Apply all pending changes
    for (const [agent, changes] of pendingChanges) {
      await manager.setPrompt(agent, changes);
    }

    // Clear pending changes
    pendingChanges.clear();
    modifiedAgents.clear();
    state.isDirty = false;

    // Update UI
    const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
    if (windowEl) {
      updateSidebarModified(windowEl, modifiedAgents);
      updateSaveButtonState(windowEl, false);
    }

    showToast('Configuration saved successfully', 'success');
  } catch (e) {
    console.error('[MultiAgent] Failed to save config:', e);
    showToast('Failed to save configuration', 'error');
  }
}

/**
 * Reset current agent to defaults
 */
async function resetCurrentAgent(): Promise<void> {
  const manager = getConfigManager();
  const agent = state.selectedAgent;

  try {
    await manager.resetAgent(agent);

    // Clear pending changes for this agent
    pendingChanges.delete(agent);
    modifiedAgents.delete(agent);

    // Update UI
    const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
    if (windowEl) {
      refreshEditor(windowEl);
      updateSidebarModified(windowEl, modifiedAgents);
      updateSaveButtonState(windowEl, pendingChanges.size > 0);
    }

    showToast(`${agent} reset to defaults`, 'success');
  } catch (e) {
    console.error('[MultiAgent] Failed to reset agent:', e);
    showToast('Failed to reset agent', 'error');
  }
}

/**
 * Reset all agents to defaults
 */
async function resetAllAgents(): Promise<void> {
  const manager = getConfigManager();

  try {
    await manager.resetAll();

    // Clear all pending changes
    pendingChanges.clear();
    modifiedAgents.clear();
    state.isDirty = false;

    // Update UI
    const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
    if (windowEl) {
      refreshEditor(windowEl);
      updateSidebarModified(windowEl, modifiedAgents);
      updateSaveButtonState(windowEl, false);
    }

    showToast('All agents reset to defaults', 'success');
  } catch (e) {
    console.error('[MultiAgent] Failed to reset all:', e);
    showToast('Failed to reset configuration', 'error');
  }
}

/**
 * Export configuration to JSON file
 */
async function exportConfig(): Promise<void> {
  const manager = getConfigManager();

  try {
    const json = await manager.exportConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadFile(json, `multi-agent-config-${timestamp}.json`);
    showToast('Configuration exported', 'success');
  } catch (e) {
    console.error('[MultiAgent] Export failed:', e);
    showToast('Failed to export configuration', 'error');
  }
}

/**
 * Import configuration from JSON file
 */
async function importConfig(): Promise<void> {
  try {
    const json = await openFilePicker();
    const manager = getConfigManager();
    await manager.importConfig(json);

    // Clear pending changes
    pendingChanges.clear();
    modifiedAgents.clear();
    state.isDirty = false;

    // Update UI
    const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
    if (windowEl) {
      refreshEditor(windowEl);
      updateSidebarModified(windowEl, modifiedAgents);
      updateSaveButtonState(windowEl, false);
    }

    showToast('Configuration imported', 'success');
  } catch (e) {
    console.error('[MultiAgent] Import failed:', e);
    showToast('Failed to import configuration', 'error');
  }
}

/**
 * Copy current prompt to clipboard
 */
async function copyCurrentPrompt(): Promise<void> {
  const config = getCurrentConfig(state.selectedAgent);

  try {
    await copyToClipboard(config.systemPrompt);
    showToast('Prompt copied to clipboard', 'success');
  } catch (e) {
    console.error('[MultiAgent] Copy failed:', e);
    showToast('Failed to copy to clipboard', 'error');
  }
}

/**
 * Select an agent and update editor
 */
function selectAgent(agent: AgentType): void {
  if (agent === state.selectedAgent) return;

  state.selectedAgent = agent;

  const windowEl = document.getElementById(CONFIGURATOR_WINDOW_ID);
  if (windowEl) {
    updateSidebarSelection(windowEl, agent);
    refreshEditor(windowEl);
  }
}

/**
 * Refresh editor content for current agent
 */
function refreshEditor(windowEl: HTMLElement): void {
  const contentEl = windowEl.querySelector('.ma-config-content');
  if (!contentEl) return;

  const agent = state.selectedAgent;
  const config = getCurrentConfig(agent);

  // Re-render editor
  const editorHTML = createEditorHTML({
    agent,
    config,
    onConfigChange: (changes) => handleConfigChange(agent, changes),
  });

  // Find content area (everything after sidebar)
  const bodyEl = windowEl.querySelector('.ma-config-body');
  if (bodyEl) {
    // Remove old content
    const oldContent = bodyEl.querySelector('.ma-config-content');
    if (oldContent) {
      oldContent.remove();
    }

    // Insert new content
    bodyEl.insertAdjacentHTML('beforeend', editorHTML);

    // Setup events for new content
    const newContent = bodyEl.querySelector('.ma-config-content');
    if (newContent) {
      setupEditorEvents(newContent as HTMLElement, {
        agent,
        config,
        onConfigChange: (changes) => handleConfigChange(agent, changes),
      });

      // Re-render toolbar in content
      const toolbarEl = newContent.querySelector('#ma-toolbar');
      if (toolbarEl) {
        toolbarEl.innerHTML = createToolbarHTML();
        setupToolbarEvents(newContent as HTMLElement, {
          onSave: saveChanges,
          onResetAgent: resetCurrentAgent,
          onResetAll: resetAllAgents,
          onExport: exportConfig,
          onImport: importConfig,
          onCopyToClipboard: copyCurrentPrompt,
        });
        updateSaveButtonState(newContent as HTMLElement, state.isDirty);
      }
    }
  }
}

/**
 * Create window content HTML
 */
function createWindowContent(): string {
  const agent = state.selectedAgent;
  const config = getCurrentConfig(agent);

  const sidebarHTML = createSidebarHTML({
    selectedAgent: agent,
    modifiedAgents,
    onAgentSelect: selectAgent,
  });

  const editorHTML = createEditorHTML({
    agent,
    config,
    onConfigChange: (changes) => handleConfigChange(agent, changes),
  });

  return sidebarHTML + editorHTML;
}

/**
 * Open the configurator window
 */
export async function openConfigurator(): Promise<void> {
  // Initialize config manager
  const manager = getConfigManager();
  await manager.init();

  // Reset state
  state = {
    selectedAgent: 'narrator',
    isDirty: false,
    previewVariables: {},
  };
  pendingChanges.clear();
  modifiedAgents.clear();

  // Create window
  const windowEl = createWindow({
    id: CONFIGURATOR_WINDOW_ID,
    title: 'Multi-Agent Prompt Configurator',
    content: createWindowContent(),
    width: 1100,
    height: 750,
    modal: true,
    resizable: true,
    maximizable: true,
    rememberState: true,
    onClose: () => {
      // Warn about unsaved changes
      if (state.isDirty) {
        console.log('[MultiAgent] Configurator closed with unsaved changes');
      }
    },
    onReady: (win) => {
      // Setup sidebar events
      setupSidebarEvents(win, selectAgent);

      // Setup editor events
      const contentEl = win.querySelector('.ma-config-content');
      if (contentEl) {
        const agent = state.selectedAgent;
        const config = getCurrentConfig(agent);

        setupEditorEvents(contentEl as HTMLElement, {
          agent,
          config,
          onConfigChange: (changes) => handleConfigChange(agent, changes),
        });

        // Setup toolbar
        const toolbarEl = contentEl.querySelector('#ma-toolbar');
        if (toolbarEl) {
          toolbarEl.innerHTML = createToolbarHTML();
          setupToolbarEvents(contentEl as HTMLElement, {
            onSave: saveChanges,
            onResetAgent: resetCurrentAgent,
            onResetAll: resetAllAgents,
            onExport: exportConfig,
            onImport: importConfig,
            onCopyToClipboard: copyCurrentPrompt,
          });
        }
      }

      console.log('[MultiAgent] Configurator window opened');
    },
  });
}

/**
 * Close the configurator window
 */
export function closeConfigurator(): void {
  closeWindow(CONFIGURATOR_WINDOW_ID);
}

/**
 * Check if configurator is open
 */
export function isConfiguratorOpen(): boolean {
  return isWindowOpen(CONFIGURATOR_WINDOW_ID);
}

/**
 * Toggle configurator window
 */
export async function toggleConfigurator(): Promise<void> {
  if (isConfiguratorOpen()) {
    closeConfigurator();
  } else {
    await openConfigurator();
  }
}
