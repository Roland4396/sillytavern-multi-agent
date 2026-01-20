/**
 * Sidebar Component
 *
 * Displays list of agents with selection state
 */

import type { AgentType } from '../../config/types';

/**
 * Agent display information
 */
interface AgentInfo {
  type: AgentType;
  name: string;
  icon: string;
  description: string;
}

/**
 * Agent list with display info
 */
const AGENTS: AgentInfo[] = [
  {
    type: 'narrator',
    name: 'Narrator',
    icon: '&#128214;', // Book emoji
    description: '叙事者 - 分析场景和更新世界状态',
  },
  {
    type: 'director',
    name: 'Director',
    icon: '&#127916;', // Clapper board emoji
    description: '导演 - 决定发言角色和上下文',
  },
  {
    type: 'persona',
    name: 'Persona',
    icon: '&#128100;', // Person emoji
    description: '角色代理 - 扮演指定角色生成回复',
  },
  {
    type: 'composer',
    name: 'Composer',
    icon: '&#9997;', // Writing hand emoji
    description: '整合者 - 合并角色回复为连贯叙事',
  },
];

/**
 * Sidebar options
 */
export interface SidebarOptions {
  selectedAgent: AgentType;
  modifiedAgents: Set<AgentType>;
  onAgentSelect: (agent: AgentType) => void;
}

/**
 * Create sidebar HTML
 */
export function createSidebarHTML(options: SidebarOptions): string {
  const { selectedAgent, modifiedAgents } = options;

  const agentItems = AGENTS.map((agent) => {
    const isActive = agent.type === selectedAgent;
    const isModified = modifiedAgents.has(agent.type);

    return `
      <div class="ma-config-agent-item ${isActive ? 'active' : ''}"
           data-agent="${agent.type}"
           title="${agent.description}">
        <span class="ma-config-agent-icon">${agent.icon}</span>
        <span class="ma-config-agent-name">${agent.name}</span>
        <span class="ma-config-agent-status ${isModified ? 'modified' : ''}"></span>
      </div>
    `;
  }).join('');

  return `
    <div class="ma-config-sidebar">
      <div class="ma-config-sidebar-title">Agents</div>
      <div class="ma-config-agent-list">
        ${agentItems}
      </div>
    </div>
  `;
}

/**
 * Setup sidebar event handlers
 */
export function setupSidebarEvents(
  container: HTMLElement,
  onAgentSelect: (agent: AgentType) => void
): void {
  const agentItems = container.querySelectorAll('.ma-config-agent-item');

  agentItems.forEach((item) => {
    item.addEventListener('click', () => {
      const agent = item.getAttribute('data-agent') as AgentType;
      if (agent) {
        onAgentSelect(agent);
      }
    });
  });
}

/**
 * Update sidebar selection state
 */
export function updateSidebarSelection(
  container: HTMLElement,
  selectedAgent: AgentType
): void {
  const agentItems = container.querySelectorAll('.ma-config-agent-item');

  agentItems.forEach((item) => {
    const agent = item.getAttribute('data-agent');
    item.classList.toggle('active', agent === selectedAgent);
  });
}

/**
 * Update sidebar modification status
 */
export function updateSidebarModified(
  container: HTMLElement,
  modifiedAgents: Set<AgentType>
): void {
  const agentItems = container.querySelectorAll('.ma-config-agent-item');

  agentItems.forEach((item) => {
    const agent = item.getAttribute('data-agent') as AgentType;
    const statusEl = item.querySelector('.ma-config-agent-status');
    if (statusEl) {
      statusEl.classList.toggle('modified', modifiedAgents.has(agent));
    }
  });
}

/**
 * Get agent display info
 */
export function getAgentInfo(agent: AgentType): AgentInfo | undefined {
  return AGENTS.find((a) => a.type === agent);
}
