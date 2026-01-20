/**
 * State 定义 - LangGraph 共享状态
 */

import { Annotation } from "@langchain/langgraph";

/**
 * 角色信息
 */
export interface Character {
  name: string;
  present: boolean;  // 是否在场
  lastPosition: string;  // 最后位置
  description?: string;  // 角色描述
}

/**
 * 世界状态 - Narrator 维护
 */
export interface WorldState {
  scene: string;  // 当前场景
  time: string;  // 时间
  characters: Record<string, Character>;  // 角色状态
  recentEvents: string[];  // 最近事件
}

/**
 * 解析后的输入
 */
export interface ParsedInput {
  presetInstructions: Record<string, string>;  // 预设指令
  characterSettings: Record<string, string>;  // 角色设定
  chatHistory: Array<{ role: string; content: string }>;  // 对话历史
  userInput: string;  // 用户当前输入
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableData?: any;  // 神数据库表格数据（TableData 类型）
}

/**
 * 单个 Persona 的输出
 */
export interface PersonaOutput {
  characterName: string;
  content: string;
  formatValid: boolean;
}

/**
 * LangGraph 状态注解
 * 使用 Annotation 定义状态结构和 reducer
 */
export const GraphStateAnnotation = Annotation.Root({
  // 原始消息
  rawMessages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (_, y) => y,  // 直接替换
    default: () => [],
  }),

  // 解析后的输入
  parsedInput: Annotation<ParsedInput | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // 世界状态
  worldState: Annotation<WorldState | null>({
    reducer: (x, y) => y ?? x,  // 更新或保持
    default: () => null,
  }),

  // Director 决策 - 本轮应发言的角色
  activeCharacters: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),

  // 每个角色看到的上下文
  characterContexts: Annotation<Record<string, string>>({
    reducer: (_, y) => y,
    default: () => ({}),
  }),

  // Persona 输出 - 可累加
  personaOutputs: Annotation<PersonaOutput[]>({
    reducer: (x, y) => [...x, ...y],  // 累加
    default: () => [],
  }),

  // 评估结果
  formatCheckPassed: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),

  // 重试计数
  retryCount: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),

  // 最终输出
  finalOutput: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),

  // 错误信息
  error: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
});

/**
 * 状态类型
 */
export type GraphState = typeof GraphStateAnnotation.State;
