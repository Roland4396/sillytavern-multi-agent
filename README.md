# SillyTavern Multi-Agent Middleware

基于 LangGraph 的多智能体角色扮演中间件，支持可视化提示词配置。

## 功能特性

- **多智能体协作**: Narrator(叙事者) → Director(导演) → Persona(角色) → Composer(整合者)
- **可视化配置器**: 图形化编辑各 Agent 的提示词模板
- **变量系统**: 支持 `{{variable}}` 模板变量，实时预览
- **持久化存储**: 自动保存到 SillyTavern 设置
- **导入导出**: JSON 格式配置文件，方便备份分享
- **神数据库集成**: 可读取神数据库表格数据

## 安装方式

### 方式 1: 酒馆助手脚本 (推荐)

1. 在 SillyTavern 中打开"酒馆助手"
2. 导入脚本，添加内容：
```javascript
import 'https://cdn.jsdelivr.net/gh/Roland4396/sillytavern-multi-agent@main/dist/index.js'
```

### 方式 2: 手动加载

在浏览器控制台执行：
```javascript
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/Roland4396/sillytavern-multi-agent@main/dist/index.js';
document.head.appendChild(script);
```

## 使用方法

### 打开配置器
```javascript
MultiAgentAPI.openConfigurator()
```

### 初始化模型
```javascript
MultiAgentAPI.init({
  default: {
    apiKey: 'your-api-key',
    baseURL: 'https://api.openai.com/v1',
    modelName: 'gpt-4o'
  }
});
```

### 执行多智能体流程
```javascript
const result = await MultiAgentAPI.run(messages);
```

## API 参考

| 方法 | 说明 |
|------|------|
| `openConfigurator()` | 打开可视化配置窗口 |
| `closeConfigurator()` | 关闭配置窗口 |
| `toggleConfigurator()` | 切换配置窗口 |
| `getPrompts()` | 获取当前提示词配置 |
| `setPrompts(config)` | 设置提示词配置 |
| `exportConfig()` | 导出配置为 JSON |
| `importConfig(json)` | 导入 JSON 配置 |
| `resetToDefaults()` | 重置为默认配置 |
| `init(config)` | 初始化模型配置 |
| `run(messages)` | 执行多智能体流程 |
| `stream(messages)` | 流式执行 |

## 项目结构

```
src/
├── config/                    # 配置系统
│   ├── types.ts              # 类型定义
│   ├── defaults.ts           # 默认提示词
│   ├── storage.ts            # 存储适配器
│   └── manager.ts            # 配置管理器
├── configurator/             # 可视化配置器
│   ├── styles.ts             # CSS 样式
│   ├── window.ts             # 窗口系统
│   └── components/           # UI 组件
├── agents/                   # 智能体实现
│   ├── narrator.ts           # 叙事者
│   ├── director.ts           # 导演
│   ├── persona.ts            # 角色代理
│   └── composer.ts           # 整合者
├── utils/
│   └── shujuku.ts            # 神数据库集成
├── graph.ts                  # LangGraph 流程图
├── state.ts                  # 状态定义
└── index.ts                  # 入口文件
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 许可证

MIT
