# AI服务接入与上下文Prompt构建实现文档

## 一、项目概述

本实现完成了 VoiceEcho Read 应用的 AI 模块核心功能，采用 **Python 微服务 + React 前端** 的架构模式。主要包括：

- **Python AI 网关服务**：统一接入多种 AI 服务（Gemini、OpenAI、DeepSeek、Tongyi、Minimax、Qianfan）
- **智能上下文 Prompt 构建引擎**：自动聚合文档上下文
- **AI 状态管理与问答历史**：基于 Zustand 的状态管理
- **增强型 AI 问答面板组件**：支持多模型切换

---

## 二、技术架构

### 2.1 模块结构

```
项目根目录/
├── backend/                              # Python AI 网关
│   ├── ai_gateway.py                    # Flask API 服务
│   ├── requirements.txt                  # 依赖清单
│   └── .env.example                     # 环境变量示例
├── src/
│   └── ai/
│       ├── api/
│       │   └── aiGateway.ts             # 前端 API 调用层
│       ├── utils/
│       │   └── promptBuilder.ts         # Prompt 构建工具
│       ├── store/
│       │   └── aiStore.ts               # AI 状态管理
│       └── components/
│           └── AiQaPanel.tsx            # AI 问答面板组件
```

### 2.2 数据流架构

```
用户提问 → AiQaPanel → aiStore → aiGateway (HTTP) → Python AI Gateway → 目标AI服务
                                                                         ↓
                                                   promptBuilder ← readerStore (文档上下文)
```

### 2.3 多模型支持架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python AI Gateway (Flask)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      /api/v1/chat                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│          ┌───────────────────┼───────────────────┐              │
│          ▼                   ▼                   ▼              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │   Gemini    │    │   OpenAI    │    │  DeepSeek   │         │
│   │   Tongyi    │    │   Minimax   │    │   Qianfan   │         │
│   └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React 前端                                 │
│   aiGateway.ts → aiStore.ts → AiQaPanel.tsx                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、核心实现

### 3.1 Python AI 网关服务

**文件**: `backend/ai_gateway.py`

**功能特性**:
- 统一 RESTful API 接口
- 支持 6 种 AI 服务提供商
- 上下文感知问答
- 完整的错误处理机制

**支持的 AI 服务**:

| 服务 | 模型 | 基础URL |
|------|------|---------|
| Google Gemini | gemini-2.0-flash | generativelanguage.googleapis.com |
| OpenAI | gpt-3.5-turbo | api.openai.com/v1 |
| DeepSeek | deepseek-chat | api.deepseek.com/v1 |
| Tongyi (阿里云) | qwen-max | dashscope.aliyuncs.com |
| Minimax | abab6-chat | api.minimax.chat/v1 |
| Qianfan (百度) | ernie-3.5-turbo | qianfan.baidubce.com |

**API 端点**:

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/v1/chat` | POST | 发起 AI 问答 |
| `/api/v1/models` | GET | 获取可用模型列表 |
| `/api/v1/history/{model_id}` | GET | 获取问答历史 |
| `/api/v1/history/{model_id}` | DELETE | 清除问答历史 |
| `/api/v1/health` | GET | 健康检查 |

**请求格式**:

```json
{
  "model_id": "gemini",
  "question": "这段内容的核心观点是什么？",
  "context": "文档上下文内容...",
  "stream": false
}
```

**响应格式**:

```json
{
  "model_id": "gemini",
  "question": "这段内容的核心观点是什么？",
  "answer": "AI生成的回答...",
  "context_provided": true
}
```

### 3.2 前端 API 调用层

**文件**: `src/ai/api/aiGateway.ts`

**核心方法**:

| 方法名 | 功能 | 参数 |
|--------|------|------|
| `chat()` | 发起 AI 问答 | ChatRequest |
| `getModels()` | 获取模型列表 | - |
| `getHistory()` | 获取问答历史 | modelId |
| `clearHistory()` | 清除历史 | modelId |
| `askWithContext()` | 带上下文的问答 | question, context, modelId |

### 3.3 上下文 Prompt 构建引擎

**文件**: `src/ai/utils/promptBuilder.ts`

**功能特性**:
- 系统提示设定 AI 角色
- 自动聚合文档上下文（当前段 + 前后文）
- 支持多种提问类型

**Prompt 结构**:

```
┌─────────────────────────────────────────────────────┐
│ 系统提示（System Prompt）                           │
│ - AI 角色定义                                       │
│ - 回答风格要求                                       │
├─────────────────────────────────────────────────────┤
│ 文档上下文（Context）                               │
│ - 文档信息                                         │
│ - 前文回顾（前N段）                                 │
│ - 当前段落                                         │
│ - 后续预览（后N段）                                 │
├─────────────────────────────────────────────────────┤
│ 用户问题（User Question）                           │
│ - 快捷问题 / 自定义问题                             │
└─────────────────────────────────────────────────────┘
```

**支持的提问类型**:

| 类型 | 标签 | 说明 |
|------|------|------|
| `explain` | 核心观点 | 解释内容核心含义 |
| `summarize` | 简要总结 | 50字以内概括 |
| `elaborate` | 展开阐述 | 深入背景知识 |
| `qa` | 自定义 | 用户输入问题 |

### 3.4 AI 状态管理

**文件**: `src/ai/store/aiStore.ts`

**状态结构**:

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `currentModel` | string | 当前选中的模型 |
| `availableModels` | string[] | 可用模型列表 |
| `isConfigured` | boolean | 是否已配置 |
| `qaHistory` | QaItem[] | 问答历史列表 |
| `isLoading` | boolean | 加载状态 |
| `error` | string \| null | 错误信息 |

**核心方法**:

| 方法名 | 功能 |
|--------|------|
| `initializeService()` | 初始化服务，获取模型列表 |
| `switchModel()` | 切换 AI 模型 |
| `askQuestion()` | 发起 AI 提问 |
| `addManualQa()` | 手动添加问答 |
| `clearHistory()` | 清空历史 |
| `clearError()` | 清除错误 |

### 3.5 AI 问答面板组件

**文件**: `src/ai/components/AiQaPanel.tsx`

**功能特性**:
- 模型选择下拉框
- 快捷问题按钮（核心观点、简要总结、展开阐述）
- 自定义问题输入框
- 按段落筛选问答历史
- 友好的错误提示

**界面布局**:

```
┌──────────────────────────────────────┐
│ 💬 上下文 AI 助手          [模型选择] │
├──────────────────────────────────────┤
│ [错误提示区域 - 可选显示]              │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 问: 这段的核心观点是什么？       │ │
│ │ 答: AI 生成的回答内容...         │ │
│ └──────────────────────────────────┘ │
│ [问答历史列表]                       │
├──────────────────────────────────────┤
│ ┌─────┬─────┬─────┐                 │
│ │核心观点│简要总结│展开阐述│        │
│ └─────┴─────┴─────┘                 │
│ ┌─────────────────────────┬───────┐ │
│ │ [输入自定义问题...]      │ 发送  │ │
│ └─────────────────────────┴───────┘ │
└──────────────────────────────────────┘
```

---

## 四、使用说明

### 4.1 启动 Python AI 网关

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 设置环境变量（可选，使用.env文件）
cp .env.example .env
# 编辑 .env 文件，填入 API Key

# 启动服务
python ai_gateway.py
```

### 4.2 配置前端

在 `.env` 文件中配置网关地址：

```bash
VITE_AI_GATEWAY_URL=http://localhost:5000/api/v1
```

### 4.3 启动前端应用

```bash
npm run dev
```

### 4.4 功能测试

1. 确保 Python 网关已启动
2. 点击"导入测试课件"加载测试文档
3. 在右侧 AI 助手面板中：
   - 选择 AI 模型（下拉框）
   - 点击快捷按钮提问（核心观点/简要总结/展开阐述）
   - 或输入自定义问题后点击"发送"

---

## 五、关键技术亮点

### 5.1 多模型统一接口

通过 Python 网关实现了多种 AI 服务的统一接入，前端只需调用一个 API 即可切换不同模型：

```typescript
// 切换模型只需改参数
await aiGateway.askWithContext(question, context, 'gemini');
await aiGateway.askWithContext(question, context, 'openai');
await aiGateway.askWithContext(question, context, 'deepseek');
```

### 5.2 上下文感知

自动聚合当前段落的前后文信息，确保 AI 回答具有上下文连贯性：

```typescript
const context = promptBuilder.buildContext(document, currentIndex, 2, 1);
// 前看2段，后看1段
```

### 5.3 配置化管理

通过配置文件支持灵活的模型配置，新增模型只需添加配置项：

```python
config = {
    "new_model": {
        "api_key": "your-api-key",
        "base_url": "https://api.example.com/v1",
        "model": "model-name",
        "extra_body": {},
        "messages": []
    }
}
```

---

## 六、代码安全性

### 6.1 API Key 保护

- 使用环境变量注入，禁止硬编码
- `.env` 文件已加入 `.gitignore`
- 后端服务隔离，API Key 不在前端暴露

### 6.2 输入验证

- 空输入检测
- 输入长度限制
- 特殊字符过滤

### 6.3 错误处理

- 完善的错误捕获和友好提示
- 服务健康检查机制
- 连接超时处理

---

## 七、待扩展功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 流式响应 | 待实现 | 实时打字机效果 |
| 本地模型支持 | 待实现 | 基于 transformers 的本地推理 |
| 语音提问 | 待实现 | 结合 STT 模块 |
| 回答缓存 | 待实现 | 相同问题快速响应 |

---

*文档版本: v2.0*  
*创建日期: 2026-05-31*  
*适用范围: VoiceEcho Read AI 模块*
