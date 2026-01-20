/**
 * SillyTavern Multi-Agent Middleware
 *
 * 入口文件 - 暴露 API 到 window 对象
 */

import { runGraph, streamGraph, getGraph } from "./graph";
import { GraphStateAnnotation, type GraphState } from "./state";
import {
  initNarratorModel,
  initDirectorModel,
  initPersonaModel,
  initComposerModel,
} from "./agents";
import {
  openConfigurator,
  closeConfigurator,
  isConfiguratorOpen,
  toggleConfigurator,
} from "./configurator";
import { getConfigManager } from "./config/manager";
import type { MultiAgentPromptConfig } from "./config/types";

/**
 * 模型配置接口
 */
interface ModelConfig {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
  temperature?: number;
}

/**
 * 完整配置接口
 */
interface MultiAgentConfig {
  // 各 Agent 使用的模型
  narrator?: ModelConfig;
  director?: ModelConfig;
  persona?: ModelConfig;
  composer?: ModelConfig;

  // 默认模型（如果某个 Agent 没有单独配置）
  default?: ModelConfig;
}

/**
 * Multi-Agent API
 */
const MultiAgentAPI = {
  /**
   * 版本号
   */
  version: "1.0.0",

  /**
   * 初始化配置
   */
  init(config: MultiAgentConfig) {
    console.log("[MultiAgent] 初始化配置...");

    const defaultConfig = config.default;
    const hasDefault = defaultConfig?.apiKey;

    // 初始化各模型
    if (config.narrator || hasDefault) {
      const modelConfig = { ...defaultConfig, ...config.narrator } as ModelConfig;
      initNarratorModel(modelConfig);
    }

    if (config.director || hasDefault) {
      const modelConfig = { ...defaultConfig, ...config.director } as ModelConfig;
      initDirectorModel(modelConfig);
    }

    if (config.persona || hasDefault) {
      const modelConfig = { ...defaultConfig, ...config.persona } as ModelConfig;
      initPersonaModel(modelConfig);
    }

    if (config.composer || hasDefault) {
      const modelConfig = { ...defaultConfig, ...config.composer } as ModelConfig;
      initComposerModel(modelConfig);
    }

    console.log("[MultiAgent] 配置完成");
  },

  /**
   * 执行 Multi-Agent 流程
   */
  async run(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    return runGraph(messages);
  },

  /**
   * 流式执行
   */
  stream: streamGraph,

  /**
   * 获取图实例（高级用法）
   */
  getGraph,

  /**
   * 状态注解（高级用法）
   */
  StateAnnotation: GraphStateAnnotation,

  // ===== 可视化配置器 API =====

  /**
   * 打开配置器窗口
   */
  openConfigurator,

  /**
   * 关闭配置器窗口
   */
  closeConfigurator,

  /**
   * 检查配置器是否打开
   */
  isConfiguratorOpen,

  /**
   * 切换配置器窗口
   */
  toggleConfigurator,

  /**
   * 获取当前提示词配置
   */
  getPrompts(): MultiAgentPromptConfig {
    return getConfigManager().getConfig();
  },

  /**
   * 设置提示词配置
   */
  async setPrompts(config: Partial<MultiAgentPromptConfig>): Promise<void> {
    const manager = getConfigManager();
    const currentConfig = manager.getConfig();
    await manager.setConfig({ ...currentConfig, ...config } as MultiAgentPromptConfig);
  },

  /**
   * 导出配置为 JSON 字符串
   */
  async exportConfig(): Promise<string> {
    return getConfigManager().exportConfig();
  },

  /**
   * 从 JSON 字符串导入配置
   */
  async importConfig(json: string): Promise<void> {
    await getConfigManager().importConfig(json);
  },

  /**
   * 重置所有配置为默认值
   */
  async resetToDefaults(): Promise<void> {
    await getConfigManager().resetAll();
  },
};

// 暴露到 window
declare global {
  interface Window {
    MultiAgentAPI?: typeof MultiAgentAPI;
  }
}

if (typeof window !== "undefined") {
  window.MultiAgentAPI = MultiAgentAPI;
  console.log("[MultiAgent] API 已挂载到 window.MultiAgentAPI");
}

// 导出
export default MultiAgentAPI;
export { MultiAgentAPI };
export type { ModelConfig, MultiAgentConfig, GraphState };
