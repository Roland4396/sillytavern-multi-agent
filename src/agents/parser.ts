/**
 * Parser Agent - 解析 SillyTavern 发送的原始消息
 *
 * 职责:
 * 1. 提取 XML 标签中的预设指令
 * 2. 分离角色设定和对话历史
 * 3. 识别用户当前输入
 * 4. 获取神数据库表格数据
 */

import type { GraphState, ParsedInput } from "../state";
import { getTableData } from "../utils/shujuku";

// 预设指令标签
const PRESET_TAGS = [
  "core_features",
  "fiction_style",
  "Writing_style",
  "additional_constraints",
  "content_constraints",
  "explicit_guidelines",
];

// 角色设定标签
const CHARACTER_TAGS = ["info_settings", "char", "user"];

// 历史标签
const HISTORY_TAGS = ["Interaction_history", "chat_history"];

/**
 * 从内容中提取 XML 标签
 */
function extractXmlTags(content: string): Record<string, string> {
  const tags: Record<string, string> = {};

  // 匹配 <tag>content</tag>
  const pattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    tags[match[1]] = match[2].trim();
  }

  return tags;
}

/**
 * 清理内容中的 XML 标签
 */
function stripXmlTags(content: string): string {
  return content
    .replace(/<\w+>[\s\S]*?<\/\w+>/g, "")
    .replace(/<\w+>/g, "")
    .trim();
}

/**
 * Parser 节点 - 解析原始消息
 */
export async function parserNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const rawMessages = state.rawMessages;

  const presetInstructions: Record<string, string> = {};
  const characterSettings: Record<string, string> = {};
  const chatHistory: Array<{ role: string; content: string }> = [];
  let userInput = "";

  // 遍历所有消息
  for (const msg of rawMessages) {
    const role = msg.role || "";
    const content = msg.content || "";

    // 提取 XML 标签
    const tags = extractXmlTags(content);

    // 分类标签
    for (const [tagName, tagContent] of Object.entries(tags)) {
      if (PRESET_TAGS.includes(tagName)) {
        presetInstructions[tagName] = tagContent;
      } else if (CHARACTER_TAGS.includes(tagName)) {
        characterSettings[tagName] = tagContent;
      } else if (HISTORY_TAGS.includes(tagName)) {
        // 历史标签内容加入历史
        chatHistory.push({
          role: "history",
          content: tagContent,
        });
      }
    }

    // 普通对话消息
    if (role === "assistant" || role === "user") {
      const cleanContent = stripXmlTags(content);
      if (cleanContent) {
        chatHistory.push({
          role,
          content: cleanContent,
        });
      }
    }
  }

  // 最后一条 user 消息作为当前输入
  for (let i = rawMessages.length - 1; i >= 0; i--) {
    if (rawMessages[i].role === "user") {
      userInput = stripXmlTags(rawMessages[i].content || "");
      if (userInput) break;
    }
  }

  // 获取神数据库表格数据
  const tableData = getTableData();

  const parsedInput: ParsedInput = {
    presetInstructions,
    characterSettings,
    chatHistory,
    userInput,
    tableData: tableData || undefined,
  };

  console.log("[MultiAgent] Parser 完成解析:", {
    presetCount: Object.keys(presetInstructions).length,
    characterCount: Object.keys(characterSettings).length,
    historyCount: chatHistory.length,
    hasTableData: !!tableData,
  });

  return { parsedInput };
}
