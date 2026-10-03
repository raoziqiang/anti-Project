// Synthesized sound effects & TTS speech engine using Web Audio API
// High-fidelity acoustic design, zero external MP3 assets needed, zero audio clipping

export interface VoiceOption {
  name: string;
  lang: string;
  label: string;
  isNatural: boolean;
  isChinese: boolean;
}

class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private isSpeakingActive: boolean = false;

  constructor() {
    this.initVoices();
    this.setupAutoUnlock();
  }

  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      ['click', 'keydown', 'touchstart'].forEach(evt => {
        window.removeEventListener(evt, unlock);
      });
    };
    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.availableVoices = v;
        }
      } catch {
        // Silently ignore
      }
    };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Dynamics compressor acts as a studio limiter to prevent digital clipping & harsh peaks
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // ==========================================
  // 高保真合成音效 (High Fidelity Sound Effects)
  // ==========================================

  /**
   * 气泡微弹 (Liquid Pop / Bubble)
   * 柔和丝滑的下降液滴声，用于常规按钮、Tab 切换和交互点击
   */
  public playPop() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 820Hz 柔和向下滑移至 400Hz，形成清脆有弹性的气泡声
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.055);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * 治愈八音盒和弦 (Kalimba & Music Box Chime)
   * 温润明亮的和弦泛音，用于伴侣欢迎、心情愉悦、AI 思考完毕回复
   */
  public playHappy() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    // C5, E5, G5, B5, C6 治愈系五音琶音
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.06;

      // 基音
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      oscGain.gain.setValueAtTime(0.001, noteTime);
      oscGain.gain.linearRampToValueAtTime(0.22, noteTime + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.32);

      // 铃音轻微高次泛音
      const overtone = ctx.createOscillator();
      const overGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.76, noteTime);

      overGain.gain.setValueAtTime(0.001, noteTime);
      overGain.gain.linearRampToValueAtTime(0.035, noteTime + 0.004);
      overGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.16);

      // 低通温润滤波器
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3400, noteTime);

      osc.connect(oscGain);
      overtone.connect(overGain);
      oscGain.connect(filter);
      overGain.connect(filter);
      filter.connect(this.masterGain!);

      osc.start(noteTime);
      overtone.start(noteTime);
      osc.stop(noteTime + 0.34);
      overtone.stop(noteTime + 0.18);
    });
  }

  /**
   * 水晶双音铃 (Crystal Alert Chime)
   * 纯澈悦耳的两声高位水晶铃（E5 -> B5），用于通知提醒与状态预警
   */
  public playAlert() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [659.25, 987.77]; // E5, B5

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

      // 泛音层
      const harm = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harm.type = 'sine';
      harm.frequency.setValueAtTime(freq * 2, t);
      harmGain.gain.setValueAtTime(0.001, t);
      harmGain.gain.linearRampToValueAtTime(0.045, t + 0.004);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      harm.connect(harmGain);
      gain.connect(this.masterGain!);
      harmGain.connect(this.masterGain!);

      osc.start(t);
      harm.start(t);
      osc.stop(t + 0.45);
      harm.stop(t + 0.25);
    });
  }

  /**
   * 梦幻庆祝礼花 (Sparkle Shimmer Arpeggio)
   * 华丽连贯的星光琶音与余韵，用于 Agent 任务圆满完成、庆祝场景
   */
  public playCelebrate() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5 ~ G6
    const now = ctx.currentTime;

    arpeggio.forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.4);
    });

    // 尾部华丽高音星芒延音
    const chimeTime = now + 0.25;
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(2093.0, chimeTime); // C7 华丽星光
    chimeGain.gain.setValueAtTime(0.001, chimeTime);
    chimeGain.gain.linearRampToValueAtTime(0.12, chimeTime + 0.008);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 0.65);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chimeOsc.start(chimeTime);
    chimeOsc.stop(chimeTime + 0.7);
  }

  /**
   * 萌动伴侣触碰 (Cute Chirp / Meow)
   * 极度可爱的音调弯音，专为点击伴侣、轻抚伴侣打造
   */
  public playPetTouch() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 680Hz -> 1060Hz -> 820Hz 形成甜美的猫咪/萌宠咕噜雀跃感
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(1060, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * 恬静安眠 (Sleepy Murmur Chime)
   * 舒缓低沉的暖音，用于伴侣入睡状态交互或轻声提醒
   */
  public playSleepChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const sleepNotes = [349.23, 261.63]; // F4 -> C4 温柔下行

    sleepNotes.forEach((freq, idx) => {
      const t = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  /**
   * 发送消息微声效 (Send Swoosh)
   * 轻快干脆的上扬气泡微音，用于发送消息
   */
  public playSend() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.05);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.075);
  }

  /**
   * 收到回复微声效 (Receive Bloop)
   * 灵动双点水滴音，用于接收到回复或 Agent 消息
   */
  public playReceive() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [783.99, 1046.5]; // G5 -> C6

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  /**
   * 触控微反馈 (Subtle Haptic Tap)
   * 15ms 超短微感音，用于细微开关切换和滑块调节
   */
  public playHapticClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.012);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.016);
  }

  // ==========================================
  // TTS 语音合成引擎 (Natural Speech Engine)
  // ==========================================

  public getVoiceOptions(): VoiceOption[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    let voices = window.speechSynthesis.getVoices();
    if ((!voices || voices.length === 0) && this.availableVoices.length > 0) {
      voices = this.availableVoices;
    }

    return voices.map(v => {
      const isChinese =
        v.lang.toLowerCase().includes('zh') ||
        v.lang.toLowerCase().includes('cmn') ||
        /chinese|晓晓|云希|晓伊|云健|普通话/i.test(v.name);

      const isNatural =
        /natural|online|neural|晓晓|xiaoxiao|云希|yunxi|晓伊|xiaoyi|云健|yunjian|google/i.test(v.name);

      let label = v.name;
      if (isNatural) label = `✨ ${label}`;

      return {
        name: v.name,
        lang: v.lang,
        label,
        isNatural,
        isChinese
      };
    }).sort((a, b) => {
      if (a.isChinese !== b.isChinese) return a.isChinese ? -1 : 1;
      if (a.isNatural !== b.isNatural) return a.isNatural ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 过滤并净化文本，剥离代码块、Markdown 格式、URL 与特殊颜文字，保证播报顺畅自然
   */
  private cleanTextForSpeech(text: string): string {
    return text
      // 代码块替换为简短语音提示，避免长篇代码逐字符念出
      .replace(/```[\s\S]*?```/g, '已生成代码。')
      // 行内代码去除反引号
      .replace(/`([^`]+)`/g, '$1')
      // Markdown 链接仅保留描述文字
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 网址链接简化为“网页链接”
      .replace(/https?:\/\/[^\s]+/g, '网页链接')
      // 移除粗体、斜体、删除线、引用与表格符
      .replace(/[*#_~>`|]/g, '')
      // 移除行首列表标记
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // 移除颜文字括号与特殊表情 (如 (｡♥‿♥｡), ٩(◕‿◕｡)۶, (^_^))
      .replace(/\([^\p{L}\p{N}]{1,15}\)/gu, '')
      // 移除 Unicode Emoji
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // 收拢连续感叹号和问号
      .replace(/[!！]{2,}/g, '！')
      .replace(/[?？]{2,}/g, '？')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 停止当前所有正在进行的语音朗读
   */
  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * 朗读语音，支持音调、语速、音色选择，并内置分句排队保护（解决 Chromium 长文本发音卡死问题）
   */
  public speak(text: string, pitch = 1.1, rate = 1.0, voiceName?: string) {
    if (this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    // 智能分句，防止长文本触发浏览器 SpeechSynthesis 阻塞卡顿 Bug
    const sentences = clean
      .split(/([。！？!?\n;；])/g)
      .reduce((acc: string[], curr: string, idx: number, arr: string[]) => {
        if (idx % 2 === 0) {
          const punct = arr[idx + 1] || '';
          const sentence = (curr + punct).trim();
          if (sentence) acc.push(sentence);
        }
        return acc;
      }, []);

    const chunks = sentences.length > 0 ? sentences : [clean];

    let voices = window.speechSynthesis.getVoices();
    if ((!voices || voices.length === 0) && this.availableVoices.length > 0) {
      voices = this.availableVoices;
    }

    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (voiceName) {
      selectedVoice = voices.find(
        v => v.name === voiceName || v.name.toLowerCase().includes(voiceName.toLowerCase())
      );
    }

    if (!selectedVoice) {
      // 智能优选高品质自然中文人声 (优先 Edge/Windows Natural Xiaoxiao, Yunxi, Xiaoyi 等)
      selectedVoice =
        voices.find(
          v =>
            (v.lang.toLowerCase().includes('zh') || v.lang.toLowerCase().includes('cmn')) &&
            /natural|online|neural|xiaoxiao|yunxi|xiaoyi|google/i.test(v.name)
        ) ||
        voices.find(
          v =>
            v.lang.toLowerCase().includes('zh') ||
            v.lang.toLowerCase().includes('cmn') ||
            /chinese/i.test(v.name)
        );
    }

    let chunkIndex = 0;
    const playNextChunk = () => {
      if (chunkIndex >= chunks.length || this.isMuted) return;

      const chunkText = chunks[chunkIndex++];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.pitch = Math.max(0.5, Math.min(1.8, pitch));
      utterance.rate = Math.max(0.6, Math.min(1.6, rate));
      utterance.volume = Math.max(0, Math.min(1.0, this.volume));

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        playNextChunk();
      };
      utterance.onerror = () => {
        playNextChunk();
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
  }
}

export const soundService = new SoundService();
