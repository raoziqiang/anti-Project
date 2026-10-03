import React, { useState, useEffect } from 'react';
import { UserCheck, Volume2, Sparkles, Sliders, MessageCircle, Mic } from 'lucide-react';
import { Persona } from '../types';
import { DEFAULT_PERSONAS } from '../data/defaultPersonas';
import { soundService, VoiceOption } from '../services/soundService';

interface PersonaEditorProps {
  currentPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  onUpdatePersona: (persona: Persona) => void;
}

export const PersonaEditor: React.FC<PersonaEditorProps> = ({
  currentPersona,
  onSelectPersona,
  onUpdatePersona
}) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const v = soundService.getVoiceOptions();
      if (v.length > 0) {
        setVoices(v);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleTestVoice = () => {
    soundService.speak(
      currentPersona.greeting || '主人，我已经准备好为您服务啦！喵~',
      currentPersona.speechPitch,
      currentPersona.speechRate,
      currentPersona.voiceName
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Persona Presets Grid */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} style={{ color: '#ec4899' }} /> 选择性格与对话人设模版
        </div>

        <div className="studio-grid-4">
          {DEFAULT_PERSONAS.map(p => {
            const isSelected = currentPersona.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPersona(p)}
                className={`preset-card ${isSelected ? 'active' : ''}`}
                style={{ padding: '14px', alignItems: 'flex-start' }}
              >
                <span className="preset-icon" style={{ fontSize: '24px' }}>{p.avatarIcon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: isSelected ? '#38bdf8' : 'var(--text-dim)', margin: '2px 0 6px 0' }}>
                    {p.title}
                  </div>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{p.greeting}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persona Form Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <MessageCircle size={15} style={{ color: '#38bdf8' }} />
            人设台词与指令微调 (System Prompt)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name & Greeting */}
          <div className="studio-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500 }}>
                人设代号与称呼:
              </label>
              <input
                type="text"
                value={currentPersona.name}
                onChange={(e) => onUpdatePersona({ ...currentPersona, name: e.target.value })}
                className="studio-input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500 }}>
                日常问候语 (点击宠物或开机问候):
              </label>
              <input
                type="text"
                value={currentPersona.greeting}
                onChange={(e) => onUpdatePersona({ ...currentPersona, greeting: e.target.value })}
                className="studio-input"
              />
            </div>
          </div>

          {/* System Prompt Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
              <span>底层人设 Prompt 指令:</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>语气习惯、口癖及情感动作</span>
            </label>
            <textarea
              value={currentPersona.systemPrompt}
              onChange={(e) => onUpdatePersona({ ...currentPersona, systemPrompt: e.target.value })}
              rows={5}
              className="studio-textarea"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* TTS Audio Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic size={14} style={{ color: '#38bdf8' }} />
                人设发音音色 (Voice Persona):
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {voices.length > 0 ? `已检测到 ${voices.length} 种系统语音` : '使用智能优选中文音色'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <select
                  value={currentPersona.voiceName || ''}
                  onChange={(e) => onUpdatePersona({ ...currentPersona, voiceName: e.target.value || undefined })}
                  className="studio-input"
                  style={{
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    padding: '8px 12px'
                  }}
                >
                  <option value="">✨ 自动优选最佳自然中文音色 (Auto Recommended)</option>
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.label} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Pitch */}
                <div className="studio-slider-wrapper" style={{ width: '130px' }}>
                  <div className="studio-slider-header">
                    <span>音调 (Pitch)</span>
                    <span className="studio-slider-val">{currentPersona.speechPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={currentPersona.speechPitch}
                    onChange={(e) => onUpdatePersona({ ...currentPersona, speechPitch: Number(e.target.value) })}
                    className="studio-slider"
                  />
                </div>

                {/* Rate */}
                <div className="studio-slider-wrapper" style={{ width: '130px' }}>
                  <div className="studio-slider-header">
                    <span>语速 (Rate)</span>
                    <span className="studio-slider-val">{currentPersona.speechRate}</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={currentPersona.speechRate}
                    onChange={(e) => onUpdatePersona({ ...currentPersona, speechRate: Number(e.target.value) })}
                    className="studio-slider"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="studio-btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Volume2 size={14} /> 试听人设发音
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
