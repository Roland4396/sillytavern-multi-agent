/**
 * Toolbar Component
 *
 * Action buttons for save, reset, import/export
 */

import type { AgentType } from '../../config/types';

/**
 * Toolbar action handlers
 */
export interface ToolbarHandlers {
  onSave: () => void;
  onResetAgent: () => void;
  onResetAll: () => void;
  onExport: () => void;
  onImport: () => void;
  onCopyToClipboard: () => void;
}

/**
 * Create toolbar HTML
 */
export function createToolbarHTML(): string {
  return `
    <button class="ma-config-toolbar-btn primary" id="ma-btn-save" title="Save changes">
      <span>&#128190;</span>
      <span>Save</span>
    </button>
    <div class="ma-config-toolbar-separator"></div>
    <button class="ma-config-toolbar-btn" id="ma-btn-reset-agent" title="Reset current agent to defaults">
      <span>&#8635;</span>
      <span>Reset Agent</span>
    </button>
    <button class="ma-config-toolbar-btn danger" id="ma-btn-reset-all" title="Reset all agents to defaults">
      <span>&#9888;</span>
      <span>Reset All</span>
    </button>
    <div class="ma-config-toolbar-separator"></div>
    <button class="ma-config-toolbar-btn" id="ma-btn-export" title="Export configuration to JSON">
      <span>&#128229;</span>
      <span>Export</span>
    </button>
    <button class="ma-config-toolbar-btn" id="ma-btn-import" title="Import configuration from JSON">
      <span>&#128228;</span>
      <span>Import</span>
    </button>
    <div class="ma-config-toolbar-spacer"></div>
    <button class="ma-config-toolbar-btn" id="ma-btn-copy" title="Copy current prompt to clipboard">
      <span>&#128203;</span>
      <span>Copy</span>
    </button>
  `;
}

/**
 * Setup toolbar event handlers
 */
export function setupToolbarEvents(
  container: HTMLElement,
  handlers: ToolbarHandlers
): void {
  // Save button
  const saveBtn = container.querySelector('#ma-btn-save');
  saveBtn?.addEventListener('click', handlers.onSave);

  // Reset agent button
  const resetAgentBtn = container.querySelector('#ma-btn-reset-agent');
  resetAgentBtn?.addEventListener('click', handlers.onResetAgent);

  // Reset all button
  const resetAllBtn = container.querySelector('#ma-btn-reset-all');
  resetAllBtn?.addEventListener('click', () => {
    // Show confirmation
    if (confirm('Reset all agents to default configuration? This cannot be undone.')) {
      handlers.onResetAll();
    }
  });

  // Export button
  const exportBtn = container.querySelector('#ma-btn-export');
  exportBtn?.addEventListener('click', handlers.onExport);

  // Import button
  const importBtn = container.querySelector('#ma-btn-import');
  importBtn?.addEventListener('click', handlers.onImport);

  // Copy button
  const copyBtn = container.querySelector('#ma-btn-copy');
  copyBtn?.addEventListener('click', handlers.onCopyToClipboard);
}

/**
 * Create and trigger file download
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Open file picker and read JSON file
 */
export function openFilePicker(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });

    input.click();
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Update save button state
 */
export function updateSaveButtonState(
  container: HTMLElement,
  hasChanges: boolean
): void {
  const saveBtn = container.querySelector('#ma-btn-save');
  if (saveBtn) {
    saveBtn.classList.toggle('primary', hasChanges);
    if (hasChanges) {
      saveBtn.innerHTML = '<span>&#128190;</span><span>Save *</span>';
    } else {
      saveBtn.innerHTML = '<span>&#128190;</span><span>Save</span>';
    }
  }
}
