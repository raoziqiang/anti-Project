# 🐾 AI 跨平台桌面元气伴侣 (AI Desktop Pet & Agent Hub)

跨平台（Windows / macOS / Linux）AI 桌面宠物应用，具备**媒体自动二次元/卡通化形象定制**、**各大主流大模型网关直连**以及**与各大 Agent 工具（Claude Desktop、Cursor、Antigravity、AutoGPT 等）无缝协作**的能力。

---

## 🌟 核心特性

### 1. 跨平台桌面悬浮交互 (Cross-Platform Desktop Pet)
- **透明无边框悬浮窗**：置顶悬浮在桌面最上层，写代码与办公时始终贴心陪伴。
- **物理动画与表情状态**：支持 `idle`(待机呼吸), `happy`(开心/爱心), `thinking`(思考/气泡), `surprised`(惊讶), `sleeping`(休憩), `celebrating`(庆祝彩带) 等多种动态表情。
- **鼠标穿透与拖拽**：支持随时随地自由拖动位置；可一键开启鼠标点击穿透，不遮挡底层工作流。
- **系统托盘集成**：支持快速切换伴侣形象、显示/隐藏、打开控制中心及退出。

### 2. 自由媒体二次元 / 卡通化形象工坊 (Stylize Studio)
- **任意媒体上传**：支持将真实猫狗照片、自拍头像、插画截图一键转化为桌面伴侣。
- **多引擎支持**：
  - ⚡ **内置免 Key 离线算法引擎**：通过 Canvas 实时进行 Sobel 边缘提取 (Anime Outlines)、赛璐珞色阶分离 (Cel-shading)、色彩鲜艳度提升以及自动背景透明化抠图。
  - ☁️ **云端大模型生图**：支持直接调用 SiliconFlow FLUX、OpenAI DALL-E、Gemini 等生成高精度的动漫贴纸角色。
- **多风格预设与倾向调节 (Prompt Guidance)**：
  - 🌸 **二次元日漫风** (Classic Anime)
  - 🎬 **皮克斯3D卡通** (3D Pixar Mascot)
  - 🧸 **Q版黏土萌宠** (Chibi Kawaii)
  - ⚡ **赛博朋克霓虹** (Cyberpunk Tech)
  - 🍃 **吉卜力水彩** (Ghibli Whimsical)
  - 👾 **复古像素画** (Retro Pixel Art)
- **全套表情包自动派生**：为自定义形象一键生成喜怒哀乐等多表情精灵图并实时保存。

### 3. 多模型厂商大模型网关 (Multi-LLM Gateway)
- **原生支持主流模型**：
  - **DeepSeek** (DeepSeek-V3, DeepSeek-R1 深度推理)
  - **SiliconFlow (硅基流动)** (高可用聚合云)
  - **Google Gemini** (Gemini 2.5 Flash, Gemini 2.0 Pro)
  - **OpenAI** (GPT-4o, GPT-4o-mini, o1)
  - **Anthropic Claude** (Claude 3.5 Sonnet)
  - **Ollama 本地大模型** (100% 离线私有化运行，支持 Qwen、Llama 等)
  - **自定义 OpenAI-Compatible 接口** (Moonshot Kimi、Zhipu GLM、OpenRouter、Groq 等)
- **流式对话与打字机效果**：即时流式输出并同步至伴侣漫画气泡。
- **Web Speech / TTS 语音朗读**：支持配置语调 (Pitch) 与语速 (Rate)，伴侣语音交互更自然。

### 4. 无缝衔接各大 Agent 生态 (Agent Ecosystem & MCP Hub)
- **内置 MCP (Model Context Protocol) 服务**：
  - 遵循标准 MCP 规范（`v2024-11-05`），Claude Desktop、Cursor、Antigravity IDE、Cline 等现代 Agent 可以直接将桌面宠物作为外部工具调用！
  - 暴露的标准工具：
    - `pet_notify`: 弹出桌面气泡提醒与表情
    - `pet_set_emotion`: 改变宠物面部表情与动作
    - `pet_speak`: 伴侣语音朗读台词
    - `pet_ask_user`: 向桌面用户发起选项决策并同步等待用户点击回调
    - `pet_get_status`: 查询当前宠物运行状态
- **本地 RESTful API & WebSocket 实时网关 (端口 18989)**：
  - 任何 Python 脚本、Bash 命令行、AutoGPT、LangChain 或 CI/CD 流水线均可通过极简 HTTP 请求控制宠物！
  - 包含实时双向 WebSocket 通信通道（`/ws`）。
- **内置调试器与一键配置生成器**：
  - 内置控制中心提供 Claude Desktop `claude_desktop_config.json`、Cursor `.mcp.json`、Python 请求范例、cURL 单行命令以及 Git Hook 脚本，1 秒复制即用！

---

## 🚀 快速启动指南

### 1. 运行本地开发预览与调试 (Web 模式)
```bash
# 启动本地 Agent 通信网关 (端口 18989)
npm run server

# 启动前端热重载开发服务器 (端口 5173)
npm run dev
```
打开浏览器访问 [http://localhost:5173/](http://localhost:5173/) 即可体验伴侣互动、形象工坊与模型调试。

### 2. 启动原生桌面透明悬浮应用 (Electron 模式)
```bash
# 启动透明置顶桌面应用
npm start
```
伴侣窗口将直接悬浮于电脑屏幕右下角，托盘常驻。

---

## 🔌 接入各大 Agent 示例

### 1. Claude Desktop 配置
在 Claude Desktop 配置文件（Windows: `%APPDATA%\Claude\claude_desktop_config.json`，macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`）中添加：

```json
{
  "mcpServers": {
    "desktop-pet": {
      "command": "node",
      "args": ["d:/Z1848/Documents/anti Project/electron/mcp-server.cjs"]
    }
  }
}
```

### 2. Cursor / Antigravity IDE 配置
在项目根目录创建或编辑 `.mcp.json`：

```json
{
  "mcpServers": {
    "desktop-pet": {
      "command": "node",
      "args": ["d:/Z1848/Documents/anti Project/electron/mcp-server.cjs"]
    }
  }
}
```

### 3. Python 脚本 / 自动化工作流驱动
```python
import requests

# 任务完成后向用户桌面宠物发送庆祝提醒
requests.post("http://localhost:18989/api/notify", json={
    "source": "My Agent",
    "title": "数据爬取完成",
    "message": "成功处理 2,000 个任务，准备进入下一步！",
    "emotion": "celebrating",
    "sound": True
})

# 同步询问用户决策
resp = requests.post("http://localhost:18989/api/ask", json={
    "question": "检测到代码存在 3 个潜在优化项，是否自动修复？",
    "options": ["立即修复", "保持现状", "查看详情"]
})
print("用户点击的选择:", resp.json().get("answer"))
```

### 4. Git 提交联动 (Git Hook)
保存为 `.git/hooks/post-commit` 并赋予执行权限：
```bash
#!/bin/sh
curl -s -X POST http://localhost:18989/api/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"Git Commit","message":"代码提交成功！继续加油喵~","emotion":"celebrating"}' > /dev/null &
```

---

## 📁 项目目录结构

```
anti Project/
├── electron/
│   ├── main.cjs                # Electron 主进程（透明置顶悬浮窗、托盘、鼠标穿透）
│   ├── preload.cjs             # IPC 安全通信桥接
│   ├── server.cjs              # 本地 REST API & WebSocket 服务 (端口 18989)
│   └── mcp-server.cjs          # 标准 Model Context Protocol (MCP) Stdio 服务
├── src/
│   ├── components/
│   │   ├── PetDisplay.tsx      # 宠物形象、物理动画、表情渲染与互动弹跳
│   │   ├── SpeechBubble.tsx    # 漫画对话气泡（支持流式打字机、Agent 互动按钮）
│   │   ├── QuickChatBar.tsx    # 桌面快捷交互栏（表情快捷面板、声音开关）
│   │   ├── StudioModal.tsx     # 控制中心与形象工坊综合弹窗
│   │   ├── StylizeStudio.tsx   # 媒体二次元/卡通化、抠图与风格微调核心
│   │   ├── ModelGateway.tsx    # 多大模型厂商网关配置与 1-Click Ping 测试
│   │   ├── AgentHub.tsx        # Agent 生态中心、MCP 引导与动作调试器
│   │   └── PersonaEditor.tsx   # 性格人设、Prompt 指令与 TTS 语调调节
│   ├── data/
│   │   ├── defaultPets.ts      # 内置高清多表情矢量伴侣角色库
│   │   └── defaultPersonas.ts  # 内置性格模板（元气伴侣、傲娇机娘、架构师、佛系水豚）
│   ├── services/
│   │   ├── llmService.ts       # 统一大模型流式客户端 (OpenAI/DeepSeek/Gemini/Claude/Ollama)
│   │   ├── stylizeService.ts   # 离线滤镜算法、自动背景抠除与云端生图
│   │   ├── agentService.ts     # 本地 WebSocket 与 REST 通信服务
│   │   └── soundService.ts     # Web Audio 声音合成与 TTS 语音播报
│   ├── types/
│   │   └── index.ts            # TypeScript 核心类型定义
│   ├── App.tsx                 # 顶层状态协调器
│   ├── index.css               # 赛博拟物与磨砂玻璃质感设计规范
│   └── main.tsx                # React 入口文件
├── package.json
└── vite.config.ts
```
