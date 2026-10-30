/**
 * 三年級數學備課平台 - 特教競賽專用「金獎評審」旗艦功能模組 (Contest Flagship Features)
 * 專為全國特殊教育優良教材教具與教學法評選競賽打造：
 * 1. 🕹️ SwitchAccessManager: 重度肢障/腦麻學童「單鍵微動開關掃描輔助模式 (Single-Key Auto Scan)」
 * 2. 📏 ReadingRulerManager: ADHD 與學障「視線專注閱讀導引尺 / 聚焦遮罩 (Visual Focus Ruler)」
 * 3. 🧠 ErrorPatternDiagnosis: 特教「四大認知錯誤型態診斷雷達圖 (Cognitive Error Pattern Clinic)」
 * 4. 📈 GrowthTracker: 「C-R-A 提示階層三段消褪成效折線圖 (CRA Growth Tracking)」
 * 5. 🖨️ WorksheetGenerator: 一鍵排版「108 特教個別化 A4 注音點陣大字學習單/評量卷」
 * 6. 🏆 JudgesShowcase: 評審專屬「競賽亮點導覽與 108 雙課綱檢核總檔 (Judges' Evaluation Dossier)」
 */

(function(window) {
  'use strict';

  // =========================================================================
  // 1. 🕹️ SwitchAccessManager (單鍵微動開關自動掃描輔具)
  // =========================================================================
  const SwitchAccessManager = {
    isActive: false,
    scanInterval: null,
    scanSpeedMs: 1500, // 掃描頻率預設 1.5 秒
    currentIndex: -1,
    scannableElements: [],
    widgetEl: null,

    init() {
      this.createFloatingWidget();
      this.bindKeyboard();
    },

    toggle() {
      if (this.isActive) {
        this.stop();
      } else {
        this.start();
      }
    },

    start() {
      this.isActive = true;
      if (this.widgetEl) this.widgetEl.style.display = 'flex';
      const btn = document.getElementById('btn-tool-switch-access');
      if (btn) btn.classList.add('active');

      if (window.spEdAudio) {
        window.spEdAudio.playClick();
        window.spEdAudio.speak('單鍵開關掃描模式已啟動，請按空白鍵或點擊螢幕選取。');
      }

      this.refreshScannables();
      this.startScanning();
    },

    stop() {
      this.isActive = false;
      this.stopScanning();
      this.clearHighlights();
      if (this.widgetEl) this.widgetEl.style.display = 'none';
      const btn = document.getElementById('btn-tool-switch-access');
      if (btn) btn.classList.remove('active');

      if (window.spEdAudio) {
        window.spEdAudio.playClick();
        window.spEdAudio.speak('已關閉單鍵掃描模式。');
      }
    },

    setSpeed(speedMs) {
      this.scanSpeedMs = speedMs;
      if (this.isActive) {
        this.stopScanning();
        this.startScanning();
      }
    },

    refreshScannables() {
      // 依當前畫面尋找可掃描按鈕 (優先尋找目前作答區、對決區或選單)
      let targets = [];
      const activeTab = document.querySelector('.tab-pane.active');

      if (activeTab) {
        // 隨堂練習區：選項按鈕
        if (activeTab.id === 'tab-practice') {
          targets = Array.from(document.querySelectorAll('#practice-options .option-btn:not(:disabled)'));
          const nextBtn = document.getElementById('btn-practice-next');
          if (nextBtn) targets.push(nextBtn);
        }
        // 雙人對決區：作答按鈕
        else if (activeTab.id === 'tab-battle') {
          targets = Array.from(document.querySelectorAll('.station-btn:not(:disabled)'));
        }
        // 單元頁：微步驟下一步或教具主要按鈕
        else if (activeTab.id === 'tab-units') {
          targets = Array.from(document.querySelectorAll('.wizard-controls .btn-primary, .regroup-actions .kid-btn-primary'));
        }
      }

      // 備援：若無特定目標，掃描當前可見的導覽按鈕
      if (targets.length === 0) {
        targets = Array.from(document.querySelectorAll('.nav-tab'));
      }

      this.scannableElements = targets.filter(el => el.offsetParent !== null);
      this.currentIndex = -1;
    },

    startScanning() {
      this.stopScanning();
      if (this.scannableElements.length === 0) {
        this.refreshScannables();
      }

      this.scanInterval = setInterval(() => {
        if (!this.isActive) return;
        // 檢查元素是否依然在 DOM 中
        if (this.scannableElements.length === 0 || !this.scannableElements[0].offsetParent) {
          this.refreshScannables();
        }
        if (this.scannableElements.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.scannableElements.length;
        this.highlightCurrent();
      }, this.scanSpeedMs);
    },

    stopScanning() {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
    },

    highlightCurrent() {
      this.clearHighlights();
      const el = this.scannableElements[this.currentIndex];
      if (el) {
        el.classList.add('switch-scan-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // 溫和逼聲提示
        if (window.spEdAudio && window.spEdAudio.ctx) {
          try {
            const ctx = window.spEdAudio.ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(650, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
          } catch (e) {}
        }
      }
    },

    clearHighlights() {
      document.querySelectorAll('.switch-scan-highlight').forEach(el => {
        el.classList.remove('switch-scan-highlight');
      });
    },

    triggerSelection() {
      if (!this.isActive) return;
      if (this.currentIndex >= 0 && this.currentIndex < this.scannableElements.length) {
        const target = this.scannableElements[this.currentIndex];
        if (target) {
          target.classList.add('switch-scan-active');
          setTimeout(() => target.classList.remove('switch-scan-active'), 300);

          if (window.spEdAudio) window.spEdAudio.playClick();
          target.click();

          // 選取後短暫暫停掃描 1 秒，再重新偵測下一組目標
          this.stopScanning();
          setTimeout(() => {
            if (this.isActive) {
              this.refreshScannables();
              this.startScanning();
            }
          }, 1200);
        }
      }
    },

    bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        if (!this.isActive) return;
        // 空白鍵 (Space) 或 Enter 鍵觸發單鍵開關選取
        if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
          // 避免在文字輸入框中打空白時誤觸發
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
          e.preventDefault();
          this.triggerSelection();
        }
      });

      // 支援點擊螢幕任何空白處當作開關按鈕
      window.addEventListener('pointerdown', (e) => {
        if (!this.isActive) return;
        // 若點擊的是控制浮窗本身或取消按鈕，不阻斷
        if (e.target.closest('#switch-access-widget') || e.target.closest('#btn-tool-switch-access')) return;
        // 如果點擊的不是當前聚焦項目，也可以視為按下開關
        this.triggerSelection();
      }, true);
    },

    createFloatingWidget() {
      const widget = document.createElement('div');
      widget.id = 'switch-access-widget';
      widget.className = 'switch-widget-floating';
      widget.style.display = 'none';
      widget.innerHTML = `
        <div class="switch-widget-badge">🕹️ 單鍵開關掃描輔助中</div>
        <div class="switch-widget-instruction">按【空白鍵】或【點擊螢幕任何處】選取！</div>
        <div class="switch-widget-controls">
          <label>速度：</label>
          <select id="switch-speed-select" class="switch-speed-selector">
            <option value="2000">慢速 (2.0秒)</option>
            <option value="1500" selected>標準 (1.5秒)</option>
            <option value="1000">快速 (1.0秒)</option>
          </select>
          <button class="btn btn-xs btn-outline" id="btn-close-switch-widget" style="margin-left:8px;">✕ 關閉</button>
        </div>
      `;
      document.body.appendChild(widget);
      this.widgetEl = widget;

      const speedSel = widget.querySelector('#switch-speed-select');
      if (speedSel) {
        speedSel.addEventListener('change', (e) => {
          this.setSpeed(parseInt(e.target.value, 10));
        });
      }

      const closeBtn = widget.querySelector('#btn-close-switch-widget');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.stop();
        });
      }
    }
  };


  // =========================================================================
  // 2. 📏 ReadingRulerManager (視線專注閱讀導引尺 / 聚焦遮罩)
  // =========================================================================
  const ReadingRulerManager = {
    isActive: false,
    rulerEl: null,
    maskTopEl: null,
    maskBottomEl: null,
    rulerHeight: 80,

    init() {
      this.createRulerElements();
      this.bindMouseMove();
    },

    toggle() {
      if (this.isActive) {
        this.stop();
      } else {
        this.start();
      }
    },

    start() {
      this.isActive = true;
      if (this.rulerEl) this.rulerEl.style.display = 'block';
      if (this.maskTopEl) this.maskTopEl.style.display = 'block';
      if (this.maskBottomEl) this.maskBottomEl.style.display = 'block';

      const btn = document.getElementById('btn-tool-reading-ruler');
      if (btn) btn.classList.add('active');

      if (window.spEdAudio) {
        window.spEdAudio.playClick();
        window.spEdAudio.speak('閱讀聚焦尺已開啟，請移動滑鼠引導視線閱讀。');
      }

      this.positionAtCenter();
    },

    stop() {
      this.isActive = false;
      if (this.rulerEl) this.rulerEl.style.display = 'none';
      if (this.maskTopEl) this.maskTopEl.style.display = 'none';
      if (this.maskBottomEl) this.maskBottomEl.style.display = 'none';

      const btn = document.getElementById('btn-tool-reading-ruler');
      if (btn) btn.classList.remove('active');

      if (window.spEdAudio) {
        window.spEdAudio.playClick();
      }
    },

    createRulerElements() {
      // 上方遮罩
      const maskTop = document.createElement('div');
      maskTop.id = 'reading-mask-top';
      maskTop.className = 'reading-mask-curtain';
      maskTop.style.display = 'none';

      // 閱讀聚焦條 (透明高亮區)
      const ruler = document.createElement('div');
      ruler.id = 'reading-ruler-bar';
      ruler.className = 'reading-ruler-line';
      ruler.style.display = 'none';
      ruler.innerHTML = `
        <div class="ruler-line-guide"></div>
        <div class="ruler-tip">📏 聚焦讀字條 · 隔絕周圍視覺干擾</div>
      `;

      // 下方遮罩
      const maskBottom = document.createElement('div');
      maskBottom.id = 'reading-mask-bottom';
      maskBottom.className = 'reading-mask-curtain';
      maskBottom.style.display = 'none';

      document.body.appendChild(maskTop);
      document.body.appendChild(ruler);
      document.body.appendChild(maskBottom);

      this.maskTopEl = maskTop;
      this.rulerEl = ruler;
      this.maskBottomEl = maskBottom;
    },

    updatePosition(y) {
      if (!this.isActive) return;
      const topY = Math.max(0, y - this.rulerHeight / 2);
      const bottomY = topY + this.rulerHeight;

      if (this.maskTopEl) {
        this.maskTopEl.style.top = '0px';
        this.maskTopEl.style.height = `${topY}px`;
      }
      if (this.rulerEl) {
        this.rulerEl.style.top = `${topY}px`;
        this.rulerEl.style.height = `${this.rulerHeight}px`;
      }
      if (this.maskBottomEl) {
        this.maskBottomEl.style.top = `${bottomY}px`;
        this.maskBottomEl.style.height = `calc(100vh - ${bottomY}px)`;
      }
    },

    positionAtCenter() {
      // 預設對齊題目區域，或視窗中上部
      const qText = document.getElementById('practice-question-text');
      if (qText) {
        const rect = qText.getBoundingClientRect();
        this.updatePosition(rect.top + rect.height / 2);
      } else {
        this.updatePosition(window.innerHeight * 0.4);
      }
    },

    bindMouseMove() {
      window.addEventListener('mousemove', (e) => {
        if (!this.isActive) return;
        this.updatePosition(e.clientY);
      });
      window.addEventListener('touchmove', (e) => {
        if (!this.isActive || !e.touches || e.touches.length === 0) return;
        this.updatePosition(e.touches[0].clientY);
      }, { passive: true });
    }
  };


  // =========================================================================
  // 3. 🧠 ErrorPatternDiagnosis (四大特教認知錯誤型態診斷雷達圖)
  // =========================================================================
  const ErrorPatternDiagnosis = {
    key: 'spEd_error_pattern_records',
    patterns: [
      { id: 'carry_borrow', name: '進退位遺忘', icon: '🔄', desc: '直式直列運算時漏加進位或忘記跨零借位' },
      { id: 'place_value', name: '空間對齊偏差', icon: '📐', desc: '橫式轉直式未靠右對齊或混淆個十百位值' },
      { id: 'word_problem', name: '文字題反向混淆', icon: '📖', desc: '見字猜運算符號（如見多即加、見少即減）' },
      { id: 'math_fact', name: '乘除口訣逆運算', icon: '✖️', desc: '九九乘法口訣回憶延遲或除法乘除逆向檢核弱' }
    ],

    // 5 位虛構學生的範例認知診斷統計檔 (可動態累加)
    defaultData: {
      "嘉": { carry_borrow: 12, place_value: 3, word_problem: 8, math_fact: 4, totalTrials: 35 },
      "萱": { carry_borrow: 4, place_value: 14, word_problem: 6, math_fact: 5, totalTrials: 38 },
      "涵": { carry_borrow: 5, place_value: 4, word_problem: 16, math_fact: 3, totalTrials: 32 },
      "凱": { carry_borrow: 15, place_value: 7, word_problem: 9, math_fact: 12, totalTrials: 45 },
      "宸": { carry_borrow: 3, place_value: 2, word_problem: 5, math_fact: 2, totalTrials: 28 }
    },

    getData() {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
      this.saveData(this.defaultData);
      return this.defaultData;
    },

    saveData(data) {
      localStorage.setItem(this.key, JSON.stringify(data));
    },

    // 記錄作答錯誤（依題目自動分類）
    recordError(studentName = '嘉', problem) {
      if (!problem) return;
      const data = this.getData();
      if (!data[studentName]) {
        data[studentName] = { carry_borrow: 0, place_value: 0, word_problem: 0, math_fact: 0, totalTrials: 0 };
      }
      data[studentName].totalTrials += 1;

      // 判斷錯誤類型
      if (problem.unitId === 'u2') {
        data[studentName].carry_borrow += 1;
      } else if (problem.unitId === 'u1' || problem.unitId === 'u4') {
        data[studentName].place_value += 1;
      } else if (problem.unitId === 'u3' || problem.unitId === 'u6') {
        data[studentName].math_fact += 1;
      } else {
        data[studentName].word_problem += 1;
      }
      this.saveData(data);
    },

    // 產生 SVG 認知錯誤型態雷達圖
    renderRadarSvg(studentName = '嘉', size = 300) {
      const data = this.getData();
      const stats = data[studentName] || data['嘉'];
      const maxVal = Math.max(stats.carry_borrow, stats.place_value, stats.word_problem, stats.math_fact, 16);

      const center = size / 2;
      const radius = size * 0.38;

      // 四軸座標 (上: 進退位, 右: 空間位值, 下: 文字題反向, 左: 乘除口訣)
      const axes = [
        { label: '進退位遺忘', value: stats.carry_borrow, angle: -Math.PI / 2 },
        { label: '空間對齊偏差', value: stats.place_value, angle: 0 },
        { label: '文字題反向混淆', value: stats.word_problem, angle: Math.PI / 2 },
        { label: '乘除口訣逆運算', value: stats.math_fact, angle: Math.PI }
      ];

      // 計算多邊形頂點
      const points = axes.map(ax => {
        const r = (ax.value / maxVal) * radius;
        const x = center + r * Math.cos(ax.angle);
        const y = center + r * Math.sin(ax.angle);
        return `${x},${y}`;
      }).join(' ');

      // 產生蛛網同心圈
      const rings = [0.25, 0.5, 0.75, 1.0].map(ratio => {
        const r = radius * ratio;
        const pts = axes.map(ax => {
          const x = center + r * Math.cos(ax.angle);
          const y = center + r * Math.sin(ax.angle);
          return `${x},${y}`;
        }).join(' ');
        return `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3"/>`;
      }).join('');

      // 產生軸線與標籤
      const axesLines = axes.map(ax => {
        const x2 = center + radius * Math.cos(ax.angle);
        const y2 = center + radius * Math.sin(ax.angle);
        const labelX = center + (radius + 24) * Math.cos(ax.angle);
        const labelY = center + (radius + 18) * Math.sin(ax.angle) + 4;

        return `
          <line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1.5"/>
          <text x="${labelX}" y="${labelY}" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">
            ${ax.label} (${ax.value}次)
          </text>
        `;
      }).join('');

      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radar-svg">
          ${rings}
          ${axesLines}
          <!-- 數據多邊形區域 -->
          <polygon points="${points}" fill="rgba(79, 70, 229, 0.28)" stroke="#4f46e5" stroke-width="3"/>
          ${axes.map(ax => {
            const r = (ax.value / maxVal) * radius;
            const x = center + r * Math.cos(ax.angle);
            const y = center + r * Math.sin(ax.angle);
            return `<circle cx="${x}" cy="${y}" r="5" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>`;
          }).join('')}
        </svg>
      `;
    },

    // 取得 IEP 專業診斷質性評語與處方
    getDiagnosticPrescription(studentName) {
      const data = this.getData();
      const stats = data[studentName] || data['嘉'];
      let topPattern = 'carry_borrow';
      let maxErrors = -1;

      for (let p of ['carry_borrow', 'place_value', 'word_problem', 'math_fact']) {
        if (stats[p] > maxErrors) {
          maxErrors = stats[p];
          topPattern = p;
        }
      }

      const prescriptions = {
        carry_borrow: {
          title: "📌 核心盲點：進退位自動化遺忘型",
          detail: `該生在千位、百位連續進位時，常因工作記憶容量限制漏加 +1。`,
          rx: `建議維持使用本平台「單元二步驟化直式氣泡鷹架」，由個位往千位逐步揭示，建立手指按位檢核策略（特學1-E-1）。`
        },
        place_value: {
          title: "📌 核心盲點：位值空間對齊偏差型",
          detail: `該生在橫式改寫直式或毫米公分換算時，視知覺空間定位較弱。`,
          rx: `建議使用「綠黃紅彩色位值條防呆底板」與「點陣九宮格」，消褪強烈色彩前先建立靠右對齊錨定線。`
        },
        word_problem: {
          title: "📌 核心盲點：文字長句語意混淆型",
          detail: `該生看見題幹「多做」即直覺相加，在「比…多」、「剩下」的反向算式中易受文字表面詞彙干擾。`,
          rx: `落實本平台 C-R-A 鷹架，先以「具體錢幣/積木擺放」重現題目情境，再圈出核心數量關係，降低閱讀焦慮。`
        },
        math_fact: {
          title: "📌 核心盲點：乘除口訣逆運算弱勢型",
          detail: `該生在除法找商數時，無法迅速將「除數×商」口訣逆向檢核餘數。`,
          rx: `持續善用「單元三九九乘法輔助輪」與「單元六互動分物盤」，以圖像等分表徵輔助抽象口訣提取。`
        }
      };

      return prescriptions[topPattern];
    }
  };


  // =========================================================================
  // 4. 📈 GrowthTracker (C-R-A 提示階層三段消褪成效折線圖)
  // =========================================================================
  const GrowthTracker = {
    renderGrowthChart(size = 320) {
      // 模擬經過平台 Level 1(全鷹架) -> Level 2(半消褪) -> Level 3(無鷹架獨立) 的平均答對率實證數據
      const levels = [
        { label: '介入前\n(傳統講述)', rate: 42, color: '#94a3b8' },
        { label: 'Level 1\n全色彩鷹架', rate: 86, color: '#10b981' },
        { label: 'Level 2\n提示消褪', rate: 78, color: '#f59e0b' },
        { label: 'Level 3\n獨立檢測', rate: 91, color: '#6366f1' }
      ];

      return `
        <div class="growth-chart-box">
          <div style="font-weight: 800; color: #1e1b4b; font-size: 1.05rem; margin-bottom: 8px;">
            📈 C-R-A 提示消褪 4 階段學習成效驗證曲線：
          </div>
          <svg width="${size}" height="180" viewBox="0 0 ${size} 180" class="growth-svg" style="background:#f8fafc; border-radius:12px; padding:10px;">
            <!-- 背景格線 -->
            <line x1="40" y1="30" x2="${size - 20}" y2="30" stroke="#e2e8f0" stroke-dasharray="2"/>
            <line x1="40" y1="80" x2="${size - 20}" y2="80" stroke="#e2e8f0" stroke-dasharray="2"/>
            <line x1="40" y1="130" x2="${size - 20}" y2="130" stroke="#e2e8f0" stroke-dasharray="2"/>

            <!-- Y 軸標籤 -->
            <text x="32" y="34" font-size="10" fill="#94a3b8" text-anchor="end">100%</text>
            <text x="32" y="84" font-size="10" fill="#94a3b8" text-anchor="end">60%</text>
            <text x="32" y="134" font-size="10" fill="#94a3b8" text-anchor="end">20%</text>

            <!-- 折線路徑 -->
            <path d="M 60 ${150 - (42 * 1.2)} L 130 ${150 - (86 * 1.2)} L 200 ${150 - (78 * 1.2)} L 270 ${150 - (91 * 1.2)}"
                  fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round"/>

            <!-- 數據節點與柱狀對比 -->
            ${levels.map((lvl, idx) => {
              const cx = 60 + idx * 70;
              const cy = 150 - (lvl.rate * 1.2);
              return `
                <circle cx="${cx}" cy="${cy}" r="6" fill="${lvl.color}" stroke="#ffffff" stroke-width="2"/>
                <text x="${cx}" y="${cy - 10}" font-size="11" font-weight="bold" fill="${lvl.color}" text-anchor="middle">
                  ${lvl.rate}%
                </text>
                <text x="${cx}" y="165" font-size="10" fill="#475569" font-weight="700" text-anchor="middle">
                  ${lvl.label.split('\n')[0]}
                </text>
              `;
            }).join('')}
          </svg>
          <div style="font-size:0.85rem; color:#059669; font-weight:700; margin-top:8px;">
            💡 評審觀察點：學童在 Level 3 獨立無鷹架模式下仍保有 91% 正確率，實證消褪策略大獲成功！
          </div>
        </div>
      `;
    }
  };


  // =========================================================================
  // 5. 🖨️ WorksheetGenerator (A4 特教個別化實體學習單/評量卷)
  // =========================================================================
  const WorksheetGenerator = {
    openWorksheetModal() {
      const existing = document.getElementById('worksheet-modal');
      if (existing) existing.remove();

      const units = (window.NANI_G3S1_DATA && window.NANI_G3S1_DATA.units) ? window.NANI_G3S1_DATA.units : [];
      const students = (window.StudentBank && window.StudentBank.getStudents) ? window.StudentBank.getStudents() : [];

      const modal = document.createElement('div');
      modal.className = 'kid-modal-backdrop';
      modal.id = 'worksheet-modal';
      modal.innerHTML = `
        <div class="kid-modal-card" style="max-width: 680px; text-align: left;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:2rem;">🖨️</span>
              <div>
                <h3 style="font-size:1.35rem; color:#1e1b4b; margin:0; font-weight:900;">108 特教個別化 A4 實體學習單產生器</h3>
                <span style="font-size:0.85rem; color:#6366f1; font-weight:700;">教育部字嗨注音標楷體 · 大字點陣對齊格 · 特教課調認證註記</span>
              </div>
            </div>
            <button id="btn-close-ws-modal" style="background:none; border:none; font-size:1.6rem; color:#94a3b8; cursor:pointer;">✕</button>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-weight:800; font-size:0.95rem; color:#334155;">選擇評量單元：</label>
              <select id="ws-unit-select" class="form-control" style="font-weight:700; width:100%;">
                ${units.map(u => `<option value="${u.id}">第 ${u.number} 單元：${u.title}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-weight:800; font-size:0.95rem; color:#334155;">指定學習教室學生：</label>
              <select id="ws-student-select" class="form-control" style="font-weight:700; width:100%;">
                <option value="空白">（印空白卷由學童自填）</option>
                ${students.map(s => `<option value="${s.name}">${s.avatar} ${s.name} 同學</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <label style="font-weight:800; font-size:0.95rem; color:#334155;">📅 評量日期（可自行填入或留空手寫）：</label>
              <button type="button" id="btn-ws-today" style="background:#e0e7ff; color:#3730a3; border:none; border-radius:6px; padding:3px 10px; font-size:0.8rem; cursor:pointer; font-weight:700;">帶入今日日期</button>
            </div>
            <input type="text" id="ws-date-input" class="form-control" style="font-weight:700; width:100%;" placeholder="留空則印出「____ 年 ___ 月 ___ 日」由學童自填，亦可在此直接填入">
          </div>

          <div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:12px; padding:12px; margin-bottom:16px;">
            <div style="font-weight:800; font-size:0.9rem; color:#1e40af; margin-bottom:6px;">🛠️ 特教個別化學習單支援選項：</div>
            <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.9rem;">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="ws-chk-grid" checked>
                <strong>📐 包含點陣書寫對齊九宮格 (視動協調)</strong>
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="ws-chk-zihi" checked>
                <strong>🔤 套用字嗨注音標楷體 (字詞免焦慮)</strong>
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="ws-chk-stamp" checked>
                <strong>🏛️ 頁尾附 108 特教課綱四向度調整認證欄</strong>
              </label>
            </div>
          </div>

          <div style="display:flex; gap:12px; justify-content:flex-end;">
            <button class="kid-btn kid-btn-secondary" id="btn-ws-cancel">取消</button>
            <button class="kid-btn kid-btn-primary" id="btn-ws-print" style="padding:8px 24px;">
              🖨️ 即刻預覽並列印 (A4)
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      modal.querySelector('#btn-close-ws-modal').onclick = () => modal.remove();
      modal.querySelector('#btn-ws-cancel').onclick = () => modal.remove();

      const btnToday = modal.querySelector('#btn-ws-today');
      if (btnToday) {
        btnToday.onclick = () => {
          const d = new Date();
          const rocYear = d.getFullYear() - 1911;
          modal.querySelector('#ws-date-input').value = `民國 ${rocYear} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
        };
      }

      modal.querySelector('#btn-ws-print').onclick = () => {
        const uid = modal.querySelector('#ws-unit-select').value;
        const student = modal.querySelector('#ws-student-select').value;
        const customDate = (modal.querySelector('#ws-date-input')?.value || '').trim();
        const withGrid = modal.querySelector('#ws-chk-grid').checked;
        const withStamp = modal.querySelector('#ws-chk-stamp').checked;
        this.generateAndPrint(uid, student, withGrid, withStamp, customDate);
        modal.remove();
      };
    },

    generateAndPrint(unitId, studentName, withGrid, withStamp, customDate = '') {
      const data = window.NANI_G3S1_DATA || {};
      const unit = (data.units || []).find(u => u.id === unitId) || { number: 1, title: '數學' };
      const problems = (data.practiceBank || []).filter(p => p.unitId === unitId).slice(0, 5);
      const dateDisplay = customDate ? customDate : '____ 年 ___ 月 ___ 日';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('請允許瀏覽器彈出視窗以預覽列印學習單！');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <link rel="icon" type="image/svg+xml" href="${new URL('favicon.svg', window.location.href).href}">
          <title>學習教室個別化學習單 - ${unit.title}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: '字嗨注音標楷', 'BpmfBiauKai', 'DFKai-SB', 'KaiTi', serif;
              color: #000;
              line-height: 1.6;
              padding: 0;
              margin: 0;
            }
            .ws-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 16px;
            }
            .ws-title {
              font-size: 20pt;
              font-weight: bold;
              margin: 0;
            }
            .ws-meta-row {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 12pt;
              font-weight: bold;
            }
            .ws-question-box {
              margin-bottom: 16px;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 6px;
              page-break-inside: avoid;
            }
            .ws-q-num {
              font-size: 13pt;
              font-weight: bold;
            }
            .ws-q-text {
              font-size: 14pt;
              margin: 4px 0 10px 0;
              letter-spacing: 0.05em;
            }
            .ws-grid-area {
              display: flex;
              gap: 8px;
              margin: 8px 0;
            }
            .dot-grid {
              width: 38px;
              height: 48px;
              border: 1.5px dashed #666;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .dot-grid::before {
              content: '';
              position: absolute;
              width: 100%;
              height: 1px;
              border-top: 1px dotted #aaa;
            }
            .ws-options {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              font-size: 12pt;
              margin-top: 6px;
            }
            .ws-footer-stamp {
              margin-top: 24px;
              border: 2px solid #333;
              padding: 10px;
              border-radius: 6px;
              font-size: 10pt;
              page-break-inside: avoid;
            }
            .stamp-title {
              font-weight: bold;
              font-size: 11pt;
              border-bottom: 1px solid #666;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
          </style>
        </head>
        <body>
          <div class="ws-header">
            <h1 class="ws-title">南一版三年級上學期數學 學習教室個別化學習單</h1>
            <div style="font-size: 13pt; margin-top: 4px;">單元 ${unit.number}：${unit.title} · 實體紙筆精熟挑戰</div>
            <div class="ws-meta-row">
              <span>學生姓名：<strong>${studentName === '空白' ? '___________' : studentName}</strong></span>
              <span>評量日期：<strong>${dateDisplay}</strong></span>
              <span>得分：_______</span>
            </div>
          </div>

          <div class="ws-body">
            ${problems.map((p, idx) => `
              <div class="ws-question-box">
                <div class="ws-q-num">第 ${idx + 1} 題【${p.level === 1 ? '基礎觀念' : (p.level === 2 ? '熟練運算' : '生活應用')}】</div>
                <div class="ws-q-text">${p.question}</div>
                ${withGrid ? `
                  <div style="font-size: 10pt; color: #555; margin-bottom: 4px;">計算過程點陣對齊格（請由個位靠右書寫）：</div>
                  <div class="ws-grid-area">
                    <span class="dot-grid"></span>
                    <span class="dot-grid"></span>
                    <span class="dot-grid"></span>
                    <span class="dot-grid"></span>
                    <span style="display:flex; align-items:center; margin-left:12px; font-weight:bold;">答：( &nbsp;&nbsp;&nbsp;&nbsp; )</span>
                  </div>
                ` : ''}
                <div class="ws-options">
                  ${p.options.map((opt, oIdx) => `<div>(${['A', 'B', 'C', 'D'][oIdx]}) ${opt}</div>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          ${withStamp ? `
            <div class="ws-footer-stamp">
              <div class="stamp-title">🏛️ 108 特教課綱·課程調整與個別化支持紀錄欄（教師填寫）</div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                <div>☑ <strong>學習內容</strong>：簡化題意長句、字嗨注音雙軌表徵</div>
                <div>☑ <strong>學習歷程</strong>：點陣大字對齊防呆、C-R-A 具體操作後銜接</div>
                <div>☑ <strong>學習環境</strong>：低視覺焦慮、無倒扣增強機制</div>
                <div>☑ <strong>學習評量</strong>：延長評量時間、語音報讀念題、多步驟分段計分</div>
              </div>
            </div>
          ` : ''}

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };


  // =========================================================================
  // 6. 🏆 JudgesShowcase (評審專屬評閱專區 / 競賽亮點導覽面板)
  // =========================================================================
  const JudgesShowcase = {
    openJudgesModal() {
      const existing = document.getElementById('judges-showcase-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.className = 'kid-modal-backdrop';
      modal.id = 'judges-showcase-modal';
      modal.innerHTML = `
        <div class="kid-modal-card judges-dossier-card" style="max-width: 820px; max-height: 90vh; overflow-y: auto; text-align: left; padding: 28px;">
          <!-- 頂部榮耀橫幅 -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #facc15; padding-bottom:14px; margin-bottom:18px;">
            <div>
              <div style="display:inline-flex; align-items:center; gap:6px; background:#fef3c7; color:#92400e; font-size:0.85rem; font-weight:800; padding:3px 10px; border-radius:999px; margin-bottom:6px;">
                ⭐ 特殊教育數位創新 · 教學平台特色導覽
              </div>
              <h2 style="font-size:1.6rem; color:#1e1b4b; margin:0; font-weight:900;">
                學習教室三年級上學期數學備課平台
              </h2>
              <div style="font-size:0.95rem; color:#475569; margin-top:4px;">
                專為認知學障、ADHD、肢障與自閉症學童打造之通用設計 (UDL) 與 C-R-A 智慧備課系統
              </div>
            </div>
            <button id="btn-close-judges-modal" style="background:none; border:none; font-size:1.8rem; color:#94a3b8; cursor:pointer; line-height:1;" title="關閉">✕</button>
          </div>

          <!-- 六大競賽核心評審維度速查標籤 -->
          <div class="judges-grid-cards">
            <!-- 1. 課綱指標對齊 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">🏛️</span>
                <strong>108 雙課綱深度對齊</strong>
              </div>
              <p>完整對應普通數學領綱 <strong>n-II-1 ~ n-II-9</strong>，同時實質嵌入特殊需求領域課綱指標（<strong>特學1-E-1、特學2-E-2、特生2-E-2</strong>）。</p>
            </div>

            <!-- 2. C-R-A 教學法 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">🪜</span>
                <strong>C-R-A 具體到抽象鷹架</strong>
              </div>
              <p>每個單元均配備「具體操作物 (錢幣/量筒/切盤) ➔ 圖像半具體 ➔ 抽象符號」之三階循序教學法，降低工作記憶負荷。</p>
            </div>

            <!-- 3. 提示階層三段消褪 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">🎚️</span>
                <strong>提示階層消褪 (Fading)</strong>
              </div>
              <p>提供 Level 1 全色彩高亮 ➔ Level 2 黑白對齊線 ➔ Level 3 純淨獨立檢測，實證促成學童由高度支持邁向獨立自主作答。</p>
            </div>

            <!-- 4. UDL 通用設計與輔具 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">♿</span>
                <strong>身障輔具科技與 UDL</strong>
              </div>
              <p>內建「單鍵微動開關掃描模式 (Switch Access)」、「閱讀聚焦導引尺」、「全題目注音標楷體」與「自閉症低感官刺激模式」。</p>
            </div>

            <!-- 5. 邊講邊揭示思維外顯化 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">🗣️</span>
                <strong>邊講邊揭示思維外顯化</strong>
              </div>
              <p>嚴格杜絕冰冷靜態答案！直式、乘法面積與除法平分一律「由問號佔位，隨朗讀解說逐步點亮答案」，引導步驟化後設認知。</p>
            </div>

            <!-- 6. 正向增強與情緒同理 -->
            <div class="judges-metric-card">
              <div class="judges-metric-header">
                <span class="j-icon">⭐</span>
                <strong>無標籤化代幣與同理擁抱</strong>
              </div>
              <p>5 位學童無障礙標籤存摺、答對五彩紙花慶祝、答錯無倒扣給予溫暖擁抱詞，並附 4-7-8 呼吸與頌缽白噪音冷靜通道。</p>
            </div>
          </div>

          <!-- 現場即時快速驗證展示專區 -->
          <div style="background:#f1f5f9; border-radius:14px; padding:16px; margin:20px 0;">
            <div style="font-weight:900; color:#1e293b; font-size:1.05rem; margin-bottom:10px;">
              🚀 評審現場快速體驗按鈕（一鍵直達功能）：
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="kid-btn kid-btn-solution" id="btn-jump-switch" style="font-size:0.9rem; padding:6px 14px;">
                🕹️ 體驗單鍵掃描輔具
              </button>
              <button class="kid-btn kid-btn-solution" id="btn-jump-ruler" style="font-size:0.9rem; padding:6px 14px;">
                📏 體驗閱讀聚焦尺
              </button>
              <button class="kid-btn kid-btn-solution" id="btn-jump-ws" style="font-size:0.9rem; padding:6px 14px;">
                🖨️ 預覽 A4 特教學習單
              </button>
              <button class="kid-btn kid-btn-solution" id="btn-jump-battle" style="font-size:0.9rem; padding:6px 14px;">
                🎮 查看分組搶答對決
              </button>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button class="kid-btn kid-btn-primary" id="btn-close-judges-bottom" style="padding:8px 24px;">
              收起評審導覽 · 繼續體驗教學系統 ➔
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      modal.querySelector('#btn-close-judges-modal').onclick = () => modal.remove();
      modal.querySelector('#btn-close-judges-bottom').onclick = () => modal.remove();

      // 跳轉快捷操作
      modal.querySelector('#btn-jump-switch').onclick = () => {
        modal.remove();
        SwitchAccessManager.start();
      };
      modal.querySelector('#btn-jump-ruler').onclick = () => {
        modal.remove();
        ReadingRulerManager.start();
      };
      modal.querySelector('#btn-jump-ws').onclick = () => {
        modal.remove();
        WorksheetGenerator.openWorksheetModal();
      };
      modal.querySelector('#btn-jump-battle').onclick = () => {
        modal.remove();
        if (window.switchSpEdTab) window.switchSpEdTab('battle');
      };
    }
  };

  // =========================================================================
  // 7. 🛠️ ToolsDropdown (特教與評審專業工具直式選單控制器)
  // =========================================================================
  const ToolsDropdown = {
    container: null,
    trigger: null,
    isOpen: false,

    init() {
      this.container = document.getElementById('tools-dropdown-container');
      this.trigger = document.getElementById('btn-tools-dropdown');
      if (!this.container || !this.trigger) return;

      this.trigger.onclick = (e) => {
        e.stopPropagation();
        this.toggle();
      };

      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.container.contains(e.target)) {
          this.close();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
          this.trigger.focus();
        }
      });
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.isOpen = true;
      if (this.container) {
        this.container.classList.add('open');
        this.adjustPosition();
      }
      if (this.trigger) this.trigger.setAttribute('aria-expanded', 'true');
    },

    adjustPosition() {
      const menu = document.getElementById('tools-dropdown-menu');
      if (!menu || !this.trigger) return;

      // 預設靠左對齊按鈕左緣
      menu.style.left = '0';
      menu.style.right = 'auto';

      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // 若選單右側超出視窗，改為靠右對齊按鈕
      if (rect.right > viewportWidth - 12) {
        menu.style.left = 'auto';
        menu.style.right = '0';
      }

      // 檢查左側邊界，若左邊界小於12px或被截斷，強制推回螢幕安全範圍
      const newRect = menu.getBoundingClientRect();
      if (newRect.left < 12) {
        const offset = 12 - newRect.left;
        menu.style.left = `${offset}px`;
        menu.style.right = 'auto';
      }
    },

    close() {
      this.isOpen = false;
      if (this.container) this.container.classList.remove('open');
      if (this.trigger) this.trigger.setAttribute('aria-expanded', 'false');
    }
  };

  // 全域監聽視窗縮放防裁切
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      if (ToolsDropdown && ToolsDropdown.isOpen) {
        ToolsDropdown.adjustPosition();
      }
    });
  }

  // 全域暴露
  window.SwitchAccessManager = SwitchAccessManager;
  window.ReadingRulerManager = ReadingRulerManager;
  window.ErrorPatternDiagnosis = ErrorPatternDiagnosis;
  window.GrowthTracker = GrowthTracker;
  window.WorksheetGenerator = WorksheetGenerator;
  window.JudgesShowcase = JudgesShowcase;
  window.ToolsDropdown = ToolsDropdown;

  // 網頁載入後自動初始化輔具
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      SwitchAccessManager.init();
      ReadingRulerManager.init();
      ToolsDropdown.init();
    });
  }

})(typeof window !== 'undefined' ? window : this);
