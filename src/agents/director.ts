/**
 * Director Agent - 导演
 *
 * 职责:
 * 1. 决定哪些角色应该在本轮发言
 * 2. 为每个角色准备上下文（信息可见性控制）
 * 3. 评估 Persona 输出格式是否正确
 */

import { ChatOpenAI } from "@langchain/openai";
import type { GraphState } from "../state";
import { getConfigManager } from "../config/manager";

// Director 使用的模型（推荐用强模型如 Opus）
let directorModel: ChatOpenAI | null = null;

/**
 * 初始化 Director 模型
 */
export function initDirectorModel(config: {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
}) {
  directorModel = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    configuration: {
      baseURL: config.baseURL,
    },
    modelName: config.modelName || "claude-3-opus-20240229",
    temperature: 0.2,  // 低温度保证决策一致性
  });
}

/**
 * Director 节点 - 决定发言角色
 */
export async function directorNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { parsedInput, worldState } = state;

  if (!parsedInput || !worldState) {
    return { error: "缺少必要状态，无法执行 Director" };
  }

  // 获取所有在场角色
  const presentCharacters = Object.values(worldState.characters)
    .filter((c) => c.present)
    .map((c) => c.name);

  if (presentCharacters.length === 0) {
    console.warn("[MultiAgent] 没有在场角色");
    return { activeCharacters: [], characterContexts: {} };
  }

  // 如果没有配置模型，所有在场角色都发言
  if (!directorModel) {
    console.log("[MultiAgent] Director 模型未配置，所有在场角色发言");

    const characterContexts: Record<string, string> = {};
    for (const charName of presentCharacters) {
      // 为每个角色准备上下文
      characterContexts[charName] = buildCharacterContext(
        charName,
        parsedInput,
        worldState
      );
    }

    return {
      activeCharacters: presentCharacters,
      characterContexts,
    };
  }

  // 使用 AI 决定发言顺序
  try {
    // 从 ConfigManager 获取提示词模板
    const configManager = getConfigManager();
    const prompt = configManager.renderPrompt('director', {
      worldState: JSON.stringify(worldState, null, 2),
      userInput: parsedInput.userInput,
      presentCharacters: presentCharacters.join(", "),
    });

    const response = await directorModel.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const activeCharacters = JSON.parse(jsonMatch[0]) as string[];

      // 过滤只保留有效的在场角色
      const validCharacters = activeCharacters.filter((c) =>
        presentCharacters.includes(c)
      );

      const characterContexts: Record<string, string> = {};
      for (const charName of validCharacters) {
        characterContexts[charName] = buildCharacterContext(
          charName,
          parsedInput,
          worldState
        );
      }

      console.log("[MultiAgent] Director 决定发言角色:", validCharacters);
      return { activeCharacters: validCharacters, characterContexts };
    }
  } catch (e) {
    console.error("[MultiAgent] Director 决策失败:", e);
  }

  // 失败时返回所有在场角色
  const characterContexts: Record<string, string> = {};
  for (const charName of presentCharacters) {
    characterContexts[charName] = buildCharacterContext(
      charName,
      parsedInput,
      worldState
    );
  }

  return {
    activeCharacters: presentCharacters,
    characterContexts,
  };
}

/**
 * 为角色构建上下文（信息可见性控制）
 */
function buildCharacterContext(
  characterName: string,
  parsedInput: NonNullable<GraphState["parsedInput"]>,
  worldState: NonNullable<GraphState["worldState"]>
): string {
  const lines: string[] = [];

  // 角色只能看到与自己相关的设定
  lines.push(`## 你是 ${characterName}`);

  // 场景信息（公开）
  lines.push(`## 当前场景: ${worldState.scene}`);
  lines.push(`## 时间: ${worldState.time}`);

  // 其他在场角色（公开）
  const otherCharacters = Object.values(worldState.characters)
    .filter((c) => c.present && c.name !== characterName)
    .map((c) => c.name);

  if (otherCharacters.length > 0) {
    lines.push(`## 在场的其他人: ${otherCharacters.join(", ")}`);
  }

  // 最近事件（角色可能知道的）
  if (worldState.recentEvents.length > 0) {
    lines.push(`## 最近发生的事:`);
    lines.push(worldState.recentEvents.slice(-5).join("\n"));
  }

  // 用户输入
  lines.push(`## 用户说/做:`);
  lines.push(parsedInput.userInput);

  return lines.join("\n\n");
}

/**
 * Director Evaluate 节点 - 评估输出格式
 * 只检查格式，不做语义判断
 */
export async function directorEvaluateNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { personaOutputs, retryCount } = state;

  // 检查所有 persona 输出的格式
  const allValid = personaOutputs.every((output) => {
    // 基本格式检查
    if (!output.content || output.content.trim().length === 0) {
      return false;
    }

    // 检查是否包含角色名标识（可配置）
    // 例如: "【角色名】内容" 或 "*角色名*: 内容"
    // 这里暂时宽松处理
    return true;
  });

  if (allValid) {
    console.log("[MultiAgent] Director Evaluate: 格式检查通过");
    return { formatCheckPassed: true };
  }

  // 格式不通过，检查重试次数
  const maxRetries = 3;
  if (retryCount >= maxRetries) {
    console.warn("[MultiAgent] Director Evaluate: 达到最大重试次数");
    return { formatCheckPassed: true };  // 强制通过
  }

  console.log(`[MultiAgent] Director Evaluate: 格式检查失败，重试 ${retryCount + 1}/${maxRetries}`);
  return {
    formatCheckPassed: false,
    retryCount: retryCount + 1,
    personaOutputs: [],  // 清空输出，准备重试
  };
}
