/**
 * Composer Agent - 整合者
 *
 * 职责:
 * 1. 接收所有 Persona 的输出
 * 2. 整合成连贯的叙事文本
 * 3. 确保输出格式符合预期
 */

import { ChatOpenAI } from "@langchain/openai";
import type { GraphState, PersonaOutput } from "../state";
import { getConfigManager } from "../config/manager";

// Composer 使用的模型
let composerModel: ChatOpenAI | null = null;

/**
 * 初始化 Composer 模型
 */
export function initComposerModel(config: {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
}) {
  composerModel = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    configuration: {
      baseURL: config.baseURL,
    },
    modelName: config.modelName || "gpt-4o",
    temperature: 0.5,
  });
}

/**
 * 简单拼接模式（无 AI）
 */
function simpleCompose(outputs: PersonaOutput[]): string {
  return outputs
    .filter((o) => o.formatValid && o.content)
    .map((o) => {
      // 如果内容没有角色标识，添加一个
      if (!o.content.includes(o.characterName)) {
        return `【${o.characterName}】\n${o.content}`;
      }
      return o.content;
    })
    .join("\n\n---\n\n");
}

/**
 * Composer 节点 - 整合所有角色回复
 */
export async function composerNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { personaOutputs, parsedInput, worldState } = state;

  if (personaOutputs.length === 0) {
    return { finalOutput: "[没有角色回复]" };
  }

  // 如果没有配置模型，使用简单拼接
  if (!composerModel) {
    console.log("[MultiAgent] Composer 模型未配置，使用简单拼接");
    const output = simpleCompose(personaOutputs);
    return { finalOutput: output };
  }

  // 使用 AI 整合
  try {
    // 从 ConfigManager 获取提示词模板
    const configManager = getConfigManager();

    // 构建角色输出文本
    const personaOutputsText = personaOutputs
      .map((o) => `### ${o.characterName}\n${o.content}`)
      .join("\n\n");

    const prompt = configManager.renderPrompt('composer', {
      scene: worldState?.scene || "未知",
      time: worldState?.time || "未知",
      personaOutputs: personaOutputsText,
    });

    const response = await composerModel.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    if (content) {
      console.log("[MultiAgent] Composer 完成整合");
      return { finalOutput: content };
    }
  } catch (e) {
    console.error("[MultiAgent] Composer 整合失败:", e);
  }

  // 失败时使用简单拼接
  const output = simpleCompose(personaOutputs);
  return { finalOutput: output };
}
