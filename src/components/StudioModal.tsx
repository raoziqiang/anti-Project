import React, { useState } from 'react';
import { X, Sparkles, Wand2, Cpu, Radio, User, Settings, Check, Trash2, Shield, Activity, RefreshCw } from 'lucide-react';
import { PetAvatar, LLMConfig, Persona, AppSettings, AgentNotification } from '../types';
import { StylizeStudio } from './StylizeStudio';
import { ModelGateway } from './ModelGateway';
import { AgentHub } from './AgentHub';
import { PersonaEditor } from './PersonaEditor';
import { soundService } from '../services/soundService';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFullWindow?: boolean;
  pets: PetAvatar[];
  activePetId: string;
  onSelectPet: (id: string) => void;
  onAddCustomPet: (pet: PetAvatar) => void;
  onDeleteCustomPet: (id: string) => void;
  llmConfig: LLMConfig;
  onUpdateLLMConfig: (config: LLMConfig) => void;
  currentPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  onUpdatePersona: (persona: Persona) => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
  isWsConnected: boolean;
  recentNotifications: AgentNotification[];
  onTriggerTestNotification: (notif: AgentNotification) => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  onClose,
  isFullWindow = false,
  pets,
  activePetId,
  onSelectPet,
  onAddCustomPet,
  onDeleteCustomPet,
  llmConfig,
  onUpdateLLMConfig,
  currentPersona,
  onSelectPersona,
  onUpdatePersona,
  appSettings,
  onUpdateAppSettings,
  isWsConnected,
  recentNotifications,
  onTriggerTestNotification
}) => {
  const [activeTab, setActiveTab] = useState<'pets' | 'stylize' | 'llm' | 'agents' | 'persona' | 'settings'>('pets');

  if (!isOpen) return null;

  const tabTitles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    pets: {
      title: '伴侣角色库 (Character Gallery)',
      subtitle: '自由切换桌面伴侣、管理自制二次元形象或从工坊导入新角色'
    },
    stylize: {
      title: '形象工坊 (Media Stylize Studio)',
      subtitle: '上传任意照片一键转换为二次元日漫、皮克斯3D卡通或赛博机甲风'
    },
    llm: {
      title: '大模型网关 (Multi-LLM Gateway)',
      subtitle: '直连 DeepSeek、硅基流动、OpenAI、Gemini、Claude 与本地 Ollama'
    },
    agents: {
      title: 'Agent 协作生态 (MCP & Webhook Hub)',
      subtitle: '无缝接入 Claude Desktop、Cursor、Antigravity 与 Python 脚本联动'
    },
    persona: {
      title: '性格与台词人设 (Persona & Voice)',
      subtitle: '定制伴侣语气习惯、System Prompt 以及 TTS 朗读音调与语速'
    },
    settings: {
      title: '桌面与系统偏好 (Preferences)',
      subtitle: '窗口置顶、鼠标穿透、伴侣缩放比例以及通信网关端口'
    }
  };

  const innerContent = (
    <>
      {/* Left Sidebar */}
      <aside className="studio-sidebar">
          <div>
            {/* Brand Header */}
            <div className="studio-sidebar-header">
              <div className="studio-brand-icon">🐾</div>
              <div>
                <div className="studio-brand-title">AI 桌面元气伴侣</div>
                <div className="studio-brand-subtitle">
                  <span>Control Studio</span>
                  <span style={{ color: '#38bdf8' }}>v1.0.0</span>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="studio-nav-group-title">伴侣形象</div>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('pets'); }}
              className={`studio-nav-item ${activeTab === 'pets' ? 'active' : ''}`}
            >
              <Sparkles size={16} className="nav-icon" />
              <span>伴侣角色库</span>
            </button>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('stylize'); }}
              className={`studio-nav-item ${activeTab === 'stylize' ? 'active' : ''}`}
            >
              <Wand2 size={16} className="nav-icon" />
              <span>形象工坊 (二次元化)</span>
            </button>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('persona'); }}
              className={`studio-nav-item ${activeTab === 'persona' ? 'active' : ''}`}
            >
              <User size={16} className="nav-icon" />
              <span>性格与台词</span>
            </button>

            <div className="studio-nav-group-title" style={{ marginTop: '14px' }}>AI 与协同</div>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('llm'); }}
              className={`studio-nav-item ${activeTab === 'llm' ? 'active' : ''}`}
            >
              <Cpu size={16} className="nav-icon" />
              <span>大模型网关</span>
            </button>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('agents'); }}
              className={`studio-nav-item ${activeTab === 'agents' ? 'active' : ''}`}
            >
              <Radio size={16} className="nav-icon" />
              <span>Agent 协作生态</span>
            </button>

            <div className="studio-nav-group-title" style={{ marginTop: '14px' }}>系统偏好</div>
            <button
              onClick={() => { soundService.playPop(); setActiveTab('settings'); }}
              className={`studio-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={16} className="nav-icon" />
              <span>桌面与系统</span>
            </button>
          </div>

          {/* Sidebar Footer */}
          <div className="studio-sidebar-footer">
            <div className="status-pill">
              <span className="status-dot" style={{ background: isWsConnected ? '#10b981' : '#f59e0b' }} />
              <span>{isWsConnected ? 'Port 18989 Active' : 'Gateway Offline'}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>AGY Pet</span>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="studio-main-wrapper">
          {/* Top Bar */}
          <div className="studio-header">
            <div className="studio-title-area">
              <h2>{tabTitles[activeTab].title}</h2>
              <p>{tabTitles[activeTab].subtitle}</p>
            </div>
            <button
              onClick={() => { soundService.playPop(); onClose(); }}
              className="studio-close-btn"
              title="关闭控制中心"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div className="studio-content-body">
            {/* TAB 1: Character Gallery */}
            {activeTab === 'pets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>活跃与可用伴侣形象</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>点击任一伴侣即可秒级激活到桌面，或上传专属照片一键转换</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('stylize')}
                    className="studio-btn-primary"
                  >
                    <Wand2 size={14} /> 自定义新形象
                  </button>
                </div>

                <div className="studio-grid-4">
                  {pets.map(pet => {
                    const isSelected = activePetId === pet.id;
                    const preview = pet.sprites.happy || pet.sprites.idle;

                    return (
                      <div
                        key={pet.id}
                        onClick={() => {
                          onSelectPet(pet.id);
                          soundService.playHappy();
                        }}
                        className={`studio-choice-card ${isSelected ? 'selected' : ''}`}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(56, 189, 248, 0.2)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check size={10} /> 当前使用
                          </div>
                        )}

                        {pet.isCustom && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(236, 72, 153, 0.2)',
                            color: '#f472b6',
                            border: '1px solid rgba(236, 72, 153, 0.4)',
                            fontSize: '10px'
                          }}>
                            自制角色
                          </div>
                        )}

                        <div style={{
                          width: '120px',
                          height: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '12px 0 8px 0',
                          padding: '8px',
                          borderRadius: '12px',
                          background: 'rgba(7, 10, 18, 0.5)'
                        }}>
                          <img
                            src={preview}
                            alt={pet.name}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))'
                            }}
                          />
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#fff' }}>
                          {pet.name}
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {pet.description}
                        </p>

                        {pet.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定删除自定义伴侣「${pet.name}」吗？`)) {
                                onDeleteCustomPet(pet.id);
                              }
                            }}
                            style={{
                              marginTop: '10px',
                              background: 'transparent',
                              border: 'none',
                              color: '#f87171',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} /> 删除形象
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Stylize Studio */}
            {activeTab === 'stylize' && (
              <StylizeStudio
                onAddCustomPet={(newPet) => {
                  onAddCustomPet(newPet);
                  setActiveTab('pets');
                }}
                cloudApiKey={llmConfig.apiKey}
                cloudBaseUrl={llmConfig.baseUrl}
              />
            )}

            {/* TAB 3: Model Gateway */}
            {activeTab === 'llm' && (
              <ModelGateway
                config={llmConfig}
                onChange={onUpdateLLMConfig}
              />
            )}

            {/* TAB 4: Agent Ecosystem */}
            {activeTab === 'agents' && (
              <AgentHub
                port={appSettings.apiPort}
                isWsConnected={isWsConnected}
                recentNotifications={recentNotifications}
                onTriggerTestNotification={onTriggerTestNotification}
              />
            )}

            {/* TAB 5: Persona Editor */}
            {activeTab === 'persona' && (
              <PersonaEditor
                currentPersona={currentPersona}
                onSelectPersona={onSelectPersona}
                onUpdatePersona={onUpdatePersona}
              />
            )}

            {/* TAB 6: Settings */}
            {activeTab === 'settings' && (
              <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="studio-card">
                  <div className="studio-card-header">
                    <div className="studio-card-title">
                      <Settings size={16} style={{ color: '#38bdf8' }} />
                      桌面悬浮与交互行为
                    </div>
                  </div>

                  {/* Always on top toggle */}
                  <div className="studio-toggle-row">
                    <div className="studio-toggle-label">
                      <span className="studio-toggle-title">桌面永远置顶 (Always on Top)</span>
                      <span className="studio-toggle-desc">保持宠物始终漂浮在所有应用窗口上方，不被其他软件遮挡</span>
                    </div>
                    <label className="studio-switch">
                      <input
                        type="checkbox"
                        checked={appSettings.alwaysOnTop}
                        onChange={(e) => onUpdateAppSettings({ ...appSettings, alwaysOnTop: e.target.checked })}
                      />
                      <span className="studio-switch-slider"></span>
                    </label>
                  </div>

                  {/* Click-through toggle */}
                  <div className="studio-toggle-row">
                    <div className="studio-toggle-label">
                      <span className="studio-toggle-title">鼠标点击穿透 (Click-Through)</span>
                      <span className="studio-toggle-desc">鼠标点击可直接穿透宠物形象，不妨碍背后的文字选择与点击操作</span>
                    </div>
                    <label className="studio-switch">
                      <input
                        type="checkbox"
                        checked={appSettings.clickThrough}
                        onChange={(e) => onUpdateAppSettings({ ...appSettings, clickThrough: e.target.checked })}
                      />
                      <span className="studio-switch-slider"></span>
                    </label>
                  </div>

                  {/* Sound and TTS toggle */}
                  <div className="studio-toggle-row">
                    <div className="studio-toggle-label">
                      <span className="studio-toggle-title">伴侣音效与语音朗读 (Sound & TTS)</span>
                      <span className="studio-toggle-desc">启用伴侣点击交互声效、Agent 通知提醒铃声及语音合成播报</span>
                    </div>
                    <label className="studio-switch">
                      <input
                        type="checkbox"
                        checked={appSettings.soundEnabled}
                        onChange={(e) => onUpdateAppSettings({ ...appSettings, soundEnabled: e.target.checked })}
                      />
                      <span className="studio-switch-slider"></span>
                    </label>
                  </div>

                  {/* Pet Scale slider */}
                  <div style={{ padding: '16px 0 10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="studio-slider-wrapper">
                      <div className="studio-slider-header">
                        <span>宠物视觉缩放比例 (Scale)</span>
                        <span className="studio-slider-val">{appSettings.petScale}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.5"
                        step="0.05"
                        value={appSettings.petScale}
                        onChange={(e) => onUpdateAppSettings({ ...appSettings, petScale: Number(e.target.value) })}
                        className="studio-slider"
                      />
                    </div>
                  </div>

                  {/* API Port input */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px' }}>
                    <div className="studio-toggle-label">
                      <span className="studio-toggle-title">本地 Agent 通信网关端口 (HTTP / WS)</span>
                      <span className="studio-toggle-desc">用于 Claude Desktop、Cursor MCP 及外部脚本接收事件的端口</span>
                    </div>
                    <input
                      type="number"
                      value={appSettings.apiPort}
                      onChange={(e) => onUpdateAppSettings({ ...appSettings, apiPort: Number(e.target.value) })}
                      className="studio-input"
                      style={{ width: '100px', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
    </>
  );

  if (isFullWindow) {
    return (
      <div className="studio-fullscreen-window no-drag">
        {innerContent}
      </div>
    );
  }

  return (
    <div className="studio-modal-overlay no-drag" onClick={onClose}>
      <div className="studio-modal-window" onClick={(e) => e.stopPropagation()}>
        {innerContent}
      </div>
    </div>
  );
};
