/**
 * Persona Agent - 角色代理
 *
 * 职责:
 * 1. 扮演指定角色
 * 2. 根据角色设定和上下文生成回复
 * 3. 每个角色独立生成，互不干扰
 */

import { ChatOpenAI } from "@langchain/openai";
import type { GraphState, PersonaOutput } from "../state";
import { getConfigManager } from "../config/manager";

// Persona 使用的模型配置
interface PersonaModelConfig {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
  temperature?: number;
}

let personaModelConfig: PersonaModelConfig | null = null;

/**
 * 初始化 Persona 模型配置
 */
export function initPersonaModel(config: PersonaModelConfig) {
  personaModelConfig = config;
}

/**
 * 创建角色专用模型实例
 */
function createPersonaModel(characterName: string): ChatOpenAI | null {
  if (!personaModelConfig) {
    console.warn("[MultiAgent] Persona 模型未配置");
    return null;
  }

  return new ChatOpenAI({
    openAIApiKey: personaModelConfig.apiKey,
    configuration: {
      baseURL: personaModelConfig.baseURL,
    },
    modelName: personaModelConfig.modelName || "gpt-4o",
    temperature: personaModelConfig.temperature ?? 0.8,  // 较高温度增加创意
  });
}

/**
 * 单个角色生成回复
 */
async function generatePersonaResponse(
  characterName: string,
  context: string,
  presetInstructions: Record<string, string>
): Promise<PersonaOutput> {
  const model = createPersonaModel(characterName);

  if (!model) {
    return {
      characterName,
      content: `[${characterName} 无法回复 - 模型未配置]`,
      formatValid: false,
    };
  }

  try {
    // 构建 system prompt
    const systemPrompt = buildSystemPrompt(characterName, presetInstructions);

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: context },
    ]);

    const content = typeof response.content === "string" ? response.content : "";

    return {
      characterName,
      content,
      formatValid: content.length > 0,
    };
  } catch (e) {
    console.error(`[MultiAgent] Persona ${characterName} 生成失败:`, e);
    return {
      characterName,
      content: `[${characterName} 生成出错]`,
      formatValid: false,
    };
  }
}

/**
 * 构建角色的 system prompt
 * 使用 ConfigManager 获取可配置的模板
 */
function buildSystemPrompt(
  characterName: string,
  presetInstructions: Record<string, string>
): string {
  const configManager = getConfigManager();

  // 构建写作风格部分
  let fictionStyle = '';
  if (presetInstructions.fiction_style) {
    fictionStyle = `## 写作风格\n${presetInstructions.fiction_style}`;
  }

  // 构建写作规范部分
  let writingStyle = '';
  if (presetInstructions.Writing_style) {
    writingStyle = `## 写作规范\n${presetInstructions.Writing_style}`;
  }

  // 构建内容约束部分
  let contentConstraints = '';
  if (presetInstructions.content_constraints) {
    contentConstraints = `## 内容约束\n${presetInstructions.content_constraints}`;
  }

  // 从 ConfigManager 获取提示词模板并渲染
  return configManager.renderPrompt('persona', {
    characterName,
    fictionStyle,
    writingStyle,
    contentConstraints,
  });
}

/**
 * Persona 节点 - 为所有活跃角色生成回复
 * 支持并行执行
 */
export async function personaNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { activeCharacters, characterContexts, parsedInput } = state;

  if (!parsedInput || activeCharacters.length === 0) {
    return { personaOutputs: [] };
  }

  console.log("[MultiAgent] Persona 开始为角色生成回复:", activeCharacters);

  // 并行为所有角色生成回复
  const outputPromises = activeCharacters.map((charName) => {
    const context = characterContexts[charName] || "";
    return generatePersonaResponse(
      charName,
      context,
      parsedInput.presetInstructions
    );
  });

  const outputs = await Promise.all(outputPromises);

  console.log("[MultiAgent] Persona 完成生成:", outputs.length, "个回复");

  return { personaOutputs: outputs };
}
