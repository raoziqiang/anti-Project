#!/usr/bin/env node

/**
 * Model Context Protocol (MCP) Stdio Server for AI Desktop Pet
 * Enables Claude Desktop, Cursor, Antigravity IDE, Cline, and other Agents to interact with the Pet.
 */

const http = require('http');
const readline = require('readline');

const PET_GATEWAY_URL = process.env.PET_GATEWAY_URL || 'http://localhost:18989';

// Helper to make local requests to the Pet's Express gateway
function callPetApi(endpoint, data = {}, timeoutMs = 65000) {
  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint, PET_GATEWAY_URL);
      const postData = Buffer.from(JSON.stringify(data), 'utf8');

      const req = http.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': postData.length
          },
          timeout: timeoutMs
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve({ raw: body });
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: `请求超时 (${timeoutMs}ms)。可能伴侣未响应或等待用户输入超时。` });
      });

      req.on('error', (err) => {
        resolve({
          error: `无法连接到桌面伴侣网关 (${PET_GATEWAY_URL})。请确认 AI 桌面伴侣已启动 (运行 npm start 或 npm run server)。(错误: ${err.message})`
        });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      resolve({ error: `调用网关异常: ${err.message}` });
    }
  });
}

function getPetStatus() {
  return new Promise((resolve) => {
    try {
      const req = http.get(`${PET_GATEWAY_URL}/api/status`, { timeout: 3000 }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ status: 'unknown' });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'offline', error: '连接桌面伴侣网关超时' });
      });

      req.on('error', (err) => {
        resolve({ status: 'offline', error: err.message });
      });
    } catch (err) {
      resolve({ status: 'offline', error: err.message });
    }
  });
}

// Tool definitions conforming to Model Context Protocol (MCP) Schema
const TOOLS = [
  {
    name: 'pet_notify',
    description: 'Pop up an alert or celebration message on the user\'s desktop via the AI Pet companion.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The notification message to show in pet speech bubble' },
        title: { type: 'string', description: 'Short title for the event, e.g. "Build Complete", "Bug Found"' },
        emotion: {
          type: 'string',
          enum: ['idle', 'happy', 'thinking', 'surprised', 'sleeping', 'celebrating', 'alert'],
          description: 'Visual expression of the pet during this notification'
        },
        sound: { type: 'boolean', description: 'Whether to play a cute chime sound' }
      },
      required: ['message']
    }
  },
  {
    name: 'pet_set_emotion',
    description: 'Change the facial expression and body language of the desktop pet (e.g. happy when test passes, thinking during deep reasoning).',
    inputSchema: {
      type: 'object',
      properties: {
        emotion: {
          type: 'string',
          enum: ['idle', 'happy', 'thinking', 'surprised', 'sleeping', 'celebrating', 'alert'],
          description: 'The target emotion state'
        }
      },
      required: ['emotion']
    }
  },
  {
    name: 'pet_speak',
    description: 'Have the desktop pet voice out a sentence aloud using TTS and display it in its speech bubble.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text for the pet to voice out' },
        emotion: {
          type: 'string',
          enum: ['idle', 'happy', 'thinking', 'surprised', 'sleeping', 'celebrating'],
          description: 'Emotion while speaking'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'pet_ask_user',
    description: 'Ask the desktop user a question or present multiple choice buttons directly on their screen via the pet. Blocks until the user responds or times out.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask the user' },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of quick buttons for user to click, e.g. ["Proceed", "Abort", "Retry"]'
        },
        timeoutMs: { type: 'number', description: 'Timeout in milliseconds (default 60000)' }
      },
      required: ['question']
    }
  },
  {
    name: 'pet_get_status',
    description: 'Check if the AI Desktop Pet is running and get its current state.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// JSON-RPC Stdio Loop (do NOT attach output to process.stdout to prevent echoing)
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

function sendResponse(id, result, error) {
  const payload = {
    jsonrpc: '2.0',
    id
  };
  if (error) {
    payload.error = error;
  } else {
    payload.result = result !== undefined ? result : {};
  }
  process.stdout.write(JSON.stringify(payload) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (e) {
    return;
  }

  const { id, method, params } = msg;

  // Handle client notifications (no response expected)
  if (id === undefined) {
    if (method === 'notifications/initialized') {
      // MCP client handshake initialized successfully
    }
    return;
  }

  // 1. MCP Handshake
  if (method === 'initialize') {
    const requestedVersion = params?.protocolVersion || '2024-11-05';
    sendResponse(id, {
      protocolVersion: requestedVersion,
      serverInfo: {
        name: 'ai-desktop-pet-mcp',
        version: '1.0.0'
      },
      capabilities: {
        tools: {
          listChanged: false
        }
      }
    });
    return;
  }

  // 2. Health check ping (standard MCP spec)
  if (method === 'ping') {
    sendResponse(id, {});
    return;
  }

  // 3. List tools
  if (method === 'tools/list') {
    sendResponse(id, { tools: TOOLS });
    return;
  }

  // 4. Resources / Prompts fallback (prevent client discovery errors)
  if (method === 'resources/list') {
    sendResponse(id, { resources: [] });
    return;
  }

  if (method === 'prompts/list') {
    sendResponse(id, { prompts: [] });
    return;
  }

  // 5. Tool execution
  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments || {};

    try {
      if (name === 'pet_notify') {
        const res = await callPetApi('/api/notify', {
          source: 'Agent MCP',
          title: args.title || 'Agent 消息',
          message: args.message,
          emotion: args.emotion || 'happy',
          sound: args.sound !== false
        });

        if (res.error) {
          sendResponse(id, {
            isError: true,
            content: [{ type: 'text', text: `[桌面伴侣提醒发送失败] ${res.error}` }]
          });
        } else {
          sendResponse(id, {
            content: [{ type: 'text', text: `桌面宠物已成功弹出提醒: "${args.message}" (表情: ${args.emotion || 'happy'})` }]
          });
        }
      } else if (name === 'pet_set_emotion') {
        const res = await callPetApi('/api/emotion', { emotion: args.emotion });
        if (res.error) {
          sendResponse(id, {
            isError: true,
            content: [{ type: 'text', text: `[切换表情失败] ${res.error}` }]
          });
        } else {
          sendResponse(id, {
            content: [{ type: 'text', text: `桌面宠物表情已成功切换为: ${args.emotion}` }]
          });
        }
      } else if (name === 'pet_speak') {
        const res = await callPetApi('/api/speak', {
          text: args.text,
          emotion: args.emotion || 'happy',
          agentName: 'Agent MCP'
        });
        if (res.error) {
          sendResponse(id, {
            isError: true,
            content: [{ type: 'text', text: `[语音播报失败] ${res.error}` }]
          });
        } else {
          sendResponse(id, {
            content: [{ type: 'text', text: `桌面宠物已完成语音朗读并显示台词: "${args.text}"` }]
          });
        }
      } else if (name === 'pet_ask_user') {
        const timeout = (args.timeoutMs || 60000);
        const res = await callPetApi('/api/ask', {
          question: args.question,
          options: args.options,
          timeoutMs: timeout,
          agentName: 'Agent MCP'
        }, timeout + 5000);

        if (res.error) {
          sendResponse(id, {
            isError: true,
            content: [{ type: 'text', text: `[向用户提问未获得响应] ${res.error}` }]
          });
        } else {
          sendResponse(id, {
            content: [{ type: 'text', text: `用户在桌面伴侣上做出回答: ${JSON.stringify(res.answer !== undefined ? res.answer : res)}` }]
          });
        }
      } else if (name === 'pet_get_status') {
        const res = await getPetStatus();
        if (res.status === 'online') {
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `桌面伴侣正在运行中 (状态: 在线, 端口: ${res.port || 18989}, 活动客户端数: ${res.activeWsClients || 0})`
            }]
          });
        } else {
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `桌面伴侣当前未运行 (离线状态)。若需要与宠物视觉联动，请先运行 "npm start" 或 "npm run server"。`
            }]
          });
        }
      } else {
        sendResponse(id, null, { code: -32601, message: `Unknown tool: ${name}` });
      }
    } catch (err) {
      sendResponse(id, {
        isError: true,
        content: [{ type: 'text', text: `调用桌面伴侣工具异常: ${err.message}` }]
      });
    }
    return;
  }

  // Fallback for unsupported methods
  sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
});

rl.on('close', () => {
  process.exit(0);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Prevent uncaught errors from crashing without logging to stderr
process.on('uncaughtException', (err) => {
  process.stderr.write(`[MCP UncaughtException] ${err.stack || err.message}\n`);
});

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[MCP UnhandledRejection] ${reason}\n`);
});
