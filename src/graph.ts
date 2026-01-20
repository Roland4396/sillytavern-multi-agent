/**
 * LangGraph 图定义
 *
 * 流程:
 * Parser → Narrator → Director → Persona(s) → Director Evaluate → Composer → Output
 *                                    ↑              |
 *                                    └──── 重试 ────┘
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphStateAnnotation, type GraphState } from "./state";
import { parserNode } from "./agents/parser";
import { narratorNode } from "./agents/narrator";
import { directorNode, directorEvaluateNode } from "./agents/director";
import { personaNode } from "./agents/persona";
import { composerNode } from "./agents/composer";

/**
 * 路由函数：评估后决定下一步
 */
function routeAfterEvaluate(state: GraphState): "composer" | "persona" {
  if (state.formatCheckPassed) {
    return "composer";
  }
  // 重试 - 回到 persona
  return "persona";
}

/**
 * 创建 Multi-Agent 图
 */
export function createMultiAgentGraph() {
  // 创建状态图
  const workflow = new StateGraph(GraphStateAnnotation)
    // 添加节点
    .addNode("parser", parserNode)
    .addNode("narrator", narratorNode)
    .addNode("director", directorNode)
    .addNode("persona", personaNode)
    .addNode("evaluate", directorEvaluateNode)
    .addNode("composer", composerNode)

    // 定义边 - 线性流程
    .addEdge(START, "parser")
    .addEdge("parser", "narrator")
    .addEdge("narrator", "director")
    .addEdge("director", "persona")
    .addEdge("persona", "evaluate")

    // 条件边 - 评估后路由
    .addConditionalEdges("evaluate", routeAfterEvaluate, {
      composer: "composer",
      persona: "persona",  // 重试循环
    })

    // 结束
    .addEdge("composer", END);

  // 编译图
  return workflow.compile();
}

/**
 * 图实例（单例）
 */
let graphInstance: ReturnType<typeof createMultiAgentGraph> | null = null;

/**
 * 获取或创建图实例
 */
export function getGraph() {
  if (!graphInstance) {
    graphInstance = createMultiAgentGraph();
    console.log("[MultiAgent] LangGraph 图已创建");
  }
  return graphInstance;
}

/**
 * 执行图
 */
export async function runGraph(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const graph = getGraph();

  const initialState: Partial<GraphState> = {
    rawMessages: messages,
    personaOutputs: [],
    retryCount: 0,
  };

  console.log("[MultiAgent] 开始执行图...");

  try {
    // 执行图
    const result = await graph.invoke(initialState);

    console.log("[MultiAgent] 图执行完成");
    return result.finalOutput || "[无输出]";
  } catch (e) {
    console.error("[MultiAgent] 图执行失败:", e);
    throw e;
  }
}

/**
 * 流式执行图
 */
export async function* streamGraph(
  messages: Array<{ role: string; content: string }>
): AsyncGenerator<{ node: string; state: Partial<GraphState> }> {
  const graph = getGraph();

  const initialState: Partial<GraphState> = {
    rawMessages: messages,
    personaOutputs: [],
    retryCount: 0,
  };

  console.log("[MultiAgent] 开始流式执行图...");

  // 使用 stream 方法
  for await (const event of await graph.stream(initialState)) {
    for (const [nodeName, nodeState] of Object.entries(event)) {
      yield { node: nodeName, state: nodeState as Partial<GraphState> };
    }
  }
}
