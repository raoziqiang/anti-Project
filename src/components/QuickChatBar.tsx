import React, { useState } from 'react';
import { Send, Settings, Smile, Volume2, VolumeX } from 'lucide-react';
import { PetEmotion } from '../types';

interface QuickChatBarProps {
  onSendMessage: (text: string) => void;
  onSetEmotion: (emotion: PetEmotion) => void;
  onOpenStudio: () => void;
  isWsConnected: boolean;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  isLoading?: boolean;
}

export const QuickChatBar: React.FC<QuickChatBarProps> = ({
  onSendMessage,
  onSetEmotion,
  onOpenStudio,
  isWsConnected,
  isSoundMuted,
  onToggleSound,
  isLoading
}) => {
  const [input, setInput] = useState('');
  const [showEmotions, setShowEmotions] = useState(false);

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

      {/* Main chat input row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        <div style={{
          flex: 1,
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
            placeholder="呼叫伴侣或向Agent提问..."
            disabled={isLoading}
            style={{
              flex: 1,
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
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(11, 16, 28, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '4px 6px'
        }}>
          <button
            type="button"
            onClick={() => setShowEmotions(!showEmotions)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-sub)',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="切换表情"
          >
            <Smile size={15} />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            style={{
              background: 'transparent',
              border: 'none',
              color: isSoundMuted ? 'var(--text-dim)' : '#38bdf8',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isSoundMuted ? '开启声音' : '静音'}
          >
            {isSoundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            type="button"
            onClick={onOpenStudio}
            style={{
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
            <Settings size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};
