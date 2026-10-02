import React, { useState, useRef } from 'react';
import { Upload, Wand2, Sparkles, Sliders, Check, RefreshCw, Scissors, Image as ImageIcon, Download, Palette, Layers } from 'lucide-react';
import { PetAvatar, PetStyle, StylizeParams } from '../types';
import { StylizeService } from '../services/stylizeService';
import { soundService } from '../services/soundService';

interface StylizeStudioProps {
  onAddCustomPet: (pet: PetAvatar) => void;
  cloudApiKey?: string;
  cloudBaseUrl?: string;
}

export const StylizeStudio: React.FC<StylizeStudioProps> = ({
  onAddCustomPet,
  cloudApiKey,
  cloudBaseUrl
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMode, setProcessMode] = useState<'offline' | 'cloud'>('offline');
  const [petName, setPetName] = useState('我的二次元伴侣');

  const [params, setParams] = useState<StylizeParams>({
    style: 'anime',
    prompt: '',
    cartoonLevel: 7,
    edgeStrength: 6,
    vibrancy: 8,
    removeBackground: true,
    colorPalette: 'vibrant',
    preserveOriginalColors: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stylePresets: { style: PetStyle; label: string; icon: string; desc: string }[] = [
    { style: 'anime', label: '二次元日漫', icon: '🌸', desc: '经典赛璐珞上色与干净利落的动漫描边' },
    { style: 'cartoon', label: '皮克斯3D卡通', icon: '🎬', desc: '柔和高光饱满质感与流线立体造型' },
    { style: 'chibi', label: 'Q版黏土萌宠', icon: '🧸', desc: '大头小身体，激萌可爱度MAX' },
    { style: 'cyberpunk', label: '赛博朋克机甲', icon: '⚡', desc: '青紫高反差霓虹与未来科技机能感' },
    { style: 'ghibli', label: '吉卜力水彩', icon: '🍃', desc: '温暖治愈插画质感与柔润手工笔触' },
    { style: 'pixel', label: '复古像素画', icon: '👾', desc: '16-bit 经典掌机复古颗粒像素艺术' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUri = evt.target?.result as string;
      setSourceImage(dataUri);
      triggerStylize(dataUri, params);
    };
    reader.readAsDataURL(file);
  };

  const triggerStylize = async (imgSource: string, currentParams: StylizeParams) => {
    setIsProcessing(true);
    soundService.playPop();

    try {
      if (processMode === 'cloud' && cloudApiKey && cloudBaseUrl) {
        const result = await StylizeService.processCloudAIStylize(
          cloudApiKey,
          cloudBaseUrl,
          currentParams.prompt || 'cute anime companion',
          currentParams.style,
          imgSource
        );
        setProcessedImage(result);
      } else {
        const result = await StylizeService.processOfflineStylize(imgSource, currentParams);
        setProcessedImage(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`处理失败: ${msg}`);
      const result = await StylizeService.processOfflineStylize(imgSource, currentParams);
      setProcessedImage(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAndSave = async () => {
    if (!processedImage) return;

    soundService.playCelebrate();
    setIsProcessing(true);

    try {
      const emotionSprites = await StylizeService.generateEmotionSprites(processedImage);

      const newPet: PetAvatar = {
        id: `custom_${Date.now()}`,
        name: petName || '自制伴侣',
        style: params.style,
        description: `基于媒体定制的 ${params.style} 风格伴侣形象`,
        isCustom: true,
        sourceImage: sourceImage || undefined,
        sprites: emotionSprites,
        scale: 1
      };

      onAddCustomPet(newPet);
      alert(`🎉 形象「${newPet.name}」已成功创建并激活为当前桌面伴侣！`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`保存失败: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {/* Left: Upload & Dual Preview */}
      <div style={{ flex: '1 1 540px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {!sourceImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(56, 189, 248, 0.4)',
              borderRadius: '20px',
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              cursor: 'pointer',
              background: 'rgba(14, 21, 38, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Upload size={30} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                点击或拖拽上传任意媒体照片
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                支持自家宠物狗猫萌照、生活自拍照、手绘草图 (JPG / PNG / WebP)
              </p>
            </div>
            <div style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '11px',
              color: '#7dd3fc'
            }}>
              ⚡ 自动边缘提取 · 赛璐珞色阶分离 · 自动透明抠图
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Original Preview */}
            <div className="studio-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ImageIcon size={12} /> 原图预览
              </div>
              <div style={{
                width: '100%',
                height: '240px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(7, 10, 18, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}>
                <img src={sourceImage} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                更换其它图片
              </button>
            </div>

            {/* Stylized Preview */}
            <div className="studio-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> 二次元 / 卡通化结果 (桌面透显)
              </div>

              {/* Transparency Checkerboard */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              >
                {isProcessing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <RefreshCw size={28} className="animate-spin" />
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>AI 魔法转换中...</span>
                  </div>
                ) : processedImage ? (
                  <img
                    src={processedImage}
                    alt="Stylized Result"
                    className="animate-pet-float"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}
                  />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>请点击下方按钮生成</span>
                )}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => sourceImage && triggerStylize(sourceImage, params)}
                  disabled={isProcessing}
                  className="studio-btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                >
                  <RefreshCw size={11} className={isProcessing ? 'animate-spin' : ''} /> 重新运算
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Save Bar */}
        {processedImage && (
          <div className="studio-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>伴侣名称:</span>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="studio-input"
                style={{ width: '160px', padding: '6px 10px' }}
              />
            </div>

            <button
              onClick={handleApplyAndSave}
              disabled={isProcessing}
              className="studio-btn-primary"
            >
              <Check size={14} /> 保存并设为当前桌面伴侣
            </button>
          </div>
        )}
      </div>

      {/* Right: Controls & Presets */}
      <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Engine Switcher */}
        <div className="studio-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wand2 size={13} style={{ color: '#38bdf8' }} /> 转换引擎
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              onClick={() => {
                setProcessMode('offline');
                if (sourceImage) triggerStylize(sourceImage, { ...params });
              }}
              className={`studio-btn-secondary ${processMode === 'offline' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                padding: '7px',
                borderColor: processMode === 'offline' ? '#38bdf8' : 'var(--border-subtle)',
                color: processMode === 'offline' ? '#38bdf8' : 'var(--text-muted)',
                background: processMode === 'offline' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)'
              }}
            >
              ⚡ 免 Key 本地引擎
            </button>
            <button
              onClick={() => {
                setProcessMode('cloud');
                if (sourceImage) triggerStylize(sourceImage, { ...params });
              }}
              className={`studio-btn-secondary ${processMode === 'cloud' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                padding: '7px',
                borderColor: processMode === 'cloud' ? '#38bdf8' : 'var(--border-subtle)',
                color: processMode === 'cloud' ? '#38bdf8' : 'var(--text-muted)',
                background: processMode === 'cloud' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)'
              }}
            >
              ☁️ 云端大模型生图
            </button>
          </div>
        </div>

        {/* Style Presets */}
        <div className="studio-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={13} style={{ color: '#38bdf8' }} /> 风格预设 (Style Preset)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>即刻切换画风</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {stylePresets.map(preset => {
              const isSelected = params.style === preset.style;

              return (
                <div
                  key={preset.style}
                  onClick={() => {
                    const next = { ...params, style: preset.style };
                    setParams(next);
                    if (sourceImage) triggerStylize(sourceImage, next);
                  }}
                  className={`preset-card ${isSelected ? 'active' : ''}`}
                  style={{ padding: '10px' }}
                >
                  <span style={{ fontSize: '20px' }}>{preset.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{preset.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preset.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prompt Guidance */}
        <div className="studio-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>形象特质倾向与微调描述</span>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>Prompt</span>
          </div>
          <textarea
            value={params.prompt}
            onChange={(e) => setParams({ ...params, prompt: e.target.value })}
            placeholder="例如: 变成戴着宇航员头盔的猫咪、身穿赛博朋克风皮夹克、粉色猫耳长发..."
            rows={2}
            className="studio-textarea"
          />
        </div>

        {/* Algorithm Sliders */}
        <div className="studio-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={13} style={{ color: '#38bdf8' }} /> 画面渲染微调
          </div>

          {/* Cel-shading level */}
          <div className="studio-slider-wrapper">
            <div className="studio-slider-header">
              <span>卡通色阶 (Cel-Shading)</span>
              <span className="studio-slider-val">{params.cartoonLevel}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={params.cartoonLevel}
              onChange={(e) => {
                const next = { ...params, cartoonLevel: Number(e.target.value) };
                setParams(next);
                if (sourceImage) triggerStylize(sourceImage, next);
              }}
              className="studio-slider"
            />
          </div>

          {/* Outline strength */}
          <div className="studio-slider-wrapper">
            <div className="studio-slider-header">
              <span>二次元轮廓线 (Outline)</span>
              <span className="studio-slider-val">{params.edgeStrength}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={params.edgeStrength}
              onChange={(e) => {
                const next = { ...params, edgeStrength: Number(e.target.value) };
                setParams(next);
                if (sourceImage) triggerStylize(sourceImage, next);
              }}
              className="studio-slider"
            />
          </div>

          {/* Vibrancy */}
          <div className="studio-slider-wrapper">
            <div className="studio-slider-header">
              <span>色彩鲜艳度 (Vibrancy)</span>
              <span className="studio-slider-val">{params.vibrancy}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={params.vibrancy}
              onChange={(e) => {
                const next = { ...params, vibrancy: Number(e.target.value) };
                setParams(next);
                if (sourceImage) triggerStylize(sourceImage, next);
              }}
              className="studio-slider"
            />
          </div>

          {/* Background removal toggle */}
          <div className="studio-toggle-row" style={{ paddingTop: '8px', borderBottom: 'none' }}>
            <div className="studio-toggle-label">
              <span className="studio-toggle-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scissors size={13} style={{ color: '#ec4899' }} /> 自动抠除底色 (生成透明PNG贴纸)
              </span>
              <span className="studio-toggle-desc">去除单色背景，使伴侣自然悬浮在桌面上</span>
            </div>
            <label className="studio-switch">
              <input
                type="checkbox"
                checked={params.removeBackground}
                onChange={(e) => {
                  const next = { ...params, removeBackground: e.target.checked };
                  setParams(next);
                  if (sourceImage) triggerStylize(sourceImage, next);
                }}
              />
              <span className="studio-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
