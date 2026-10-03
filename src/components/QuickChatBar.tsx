import React, { useState } from 'react';
import { Send, Settings, Smile, Volume2, VolumeX, Scaling, Minus, Plus, RotateCcw } from 'lucide-react';
import { PetEmotion } from '../types';

interface QuickChatBarProps {
  onSendMessage: (text: string) => void;
  onSetEmotion: (emotion: PetEmotion) => void;
  onOpenStudio: () => void;
  onOpenAudioCenter?: () => void;
  isWsConnected: boolean;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  currentScale?: number;
  onChangeScale?: (scale: number) => void;
  currentVolume?: number;
  onChangeVolume?: (volume: number) => void;
  isLoading?: boolean;
}

export const QuickChatBar: React.FC<QuickChatBarProps> = ({
  onSendMessage,
  onSetEmotion,
  onOpenStudio,
  onOpenAudioCenter,
  isWsConnected,
  isSoundMuted,
  onToggleSound,
  currentScale = 1.0,
  onChangeScale,
  currentVolume = 0.8,
  onChangeVolume,
  isLoading
}) => {
  const [input, setInput] = useState('');
  const [showEmotions, setShowEmotions] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const emotionsList: { emotion: PetEmotion; label: string; icon: string }[] = [
    { emotion: 'happy', label: '开心', icon: '😄' },
    { emotion: 'thinking', label: '思考', icon: '🤔' },
    { emotion: 'celebrating', label: '庆祝', icon: '🎉' },
    { emotion: 'surprised', label: '惊讶', icon: '😲' },
    { emotion: 'sleeping', label: '休息', icon: '😴' },
    { emotion: 'idle', label: '复位', icon: '🐾' }
  ];

  return (
    <div className="no-drag" style={{ width: '100%', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 20 }}>
      {/* Emotion quick bar popup */}
      {showEmotions && (
        <div style={{
          background: 'rgba(11, 16, 28, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '6px 8px',
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {emotionsList.map(item => (
            <button
              key={item.emotion}
              onClick={() => {
                onSetEmotion(item.emotion);
                setShowEmotions(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: '#e2e8f0',
                transition: 'transform 0.15s ease'
              }}
              title={item.label}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: '11px' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Size Adjustment Popover */}
      {showSizeMenu && onChangeScale && (
        <div style={{
          background: 'rgba(11, 16, 28, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.15)',
          animation: 'bubblePop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Header with percentage & reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Scaling size={13} style={{ color: '#38bdf8' }} /> 伴侣大小调节
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontFamily: 'monospace'
              }}>
                {Math.round((currentScale || 1) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => onChangeScale(1.0)}
                title="复位到 100% 标准大小"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RotateCcw size={11} />
              </button>
            </div>
          </div>

          {/* Stepper + Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => onChangeScale(Math.max(0.5, Math.round(((currentScale || 1) - 0.1) * 100) / 100))}
              title="缩小 -10%"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Minus size={12} />
            </button>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={currentScale || 1.0}
              onChange={(e) => onChangeScale(Number(e.target.value))}
              className="studio-slider"
              style={{ flex: 1 }}
            />

            <button
              type="button"
              onClick={() => onChangeScale(Math.min(2.0, Math.round(((currentScale || 1) + 0.1) * 100) / 100))}
              title="放大 +10%"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
            {[
              { label: '迷你 (70%)', scale: 0.7 },
              { label: '标准 (100%)', scale: 1.0 },
              { label: '清晰 (130%)', scale: 1.3 },
              { label: '超大 (160%)', scale: 1.6 }
            ].map(chip => {
              const isActive = Math.abs((currentScale || 1.0) - chip.scale) < 0.04;
              return (
                <button
                  key={chip.scale}
                  type="button"
                  onClick={() => onChangeScale(chip.scale)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    fontSize: '10.5px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Audio Adjustment Popover */}
      {showAudioMenu && (
        <div style={{
          background: 'rgba(11, 16, 28, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} style={{ color: '#38bdf8' }} />
              <span>音量与声音</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: isSoundMuted ? '#f87171' : '#38bdf8',
                background: isSoundMuted ? 'rgba(248, 113, 113, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {isSoundMuted ? '静音' : `${Math.round((currentVolume ?? 0.8) * 100)}%`}
              </span>
              <button
                type="button"
                onClick={onToggleSound}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isSoundMuted ? '#f87171' : '#38bdf8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={isSoundMuted ? '解除静音' : '快速静音'}
              >
                {isSoundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>

          {/* Volume Slider */}
          {onChangeVolume && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isSoundMuted ? 0 : (currentVolume ?? 0.8)}
                disabled={isSoundMuted}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#38bdf8', height: '4px', cursor: isSoundMuted ? 'not-allowed' : 'pointer' }}
              />
            </div>
          )}

          {/* Quick Presets & Full Center Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { label: '30%', val: 0.3 },
                { label: '60%', val: 0.6 },
                { label: '100%', val: 1.0 },
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    if (onChangeVolume) onChangeVolume(chip.val);
                  }}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-sub)',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {onOpenAudioCenter && (
              <button
                type="button"
                onClick={() => {
                  setShowAudioMenu(false);
                  onOpenAudioCenter();
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500
                }}
              >
                <span>🎛️ 音频控制中心</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main chat input row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(11, 16, 28, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '6px 10px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
        }}>
          {/* Agent connection indicator */}
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              background: isWsConnected ? '#10b981' : '#f59e0b',
              boxShadow: isWsConnected ? '0 0 8px #10b981' : 'none'
            }}
            title={isWsConnected ? 'Agent Gateway 已就绪 (端口 18989)' : '正在连接本地 Agent Gateway...'}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="呼叫伴侣或提问..."
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '12px'
            }}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              opacity: (!input.trim() || isLoading) ? 0.35 : 1,
              cursor: (!input.trim() || isLoading) ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            title="发送 (Enter)"
          >
            <Send size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Action icons button group */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'rgba(11, 16, 28, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '4px 5px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
        }}>
          <button
            type="button"
            onClick={() => {
              setShowEmotions(!showEmotions);
              setShowSizeMenu(false);
            }}
            style={{
              flexShrink: 0,
              background: showEmotions ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: 'none',
              color: showEmotions ? '#38bdf8' : 'var(--text-sub)',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="切换表情"
          >
            <Smile size={14} />
          </button>

          {onChangeScale && (
            <button
              type="button"
              onClick={() => {
                setShowSizeMenu(!showSizeMenu);
                setShowEmotions(false);
              }}
              style={{
                flexShrink: 0,
                background: showSizeMenu ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: 'none',
                color: showSizeMenu ? '#38bdf8' : 'var(--text-sub)',
                padding: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="调节伴侣尺寸 (缩放)"
            >
              <Scaling size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowAudioMenu(!showAudioMenu);
              setShowSizeMenu(false);
              setShowEmotions(false);
            }}
            style={{
              flexShrink: 0,
              background: showAudioMenu ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: 'none',
              color: isSoundMuted ? 'var(--text-dim)' : '#38bdf8',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isSoundMuted ? '声音已静音 (点击调音/打开音频控制中心)' : '音量与音频设置 (点击打开控制中心)'}
          >
            {isSoundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="打开形象工坊与控制中心"
          >
            <Settings size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
