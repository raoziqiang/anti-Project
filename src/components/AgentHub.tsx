import React, { useState } from 'react';
import { Terminal, Copy, Check, Radio, Activity, Send, MessageSquare, AlertTriangle, ShieldCheck, Play, Sparkles } from 'lucide-react';
import { AgentNotification, PetEmotion } from '../types';
import { soundService } from '../services/soundService';

interface AgentHubProps {
  port: number;
  isWsConnected: boolean;
  recentNotifications: AgentNotification[];
  onTriggerTestNotification: (notif: AgentNotification) => void;
}

export const AgentHub: React.FC<AgentHubProps> = ({
  port,
  isWsConnected,
  recentNotifications,
  onTriggerTestNotification
}) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'claude' | 'cursor' | 'python' | 'curl' | 'git'>('claude');

  // Test form state
  const [testTitle, setTestTitle] = useState('构建测试完成');
  const [testMessage, setTestMessage] = useState('主分支 128 个测试用例全部通过，准备部署喵！(｡♥‿♥｡)');
  const [testEmotion, setTestEmotion] = useState<PetEmotion>('celebrating');
  const [testType, setTestType] = useState<'notify' | 'speak' | 'ask'>('notify');
  const [askOptions, setAskOptions] = useState('批准上线, 暂缓, 重新检查');

  const copyToClipboard = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    soundService.playPop();
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const mcpServerPath = 'd:/Z1848/Documents/anti Project/electron/mcp-server.cjs';

  const snippets = {
    claude: `{
  "mcpServers": {
    "desktop-pet": {
      "command": "node",
      "args": ["${mcpServerPath}"]
    }
  }
}`,
    cursor: `{
  "mcpServers": {
    "desktop-pet": {
      "command": "node",
      "args": ["${mcpServerPath}"]
    }
  }
}`,
    python: `import requests

# 1. 弹出桌面宠物通知与表情
requests.post("http://localhost:${port}/api/notify", json={
    "source": "Python Agent",
    "title": "数据抓取完成",
    "message": "已成功处理 1,024 篇文档",
    "emotion": "celebrating",
    "sound": True
})

# 2. 向用户桌面宠物提问并同步等待用户点击决策
resp = requests.post("http://localhost:${port}/api/ask", json={
    "question": "检测到生产环境迁移，是否立即执行？",
    "options": ["确认执行", "取消操作"]
})
print("用户回答:", resp.json().get("answer"))`,
    curl: `# 快速通过 cURL 测试桌面宠物弹窗
curl -X POST http://localhost:${port}/api/notify \\
  -H "Content-Type: application/json" \\
  -d '{"title":"构建提醒","message":"前端已更新完成！","emotion":"happy"}'`,
    git: `#!/bin/sh
# 复制到 .git/hooks/post-commit 中，每次提交时宠物自动庆祝！
curl -s -X POST http://localhost:${port}/api/notify \\
  -H "Content-Type: application/json" \\
  -d "{\\"title\\":\\"Git Commit\\",\\"message\\":\\"新代码已提交！继续加油喵~\\",\\"emotion\\":\\"celebrating\\"}" > /dev/null &`
  };

  const handleRunDebugTest = async () => {
    if (testType === 'notify') {
      try {
        await fetch(`http://localhost:${port}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: '调试器',
            title: testTitle,
            message: testMessage,
            emotion: testEmotion,
            sound: true
          })
        });
      } catch (e) {
        onTriggerTestNotification({
          id: `test_${Date.now()}`,
          source: '调试器',
          title: testTitle,
          message: testMessage,
          emotion: testEmotion,
          timestamp: Date.now(),
          sound: true
        });
      }
    } else if (testType === 'speak') {
      try {
        await fetch(`http://localhost:${port}/api/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: testMessage,
            emotion: testEmotion,
            agentName: '调试助手'
          })
        });
      } catch (e) {}
    } else if (testType === 'ask') {
      const opts = askOptions.split(',').map(s => s.trim()).filter(Boolean);
      try {
        fetch(`http://localhost:${port}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: testMessage,
            options: opts,
            agentName: '决策 Agent'
          })
        });
      } catch (e) {}
    }
    soundService.playPop();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Gateway Status Card */}
      <div className="studio-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Radio size={20} className={isWsConnected ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Agent 本地双向网关 (Local Gateway)</span>
              <span className="status-pill" style={{
                background: isWsConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: isWsConnected ? '#34d399' : '#fbbf24',
                borderColor: isWsConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'
              }}>
                <span className="status-dot" style={{ background: isWsConnected ? '#10b981' : '#f59e0b' }} />
                {isWsConnected ? '网关就绪 (Active)' : '正在等待连接...'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              REST API: <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>http://localhost:{port}</code> · WebSocket: <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>ws://localhost:{port}/ws</code>
            </p>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-sub)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          MCP 协议版本: <strong style={{ color: '#34d399' }}>v2024-11-05</strong>
        </div>
      </div>

      {/* 2-Columns: Code Snippets & Action Debugger */}
      <div className="studio-grid-2">
        {/* Left Column: Code Configuration Snippets */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Terminal size={15} style={{ color: '#38bdf8' }} />
              各大 Agent 接入配置 (1-Click Copy)
            </div>
            <button
              onClick={() => copyToClipboard(snippets[activeSnippetTab], activeSnippetTab)}
              className="studio-btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              {copiedTab === activeSnippetTab ? (
                <>
                  <Check size={12} style={{ color: '#34d399' }} />
                  <span style={{ color: '#34d399' }}>已复制</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>复制代码</span>
                </>
              )}
            </button>
          </div>

          {/* Subtabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            {[
              { id: 'claude', label: 'Claude Desktop' },
              { id: 'cursor', label: 'Cursor / Antigravity' },
              { id: 'python', label: 'Python SDK' },
              { id: 'curl', label: 'cURL' },
              { id: 'git', label: 'Git Hook' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSnippetTab(tab.id as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeSnippetTab === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: activeSnippetTab === tab.id ? '#38bdf8' : 'var(--text-muted)',
                  fontWeight: activeSnippetTab === tab.id ? 600 : 400
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code Box */}
          <pre className="studio-code-box" style={{ maxHeight: '180px' }}>
            {snippets[activeSnippetTab]}
          </pre>

          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '10px' }}>
            💡 配置后，Claude、Cursor 或任意工具即可调用标准工具 <code style={{ color: '#38bdf8' }}>pet_notify</code>、<code style={{ color: '#38bdf8' }}>pet_speak</code>、<code style={{ color: '#38bdf8' }}>pet_ask_user</code> 驱动桌面宠物！
          </p>
        </div>

        {/* Right Column: Interactive Debugger */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Activity size={15} style={{ color: '#ec4899' }} />
              实时 Agent 动作与交互调试器
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { id: 'notify', label: '弹窗提醒' },
              { id: 'speak', label: 'TTS 说话' },
              { id: 'ask', label: '询问用户决策' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTestType(t.id as any)}
                className={`studio-btn-secondary ${testType === t.id ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  padding: '6px',
                  borderColor: testType === t.id ? '#ec4899' : 'var(--border-subtle)',
                  color: testType === t.id ? '#f472b6' : 'var(--text-muted)',
                  background: testType === t.id ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.04)'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {testType === 'notify' && (
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="提醒标题 (如: 代码审查完成)"
                className="studio-input"
              />
            )}

            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="测试消息内容..."
              rows={2}
              className="studio-textarea"
            />

            {testType === 'ask' && (
              <input
                type="text"
                value={askOptions}
                onChange={(e) => setAskOptions(e.target.value)}
                placeholder="按钮选项 (英文逗号隔开)"
                className="studio-input"
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-sub)' }}>
                <span>宠物表情:</span>
                <select
                  value={testEmotion}
                  onChange={(e) => setTestEmotion(e.target.value as PetEmotion)}
                  className="studio-select"
                >
                  <option value="happy">开心 (happy)</option>
                  <option value="celebrating">庆祝 (celebrating)</option>
                  <option value="thinking">思考 (thinking)</option>
                  <option value="surprised">惊讶 (surprised)</option>
                  <option value="sleeping">睡眠 (sleeping)</option>
                  <option value="idle">待机 (idle)</option>
                </select>
              </div>

              <button
                onClick={handleRunDebugTest}
                className="studio-btn-pink"
              >
                <Play size={13} /> 立即触发测试
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream Logs Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Activity size={15} style={{ color: '#38bdf8' }} />
            外部 Agent 实时事件流水 (Live Event Logs)
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            最新 {recentNotifications.length} 条记录
          </span>
        </div>

        <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recentNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px', padding: '24px 0' }}>
              暂无外部 Agent 事件，使用上方调试器或通过端口 18989 发起请求
            </div>
          ) : (
            recentNotifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(7, 10, 18, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    {n.source}
                  </span>
                  <span style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{n.title}:</span>
                  <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.message}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {new Date(n.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
