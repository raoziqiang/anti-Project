import React, { useState } from 'react';
import { Cpu, Key, Globe, Layers, Zap, CheckCircle2, AlertCircle, Play, Eye, EyeOff, Sparkles, Terminal, Save, ShieldCheck } from 'lucide-react';
import { LLMConfig, LLMProviderId } from '../types';
import { LLMService } from '../services/llmService';
import { soundService } from '../services/soundService';
import { configService } from '../services/configService';

interface ModelGatewayProps {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

export const ModelGateway: React.FC<ModelGatewayProps> = ({ config, onChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const providers: {
    id: LLMProviderId;
    name: string;
    icon: string;
    badge: string;
    defaultBaseUrl: string;
    models: string[];
    recommendedModel: string;
    description: string;
  }[] = [
    {
      id: 'deepseek',
      name: 'DeepSeek (深度求索)',
      icon: '🐋',
      badge: '超高性价比 · 推荐',
      defaultBaseUrl: 'https://api.deepseek.com',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      recommendedModel: 'deepseek-chat',
      description: '国产顶尖大模型，超高逻辑推理能力，极低调用单价'
    },
    {
      id: 'siliconflow',
      name: 'SiliconFlow (硅基流动)',
      icon: '⚡',
      badge: '国内高速聚合',
      defaultBaseUrl: 'https://api.siliconflow.cn/v1',
      models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
      recommendedModel: 'deepseek-ai/DeepSeek-V3',
      description: '国内高速算力聚合平台，免梯直连全球主流开源大模型'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '✨',
      badge: '超强多模态',
      defaultBaseUrl: 'https://generativelanguage.googleapis.com',
      models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      recommendedModel: 'gemini-2.0-flash',
      description: '谷歌次世代多模态大模型，超快响应与百万上下文支持'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🟢',
      badge: '行业基准',
      defaultBaseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
      recommendedModel: 'gpt-4o-mini',
      description: '全球顶级通用智能，指令遵循度强，生态极度完善'
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      icon: '🟣',
      badge: '顶级编码代码',
      defaultBaseUrl: 'https://api.anthropic.com',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      recommendedModel: 'claude-3-5-sonnet-20241022',
      description: '软件开发与代码重构最强推理模型，严谨细腻'
    },
    {
      id: 'ollama',
      name: 'Ollama 本地大模型',
      icon: '🦙',
      badge: '100% 离线私有',
      defaultBaseUrl: 'http://localhost:11434',
      models: ['qwen2.5:7b', 'deepseek-r1:7b', 'llama3.2:3b'],
      recommendedModel: 'qwen2.5:7b',
      description: '本地硬件运行，零隐私泄露风险，断网离线畅聊'
    },
    {
      id: 'custom',
      name: '自定义 OpenAI 兼容接口',
      icon: '🔌',
      badge: '通用中转',
      defaultBaseUrl: 'https://api.example.com/v1',
      models: ['custom-model'],
      recommendedModel: 'custom-model',
      description: '支持月之暗面 Kimi、智谱 GLM、OneAPI 及任意自定义中转网关'
    }
  ];

  const currentProvider = providers.find(p => p.id === config.provider) || providers[0];

  const handleProviderSelect = (pId: LLMProviderId) => {
    const target = providers.find(p => p.id === pId);
    if (!target) return;
    onChange({
      ...config,
      provider: pId,
      baseUrl: target.defaultBaseUrl,
      model: target.recommendedModel
    });
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestResult('');
    setSaveMessage('');
    const startTime = performance.now();

    try {
      let reply = '';
      await LLMService.streamChat(
        config,
        [
          { role: 'system', content: '你是AI桌面伴侣。' },
          { role: 'user', content: '请在15字以内做个超萌的自我介绍打个招呼。' }
        ],
        (token) => {
          reply += token;
          setTestResult(reply);
        }
      );

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      setTestStatus('success');
      soundService.playHappy();

      // Automatically persist valid config to disk
      await configService.savePersistentConfig({ llmConfig: config });
      setSaveMessage('连通成功 · 密钥与配置已永久保存至本地磁盘');
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus('failed');
      setTestResult(`连接测试失败: ${msg}`);
      soundService.playAlert();
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await configService.savePersistentConfig({ llmConfig: config });
      setSaveMessage('配置已永久保存至本地磁盘');
      soundService.playSuccess();
    } catch {
      setSaveMessage('保存失败，请检查服务状态');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Provider Selector Cards Grid */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={15} style={{ color: '#38bdf8' }} /> 选择大模型厂商与能力来源
        </div>

        <div className="studio-grid-3">
          {providers.map(p => {
            const isSelected = config.provider === p.id;

            return (
              <div
                key={p.id}
                onClick={() => handleProviderSelect(p.id)}
                className={`preset-card ${isSelected ? 'active' : ''}`}
                style={{ padding: '14px', alignItems: 'flex-start' }}
              >
                <span className="preset-icon" style={{ fontSize: '24px' }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{p.name}</span>
                  </div>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    margin: '4px 0 6px 0',
                    fontFamily: 'monospace'
                  }}>
                    {p.badge}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection & Configuration Form Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Zap size={15} style={{ color: '#38bdf8' }} />
            {currentProvider.name} · 参数配置
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            BaseURL & Model Settings
          </span>
        </div>

        <div className="studio-grid-2">
          {/* Base URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={13} style={{ color: '#38bdf8' }} /> API Base URL 接口地址:
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
              placeholder="https://..."
              className="studio-input"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* API Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} style={{ color: '#38bdf8' }} /> API Key 密钥:
              </label>
              {config.provider === 'ollama' ? (
                <span style={{ fontSize: '10px', color: '#10b981' }}>本地部署无需 API Key</span>
              ) : (
                <span style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> 磁盘持久化守护已生效
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
                placeholder={config.provider === 'ollama' ? '无需填写 (Localhost)' : 'sk-...'}
                className="studio-input"
                style={{ paddingRight: '36px', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} style={{ color: '#38bdf8' }} /> 模型名称 (Model ID):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={config.model}
                onChange={(e) => onChange({ ...config, model: e.target.value })}
                placeholder="e.g. deepseek-chat"
                className="studio-input"
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
              {currentProvider.models.length > 0 && (
                <select
                  onChange={(e) => onChange({ ...config, model: e.target.value })}
                  className="studio-select"
                  value={config.model}
                >
                  {currentProvider.models.map(m => (
                    <option key={m} value={m} style={{ background: '#0a0f1d', color: '#fff' }}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Temperature & Token Settings */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="studio-slider-wrapper" style={{ flex: 1 }}>
              <div className="studio-slider-header">
                <span>创意发散度 (Temp)</span>
                <span className="studio-slider-val">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={(e) => onChange({ ...config, temperature: Number(e.target.value) })}
                className="studio-slider"
              />
            </div>

            <div className="studio-slider-wrapper" style={{ flex: 1 }}>
              <div className="studio-slider-header">
                <span>最大输出 Token</span>
                <span className="studio-slider-val">{config.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="4096"
                step="128"
                value={config.maxTokens}
                onChange={(e) => onChange({ ...config, maxTokens: Number(e.target.value) })}
                className="studio-slider"
              />
            </div>
          </div>
        </div>

        {/* 1-Click Connection Test Bar */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="studio-btn-primary"
            >
              <Play size={13} className={testStatus === 'testing' ? 'animate-spin' : ''} />
              {testStatus === 'testing' ? '正在连通测试...' : '测试大模型连通性 (Ping)'}
            </button>

            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="studio-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={13} />
              {isSaving ? '保存中...' : '保存配置到本地磁盘'}
            </button>

            {saveMessage && (
              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={15} /> {saveMessage}
              </span>
            )}

            {testStatus === 'success' && !saveMessage && (
              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={15} /> 连通成功 · 响应延迟 {latency}ms
              </span>
            )}

            {testStatus === 'failed' && (
              <span style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertCircle size={15} /> 连接异常，请核对 Key 或接口地址
              </span>
            )}
          </div>

          {testResult && (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-sub)',
              background: 'rgba(7, 10, 18, 0.8)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 14px',
              borderRadius: '8px',
              maxWidth: '480px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              💬 回应: <span style={{ color: '#fff' }}>{testResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
