/**
 * 特教專屬語音朗讀 (TTS) 與低刺激柔和音效系統 (Web Audio API)
 * 專為學障（語音念題）、自閉症（低感官超載、可完全靜音）、智能障礙（正向增強）設計
 */

class SpecialEdAudioSystem {
  constructor() {
    this.audioCtx = null;
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isMuted = false;
    this.speechRate = 1; // 預製女聲已略慢；保留自然語調，需要時可再調慢。
    this.preferredVoice = null;
    this.isSpeaking = false;
    this.currentRecording = null;
    this.speechGeneration = 0;
    this.assetBase = typeof document !== 'undefined' && document.currentScript?.src ? new URL('../', document.currentScript.src).href : '';
    this.availableVoices = [];

    if (typeof window !== 'undefined') {
      this.initAudioContext();
      this.initVoices();
      window.addEventListener?.('pagehide', () => this.stopSpeech());
    }
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
    }
  }

  ensureAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initVoices() {
    if (!this.speechSynth) return;
    const updateVoices = () => {
      const voices = this.speechSynth.getVoices();
      this.availableVoices = voices;
      // 動態教具文字才使用裝置女聲；不讓瀏覽器自行改選男聲。
      const female = /hsiaochen|hsiaohan|曉臻|曉涵|meijia|美佳|ting.?ting|婷婷|sinji|善怡|ya.?ting|雅婷|hanhan|涵涵|xiaoxiao|xiaoyi|yaoyao|female|woman/i;
      const male = /yun.?jhe|yun.?yang|yun.?xi|雲哲|男|male(?!.*female)|man\b/i;
      const candidates = voices.filter(v => v.lang?.startsWith('zh') && female.test(v.name || '') && !male.test((v.name || '').replace(/female|woman/gi, '')));
      this.preferredVoice = candidates.find(v => v.lang === 'zh-TW') || candidates[0] || null;
    };

    updateVoices();
    if (typeof this.speechSynth.onvoiceschanged !== 'undefined') {
      this.speechSynth.onvoiceschanged = updateVoices;
    }
  }

  toggleMute(btnElement) {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeech();
    }
    if (btnElement) {
      btnElement.classList.toggle('active', this.isMuted);
      btnElement.setAttribute('aria-pressed', this.isMuted);
      btnElement.innerHTML = this.isMuted ? '🔇 靜音模式' : '🔊 聲音開啟';
    }
    return this.isMuted;
  }

  setSpeechRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(1.5, rate));
    if (this.currentRecording) this.currentRecording.playbackRate = this.speechRate;
  }

  // 數字轉繁體中文口語發音（支援 0 ~ 99999）
  numToChinese(n) {
    if (n === 0) return "零";
    const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const units = ["", "十", "百", "千"];
    
    if (n === 10000) return "一萬";
    if (n < 0) return "負" + this.numToChinese(-n);

    let num = n;
    let res = "";
    let wan = Math.floor(num / 10000);
    let rem = num % 10000;

    const read4 = (val) => {
      let s = "";
      let zero = false;
      let started = false;
      const d = [
        Math.floor(val / 1000),
        Math.floor((val % 1000) / 100),
        Math.floor((val % 100) / 10),
        val % 10
      ];
      for (let i = 0; i < 4; i++) {
        let digit = d[i];
        if (digit !== 0) {
          if (zero && started) {
            s += "零";
            zero = false;
          }
          if (i === 2 && digit === 1 && !started) {
            s += "十";
          } else if (i === 0 && digit === 2) {
            s += "兩千";
          } else {
            s += digits[digit] + units[3 - i];
          }
          started = true;
        } else {
          if (started) zero = true;
        }
      }
      return s;
    };

    if (wan > 0) {
      res += read4(wan) + "萬";
      if (rem < 1000 && rem > 0) res += "零";
    }
    if (rem > 0 || !res) {
      res += read4(rem);
    }
    return res;
  }

  // 數學題目、運算符號與解題音檔口語化清理（排除破音與唸錯）
  cleanMathTextForTTS(text) {
    if (!text) return "";
    let s = String(text);

    // 1. 去除特需策略等內部標註，避免朗讀括號內容干擾
    s = s.replace(/【[^】]*】/g, "");

    // 2. 轉換分數：如 1/4 -> 四分之一, 3/8 -> 八分之三
    s = s.replace(/(\d+)\s*[/／]\s*(\d+)/g, (match, num, den) => {
      return this.numToChinese(parseInt(den, 10)) + "分之" + this.numToChinese(parseInt(num, 10));
    });

    // 3. 轉換除法餘數：如 4 ... 3 或 4...3 或 4 餘 3 -> 4，餘 3
    s = s.replace(/(\d+)\s*(?:\.\.\.|…|……)\s*(\d+)/g, "$1，餘 $2");

    // 4. 轉換度量衡英文縮寫（避免與中文重複或唸成英文字母）
    s = s.replace(/公分[\(（]\s*cm\s*[\)）]/gi, "公分").replace(/[\(（]\s*cm\s*[\)）]/gi, "公分").replace(/\bcm\b/gi, "公分");
    s = s.replace(/毫米[\(（]\s*mm\s*[\)）]/gi, "毫米").replace(/[\(（]\s*mm\s*[\)）]/gi, "毫米").replace(/\bmm\b/gi, "毫米");
    s = s.replace(/毫升[\(（]\s*mL\s*[\)）]/gi, "毫升").replace(/[\(（]\s*mL\s*[\)）]/gi, "毫升").replace(/\bmL\b|\bml\b/gi, "毫升");
    s = s.replace(/公升[\(（]\s*L\s*[\)）]/gi, "公升").replace(/[\(（]\s*L\s*[\)）]/gi, "公升").replace(/\bL\b/g, "公升");
    s = s.replace(/公尺[\(（]\s*m\s*[\)）]/gi, "公尺").replace(/[\(（]\s*m\s*[\)）]/gi, "公尺");
    s = s.replace(/公斤[\(（]\s*kg\s*[\)）]/gi, "公斤").replace(/[\(（]\s*kg\s*[\)）]/gi, "公斤").replace(/\bkg\b/gi, "公斤");
    s = s.replace(/公克[\(（]\s*g\s*[\)）]/gi, "公克").replace(/[\(（]\s*g\s*[\)）]/gi, "公克").replace(/\bg\b/gi, "公克");

    // 5. 轉換箭頭符號
    s = s.replace(/[➔→▶]|->/g, "，接著到 ");

    // 6. 運算符號口語化
    s = s.replace(/[×*✕]/g, " 乘以 ");
    s = s.replace(/÷/g, " 除以 ");
    s = s.replace(/[＋+]/g, " 加上 ");
    s = s.replace(/([0-9\u4e00-\u9fa5]+)\s*[－\-]\s*([0-9\u4e00-\u9fa5]+)/g, "$1 減去 $2");

    // 7. 關係與比大小符號口語化
    s = s.replace(/\s*[＝=]\s*/g, " 等於 ");
    s = s.replace(/\s*[＜<]\s*/g, " 小於 ");
    s = s.replace(/\s*[＞>]\s*/g, " 大於 ");

    // 8. 多位數數字轉中文自然發音（避免 TTS 唸成「四零零零」或「六四五二」）
    s = s.replace(/\b\d+\b/g, (match) => {
      const val = parseInt(match, 10);
      if (!isNaN(val) && val <= 99999) {
        return this.numToChinese(val);
      }
      return match;
    });

    // 9. 清理冗贅括號、選項標籤、表情符號
    s = s.replace(/[（\(][A-Da-d][\)）]/g, ""); // 移除 (A) (B)
    s = s.replace(/([一二三四五六七八九十百千萬]+分之[一二三四五六七八九十百千萬]+)\s*[（\(]\s*\1\s*[\)）]/g, "$1"); // 移除重複括號分數
    s = s.replace(/[（\(][\)）]/g, "");
    s = s.replace(/[🪜💡🔊🎉💪🟢🟡🟣⭐]/g, "");
    s = s.replace(/[:：]/g, "，");
    s = s.replace(/[，,]{2,}/g, "，");
    s = s.replace(/[。.]{2,}/g, "。");
    s = s.replace(/\s+/g, " ").trim();

    return s;
  }

  // 固定教材優先播放預製曉臻女聲；隨機數字的教具說明才使用裝置女聲。
  speak(text, onStart, onEnd, options = {}) {
    if (this.isMuted) return;
    this.stopSpeech();
    const lang = options.lang || (typeof window !== 'undefined' && window.MathI18n?.language === 'en' ? 'en-US' : 'zh-TW');
    const localizedText = lang.startsWith('en') && typeof window !== 'undefined' ? window.MathI18n?.t(text) ?? text : text;
    const cleanText = lang.startsWith('en') ? String(localizedText || '').replace(/<[^>]+>/g, '').replace(/(\d+)\s*\/\s*(\d+)/g,'$1 over $2').replace(/×/g,' times ').replace(/÷/g,' divided by ').replace(/\+/g,' plus ').replace(/[−－]/g,' minus ').replace(/=/g,' equals ').trim() : this.cleanMathTextForTTS(text);
    if (!cleanText) return;
    const token = this.speechGeneration;
    const catalog = typeof window !== 'undefined' ? window.MathFemaleAudio : null;
    const parts = catalog?.sequences?.[cleanText] || [cleanText];
    const paths = parts.map(part => catalog?.clips?.[part]);
    if (!lang.startsWith('en') && paths.length && paths.every(Boolean) && typeof window.Audio === 'function') {
      this.playRecording(paths, token, onStart, onEnd, () => this.speakDeviceVoice(cleanText, token, onStart, onEnd, lang));
    } else {
      this.speakDeviceVoice(cleanText, token, onStart, onEnd, lang);
    }
  }

  playRecording(paths, token, onStart, onEnd, fallback) {
    let index = 0, started = false;
    const playNext = () => {
      if (token !== this.speechGeneration || this.isMuted) return;
      if (index >= paths.length) {
        this.currentRecording = null;
        this.isSpeaking = false;
        if (typeof onEnd === 'function') onEnd();
        return;
      }
      const relative = paths[index++];
      const audio = new window.Audio(this.assetBase ? new URL(relative, this.assetBase).href : relative);
      this.currentRecording = audio;
      if (typeof document !== 'undefined') {
        audio.hidden = true;
        audio.setAttribute('data-math-speech', 'female');
        document.body.appendChild(audio);
      }
      audio.playbackRate = this.speechRate;
      audio.preservesPitch = true;
      let failed = false;
      const fail = () => {
        if (failed || token !== this.speechGeneration || this.currentRecording !== audio) return;
        failed = true;
        audio.pause();
        audio.remove?.();
        this.currentRecording = null;
        this.isSpeaking = false;
        // 只有尚未開始的音檔才改用裝置女聲，避免重複朗讀已播放的內容。
        if (!started) fallback();
        else this.announceSpeechUnavailable();
      };
      audio.onplaying = () => {
        if (token !== this.speechGeneration || this.currentRecording !== audio) return;
        this.isSpeaking = true;
        if (typeof document !== 'undefined') document.getElementById('speech-playback-status')?.remove();
        if (!started) { started = true; if (typeof onStart === 'function') onStart(); }
      };
      audio.onended = () => {
        audio.remove?.();
        if (token === this.speechGeneration && this.currentRecording === audio) playNext();
      };
      audio.onerror = fail;
      try {
        const result = audio.play();
        result?.catch(fail);
      } catch { fail(); }
    };
    playNext();
  }

  speakDeviceVoice(cleanText, token, onStart, onEnd, lang = 'zh-TW') {
    if (token !== this.speechGeneration || this.isMuted) return;
    const voice = lang.startsWith('en') ? this.availableVoices.find(v => v.lang?.startsWith('en') && /samantha|karen|moira|tessa|sandy|shelley|victoria|zira|aria|jenny|female/i.test(v.name || '')) : this.preferredVoice;
    if (!this.speechSynth || !voice) {
      this.isSpeaking = false;
      this.announceSpeechUnavailable();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = this.speechRate;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (token !== this.speechGeneration) return;
      this.isSpeaking = true;
      if (typeof onStart === 'function') onStart();
    };

    utterance.onend = () => {
      if (token !== this.speechGeneration) return;
      this.isSpeaking = false;
      if (typeof onEnd === 'function') onEnd();
    };

    utterance.onerror = () => {
      if (token !== this.speechGeneration) return;
      this.isSpeaking = false;
      this.announceSpeechUnavailable();
    };

    this.speechSynth.speak(utterance);
  }

  stopSpeech() {
    this.speechGeneration++;
    if (this.currentRecording) {
      const audio = this.currentRecording;
      this.currentRecording = null;
      audio.onplaying = audio.onended = audio.onerror = null;
      audio.pause();
      audio.remove?.();
      audio.removeAttribute?.('src');
      audio.load?.();
    }
    if (this.speechSynth && (this.speechSynth.speaking || this.speechSynth.pending)) {
      this.speechSynth.cancel();
    }
    this.isSpeaking = false;
  }

  announceSpeechUnavailable() {
    if (typeof document === 'undefined') return;
    let status = document.getElementById('speech-playback-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'speech-playback-status';
      status.setAttribute('role', 'status');
      status.className = 'speech-playback-status';
      document.body.appendChild(status);
    }
    status.textContent = '暫時無法播放女聲，請再點一次朗讀，或閱讀畫面上的文字提示。';
  }

  // Web Audio 柔和音效（無外部檔案依賴，保護自閉症學童聽覺）
  playTone(frequencies = [523.25], type = 'sine', duration = 0.3, volume = 0.15) {
    if (this.isMuted || !this.audioCtx) return;
    this.ensureAudioContext();

    const now = this.audioCtx.currentTime;
    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(volume, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + duration);
    });
  }

  // 答對時的歡樂遊戲機過關大合弦與精靈星光聲 (Fanfare)
  playCorrect() {
    this.playFanfare();
  }

  // 璀璨過關大號角 (C5 -> E5 -> G5 -> C6 -> E6 快速琶音 + 閃爍鈴鐺)
  playFanfare() {
    if (this.isMuted || !this.audioCtx) return;
    this.ensureAudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const now = this.audioCtx.currentTime;

    // 琶音主旋律
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });

    // 伴隨精靈閃爍星光 (Sparkle Chimes)
    const sparkles = [1567.98, 2093.00, 2637.02];
    sparkles.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.35 + i * 0.05);

      gain.gain.setValueAtTime(0.001, now + 0.35 + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.35 + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + 0.35 + i * 0.05);
      osc.stop(now + 0.35 + i * 0.05 + 0.35);
    });
  }

  // 答錯時的溫暖撫慰抱抱和弦 (F4 -> A4 -> C5 -> E5 柔和木琴/暖心豎琴，消除焦慮)
  playEncouragement() {
    if (this.isMuted || !this.audioCtx) return;
    this.ensureAudioContext();

    const notes = [349.23, 440.00, 523.25, 659.25];
    const now = this.audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.09 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.55);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.55);
    });
  }

  // 雙人搶答專用搶答器鈴聲 (Buzzer Chime)
  playBuzzer(team = 'blue') {
    if (this.isMuted || !this.audioCtx) return;
    this.ensureAudioContext();

    const freqs = team === 'blue' ? [659.25, 987.77] : [587.33, 880.00];
    const now = this.audioCtx.currentTime;

    freqs.forEach((f, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  }

  // 提示或操作反饋音
  playHint() {
    this.playTone([440, 554.37], 'triangle', 0.25, 0.08);
  }

  // 點擊觸覺反饋小音效
  playClick() {
    this.playTone([600], 'sine', 0.08, 0.04);
  }

  // 錢幣投入/積木計數聲
  playCoin() {
    this.playTone([987.77, 1318.51], 'sine', 0.2, 0.1);
  }

  // 水流注水泡泡聲（容量量筒）
  playWater() {
    if (this.isMuted || !this.audioCtx) return;
    this.ensureAudioContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 完美通關溫暖喝采琶音 (C5 -> E5 -> G5 -> C6)
  playCelebration() {
    this.playTone([523.25, 659.25, 783.99, 1046.50], 'sine', 0.7, 0.15);
  }
}

// 建立全域音效與語音實例
if (typeof window !== 'undefined') {
  window.spEdAudio = new SpecialEdAudioSystem();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpecialEdAudioSystem;
}
