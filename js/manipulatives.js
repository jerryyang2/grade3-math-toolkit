/**
 * 特教資源班 9 大單元專用互動教具模組 (Manipulatives Engine)
 * 具備 C-R-A 結構，支援觸控、高對比、大按鈕與即時反饋
 */

const Manipulatives = {
  // 1. 單元一：錢幣與位值積木操作台
  renderU1Money(containerId) {
    window.PlaceValueLab.mount(containerId);
  },

  // 2. 單元二：四位數直式對齊與邊講邊算引導（特教逐步講解與動態揭示系統）
  renderU2Vertical(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let op = '+';
    let num1 = 1485;
    let num2 = 2378;
    let currentStep = 0; // 0: 準備, 1: 個位, 2: 十位, 3: 百位, 4: 千位完成

    // 加法模型計算
    function getAdditionModel(n1, n2) {
      const s1 = String(n1).padStart(4, '0');
      const s2 = String(n2).padStart(4, '0');
      const d1 = s1.split('').map(Number);
      const d2 = s2.split('').map(Number);

      const o_sum = d1[3] + d2[3];
      const o_res = o_sum % 10;
      const carry_t = Math.floor(o_sum / 10);

      const t_sum = d1[2] + d2[2] + carry_t;
      const t_res = t_sum % 10;
      const carry_h = Math.floor(t_sum / 10);

      const h_sum = d1[1] + d2[1] + carry_h;
      const h_res = h_sum % 10;
      const carry_th = Math.floor(h_sum / 10);

      const th_sum = d1[0] + d2[0] + carry_th;
      const th_res = th_sum;

      const carries = [carry_th, carry_h, carry_t, 0];
      const resDigits = [th_res, h_res, t_res, o_res];

      const stepTitles = [
        '💡 準備步驟：觀察直式排版',
        '👉 第 1 步：計算個位',
        '👉 第 2 步：計算十位',
        '👉 第 3 步：計算百位',
        '🎉 第 4 步：計算千位（完整答案揭曉）'
      ];

      const stepExpl = [
        `四位數直式對齊好囉！被加數是 ${n1}，加數是 ${n2}。依照千紅、百藍、十綠、個橘對齊。請點擊「算個位」開始計算！`,
        `先算最右邊的個位：個位 ${d1[3]} ＋ ${d2[3]} ＝ ${o_sum}。在個位寫下 ${o_res}${carry_t > 0 ? '，向十位進 1' : ''}！`,
        `再算十位：十位 ${d1[2]} ＋ ${d2[2]}${carry_t > 0 ? ` ＋ 進位的 ${carry_t}` : ''} ＝ ${t_sum}。十位寫下 ${t_res}${carry_h > 0 ? '，向百位進 1' : ''}！`,
        `接著算百位：百位 ${d1[1]} ＋ ${d2[1]}${carry_h > 0 ? ` ＋ 進位的 ${carry_h}` : ''} ＝ ${h_sum}。百位寫下 ${h_res}${carry_th > 0 ? '，向千位進 1' : ''}！`,
        `最後算千位：千位 ${d1[0]} ＋ ${d2[0]}${carry_th > 0 ? ` ＋ 進位的 ${carry_th}` : ''} ＝ ${th_sum}。千位寫下 ${th_res}！大功告成，答案是 ${n1 + n2}！`
      ];

      return { d1, d2, carries, resDigits, stepTitles, stepExpl, result: n1 + n2 };
    }

    // 減法借位模型計算
    function getSubtractionModel(n1, n2) {
      if (n1 < n2) [n1, n2] = [n2, n1];
      const s1 = String(n1).padStart(4, '0');
      const s2 = String(n2).padStart(4, '0');
      const d1 = s1.split('').map(Number);
      const d2 = s2.split('').map(Number);

      const curD1 = [...d1];
      const borrowDisplay = ['', '', '', ''];
      const resDigits = [0, 0, 0, 0];
      const stepExpl = [];

      stepExpl[0] = `四位數減法直式對齊好囉！被減數是 ${n1}，減數是 ${n2}。我們從最右邊的個位開始減起！`;

      // 個位
      if (curD1[3] < d2[3]) {
        let bIdx = 2;
        while (bIdx >= 0 && curD1[bIdx] === 0) bIdx--;
        curD1[bIdx]--;
        for (let i = bIdx + 1; i < 3; i++) {
          curD1[i] = 9;
          borrowDisplay[i] = '9';
        }
        curD1[3] += 10;
        borrowDisplay[3] = '10';
        borrowDisplay[bIdx] = String(curD1[bIdx]);
        resDigits[3] = curD1[3] - d2[3];
        stepExpl[1] = `第 1 步【個位】：個位 ${d1[3]} 不夠減 ${d2[3]}，向前借位。個位變成 ${curD1[3]}，${curD1[3]} 減 ${d2[3]} ＝ ${resDigits[3]}。個位寫 ${resDigits[3]}！`;
      } else {
        resDigits[3] = curD1[3] - d2[3];
        stepExpl[1] = `第 1 步【個位】：個位 ${curD1[3]} 減 ${d2[3]} ＝ ${resDigits[3]}。個位寫 ${resDigits[3]}！`;
      }

      // 十位
      if (curD1[2] < d2[2]) {
        let bIdx = 1;
        while (bIdx >= 0 && curD1[bIdx] === 0) bIdx--;
        curD1[bIdx]--;
        for (let i = bIdx + 1; i < 2; i++) {
          curD1[i] = 9;
          borrowDisplay[i] = '9';
        }
        curD1[2] += 10;
        borrowDisplay[2] = String(curD1[2]);
        borrowDisplay[bIdx] = String(curD1[bIdx]);
        resDigits[2] = curD1[2] - d2[2];
        stepExpl[2] = `第 2 步【十位】：十位退位後剩 ${curD1[2] - 10} 不夠減 ${d2[2]}，向百位借 1 當 10，十位變成 ${curD1[2]}。減去 ${d2[2]} ＝ ${resDigits[2]}。十位寫 ${resDigits[2]}！`;
      } else {
        resDigits[2] = curD1[2] - d2[2];
        stepExpl[2] = `第 2 步【十位】：十位 ${curD1[2]} 減 ${d2[2]} ＝ ${resDigits[2]}。十位寫 ${resDigits[2]}！`;
      }

      // 百位
      if (curD1[1] < d2[1]) {
        curD1[0]--;
        curD1[1] += 10;
        borrowDisplay[1] = String(curD1[1]);
        borrowDisplay[0] = String(curD1[0]);
        resDigits[1] = curD1[1] - d2[1];
        stepExpl[3] = `第 3 步【百位】：百位借位後剩 ${curD1[1] - 10} 不夠減 ${d2[1]}，向千位借 1 當 10。百位變成 ${curD1[1]}，減去 ${d2[1]} ＝ ${resDigits[1]}。百位寫 ${resDigits[1]}！`;
      } else {
        resDigits[1] = curD1[1] - d2[1];
        stepExpl[3] = `第 3 步【百位】：百位 ${curD1[1]} 減 ${d2[1]} ＝ ${resDigits[1]}。百位寫 ${resDigits[1]}！`;
      }

      // 千位
      resDigits[0] = curD1[0] - d2[0];
      stepExpl[4] = `第 4 步【千位】：千位剩下 ${curD1[0]} 減 ${d2[0]} ＝ ${resDigits[0]}。千位寫 ${resDigits[0]}！完整答案是 ${n1 - n2}！`;

      const stepTitles = [
        '💡 準備步驟：觀察直式排版',
        '👉 第 1 步：個位借位與計算',
        '👉 第 2 步：十位借位與計算',
        '👉 第 3 步：百位借位與計算',
        '🎉 第 4 步：千位計算（完整答案揭曉）'
      ];

      return { d1, d2, borrowDisplay, resDigits, stepTitles, stepExpl, result: n1 - n2 };
    }

    function update(autoSpeak = false) {
      const model = op === '+' ? getAdditionModel(num1, num2) : getSubtractionModel(num1, num2);
      const { d1, d2, resDigits, stepTitles, stepExpl } = model;
      const currentExpl = stepExpl[currentStep];

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>📐 四位數直式對齊與邊講邊算引導</h4>
            <div class="view-toggles">
              <button class="btn btn-sm ${op === '+' ? 'btn-primary' : 'btn-outline'}" id="${cid}-u2-op-add">➕ 四位數加法 (進位)</button>
              <button class="btn btn-sm ${op === '-' ? 'btn-primary' : 'btn-outline'}" id="${cid}-u2-op-sub">➖ 四位數減法 (借位)</button>
            </div>
          </div>

          <!-- 逐步引導膠囊進度列 -->
          <div class="step-progress-pills">
            <span class="step-pill ${currentStep === 0 ? 'current' : (currentStep > 0 ? 'completed' : '')}">0. 觀察題目</span>
            <span class="step-pill ${currentStep === 1 ? 'current' : (currentStep > 1 ? 'completed' : '')}">1. 個位</span>
            <span class="step-pill ${currentStep === 2 ? 'current' : (currentStep > 2 ? 'completed' : '')}">2. 十位</span>
            <span class="step-pill ${currentStep === 3 ? 'current' : (currentStep > 3 ? 'completed' : '')}">3. 百位</span>
            <span class="step-pill ${currentStep === 4 ? 'current' : ''}">4. 千位大功告成</span>
          </div>

          <!-- 當前步驟解說卡（邊講邊顯示） -->
          <div class="step-guide-card">
            <div class="step-guide-title">
              <span>${stepTitles[currentStep]}</span>
              <button class="kid-btn kid-btn-solution" id="${cid}-u2-speech-calc" style="font-size:0.85rem; padding:4px 10px;">
                🔊 聽此步講解
              </button>
            </div>
            <div class="step-guide-instruction">
              👉 ${currentExpl}
            </div>
          </div>

          <!-- 模擬直式板 -->
          <div class="vertical-math-board">
            <!-- 位值標題 -->
            <div class="vm-row vm-header">
              <div class="vm-col"></div>
              <div class="vm-col pv-thousand ${currentStep === 4 ? 'active-column' : ''}">千</div>
              <div class="vm-col pv-hundred ${currentStep === 3 ? 'active-column' : ''}">百</div>
              <div class="vm-col pv-ten ${currentStep === 2 ? 'active-column' : ''}">十</div>
              <div class="vm-col pv-one ${currentStep === 1 ? 'active-column' : ''}">個</div>
            </div>

            <!-- 進位/借位指示行 (動態按步驟顯現，絕不一開始全部曝光) -->
            ${op === '+' ? `
              <div class="vm-row vm-carries">
                <div class="vm-col"></div>
                <div class="vm-col">${currentStep >= 4 && model.carries[0] > 0 ? `<span class="carry-bubble revealed">+${model.carries[0]}</span>` : ''}</div>
                <div class="vm-col">${currentStep >= 3 && model.carries[1] > 0 ? `<span class="carry-bubble revealed">+${model.carries[1]}</span>` : ''}</div>
                <div class="vm-col">${currentStep >= 2 && model.carries[2] > 0 ? `<span class="carry-bubble revealed">+${model.carries[2]}</span>` : ''}</div>
                <div class="vm-col"></div>
              </div>
            ` : `
              <div class="vm-row vm-borrows">
                <div class="vm-col"></div>
                <div class="vm-col">${currentStep >= 4 && model.borrowDisplay[0] ? `<span class="borrow-bubble revealed">${model.borrowDisplay[0]}</span>` : ''}</div>
                <div class="vm-col">${currentStep >= 3 && model.borrowDisplay[1] ? `<span class="borrow-bubble revealed">${model.borrowDisplay[1]}</span>` : ''}</div>
                <div class="vm-col">${currentStep >= 2 && model.borrowDisplay[2] ? `<span class="borrow-bubble revealed">${model.borrowDisplay[2]}</span>` : ''}</div>
                <div class="vm-col">${currentStep >= 1 && model.borrowDisplay[3] ? `<span class="borrow-bubble revealed">${model.borrowDisplay[3]}</span>` : ''}</div>
              </div>
            `}

            <!-- 被加數 / 被減數 -->
            <div class="vm-row vm-number">
              <div class="vm-col"></div>
              <div class="vm-col pv-thousand ${currentStep === 4 ? 'active-column' : ''}">${d1[0]}</div>
              <div class="vm-col pv-hundred ${currentStep === 3 ? 'active-column' : ''}">${d1[1]}</div>
              <div class="vm-col pv-ten ${currentStep === 2 ? 'active-column' : ''}">${d1[2]}</div>
              <div class="vm-col pv-one ${currentStep === 1 ? 'active-column' : ''}">${d1[3]}</div>
            </div>

            <!-- 運算子與加數 / 減數 -->
            <div class="vm-row vm-number vm-bottom-border">
              <div class="vm-col vm-operator">${op}</div>
              <div class="vm-col pv-thousand ${currentStep === 4 ? 'active-column' : ''}">${d2[0]}</div>
              <div class="vm-col pv-hundred ${currentStep === 3 ? 'active-column' : ''}">${d2[1]}</div>
              <div class="vm-col pv-ten ${currentStep === 2 ? 'active-column' : ''}">${d2[2]}</div>
              <div class="vm-col pv-one ${currentStep === 1 ? 'active-column' : ''}">${d2[3]}</div>
            </div>

            <!-- 答案橫線下：依據當前步驟逐位顯現！未算到的位數以 ? 佔位 -->
            <div class="vm-row vm-result">
              <div class="vm-col vm-eq">=</div>
              <div class="vm-col pv-thousand">
                ${currentStep >= 4 ? `<span class="vm-res-revealed pv-thousand">${resDigits[0]}</span>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
              <div class="vm-col pv-hundred">
                ${currentStep >= 3 ? `<span class="vm-res-revealed pv-hundred">${resDigits[1]}</span>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
              <div class="vm-col pv-ten">
                ${currentStep >= 2 ? `<span class="vm-res-revealed pv-ten">${resDigits[2]}</span>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
              <div class="vm-col pv-one">
                ${currentStep >= 1 ? `<span class="vm-res-revealed pv-one">${resDigits[3]}</span>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
            </div>
          </div>

          <!-- 控制操作面板：邊講邊顯示核心控制器 -->
          <div class="regroup-actions mt-3" style="justify-content: center;">
            ${currentStep < 4 ? `
              <button class="kid-btn kid-btn-primary" id="${cid}-u2-step-next" style="font-size:1.05rem;">
                ▶ ${['算個位', '算十位', '算百位', '算千位'][currentStep]}（下一步）
              </button>
            ` : `
              <button class="kid-btn kid-btn-primary" id="${cid}-u2-step-restart" style="font-size:1.05rem;">
                🔄 重新一步步算
              </button>
            `}
            <button class="kid-btn kid-btn-secondary" id="${cid}-u2-step-prev" ${currentStep === 0 ? 'disabled' : ''}>
              ◀ 上一步
            </button>
            <button class="kid-btn kid-btn-solution" id="${cid}-u2-step-showall">
              👁️ 顯示全部答案
            </button>
            <button class="kid-btn kid-btn-secondary" id="${cid}-u2-random-problem">
              🎲 換一題範例
            </button>
          </div>
        </div>
      `;

      // 綁定事件
      const nextBtn = $('u2-step-next');
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (currentStep < 4) {
            currentStep++;
            window.spEdAudio.playClick();
            update(true);
            if (currentStep === 4) {
              window.spEdAudio.playCorrect();
              if (window.KidEffects) window.KidEffects.triggerConfetti(50, 1800);
            }
          }
        };
      }

      const restartBtn = $('u2-step-restart');
      if (restartBtn) {
        restartBtn.onclick = () => {
          currentStep = 0;
          window.spEdAudio.playClick();
          update(true);
        };
      }

      const prevBtn = $('u2-step-prev');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (currentStep > 0) {
            currentStep--;
            window.spEdAudio.playClick();
            update(true);
          }
        };
      }

      const showAllBtn = $('u2-step-showall');
      if (showAllBtn) {
        showAllBtn.onclick = () => {
          currentStep = 4;
          window.spEdAudio.playClick();
          update(true);
          window.spEdAudio.playCorrect();
        };
      }

      $('u2-op-add').onclick = () => {
        op = '+';
        num1 = 1485;
        num2 = 2378;
        currentStep = 0;
        update(false);
      };

      $('u2-op-sub').onclick = () => {
        op = '-';
        num1 = 3000;
        num2 = 1465;
        currentStep = 0;
        update(false);
      };

      $('u2-speech-calc').onclick = () => {
        window.spEdAudio.speak(currentExpl);
      };

      $('u2-random-problem').onclick = () => {
        if (op === '+') {
          num1 = Math.floor(Math.random() * 4000) + 1200;
          num2 = Math.floor(Math.random() * 4000) + 1200;
        } else {
          num1 = Math.floor(Math.random() * 3000) + 4000;
          num2 = Math.floor(Math.random() * 3000) + 1000;
        }
        currentStep = 0;
        window.spEdAudio.playClick();
        update(false);
      };

      if (autoSpeak) {
        window.spEdAudio.speak(currentExpl);
      }
    }

    update(false);
  },

  // 3. 單元三：乘法面積分割器與九九乘法輔助輪（邊講邊揭示步驟化教學）
  renderU3Multiplication(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let tensNum = 2; // 20
    let onesNum = 4; // 4 -> 24
    let multiplier = 3; // x 3
    let currentStep = 0; // 0: 準備, 1: 算十位, 2: 算個位, 3: 兩部分合體加總

    function update(autoSpeak = false) {
      const totalNum = tensNum * 10 + onesNum;
      const part1 = tensNum * 10 * multiplier;
      const part2 = onesNum * multiplier;
      const total = totalNum * multiplier;

      const stepInfos = [
        {
          title: "👀 步驟 0：觀察題目準備",
          instruction: `我們要計算「${totalNum} × ${multiplier}」。先把「${totalNum}」拆解為十位「${tensNum * 10}」與個位「${onesNum}」。點擊下方「▶ 算十位積木」，我們一步步邊講邊揭示答案！`,
          speech: `我們要計算 ${totalNum} 乘以 ${multiplier}。先把 ${totalNum} 拆解成十位 ${tensNum * 10} 和個位 ${onesNum}。點擊下一步開始計算！`
        },
        {
          title: "🟦 步驟 1：先算十位積木塊",
          instruction: `第一步：計算左邊藍色十位積木！${tensNum * 10} × ${multiplier} ＝ <strong style="color:#2563eb; font-size:1.3rem;">${part1}</strong>（也就是 ${tensNum} 個十乘以 ${multiplier}，得到 ${tensNum * multiplier} 個十）。`,
          speech: `第一步，先算十位積木塊。${tensNum * 10} 乘以 ${multiplier} 等於 ${part1}。`
        },
        {
          title: "🟨 步驟 2：再算個位小積木",
          instruction: `第二步：計算右邊黃色個位小塊！${onesNum} × ${multiplier} ＝ <strong style="color:#d97706; font-size:1.3rem;">${part2}</strong>（運用九九乘法表秒算！）。`,
          speech: `第二步，再算個位小塊。${onesNum} 乘以 ${multiplier} 等於 ${part2}。`
        },
        {
          title: "🎉 步驟 3：兩部分合體相加！",
          instruction: `第三步：把十位乘積與個位乘積加起來！${part1} ＋ ${part2} ＝ <strong style="color:#059669; font-size:1.4rem;">${total}</strong>！乘法算式完成！`,
          speech: `第三步，把兩部分合體加起來。${part1} 加 ${part2} 等於 ${total}。算式大功告成，答對了！`
        }
      ];

      const currentExpl = stepInfos[currentStep].speech;

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>✖️ 乘法矩形面積模型（步驟拆解教學）</h4>
            <div class="badge-tag">
              算式：${totalNum} × ${multiplier} ＝ 
              ${currentStep >= 3 ? `<span class="vm-res-revealed" style="font-size:1.15rem; color:#059669;">${total}</span>` : `<span class="vm-res-placeholder" style="font-size:1.15rem;">?</span>`}
            </div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>自閉症與學障視覺鷹架</strong>：把「${totalNum}」拆成「${tensNum * 10}（十位）」和「${onesNum}（個位）」，邊講解邊揭示每一塊的乘積，最後再合體！
          </p>

          <!-- 步驟進度標籤 (Step Progress Pills) -->
          <div class="step-progress-pills">
            <span class="step-pill ${currentStep === 0 ? 'current' : 'completed'}">0. 觀察題目</span>
            <span class="step-pill ${currentStep === 1 ? 'current' : (currentStep > 1 ? 'completed' : '')}">1. 算十位 (${tensNum * 10}×${multiplier})</span>
            <span class="step-pill ${currentStep === 2 ? 'current' : (currentStep > 2 ? 'completed' : '')}">2. 算個位 (${onesNum}×${multiplier})</span>
            <span class="step-pill ${currentStep === 3 ? 'current completed' : ''}">3. 加總大功告成</span>
          </div>

          <!-- 邊講邊算引導卡片 (Step Guide Card) -->
          <div class="step-guide-card">
            <div class="step-guide-title">
              <span>${stepInfos[currentStep].title}</span>
              <button class="btn btn-sm btn-speech" id="${cid}-u3-speech-calc">
                🔊 聽本步驟解說
              </button>
            </div>
            <div class="step-guide-instruction">
              ${stepInfos[currentStep].instruction}
            </div>
          </div>

          <!-- 視覺拆解面積矩形：未揭示步驟時以問號佔位，邊講邊揭示！ -->
          <div class="multiplication-area-box" style="transition: all 0.3s;">
            <div class="area-block block-tens ${currentStep === 1 ? 'active-column' : ''}" style="flex: ${tensNum * 10}; position: relative;">
              <div class="area-desc" style="font-weight: 800;">十位積木塊 (${tensNum * 10} × ${multiplier})</div>
              <div class="area-calc" style="font-size: 1.25rem; margin-top: 6px;">
                ${tensNum * 10} × ${multiplier} = 
                ${currentStep >= 1 ? `<strong class="vm-res-revealed" style="color: #1e40af;">${part1}</strong>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
            </div>
            <div class="area-block block-ones ${currentStep === 2 ? 'active-column' : ''}" style="flex: ${Math.max(onesNum * 3, 15)}; position: relative;">
              <div class="area-desc" style="font-weight: 800;">個位小塊 (${onesNum} × ${multiplier})</div>
              <div class="area-calc" style="font-size: 1.25rem; margin-top: 6px;">
                ${onesNum} × ${multiplier} = 
                ${currentStep >= 2 ? `<strong class="vm-res-revealed" style="color: #b45309;">${part2}</strong>` : `<span class="vm-res-placeholder">?</span>`}
              </div>
            </div>
          </div>

          <!-- 整合結果：未到第3步時隱藏答案 -->
          <div class="multiplication-sum-bar ${currentStep === 3 ? 'active-column' : ''}" style="display:flex; justify-content:center; align-items:center; gap:8px;">
            <span>把兩部分加起來：</span>
            ${currentStep >= 3 ? `
              <span class="vm-res-revealed" style="font-size: 1.35rem; color:#065f46;">
                ${part1} ＋ ${part2} ＝ <strong class="highlight-number">${total}</strong>
              </span>
            ` : `
              <span style="color:#64748b; font-size:1.15rem;">
                ${currentStep >= 1 ? part1 : '?'} ＋ ${currentStep >= 2 ? part2 : '?'} ＝ <span class="vm-res-placeholder" style="font-size:1.4rem;">?</span>
              </span>
            `}
          </div>

          <!-- 控制操作面板：邊講邊顯示控制器 -->
          <div class="regroup-actions mt-3" style="justify-content: center; display:flex; gap:10px; flex-wrap:wrap;">
            ${currentStep < 3 ? `
              <button class="kid-btn kid-btn-primary" id="${cid}-u3-step-next" style="font-size:1.05rem;">
                ▶ ${['算十位積木', '算個位小塊', '合體加總結算'][currentStep]}（下一步）
              </button>
            ` : `
              <button class="kid-btn kid-btn-primary" id="${cid}-u3-step-restart" style="font-size:1.05rem;">
                🔄 重新一步步算
              </button>
            `}
            <button class="kid-btn kid-btn-secondary" id="${cid}-u3-step-prev" ${currentStep === 0 ? 'disabled' : ''}>
              ◀ 上一步
            </button>
            <button class="kid-btn kid-btn-solution" id="${cid}-u3-step-showall">
              👁️ 顯示全部答案
            </button>
            <button class="kid-btn kid-btn-secondary" id="${cid}-u3-random-problem">
              🎲 換一題範例
            </button>
          </div>

          <!-- 調整器 -->
          <div class="manipulative-control-panel mt-3">
            <div class="control-row">
              <label>被乘數十位 (${tensNum * 10})：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-tens-minus">－</button>
              <span class="val-display">${tensNum}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-tens-plus">＋</button>
            </div>
            <div class="control-row">
              <label>被乘數個位 (${onesNum})：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-ones-minus">－</button>
              <span class="val-display">${onesNum}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-ones-plus">＋</button>
            </div>
            <div class="control-row">
              <label>乘以幾倍 (${multiplier})：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-mul-minus">－</button>
              <span class="val-display">${multiplier}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-mul-plus">＋</button>
            </div>
          </div>

          <!-- 九九乘法記憶支援小鍵盤 -->
          <div class="quick-times-helper">
            <span class="helper-label">九九乘法快查：</span>
            ${[2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn btn-xs btn-chip" data-n="${n}">${n}的乘法</button>`).join('')}
            <div id="${cid}-u3-times-info" class="times-info-text">點擊上方看口訣</div>
          </div>
        </div>
      `;

      // 綁定事件
      const nextBtn = $('u3-step-next');
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (currentStep < 3) {
            currentStep++;
            window.spEdAudio.playClick();
            update(true);
            if (currentStep === 3) {
              window.spEdAudio.playCorrect();
              if (window.KidEffects) window.KidEffects.triggerConfetti(50, 1800);
            }
          }
        };
      }

      const restartBtn = $('u3-step-restart');
      if (restartBtn) {
        restartBtn.onclick = () => {
          currentStep = 0;
          window.spEdAudio.playClick();
          update(true);
        };
      }

      const prevBtn = $('u3-step-prev');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (currentStep > 0) {
            currentStep--;
            window.spEdAudio.playClick();
            update(true);
          }
        };
      }

      const showAllBtn = $('u3-step-showall');
      if (showAllBtn) {
        showAllBtn.onclick = () => {
          currentStep = 3;
          window.spEdAudio.playClick();
          update(true);
          window.spEdAudio.playCorrect();
        };
      }

      const randomBtn = $('u3-random-problem');
      if (randomBtn) {
        randomBtn.onclick = () => {
          tensNum = Math.floor(Math.random() * 5) + 1; // 1~5
          onesNum = Math.floor(Math.random() * 9) + 1; // 1~9
          multiplier = Math.floor(Math.random() * 7) + 2; // 2~8
          currentStep = 0;
          window.spEdAudio.playClick();
          update(false);
        };
      }

      const speechCalcBtn = $('u3-speech-calc');
      if (speechCalcBtn) {
        speechCalcBtn.onclick = () => {
          window.spEdAudio.speak(currentExpl);
        };
      }

      $('u3-tens-plus').onclick = () => { if (tensNum < 6) { tensNum++; currentStep = 0; update(false); } };
      $('u3-tens-minus').onclick = () => { if (tensNum > 1) { tensNum--; currentStep = 0; update(false); } };
      $('u3-ones-plus').onclick = () => { if (onesNum < 9) { onesNum++; currentStep = 0; update(false); } };
      $('u3-ones-minus').onclick = () => { if (onesNum > 0) { onesNum--; currentStep = 0; update(false); } };
      $('u3-mul-plus').onclick = () => { if (multiplier < 9) { multiplier++; currentStep = 0; update(false); } };
      $('u3-mul-minus').onclick = () => { if (multiplier > 2) { multiplier--; currentStep = 0; update(false); } };

      el.querySelectorAll('.btn-chip').forEach(btn => {
        btn.onclick = () => {
          const n = Number(btn.dataset.n);
          const rhymes = Array.from({ length: 9 }, (_, i) => `${n}×${i+1}=${n*(i+1)}`).join('、');
          $('u3-times-info').innerHTML = `<strong>${n} 的乘法：</strong>${rhymes}`;
          window.spEdAudio.speak(`${n}的乘法：${rhymes}`);
        };
      });

      if (autoSpeak) {
        window.spEdAudio.speak(currentExpl);
      }
    }

    update(false);
  },

  // 4. 單元四：超大放大鏡毫米與公分直尺測量台
  renderU4Ruler(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let targetLengthMm = 68; // 6 公分 8 毫米
    let items = [
      { name: "鉛筆", mm: 75, icon: "✏️" },
      { name: "橡皮擦", mm: 42, icon: "🧼" },
      { name: "迴紋針", mm: 28, icon: "📎" },
      { name: "彩色奇異筆", mm: 115, icon: "🖊️" }
    ];
    let selectedItem = items[0];

    function update() {
      const cm = Math.floor(selectedItem.mm / 10);
      const mm = selectedItem.mm % 10;

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>📏 毫米超大放大鏡直尺測量台</h4>
            <div class="view-toggles">
              ${items.map(it => `
                <button class="btn btn-sm ${it.name === selectedItem.name ? 'btn-primary' : 'btn-outline'}" data-item="${it.name}">
                  ${it.icon} ${it.name}
                </button>
              `).join('')}
            </div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>學障與視知覺鷹架</strong>：尺上的「0 刻度」一定要對齊物品的最左邊！1 公分裡面有 10 個小格子，每小格就是 1 毫米 (mm)！這是放大示意圖，請勿拿螢幕直接量實物。
          </p>

          <!-- 模擬直尺視圖 -->
          <div class="ruler-workspace">
            <!-- 測量物品模擬 -->
            <div class="measure-target-item" style="width: ${selectedItem.mm * 4}px;">
              <span class="item-icon">${selectedItem.icon}</span>
              <span class="item-name">${selectedItem.name}</span>
            </div>

            <!-- 實體直尺刻度 (SVG) -->
            <div class="ruler-svg-container">
              <svg width="600" height="90" viewBox="0 0 600 90" class="interactive-ruler">
                <!-- 尺身 -->
                <rect x="0" y="0" width="600" height="85" rx="6" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/>
                <!-- 刻度 0 到 14 公分 (每公分 40px, 1mm = 4px) -->
                ${Array.from({ length: 141 }, (_, i) => {
                  const x = 20 + i * 4;
                  const isCm = i % 10 === 0;
                  const is5Mm = i % 5 === 0 && !isCm;
                  const h = isCm ? 36 : (is5Mm ? 24 : 14);
                  const color = isCm ? '#0F172A' : (is5Mm ? '#2563EB' : '#94A3B8');
                  return `
                    <line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${color}" stroke-width="${isCm ? 2.5 : 1.2}"/>
                    ${isCm ? `<text x="${x}" y="56" font-size="14" font-weight="bold" fill="#0F172A" text-anchor="middle">${i/10}</text>` : ''}
                  `;
                }).join('')}
                <text x="580" y="76" font-size="12" fill="#64748B" text-anchor="end">單位: cm</text>
              </svg>
            </div>
          </div>

          <!-- 超大放大鏡讀數儀 -->
          <div class="magnifier-readout-card">
            <div class="mag-lens-icon">🔍 放大鏡讀數：</div>
            <div class="mag-result">
              剛好指在：<strong>${cm}</strong> 公分又 <strong>${mm}</strong> 毫米
            </div>
            <div class="mag-equal">
              ＝ 換算成全部毫米是：<strong class="highlight-number">${selectedItem.mm}</strong> 毫米 (mm)
            </div>
            <button class="btn btn-speech" id="${cid}-u4-speech-btn">🔊 語音念出長度</button>
          </div>
        </div>
      `;

      el.querySelectorAll('[data-item]').forEach(btn => {
        btn.onclick = () => {
          const found = items.find(it => it.name === btn.dataset.item);
          if (found) {
            selectedItem = found;
            window.spEdAudio.playClick();
            update();
          }
        };
      });

      $('u4-speech-btn').onclick = () => {
        const text = `${selectedItem.name}的長度是，${cm}公分，${mm}毫米，換算成毫米就是${selectedItem.mm}毫米。`;
        window.spEdAudio.speak(text);
      };
    }

    update();
  },

  // 5. 單元五：動態活動角與三角板直角檢測儀
  renderU5Angle(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let angleDeg = 90; // 預設直角
    let showSquare = false; // 是否蓋上透明三角板

    function getAngleType(deg) {
      if (deg < 90) return { name: "銳角 (比直角小)", class: "angle-acute", desc: "尖尖小小的，比直角還要小！" };
      if (deg === 90) return { name: "直角 (剛好 90 度)", class: "angle-right", desc: "正正方方的直角，像課本的四個角！" };
      return { name: "鈍角 (比直角大)", class: "angle-obtuse", desc: "嘴巴張得大大的，比直角還要大！" };
    }

    function update() {
      const type = getAngleType(angleDeg);
      const rad = (angleDeg * Math.PI) / 180;
      // 繪製活動扣條兩邊
      const length = 140;
      const x1 = 150 + length; // 固定邊水平向右
      const y1 = 180;
      const x2 = 150 + length * Math.cos(-rad); // 旋轉邊
      const y2 = 180 + length * Math.sin(-rad);

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>📐 動態活動扣條與直角檢測儀</h4>
            <div class="badge-tag ${type.class}">${type.name}</div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>迷思破解</strong>：角的大小只看「張開的程度」，不是看邊畫得多長喔！拉動滑桿改變張開大小。
          </p>

          <!-- 畫布與扣條 -->
          <div class="angle-interactive-stage">
            <svg width="340" height="240" viewBox="0 0 340 240" class="angle-svg">
              <!-- 扇形開口弧線 -->
              <path d="M 190 180 A 40 40 0 0 0 ${150 + 40 * Math.cos(-rad)} ${180 + 40 * Math.sin(-rad)}"
                    fill="none" stroke="#F59E0B" stroke-width="6"/>

              <!-- 固定邊 (底邊) -->
              <line x1="150" y1="180" x2="${x1}" y2="${y1}" stroke="#3B82F6" stroke-width="10" stroke-linecap="round"/>
              <!-- 活動旋轉邊 -->
              <line x1="150" y1="180" x2="${x2}" y2="${y2}" stroke="#10B981" stroke-width="10" stroke-linecap="round"/>
              <!-- 頂點圓釘 (樞紐) -->
              <circle cx="150" cy="180" r="10" fill="#EF4444"/>
              <text x="130" y="205" font-size="14" font-weight="bold" fill="#EF4444">頂點</text>

              <!-- 直角符號 (剛好90度時顯示) -->
              ${angleDeg === 90 ? `
                <rect x="150" y="155" width="25" height="25" fill="none" stroke="#DC2626" stroke-width="3"/>
              ` : ''}

              <!-- 覆蓋透明直角三角板 (如果勾選) -->
              ${showSquare ? `
                <polygon points="150,180 270,180 150,60" fill="rgba(245, 158, 11, 0.35)" stroke="#D97706" stroke-width="3" stroke-dasharray="4"/>
                <text x="180" y="140" font-size="14" font-weight="bold" fill="#92400E">三角板比對直角</text>
              ` : ''}
            </svg>

            <!-- 說明卡 -->
            <div class="angle-explanation-box">
              <div class="angle-title ${type.class}">${type.name}</div>
              <div class="angle-text">${type.desc}</div>
              <button class="btn btn-sm btn-outline mt-2" id="${cid}-u5-toggle-square">
                ${showSquare ? '✕ 移開比對三角板' : '📐 蓋上三角板比比看'}
              </button>
            </div>
          </div>

          <!-- 角度拉桿 -->
          <div class="angle-slider-control">
            <label>拉動扣條張開角度：<strong>${angleDeg}°</strong></label>
            <input type="range" id="${cid}-u5-angle-slider" min="20" max="160" value="${angleDeg}" step="5" class="custom-range"/>
            <div class="angle-quick-presets">
              <button class="btn btn-sm btn-outline" id="${cid}-u5-preset-acute">設為銳角 (45°)</button>
              <button class="btn btn-sm btn-primary" id="${cid}-u5-preset-right">設為直角 (90°)</button>
              <button class="btn btn-sm btn-outline" id="${cid}-u5-preset-obtuse">設為鈍角 (135°)</button>
            </div>
          </div>
        </div>
      `;

      $('u5-angle-slider').oninput = (e) => {
        angleDeg = Number(e.target.value);
        update();
      };

      $('u5-toggle-square').onclick = () => {
        showSquare = !showSquare;
        window.spEdAudio.playClick();
        update();
      };

      $('u5-preset-acute').onclick = () => { angleDeg = 45; update(); };
      $('u5-preset-right').onclick = () => { angleDeg = 90; update(); };
      $('u5-preset-obtuse').onclick = () => { angleDeg = 135; update(); };
    }

    update();
  },

  // 6. 單元六：互動分物盤與除法餘數模擬器（邊講邊揭示步驟化教學）
  renderU6Division(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let totalItems = 14;
    let basketCount = 3;
    let currentStep = 0; // 0: 準備觀察, 1: 逐盤均分算商數, 2: 檢核剩餘算餘數

    function update(autoSpeak = false) {
      const quotient = Math.floor(totalItems / basketCount);
      const remainder = totalItems % basketCount;

      const stepInfos = [
        {
          title: "👀 步驟 0：平分準備觀察",
          instruction: `有 ${totalItems} 顆蘋果準備分發，要平分到 ${basketCount} 個盤子。每個盤子可以分到幾顆？還會剩下幾顆？點擊下方「▶ 開始平分（下一步）」，我們一步步邊講邊揭示答案！`,
          speech: `有 ${totalItems} 顆蘋果，要平分到 ${basketCount} 個盤子。我們先來算每個盤子可以平分到幾顆。點擊下一步開始平分！`
        },
        {
          title: "🍎 步驟 1：均分入盤算商數",
          instruction: `第一步：把蘋果均分到 ${basketCount} 個盤子中，每個盤子剛好平分到 <strong style="color:#2563eb; font-size:1.3rem;">${quotient}</strong> 顆（商數是 ${quotient}）！${basketCount} 個盤子一共分走了 ${basketCount * quotient} 顆蘋果。`,
          speech: `第一步，平分蘋果。把 ${totalItems} 顆蘋果平分到 ${basketCount} 個盤子，每個盤子分到 ${quotient} 顆，一共分走了 ${basketCount * quotient} 顆蘋果。`
        },
        {
          title: "🧺 步驟 2：檢核剩餘算餘數！",
          instruction: `第二步：檢查剩下的蘋果！原本 ${totalItems} 顆分走了 ${basketCount * quotient} 顆，最後剩下 <strong style="color:#dc2626; font-size:1.3rem;">${remainder}</strong> 顆不能再分，這就是「餘數」！特教安全檢核：餘數 ${remainder} ＜ 除數 ${basketCount}，完全正確！`,
          speech: `第二步，檢查餘數。剩下 ${remainder} 顆不能再分，餘數是 ${remainder}。檢查：餘數 ${remainder} 小於除數 ${basketCount}，完全正確！太棒了！`
        }
      ];

      const currentExpl = stepInfos[currentStep].speech;

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>🍎 互動平分盤與除法餘數探索（步驟拆解教學）</h4>
            <div class="badge-tag">
              算式：${totalItems} ÷ ${basketCount} ＝ 
              ${currentStep >= 1 ? `<strong class="vm-res-revealed" style="color:#2563eb; font-size:1.15rem;">${quotient}</strong>` : `<span class="vm-res-placeholder" style="font-size:1.15rem;">?</span>`}
              ... 
              ${currentStep >= 2 ? `<strong class="vm-res-revealed" style="color:#dc2626; font-size:1.15rem;">${remainder}</strong>` : `<span class="vm-res-placeholder" style="font-size:1.15rem;">?</span>`}
            </div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>特教核心法則</strong>：把 ${totalItems} 顆蘋果平均分到 ${basketCount} 個盤子。分不完剩下的「餘數」一定比除數 ${basketCount} 還要小！邊講解邊揭示，清楚不焦慮！
          </p>

          <!-- 步驟進度標籤 (Step Progress Pills) -->
          <div class="step-progress-pills">
            <span class="step-pill ${currentStep === 0 ? 'current' : 'completed'}">0. 觀察題目準備</span>
            <span class="step-pill ${currentStep === 1 ? 'current' : (currentStep > 1 ? 'completed' : '')}">1. 平分算商數 (${totalItems}÷${basketCount})</span>
            <span class="step-pill ${currentStep === 2 ? 'current completed' : ''}">2. 檢核算餘數</span>
          </div>

          <!-- 邊講邊算引導卡片 (Step Guide Card) -->
          <div class="step-guide-card">
            <div class="step-guide-title">
              <span>${stepInfos[currentStep].title}</span>
              <button class="btn btn-sm btn-speech" id="${cid}-u6-speech-calc">
                🔊 聽本步驟解說
              </button>
            </div>
            <div class="step-guide-instruction">
              ${stepInfos[currentStep].instruction}
            </div>
          </div>

          <!-- 待分配蘋果托盤（步驟0顯示全部，步驟1顯示剩下待分） -->
          <div style="background:#f8fafc; border:2px dashed #94a3b8; border-radius:14px; padding:12px; margin-bottom:14px; text-align:center;">
            <div style="font-size:0.95rem; font-weight:800; color:#475569; margin-bottom:6px;">
              🍎 蘋果準備托盤：
              ${currentStep === 0 ? `全部待平分共 <strong>${totalItems}</strong> 顆` : (currentStep === 1 ? `已分走 ${quotient * basketCount} 顆，待檢核剩餘` : `分發完畢`)}
            </div>
            <div style="min-height:36px; display:flex; flex-wrap:wrap; justify-content:center; gap:4px;">
              ${currentStep === 0 ? Array.from({ length: totalItems }, () => `<span class="apple-item">🍎</span>`).join('') : (currentStep === 1 && remainder > 0 ? Array.from({ length: remainder }, () => `<span class="apple-item" style="opacity:0.6;">🍎</span>`).join('') : '<span style="color:#94a3b8; font-size:0.9rem;">（托盤已清空，全部移入盤子與餘數籃）</span>')}
            </div>
          </div>

          <!-- 盤子視覺展示區：未到步驟1前不顯示商數答案，以問號佔位 -->
          <div class="division-stage">
            <!-- 各盤子 -->
            <div class="baskets-grid">
              ${Array.from({ length: basketCount }, (_, idx) => `
                <div class="basket-plate ${currentStep === 1 ? 'active-column' : ''}" style="transition: all 0.3s;">
                  <div class="plate-title" style="font-weight: 800;">盤子 ${idx + 1}</div>
                  <div class="plate-items" style="min-height: 48px; display:flex; flex-wrap:wrap; justify-content:center; align-items:center;">
                    ${currentStep >= 1 ? Array.from({ length: quotient }, () => `<span class="apple-item vm-res-revealed">🍎</span>`).join('') : `<span class="vm-res-placeholder" style="font-size:1.4rem;">?</span>`}
                  </div>
                  <div class="plate-count" style="font-size: 1.05rem; margin-top: 4px;">
                    分到 
                    ${currentStep >= 1 ? `<strong class="vm-res-revealed" style="color:#2563eb;">${quotient}</strong>` : `<span class="vm-res-placeholder">?</span>`} 顆
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- 剩下的餘數籃子：未到步驟2前保持隱藏或待檢核 -->
            <div class="remainder-box ${currentStep === 2 ? (remainder > 0 ? 'has-remainder active-column' : 'active-column') : ''}" style="transition: all 0.3s; margin-top:14px;">
              <div class="rem-title" style="font-weight: 800; font-size: 1.1rem;">
                🧺 剩下不能再分的「餘數」
              </div>
              <div class="rem-items" style="min-height: 40px; display:flex; justify-content:center; align-items:center; gap:6px;">
                ${currentStep >= 2 ? (remainder > 0 ? Array.from({ length: remainder }, () => `<span class="apple-item vm-res-revealed">🍎</span>`).join('') : '<span class="text-muted" style="font-weight:700;">剛好平分完畢（餘數是 0 顆）</span>') : '<span class="vm-res-placeholder" style="font-size:1.2rem;">等待步驟 2 揭示檢核...</span>'}
              </div>
              <div class="rem-rule" style="font-size: 1.05rem; margin-top: 8px;">
                ${currentStep >= 2 ? `
                  餘數是 <strong class="vm-res-revealed" style="color:#dc2626;">${remainder}</strong> 顆 
                  （${remainder} &lt; ${basketCount} ✓ 通過特教安全檢核：餘數小於除數）
                ` : `
                  餘數是 <span class="vm-res-placeholder">?</span> 顆（檢核規則：餘數必須小於除數 ${basketCount}）
                `}
              </div>
            </div>
          </div>

          <!-- 控制操作面板：邊講邊顯示控制器 -->
          <div class="regroup-actions mt-3" style="justify-content: center; display:flex; gap:10px; flex-wrap:wrap;">
            ${currentStep < 2 ? `
              <button class="kid-btn kid-btn-primary" id="${cid}-u6-step-next" style="font-size:1.05rem;">
                ▶ ${['開始平分算商數', '檢核剩下算餘數'][currentStep]}（下一步）
              </button>
            ` : `
              <button class="kid-btn kid-btn-primary" id="${cid}-u6-step-restart" style="font-size:1.05rem;">
                🔄 重新一步步算
              </button>
            `}
            <button class="kid-btn kid-btn-secondary" id="${cid}-u6-step-prev" ${currentStep === 0 ? 'disabled' : ''}>
              ◀ 上一步
            </button>
            <button class="kid-btn kid-btn-solution" id="${cid}-u6-step-showall">
              👁️ 顯示全部答案
            </button>
            <button class="kid-btn kid-btn-secondary" id="${cid}-u6-random-problem">
              🎲 換一題範例
            </button>
          </div>

          <!-- 調整器 -->
          <div class="manipulative-control-panel mt-3">
            <div class="control-row">
              <label>蘋果總數 (${totalItems} 顆)：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u6-sub-total">－</button>
              <span class="val-display">${totalItems}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u6-add-total">＋</button>
            </div>
            <div class="control-row">
              <label>分給幾個盤子 (${basketCount} 個)：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u6-sub-baskets">－</button>
              <span class="val-display">${basketCount}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u6-add-baskets">＋</button>
            </div>
          </div>
        </div>
      `;

      // 綁定事件
      const nextBtn = $('u6-step-next');
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (currentStep < 2) {
            currentStep++;
            window.spEdAudio.playClick();
            update(true);
            if (currentStep === 2) {
              window.spEdAudio.playCorrect();
              if (window.KidEffects) window.KidEffects.triggerConfetti(50, 1800);
            }
          }
        };
      }

      const restartBtn = $('u6-step-restart');
      if (restartBtn) {
        restartBtn.onclick = () => {
          currentStep = 0;
          window.spEdAudio.playClick();
          update(true);
        };
      }

      const prevBtn = $('u6-step-prev');
      if (prevBtn) {
        prevBtn.onclick = () => {
          if (currentStep > 0) {
            currentStep--;
            window.spEdAudio.playClick();
            update(true);
          }
        };
      }

      const showAllBtn = $('u6-step-showall');
      if (showAllBtn) {
        showAllBtn.onclick = () => {
          currentStep = 2;
          window.spEdAudio.playClick();
          update(true);
          window.spEdAudio.playCorrect();
        };
      }

      const randomBtn = $('u6-random-problem');
      if (randomBtn) {
        randomBtn.onclick = () => {
          totalItems = Math.floor(Math.random() * 20) + 7; // 7~26
          basketCount = Math.floor(Math.random() * 4) + 3; // 3~6
          currentStep = 0;
          window.spEdAudio.playClick();
          update(false);
        };
      }

      const speechCalcBtn = $('u6-speech-calc');
      if (speechCalcBtn) {
        speechCalcBtn.onclick = () => {
          window.spEdAudio.speak(currentExpl);
        };
      }

      $('u6-add-total').onclick = () => { if (totalItems < 30) { totalItems++; currentStep = 0; update(false); } };
      $('u6-sub-total').onclick = () => { if (totalItems > 3) { totalItems--; currentStep = 0; update(false); } };
      $('u6-add-baskets').onclick = () => { if (basketCount < 6) { basketCount++; currentStep = 0; update(false); } };
      $('u6-sub-baskets').onclick = () => { if (basketCount > 2) { basketCount--; currentStep = 0; update(false); } };

      if (autoSpeak) {
        window.spEdAudio.speak(currentExpl);
      }
    }

    update(false);
  },

  // 7. 單元七：容量量筒動態注水器
  renderU7Capacity(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let currentMl = 650; // 目前水量 mL

    function update() {
      const liters = Math.floor(currentMl / 1000);
      const remainingMl = currentMl % 1000;
      const heightPercent = Math.min(100, (currentMl / 1500) * 100);

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>🥛 公升與毫升動態量筒注水器</h4>
            <div class="badge-tag">目前容量：${currentMl} mL</div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>生活容量表徵</strong>：1 公升 (L) = 1000 毫升 (mL)。點擊按鈕給量筒倒水或倒掉水，觀察水位刻度上升！
          </p>

          <div class="beaker-stage">
            <!-- 量筒本體 (SVG) -->
            <div class="beaker-container">
              <svg width="180" height="300" viewBox="0 0 180 300" class="beaker-svg">
                <!-- 量筒玻璃管 -->
                <rect x="30" y="20" width="120" height="260" rx="8" fill="#F0F9FF" stroke="#0284C7" stroke-width="4"/>
                
                <!-- 水位藍色矩形 (動態高度) -->
                <rect x="34" y="${280 - (heightPercent * 2.5)}" width="112" height="${heightPercent * 2.5}" fill="rgba(56, 189, 248, 0.7)"/>

                <!-- 刻度線：1500mL, 1000mL(1L), 500mL, 0mL -->
                <line x1="30" y1="30" x2="60" y2="30" stroke="#0369A1" stroke-width="2"/>
                <text x="65" y="35" font-size="11" fill="#0369A1">1500 mL</text>

                <line x1="30" y1="113" x2="70" y2="113" stroke="#DC2626" stroke-width="3"/>
                <text x="75" y="117" font-size="13" font-weight="bold" fill="#DC2626">1000 mL (1 公升)</text>

                <line x1="30" y1="196" x2="60" y2="196" stroke="#0369A1" stroke-width="2"/>
                <text x="65" y="200" font-size="11" fill="#0369A1">500 mL</text>

                <line x1="30" y1="280" x2="60" y2="280" stroke="#0369A1" stroke-width="2"/>
                <text x="65" y="280" font-size="11" fill="#0369A1">0 mL</text>
              </svg>
            </div>

            <!-- 容量換算與生活配對說明 -->
            <div class="beaker-readout">
              <div class="readout-box">
                <div class="readout-title">容量換算結果：</div>
                <div class="readout-val">
                  ${liters > 0 ? `<strong>${liters}</strong> 公升又 ` : ''}<strong>${remainingMl}</strong> 毫升
                </div>
                <div class="readout-total">＝ 全部共 <strong>${currentMl}</strong> mL</div>
              </div>

              <!-- 生活常見物品對照 -->
              <div class="drink-comparisons">
                <div class="drink-item">🧃 養樂多瓶：約 100 mL</div>
                <div class="drink-item">🥤 超商寶特瓶：約 600 mL</div>
                <div class="drink-item">🥛 標示 1 L 的飲品：1000 mL（以包裝標示為準）</div>
              </div>
            </div>
          </div>

          <!-- 操作注水按鈕群 -->
          <div class="beaker-actions mt-3">
            <button class="btn btn-action-touch" id="${cid}-u7-add-100">💧 倒進 100 mL</button>
            <button class="btn btn-action-touch" id="${cid}-u7-add-500">🥛 倒進 500 mL</button>
            <button class="btn btn-action-touch" id="${cid}-u7-sub-100">倒掉 100 mL</button>
            <button class="btn btn-outline" id="${cid}-u7-reset">清空量筒</button>
          </div>
        </div>
      `;

      $('u7-add-100').onclick = () => {
        if (currentMl + 100 <= 1500) {
          currentMl += 100;
          window.spEdAudio.playWater();
          update();
        }
      };

      $('u7-add-500').onclick = () => {
        if (currentMl + 500 <= 1500) {
          currentMl += 500;
          window.spEdAudio.playWater();
          update();
        }
      };

      $('u7-sub-100').onclick = () => {
        if (currentMl >= 100) {
          currentMl -= 100;
          window.spEdAudio.playClick();
          update();
        }
      };

      $('u7-reset').onclick = () => {
        currentMl = 0;
        window.spEdAudio.playClick();
        update();
      };
    }

    update();
  },

  // 8. 單元八：披薩與巧克力分數切盤器
  renderU8Fraction(containerId, initial = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let denominator = initial.denominator || 4; // 分母（平分成幾等份）
    let numerator = initial.numerator ?? 3;   // 分子（選取了幾份）

    function update() {
      if (numerator > denominator) numerator = denominator;

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>🍕 披薩分數切片盤與等分探索</h4>
            <div class="badge-tag">分數表示：${numerator} / ${denominator}</div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>分數結構特教口訣</strong>：橫線下方的「分母」是平分成幾等份；橫線上方的「分子」是取了其中幾份！同一個整體且分母相同時，分子越大，取的份數越多！
          </p>

          <div class="fraction-stage">
            <!-- 圓形披薩切片 (SVG) -->
            <div class="pizza-display">
              <svg width="240" height="240" viewBox="0 0 240 240" class="pizza-svg">
                <!-- 底盤 -->
                <circle cx="120" cy="120" r="100" fill="#FEF3C7" stroke="#D97706" stroke-width="4"/>
                <!-- 等分切片繪製 -->
                ${Array.from({ length: denominator }, (_, i) => {
                  const anglePerSlice = (2 * Math.PI) / denominator;
                  const startA = i * anglePerSlice - Math.PI / 2;
                  const endA = (i + 1) * anglePerSlice - Math.PI / 2;
                  const x1 = 120 + 100 * Math.cos(startA);
                  const y1 = 120 + 100 * Math.sin(startA);
                  const x2 = 120 + 100 * Math.cos(endA);
                  const y2 = 120 + 100 * Math.sin(endA);
                  const isSelected = i < numerator;
                  const fillColor = isSelected ? '#F97316' : '#FEF3C7';

                  return `
                    <path d="M 120 120 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z"
                          fill="${fillColor}" stroke="#B45309" stroke-width="2" class="pizza-slice" data-slice="${i}"/>
                  `;
                }).join('')}
                <!-- 披薩中心點 -->
                <circle cx="120" cy="120" r="6" fill="#78350F"/>
              </svg>
            </div>

            <!-- 分數大字符號卡片 -->
            <div class="fraction-symbol-card">
              <div class="fraction-box">
                <span class="f-num">${numerator}</span>
                <span class="f-bar"></span>
                <span class="f-den">${denominator}</span>
              </div>
              <div class="f-reading">
                讀作：<strong>${denominator === 2 ? '二' : denominator === 3 ? '三' : denominator === 4 ? '四' : denominator === 6 ? '六' : '八'}分之${['零','一','二','三','四','五','六','七','八'][numerator]}</strong>
              </div>
              <button class="btn btn-speech mt-2" id="${cid}-u8-speech-btn">🔊 朗讀分數</button>
            </div>
          </div>

          <!-- 控制面板 -->
          <div class="manipulative-control-panel mt-3">
            <div class="control-row">
              <label>平分成幾份（分母）：</label>
              ${[2, 3, 4, 6, 8].map(d => `
                <button class="btn btn-sm ${d === denominator ? 'btn-primary' : 'btn-outline'}" data-den="${d}">${d} 等份</button>
              `).join('')}
            </div>
            <div class="control-row">
              <label>拿取了幾份（分子）：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u8-sub-num" ${numerator === 0 ? 'disabled' : ''}>－1 份</button>
              <span class="val-display">${numerator}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u8-add-num" ${numerator === denominator ? 'disabled' : ''}>＋1 份</button>
            </div>
          </div>
        </div>
      `;

      el.querySelectorAll('[data-den]').forEach(btn => {
        btn.onclick = () => {
          denominator = Number(btn.dataset.den);
          if (numerator > denominator) numerator = denominator;
          window.spEdAudio.playClick();
          update();
        };
      });

      $('u8-add-num').onclick = () => {
        if (numerator < denominator) {
          numerator++;
          window.spEdAudio.playClick();
          update();
        }
      };

      $('u8-sub-num').onclick = () => {
        if (numerator > 0) {
          numerator--;
          window.spEdAudio.playClick();
          update();
        }
      };

      $('u8-speech-btn').onclick = () => {
        const text = `一個披薩平分成${denominator}份，拿了${numerator}份，這叫做${denominator}分之${numerator}。`;
        window.spEdAudio.speak(text);
      };
    }

    update();
  },

  // 9. 單元九：數位圓規與圓心半徑直徑互動探索
  renderU9Circle(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cid = containerId;
    const $ = (id) => el.querySelector("#" + cid + "-" + id) || el.querySelector("#" + id);

    let radiusCm = 4; // 半徑 4 公分
    let isDrawing = false;
    let showDiameter = true;

    function update() {
      const diameterCm = radiusCm * 2;
      const rPixels = radiusCm * 20;

      el.innerHTML = `
        <div class="manipulative-card">
          <div class="manipulative-header">
            <h4>⭕ 數位圓規與圓心、半徑、直徑探索儀</h4>
            <div class="badge-tag">半徑：${radiusCm} cm ｜ 直徑：${diameterCm} cm</div>
          </div>

          <p class="scaffold-tip">
            💡 <strong>幾何倍數特教鷹架</strong>：固定不動的中心點是「圓心」；從圓心連到邊邊的線是「半徑」；穿過圓心連通兩邊最長的線是「直徑」！直徑剛好是半徑的 2 倍！
          </p>

          <div class="circle-stage">
            <svg width="280" height="280" viewBox="0 0 280 280" class="circle-svg">
              <!-- 外框參考 -->
              <rect x="0" y="0" width="280" height="280" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>

              <!-- 圓形本體 -->
              <circle cx="140" cy="140" r="${rPixels}" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" stroke-width="4"/>

              <!-- 直徑綠線 (穿過圓心) -->
              ${showDiameter ? `
                <line x1="${140 - rPixels}" y1="140" x2="${140 + rPixels}" y2="140" stroke="#059669" stroke-width="3" stroke-dasharray="4"/>
                <text x="140" y="165" font-size="12" font-weight="bold" fill="#059669" text-anchor="middle">直徑 ${diameterCm} cm</text>
              ` : ''}

              <!-- 半徑藍線 (圓心到邊緣) -->
              <line x1="140" y1="140" x2="${140 + rPixels}" y2="140" stroke="#2563EB" stroke-width="4"/>
              <text x="${140 + rPixels / 2}" y="130" font-size="12" font-weight="bold" fill="#2563EB" text-anchor="middle">半徑 ${radiusCm} cm</text>

              <!-- 圓心紅點 -->
              <circle cx="140" cy="140" r="7" fill="#DC2626"/>
              <text x="140" y="125" font-size="13" font-weight="bold" fill="#DC2626" text-anchor="middle">圓心</text>
            </svg>

            <!-- 關係公式說明 -->
            <div class="circle-formula-card">
              <div class="cf-item cf-center">🔴 <strong>圓心</strong>：旋轉時固定不動的中心</div>
              <div class="cf-item cf-radius">🔵 <strong>半徑</strong>：圓心到圓周的距離（${radiusCm} 公分）</div>
              <div class="cf-item cf-diameter">🟢 <strong>直徑</strong>：通過圓心、連接兩端的線（${diameterCm} 公分）</div>
              <div class="cf-math-rule">
                ⭐ <strong>重要公式</strong>：<br/>
                直徑 ＝ 半徑 × 2 （${radiusCm} × 2 ＝ <strong>${diameterCm}</strong> 公分）
              </div>
            </div>
          </div>

          <!-- 控制面板 -->
          <div class="manipulative-control-panel mt-3">
            <div class="control-row">
              <label>拉開圓規針腳（設定半徑）：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u9-sub-r">－1 cm</button>
              <span class="val-display">${radiusCm} cm</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u9-add-r">＋1 cm</button>
            </div>
            <div class="control-row">
              <button class="btn btn-sm btn-outline" id="${cid}-u9-toggle-diameter">
                ${showDiameter ? '隱藏直徑線' : '顯示直徑線'}
              </button>
              <button class="btn btn-speech" id="${cid}-u9-speech-btn">🔊 聽圓形特性朗讀</button>
            </div>
          </div>
        </div>
      `;

      $('u9-add-r').onclick = () => {
        if (radiusCm < 6) { radiusCm++; update(); }
      };

      $('u9-sub-r').onclick = () => {
        if (radiusCm > 2) { radiusCm--; update(); }
      };

      $('u9-toggle-diameter').onclick = () => {
        showDiameter = !showDiameter;
        update();
      };

      $('u9-speech-btn').onclick = () => {
        const text = `圓的中心叫做圓心。從圓心到圓周的線叫做半徑，現在是${radiusCm}公分。通過圓心的線叫做直徑，長度剛好是半徑的兩倍，也就是${diameterCm}公分。`;
        window.spEdAudio.speak(text);
      };
    }

    update();
  }
};

if (typeof window !== 'undefined') {
  window.Manipulatives = Manipulatives;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Manipulatives;
}
