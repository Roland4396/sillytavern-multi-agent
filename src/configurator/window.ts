/**
 * Configurator Window System
 *
 * Creates draggable, resizable floating windows for the configurator
 * Inspired by shujuku visualizer window system
 */

import type { WindowState } from '../config/types';
import { injectStyles } from './styles';

/**
 * Window manager for tracking open windows
 */
const WindowManager = {
  windows: new Map<string, HTMLElement>(),
  baseZIndex: 10000,
  topZIndex: 10000,

  register(id: string, el: HTMLElement): void {
    this.topZIndex++;
    this.windows.set(id, el);
    el.style.zIndex = String(this.topZIndex);
  },

  unregister(id: string): void {
    this.windows.delete(id);
  },

  bringToFront(id: string): void {
    const el = this.windows.get(id);
    if (!el) return;
    this.topZIndex++;
    el.style.zIndex = String(this.topZIndex);
  },

  isOpen(id: string): boolean {
    return this.windows.has(id);
  },

  getWindow(id: string): HTMLElement | null {
    return this.windows.get(id) || null;
  },
};

/**
 * Window state storage key
 */
const WINDOW_STATE_KEY = 'ma_config_window_state';

/**
 * Save window state to localStorage
 */
function saveWindowState(state: WindowState): void {
  try {
    localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[MultiAgent] Failed to save window state:', e);
  }
}

/**
 * Load window state from localStorage
 */
function loadWindowState(): WindowState | null {
  try {
    const saved = localStorage.getItem(WINDOW_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[MultiAgent] Failed to load window state:', e);
  }
  return null;
}

/**
 * Window creation options
 */
export interface WindowOptions {
  id: string;
  title: string;
  content: string;
  width?: number;
  height?: number;
  modal?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  rememberState?: boolean;
  onClose?: () => void;
  onReady?: (window: HTMLElement) => void;
}

/**
 * Create a configurator window
 */
export function createWindow(options: WindowOptions): HTMLElement {
  const {
    id,
    title = 'Window',
    content = '',
    width = 1000,
    height = 700,
    modal = true,
    resizable = true,
    maximizable = true,
    rememberState = true,
    onClose,
    onReady,
  } = options;

  // Inject styles
  injectStyles();

  // Check if already open
  if (WindowManager.isOpen(id)) {
    const existing = WindowManager.getWindow(id);
    if (existing) {
      WindowManager.bringToFront(id);
      return existing;
    }
  }

  // Load saved state
  const savedState = rememberState ? loadWindowState() : null;
  const initialWidth = savedState?.width || width;
  const initialHeight = savedState?.height || height;
  const isMaximized = savedState?.isMaximized || false;

  // Create overlay if modal
  let overlay: HTMLElement | null = null;
  if (modal) {
    overlay = document.createElement('div');
    overlay.className = 'ma-config-overlay';
    overlay.setAttribute('data-window-id', id);
    document.body.appendChild(overlay);
  }

  // Create window element
  const windowEl = document.createElement('div');
  windowEl.className = 'ma-config-window';
  windowEl.id = id;

  // Position window
  if (!isMaximized) {
    windowEl.style.width = `${initialWidth}px`;
    windowEl.style.height = `${initialHeight}px`;
    windowEl.style.left = `${Math.max(10, (window.innerWidth - initialWidth) / 2)}px`;
    windowEl.style.top = `${Math.max(10, (window.innerHeight - initialHeight) / 2)}px`;
  } else {
    windowEl.classList.add('maximized');
  }

  // Build window HTML
  windowEl.innerHTML = `
    <div class="ma-config-header">
      <div class="ma-config-title">
        <span class="ma-config-title-icon">&#9881;</span>
        <span>${title}</span>
      </div>
      <div class="ma-config-controls">
        ${maximizable ? `
          <button class="ma-config-btn maximize" title="Maximize">
            ${isMaximized ? '&#9744;' : '&#9723;'}
          </button>
        ` : ''}
        <button class="ma-config-btn close" title="Close">&#10005;</button>
      </div>
    </div>
    <div class="ma-config-body">
      ${content}
    </div>
    ${resizable ? `
      <div class="ma-config-resize-handle n"></div>
      <div class="ma-config-resize-handle s"></div>
      <div class="ma-config-resize-handle e"></div>
      <div class="ma-config-resize-handle w"></div>
      <div class="ma-config-resize-handle nw"></div>
      <div class="ma-config-resize-handle ne"></div>
      <div class="ma-config-resize-handle sw"></div>
      <div class="ma-config-resize-handle se"></div>
    ` : ''}
  `;

  document.body.appendChild(windowEl);
  WindowManager.register(id, windowEl);

  // State tracking
  let currentIsMaximized = isMaximized;

  // Close function
  const closeWindow = () => {
    // Save state before closing
    if (rememberState && !currentIsMaximized) {
      saveWindowState({
        width: windowEl.offsetWidth,
        height: windowEl.offsetHeight,
        isMaximized: currentIsMaximized,
      });
    }

    WindowManager.unregister(id);
    windowEl.remove();
    overlay?.remove();
    onClose?.();
  };

  // Close button
  const closeBtn = windowEl.querySelector('.ma-config-btn.close');
  closeBtn?.addEventListener('click', closeWindow);

  // Maximize button
  const maxBtn = windowEl.querySelector('.ma-config-btn.maximize');
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      currentIsMaximized = !currentIsMaximized;
      windowEl.classList.toggle('maximized', currentIsMaximized);
      maxBtn.innerHTML = currentIsMaximized ? '&#9744;' : '&#9723;';

      if (rememberState) {
        saveWindowState({
          width: windowEl.offsetWidth,
          height: windowEl.offsetHeight,
          isMaximized: currentIsMaximized,
        });
      }
    });
  }

  // Close on overlay click
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeWindow();
    }
  });

  // Drag functionality
  setupDrag(windowEl, windowEl.querySelector('.ma-config-header')!);

  // Resize functionality
  if (resizable) {
    setupResize(windowEl, rememberState);
  }

  // Focus on click
  windowEl.addEventListener('mousedown', () => {
    WindowManager.bringToFront(id);
  });

  // Callback
  onReady?.(windowEl);

  return windowEl;
}

/**
 * Setup drag functionality for window
 */
function setupDrag(windowEl: HTMLElement, handle: HTMLElement): void {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMouseDown = (e: MouseEvent) => {
    // Don't drag if clicking on buttons
    if ((e.target as HTMLElement).closest('.ma-config-controls')) return;

    // Don't drag if maximized
    if (windowEl.classList.contains('maximized')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = windowEl.offsetLeft;
    startTop = windowEl.offsetTop;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = Math.max(0, Math.min(window.innerWidth - 100, startLeft + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 50, startTop + dy));

    windowEl.style.left = `${newLeft}px`;
    windowEl.style.top = `${newTop}px`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  handle.addEventListener('mousedown', onMouseDown);
}

/**
 * Setup resize functionality for window
 */
function setupResize(windowEl: HTMLElement, saveState: boolean): void {
  const handles = windowEl.querySelectorAll('.ma-config-resize-handle');

  handles.forEach((handleEl) => {
    const handle = handleEl as HTMLElement;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startLeft = 0;
    let startTop = 0;

    const direction = Array.from(handle.classList).find(
      (c) => c !== 'ma-config-resize-handle'
    ) || '';

    const onMouseDown = (e: MouseEvent) => {
      // Don't resize if maximized
      if (windowEl.classList.contains('maximized')) return;

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = windowEl.offsetWidth;
      startHeight = windowEl.offsetHeight;
      startLeft = windowEl.offsetLeft;
      startTop = windowEl.offsetTop;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      e.preventDefault();
      e.stopPropagation();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = 400;
      const minHeight = 300;

      // Resize based on direction
      if (direction.includes('e')) {
        windowEl.style.width = `${Math.max(minWidth, startWidth + dx)}px`;
      }
      if (direction.includes('w')) {
        const newWidth = Math.max(minWidth, startWidth - dx);
        if (newWidth > minWidth) {
          windowEl.style.width = `${newWidth}px`;
          windowEl.style.left = `${startLeft + dx}px`;
        }
      }
      if (direction.includes('s')) {
        windowEl.style.height = `${Math.max(minHeight, startHeight + dy)}px`;
      }
      if (direction.includes('n')) {
        const newHeight = Math.max(minHeight, startHeight - dy);
        if (newHeight > minHeight) {
          windowEl.style.height = `${newHeight}px`;
          windowEl.style.top = `${startTop + dy}px`;
        }
      }
    };

    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Save state
      if (saveState) {
        saveWindowState({
          width: windowEl.offsetWidth,
          height: windowEl.offsetHeight,
          isMaximized: windowEl.classList.contains('maximized'),
        });
      }
    };

    handle.addEventListener('mousedown', onMouseDown);
  });
}

/**
 * Close a window by ID
 */
export function closeWindow(id: string): void {
  const windowEl = WindowManager.getWindow(id);
  if (windowEl) {
    const closeBtn = windowEl.querySelector('.ma-config-btn.close') as HTMLElement;
    closeBtn?.click();
  }
}

/**
 * Check if a window is open
 */
export function isWindowOpen(id: string): boolean {
  return WindowManager.isOpen(id);
}

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration = 3000
): void {
  const toast = document.createElement('div');
  toast.className = `ma-config-toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
