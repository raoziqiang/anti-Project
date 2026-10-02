import React, { useState, useEffect, useRef } from 'react';
import { PetAvatar, PetEmotion, ChatMessage, LLMConfig, Persona, AppSettings, AgentNotification } from './types';
import { DEFAULT_PETS } from './data/defaultPets';
import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import { PetDisplay } from './components/PetDisplay';
import { SpeechBubble } from './components/SpeechBubble';
import { QuickChatBar } from './components/QuickChatBar';
import { StudioModal } from './components/StudioModal';
import { agentService } from './services/agentService';
import { soundService } from './services/soundService';
import { LLMService } from './services/llmService';
import { Sparkles, Settings, ExternalLink, Monitor, Bot } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Core State
  const [pets, setPets] = useState<PetAvatar[]>(() => {
    try {
      const saved = localStorage.getItem('ai_pet_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PETS;
  });

  const [activePetId, setActivePetId] = useState<string>(() => {
    return localStorage.getItem('ai_pet_active_id') || DEFAULT_PETS[0].id;
  });

  const [emotion, setEmotion] = useState<PetEmotion>('idle');
  const [isSleeping, setIsSleeping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // 2. Persona State
  const [currentPersona, setCurrentPersona] = useState<Persona>(() => {
    try {
      const saved = localStorage.getItem('ai_pet_persona');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PERSONAS[0];
  });

  // 3. LLM Configuration State
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    try {
      const saved = localStorage.getItem('ai_pet_llm');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      provider: 'deepseek',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1024
    };
  });

  // 4. App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ai_pet_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      alwaysOnTop: true,
      clickThrough: false,
      soundEnabled: true,
      ttsEnabled: true,
      volume: 0.8,
      petScale: 1.0,
      opacity: 1.0,
      idleWander: false,
      activePetId: DEFAULT_PETS[0].id,
      activePersonaId: DEFAULT_PERSONAS[0].id,
      apiPort: 18989,
      mcpEnabled: true,
      currentLLM: {
        provider: 'deepseek',
        apiKey: '',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 1024
      }
    };
  });

  const [isWsConnected, setIsWsConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<AgentNotification[]>([]);

  // Detect Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;

  // Detect route/view mode: 'all' (web preview), 'pet' (desktop pet float), or 'studio' (full window config center)
  const [viewMode] = useState<'all' | 'pet' | 'studio'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'pet' || v === 'studio') return v;
    } catch {}
    return 'all';
  });

  // Active pet object
  const activePet = pets.find(p => p.id === activePetId) || pets[0] || DEFAULT_PETS[0];

  // Cross-window synchronization via localStorage storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'ai_pet_list') {
          setPets(JSON.parse(e.newValue));
        } else if (e.key === 'ai_pet_active_id') {
          setActivePetId(e.newValue);
        } else if (e.key === 'ai_pet_persona') {
          setCurrentPersona(JSON.parse(e.newValue));
        } else if (e.key === 'ai_pet_llm') {
          setLlmConfig(JSON.parse(e.newValue));
        } else if (e.key === 'ai_pet_settings') {
          setAppSettings(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('ai_pet_list', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('ai_pet_active_id', activePetId);
  }, [activePetId]);

  useEffect(() => {
    localStorage.setItem('ai_pet_persona', JSON.stringify(currentPersona));
  }, [currentPersona]);

  useEffect(() => {
    localStorage.setItem('ai_pet_llm', JSON.stringify(llmConfig));
  }, [llmConfig]);

  useEffect(() => {
    localStorage.setItem('ai_pet_settings', JSON.stringify(appSettings));
    soundService.setMuted(!appSettings.soundEnabled);
  }, [appSettings]);

  // Dynamically adapt Electron window size based on pet scale
  useEffect(() => {
    if (isElectron && viewMode === 'pet') {
      const baseWidth = 380;
      const baseHeight = 500;
      const targetWidth = Math.round(baseWidth * (0.6 + appSettings.petScale * 0.4));
      const targetHeight = Math.round(baseHeight * (0.6 + appSettings.petScale * 0.4));
      (window as any).electronAPI?.setPetWindowSize?.({
        width: targetWidth,
        height: targetHeight
      });
    }
  }, [appSettings.petScale, isElectron, viewMode]);

  // Initial welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentMessage({
        id: 'welcome',
        sender: 'pet',
        content: currentPersona.greeting,
        timestamp: Date.now(),
        emotion: 'happy'
      });
      setEmotion('happy');
      if (appSettings.soundEnabled) {
        soundService.playHappy();
        if (appSettings.ttsEnabled) {
          soundService.speak(currentPersona.greeting, currentPersona.speechPitch, currentPersona.speechRate);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activePetId]);

  // Subscribe to Agent Hub WebSocket events
  useEffect(() => {
    // Check connection interval
    const interval = setInterval(() => {
      setIsWsConnected(agentService.isWsConnected());
    }, 1500);

    // Notification listener
    const unsubNotif = agentService.onNotification((notif) => {
      setRecentNotifications(prev => [notif, ...prev.slice(0, 49)]);
      setCurrentMessage({
        id: notif.id,
        sender: 'agent',
        agentName: notif.source,
        content: `【${notif.title}】\n${notif.message}`,
        timestamp: notif.timestamp,
        emotion: notif.emotion || 'happy'
      });

      if (notif.emotion) {
        setEmotion(notif.emotion);
      }

      if (notif.sound && appSettings.soundEnabled) {
        if (notif.emotion === 'celebrating') soundService.playCelebrate();
        else soundService.playAlert();
      }
    });

    // Emotion listener
    const unsubEmotion = agentService.onEmotion((newEmotion) => {
      setEmotion(newEmotion);
    });

    // Message / Question listener
    const unsubMsg = agentService.onMessage((msg) => {
      setCurrentMessage(msg);
      if (msg.emotion) setEmotion(msg.emotion);
      if (appSettings.soundEnabled) soundService.playPop();
    });

    // Check URL parameters for electron view
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'studio') {
      setIsStudioOpen(true);
    }

    return () => {
      clearInterval(interval);
      unsubNotif();
      unsubEmotion();
      unsubMsg();
    };
  }, [appSettings]);

  // User chat submission
  const handleUserSendMessage = async (text: string) => {
    soundService.playPop();

    // Show user question briefly in bubble
    setCurrentMessage({
      id: `user_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: Date.now()
    });
    setEmotion('thinking');
    setIsStreaming(true);

    try {
      let replyAccumulated = '';
      const petMsgId = `pet_${Date.now()}`;

      await LLMService.streamChat(
        llmConfig,
        [
          { role: 'system', content: currentPersona.systemPrompt },
          { role: 'user', content: text }
        ],
        (token) => {
          replyAccumulated += token;
          setCurrentMessage({
            id: petMsgId,
            sender: 'pet',
            content: replyAccumulated,
            timestamp: Date.now(),
            emotion: 'happy'
          });
        }
      );

      setEmotion('happy');
      soundService.playHappy();

      if (appSettings.ttsEnabled) {
        soundService.speak(replyAccumulated, currentPersona.speechPitch, currentPersona.speechRate);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCurrentMessage({
        id: `err_${Date.now()}`,
        sender: 'system',
        content: `大模型请求异常: ${msg}\n\n💡 请点击右下角设置 ⚙️ 配置正确的 API Key 或切换厂商。`,
        timestamp: Date.now(),
        emotion: 'surprised'
      });
      setEmotion('surprised');
      soundService.playAlert();
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle agent option button selection
  const handleSelectOption = (option: string, callbackId?: string) => {
    soundService.playPop();
    if (callbackId) {
      agentService.respondToAgent(callbackId, option);
    }
    setCurrentMessage({
      id: `ans_${Date.now()}`,
      sender: 'user',
      content: `已选择: ${option}`,
      timestamp: Date.now()
    });
    setEmotion('happy');
  };

  // Handle custom pet add & delete
  const handleAddCustomPet = (newPet: PetAvatar) => {
    setPets(prev => [newPet, ...prev]);
    setActivePetId(newPet.id);
  };

  const handleDeleteCustomPet = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
    if (activePetId === id) {
      setActivePetId(DEFAULT_PETS[0].id);
    }
  };

  // Direct Full-Window Studio View (dedicated 1040x740 Electron window or ?view=studio)
  if (viewMode === 'studio') {
    return (
      <StudioModal
        isOpen={true}
        isFullWindow={true}
        onClose={() => {
          if (isElectron) {
            window.close();
          } else {
            window.location.search = '';
          }
        }}
        pets={pets}
        activePetId={activePetId}
        onSelectPet={(id) => {
          setActivePetId(id);
          localStorage.setItem('ai_pet_active_id', id);
        }}
        onAddCustomPet={handleAddCustomPet}
        onDeleteCustomPet={handleDeleteCustomPet}
        llmConfig={llmConfig}
        onUpdateLLMConfig={setLlmConfig}
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onUpdatePersona={setCurrentPersona}
        appSettings={appSettings}
        onUpdateAppSettings={setAppSettings}
        isWsConnected={isWsConnected}
        recentNotifications={recentNotifications}
        onTriggerTestNotification={(notif) => {
          setRecentNotifications(prev => [notif, ...prev.slice(0, 49)]);
          setEmotion(notif.emotion || 'happy');
          if (notif.sound && appSettings.soundEnabled) soundService.playHappy();
        }}
      />
    );
  }

  const handleOpenStudio = () => {
    soundService.playPop();
    if (isElectron && (window as any).electronAPI?.openStudio) {
      (window as any).electronAPI.openStudio();
    } else {
      setIsStudioOpen(true);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      userSelect: 'none'
    }}>
      {/* Background wallpaper container for web preview (transparent in electron or when view === 'pet') */}
      {!isElectron && viewMode !== 'pet' && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: 'radial-gradient(ellipse at bottom, #1e1b4b 0%, #0f172a 45%, #030712 100%)'
          }}
        >
          {/* Subtle grid decoration */}
          <div 
            style={{
              width: '100%',
              height: '100%',
              opacity: 0.15,
              backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* Web Preview Top Notice */}
          <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto', zIndex: 10 }}>
            <div style={{
              background: 'rgba(11, 16, 28, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              <span style={{ fontWeight: 600, color: '#fff' }}>AI 桌面伴侣预览模式</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>· 运行 <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>npm start</code> 即可以透明置顶悬浮于桌面</span>
            </div>

            <button
              onClick={handleOpenStudio}
              className="studio-btn-primary"
              style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px' }}
            >
              <Settings size={14} /> 打开形象工坊与控制中心
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Pet Area */}
      <div 
        style={{
          position: 'relative',
          zIndex: 20,
          width: '100%',
          maxWidth: '360px',
          margin: '0 auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          opacity: appSettings.opacity
        }}
      >
        {/* Floating Comic Speech Bubble */}
        <SpeechBubble
          message={currentMessage}
          isStreaming={isStreaming}
          onDismiss={() => setCurrentMessage(null)}
          onReplayVoice={(text) => soundService.speak(text, currentPersona.speechPitch, currentPersona.speechRate)}
          onSelectOption={handleSelectOption}
        />

        {/* Pet Avatar Display with Physics & Animations */}
        <PetDisplay
          pet={activePet}
          emotion={emotion}
          isSleeping={isSleeping}
          scale={appSettings.petScale}
          onPetClick={() => {
            setEmotion('happy');
            if (Math.random() > 0.6) {
              const remarks = [
                '在的呢！有什么任务要交给我吗？喵~',
                '今天也是元气满满的一天呢！',
                '代码写累了记得喝口水哦！',
                '任何 Agent 任务随时呼唤我~'
              ];
              const remark = remarks[Math.floor(Math.random() * remarks.length)];
              setCurrentMessage({
                id: `pet_click_${Date.now()}`,
                sender: 'pet',
                content: remark,
                timestamp: Date.now(),
                emotion: 'happy'
              });
              if (appSettings.ttsEnabled) {
                soundService.speak(remark, currentPersona.speechPitch, currentPersona.speechRate);
              }
            }
          }}
        />

        {/* Quick Chat & Action Bar */}
        <QuickChatBar
          onSendMessage={handleUserSendMessage}
          onSetEmotion={setEmotion}
          onOpenStudio={handleOpenStudio}
          isWsConnected={isWsConnected}
          isSoundMuted={!appSettings.soundEnabled}
          onToggleSound={() => setAppSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          currentScale={appSettings.petScale}
          onChangeScale={(newScale) => setAppSettings(prev => ({ ...prev, petScale: newScale }))}
          isLoading={isStreaming}
        />
      </div>

      {/* Studio / Settings Center Modal (Web mode fallback) */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        pets={pets}
        activePetId={activePetId}
        onSelectPet={(id) => setActivePetId(id)}
        onAddCustomPet={handleAddCustomPet}
        onDeleteCustomPet={handleDeleteCustomPet}
        llmConfig={llmConfig}
        onUpdateLLMConfig={setLlmConfig}
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onUpdatePersona={setCurrentPersona}
        appSettings={appSettings}
        onUpdateAppSettings={setAppSettings}
        isWsConnected={isWsConnected}
        recentNotifications={recentNotifications}
        onTriggerTestNotification={(notif) => {
          setRecentNotifications(prev => [notif, ...prev.slice(0, 49)]);
          setCurrentMessage({
            id: notif.id,
            sender: 'agent',
            agentName: notif.source,
            content: `【${notif.title}】\n${notif.message}`,
            timestamp: notif.timestamp,
            emotion: notif.emotion || 'happy'
          });
          setEmotion(notif.emotion || 'happy');
          if (notif.sound && appSettings.soundEnabled) soundService.playHappy();
        }}
      />
    </div>
  );
};
export default App;
