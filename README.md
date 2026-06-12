# Voice Echo Read

一个集成了文档阅读、语音控制和 AI 问答功能的 Web 应用。
项目地址：https://github.com/LiuHaonuo/HCI-voice-echo-read

## 功能特性

- 📄 支持多种文档格式（PDF、Word 等）
- 🎤 语音控制文档阅读
- 🤖 AI 智能问答（支持多个 AI 模型）
- 📝 文档标注和笔记功能
- 🎨 现代化的用户界面

## 本地构建启动

### 前端构建

```bash
# 安装依赖
npm install
# 开发模式启动
npm run dev
```

### 后端启动

```bash
# 进入后端目录
cd backend
# 创建虚拟环境（首次运行）
python -m venv venv
# 激活虚拟环境
venv\Scripts\activate
# 安装依赖
pip install -r requirements.txt
# 启动后端服务
python backend.py
```

### 配置 AI 密钥

在 `backend` 目录下复制 `.env.example` 文件为 `.env`，然后配置你的 AI API 密钥：

```env
# DeepSeek API 配置
DEEPSEEK_API_KEY=your-deepseek-api-key

# 通义千问 API 配置
TONGYI_API_KEY=your-tongyi-api-key

# MiniMax API 配置
MINIMAX_API_KEY=your-minimax-api-key

# 百度千帆 API 配置
QIANFAN_API_KEY=your-qianfan-api-key
```

### 访问应用

按照命令行提示启动前端应用(`http://localhost:5173`)