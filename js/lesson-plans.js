/* 教師可調整的九單元五步教案；題目與島嶼範例引用網站共用資料。 */
(function (root) {
  'use strict';
  const profiles = {
    u1: {
      focus:'把每一位的數量對應到數字，保留 0 的位置。',
      materials:'千百十個位值表、錢幣或積木、數字卡。',
      model:'用 2 個千、3 個百、4 個十和 6 個一組成 2346；再移走百和個位的材料，讀出 2040。',
      question:'2040 的百位和個位沒有材料，為什麼仍要寫 0？',
      expected:'2 個千和 4 個十是 2040；0 保留沒有數量的位值，不能寫成 24。',
      retry:'先用只有千位與十位的材料，逐欄指讀；把數字卡放在對應欄，空欄放 0。',
      observe:'能否將材料放對欄位、保留 0，再讀出整個數。',
      transfer:'換成 3050，請學生擺出、讀出，並指出兩個 0 的位置。',
      transferAnswer:'3 個千、0 個百、5 個十、0 個一，共 3050。',
      arcade:'選「森林拔河運動會」第一單元，依已教小節練習四位數位值、讀寫與比較；需要時先用森林超商回顧換幣。'
    },
    u2: {
      focus:'對齊位值，說明進位或退位時總量不變。',
      materials:'千百十個方格、錢幣或積木、紙筆。',
      model:'先用 1485＋2378 示範個位滿十換一，再把材料的交換對應到直式進位記號。',
      question:'個位 5＋8＝13，為什麼個位寫 3，十位還要多 1？',
      expected:'13 個一換成 1 個十和 3 個一，1485＋2378＝3863。',
      retry:'先遮住尚未計算的欄位，只比較材料交換與當前一欄；減法不夠減時先換開再拿走。',
      observe:'能否對齊位值、記下交換後的數量，並用相反運算檢查。',
      transfer:'已會進位者改做 3000−1465；若尚未準備好，改做不跨零的減法。',
      transferAnswer:'3000−1465＝1535；1535＋1465＝3000。',
      arcade:'選「森林拔河運動會」第二單元或「三四位數直式加減」，先共同完成一題，再說出進位或退位的位置。'
    },
    u3: {
      focus:'把每組數量拆成十和一，再合併各部分乘積。',
      materials:'等量分組盤、十位條和個位積木、紙筆。',
      model:'每盤 12 個放 3 盤；將每盤拆成 10 和 2，用圖連結 10×3＋2×3。',
      question:'12×3 中的 12 和 3 各表示什麼？可以分成哪兩部分來算？',
      expected:'每盤 12 個，共 3 盤；30＋6＝36 個。',
      retry:'先確認每盤一樣多，再用不同顏色框出十位和個位；不直接要求背直式步驟。',
      observe:'能否指出每組數量、組數，將分組圖和乘法算式互相對應。',
      transfer:'換成每盤 24 個、3 盤，請先畫或指出拆分，再計算。',
      transferAnswer:'24×3＝20×3＋4×3＝60＋12＝72。',
      arcade:'選「森林拔河運動會」第三單元，依小節練習乘法；先說明每組數量與組數，再用拆分方法檢查答案。'
    },
    u4: {
      focus:'從 0 刻度量長度，區分刻度線與線之間的小格。',
      materials:'實體毫米尺、短紙條、螢幕直尺教具。',
      model:'把紙條左端對齊 0，先數 2 個整公分，再數 8 個毫米小格，記錄 28 毫米。',
      question:'2 公分 8 毫米共有幾毫米？量長度時要對齊尺的邊緣還是 0 刻度？',
      expected:'2 公分是 20 毫米，再加 8 毫米是 28 毫米；左端對齊 0 刻度。',
      retry:'放大一個公分，逐格指數 10 個間隔；再回到整段長度。螢幕尺寸不當作實際公分。',
      observe:'能否對齊 0、數間隔並帶上正確單位，實測時再用實體尺確認。',
      transfer:'請把 4 公分 3 毫米改寫成毫米，並在毫米尺上指出位置。',
      transferAnswer:'4 公分 3 毫米＝43 毫米。',
      arcade:'選「森林拔河運動會」第四單元，練習毫米讀圖與單位換算；螢幕示意不當作實際長度，另用實體尺實測。'
    },
    u5: {
      focus:'依角和邊的條件判斷圖形，不靠擺放方向猜。',
      materials:'三角板、正方形與長方形圖卡、可旋轉圖形。',
      model:'用三角板比對四個角，再比較邊長；把正方形圖卡旋轉後，重新檢查相同條件。',
      question:'正方形斜斜擺，還是正方形嗎？你用哪些條件判斷？',
      expected:'仍是正方形，因為四邊等長、四個角都是直角，旋轉不改變這些特徵。',
      retry:'先只比一個角，再逐一標記四個直角；用邊長標記核對，不以看起來像不像判斷。',
      observe:'能否指出直角及邊長證據，並在圖形旋轉後維持判斷。',
      transfer:'四個直角、長邊 6 公分與短邊 3 公分的城門，應選哪個圖形？',
      transferAnswer:'選符合 6 公分與 3 公分邊長條件的長方形；不能只看方向。',
      arcade:'選「森林拔河運動會」第五單元，練習角與圖形判斷；請學生指出角與邊的證據，再前往幾何島操作。'
    },
    u6: {
      focus:'以公平分配理解商與餘數，確認餘數小於除數。',
      materials:'19 個計數物、4 個盤子、分物教具。',
      model:'把 19 個點心輪流分給 4 盤，每盤 4 個後剩 3 個；檢查能不能再平均分一輪。',
      question:'剩下 3 個，為什麼不能再給每盤一個？商和餘數各代表什麼？',
      expected:'19÷4＝4 餘 3；每盤 4 個，剩 3 個，3 少於 4，不能再分一輪。',
      retry:'每次每盤只放一個，輪流分完一輪才開始下一輪；用一一對應確認各盤等量。',
      observe:'能否公平分配、解釋剩餘，並用 4×4＋3＝19 檢查。',
      transfer:'換成 27 個點心、5 個籃子，請先預測是否有剩餘，再驗算。',
      transferAnswer:'27÷5＝5 餘 2；5×5＋2＝27，而且 2＜5。',
      arcade:'選「森林拔河運動會」第六單元，依小節練習除法與餘數；用分物或乘法驗算解釋商與剩餘。'
    },
    u7: {
      focus:'連結 1 公升與 1000 毫升，先統一單位再比較。',
      materials:'1 公升容器、毫升量杯、水或替代材料、容量教具。',
      model:'先裝 1 公升，再加 250 毫升，對照同一容量的兩種記法：1 公升 250 毫升與 1250 毫升。',
      question:'1 公升 250 毫升為什麼不是 125 毫升？哪一部分代表 1000 毫升？',
      expected:'1 公升＝1000 毫升，所以 1000＋250＝1250 毫升。',
      retry:'先用 1000 毫升和 100 毫升的標記做配對，再處理不足一公升的部分；不比較容器外觀高矮。',
      observe:'能否讀對刻度、說出單位關係，並把混合單位改為毫升。',
      transfer:'將 2 公升 300 毫升改為毫升，再與 2000 毫升比較。',
      transferAnswer:'2 公升 300 毫升＝2300 毫升，比 2000 毫升多 300 毫升。',
      arcade:'選「森林拔河運動會」第七單元，練習公升、毫升與容量比較；再用實體量杯驗證，不只比較容器高矮。'
    },
    u8: {
      focus:'確認同一個整體與等分，再連結分子和分母。',
      materials:'同樣大小的紙圓、分數盤、塗色工具。',
      model:'把同一個披薩等分成 4 份，選 3 份；逐片對照 1/4、2/4、3/4。',
      question:'3/4 的 4 和 3 各表示什麼？若四片大小不同，還能直接說每片是 1/4 嗎？',
      expected:'4 表示把一個整體等分成 4 份，3 表示選其中 3 份；沒有等分就不能說每片是 1/4。',
      retry:'先固定同樣大小的整體與分母，只改變取走份數；用手指逐片數，不急著只看符號。',
      observe:'能否確認等分、指出分母與分子，並比較同分母分數。',
      transfer:'在同樣大的六等分披薩上，比較 4/6 與 2/6，並指出未選的部分。',
      transferAnswer:'4/6＞2/6；選 4/6 後，未選部分是 2/6。',
      arcade:'選「森林拔河運動會」第八單元，練習分數讀圖與比較；先確認同樣大的整體與等分，再說出選項的理由。'
    },
    u9: {
      focus:'辨認圓心到圓周的半徑，以及通過圓心的直徑。',
      materials:'圓規、圓形圖卡、直尺或數位圓規。',
      model:'固定圓心，將半徑設為 3 公分畫圓；指出通過圓心的兩條半徑接成直徑。',
      question:'直徑 8 公分的圓，圓規兩腳要張開幾公分？為什麼？',
      expected:'張開 4 公分，因為圓規兩腳距離是半徑，直徑等於兩條半徑。',
      retry:'先描出圓心到圓周的一段，再在另一側接上同樣長的一段；排除未通過圓心的線段。',
      observe:'能否固定圓心、保持半徑，並用兩條半徑解釋直徑。',
      transfer:'施工圖要直徑 10 公分的輪子，請指出或設定正確的半徑。',
      transferAnswer:'半徑 5 公分，5×2＝10 公分。',
      arcade:'選「森林拔河運動會」第九單元，練習圓心、半徑與直徑；指出圖中的線段，再用圓規操作確認關係。'
    }
  };
  function build(unit, data, curriculum, steps) {
    const p = profiles[unit.id];
    if (!p) throw new RangeError('未知教案單元');
    const example = data.practiceBank.find(q=>q.unitId===unit.id);
    const island = curriculum.islands.find(i=>i.id===unit.id);
    const mission = curriculum.task(unit.id,0);
    const common = { focus:p.focus, materials:p.materials, question:p.question, expected:p.expected, support:p.retry, observe:p.observe };
    const content = {
      units:{ ...common,
        teacher:['先用本單元的先備檢核確認起點，再示範一題。',p.model,'請學生操作或指認同一概念，再把圖像連到數學符號。'],
        prerequisite:unit.prerequisite.diagnosticCheck,
        activity:unit.id==='u1' ? '依準備度選「照圖放一放」「十個換一個」或「自由操作」；不必一堂全部做完。' : unit.cra.concrete,
        student:p.model,
        pacing:'2 分鐘先備檢核 → 5 分鐘教師示範 → 6 分鐘共同操作 → 3 分鐘說明與檢查。',
        assessment:'觀察一次操作及一次說明；不只看最後答案。尚未理解時保留材料，縮小數值或減少步驟。'
      },
      practice:{ ...common,
        teacher:['在隨堂練習確認本單元或已教過的小節，選學生代號與支持程度。','先讀題、找已知與要問的量，再操作或畫圖；每題完成後才看回饋。','以 2～3 題為起點；需要時減題，最後保留一題相近但不同的題目觀察獨立表現。'],
        student:example.question, question:'先用自己的方式表示題意，再說出或指出解題的關鍵一步。',
        expected:example.options[example.answerIndex], support:example.hint, practiceId:example.id, sectionId:example.sectionId,
        pacing:'1 分鐘設定與讀題 → 5 分鐘逐題作答及回饋 → 2 分鐘換題檢核。',
        assessment:'分開記錄首次作答、提示後完成與獨立作答。口述、指認或操作可作補充證據；查看解答後不算首次獨立答對。'
      },
      battle:{ ...common,
        teacher:['在分組搶答確認單元與題型，只選已教過的範圍；先分配操作、說明與檢查角色。','每人先想，再由小組討論並送出答案；用短回合，時間到可提前結束，不要求跑完整輪。','請兩隊各說一個方法並輪替角色。若競速造成負擔，可回到隨堂練習採輪流合作。'],
        student:p.transfer, question:'請指出你用到的圖像、材料或關係，說明為什麼這樣做。', expected:p.transferAnswer,
        pacing:'1 分鐘角色與規則 → 4 分鐘短回合與說明 → 1 分鐘核對方法。',
        assessment:'觀察每位學生是否參與及能否說明方法；團隊分數與搶答速度不當作個人概念達成標準。'
      },
      arcade:{ ...common,
        teacher:[p.arcade,'教師先試一題，確認題型、數值與本課目標相符；示範操作後才交給學生。','只進行一個短挑戰；請學生把遊戲中的操作對應回本課算理。沒有適合的題型就改用課堂教具。'],
        student:p.transfer, question:'請指出你用到的圖像、材料或關係，說明為什麼這樣做。', expected:p.transferAnswer,
        pacing:'1 分鐘確認題型及示範 → 3 分鐘短挑戰 → 1 分鐘說出數學方法。',
        assessment:'分開觀察操作熟悉度與數學理解。過關或得分不能取代本單元的操作與口述檢核。'
      },
      islands:{ ...common,
        teacher:[`前往「${island.name}」，先示範走到島上與選取任務；已開始的任務可接續，不必重設進度。`,`示例任務：「${island.missions[0]}」。${island.tip}`,'讓學生完成一個任務或其中一個步驟，再請他連回今天的解題方法；不要求五分鐘完成整座島。'],
        student:mission.prompt, question:island.say, expected:curriculum.solution(mission), mission:0,
        pacing:'1 分鐘登島與讀題 → 3 分鐘操作任務 → 1 分鐘回顧或口述離堂檢核。',
        assessment:'觀察任務操作、關鍵步驟及求助情形；證書與完成進度作為鼓勵，另以實際表現確認理解。'
      }
    };
    return steps.map(([id,title,time,minutes])=>({id,title,time,minutes,...content[id]}));
  }
  const api = {build};
  if (typeof module!=='undefined' && module.exports) module.exports=api; else root.MathLessonPlans=api;
})(typeof window!=='undefined'?window:globalThis);
