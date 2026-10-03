const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const APPDATA_DIR = path.join(
  process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library/Application Support') : path.join(process.env.HOME || '', '.config')),
  'AI-Desktop-Pet'
);
const CONFIG_FILE = path.join(APPDATA_DIR, 'config.json');
const LOCAL_CONFIG_FILE = path.join(__dirname, '../user-config.json');

function getStoredConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      if (content && content.trim()) return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[Server] Error reading AppData config:', e.message);
  }
  try {
    if (fs.existsSync(LOCAL_CONFIG_FILE)) {
      const content = fs.readFileSync(LOCAL_CONFIG_FILE, 'utf8');
      if (content && content.trim()) return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[Server] Error reading local config:', e.message);
  }
  return {};
}

function saveStoredConfig(patch) {
  try {
    const current = getStoredConfig();
    
    // Safety guard: do not wipe existing non-empty apiKey if incoming patch has empty apiKey,
    // unless forceClearApiKey is explicitly set.
    let targetApiKey = patch.llmConfig ? patch.llmConfig.apiKey : undefined;
    if ((targetApiKey === undefined || targetApiKey === '') && current.llmConfig?.apiKey && !patch.forceClearApiKey) {
      targetApiKey = current.llmConfig.apiKey;
    }

    const updated = {
      ...current,
      ...patch,
      llmConfig: {
        ...(current.llmConfig || {}),
        ...(patch.llmConfig || {}),
        ...(targetApiKey !== undefined ? { apiKey: targetApiKey } : {})
      },
      appSettings: {
        ...(current.appSettings || {}),
        ...(patch.appSettings || {})
      },
      currentPersona: {
        ...(current.currentPersona || {}),
        ...(patch.currentPersona || {})
      }
    };

    // 1. Write to AppData directory
    try {
      if (!fs.existsSync(APPDATA_DIR)) {
        fs.mkdirSync(APPDATA_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Server] Could not write to AppData config:', e.message);
    }

    // 2. Also write to local project file
    try {
      fs.writeFileSync(LOCAL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Server] Could not write to local config:', e.message);
    }

    return updated;
  } catch (err) {
    console.error('[Server] Failed to save stored config:', err);
    return null;
  }
}

const PORT = process.env.PET_PORT || 18989;
let currentPort = PORT;
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Graceful error handling to prevent uncaught exception popups when port is in use
wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn('[Server] WebSocketServer: Port already occupied by another instance.');
  } else {
    console.error('[Server] WebSocketServer error:', err);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Server] HTTP server: Port ${currentPort} is already in use.`);
  } else {
    console.error('[Server] HTTP server error:', err);
  }
});

// Store connected WebSocket clients (Pet window, Agent extensions)
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[Server] WebSocket client connected. Active clients:', clients.size);

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    payload: { server: 'AI Desktop Pet Gateway', version: '1.0.0', time: Date.now() }
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[Server] WebSocket client disconnected. Remaining:', clients.size);
  });
});

function broadcast(data) {
  const jsonStr = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonStr);
    }
  }
}

// In-flight ask-user callbacks
const pendingAsks = new Map();

// --- REST Endpoints for Agents & External Tools ---

// 1. Health check & status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appName: 'AI Desktop Pet',
    port: currentPort,
    activeWsClients: clients.size,
    timestamp: Date.now()
  });
});

// 2. Notify Pet (shows bubble + animation + sound)
app.post('/api/notify', (req, res) => {
  const { source, title, message, emotion, duration, sound } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message field is required' });
  }

  broadcast({
    type: 'NOTIFICATION',
    payload: {
      id: `notif_${Date.now()}`,
      source: source || 'External Agent',
      title: title || 'Agent 任务提醒',
      message,
      emotion: emotion || 'happy',
      duration: duration || 6000,
      sound: sound !== false
    }
  });

  res.json({ success: true, deliveredTo: clients.size });
});

// 3. Set Pet Emotion directly
app.post('/api/emotion', (req, res) => {
  const { emotion } = req.body;
  if (!emotion) {
    return res.status(400).json({ error: 'emotion field is required' });
  }

  broadcast({
    type: 'EMOTION',
    payload: { emotion }
  });

  res.json({ success: true, emotion });
});

// 4. Pet Speak (shows message in speech bubble + TTS)
app.post('/api/speak', (req, res) => {
  const { text, emotion, agentName } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  broadcast({
    type: 'MESSAGE',
    payload: {
      agentName: agentName || 'Agent 助手',
      content: text,
      emotion: emotion || 'happy'
    }
  });

  res.json({ success: true, delivered: true });
});

// 5. Ask user input / confirmation from Agent (synchronous wait)
app.post('/api/ask', (req, res) => {
  const { question, options, timeoutMs, agentName } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const callbackId = `ask_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timeout = timeoutMs || 60000;

  // Set timeout
  const timer = setTimeout(() => {
    if (pendingAsks.has(callbackId)) {
      pendingAsks.delete(callbackId);
      res.status(408).json({ error: 'User response timed out', callbackId });
    }
  }, timeout);

  pendingAsks.set(callbackId, { res, timer });

  // Broadcast to pet UI
  broadcast({
    type: 'MESSAGE',
    payload: {
      agentName: agentName || 'Agent 助手',
      content: question,
      emotion: 'thinking',
      actionRequired: {
        type: options && options.length > 0 ? 'choice' : 'input',
        options: options || [],
        callbackId
      }
    }
  });
});

// 6. User reply from pet UI
app.post('/api/reply', (req, res) => {
  const { callbackId, answer } = req.body;
  if (!callbackId || answer === undefined) {
    return res.status(400).json({ error: 'callbackId and answer are required' });
  }

  const pending = pendingAsks.get(callbackId);
  if (pending) {
    clearTimeout(pending.timer);
    pendingAsks.delete(callbackId);
    pending.res.json({ answer, timestamp: Date.now() });
    return res.json({ success: true });
  } else {
    return res.status(404).json({ error: 'Callback ID not found or already resolved' });
  }
});

// 7. Generic Webhook (GitHub, CI/CD, AlertManager, curl)
app.post('/api/webhook/:source', (req, res) => {
  const source = req.params.source;
  const body = req.body;

  let message = `收到来自 ${source} 的 Webhook 通知`;
  let emotion = 'happy';

  // GitHub webhook parse
  if (req.headers['x-github-event']) {
    const event = req.headers['x-github-event'];
    if (event === 'push') {
      message = `🚀 GitHub 仓库收到新提交！提交者: ${body.pusher?.name || '开发者'}\n最新 Commit: ${body.head_commit?.message || 'Update'}`;
      emotion = 'celebrating';
    } else if (event === 'pull_request') {
      message = `🔀 GitHub PR ${body.action}: #${body.pull_request?.number} "${body.pull_request?.title}"`;
      emotion = 'thinking';
    }
  } else if (body.message || body.text) {
    message = body.message || body.text;
    emotion = body.emotion || 'happy';
  }

  broadcast({
    type: 'NOTIFICATION',
    payload: {
      id: `wh_${Date.now()}`,
      source: `Webhook: ${source}`,
      title: `${source.toUpperCase()} 动态`,
      message,
      emotion,
      duration: 7000,
      sound: true
    }
  });

  res.json({ received: true });
});

// 8. Persistent Configuration API
app.get('/api/config', (req, res) => {
  const config = getStoredConfig();
  res.json({ success: true, config });
});

app.post('/api/config', (req, res) => {
  const patch = req.body;
  const updated = saveStoredConfig(patch);
  if (updated) {
    broadcast({
      type: 'CONFIG_UPDATED',
      payload: updated
    });
    res.json({ success: true, config: updated });
  } else {
    res.status(500).json({ error: 'Failed to persist configuration' });
  }
});

function startServer(port = PORT) {
  currentPort = port;
  return new Promise((resolve) => {
    let resolved = false;

    const onStartupError = (err) => {
      if (!resolved) {
        resolved = true;
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Server] Port ${port} is already in use. Assuming existing gateway is running.`);
        } else {
          console.error(`[Server] Server error during listen on port ${port}:`, err);
        }
        resolve(server);
      }
    };

    server.once('error', onStartupError);

    try {
      server.listen(port, () => {
        if (!resolved) {
          resolved = true;
          server.removeListener('error', onStartupError);
          console.log(`[Server] Desktop Pet Gateway listening at http://localhost:${port}`);
          resolve(server);
        }
      });
    } catch (err) {
      onStartupError(err);
    }
  });
}

module.exports = { startServer, broadcast, PORT, getStoredConfig, saveStoredConfig };

if (require.main === module) {
  startServer();
}
