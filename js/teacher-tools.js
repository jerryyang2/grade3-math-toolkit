/**
 * 三年級數學備課平台 - 特教教師實務專業工具箱 (Teacher Tools)
 * 移植並優化自 101 堂特教社交技巧課備課平台之核心架構：
 * 1. 🧘 數學焦慮情緒冷靜通道 (Calm Corner: 舒適吸吐光環、視覺沙漏、5-4-3-2-1 著陸法、白噪音細雨聲、432Hz 頌缽)
 * 2. 📝 親師聯絡 & IEP 評量四合一生成器 (LINE親師訊息、特教通報網IEP草稿、A4 4合1省紙實體聯絡小單)
 * 3. ⚡ 課前 60 秒極速備課卡 (Quick 60s Briefing Card & 實體教具檢核清單)
 * 4. ⭐ 資源班 5 位同學代幣存摺 (5-Student Star Bank)
 */

(function(window) {
  'use strict';

  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ==================== 1. Web Audio 自然舒緩音訊引擎 ====================
  const MathCalmAudio = {
    ctx: null,
    rainNode: null,
    rainGain: null,
    isRainPlaying: false,

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    // 播放 432Hz / 528Hz 舒緩頌缽音叉（調息安定）
    playBowl() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const overtone = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now); // 432 Hz 合成音調（不宣稱療效）
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(864, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        overtone.start(now);
        osc.stop(now + 3.5);
        overtone.stop(now + 3.5);
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    },

    // 播放溫柔換氣提示音
    playChime() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      } catch (e) {}
    },

    // 合成舒緩自然細雨白噪音 (Filtered White Noise)
    toggleRain(callback) {
      this.init();
      if (!this.ctx) return;

      if (this.isRainPlaying) {
        this.stopRain();
        if (callback) callback(false);
      } else {
        this.startRain();
        if (callback) callback(true);
      }
    },

    startRain() {
      try {
        if (this.isRainPlaying) return;
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, this.ctx.currentTime); // 柔和低通雨聲

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.rainGain);
        this.rainGain.connect(this.ctx.destination);

        whiteNoise.start(0);
        this.rainNode = whiteNoise;
        this.isRainPlaying = true;
      } catch (e) {
        console.warn('Rain audio error:', e);
      }
    },

    stopRain() {
      if (this.rainNode) {
        try {
          this.rainNode.stop();
          this.rainNode.disconnect();
        } catch (e) {}
        this.rainNode = null;
      }
      this.isRainPlaying = false;
    }
  };

  // ==================== 2. 5 位學生代幣存摺系統 (5-Student Star Bank) ====================
  const StudentBank = {
    key: 'math_5_students_bank',
    defaultStudents: [
      { id: 1, name: "嘉", avatar: "🦁", stars: 3 },
      { id: 2, name: "萱", avatar: "🐰", stars: 4 },
      { id: 3, name: "涵", avatar: "🐬", stars: 3 },
      { id: 4, name: "凱", avatar: "🐻", stars: 2 },
      { id: 5, name: "宸", avatar: "🐨", stars: 5 }
    ],

    getStudents() {
      // 優先載入 5 位同學 (嘉、萱、涵、凱、宸)；自動遷移舊版並移除障礙類別標籤
      const stored = localStorage.getItem(this.key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 5) {
            return parsed;
          }
        } catch (e) {}
      }
      localStorage.removeItem('math_4_students_bank');
      this.save(this.defaultStudents);
      return this.defaultStudents;
    },

    save(students) {
      localStorage.setItem(this.key, JSON.stringify(students));
    },

    addStar(studentId, delta) {
      const students = this.getStudents();
      const st = students.find(s => s.id === studentId);
      if (st) {
        st.stars = Math.max(0, st.stars + delta);
        this.save(students);
        this.render();
        if (delta > 0) {
          window.spEdAudio.playCorrect();
        } else {
          window.spEdAudio.playClick();
        }
      }
    },

    render() {
      const container = document.getElementById('mathStudentsBankBar');
      if (!container) return;
      const students = this.getStudents();

      container.innerHTML = students.map(st => `
        <div class="student-bank-card" data-student-id="${st.id}">
          <div class="st-avatar-box" onclick="window.StudentBank.highFive(${st.id})" title="點擊擊掌！">
            <span class="st-avatar">${st.avatar}</span>
          </div>
          <div class="st-info">
            <div class="st-name" onclick="window.StudentBank.editName(${st.id})" title="點擊修改名字">${escapeText(st.name)}</div>
            <div class="st-stars">⭐ <strong>${st.stars}</strong> 顆</div>
          </div>
          <div class="st-actions">
            <button class="btn-star-mini" onclick="window.StudentBank.addStar(${st.id}, 1)" title="加一顆星">＋</button>
            <button class="btn-star-mini btn-star-sub" onclick="window.StudentBank.addStar(${st.id}, -1)" title="扣一顆星">－</button>
          </div>
        </div>
      `).join('');
    },

    highFive(studentId) {
      const students = this.getStudents();
      const st = students.find(s => s.id === studentId);
      if (!st) return;
      window.spEdAudio.playCelebration();
      alert(`🙌 與 ${st.name} 擊掌成功！數學小英雄超棒的！`);
    },

    editName(studentId) {
      const students = this.getStudents();
      const st = students.find(s => s.id === studentId);
      if (!st) return;
      const newName = prompt(`請輸入學生姓名或代號：`, st.name);
      if (newName && newName.trim()) {
        st.name = newName.trim().slice(0, 30);
        this.save(students);
        this.render();
        document.dispatchEvent(new CustomEvent('student-bank-renamed'));
      }
    }
  };

  // ==================== 3. 數學急性焦慮冷靜通道 (Calm Corner Logic) ====================
  let breathingTimer = null;
  let sensoryInterval = null;
  let sensorySecondsLeft = 180;
  let sensoryTotalSeconds = 180;
  let sensoryRunning = false;
  let breathingCycleCount = 0;

  window.openCalmCornerModal = function() {
    MathCalmAudio.init();
    let modal = document.getElementById('calmCornerModal');
    if (!modal) {
      createCalmCornerModalDOM();
      modal = document.getElementById('calmCornerModal');
    }
    modal.style.display = 'flex';
    switchCalmTab('breathe');
    startBreathingGuide();
  };

  window.closeCalmCornerModal = function() {
    const modal = document.getElementById('calmCornerModal');
    if (modal) modal.style.display = 'none';
    stopBreathingGuide();
    stopSensoryTimer();
    MathCalmAudio.stopRain();
    const rainBtn = document.getElementById('calmRainToggleBtn');
    if (rainBtn) {
      rainBtn.classList.remove('active');
      rainBtn.innerHTML = '🌧️ 播放細雨白噪音';
    }
  };

  window.switchCalmTab = function(tabName) {
    document.querySelectorAll('.calm-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.calm-tab-pane').forEach(p => p.style.display = 'none');

    const btn = document.getElementById(`calmTabBtn-${tabName}`);
    const pane = document.getElementById(`calmTabPane-${tabName}`);
    if (btn) btn.classList.add('active');
    if (pane) pane.style.display = 'block';

    if (tabName === 'breathe') {
      startBreathingGuide();
    } else {
      stopBreathingGuide();
    }
  };

  // 舒適吸吐光環控制
  function startBreathingGuide() {
    stopBreathingGuide();
    const bubble = document.getElementById('breathingBubble');
    const title = document.getElementById('breathingInstruction');
    const desc = document.getElementById('breathingSubInstruction');
    const counter = document.getElementById('breathingCycleCounter');
    if (!bubble) return;

    breathingCycleCount = 0;

    function runCycle() {
      bubble.className = 'breathing-bubble inhale';
      bubble.style.animationDuration = '4s';
      if (title) title.textContent = '慢慢吸氣，照自己的舒服速度';
      if (desc) desc.textContent = '光環只是節奏參考，不必吸很深，也不用跟滿秒數。';
      breathingTimer = setTimeout(() => {
        bubble.className = 'breathing-bubble exhale';
        bubble.style.animationDuration = '4s';
        if (title) title.textContent = '輕輕吐氣，不需要憋氣';
        if (desc) desc.textContent = '也可以只看光環、安靜坐一下，準備好再回來。';
        breathingTimer = setTimeout(() => {
          breathingCycleCount++;
          if (counter) counter.textContent = `已看過 ${breathingCycleCount} 次吸吐節奏`;
          runCycle();
        }, 4000);
      }, 4000);
    }

    runCycle();
  }

  function stopBreathingGuide() {
    if (breathingTimer) {
      clearTimeout(breathingTimer);
      breathingTimer = null;
    }
  }

  // 視覺沙漏計時器
  window.setSensoryTimerDuration = function(minutes) {
    stopSensoryTimer();
    sensoryTotalSeconds = minutes * 60;
    sensorySecondsLeft = sensoryTotalSeconds;
    updateSensoryTimerDisplay();
    document.querySelectorAll('.timer-pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
  };

  function updateSensoryTimerDisplay() {
    const min = Math.floor(sensorySecondsLeft / 60);
    const sec = sensorySecondsLeft % 60;
    const txt = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const el = document.getElementById('sensoryTimerText');
    const fill = document.getElementById('sensoryTimerFill');
    if (el) el.innerText = txt;
    if (fill) {
      const pct = ((sensoryTotalSeconds - sensorySecondsLeft) / sensoryTotalSeconds) * 100;
      fill.style.width = `${pct}%`;
    }
  }

  window.toggleSensoryTimer = function() {
    const btn = document.getElementById('sensoryTimerToggleBtn');
    if (sensoryRunning) {
      stopSensoryTimer();
      if (btn) btn.innerHTML = '▶️ 繼續冷靜倒數';
    } else {
      sensoryRunning = true;
      if (btn) btn.innerHTML = '⏸️ 暫停計時';
      sensoryInterval = setInterval(() => {
        sensorySecondsLeft--;
        updateSensoryTimerDisplay();
        if (sensorySecondsLeft <= 0) {
          stopSensoryTimer();
          MathCalmAudio.playBowl();
          alert('🧘 冷靜調息時間到！大腦已經重新充電，我們慢慢回到數學課堂吧！');
        }
      }, 1000);
    }
  };

  function stopSensoryTimer() {
    if (sensoryInterval) {
      clearInterval(sensoryInterval);
      sensoryInterval = null;
    }
    sensoryRunning = false;
    const btn = document.getElementById('sensoryTimerToggleBtn');
    if (btn) btn.innerHTML = '▶️ 開始冷靜倒數';
  }

  window.resetSensoryTimer = function() {
    stopSensoryTimer();
    sensorySecondsLeft = sensoryTotalSeconds;
    updateSensoryTimerDisplay();
  };

  // 5-4-3-2-1 五感著陸法 (Grounding Technique)
  window.toggleGroundingCheck = function(num) {
    const checkEl = document.getElementById(`groundingCheck-${num}`);
    if (!checkEl) return;
    const isChecked = checkEl.classList.toggle('checked');
    checkEl.innerHTML = isChecked ? '✓' : '';
    MathCalmAudio.playChime();

    const checkedCount = document.querySelectorAll('.grounding-item-box .grounding-check.checked').length;
    const statusText = document.getElementById('groundingStatusText');
    if (statusText) {
      statusText.innerText = `完成進度：${checkedCount} / 5 項著陸挑戰`;
    }
    if (checkedCount === 5) {
      MathCalmAudio.playBowl();
      alert('🌟 太棒了！五感著陸挑戰全部完成！心跳平穩、大腦清爽！');
    }
  };

  window.toggleCalmRain = function() {
    MathCalmAudio.toggleRain((isPlaying) => {
      const btn = document.getElementById('calmRainToggleBtn');
      if (btn) {
        btn.classList.toggle('active', isPlaying);
        btn.innerHTML = isPlaying ? '🌧️ 停止細雨白噪音 (播放中)' : '🌧️ 播放細雨白噪音';
      }
    });
  };

  function createCalmCornerModalDOM() {
    if (document.getElementById('calmCornerModal')) return;
    const div = document.createElement('div');
    div.id = 'calmCornerModal';
    div.className = 'teacher-modal-overlay';
    div.innerHTML = `
      <div class="teacher-modal-content calm-corner-modal">
        <div class="teacher-modal-header" style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🧘</span>
            <div>
              <h2 style="margin:0; font-size:1.35rem; color:#ffffff;">特教數學即時冷靜通道 · 感官舒緩與焦慮急救</h2>
              <p style="margin:2px 0 0 0; font-size:0.85rem; color:#ccfbf1;">舒適吸吐光環 · 沉浸視覺沙漏 · 5-4-3-2-1 著陸法 · 可選雨聲</p>
            </div>
          </div>
          <button class="modal-close-btn" onclick="closeCalmCornerModal()" title="關閉">✕</button>
        </div>

        <div class="calm-tabs-nav">
          <button id="calmTabBtn-breathe" class="calm-tab-btn active" onclick="switchCalmTab('breathe')">🌊 舒適吸吐光環</button>
          <button id="calmTabBtn-timer" class="calm-tab-btn" onclick="switchCalmTab('timer')">⏳ 沉浸視覺沙漏</button>
          <button id="calmTabBtn-grounding" class="calm-tab-btn" onclick="switchCalmTab('grounding')">🖐️ 5-4-3-2-1 著陸法</button>
          <button id="calmRainToggleBtn" class="calm-tab-btn rain-btn" onclick="toggleCalmRain()">🌧️ 播放細雨白噪音</button>
        </div>

        <div class="calm-modal-body">
          <!-- Tab 1: 舒適吸吐光環 -->
          <div id="calmTabPane-breathe" class="calm-tab-pane">
            <div class="breathing-arena">
              <div class="breathing-bubble-container">
                <div id="breathingBubble" class="breathing-bubble inhale">
                  <div class="bubble-inner-glow"></div>
                  <span style="font-size:2.8rem; z-index:2;">🐢</span>
                </div>
              </div>
              <div class="breathing-text-area">
                <div id="breathingInstruction" class="breathing-main-text">慢慢吸氣，照自己的舒服速度</div>
                <div id="breathingSubInstruction" class="breathing-sub-text">光環只是節奏參考，也可以只看光環、安靜休息。</div>
                <div id="breathingCycleCounter" class="breathing-cycle-pill">已看過 0 次吸吐節奏</div>
              </div>
            </div>
            <div class="calm-tip-bar">
              💡 <strong>算錯不著急口訣：</strong>「心跳快、握拳頭，縮進殼裡深呼吸，數到十，大腦冷靜慢慢算！」
            </div>
          </div>

          <!-- Tab 2: 視覺沙漏計時器 -->
          <div id="calmTabPane-timer" class="calm-tab-pane" style="display:none;">
            <div class="sensory-timer-card">
              <div class="timer-duration-pills">
                <button class="timer-pill" onclick="setSensoryTimerDuration(1)">⏱️ 1 分鐘 (快速調息)</button>
                <button class="timer-pill active" onclick="setSensoryTimerDuration(3)">⏱️ 3 分鐘 (常規冷靜)</button>
                <button class="timer-pill" onclick="setSensoryTimerDuration(5)">⏱️ 5 分鐘 (深度著陸)</button>
              </div>
              <div class="timer-display-huge" id="sensoryTimerText">03:00</div>
              <div class="sensory-progress-track">
                <div class="sensory-progress-fill" id="sensoryTimerFill" style="width:0%;"></div>
              </div>
              <div style="display:flex; justify-content:center; gap:12px; margin-top:20px;">
                <button id="sensoryTimerToggleBtn" class="btn btn-primary" onclick="toggleSensoryTimer()">▶️ 開始冷靜倒數</button>
                <button class="btn btn-outline" onclick="resetSensoryTimer()">🔄 重設</button>
                <button class="btn btn-outline" onclick="window.MathCalmAudio.playBowl()">🔔 鳴響頌缽</button>
              </div>
            </div>
          </div>

          <!-- Tab 3: 5-4-3-2-1 著陸法 -->
          <div id="calmTabPane-grounding" class="calm-tab-pane" style="display:none;">
            <div style="margin-bottom:12px; font-weight:800; color:#0f766e; display:flex; justify-content:space-between;">
              <span>🖐️ 五感著陸法（幫助學童從急性恐慌/算題崩潰回歸現實）：</span>
              <span id="groundingStatusText" style="color:#0284c7;">完成進度：0 / 5 項</span>
            </div>
            <div class="grounding-list">
              <div class="grounding-item-box" onclick="toggleGroundingCheck(5)">
                <div class="grounding-check" id="groundingCheck-5"></div>
                <div><strong>👁️ 5 樣看得到的東西：</strong>找到教室裡 5 個數字、積木或圓圓的物品。</div>
              </div>
              <div class="grounding-item-box" onclick="toggleGroundingCheck(4)">
                <div class="grounding-check" id="groundingCheck-4"></div>
                <div><strong>✋ 4 樣摸得到的東西：</strong>摸摸冰涼的桌面、衣服的布料、鉛筆的筆桿或手掌心。</div>
              </div>
              <div class="grounding-item-box" onclick="toggleGroundingCheck(3)">
                <div class="grounding-check" id="groundingCheck-3"></div>
                <div><strong>👂 3 種聽得到的聲音：</strong>聽聽窗外的風聲、電風扇的旋轉聲或老師溫柔的聲音。</div>
              </div>
              <div class="grounding-item-box" onclick="toggleGroundingCheck(2)">
                <div class="grounding-check" id="groundingCheck-2"></div>
                <div><strong>👃 2 種聞得到的氣味：</strong>聞聞鉛筆的木頭香味或衛生紙乾淨的味道。</div>
              </div>
              <div class="grounding-item-box" onclick="toggleGroundingCheck(1)">
                <div class="grounding-check" id="groundingCheck-1"></div>
                <div><strong>👅 1 種嚐得到的味道：</strong>喝一口水，感受涼爽的水流過喉嚨。</div>
              </div>
            </div>
          </div>
        </div>

        <div class="teacher-modal-footer">
          <span style="font-size:0.85rem; color:#64748b;">💡 資深特教心法：學生情緒崩潰時，先處理情緒，再處理數學算式！</span>
          <button class="btn btn-outline" onclick="closeCalmCornerModal()">結束調息 · 返回課堂</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }


  // ==================== 4. 親師聯絡 & IEP 四合一生成器 ====================
  window.openCommunicationModal = function() {
    let modal = document.getElementById('communicationModal');
    if (!modal) {
      createCommunicationModalDOM();
      modal = document.getElementById('communicationModal');
    }
    updateCommunicationContent();
    modal.style.display = 'flex';
  };

  window.closeCommunicationModal = function() {
    const modal = document.getElementById('communicationModal');
    if (modal) modal.style.display = 'none';
  };

  function getActiveUnitData() {
    const uid = document.getElementById('lesson-unit-quick-select')?.value || 'u1';
    return NANI_G3S1_DATA.units.find(u => u.id === uid) || NANI_G3S1_DATA.units[0];
  }

  function getHomeTaskText(unitId) {
    switch (unitId) {
      case 'u1':
        return '請家長帶孩子看看錢包裡的鈔票，數數看有幾張 1000 元、幾張 100 元，大聲念出總共是多少元！';
      case 'u2':
        return '今晚請孩子幫忙算算超商買麵包跟牛奶一共要花多少錢，練習把個位跟十位對齊相加！';
      case 'u3':
        return '請孩子幫忙把餐桌上的筷子分發，算算看 3 個人每人拿 2 雙，一共有幾雙！';
      case 'u4':
        return '請孩子拿直尺量量家裡的牙刷或鉛筆，找出上面細細的「毫米(mm)」刻度！';
      case 'u5':
        return '請孩子找出家裡有「正方形」或「長方形」四個直角的物品（如書本、磁磚）！';
      case 'u6':
        return '家裡吃水果時，請孩子把 10 顆葡萄平均分給 3 個人，數數看每人分幾顆、還剩下幾顆！';
      case 'u7':
        return '請孩子在冰箱找找鮮奶瓶上的容量標示，看看是不是剛好寫著「1000 mL (1公升)」！';
      case 'u8':
        return '分吃披薩或鬆餅時，請孩子指出「分母是平分成幾等份、分子是取了其中幾份」！';
      case 'u9':
        return '請孩子找找家中圓形的物品（時鐘、杯蓋、車輪），並指出正中間的圓心位置！';
      default:
        return '請孩子向您分享今天在數學課學到的一個口訣！';
    }
  }

  function updateCommunicationContent() {
    const unit = getActiveUnitData();
    const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const taskText = getHomeTaskText(unit.id);

    // 1. LINE 親師聯絡簿溫馨通知
    const lineText = `【數學親師聯絡草稿｜請教師核對後使用】
親愛的家長您好：
本次預定學習主題為【第 ${unit.number} 單元：${unit.title}】的探索！

本次觀察（請教師填寫）：
使用的教具：＿＿；學生能做到：＿＿；需要的支持：＿＿。
請依實際課堂表現補充，不以星星數推定概念精熟。

🛒 今晚生活實踐超能力小任務：
${taskText}

感謝家長在家庭中與學校攜手，以正向讚美陪伴孩子的每一步成長！❤️
—— 學習教室特教老師 敬上 (${today})`;

    const lineTextEl = document.getElementById('commLineText');
    if (lineTextEl) lineTextEl.value = lineText;

    // 2. 特教通報網 IEP 質性評量紀錄草稿
    const iepText = `【特教通報網 / IEP 隨堂診斷評量紀錄】
評量日期：${today}
學習領域：數學領域（南一版三上 · 108普通課綱代碼：${unit.curriculumCode}）
評量單元：第 ${unit.number} 單元【${unit.title}】
特需課綱指標：${unit.specialNeedsCodes.join('、')}
課程調整紀錄：
● 內容調整：${unit.accommodations.content}
● 歷程調整：${unit.accommodations.process}
● 環境調整：${unit.accommodations.environment}
● 評量調整：${unit.accommodations.assessment}
實際作答證據：${window.LearningRecords?.report(unit.id) || '尚無可引用紀錄。'}
表現質性描述（待教師填寫）：＿＿。不推定已達標。
以上調整為建議計畫，是否實際提供及成效均須教師核對。`;

    const iepTextEl = document.getElementById('commIepText');
    if (iepTextEl) iepTextEl.value = iepText;

    // 3. A4 每頁4張省紙實體聯絡單
    const slipsContainer = document.getElementById('commSlipsGrid');
    if (slipsContainer) {
      const taskDescription = taskText;

      const students = StudentBank.getStudents();
      slipsContainer.innerHTML = students.map(st => `
        <div class="comm-slip-card">
          <div class="slip-header">
            <span>🏫 學習教室 · 數學學習通知單</span>
            <span class="slip-date">${today}</span>
          </div>
          <div class="slip-body">
            <div class="slip-unit">👤 學生：<strong>${escapeText(st.name)}</strong> ｜ 第 ${unit.number} 單元【${unit.title}】</div>
            <div class="slip-task">🏠 <strong>今晚生活實踐小任務：</strong><br/>${taskDescription}</div>
            <div class="slip-stars">⭐ 存摺累計：<strong>${st.stars}</strong> 顆（非今日成績或精熟率）</div>
          </div>
          <div class="slip-footer">
            <span>💮 家長簽章：［　　　　］</span>
            <span>回條請貼在聯絡簿</span>
          </div>
        </div>
      `).join('');
    }
  }

  window.copyCommLineText = function() {
    const el = document.getElementById('commLineText');
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
      alert('📋 LINE 親師聯絡文字已複製！可直接貼在班級群組或私訊家長！');
    });
  };

  window.copyCommIepText = function() {
    const el = document.getElementById('commIepText');
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
      alert('📋 IEP 質性評量草稿已複製！可直接貼入特教通報網或學期 IEP 會議紀錄！');
    });
  };

  window.printCommSlips = function() {
    const content = document.getElementById('commSlipsGrid');
    if (!content) return;
    const preview = window.open('', '_blank');
    if (!preview) { alert('請允許彈出視窗以預覽聯絡單。'); return; }
    preview.document.write(`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>數學親師聯絡單</title><link rel="icon" type="image/svg+xml" href="${new URL('favicon.svg', location.href).href}"><style>
      @page { size:A4; margin:12mm; } body { font-family:'Microsoft JhengHei',sans-serif; color:#111; margin:0; }
      .print-controls { padding:12px; background:#eef2ff; margin-bottom:12px; } button { padding:10px; font:inherit; }
      .slips { display:grid; grid-template-columns:1fr 1fr; gap:10mm; }
      .comm-slip-card { box-sizing:border-box; border:1px dashed #555; padding:8mm; min-height:115mm; break-inside:avoid; font-size:12pt; line-height:1.7; }
      .slip-header { border-bottom:1px solid #aaa; padding-bottom:8px; margin-bottom:12px; } .slip-date { display:block; } .slip-task,.slip-stars,.slip-footer { margin-top:14px; } .slip-footer span { display:block; }
      @media print { .print-controls { display:none; } }
      </style></head><body><div class="print-controls"><button onclick="window.print()">列印／另存 PDF</button> 每頁最多 4 張，請先核對單元、代號與內容。</div><div class="slips">${content.innerHTML}</div></body></html>`);
    preview.document.close();
  };

  function createCommunicationModalDOM() {
    if (document.getElementById('communicationModal')) return;
    const div = document.createElement('div');
    div.id = 'communicationModal';
    div.className = 'teacher-modal-overlay';
    div.innerHTML = `
      <div class="teacher-modal-content comm-modal">
        <div class="teacher-modal-header" style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">📝</span>
            <div>
              <h2 style="margin:0; font-size:1.35rem; color:#ffffff;">親師聯絡小條 & IEP 評量草稿 一鍵生成</h2>
              <p style="margin:2px 0 0 0; font-size:0.85rem; color:#e0e7ff;">LINE好讀版 · A4四合一實體列印小單 · 特教通報網評量草稿</p>
            </div>
          </div>
          <button class="modal-close-btn" onclick="closeCommunicationModal()" title="關閉">✕</button>
        </div>

        <div class="comm-modal-body">
          <!-- 左欄：LINE文字與IEP草稿 -->
          <div class="comm-col-left">
            <div class="comm-section-title">
              <span>💬 1. LINE / 聯絡簿親師通知文字（一鍵複製）</span>
              <button class="btn btn-sm btn-primary" onclick="copyCommLineText()">📋 複製文字</button>
            </div>
            <textarea id="commLineText" class="comm-textarea" rows="8" readonly></textarea>

            <div class="comm-section-title" style="margin-top:16px;">
              <span>📋 2. 特教通報網 IEP 質性評量紀錄草稿</span>
              <button class="btn btn-sm btn-outline" onclick="copyCommIepText()">📋 複製紀錄</button>
            </div>
            <textarea id="commIepText" class="comm-textarea" rows="7" readonly></textarea>
          </div>

          <!-- 右欄：4合1 列印小單預覽 -->
          <div class="comm-col-right">
            <div class="comm-section-title">
              <span>🖨️ 3. A4 4合1 實體聯絡單小條（每頁最多4張）</span>
              <button class="btn btn-sm btn-accent" onclick="printCommSlips()">🖨️ 列印此頁小單</button>
            </div>
            <div class="slips-preview-container" id="commSlipsGrid"></div>
          </div>
        </div>

        <div class="teacher-modal-footer">
          <span style="font-size:0.85rem; color:#64748b;">💡 實務技巧：特教生回原班最需要家庭生活實踐與正向肯定，小單可直接貼在學生聯絡簿！</span>
          <button class="btn btn-outline" onclick="closeCommunicationModal()">完成</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }


  // ==================== 5. 課前 60 秒極速備課卡 ====================
  window.openQuickBriefingModal = function() {
    let modal = document.getElementById('quickBriefingModal');
    if (!modal) {
      createQuickBriefingModalDOM();
      modal = document.getElementById('quickBriefingModal');
    }
    updateQuickBriefingContent();
    modal.style.display = 'flex';
  };

  window.closeQuickBriefingModal = function() {
    const modal = document.getElementById('quickBriefingModal');
    if (modal) modal.style.display = 'none';
  };

  function updateQuickBriefingContent() {
    const unit = getActiveUnitData();
    document.getElementById('qbUnitTitle').innerText = `第 ${unit.number} 單元 · ${unit.title}`;
    document.getElementById('qbCurriculumCode').innerText = `普數 ${unit.curriculumCode} ｜ 特需 ${unit.specialNeedsCodes.join(', ')}`;
    document.getElementById('qbPrereqText').innerText = `【先備】：${unit.prerequisite.grade} ${unit.prerequisite.unitCode}（${unit.prerequisite.diagnosticCheck}）`;
    document.getElementById('qbMisconceptionText').innerText = `【迷思警戒】：${unit.misconception.name} ➔ 口訣：${unit.misconception.audioMnemonic}`;
    document.getElementById('qbRegularTipText').innerText = `【給普通班導師調適指引】：段考建議字級放大、計算直式保留對齊格線、不設倒數計時！`;
  }

  function createQuickBriefingModalDOM() {
    if (document.getElementById('quickBriefingModal')) return;
    const div = document.createElement('div');
    div.id = 'quickBriefingModal';
    div.className = 'teacher-modal-overlay';
    div.innerHTML = `
      <div class="teacher-modal-content qb-modal">
        <div class="teacher-modal-header" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%);">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">⚡</span>
            <div>
              <h2 style="margin:0; font-size:1.35rem; color:#ffffff;">課前 60 秒極速備課卡 · 特教老師專用導航</h2>
              <p style="margin:2px 0 0 0; font-size:0.85rem; color:#fef3c7;">上課鈴響前一分鐘快速瀏覽 · 教具檢核 · 迷思警戒 · 導師溝通</p>
            </div>
          </div>
          <button class="modal-close-btn" onclick="closeQuickBriefingModal()" title="關閉">✕</button>
        </div>

        <div class="qb-modal-body" style="padding:20px; font-size:1rem; line-height:1.7;">
          <div style="background:#fef3c7; border-left:5px solid #d97706; padding:12px; border-radius:6px; margin-bottom:12px;">
            <h3 id="qbUnitTitle" style="color:#78350f; font-size:1.2rem; margin:0;">單元名稱載入中...</h3>
            <div id="qbCurriculumCode" style="color:#92400e; font-size:0.88rem; font-weight:700; margin-top:2px;">課綱指標</div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div class="qb-section" style="background:#f0fdf4; border:1px solid #86efac; padding:10px 14px; border-radius:6px;">
              <strong style="color:#166534;">🔄 課前 10 秒先備確認：</strong>
              <div id="qbPrereqText" style="color:#14532d; font-size:0.92rem; margin-top:4px;">先備檢查</div>
            </div>

            <div class="qb-section" style="background:#fff1f2; border:1px solid #fecdd3; padding:10px 14px; border-radius:6px;">
              <strong style="color:#9f1239;">🚨 本節課常見迷思紅燈區：</strong>
              <div id="qbMisconceptionText" style="color:#881337; font-size:0.92rem; margin-top:4px;">迷思警告</div>
            </div>

            <div class="qb-section" style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px 14px; border-radius:6px;">
              <strong style="color:#1e40af;">🤝 普通班融合教育調適小錦囊：</strong>
              <div id="qbRegularTipText" style="color:#1e3a8a; font-size:0.92rem; margin-top:4px;">導師溝通指引</div>
            </div>
          </div>
        </div>

        <div class="teacher-modal-footer">
          <span style="font-size:0.85rem; color:#64748b;">💡 快速看過這三張卡片，即可胸有成竹迎接特教學童進教室！</span>
          <button class="btn btn-primary" onclick="closeQuickBriefingModal()">出發上課！</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  // 匯出全域介面
  window.MathCalmAudio = MathCalmAudio;
  window.StudentBank = StudentBank;

  // 網頁載入後自動渲染學生存摺
  document.addEventListener('DOMContentLoaded', () => {
    StudentBank.render();
    if (window.matchMedia('(max-width: 600px)').matches) document.querySelector('.student-bank-container').open = false;
  });

})(window);
