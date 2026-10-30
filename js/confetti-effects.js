/**
 * 童趣聲光特效、五彩彩帶粒子、金幣飛行與吉祥物伴讀系統 (Confetti & Visual Effects)
 * 專為國小三年級學童與資源班設計：消除 AI 冷冰感，提供即時聲光正向增強與溫暖抱抱反饋
 */

(function(window) {
  'use strict';

  // 吉祥物角色設定
  const MASCOTS = {
    lele: {
      id: 'lele',
      name: '米米兔',
      role: '冒險小隊長',
      badge: '🐰',
      color: '#f59e0b',
      bg: '#fef3c7',
      cheers: ["答對了！來說說你怎麼想的。", "這題完成了，給自己一個小鼓勵。", "下一題，也照自己的步調來。", "答案找到了！我們再看一次方法。"],
      comforts: ["先看一個小線索，再試一次。", "我們可以用教具或圖畫想一想。", "停一下，看看題目要找什麼。", "想休息一下，再回來也可以。"]
    },
    foxie: {
      id: 'foxie',
      name: '栗栗狐',
      role: '智慧智多星',
      badge: '🦊',
      color: '#ea580c',
      bg: '#ffedd5',
      cheers: ["找到答案了！還有別的方法嗎？", "這題答對了，說說你的發現。", "把想法畫出來，也很有趣。", "完成一題了，準備好再往前。"],
      comforts: ["換個角度想想看。", "找找題目裡重要的數字和單位。", "可以先說出知道什麼，再想下一步。", "我陪你把題目分成小步驟。"]
    },
    bobo: {
      id: 'bobo',
      name: '布布熊',
      role: '暖心大抱抱',
      badge: '🐻',
      color: '#854d0e',
      bg: '#fef9c3',
      cheers: ["答對了，慢慢走也走得到。", "這一題完成了！", "說說剛剛哪一步最重要。", "先伸個懶腰，再繼續也可以。"],
      comforts: ["不用急，我們一步一步來。", "先做你有把握的那一步。", "想一想，也可以動手試試。", "先停一下，我們一起看提示。"]
    },
    tuzi: {
      id: 'tuzi',
      name: '點點貓',
      role: '敏捷飛毛腿',
      badge: '🐱',
      color: '#db2777',
      bg: '#fce7f3',
      cheers: ["找到答案了！把方法也記下來吧。", "這題答對了！", "完成這一小步了。", "接下來想試哪一種方法？"],
      comforts: ["先畫一畫，再想一想。", "看看圖和數字能不能對起來。", "換個方法試試，沒關係。", "我們先找一個小線索。"]
    }
  };

  let currentMascotKey = localStorage.getItem('spEd_active_mascot') || 'lele';

  // 1. 全螢幕五彩紙花與金星發射器 (HTML5 Canvas Confetti Engine)
  class ConfettiEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.animId = null;
      this.init();
    }

    init() {
      if (typeof document === 'undefined') return;
      this.canvas = document.getElementById('effects-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'effects-canvas';
        this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;display:none;';
        if (document.body && typeof document.body.appendChild === 'function') {
          document.body.appendChild(this.canvas);
        }
      }
      if (this.canvas && typeof this.canvas.getContext === 'function') {
        this.ctx = this.canvas.getContext('2d');
      }
      this.resize();
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('resize', () => this.resize());
      }
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    // 啟動五彩紙帶與金星慶祝特效
    blast(count = 70, durationMs = 2600) {
      if (document.body.classList.contains('calm-focus-mode') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!this.canvas || !this.ctx) return;
      this.resize();
      this.canvas.style.display = 'block';

      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
      const shapes = ['rect', 'star', 'circle', 'ribbon'];
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight * 0.45;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        this.particles.push({
          x: originX + (Math.random() - 0.5) * 100,
          y: originY + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          gravity: 0.18 + Math.random() * 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          size: 7 + Math.random() * 9,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          decay: 0.008 + Math.random() * 0.008
        });
      }

      if (!this.animId) {
        this.loop();
      }

      setTimeout(() => {
        // 自然結束後重設
        if (this.particles.length === 0 && this.canvas) {
          this.canvas.style.display = 'none';
        }
      }, durationMs);
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        this.ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        this.ctx.lineTo(x, y);
        rot += step;
      }
      this.ctx.lineTo(cx, cy - outerRadius);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }

    loop() {
      if (!this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'star') {
          this.drawStar(0, 0, 5, p.size * 1.1, p.size * 0.45, p.color);
        } else if (p.shape === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          this.ctx.fill();
        } else if (p.shape === 'ribbon') {
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size * 0.8, -p.size * 0.25, p.size * 1.6, p.size * 0.5);
        } else {
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        }

        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.animId = null;
        if (this.canvas) this.canvas.style.display = 'none';
      }
    }
  }

  // 2. 金幣星星飛向代幣存摺動畫 (Fly Coin Animation)
  function flyStarToken(sourceEl) {
    if (!sourceEl || typeof document === 'undefined') return;
    if (document.body.classList.contains('calm-focus-mode') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const destEl = document.getElementById('token-count') || document.querySelector('.token-counter');
    if (!destEl) return;

    const startRect = sourceEl.getBoundingClientRect();
    const endRect = destEl.getBoundingClientRect();

    const starFlyer = document.createElement('div');
    starFlyer.className = 'star-flyer-particle';
    starFlyer.innerHTML = '⭐ <span style="font-size:0.9rem;font-weight:900;color:#f59e0b;">+1</span>';
    starFlyer.style.cssText = `
      position: fixed;
      left: ${startRect.left + startRect.width / 2}px;
      top: ${startRect.top}px;
      font-size: 2.2rem;
      z-index: 100000;
      pointer-events: none;
      transform: translate(-50%, -50%) scale(1);
      transition: all 0.75s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      filter: drop-shadow(0 4px 10px rgba(245, 158, 11, 0.6));
    `;
    document.body.appendChild(starFlyer);

    // 強制重繪後起飛
    requestAnimationFrame(() => {
      starFlyer.style.left = `${endRect.left + endRect.width / 2}px`;
      starFlyer.style.top = `${endRect.top + endRect.height / 2}px`;
      starFlyer.style.transform = 'translate(-50%, -50%) scale(0.65)';
      starFlyer.style.opacity = '0.9';
    });

    setTimeout(() => {
      starFlyer.remove();
      // 終點跳動增強效果
      if (destEl) {
        destEl.classList.remove('pulse-celebrate');
        void destEl.offsetWidth; // 強制重繪
        destEl.classList.add('pulse-celebrate');
        if (window.spEdAudio) {
          window.spEdAudio.playCoin();
        }
      }
    }, 780);
  }

  // 3. 伴讀吉祥物即時切換與打氣語音
  function getActiveMascot() {
    return MASCOTS[currentMascotKey] || MASCOTS.lele;
  }

  function setActiveMascot(key) {
    if (MASCOTS[key]) {
      currentMascotKey = key;
      localStorage.setItem('spEd_active_mascot', key);
      renderMascotCompanion();
    }
  }

  // 渲染伴讀吉祥物互動卡片
  function renderMascotCompanion() {
    const container = document.getElementById('mascot-companion-slot');
    if (!container) return;
    const m = getActiveMascot();

    container.innerHTML = `
      <div class="mascot-companion-card" style="border-color:${m.color}; background: linear-gradient(135deg, #ffffff, ${m.bg});">
        <button type="button" class="mascot-avatar-circle" style="background:${m.color};" onclick="window.KidEffects.cheerRandomly()" aria-label="聽${m.name}打氣" title="點點我，聽吉祥物打氣！">
          <span class="mascot-emoji-big">${window.StorybookTheme?.character(m.id) || m.badge}</span>
        </button>
        <div class="mascot-info-area">
          <div class="mascot-name-row">
            <strong>${m.name}</strong>
            <span class="mascot-role-pill" style="background:${m.color}; color:#fff;">${m.role}</span>
            <div class="mascot-switcher-mini" title="換個伴讀好朋友">
              ${Object.keys(MASCOTS).map(k => `
                <button class="mascot-switch-btn ${k === currentMascotKey ? 'active' : ''}" onclick="window.KidEffects.setActiveMascot('${k}')" title="${MASCOTS[k].name}" aria-label="${MASCOTS[k].name}" aria-pressed="${k === currentMascotKey}">
                  ${window.StorybookTheme?.character(k) || MASCOTS[k].badge}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="mascot-speech-bubble" id="mascot-speech-text">
            嗨！我是你的數學冒險好朋友<strong>${m.name}</strong>！動手試試，再說說你發現了什麼。
          </div>
        </div>
      </div>
    `;
  }

  // 吉祥物隨機打氣
  function cheerRandomly() {
    const m = getActiveMascot();
    const bubble = document.getElementById('mascot-speech-text');
    const cheer = m.cheers[Math.floor(Math.random() * m.cheers.length)];
    if (bubble) {
      bubble.innerHTML = cheer;
    }
    if (window.spEdAudio) {
      window.spEdAudio.playClick();
      window.spEdAudio.speak(cheer);
    }
  }

  // 取得隨機答對讚賞詞
  function getRandomPraise() {
    const m = getActiveMascot();
    return m.cheers[Math.floor(Math.random() * m.cheers.length)];
  }

  // 取得隨機答錯溫暖鼓勵詞
  function getRandomEncouragement() {
    const m = getActiveMascot();
    return m.comforts[Math.floor(Math.random() * m.comforts.length)];
  }

  // 4. 答對時的「聲光刺激」彈出視窗 (Celebration Modal)
  function showCelebrationModal({ title = '太棒了！答對了！', hint = '', solutionSpeech = '', onNext = null }) {
    if (document.body.classList.contains('calm-focus-mode') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const existing = document.getElementById('celebration-modal');
    if (existing) existing.remove();

    const m = getActiveMascot();
    const praise = getRandomPraise();

    const modal = document.createElement('div');
    modal.id = 'celebration-modal';
    modal.className = 'kid-modal-backdrop';
    modal.innerHTML = `
      <div class="kid-modal-card celebration-card">
        <div class="celebration-sunburst"></div>
        <div class="celebration-mascot-jump">
          <span class="celebration-badge">${m.badge}</span>
          <span class="celebration-crown">👑</span>
        </div>
        <h2 class="celebration-title">🎉 ${title}</h2>
        <div class="celebration-reward-pill">
          ⭐ <strong>+1 顆星星代幣</strong> 入袋！你有耐心地完成！
        </div>
        <div class="celebration-speech-box">
          <p class="celebration-cheer">「${praise}」</p>
          ${hint ? `<p class="celebration-hint-note">💡 ${hint}</p>` : ''}
        </div>
        <div class="celebration-action-row">
          <button class="kid-btn kid-btn-solution" id="btn-modal-speak-solution">
            🔊 聽解題音檔
          </button>
          <button class="kid-btn kid-btn-primary" id="btn-modal-next-q">
            下一題 勇往直前 ➔
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 播放音檔
    const btnSpeak = modal.querySelector('#btn-modal-speak-solution');
    if (btnSpeak) {
      btnSpeak.addEventListener('click', () => {
        if (window.spEdAudio) {
          window.spEdAudio.speak(solutionSpeech || hint || praise);
        }
      });
    }

    const btnNext = modal.querySelector('#btn-modal-next-q');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        modal.remove();
        if (typeof onNext === 'function') onNext();
      });
    }

    // 點擊背景也可關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 建立全域實例
  const confetti = new ConfettiEngine();

  window.KidEffects = {
    confetti,
    triggerConfetti: (count, duration) => confetti.blast(count, duration),
    flyStarToken,
    getActiveMascot,
    setActiveMascot,
    renderMascotCompanion,
    cheerRandomly,
    getRandomPraise,
    getRandomEncouragement,
    showCelebrationModal,
    mascots: MASCOTS
  };

  // DOM 載入時自動渲染吉祥物伴讀精靈
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      renderMascotCompanion();
    });
  }

})(typeof window !== 'undefined' ? window : this);
