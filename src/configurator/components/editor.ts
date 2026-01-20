/**
 * Editor Component
 *
 * Prompt template editor with variable insertion and preview
 */

import type { AgentType, AgentPromptConfig } from '../../config/types';
import { getAgentInfo } from './sidebar';

/**
 * Editor options
 */
export interface EditorOptions {
  agent: AgentType;
  config: AgentPromptConfig;
  onConfigChange: (config: Partial<AgentPromptConfig>) => void;
}

/**
 * Create editor HTML
 */
export function createEditorHTML(options: EditorOptions): string {
  const { agent, config } = options;
  const agentInfo = getAgentInfo(agent);

  const variableTags = config.variables
    .map(
      (v) => `
      <span class="ma-config-variable-tag"
            data-variable="${v.name}"
            title="${v.description}${v.example ? '\n示例: ' + v.example : ''}">
        ${v.name}
      </span>
    `
    )
    .join('');

  return `
    <div class="ma-config-content">
      <div class="ma-config-toolbar" id="ma-toolbar"></div>
      <div class="ma-config-editor">
        <!-- Agent Header -->
        <div class="ma-config-editor-section">
          <div class="ma-config-editor-label">
            <span>${agentInfo?.icon || ''}</span>
            <span>${agentInfo?.name || agent} - ${agentInfo?.description || ''}</span>
          </div>
        </div>

        <!-- Parameters -->
        <div class="ma-config-editor-section">
          <div class="ma-config-params">
            <div class="ma-config-param">
              <label class="ma-config-param-label">Temperature:</label>
              <input type="number"
                     class="ma-config-param-input"
                     id="ma-temp-input"
                     min="0" max="2" step="0.1"
                     value="${config.temperature ?? 0.7}">
            </div>
            <div class="ma-config-param">
              <label class="ma-config-param-label">Model:</label>
              <input type="text"
                     class="ma-config-param-input"
                     id="ma-model-input"
                     style="width: 160px;"
                     placeholder="Default"
                     value="${config.modelName || ''}">
            </div>
          </div>
        </div>

        <!-- Variables -->
        <div class="ma-config-editor-section">
          <div class="ma-config-variables">
            <div class="ma-config-variables-title">
              Available Variables (click to insert)
            </div>
            <div class="ma-config-variable-list">
              ${variableTags}
            </div>
          </div>
        </div>

        <!-- System Prompt Editor -->
        <div class="ma-config-editor-section flex-1">
          <div class="ma-config-editor-label">
            System Prompt Template
          </div>
          <textarea class="ma-config-editor-textarea"
                    id="ma-system-prompt"
                    placeholder="Enter system prompt template...">${escapeHtml(config.systemPrompt)}</textarea>
        </div>

        ${config.userPromptTemplate !== undefined ? `
        <!-- User Prompt Template -->
        <div class="ma-config-editor-section">
          <div class="ma-config-editor-label">
            User Prompt Template (optional)
          </div>
          <textarea class="ma-config-editor-textarea"
                    id="ma-user-prompt"
                    style="min-height: 80px;"
                    placeholder="Enter user prompt template...">${escapeHtml(config.userPromptTemplate || '')}</textarea>
        </div>
        ` : ''}

        <!-- Preview -->
        <div class="ma-config-editor-section">
          <div class="ma-config-editor-label">
            Preview (with example values)
          </div>
          <div class="ma-config-preview" id="ma-preview">
            ${renderPreview(config)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render preview with example values
 */
function renderPreview(config: AgentPromptConfig): string {
  let preview = config.systemPrompt;

  // Replace variables with example values
  for (const variable of config.variables) {
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
    const replacement = `<span class="ma-config-preview-highlight">${escapeHtml(
      variable.example || `[${variable.name}]`
    )}</span>`;
    preview = preview.replace(regex, replacement);
  }

  return preview.replace(/\n/g, '<br>');
}

/**
 * Setup editor event handlers
 */
export function setupEditorEvents(
  container: HTMLElement,
  options: EditorOptions
): void {
  const { config, onConfigChange } = options;

  // System prompt change
  const systemPromptEl = container.querySelector(
    '#ma-system-prompt'
  ) as HTMLTextAreaElement;
  if (systemPromptEl) {
    systemPromptEl.addEventListener('input', () => {
      onConfigChange({ systemPrompt: systemPromptEl.value });
      updatePreview(container, {
        ...config,
        systemPrompt: systemPromptEl.value,
      });
    });
  }

  // User prompt change
  const userPromptEl = container.querySelector(
    '#ma-user-prompt'
  ) as HTMLTextAreaElement;
  if (userPromptEl) {
    userPromptEl.addEventListener('input', () => {
      onConfigChange({ userPromptTemplate: userPromptEl.value });
    });
  }

  // Temperature change
  const tempInput = container.querySelector(
    '#ma-temp-input'
  ) as HTMLInputElement;
  if (tempInput) {
    tempInput.addEventListener('change', () => {
      const temp = parseFloat(tempInput.value);
      if (!isNaN(temp) && temp >= 0 && temp <= 2) {
        onConfigChange({ temperature: temp });
      }
    });
  }

  // Model name change
  const modelInput = container.querySelector(
    '#ma-model-input'
  ) as HTMLInputElement;
  if (modelInput) {
    modelInput.addEventListener('change', () => {
      onConfigChange({ modelName: modelInput.value || undefined });
    });
  }

  // Variable tag click - insert into textarea
  const variableTags = container.querySelectorAll('.ma-config-variable-tag');
  variableTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const varName = tag.getAttribute('data-variable');
      if (varName && systemPromptEl) {
        const insertion = `{{${varName}}}`;
        const start = systemPromptEl.selectionStart;
        const end = systemPromptEl.selectionEnd;
        const text = systemPromptEl.value;

        systemPromptEl.value =
          text.substring(0, start) + insertion + text.substring(end);

        // Update cursor position
        systemPromptEl.selectionStart = systemPromptEl.selectionEnd =
          start + insertion.length;

        // Trigger input event
        systemPromptEl.dispatchEvent(new Event('input'));
        systemPromptEl.focus();
      }
    });
  });
}

/**
 * Update preview panel
 */
export function updatePreview(
  container: HTMLElement,
  config: AgentPromptConfig
): void {
  const previewEl = container.querySelector('#ma-preview');
  if (previewEl) {
    previewEl.innerHTML = renderPreview(config);
  }
}

/**
 * Update editor content
 */
export function updateEditorContent(
  container: HTMLElement,
  config: AgentPromptConfig
): void {
  const systemPromptEl = container.querySelector(
    '#ma-system-prompt'
  ) as HTMLTextAreaElement;
  if (systemPromptEl) {
    systemPromptEl.value = config.systemPrompt;
  }

  const userPromptEl = container.querySelector(
    '#ma-user-prompt'
  ) as HTMLTextAreaElement;
  if (userPromptEl && config.userPromptTemplate !== undefined) {
    userPromptEl.value = config.userPromptTemplate || '';
  }

  const tempInput = container.querySelector(
    '#ma-temp-input'
  ) as HTMLInputElement;
  if (tempInput) {
    tempInput.value = String(config.temperature ?? 0.7);
  }

  const modelInput = container.querySelector(
    '#ma-model-input'
  ) as HTMLInputElement;
  if (modelInput) {
    modelInput.value = config.modelName || '';
  }

  updatePreview(container, config);
}
