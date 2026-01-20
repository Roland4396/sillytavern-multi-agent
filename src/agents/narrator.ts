/**
 * Narrator Agent - 叙事者
 *
 * 职责:
 * 1. 理解当前场景和上下文
 * 2. 维护和更新世界状态 (WorldState)
 * 3. 追踪角色位置和在场状态
 * 4. 记录重要事件
 */

import { ChatOpenAI } from "@langchain/openai";
import type { GraphState, WorldState, Character } from "../state";
import { getConfigManager } from "../config/manager";

// Narrator 使用的模型（可配置）
let narratorModel: ChatOpenAI | null = null;

/**
 * 初始化 Narrator 模型
 */
export function initNarratorModel(config: {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
}) {
  narratorModel = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    configuration: {
      baseURL: config.baseURL,
    },
    modelName: config.modelName || "gpt-4o-mini",
    temperature: 0.3,  // 较低温度保证一致性
  });
}

/**
 * 从角色设定中提取角色列表
 */
function extractCharacters(
  characterSettings: Record<string, string>
): Record<string, Character> {
  const characters: Record<string, Character> = {};

  // 从 info_settings 或 char 中提取角色信息
  const charInfo = characterSettings.char || characterSettings.info_settings || "";

  // 简单的角色名提取（可以后续增强）
  // 假设格式: {{char}} 或直接的角色名
  const charMatch = charInfo.match(/name[:\s]*["']?(\w+)["']?/i);
  if (charMatch) {
    characters[charMatch[1]] = {
      name: charMatch[1],
      present: true,
      lastPosition: "当前场景",
    };
  }

  return characters;
}

/**
 * Narrator 节点 - 分析场景并更新世界状态
 */
export async function narratorNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { parsedInput, worldState: currentWorldState } = state;

  if (!parsedInput) {
    return { error: "Parser 未完成，无法执行 Narrator" };
  }

  // 如果没有配置模型，使用简单的规则更新
  if (!narratorModel) {
    console.log("[MultiAgent] Narrator 模型未配置，使用规则推断");

    const characters = extractCharacters(parsedInput.characterSettings);

    const newWorldState: WorldState = {
      scene: currentWorldState?.scene || "未知场景",
      time: currentWorldState?.time || "未知时间",
      characters: {
        ...currentWorldState?.characters,
        ...characters,
      },
      recentEvents: [
        ...(currentWorldState?.recentEvents || []),
        `用户输入: ${parsedInput.userInput.slice(0, 50)}...`,
      ].slice(-10),  // 保留最近10条事件
    };

    return { worldState: newWorldState };
  }

  // 使用 AI 模型分析场景
  try {
    // 从 ConfigManager 获取提示词模板
    const configManager = getConfigManager();
    const prompt = configManager.renderPrompt('narrator', {
      characterSettings: JSON.stringify(parsedInput.characterSettings, null, 2),
      chatHistory: parsedInput.chatHistory.slice(-5).map((h) => `${h.role}: ${h.content}`).join("\n"),
      userInput: parsedInput.userInput,
      worldState: JSON.stringify(currentWorldState, null, 2),
    });

    const response = await narratorModel.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const newWorldState = JSON.parse(jsonMatch[0]) as WorldState;
      console.log("[MultiAgent] Narrator 更新世界状态:", newWorldState);
      return { worldState: newWorldState };
    }
  } catch (e) {
    console.error("[MultiAgent] Narrator 分析失败:", e);
  }

  // 失败时返回当前状态
  return { worldState: currentWorldState };
}
