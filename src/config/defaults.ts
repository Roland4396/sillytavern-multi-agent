/**
 * Default Prompt Configurations
 *
 * Contains default prompts extracted from original hardcoded agent implementations
 */

import type { MultiAgentPromptConfig, AgentPromptConfig } from './types';

/**
 * Narrator default configuration
 * Source: narrator.ts:96-120
 */
export const DEFAULT_NARRATOR_CONFIG: AgentPromptConfig = {
  systemPrompt: `你是一个叙事分析师。根据以下信息，分析当前场景状态。

## 角色设定
{{characterSettings}}

## 最近对话
{{chatHistory}}

## 用户当前输入
{{userInput}}

## 当前世界状态
{{worldState}}

请以 JSON 格式返回更新后的世界状态:
{
  "scene": "场景描述",
  "time": "时间",
  "characters": {
    "角色名": { "name": "名字", "present": true/false, "lastPosition": "位置" }
  },
  "recentEvents": ["事件1", "事件2"]
}

只返回 JSON，不要其他内容。`,
  temperature: 0.3,
  variables: [
    {
      name: 'characterSettings',
      description: '角色设定 JSON',
      example: '{"char": "Alice是一个友善的AI助手"}',
    },
    {
      name: 'chatHistory',
      description: '最近对话历史',
      example: 'user: 你好\nassistant: 你好！有什么可以帮助你的？',
    },
    {
      name: 'userInput',
      description: '用户当前输入',
      example: '我想了解更多关于这个世界的信息',
    },
    {
      name: 'worldState',
      description: '当前世界状态 JSON',
      example: '{"scene": "咖啡厅", "time": "下午"}',
    },
  ],
};

/**
 * Director default configuration
 * Source: director.ts:78-97
 */
export const DEFAULT_DIRECTOR_CONFIG: AgentPromptConfig = {
  systemPrompt: `你是一个角色扮演导演。根据当前场景，决定哪些角色应该发言。

## 世界状态
{{worldState}}

## 用户输入
{{userInput}}

## 在场角色
{{presentCharacters}}

请决定发言角色及顺序，以 JSON 数组返回角色名:
["角色1", "角色2"]

规则:
- 只有在场角色可以发言
- 根据情境决定谁应该回应
- 通常1-3个角色发言

只返回 JSON 数组，不要其他内容。`,
  temperature: 0.2,
  variables: [
    {
      name: 'worldState',
      description: '世界状态 JSON',
      example: '{"scene": "咖啡厅", "characters": {"Alice": {"present": true}}}',
    },
    {
      name: 'userInput',
      description: '用户输入内容',
      example: '大家好，今天天气真不错',
    },
    {
      name: 'presentCharacters',
      description: '在场角色名列表',
      example: 'Alice, Bob, Charlie',
    },
  ],
};

/**
 * Persona default configuration
 * Source: persona.ts:96-131
 */
export const DEFAULT_PERSONA_CONFIG: AgentPromptConfig = {
  systemPrompt: `你正在扮演角色: {{characterName}}

{{fictionStyle}}

{{writingStyle}}

{{contentConstraints}}

## 重要规则
1. 只扮演你被分配的角色，不要扮演其他角色
2. 保持角色性格一致
3. 根据场景自然地回应
4. 不要打破第四面墙`,
  userPromptTemplate: `{{characterContext}}`,
  temperature: 0.8,
  variables: [
    {
      name: 'characterName',
      description: '当前扮演的角色名',
      example: 'Alice',
    },
    {
      name: 'fictionStyle',
      description: '写作风格设定',
      example: '## 写作风格\n使用细腻的描写，注重情感表达',
    },
    {
      name: 'writingStyle',
      description: '写作规范',
      example: '## 写作规范\n使用第一人称视角',
    },
    {
      name: 'contentConstraints',
      description: '内容约束',
      example: '## 内容约束\n保持内容积极向上',
    },
    {
      name: 'characterContext',
      description: 'Director 为角色准备的上下文',
      example: '## 你是 Alice\n## 当前场景: 咖啡厅\n## 用户说: 你好',
    },
  ],
};

/**
 * Composer default configuration
 * Source: composer.ts:71-92
 */
export const DEFAULT_COMPOSER_CONFIG: AgentPromptConfig = {
  systemPrompt: `你是一个叙事整合者。将多个角色的回复整合成一段连贯的叙事。

## 世界状态
场景: {{scene}}
时间: {{time}}

## 各角色回复
{{personaOutputs}}

## 任务
将以上角色回复整合成一段流畅、连贯的叙事文本。
- 保持每个角色的独特声音和风格
- 添加必要的场景描写和过渡
- 使用第三人称叙事（如果合适）
- 保留对话和动作的生动性

直接输出整合后的文本，不要添加任何解释。`,
  temperature: 0.5,
  variables: [
    {
      name: 'scene',
      description: '当前场景',
      example: '咖啡厅的角落',
    },
    {
      name: 'time',
      description: '当前时间',
      example: '下午三点',
    },
    {
      name: 'personaOutputs',
      description: '各角色的回复内容',
      example: '### Alice\n"你好！"\n\n### Bob\n*点了点头*',
    },
  ],
};

/**
 * Complete default configuration
 */
export const DEFAULT_CONFIG: MultiAgentPromptConfig = {
  version: '1.0.0',
  narrator: DEFAULT_NARRATOR_CONFIG,
  director: DEFAULT_DIRECTOR_CONFIG,
  persona: DEFAULT_PERSONA_CONFIG,
  composer: DEFAULT_COMPOSER_CONFIG,
};

/**
 * Get a deep copy of the default configuration
 */
export function getDefaultConfig(): MultiAgentPromptConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
