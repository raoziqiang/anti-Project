import { LLMConfig, AppSettings, Persona, PetAvatar } from '../types';
import { agentService } from './agentService';

export interface PersistentConfig {
  llmConfig?: Partial<LLMConfig>;
  appSettings?: Partial<AppSettings>;
  currentPersona?: Partial<Persona>;
  activePetId?: string;
  pets?: PetAvatar[];
  forceClearApiKey?: boolean;
}

class ConfigService {
  private listeners: Set<(config: PersistentConfig) => void> = new Set();
  private gatewayPort: number = 18989;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPatch: PersistentConfig = {};
  private lastSavedHash: string = '';

  constructor() {
    this.initListeners();
  }

  public setGatewayPort(port: number) {
    this.gatewayPort = port;
  }

  private initListeners() {
    // 1. Electron IPC config-updated listener (from other windows)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onConfigUpdated) {
      (window as any).electronAPI.onConfigUpdated((updated: PersistentConfig) => {
        this.handleExternalConfig(updated);
      });
    }

    // 2. WebSocket gateway listener
    agentService.onConfigUpdated((updated: PersistentConfig) => {
      this.handleExternalConfig(updated);
    });

    // 3. Fallback: window storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (!e.key || !e.newValue) return;
        try {
          if (e.key === 'ai_pet_llm') {
            this.handleExternalConfig({ llmConfig: JSON.parse(e.newValue) });
          } else if (e.key === 'ai_pet_settings') {
            this.handleExternalConfig({ appSettings: JSON.parse(e.newValue) });
          } else if (e.key === 'ai_pet_persona') {
            this.handleExternalConfig({ currentPersona: JSON.parse(e.newValue) });
          } else if (e.key === 'ai_pet_active_id') {
            this.handleExternalConfig({ activePetId: e.newValue });
          } else if (e.key === 'ai_pet_list') {
            this.handleExternalConfig({ pets: JSON.parse(e.newValue) });
          }
        } catch {}
      });
    }
  }

  private handleExternalConfig(config: PersistentConfig) {
    const json = JSON.stringify(config);
    if (json === this.lastSavedHash) {
      return; // Suppress echo from our own saves
    }
    this.notifyListeners(config);
  }

  private notifyListeners(config: PersistentConfig) {
    this.listeners.forEach((fn) => {
      try {
        fn(config);
      } catch (err) {
        console.error('[ConfigService] Listener error:', err);
      }
    });
  }

  public onConfigChange(callback: (config: PersistentConfig) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Load configuration with multi-tier fallback:
   * 1. Electron IPC loadConfig (reads disk %APPDATA%/AI-Desktop-Pet/config.json or user-config.json)
   * 2. Gateway REST API GET /api/config
   * 3. Browser localStorage
   */
  public async loadPersistentConfig(): Promise<PersistentConfig> {
    let diskConfig: PersistentConfig = {};

    // 1. Check Electron IPC
    if (typeof window !== 'undefined' && (window as any).electronAPI?.loadConfig) {
      try {
        const res = await (window as any).electronAPI.loadConfig();
        if (res && typeof res === 'object') {
          diskConfig = res;
        }
      } catch (e) {
        console.warn('[ConfigService] Electron loadConfig failed:', e);
      }
    }

    // 2. If no config or no apiKey found yet, query Gateway REST endpoint
    if (!diskConfig.llmConfig?.apiKey) {
      try {
        const port = this.gatewayPort || 18989;
        const res = await fetch(`http://localhost:${port}/api/config`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            diskConfig = {
              ...data.config,
              ...diskConfig,
              llmConfig: {
                ...(data.config.llmConfig || {}),
                ...(diskConfig.llmConfig || {})
              }
            };
          }
        }
      } catch (e) {
        // Gateway might be initializing, harmless
      }
    }

    // 3. Reconcile with localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localLlm = localStorage.getItem('ai_pet_llm');
        if (localLlm) {
          const parsed = JSON.parse(localLlm);
          diskConfig.llmConfig = {
            ...parsed,
            ...(diskConfig.llmConfig || {}),
            apiKey: diskConfig.llmConfig?.apiKey || parsed.apiKey || ''
          };
        }

        const localSettings = localStorage.getItem('ai_pet_settings');
        if (localSettings && !diskConfig.appSettings) {
          diskConfig.appSettings = JSON.parse(localSettings);
        }

        const localPersona = localStorage.getItem('ai_pet_persona');
        if (localPersona && !diskConfig.currentPersona) {
          diskConfig.currentPersona = JSON.parse(localPersona);
        }

        const localPetId = localStorage.getItem('ai_pet_active_id');
        if (localPetId && !diskConfig.activePetId) {
          diskConfig.activePetId = localPetId;
        }

        const localPets = localStorage.getItem('ai_pet_list');
        if (localPets && !diskConfig.pets) {
          diskConfig.pets = JSON.parse(localPets);
        }
      } catch (e) {
        console.warn('[ConfigService] Error reading localStorage:', e);
      }
    }

    // Record baseline hash so initial render doesn't re-save identical data
    this.lastSavedHash = JSON.stringify(diskConfig);

    // Synchronize disk values back to localStorage for instant startup cache
    if (diskConfig.llmConfig) {
      try {
        localStorage.setItem('ai_pet_llm', JSON.stringify(diskConfig.llmConfig));
      } catch {}
    }

    return diskConfig;
  }

  /**
   * Save configuration to persistence layers:
   * - Immediately syncs to browser localStorage for responsive UI
   * - Debounced (300ms) write to Electron IPC (or Gateway REST if in browser mode)
   */
  public async savePersistentConfig(patch: PersistentConfig): Promise<boolean> {
    // 1. Immediately cache in localStorage (synchronous and instant)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (patch.llmConfig) {
          const current = localStorage.getItem('ai_pet_llm');
          const merged = current ? { ...JSON.parse(current), ...patch.llmConfig } : patch.llmConfig;
          localStorage.setItem('ai_pet_llm', JSON.stringify(merged));
        }
        if (patch.appSettings) {
          const current = localStorage.getItem('ai_pet_settings');
          const merged = current ? { ...JSON.parse(current), ...patch.appSettings } : patch.appSettings;
          localStorage.setItem('ai_pet_settings', JSON.stringify(merged));
        }
        if (patch.currentPersona) {
          const current = localStorage.getItem('ai_pet_persona');
          const merged = current ? { ...JSON.parse(current), ...patch.currentPersona } : patch.currentPersona;
          localStorage.setItem('ai_pet_persona', JSON.stringify(merged));
        }
        if (patch.activePetId) {
          localStorage.setItem('ai_pet_active_id', patch.activePetId);
        }
        if (patch.pets) {
          localStorage.setItem('ai_pet_list', JSON.stringify(patch.pets));
        }
      } catch (e) {
        console.warn('[ConfigService] localStorage save error:', e);
      }
    }

    // 2. Buffer patches
    this.pendingPatch = {
      ...this.pendingPatch,
      ...patch,
      llmConfig: {
        ...(this.pendingPatch.llmConfig || {}),
        ...(patch.llmConfig || {})
      },
      appSettings: {
        ...(this.pendingPatch.appSettings || {}),
        ...(patch.appSettings || {})
      },
      currentPersona: {
        ...(this.pendingPatch.currentPersona || {}),
        ...(patch.currentPersona || {})
      }
    };

    // 3. Debounce actual disk / network flush
    return new Promise((resolve) => {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }

      this.saveDebounceTimer = setTimeout(async () => {
        const patchToSend = this.pendingPatch;
        this.pendingPatch = {};

        const patchJson = JSON.stringify(patchToSend);
        if (patchJson === this.lastSavedHash) {
          resolve(true);
          return;
        }

        this.lastSavedHash = patchJson;
        let saved = false;

        // If running in Electron, use IPC ONLY (avoids double write & WebSocket echo)
        if (typeof window !== 'undefined' && (window as any).electronAPI?.saveConfig) {
          try {
            await (window as any).electronAPI.saveConfig(patchToSend);
            saved = true;
          } catch (e) {
            console.warn('[ConfigService] Electron saveConfig failed:', e);
          }
        } else {
          // If in web browser preview, call the Gateway REST API
          try {
            const port = this.gatewayPort || 18989;
            const res = await fetch(`http://localhost:${port}/api/config`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: patchJson,
              signal: AbortSignal.timeout(1500)
            });
            if (res.ok) {
              saved = true;
            }
          } catch (e) {
            // Harmless if offline
          }
        }

        resolve(saved);
      }, 300);
    });
  }
}

export const configService = new ConfigService();
