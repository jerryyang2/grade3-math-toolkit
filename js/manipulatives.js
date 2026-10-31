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
      const visualStep = window.HandsOnTools.verticalTrace(num1, num2, op)[currentStep];

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

          ${window.HandsOnTools.arithmeticPicture(num1, num2, op, currentStep)}

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
                <div class="vm-col">${visualStep.carries[0] > 0 ? `<span class="carry-bubble revealed">+${model.carries[0]}</span>` : ''}</div>
                <div class="vm-col">${visualStep.carries[1] > 0 ? `<span class="carry-bubble revealed">+${model.carries[1]}</span>` : ''}</div>
                <div class="vm-col">${visualStep.carries[2] > 0 ? `<span class="carry-bubble revealed">+${model.carries[2]}</span>` : ''}</div>
                <div class="vm-col"></div>
              </div>
            ` : `
              <div class="vm-row vm-borrows">
                <div class="vm-col"></div>
                <div class="vm-col">${visualStep.working[0] !== d1[0] ? `<span class="borrow-bubble revealed">${visualStep.working[0]}</span>` : ''}</div>
                <div class="vm-col">${visualStep.working[1] !== d1[1] ? `<span class="borrow-bubble revealed">${visualStep.working[1]}</span>` : ''}</div>
                <div class="vm-col">${visualStep.working[2] !== d1[2] ? `<span class="borrow-bubble revealed">${visualStep.working[2]}</span>` : ''}</div>
                <div class="vm-col">${visualStep.working[3] !== d1[3] ? `<span class="borrow-bubble revealed">${visualStep.working[3]}</span>` : ''}</div>
              </div>
            `}

            <!-- 被加數 / 被減數 -->
            <div class="vm-row vm-number">
              <div class="vm-col"></div>
              <div class="vm-col pv-thousand ${currentStep === 4 ? 'active-column' : ''}">${op === '-' && visualStep.working[0] !== d1[0] ? `<s>${d1[0]}</s>` : d1[0]}</div>
              <div class="vm-col pv-hundred ${currentStep === 3 ? 'active-column' : ''}">${op === '-' && visualStep.working[1] !== d1[1] ? `<s>${d1[1]}</s>` : d1[1]}</div>
              <div class="vm-col pv-ten ${currentStep === 2 ? 'active-column' : ''}">${op === '-' && visualStep.working[2] !== d1[2] ? `<s>${d1[2]}</s>` : d1[2]}</div>
              <div class="vm-col pv-one ${currentStep === 1 ? 'active-column' : ''}">${op === '-' && visualStep.working[3] !== d1[3] ? `<s>${d1[3]}</s>` : d1[3]}</div>
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
          num2 = Math.floor(Math.random() * (Math.min(5199, 9999 - num1) - 1200 + 1)) + 1200;
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
          instruction: `第二步：計算右邊黃色個位小塊！${onesNum} × ${multiplier} ＝ <strong style="color:#d97706; font-size:1.3rem;">${part2}</strong>（可以逐排數，也可以用乘法表幫忙）。。`,
          speech: `第二步，再算個位小塊。${onesNum} 乘以 ${multiplier} 等於 ${part2}。`
        },
        {
          title: "🎉 步驟 3：兩部分合體相加！",
          instruction: `第三步：把十位乘積與個位乘積加起來！${part1} ＋ ${part2} ＝ <strong style="color:#059669; font-size:1.4rem;">${total}</strong>！乘法算式完成！`,
          speech: `第三步，把兩部分合體加起來。${part1} 加 ${part2} 等於 ${total}。兩部分已合起來，請對照圖形再說一次。`
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

          ${window.HandsOnTools.multiplicationArray(tensNum, onesNum, multiplier, currentStep)}

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
              <button class="btn btn-sm btn-outline" id="${cid}-u3-tens-minus" aria-label="減少被乘數的十位" ${tensNum <= 1 ? 'disabled' : ''}>－</button>
              <span class="val-display">${tensNum}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-tens-plus" aria-label="增加被乘數的十位" ${tensNum >= 6 ? 'disabled' : ''}>＋</button>
            </div>
            <div class="control-row">
              <label>被乘數個位 (${onesNum})：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-ones-minus" aria-label="減少被乘數的個位" ${onesNum <= 0 ? 'disabled' : ''}>－</button>
              <span class="val-display">${onesNum}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-ones-plus" aria-label="增加被乘數的個位" ${onesNum >= 9 ? 'disabled' : ''}>＋</button>
            </div>
            <div class="control-row">
              <label>乘以幾倍 (${multiplier})：</label>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-mul-minus" aria-label="減少組數" ${multiplier <= 2 ? 'disabled' : ''}>－</button>
              <span class="val-display">${multiplier}</span>
              <button class="btn btn-sm btn-outline" id="${cid}-u3-mul-plus" aria-label="增加組數" ${multiplier >= 9 ? 'disabled' : ''}>＋</button>
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
    window.HandsOnTools.mountRuler(containerId);
  },

  // 5. 單元五：動態活動角與三角板直角檢測儀
  renderU5Angle(containerId) {
    window.HandsOnTools.mountAngle(containerId);
  },

  // 6. 單元六：互動分物盤與除法餘數模擬器（邊講邊揭示步驟化教學）
  renderU6Division(containerId) {
    window.HandsOnTools.mountDivision(containerId);
  },

  // 7. 單元七：容量量筒動態注水器
  renderU7Capacity(containerId) {
    window.HandsOnTools.mountCapacity(containerId);
  },

  // 8. 單元八：披薩與巧克力分數切盤器
  renderU8Fraction(containerId, initial = {}) {
    window.HandsOnTools.mountFraction(containerId, initial);
  },

  // 9. 單元九：數位圓規與圓心半徑直徑互動探索
  renderU9Circle(containerId) {
    window.HandsOnTools.mountCircle(containerId);
  }

};

if (typeof window !== 'undefined') {
  window.Manipulatives = Manipulatives;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Manipulatives;
}
