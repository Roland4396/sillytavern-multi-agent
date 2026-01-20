/**
 * Configurator CSS Styles
 *
 * Visual styling for the Multi-Agent Configurator window system
 * Inspired by shujuku visualizer design
 */

export const CONFIGURATOR_STYLES = `
/* ═══════════════════════════════════════════════════════════════
   Multi-Agent Configurator Window System
   ═══════════════════════════════════════════════════════════════ */

/* Overlay backdrop */
.ma-config-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9999;
  animation: maOverlayFadeIn 0.2s ease-out;
}

@keyframes maOverlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Main window container */
.ma-config-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(100, 180, 255, 0.10), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, rgba(140, 100, 255, 0.08), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 22%),
    #0a0e14;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255,255,255,0.1);
  overflow: hidden;
  min-width: 800px;
  min-height: 500px;
  animation: maWindowSlideIn 0.25s ease-out;
  color-scheme: dark;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
               "Hiragino Sans GB", "Microsoft YaHei", Roboto, sans-serif;
  color: rgba(255, 255, 255, 0.92);
}

@keyframes maWindowSlideIn {
  from { opacity: 0; transform: scale(0.95) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.ma-config-window.maximized {
  top: 10px !important;
  left: 10px !important;
  width: calc(100vw - 20px) !important;
  height: calc(100vh - 20px) !important;
  border-radius: 12px;
}

/* Window header / title bar */
.ma-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

.ma-config-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.ma-config-title-icon {
  color: rgba(100, 180, 255, 0.85);
  font-size: 16px;
  flex-shrink: 0;
}

.ma-config-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Window control buttons */
.ma-config-controls {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.ma-config-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  font-size: 12px;
}

.ma-config-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

.ma-config-btn.close:hover {
  background: rgba(255, 107, 107, 0.25);
  color: #ff6b6b;
}

/* Main body container */
.ma-config-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Sidebar */
.ma-config-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ma-config-sidebar-title {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ma-config-agent-list {
  flex: 1;
  padding: 8px;
}

.ma-config-agent-item {
  padding: 12px 14px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.7);
}

.ma-config-agent-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}

.ma-config-agent-item.active {
  background: rgba(100, 180, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  border-left: 3px solid rgba(100, 180, 255, 0.8);
}

.ma-config-agent-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.ma-config-agent-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.ma-config-agent-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.ma-config-agent-status.modified {
  background: rgba(255, 200, 100, 0.8);
}

/* Content area */
.ma-config-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Toolbar */
.ma-config-toolbar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.ma-config-toolbar-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.ma-config-toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.95);
}

.ma-config-toolbar-btn.primary {
  background: rgba(100, 180, 255, 0.2);
  color: rgba(100, 180, 255, 0.95);
}

.ma-config-toolbar-btn.primary:hover {
  background: rgba(100, 180, 255, 0.3);
}

.ma-config-toolbar-btn.danger {
  background: rgba(255, 100, 100, 0.15);
  color: rgba(255, 150, 150, 0.9);
}

.ma-config-toolbar-btn.danger:hover {
  background: rgba(255, 100, 100, 0.25);
}

.ma-config-toolbar-separator {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.ma-config-toolbar-spacer {
  flex: 1;
}

/* Editor area */
.ma-config-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  gap: 16px;
}

.ma-config-editor-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ma-config-editor-section.flex-1 {
  flex: 1;
  min-height: 0;
}

.ma-config-editor-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
}

.ma-config-editor-textarea {
  flex: 1;
  min-height: 150px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.15s ease;
}

.ma-config-editor-textarea:focus {
  border-color: rgba(100, 180, 255, 0.4);
}

.ma-config-editor-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Variables section */
.ma-config-variables {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.ma-config-variables-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.ma-config-variable-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ma-config-variable-tag {
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(100, 180, 255, 0.15);
  color: rgba(100, 180, 255, 0.9);
  font-size: 12px;
  font-family: 'Consolas', monospace;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ma-config-variable-tag:hover {
  background: rgba(100, 180, 255, 0.25);
}

.ma-config-variable-tag::before {
  content: '{{';
  opacity: 0.6;
}

.ma-config-variable-tag::after {
  content: '}}';
  opacity: 0.6;
}

/* Parameters row */
.ma-config-params {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.ma-config-param {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ma-config-param-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.ma-config-param-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s ease;
}

.ma-config-param-input:focus {
  border-color: rgba(100, 180, 255, 0.4);
}

/* Preview panel */
.ma-config-preview {
  max-height: 200px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-wrap;
  word-break: break-word;
}

.ma-config-preview-highlight {
  color: rgba(100, 180, 255, 0.9);
  background: rgba(100, 180, 255, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}

/* Resize handles */
.ma-config-resize-handle {
  position: absolute;
  background: transparent;
}

.ma-config-resize-handle.se {
  right: 0; bottom: 0;
  width: 20px; height: 20px;
  cursor: se-resize;
}

.ma-config-resize-handle.se::after {
  content: '';
  position: absolute;
  right: 4px; bottom: 4px;
  width: 10px; height: 10px;
  border-right: 2px solid rgba(255,255,255,0.2);
  border-bottom: 2px solid rgba(255,255,255,0.2);
}

.ma-config-resize-handle.e {
  right: 0; top: 40px; bottom: 20px;
  width: 6px;
  cursor: e-resize;
}

.ma-config-resize-handle.s {
  left: 20px; right: 20px; bottom: 0;
  height: 6px;
  cursor: s-resize;
}

.ma-config-resize-handle.w {
  left: 0; top: 40px; bottom: 20px;
  width: 6px;
  cursor: w-resize;
}

.ma-config-resize-handle.n {
  left: 20px; right: 20px; top: 0;
  height: 6px;
  cursor: n-resize;
}

.ma-config-resize-handle.nw {
  left: 0; top: 0;
  width: 20px; height: 20px;
  cursor: nw-resize;
}

.ma-config-resize-handle.ne {
  right: 0; top: 0;
  width: 20px; height: 20px;
  cursor: ne-resize;
}

.ma-config-resize-handle.sw {
  left: 0; bottom: 0;
  width: 20px; height: 20px;
  cursor: sw-resize;
}

/* Toast notifications */
.ma-config-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.85);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  z-index: 10001;
  animation: maToastSlideIn 0.25s ease-out;
}

.ma-config-toast.success {
  border-left: 3px solid rgba(100, 200, 100, 0.8);
}

.ma-config-toast.error {
  border-left: 3px solid rgba(255, 100, 100, 0.8);
}

@keyframes maToastSlideIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Responsive adjustments */
@media screen and (max-width: 900px) {
  .ma-config-window {
    min-width: 100vw;
    min-height: 100vh;
    border-radius: 0;
  }

  .ma-config-sidebar {
    width: 160px;
  }
}

@media screen and (max-width: 600px) {
  .ma-config-sidebar {
    width: 50px;
  }

  .ma-config-agent-name,
  .ma-config-sidebar-title {
    display: none;
  }

  .ma-config-agent-item {
    justify-content: center;
    padding: 12px 8px;
  }
}
`;

/**
 * Style element ID
 */
const STYLE_ID = 'ma-configurator-styles';

/**
 * Inject styles into document
 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return;

  // Check if already injected
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CONFIGURATOR_STYLES;
  document.head.appendChild(style);
}

/**
 * Remove injected styles
 */
export function removeStyles(): void {
  if (typeof document === 'undefined') return;

  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}
