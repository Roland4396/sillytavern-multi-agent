/**
 * 神数据库 (shujuku) API 封装
 * 用于读取和操作 SillyTavern 中神数据库插件的数据
 */

// 声明全局 API 类型
declare global {
  interface Window {
    AutoCardUpdaterAPI?: ShujukuAPI;
  }
}

/**
 * 表格数据结构
 */
export interface SheetData {
  name: string;
  content: string[][];  // 二维数组表格内容
  sourceData: {
    headers: string[];
    [key: string]: unknown;
  };
}

/**
 * 表格数据集合
 */
export interface TableData {
  mate: {
    type: string;
    version?: number;
  };
  [key: `sheet_${number}`]: SheetData;
}

/**
 * 剧情预设结构
 */
export interface PlotPreset {
  name: string;
  promptGroup: Array<{
    role: string;
    content: string;
    enabled: boolean;
    mainSlot?: string;
  }>;
  finalSystemDirective?: string;
  rateMain: number;
  ratePersonal: number;
  rateErotic: number;
  rateCuckold: number;
  extractTags?: string;
  minLength?: number;
  contextTurnCount?: number;
}

/**
 * 神数据库 API 接口
 */
export interface ShujukuAPI {
  // 表格数据
  exportTableAsJson(): TableData;
  importTableAsJson(jsonString: string): Promise<boolean>;

  // 剧情预设
  getPlotPresets(): PlotPreset[];
  getPlotPresetNames(): string[];
  getCurrentPlotPreset(): string;
  switchPlotPreset(presetName: string): boolean;
  getPlotPresetDetails(presetName: string): PlotPreset | null;

  // 世界书操作
  syncWorldbookEntries(options?: { createIfNeeded?: boolean }): Promise<boolean>;

  // 回调注册
  registerTableUpdateCallback(callback: (data: TableData) => void): void;
  unregisterTableUpdateCallback(callback: (data: TableData) => void): void;
  registerTableFillStartCallback(callback: () => void): void;

  // 其他
  manualUpdate(): Promise<boolean>;
  triggerUpdate(): Promise<boolean>;
  openSettings(): Promise<boolean>;
  openVisualizer(): void;
}

/**
 * 检查神数据库 API 是否可用
 */
export function isShujukuAvailable(): boolean {
  return typeof window !== "undefined" && !!window.AutoCardUpdaterAPI;
}

/**
 * 获取神数据库 API
 */
export function getShujukuAPI(): ShujukuAPI | null {
  if (isShujukuAvailable()) {
    return window.AutoCardUpdaterAPI!;
  }
  return null;
}

/**
 * 获取当前表格数据
 */
export function getTableData(): TableData | null {
  const api = getShujukuAPI();
  if (!api) {
    console.warn("[MultiAgent] 神数据库 API 不可用");
    return null;
  }

  try {
    return api.exportTableAsJson();
  } catch (e) {
    console.error("[MultiAgent] 获取表格数据失败:", e);
    return null;
  }
}

/**
 * 获取当前剧情预设
 */
export function getCurrentPreset(): PlotPreset | null {
  const api = getShujukuAPI();
  if (!api) return null;

  const currentName = api.getCurrentPlotPreset();
  if (!currentName) return null;

  return api.getPlotPresetDetails(currentName);
}

/**
 * 将表格数据转换为结构化文本（用于注入到 prompt）
 */
export function tableDataToText(tableData: TableData): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tableData)) {
    if (key.startsWith("sheet_") && value && typeof value === "object") {
      const sheet = value as SheetData;
      lines.push(`## ${sheet.name}`);

      if (sheet.content && Array.isArray(sheet.content)) {
        // 第一行作为表头
        const headers = sheet.content[0] || [];
        lines.push(`| ${headers.join(" | ")} |`);
        lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

        // 数据行
        for (let i = 1; i < sheet.content.length; i++) {
          const row = sheet.content[i] || [];
          lines.push(`| ${row.join(" | ")} |`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * 监听表格数据更新
 */
export function onTableUpdate(callback: (data: TableData) => void): () => void {
  const api = getShujukuAPI();
  if (!api) {
    console.warn("[MultiAgent] 神数据库 API 不可用，无法监听更新");
    return () => {};
  }

  api.registerTableUpdateCallback(callback);

  // 返回取消监听的函数
  return () => {
    api.unregisterTableUpdateCallback(callback);
  };
}
