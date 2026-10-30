/**
 * 南一版三年級上學期數學 資源班教學平台 主控腳本 (App Controller)
 * 深度結合 108 普通課綱數學領域、108 特教課綱課程調整四向度、特教微步驟學習鷹架、
 * 先備回溯地圖、常見迷思除錯專區、以及提示階層三段消褪功能
 */

document.addEventListener('DOMContentLoaded', () => {
  const AppState = {
    currentUnitId: 'u1',
    activeTab: 'units',
    stars: parseInt(localStorage.getItem('spEd_math_stars') || '0', 10),
    currentPracticeIndex: 0,
    filteredPractices: [],
    // 當前單元微步驟鷹架進度
    currentScaffoldStep: 0,
    // 提示階層消褪等級：1 (全鷹架), 2 (半鷹架消褪), 3 (無鷹架獨立)
    promptLevel: 1
  };

  // 初始化 DOM 參照
  const elements = {
    tokenCount: document.getElementById('token-count'),
    btnHighContrast: document.getElementById('btn-high-contrast'),
    btnCalmFocus: document.getElementById('btn-calm-focus'),
    btnAudioMute: document.getElementById('btn-audio-mute'),
    rateSelector: document.getElementById('speech-rate-selector'),
    unitNavList: document.getElementById('unit-nav-list'),
    unitDetailContainer: document.getElementById('unit-detail-container'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    // 練習題元素
    practiceQuestionText: document.getElementById('practice-question-text'),
    practiceOptions: document.getElementById('practice-options'),
    practiceFeedback: document.getElementById('practice-feedback'),
    btnPracticeSpeech: document.getElementById('btn-practice-speech'),
    btnPracticeSolutionSpeech: document.getElementById('btn-practice-solution-speech'),
    btnPracticeHint: document.getElementById('btn-practice-hint'),
    btnPracticeLadder: document.getElementById('btn-practice-ladder'),
    practiceLadderBox: document.getElementById('practice-ladder-box'),
    btnPracticePrev: document.getElementById('btn-practice-prev'),
    btnPracticeNext: document.getElementById('btn-practice-next'),
    practiceUnitSelect: document.getElementById('practice-unit-select'),
    practiceMetaBadge: document.getElementById('practice-meta-badge'),
    // 教具箱元素
    sandboxUnitSelect: document.getElementById('sandbox-unit-select'),
    sandboxStage: document.getElementById('sandbox-stage'),
    // IEP 產生器
    iepStudentName: document.getElementById('iep-student-name'),
    iepUnitSelect: document.getElementById('iep-unit-select'),
    iepSupportLevel: document.getElementById('iep-support-level'),
    iepPromptLevelSelect: document.getElementById('iep-prompt-level-select'),
    iepTeacherNotes: document.getElementById('iep-teacher-notes'),
    iepGenerateBtn: document.getElementById('iep-generate-btn'),
    iepCopyBtn: document.getElementById('iep-copy-btn'),
    iepPrintBtn: document.getElementById('iep-print-btn'),
    iepOutput: document.getElementById('iep-output')
  };

  // 更新星星代幣數
  function updateStars(amount = 1) {
    AppState.stars += amount;
    localStorage.setItem('spEd_math_stars', AppState.stars);
    if (elements.tokenCount) {
      elements.tokenCount.textContent = AppState.stars;
    }
  }

  // 初始化頂部工具列
  function initHeaderTools() {
    if (elements.tokenCount) {
      elements.tokenCount.textContent = AppState.stars;
    }

    if (elements.btnHighContrast) {
      elements.btnHighContrast.addEventListener('click', () => {
        const isHc = document.body.classList.toggle('high-contrast-mode');
        elements.btnHighContrast.classList.toggle('active', isHc);
        elements.btnHighContrast.setAttribute('aria-pressed', isHc);
        window.spEdAudio.playClick();
      });
    }

    if (elements.btnCalmFocus) {
      elements.btnCalmFocus.addEventListener('click', () => {
        const isCalm = document.body.classList.toggle('calm-focus-mode');
        elements.btnCalmFocus.classList.toggle('active', isCalm);
        elements.btnCalmFocus.setAttribute('aria-pressed', isCalm);
        window.spEdAudio.playClick();
      });
    }

    if (elements.btnAudioMute) {
      elements.btnAudioMute.addEventListener('click', () => {
        window.spEdAudio.toggleMute(elements.btnAudioMute);
      });
    }

    if (elements.rateSelector) {
      elements.rateSelector.addEventListener('change', (e) => {
        window.spEdAudio.setSpeechRate(parseFloat(e.target.value));
      });
    }
  }

  // 單元生活化趣味主題與可愛圖示對應 (消除 AI 冰冷感，貼近三年級學生生活)
  const UNIT_THEMES = {
    u1: { icon: '🪙', theme: '勇闖金幣寶藏島', color: '#f59e0b', tag: '萬以內的數' },
    u2: { icon: '🛒', theme: '超商收銀機大冒險', color: '#10b981', tag: '四位數加減' },
    u3: { icon: '🍩', theme: '甜甜圈烘焙點心派對', color: '#ec4899', tag: '乘法與倍數' },
    u4: { icon: '🦒', theme: '長頸鹿小尺量量樂', color: '#06b6d4', tag: '長度與毫米' },
    u5: { icon: '🦖', theme: '恐龍幾何魔法國', color: '#8b5cf6', tag: '角與方長形' },
    u6: { icon: '🍪', theme: '小松鼠餅乾野餐隊', color: '#f97316', tag: '除法與平分' },
    u7: { icon: '🧃', theme: '果汁牛奶調飲實驗室', color: '#3b82f6', tag: '公升與毫升' },
    u8: { icon: '🍕', theme: '派對美味披薩下午茶', color: '#ef4444', tag: '分數初探' },
    u9: { icon: '🎡', theme: '奇幻遊樂園旋轉摩天輪', color: '#14b8a6', tag: '圓與圓規' }
  };

  // 標籤頁面切換
  function switchToTab(target) {
    window.spEdAudio.stopSpeech();
    AppState.activeTab = target;
    elements.navTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    elements.tabPanes.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));

    window.spEdAudio.playClick();

    if (target === 'practice') {
      if (!AppState.filteredPractices.length) loadPracticesForUnit(elements.practiceUnitSelect.value || AppState.currentUnitId);
    } else if (target === 'sandbox') {
      renderSandbox(elements.sandboxUnitSelect.value || AppState.currentUnitId);
    } else if (target === 'battle') {
      if (window.MathBattleArena && (!window.MathBattleArena.questions.length || window.MathBattleArena.currentUnitId !== AppState.currentUnitId)) {
        window.MathBattleArena.startBattle(AppState.currentUnitId, 'all', 10);
      }
    } else if (target === 'iep') {
      renderClinicDashboard('嘉');
      window.LearningRecords?.renderDashboard();
    }
  }
  window.switchSpEdTab = switchToTab;

  // 渲染學生四大認知錯誤型態診斷雷達與 C-R-A 成長歷程圖
  function renderClinicDashboard(studentName = '嘉') {
    const selectorContainer = document.getElementById('clinic-student-selector');
    const radarSlot = document.getElementById('clinic-radar-slot');
    const growthSlot = document.getElementById('clinic-growth-slot');
    if (!radarSlot || !growthSlot) return;

    const students = (window.StudentBank && typeof window.StudentBank.getStudents === 'function')
      ? window.StudentBank.getStudents()
      : [{ id: 1, name: '嘉', avatar: '🦁' }, { id: 2, name: '萱', avatar: '🐰' }, { id: 3, name: '涵', avatar: '🐬' }, { id: 4, name: '凱', avatar: '🐻' }, { id: 5, name: '宸', avatar: '🐨' }];

    // 渲染學生切換按鈕
    if (selectorContainer) {
      selectorContainer.innerHTML = students.map(s => `
        <button class="kid-btn ${s.name === studentName ? 'kid-btn-primary' : 'kid-btn-secondary'}" data-sname="${window.LearningRecords.escapeHtml(s.name)}" style="padding: 4px 10px; font-size: 0.85rem;">
          ${s.avatar} ${window.LearningRecords.escapeHtml(s.name)}
        </button>
      `).join('');

      selectorContainer.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          const name = btn.dataset.sname;
          window.spEdAudio.playClick();
          renderClinicDashboard(name);
        };
      });
    }

    if (window.ErrorPatternDiagnosis) {
      const rx = window.ErrorPatternDiagnosis.getDiagnosticPrescription(studentName);
      radarSlot.innerHTML = `
        <div style="font-weight: 800; color: #3730a3; margin-bottom: 8px;">
          🎯 ${window.LearningRecords.escapeHtml(studentName)} · 虛構範例型態分佈：
        </div>
        ${window.ErrorPatternDiagnosis.renderRadarSvg(studentName, 260)}
        <div style="background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 10px 12px; margin-top: 14px; width: 100%; box-sizing: border-box;">
          <strong style="color: #4338ca; font-size: 0.95rem;">${rx.title}</strong>
          <div style="font-size: 0.88rem; color: #334155; margin-top: 4px;">${rx.detail}</div>
          <div style="font-size: 0.88rem; color: #15803d; margin-top: 4px; font-weight: bold;">💊 特教處方：${rx.rx}</div>
        </div>
      `;
    }

    if (window.GrowthTracker) {
      growthSlot.innerHTML = window.GrowthTracker.renderGrowthChart(320);
    }
  }
  window.renderClinicDashboard = renderClinicDashboard;

  // 🎪 互動遊戲冒險館 (Arcade) 控制器
  let currentGameUrl = '';

  window.launchArcadeGame = function(url, title, icon = '🎮') {
    currentGameUrl = url;
    const modal = document.getElementById('arcade-player-modal');
    const iframe = document.getElementById('arcade-game-frame');
    const titleEl = document.getElementById('arcade-player-title');
    const iconEl = document.getElementById('arcade-player-icon');

    if (modal && iframe) {
      modal.style.display = 'block';
      iframe.src = url;
      if (titleEl) titleEl.textContent = title;
      if (iconEl) iconEl.textContent = icon;
      modal.scrollIntoView({ behavior: 'smooth' });
    }
    window.spEdAudio.playClick();
  };

  window.closeArcadePlayer = function() {
    const modal = document.getElementById('arcade-player-modal');
    const iframe = document.getElementById('arcade-game-frame');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
    window.spEdAudio.playClick();
  };

  window.openCurrentGameNewTab = function() {
    if (currentGameUrl) {
      window.open(currentGameUrl, '_blank');
    }
  };

  // 跨視窗/iframe 訊息監聽 (關閉視窗或獎勵星星入帳)
  window.addEventListener('message', (event) => {
    const frame = document.getElementById('arcade-game-frame');
    if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
    if (event.data === 'close-game-modal') {
      window.closeArcadePlayer();
    } else if (event.data && event.data.type === 'award-star') {
      updateStars(event.data.amount || 1);
      if (window.spEdAudio) window.spEdAudio.playCoin();
    }
  });

  function initTabNavigation() {
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchToTab(tab.dataset.tab);
      });
    });
  }

  // 載入單元清單與詳情
  function initUnitView() {
    if (!elements.unitNavList) return;
    const quickSelect = document.getElementById('lesson-unit-quick-select');
    quickSelect.innerHTML = NANI_G3S1_DATA.units.map(u => `<option value="${u.id}">第 ${u.number} 單元：${u.title}</option>`).join('');
    quickSelect.addEventListener('change', () => selectUnit(quickSelect.value));

    elements.unitNavList.innerHTML = NANI_G3S1_DATA.units.map(unit => {
      const theme = UNIT_THEMES[unit.id] || { icon: '📐', theme: '趣味數學探索', color: '#4f46e5' };
      return `
        <button class="unit-card-btn ${unit.id === AppState.currentUnitId ? 'active' : ''}" data-unit-id="${unit.id}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="unit-num-badge">第 ${unit.number} 單元</span>
            <span style="font-size:1.7rem;" title="${theme.theme}">${theme.icon}</span>
          </div>
          <span class="unit-title-text">${unit.title}</span>
          <span style="display:inline-block; font-size:0.85rem; font-weight:800; color:${theme.color}; background:${theme.color}18; padding:3px 10px; border-radius:999px; margin-top:3px;">
            ${theme.icon} ${theme.theme}
          </span>
          <div style="margin-top:6px; font-size:0.8rem; color:#64748b; line-height:1.4;">
            <span>108普數：${unit.curriculumCode}</span> ｜ <span style="color:#4f46e5; font-weight:700;">特需課綱</span>
          </div>
        </button>
      `;
    }).join('');

    elements.unitNavList.querySelectorAll('.unit-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.unitId;
        selectUnit(uid);
      });
    });

    renderUnitDetail(AppState.currentUnitId);
  }

  function selectUnit(uid) {
    AppState.currentUnitId = uid;
    document.getElementById('lesson-unit-quick-select').value = uid;
    AppState.currentScaffoldStep = 0; // 重置步驟精靈至第一步
    document.querySelectorAll('.unit-card-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.unitId === uid);
    });
    renderUnitDetail(uid);
    if (elements.practiceUnitSelect) {
      elements.practiceUnitSelect.value = uid;
      loadPracticesForUnit(uid);
    }
    window.spEdAudio.playClick();
  }

  // 輔助函式：取得特需指標詳細說明
  function getSpecialNeedsDetail(code) {
    const all = [...NANI_G3S1_DATA.specialNeedsIndicators.strategy, ...NANI_G3S1_DATA.specialNeedsIndicators.dailyLife];
    return all.find(item => item.code === code) || { code, title: code, desc: "" };
  }

  // 設定提示階層等級
  function setPromptFadingLevel(level) {
    AppState.promptLevel = level;
    const targetEl = document.getElementById('unit-detail-container');
    if (targetEl) {
      targetEl.classList.remove('prompt-level-1', 'prompt-level-2', 'prompt-level-3');
      targetEl.classList.add(`prompt-level-${level}`);
    }
    document.querySelectorAll('.fading-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.level, 10) === level);
    });
    window.spEdAudio.playClick();
  }

  // 渲染單元詳細內容、先備地圖、迷思除錯卡、微步驟引導精靈與教具
  function renderUnitDetail(uid) {
    const unit = NANI_G3S1_DATA.units.find(u => u.id === uid);
    if (!unit || !elements.unitDetailContainer) return;

    const specialNeedsBadges = unit.specialNeedsCodes.map(code => {
      const info = getSpecialNeedsDetail(code);
      return `
        <div style="background: #eef2ff; border-left: 3px solid #6366f1; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; font-size: 0.85rem;">
          <strong style="color: #4338ca;">${info.code} ${info.title}</strong>
          <div style="color: #4b5563; font-size: 0.8rem; margin-top: 2px;">${info.desc}</div>
        </div>
      `;
    }).join('');

    elements.unitDetailContainer.className = `prompt-level-${AppState.promptLevel}`;
    elements.unitDetailContainer.innerHTML = `
      <div class="unit-detail-layout">
        <!-- 左側：特教四向度、先備回溯、迷思除錯與 C-R-A 鷹架 -->
        <details class="special-ed-sidebar teacher-guide-details"><summary>備課指引：先備檢核、迷思與課綱對照</summary>
          
          <!-- 1. 🔄 先備能力診斷與向下回溯地圖 -->
          <div class="prerequisite-card">
            <div class="prereq-header">
              <span class="prereq-title">🔄 先備能力回溯地圖</span>
              <span class="prereq-badge">${unit.prerequisite.grade} · ${unit.prerequisite.unitCode}</span>
            </div>
            <div class="prereq-body">
              <strong>向下銜接核心：</strong>${unit.prerequisite.title}
              <div class="prereq-check">
                <strong>🔍 課前快速診斷：</strong><br/>${unit.prerequisite.diagnosticCheck}
              </div>
              <div style="margin-top: 8px; font-size: 0.88rem; color: #166534;">
                <strong>💊 回溯補救處方：</strong>${unit.prerequisite.backtrackStrategy}
              </div>
            </div>
          </div>

          <!-- 2. 🚨 常見迷思概念除錯專區 (Misconception Clinic) -->
          <div class="misconception-clinic-card">
            <div class="clinic-header">
              <strong style="color: #9f1239; font-size: 1.05rem;">🚨 典型迷思概念除錯診所</strong>
              <span class="clinic-badge">${unit.misconception.name}</span>
            </div>
            <div class="clinic-bad-example">
              <strong>❌ 學童常見典型錯誤：</strong><br/>
              ${unit.misconception.badExample}
            </div>
            <div class="clinic-root-cause">
              <strong>🧠 認知盲點剖析：</strong>${unit.misconception.rootCause}
            </div>
            <div class="clinic-buster-solution">
              <strong>🛠️ 特教破解處方：</strong><br/>
              ${unit.misconception.busterStrategy}
            </div>
            <button class="btn btn-xs btn-speech mt-2" id="btn-clinic-speech">
              🔊 聽除錯口訣
            </button>
          </div>

          <!-- 3. 108 特教課綱課程調整四向度卡片 -->
          <div class="card" style="border: 2px solid #818cf8;">
            <h3 class="card-title" style="color: #4338ca;">
              🏛️ 108 特教課綱·課程調整四向度
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
              <div style="background: #fdf2f8; padding: 8px; border-radius: 6px; border-left: 4px solid #db2777;">
                <strong style="color: #9d174d;">1. 學習內容調整：</strong>
                <p style="color: #701a75; margin-top: 2px;">${unit.accommodations.content}</p>
              </div>

              <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; border-left: 4px solid #16a34a;">
                <strong style="color: #166534;">2. 學習歷程調整：</strong>
                <p style="color: #14532d; margin-top: 2px;">${unit.accommodations.process}</p>
              </div>

              <div style="background: #eff6ff; padding: 8px; border-radius: 6px; border-left: 4px solid #2563eb;">
                <strong style="color: #1e40af;">3. 學習環境調整：</strong>
                <p style="color: #1e3a8a; margin-top: 2px;">${unit.accommodations.environment}</p>
              </div>

              <div style="background: #fefce8; padding: 8px; border-radius: 6px; border-left: 4px solid #ca8a04;">
                <strong style="color: #854d0e;">4. 學習評量調整：</strong>
                <p style="color: #713f12; margin-top: 2px;">${unit.accommodations.assessment}</p>
              </div>
            </div>

            <div style="margin-top: 14px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
              <strong style="font-size: 0.9rem; color: #4338ca; display: block; margin-bottom: 6px;">
                🎯 特殊需求領域課綱能力指標：
              </strong>
              ${specialNeedsBadges}
            </div>
          </div>

          <!-- C-R-A 鷹架卡 -->
          <div class="card">
            <h3 class="card-title">🌱 C-R-A 教學鷹架進程</h3>
            <div class="cra-stage-box c-stage">
              <div class="cra-tag">1. 具體表徵 (Concrete)</div>
              <div class="cra-desc">${unit.cra.concrete}</div>
            </div>
            <div class="cra-stage-box r-stage">
              <div class="cra-tag">2. 圖像半具體 (Representational)</div>
              <div class="cra-desc">${unit.cra.representational}</div>
            </div>
            <div class="cra-stage-box a-stage">
              <div class="cra-tag">3. 抽象符號 (Abstract)</div>
              <div class="cra-desc">${unit.cra.abstract}</div>
            </div>
          </div>
        </details>

        <!-- 右側主區域：單元趣味標頭 + 提示消褪列 + 微步驟引導精靈 + 動態特教教具操作台 -->
        <div class="manipulative-main-area">
          
          <!-- 單元趣味生活主題橫幅與分組搶答入口 -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, #ffffff, #f5f3ff); border:2px solid #c7d2fe; border-radius:20px; padding:12px 18px; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:2rem;">${(UNIT_THEMES[unit.id] || {}).icon || '🌟'}</span>
              <div>
                <strong style="font-size:1.2rem; color:#1e1b4b;">${unit.title} · ${(UNIT_THEMES[unit.id] || {}).theme || ''}</strong>
                <div style="font-size:0.85rem; color:#6366f1; font-weight:700;">三年級數學生活探險系列</div>
              </div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="kid-btn kid-btn-solution" onclick="window.switchSpEdTab('battle')" style="font-size:0.95rem; padding:6px 14px;" title="以本單元題目開啟分組搶答對決">
                ⚔️ 分組搶答大對決
              </button>
              <button class="kid-btn kid-btn-solution" onclick="window.switchSpEdTab('arcade')" style="font-size:0.95rem; padding:6px 14px; background:#fdf2f8; color:#be185d; border-color:#fbcfe8;" title="前往互動遊戲冒險館遊玩 5 大精選遊戲">
                🎪 遊戲冒險館
              </button>
              <button class="kid-btn kid-btn-primary" onclick="window.switchSpEdTab('practice')" style="font-size:0.95rem; padding:6px 14px;" title="前往本單元練習與觀察">
                🎯 練習與觀察
              </button>
            </div>
          </div>

          <!-- 🎚️ 提示階層三段消褪控制面板 (Prompt Fading Selector) -->
          <div class="fading-control-panel">
            <span class="fading-label">
              🎚️ 提示階層消褪調控：
            </span>
            <div class="fading-btn-group">
              <button class="fading-btn ${AppState.promptLevel === 1 ? 'active' : ''}" data-level="1" title="完全支持：全色彩位值框與高亮">
                🟢 Level 1: 全鷹架模式
              </button>
              <button class="fading-btn ${AppState.promptLevel === 2 ? 'active' : ''}" data-level="2" title="部分消褪：去強烈色彩，保留黑白對齊線">
                🟡 Level 2: 半鷹架消褪
              </button>
              <button class="fading-btn ${AppState.promptLevel === 3 ? 'active' : ''}" data-level="3" title="獨立檢測：模擬段考純淨黑白算式">
                🔴 Level 3: 無鷹架獨立
              </button>
            </div>
          </div>

          <!-- 微步驟引導教學精靈 (Step-by-Step Wizard) -->
          <details class="student-scaffold"><summary>展開逐步教學引導：一起說步驟、做檢查</summary><div class="scaffold-wizard-box" id="scaffold-wizard-slot"></div></details>

          <!-- 動態教具掛載槽 -->
          <div id="unit-manipulative-slot"></div>
        </div>
      </div>
    `;

    // 綁定除錯口訣語音朗讀
    const btnClinicSpeech = document.getElementById('btn-clinic-speech');
    if (btnClinicSpeech) {
      btnClinicSpeech.addEventListener('click', () => {
        window.spEdAudio.speak(unit.misconception.audioMnemonic);
      });
    }

    // 綁定提示階層切換按鈕
    elements.unitDetailContainer.querySelectorAll('.fading-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.dataset.level, 10);
        setPromptFadingLevel(lvl);
      });
    });

    // 渲染微步驟引導教學精靈
    renderScaffoldingWizard(unit);

    // 掛載對應單元的數位教具
    mountUnitManipulative(uid, 'unit-manipulative-slot');
  }

  // 渲染微步驟教學引導精靈 (Step-by-Step Scaffolding Wizard)
  function renderScaffoldingWizard(unit) {
    const wizardSlot = document.getElementById('scaffold-wizard-slot');
    if (!wizardSlot || !unit.scaffoldingSteps || unit.scaffoldingSteps.length === 0) return;

    const steps = unit.scaffoldingSteps;
    const currentIdx = Math.min(AppState.currentScaffoldStep, steps.length - 1);
    const curr = steps[currentIdx];

    wizardSlot.innerHTML = `
      <div class="wizard-header">
        <span class="wizard-mode-pill">
          🪜 特教微步驟鷹架引導精靈（Task Analysis 工作分析）
        </span>
        <span style="font-weight: 800; color: var(--primary);">
          第 ${currentIdx + 1} / ${steps.length} 步驟
        </span>
      </div>

      <!-- 步驟進度節點列 -->
      <div class="wizard-steps-track">
        ${steps.map((st, i) => `
          <div class="wizard-step-node ${i === currentIdx ? 'current' : (i < currentIdx ? 'completed' : '')}" data-step-idx="${i}" title="${st.title}">
            ${i < currentIdx ? '✓' : (i + 1)}
          </div>
        `).join('')}
      </div>

      <!-- 當前步驟引導卡片 -->
      <div class="wizard-current-card">
        <div class="wizard-step-title">
          <span>${curr.title}</span>
          <button class="btn btn-sm btn-speech" id="btn-step-speech">
            🔊 聽步驟口訣
          </button>
        </div>
        <div class="wizard-step-instruction">
          👉 ${curr.instruction}
        </div>
        <div class="wizard-step-check">
          <span>💡 <strong>自我檢核點：</strong>${curr.checkRule}</span>
        </div>
      </div>

      <!-- 控制按鈕 -->
      <div class="wizard-controls">
        <button class="btn btn-outline" id="btn-step-prev" ${currentIdx === 0 ? 'disabled' : ''}>
          ⬅️ 上一步
        </button>
        <span style="font-size: 0.95rem; color: var(--text-muted);">
          按照步驟循序漸進，不著急、不跳步
        </span>
        <button class="btn btn-primary" id="btn-step-next">
          ${currentIdx === steps.length - 1 ? '完成示範，換學生操作' : '下一步 ➔'}
        </button>
      </div>
    `;

    // 點擊節點切換
    wizardSlot.querySelectorAll('.wizard-step-node').forEach(node => {
      node.addEventListener('click', () => {
        AppState.currentScaffoldStep = parseInt(node.dataset.stepIdx, 10);
        window.spEdAudio.playClick();
        renderScaffoldingWizard(unit);
      });
    });

    // 朗讀步驟口訣
    const btnSpeech = document.getElementById('btn-step-speech');
    if (btnSpeech) {
      btnSpeech.addEventListener('click', () => {
        window.spEdAudio.speak(curr.audioCue || curr.instruction);
      });
    }

    // 上一步按鈕
    const btnPrev = document.getElementById('btn-step-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (AppState.currentScaffoldStep > 0) {
          AppState.currentScaffoldStep--;
          window.spEdAudio.playClick();
          renderScaffoldingWizard(unit);
        }
      });
    }

    // 下一步按鈕
    const btnNext = document.getElementById('btn-step-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (AppState.currentScaffoldStep < steps.length - 1) {
          AppState.currentScaffoldStep++;
          window.spEdAudio.playCorrect();
          renderScaffoldingWizard(unit);
        } else {
          btnNext.textContent = '請學生操作、口述，再由教師記錄表現';
          btnNext.disabled = true;
        }
      });
    }
  }

  function mountUnitManipulative(uid, targetSlotId) {
    switch (uid) {
      case 'u1':
        Manipulatives.renderU1Money(targetSlotId);
        break;
      case 'u2':
        Manipulatives.renderU2Vertical(targetSlotId);
        break;
      case 'u3':
        Manipulatives.renderU3Multiplication(targetSlotId);
        break;
      case 'u4':
        Manipulatives.renderU4Ruler(targetSlotId);
        break;
      case 'u5':
        Manipulatives.renderU5Angle(targetSlotId);
        window.GeometryShapes.append(targetSlotId);
        break;
      case 'u6':
        Manipulatives.renderU6Division(targetSlotId);
        break;
      case 'u7':
        Manipulatives.renderU7Capacity(targetSlotId);
        break;
      case 'u8':
        document.getElementById(targetSlotId).innerHTML = `<div id="${targetSlotId}-primary-fraction"></div><details class="fraction-compare-details"><summary>展開第二個等大分數盤，並列比較</summary><p>兩個完整披薩一樣大，才能比較取出的份量。先做同分母比較，再試試 1/2 和 1/8；請學生指出每份大小與份數。</p><div id="${targetSlotId}-compare-fraction"></div></details>`;
        Manipulatives.renderU8Fraction(`${targetSlotId}-primary-fraction`);
        Manipulatives.renderU8Fraction(`${targetSlotId}-compare-fraction`, { denominator: 2, numerator: 1 });
        break;
      case 'u9':
        Manipulatives.renderU9Circle(targetSlotId);
        break;
      default:
        Manipulatives.renderU1Money(targetSlotId);
    }
  }

  // 隨堂互動練習題模組
  function initPracticeModule() {
    if (!elements.practiceUnitSelect) return;

    let optionsHtml = `<option value="all">📚 全學期九大單元綜合診斷 (共 ${NANI_G3S1_DATA.practiceBank.length} 題)</option>`;
    NANI_G3S1_DATA.units.forEach(u => {
      const uCount = NANI_G3S1_DATA.practiceBank.filter(p => p.unitId === u.id).length;
      optionsHtml += `<optgroup label="第 ${u.number} 單元：${u.title} (共 ${uCount} 題)">`;
      optionsHtml += `<option value="${u.id}" ${u.id === AppState.currentUnitId ? 'selected' : ''}>▶ 第 ${u.number} 單元全小節診斷 (${uCount} 題)</option>`;
      if (u.sections && u.sections.length > 0) {
        u.sections.forEach(sec => {
          const sCount = NANI_G3S1_DATA.practiceBank.filter(p => p.sectionId === sec.id).length;
          optionsHtml += `<option value="${sec.id}">&nbsp;&nbsp;&nbsp;&nbsp;📖 ${sec.title} (${sCount} 題)</option>`;
        });
      }
      optionsHtml += `</optgroup>`;
    });

    elements.practiceUnitSelect.innerHTML = optionsHtml;

    elements.practiceUnitSelect.addEventListener('change', (e) => {
      loadPracticesForUnit(e.target.value);
    });

    const btnLaunchBattle = document.getElementById('btn-practice-launch-battle');
    if (btnLaunchBattle) {
      btnLaunchBattle.addEventListener('click', () => {
        switchToTab('battle');
      });
    }

    if (elements.btnPracticePrev) {
      elements.btnPracticePrev.addEventListener('click', () => {
        AppState.currentPracticeIndex--;
        if (AppState.currentPracticeIndex < 0) {
          AppState.currentPracticeIndex = 0;
        }
        renderCurrentPractice();
        window.spEdAudio.playClick();
      });
    }

    if (elements.btnPracticeNext) {
      elements.btnPracticeNext.addEventListener('click', () => {
        nextPractice();
      });
    }

    if (elements.btnPracticeSpeech) {
      elements.btnPracticeSpeech.addEventListener('click', () => {
        const p = AppState.filteredPractices[AppState.currentPracticeIndex];
        if (p) {
          elements.btnPracticeSpeech.classList.add('playing');
          window.spEdAudio.speak(p.speechText || p.question, null, () => {
            elements.btnPracticeSpeech.classList.remove('playing');
          });
        }
      });
    }

    // 逐步拆解解題鷹架渲染器（邊講邊揭示步驟化教學）
    let ladderAutoPlaying = false;

    function renderPracticeLadder(p, autoSpeakNewStep = false) {
      if (!p || !p.stepScaffolds || !elements.practiceLadderBox) return;

      const totalSteps = p.stepScaffolds.length;
      if (typeof AppState.currentLadderStep !== 'number') {
        AppState.currentLadderStep = 1;
      }
      const current = Math.min(Math.max(1, AppState.currentLadderStep), totalSteps);
      AppState.currentLadderStep = current;

      elements.practiceLadderBox.innerHTML = `
        <div class="step-ladder-box">
          <div class="ladder-header-bar">
            <div class="ladder-header-title">
              <span>🪜 逐步拆解解題鷹架（步驟化思考）：</span>
              <span style="font-size:0.9rem; color:#2563eb; background:#eff6ff; padding:2px 10px; border-radius:999px; border:1px solid #bfdbfe;">
                進度：第 ${current} / ${totalSteps} 步
              </span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="kid-btn kid-btn-solution" id="btn-ladder-auto-play" style="font-size:0.85rem; padding:4px 12px; background:#f0fdf4; color:#15803d; border-color:#bbf7d0;">
                ${ladderAutoPlaying ? '⏹️ 停止自動播報' : '▶️ 自動依序邊講邊揭示'}
              </button>
              <button class="kid-btn kid-btn-secondary" id="btn-ladder-show-all" style="font-size:0.85rem; padding:4px 10px;">
                👁️ 展開全部步驟
              </button>
              <button class="kid-btn kid-btn-secondary" id="btn-ladder-restart" style="font-size:0.85rem; padding:4px 10px;">
                🔄 重頭開始
              </button>
            </div>
          </div>

          <!-- 步驟進度標籤 (Pills) -->
          <div class="step-progress-pills" style="margin-bottom:12px;">
            ${p.stepScaffolds.map((_, sIdx) => `
              <span class="step-pill ${sIdx + 1 === current ? 'current' : (sIdx + 1 < current ? 'completed' : '')}" style="font-size:0.82rem; padding:3px 8px;">
                ${sIdx + 1 < current ? '✓ ' : ''}第 ${sIdx + 1} 步
              </span>
            `).join('')}
          </div>

          <!-- 步驟列表：已揭示 / 當前步 / 鎖定步 -->
          <div class="ladder-items-list">
            ${p.stepScaffolds.map((stepText, sIdx) => {
              const stepNum = sIdx + 1;
              const isRevealed = stepNum <= current;
              const isActive = stepNum === current;
              const isFinal = stepNum === totalSteps;

              if (isRevealed) {
                return `
                  <div class="ladder-item ladder-step-revealed ${isActive ? 'ladder-step-active' : ''} ${isFinal && isActive ? 'ladder-step-final' : ''}">
                    <span class="ladder-dot">${stepNum}</span>
                    <div class="ladder-text">
                      ${stepText}
                      ${isFinal ? `<span style="margin-left:8px; display:inline-block; font-size:0.85rem; font-weight:800; background:#dcfce7; color:#166534; padding:2px 8px; border-radius:999px; border:1px solid #86efac;">🏆 答案揭曉！</span>` : ''}
                    </div>
                    <button class="btn-step-audio" data-step-text="${stepText.replace(/"/g, '&quot;')}" title="朗讀此步驟" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:999px; padding:3px 10px; font-size:0.85rem; color:#2563eb; cursor:pointer; display:flex; align-items:center; gap:4px; flex-shrink:0;">
                      🔊 念此步
                    </button>
                  </div>
                `;
              } else {
                return `
                  <div class="ladder-item ladder-step-locked">
                    <span class="ladder-dot">🔒</span>
                    <div class="ladder-text" style="font-size:1.05rem; color:#94a3b8;">
                      思考步驟 ${stepNum}：（點擊下方「揭示下一步」邊聽邊解鎖答案）
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>

          <!-- 底部控制器 -->
          <div class="ladder-controls-bar">
            <div style="display:flex; gap:8px;">
              <button class="kid-btn kid-btn-secondary" id="btn-ladder-step-prev" ${current <= 1 ? 'disabled' : ''} style="font-size:0.9rem; padding:6px 14px;">
                ◀ 上一步
              </button>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              ${current < totalSteps ? `
                <button class="kid-btn kid-btn-primary" id="btn-ladder-step-next" style="font-size:1rem; padding:8px 18px;">
                  ▶ 揭示第 ${current + 1} 步（邊講邊學）
                </button>
              ` : `
                <button class="kid-btn kid-btn-primary" id="btn-ladder-step-done" style="font-size:1rem; padding:8px 18px; background:#10b981; border-color:#059669;">
                  🎉 解題全步驟已揭示完成！
                </button>
              `}
              <button class="btn btn-speech btn-sm" id="btn-ladder-speak-all" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:0.85rem; padding:6px 12px;">
                🔊 朗讀完整解題總結
              </button>
            </div>
          </div>
        </div>
      `;

      // 綁定事件
      const btnNext = document.getElementById('btn-ladder-step-next');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          ladderAutoPlaying = false;
          if (AppState.currentLadderStep < totalSteps) {
            AppState.currentLadderStep++;
            window.spEdAudio.playClick();
            renderPracticeLadder(p, true);
            if (AppState.currentLadderStep === totalSteps) {
              window.spEdAudio.playCorrect();
              if (window.KidEffects) window.KidEffects.triggerConfetti(50, 1800);
            }
          }
        });
      }

      const btnPrev = document.getElementById('btn-ladder-step-prev');
      if (btnPrev) {
        btnPrev.addEventListener('click', () => {
          ladderAutoPlaying = false;
          if (AppState.currentLadderStep > 1) {
            AppState.currentLadderStep--;
            window.spEdAudio.playClick();
            renderPracticeLadder(p, true);
          }
        });
      }

      const btnRestart = document.getElementById('btn-ladder-restart');
      if (btnRestart) {
        btnRestart.addEventListener('click', () => {
          ladderAutoPlaying = false;
          AppState.currentLadderStep = 1;
          window.spEdAudio.playClick();
          renderPracticeLadder(p, true);
        });
      }

      const btnShowAll = document.getElementById('btn-ladder-show-all');
      if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
          ladderAutoPlaying = false;
          AppState.currentLadderStep = totalSteps;
          window.spEdAudio.playClick();
          renderPracticeLadder(p, false);
          window.spEdAudio.playCorrect();
        });
      }

      const btnSpeakAll = document.getElementById('btn-ladder-speak-all');
      if (btnSpeakAll) {
        btnSpeakAll.addEventListener('click', () => {
          ladderAutoPlaying = false;
          window.spEdAudio.speak(p.solutionSpeech || p.stepScaffolds.join('。'));
        });
      }

      const btnAutoPlay = document.getElementById('btn-ladder-auto-play');
      if (btnAutoPlay) {
        btnAutoPlay.addEventListener('click', () => {
          if (ladderAutoPlaying) {
            ladderAutoPlaying = false;
            window.spEdAudio.stopSpeech();
            renderPracticeLadder(p, false);
            return;
          }
          ladderAutoPlaying = true;
          if (AppState.currentLadderStep >= totalSteps) {
            AppState.currentLadderStep = 1;
          }
          renderPracticeLadder(p, false);

          function playNextAutoStep() {
            if (!ladderAutoPlaying) return;
            const curStep = AppState.currentLadderStep;
            const text = p.stepScaffolds[curStep - 1];
            window.spEdAudio.speak(text, null, () => {
              if (!ladderAutoPlaying) return;
              if (AppState.currentLadderStep < totalSteps) {
                setTimeout(() => {
                  if (!ladderAutoPlaying) return;
                  AppState.currentLadderStep++;
                  renderPracticeLadder(p, false);
                  playNextAutoStep();
                }, 500);
              } else {
                ladderAutoPlaying = false;
                window.spEdAudio.playCorrect();
                if (window.KidEffects) window.KidEffects.triggerConfetti(50, 1800);
                renderPracticeLadder(p, false);
              }
            });
          }

          playNextAutoStep();
        });
      }

      elements.practiceLadderBox.querySelectorAll('.btn-step-audio').forEach(btn => {
        btn.addEventListener('click', () => {
          ladderAutoPlaying = false;
          const text = btn.getAttribute('data-step-text');
          if (text) {
            window.spEdAudio.speak(text);
          }
        });
      });

      if (autoSpeakNewStep) {
        const stepToRead = p.stepScaffolds[current - 1];
        if (stepToRead) {
          window.spEdAudio.speak(stepToRead);
        }
      }
    }

    // 點擊「🔊 聽解題音檔」按鈕：邊講解邊依序揭示題目步驟！
    if (elements.btnPracticeSolutionSpeech) {
      elements.btnPracticeSolutionSpeech.addEventListener('click', () => {
        const p = AppState.filteredPractices[AppState.currentPracticeIndex];
        if (p && elements.practiceLadderBox) {
          elements.practiceLadderBox.style.display = 'block';
          AppState.currentLadderStep = 1;
          renderPracticeLadder(p, false);
          const autoBtn = document.getElementById('btn-ladder-auto-play');
          if (autoBtn) autoBtn.click();
        }
      });
    }

    if (elements.btnPracticeHint) {
      elements.btnPracticeHint.addEventListener('click', () => {
        const p = AppState.filteredPractices[AppState.currentPracticeIndex];
        if (p && elements.practiceFeedback) {
          elements.practiceFeedback.className = 'feedback-box hint show';
          elements.practiceFeedback.innerHTML = `
            <strong>💡 先做一個步驟：</strong>${window.LearningRecords.strategyPrompt(p)}
            <div style="font-size: 0.9rem; margin-top: 6px; color: #78350f;">
              <em>【個別化支持】：${p.specialNote}</em>
            </div>
            <div style="margin-top: 10px;">
              <button class="btn btn-speech btn-sm" id="btn-feedback-speak-solution" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.85rem; padding: 4px 10px;">
                🔊 邊講邊看逐步解題
              </button>
            </div>
          `;
          const btnSpeak = document.getElementById('btn-feedback-speak-solution');
          if (btnSpeak) {
            btnSpeak.addEventListener('click', () => {
              if (elements.practiceLadderBox) {
                elements.practiceLadderBox.style.display = 'block';
                AppState.currentLadderStep = 1;
                renderPracticeLadder(p, false);
                const autoBtn = document.getElementById('btn-ladder-auto-play');
                if (autoBtn) autoBtn.click();
              } else {
                window.spEdAudio.speak(p.solutionSpeech || p.hint);
              }
            });
          }
          window.spEdAudio.playHint();
          window.spEdAudio.speak(`解題提示：${window.LearningRecords.strategyPrompt(p)}`);
        }
      });
    }

    // 點擊「🪜 逐步拆解解題鷹架」
    if (elements.btnPracticeLadder) {
      elements.btnPracticeLadder.addEventListener('click', () => {
        const p = AppState.filteredPractices[AppState.currentPracticeIndex];
        if (p && elements.practiceLadderBox) {
          const isHidden = elements.practiceLadderBox.style.display === 'none';
          elements.practiceLadderBox.style.display = isHidden ? 'block' : 'none';
          window.spEdAudio.playClick();
          if (isHidden) {
            AppState.currentLadderStep = 1;
            renderPracticeLadder(p, true);
          } else {
            ladderAutoPlaying = false;
            window.spEdAudio.stopSpeech();
          }
        }
      });
    }
  }

  function loadPracticesForUnit(filterValue, keepOffset = false) {
    AppState.practiceFilter = filterValue || 'all';
    if (!keepOffset) AppState.practiceOffset = 0;
    let bank = NANI_G3S1_DATA.practiceBank.filter(p => AppState.practiceFilter === 'all' || p.sectionId === AppState.practiceFilter || p.unitId === AppState.practiceFilter);
    const difficulty = document.getElementById('practice-difficulty')?.value || 'all';
    if (difficulty !== 'all') bank = bank.filter(p => p.level === Number(difficulty));
    AppState.availablePractices = bank;
    const length = document.getElementById('practice-length')?.value || '5';
    const size = length === 'all' ? bank.length : Number(length);
    AppState.filteredPractices = bank.slice(AppState.practiceOffset, AppState.practiceOffset + size);
    AppState.currentPracticeIndex = 0;
    renderCurrentPractice();
  }
  document.addEventListener('practice-filter-change', () => loadPracticesForUnit(elements.practiceUnitSelect.value));
  document.addEventListener('practice-new-session', () => loadPracticesForUnit(elements.practiceUnitSelect.value));
  document.addEventListener('practice-student-change', renderCurrentPractice);

  function renderCurrentPractice() {
    const p = AppState.filteredPractices[AppState.currentPracticeIndex];
    if (!p) {
      elements.practiceQuestionText.textContent = '這個範圍尚無所選難度的題目，請調整難度或練習範圍。';
      elements.practiceOptions.replaceChildren(); elements.practiceFeedback.textContent = '';
      elements.practiceMetaBadge.textContent = '0 題';
      elements.btnPracticePrev.disabled = true; elements.btnPracticeNext.disabled = true;
      return;
    }
    window.LearningRecords?.beginQuestion(p);
    elements.btnPracticePrev.disabled = AppState.currentPracticeIndex === 0;
    elements.btnPracticeNext.disabled = false;
    const unit = NANI_G3S1_DATA.units.find(u => u.id === p.unitId);
    const secTitle = p.sectionTitle || (unit ? unit.title : '');
    const levelLabel = p.level === 1
      ? '<span style="background: rgba(16, 185, 129, 0.25); color: #065f46; padding: 2px 8px; border-radius: 999px; font-weight: 700; margin-left: 6px; font-size: 0.85rem;">🟢 基礎觀念</span>'
      : (p.level === 2
        ? '<span style="background: rgba(245, 158, 11, 0.25); color: #92400e; padding: 2px 8px; border-radius: 999px; font-weight: 700; margin-left: 6px; font-size: 0.85rem;">🟡 熟練運算</span>'
        : '<span style="background: rgba(139, 92, 246, 0.25); color: #5b21b6; padding: 2px 8px; border-radius: 999px; font-weight: 700; margin-left: 6px; font-size: 0.85rem;">🟣 生活應用</span>');

    if (elements.practiceMetaBadge) {
      elements.practiceMetaBadge.innerHTML = `<strong>${secTitle}</strong> ｜ 第 ${AppState.currentPracticeIndex + 1} / ${AppState.filteredPractices.length} 題 ${levelLabel}`;
    }

    if (elements.practiceQuestionText) {
      elements.practiceQuestionText.textContent = p.question;
    }

    if (elements.practiceFeedback) {
      elements.practiceFeedback.className = 'feedback-box';
      elements.practiceFeedback.innerHTML = '';
    }

    if (elements.practiceLadderBox) {
      elements.practiceLadderBox.style.display = 'none';
      elements.practiceLadderBox.innerHTML = '';
      AppState.currentLadderStep = 1;
      ladderAutoPlaying = false;
    }

    if (elements.practiceOptions) {
      elements.practiceOptions.innerHTML = p.options.map((opt, idx) => `
        <button class="option-btn" data-index="${idx}">
          <span class="option-label">(${['A', 'B', 'C', 'D'][idx]})</span>
          <span class="option-text">${opt}</span>
        </button>
      `).join('');

      elements.practiceOptions.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const chosen = parseInt(btn.dataset.index, 10);
          handleAnswer(chosen, p);
        });
      });
    }
  }

  function nextPractice() {
    window.spEdAudio.stopSpeech();
    if (AppState.currentPracticeIndex + 1 < AppState.filteredPractices.length) {
      AppState.currentPracticeIndex++;
      renderCurrentPractice();
      return;
    }
    elements.practiceFeedback.className = 'feedback-box show';
    elements.practiceFeedback.innerHTML = '<strong>本組題目已瀏覽完畢。</strong><p>未作答不會計入觀察，請先看實際紀錄，再決定休息、再教或繼續。</p><button class="btn btn-primary" id="practice-next-group">下一組題目</button>';
    document.getElementById('practice-next-group').onclick = () => {
      const offset = (AppState.practiceOffset || 0) + AppState.filteredPractices.length;
      AppState.practiceOffset = offset < AppState.availablePractices.length ? offset : 0;
      loadPracticesForUnit(AppState.practiceFilter, true);
    };
    elements.practiceFeedback.scrollIntoView({ block: 'nearest' });
  }

  function handleAnswer(chosenIndex, p) {
    const isCorrect = chosenIndex === p.answerIndex;
    const evidence = window.LearningRecords.record(p, isCorrect);
    const allBtns = elements.practiceOptions.querySelectorAll('.option-btn');
    const clickedBtn = elements.practiceOptions.querySelector(`.option-btn[data-index="${chosenIndex}"]`);

    allBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (isCorrect && idx === p.answerIndex) {
        btn.classList.add('selected-correct');
      } else if (idx === chosenIndex) {
        btn.classList.add('selected-wrong');
      }
    });

    if (isCorrect) {
      // 1. 璀璨遊戲機號角交響音效 (Web Audio API)
      if (window.spEdAudio) {
        window.spEdAudio.playCorrect();
      }

      // 2. 代幣星星 +1
      if (evidence.reward) {
        updateStars(1);
        if (evidence.studentId) window.StudentBank?.addStar(Number(evidence.studentId), 1);
      }

      // 3. 聲光刺激：全螢幕五彩紙花 + 金星雨爆發 + 金幣飛行
      if (window.KidEffects) {
        window.KidEffects.triggerConfetti(65, 2400);
        if (clickedBtn) {
          window.KidEffects.flyStarToken(clickedBtn);
        }
      }

      const praise = window.KidEffects ? window.KidEffects.getRandomPraise() : '答對了！太棒了！';

      if (elements.practiceFeedback) {
        elements.practiceFeedback.className = 'feedback-box success show';
        elements.practiceFeedback.innerHTML = `
          <div style="display:flex; align-items:flex-start; gap:12px;">
            <span style="font-size:2.4rem; line-height:1;">🎉</span>
            <div style="flex:1;">
              <strong style="font-size:1.3rem; color:#065f46;">${praise}</strong>
              <div style="margin-top:6px; font-size:1.15rem; color:#047857;">
                ⭐ <strong>${evidence.reward ? '+1 顆星星代幣已入袋！' : '本題已領過星星，重練仍值得肯定。'}</strong>
              </div>
              <p style="margin-top: 6px; font-size:1.05rem; color:#374151;">💡 ${p.hint}</p>
            </div>
          </div>
          <div style="margin-top: 14px; display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
            <button class="kid-btn kid-btn-solution" id="btn-feedback-solution-correct" style="font-size:0.95rem; padding:6px 14px;">
              🔊 聽解題音檔
            </button>
            <button class="kid-btn kid-btn-primary" id="btn-feedback-next-correct" style="font-size:0.95rem; padding:6px 14px;">
              下一題 勇往直前 ➔
            </button>
          </div>
        `;

        const btnCorrectSpeak = document.getElementById('btn-feedback-solution-correct');
        if (btnCorrectSpeak) {
          btnCorrectSpeak.addEventListener('click', () => {
            if (elements.practiceLadderBox) {
              elements.practiceLadderBox.style.display = 'block';
              AppState.currentLadderStep = 1;
              renderPracticeLadder(p, false);
              const autoBtn = document.getElementById('btn-ladder-auto-play');
              if (autoBtn) autoBtn.click();
            } else {
              window.spEdAudio.speak(p.solutionSpeech || p.hint);
            }
          });
        }

        const btnNextCorrect = document.getElementById('btn-feedback-next-correct');
        if (btnNextCorrect) {
          btnNextCorrect.addEventListener('click', () => {
            nextPractice();
          });
        }
      }

      // 4. 活潑元氣的正向讚賞語音
      if (window.spEdAudio) {
        window.spEdAudio.speak(praise);
      }

      // 5. 彈出盛大聲光慶祝彈窗 (300毫秒後登場，兼顧流暢度)
      if (window.KidEffects) {
        setTimeout(() => {
          window.KidEffects.showCelebrationModal({
            title: '答對了！太厲害了！',
            hint: p.hint,
            solutionSpeech: p.solutionSpeech,
            onNext: () => nextPractice()
          });
        }, 320);
      }

    } else {
      window.LearningRecords.markSupport();

      // 特教低焦慮「溫暖抱抱站」，絕無冰冷紅叉與刺眼扣分
      if (window.spEdAudio) {
        window.spEdAudio.playEncouragement();
      }

      const comfort = window.KidEffects ? window.KidEffects.getRandomEncouragement() : '沒關係，我們深呼吸再試一次！';

      if (elements.practiceFeedback) {
        elements.practiceFeedback.className = 'feedback-box encouragement-card show';
        elements.practiceFeedback.innerHTML = `
          <div style="display:flex; align-items:flex-start; gap:14px;">
            <span style="font-size:2.8rem; line-height:1;">🧸</span>
            <div style="flex:1;">
              <strong style="font-size:1.25rem; color:#9a3412;">${comfort}</strong>
              <div style="margin-top: 8px; font-size:1.1rem; color:#475569; background:#ffffff; padding:10px 14px; border-radius:14px; border:2px dashed #fed7aa;">
                💡 <strong>先試這一步：</strong>${window.LearningRecords.strategyPrompt(p)}
              </div>
            </div>
          </div>
          <div style="margin-top: 14px; display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
            <button class="kid-btn kid-btn-secondary" id="btn-practice-retry" style="font-size:0.95rem; padding:8px 16px;">
              🔄 沒關係，我想再試一次！
            </button>
            <button class="kid-btn kid-btn-solution" id="btn-feedback-solution-wrong" style="font-size:0.95rem; padding:8px 16px;">
              🔊 聽完整解題步驟音檔
            </button>
          </div>
        `;

        const btnRetry = document.getElementById('btn-practice-retry');
        if (btnRetry) {
          btnRetry.addEventListener('click', () => {
            // 重新解鎖選項，讓孩子無挫折感自主再次作答
            allBtns.forEach((btn, idx) => {
              if (idx !== chosenIndex) {
                btn.disabled = false;
              }
            });
            if (elements.practiceFeedback) {
              elements.practiceFeedback.className = 'feedback-box';
              elements.practiceFeedback.innerHTML = '';
            }
            if (window.spEdAudio) {
              window.spEdAudio.playClick();
              window.spEdAudio.speak('照著提示，先完成一個步驟再試試看。');
            }
          });
        }

        const btnWrongSpeak = document.getElementById('btn-feedback-solution-wrong');
        if (btnWrongSpeak) {
          btnWrongSpeak.addEventListener('click', () => {
            if (elements.practiceLadderBox) {
              elements.practiceLadderBox.style.display = 'block';
              AppState.currentLadderStep = 1;
              renderPracticeLadder(p, false);
              const autoBtn = document.getElementById('btn-ladder-auto-play');
              if (autoBtn) autoBtn.click();
            } else {
              window.spEdAudio.speak(p.solutionSpeech || p.hint);
            }
          });
        }
      }

      // 語音溫暖播報安慰與提示
      if (window.spEdAudio) {
        window.spEdAudio.speak(comfort + '。' + window.LearningRecords.strategyPrompt(p));
      }
    }
  }

  // 獨立數位教具箱模組 (Sandbox)
  function initSandboxModule() {
    if (!elements.sandboxUnitSelect) return;

    elements.sandboxUnitSelect.innerHTML = NANI_G3S1_DATA.units.map(u => `
      <option value="${u.id}">第 ${u.number} 單元專用教具：${u.title}</option>
    `).join('') + '<option value="number-line">補充教具：數線與加減跳格</option>';

    elements.sandboxUnitSelect.addEventListener('change', (e) => {
      renderSandbox(e.target.value);
    });
  }

  function renderSandbox(unitId) {
    if (!elements.sandboxStage) return;
    if (elements.sandboxUnitSelect) {
      elements.sandboxUnitSelect.value = unitId;
    }
    if (elements.sandboxStage.dataset.unit === unitId) return;
    elements.sandboxStage.dataset.unit = unitId;
    if (unitId === 'number-line') window.NumberLineTool.render('sandbox-stage');
    else mountUnitManipulative(unitId, 'sandbox-stage');
  }

  // IEP 隨堂評量紀錄模組
  function initIepModule() {
    renderClinicDashboard('嘉');
    if (!elements.iepUnitSelect) return;

    elements.iepUnitSelect.innerHTML = NANI_G3S1_DATA.units.map(u => `
      <option value="${u.id}">第 ${u.number} 單元：${u.title} (${u.curriculumCode})</option>
    `).join('');

    if (elements.iepGenerateBtn) {
      elements.iepGenerateBtn.addEventListener('click', generateIepReport);
    }

    if (elements.iepCopyBtn) {
      elements.iepCopyBtn.addEventListener('click', () => {
        if (elements.iepOutput && elements.iepOutput.textContent) {
          navigator.clipboard.writeText(elements.iepOutput.textContent).then(() => {
            elements.iepCopyBtn.textContent = '已複製草稿，請核對實際觀察';
          }).catch(() => { elements.iepCopyBtn.textContent = '複製失敗，請選取草稿手動複製'; });
        }
      });
    }

    if (elements.iepPrintBtn) {
      elements.iepPrintBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  function generateIepReport() {
    const studentName = elements.iepStudentName.value.trim() || '學生A';
    const unitId = elements.iepUnitSelect.value;
    const unit = NANI_G3S1_DATA.units.find(u => u.id === unitId);
    const iepObj = NANI_G3S1_DATA.iepObjectives?.find(o => o.unitId === unitId);
    const supportLevel = elements.iepSupportLevel.value;
    const notes = elements.iepTeacherNotes.value.trim();
    const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const promptLevelName = AppState.promptLevel === 1 ? 'Level 1: 全鷹架模式（全彩位值定錨與完整支持）' :
                            (AppState.promptLevel === 2 ? 'Level 2: 半鷹架消褪（去除強烈色彩，保留骨架）' : 'Level 3: 無鷹架獨立模式（模擬普通班段考試卷純淨黑白格式）');

    const specialNeedsDetails = unit.specialNeedsCodes.map(code => {
      const info = getSpecialNeedsDetail(code);
      return `  ● 【${info.code}】${info.title}（${info.desc}）`;
    }).join('\n');

    const reportText = `【數學領域評量草稿｜需經教師核對】
此草稿包含教學計畫與參考目標；不是自動診斷或達標證明。
評量日期：${today}
學生姓名／代號：${studentName}
普通教材版本：南一版 國小數學三年級上學期（108課綱普通數學：${unit.curriculumCode}）
評量單元：第 ${unit.number} 單元【${unit.title}】

一、課綱對照與參考教學目標（非本次達成結果）：
1. 普通教育數學領域學習條目：${unit.curriculumCode} ${unit.curriculumDesc}
2. 特殊需求領域課綱指標（學習策略／生活管理）：
${specialNeedsDetails}
3. IEP 單元長期目標：${iepObj ? iepObj.goal : '能掌握單元核心數學概念並運用於生活中。'}
4. 評量效標 (Criteria)：${iepObj ? iepObj.criteria : '待教師設定題數、正確題數與允許支持。'}

二、課程調整四向度建議（實際採用項目由教師確認）：
1. 學習內容調整：${unit.accommodations.content}
2. 學習歷程調整：${unit.accommodations.process}
3. 學習環境調整：${unit.accommodations.environment}
4. 學習評量調整：${unit.accommodations.assessment}

三、先備能力診斷、迷思除錯與提示消褪進程：
● 先備能力回溯狀態：【${unit.prerequisite.grade} ${unit.prerequisite.unitCode} ${unit.prerequisite.title}】；是否完成檢核：尚待教師確認。
● 建議觀察的迷思：「${unit.misconception.name}」；是否出現及改善：尚待教師觀察。
● 畫面設定的提示層級（不代表學生達成）：【${promptLevelName}】
● 所需支持層級：【${supportLevel}】

四、課堂微步驟鷹架引導表現：
● 步驟化工作分析 (Task Analysis) 完成進程：
  - 尚待教師確認：是否能操作、口述、換題後獨立完成。
● C-R-A 教學參考（實際表現需另記）：
  - 具體操作 (Concrete)：${unit.cra.concrete}
  - 圖像表徵 (Representational)：${unit.cra.representational}
  - 抽象運算 (Abstract)：${unit.cra.abstract}

五、可核對的本回合作答證據：
${window.LearningRecords.report(unitId)}

六、教師質性觀察與後續調整：
${notes ? notes : '未填寫教師觀察，不推定進步、精熟或提示消褪成效。'}

七、親師溝通參考：
在家中可維持生活情境實踐任務，透過真實貨幣與容量容器進行對話，促進概念類化。`;

    if (elements.iepOutput) {
      elements.iepOutput.textContent = reportText;
    }
    window.spEdAudio.playCorrect();
  }

  // 備課手冊表格生成
  function initGuideModule() {
    const guideContainer = document.getElementById('guide-unit-table-body');
    if (!guideContainer) return;

    guideContainer.innerHTML = NANI_G3S1_DATA.units.map(u => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 12px; font-weight: 800;">第 ${u.number} 單元</td>
        <td style="padding: 12px; font-weight: 700; color: var(--primary);">
          ${u.title}
          <div style="font-size: 0.8rem; color: #166534; margin-top: 4px;"><strong>先備：</strong>${u.prerequisite.grade} ${u.prerequisite.unitCode}</div>
          <div style="font-size: 0.8rem; color: #9f1239; margin-top: 2px;"><strong>迷思：</strong>${u.misconception.name}</div>
        </td>
        <td style="padding: 12px; font-family: monospace; font-size: 0.85rem;">
          <div><strong>普數：</strong>${u.curriculumCode}</div>
          <div style="color: #4f46e5; margin-top: 4px;"><strong>特需：</strong>${u.specialNeedsCodes.join(', ')}</div>
        </td>
        <td style="padding: 12px; font-size: 0.85rem;">
          <div style="margin-bottom: 4px;"><strong>內容：</strong>${u.accommodations.content}</div>
          <div style="margin-bottom: 4px;"><strong>歷程：</strong>${u.accommodations.process}</div>
          <div style="margin-bottom: 4px;"><strong>環境：</strong>${u.accommodations.environment}</div>
          <div><strong>評量：</strong>${u.accommodations.assessment}</div>
        </td>
        <td style="padding: 12px; font-size: 0.82rem;">
          <div style="color: #b91c1c; margin-bottom: 3px;"><strong>學障：</strong>${u.specialEdTips.sld}</div>
          <div style="color: #4338ca; margin-bottom: 3px;"><strong>自閉：</strong>${u.specialEdTips.asd}</div>
          <div style="color: #b45309;"><strong>智障：</strong>${u.specialEdTips.id}</div>
        </td>
      </tr>
    `).join('');
  }

  // 啟動各模組
  initHeaderTools();
  initTabNavigation();
  initUnitView();
  initPracticeModule();
  initSandboxModule();
  initIepModule();
  initGuideModule();
});
