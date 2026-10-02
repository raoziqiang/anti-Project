import React from 'react';
import { Volume2, X, Bot, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface SpeechBubbleProps {
  message: ChatMessage | null;
  isStreaming?: boolean;
  onDismiss: () => void;
  onReplayVoice?: (text: string) => void;
  onSelectOption?: (option: string, callbackId?: string) => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  isStreaming,
  onDismiss,
  onReplayVoice,
  onSelectOption
}) => {
  if (!message || !message.content) return null;

  const isAgent = message.sender === 'agent';
  const hasOptions = message.actionRequired?.type === 'choice' && message.actionRequired.options;

  return (
    <div className="no-drag" style={{ width: '100%', marginBottom: '10px', position: 'relative', zIndex: 30, animation: 'bubblePop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(13, 20, 36, 0.95) 0%, rgba(20, 29, 52, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          color: '#f8fafc'
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAgent ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '10.5px',
                fontWeight: 600
              }}>
                <Bot size={12} />
                {message.agentName || 'Agent 协同'}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#f472b6',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '10.5px',
                fontWeight: 600
              }}>
                <Sparkles size={12} />
                桌面伴侣
              </span>
            )}
            <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onReplayVoice && (
              <button
                onClick={() => onReplayVoice(message.content)}
                title="重新朗读"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '3px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Volume2 size={13} />
              </button>
            )}
            <button
              onClick={onDismiss}
              title="关闭气泡"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content text */}
        <div style={{
          fontSize: '13px',
          lineHeight: '1.6',
          maxHeight: '180px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          userSelect: 'text',
          color: '#e2e8f0',
          fontWeight: 400
        }}>
          {message.content}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: '4px',
              height: '14px',
              background: '#38bdf8',
              marginLeft: '4px',
              verticalAlign: 'middle',
              animation: 'pulseGlow 0.8s infinite'
            }} />
          )}
        </div>

        {/* Agent Choice Options */}
        {hasOptions && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {message.actionRequired?.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onSelectOption?.(option, message.actionRequired?.callbackId)}
                className="studio-btn-primary"
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Speech triangle pointer */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-7px',
            right: '48px',
            width: '14px',
            height: '14px',
            background: 'rgba(20, 29, 52, 0.98)',
            borderRight: '1px solid rgba(56, 189, 248, 0.35)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.35)',
            transform: 'rotate(45deg)'
          }}
        />
      </div>
    </div>
  );
};
