/* 原創森林動物向量圖形與互動；不讀寫學生紀錄或獎勵。 */
(function () {
  'use strict';
  const friends = {
    rabbit: { name: '米米兔', message: '米米兔：先數清楚，再往前走！' },
    fox: { name: '栗栗狐', message: '栗栗狐：找到重要的數字了嗎？' },
    bear: { name: '布布熊', message: '布布熊：一步一步，我陪你慢慢想。' },
    cat: { name: '點點貓', message: '點點貓：換個方法，也能找到答案。' },
    owl: { name: '咕咕貓頭鷹', message: '咕咕：仔細看看，線索藏在哪裡？' },
    hedgehog: { name: '球球刺蝟', message: '球球：用積木排一排，想法更清楚。' },
    panda: { name: '圓圓熊貓', message: '圓圓：停一下，檢查剛剛的步驟。' },
    duck: { name: '啾啾鴨', message: '啾啾：把你的發現，說給大家聽！' },
    otter: { name: '波波水獺', message: '波波：先動手，再畫下你的想法。' }
  };
  const ink = '#554537';
  const drawings = {
    rabbit: `<g fill="#f6e8d6"><ellipse cx="43" cy="34" rx="11" ry="29" transform="rotate(-9 43 34)"/><ellipse cx="77" cy="34" rx="11" ry="29" transform="rotate(9 77 34)"/><ellipse cx="60" cy="111" rx="25" ry="25"/><ellipse cx="42" cy="137" rx="14" ry="7"/><ellipse cx="79" cy="137" rx="14" ry="7"/><ellipse cx="60" cy="76" rx="33" ry="29"/></g><g fill="#e8b8b0" stroke="none"><ellipse cx="43" cy="31" rx="5" ry="18" transform="rotate(-9 43 31)"/><ellipse cx="77" cy="31" rx="5" ry="18" transform="rotate(9 77 31)"/></g><ellipse cx="60" cy="116" rx="15" ry="17" fill="#fff8eb" stroke="none"/><path class="animal-paw" d="M37 103q-18-10-17 3 2 13 19 10" fill="#f6e8d6"/><path d="M82 103q15 2 14 10-3 10-16 4" fill="#f6e8d6"/>`,
    fox: `<g class="animal-tail"><path d="M82 120q42 9 32-40-18 2-23 24" fill="#df8f4e"/><path d="M114 80q5 22-1 29l-9-7-7 4q4-19 17-26Z" fill="#fff5df"/></g><path d="M41 85q-17 45 19 53 35-6 19-53" fill="#df8f4e"/><path d="m47 98 13 5 13-5-3 30H50Z" fill="#fff5df" stroke="none"/><g fill="#df8f4e"><path d="m27 60-4-43 29 23M69 40l27-23-4 43"/><path d="M26 54q34-30 68 0l-3 29-31 20-31-20Z"/></g><path d="m29 67 31 17 31-17-4 16-27 18-27-18Z" fill="#fff5df"/><path class="animal-paw" d="m39 105-13 10 8 8" fill="none" stroke-width="9" stroke="#df8f4e"/><path d="m79 105 9 15" fill="none" stroke-width="9" stroke="#df8f4e"/>`,
    bear: `<g fill="#be936e"><circle cx="34" cy="37" r="15"/><circle cx="87" cy="37" r="15"/><ellipse cx="60" cy="110" rx="29" ry="29"/><ellipse cx="39" cy="136" rx="15" ry="9"/><ellipse cx="82" cy="136" rx="15" ry="9"/><ellipse cx="60" cy="67" rx="34" ry="31"/></g><g fill="#ebcfaa" stroke="none"><circle cx="34" cy="37" r="7"/><circle cx="87" cy="37" r="7"/><ellipse cx="60" cy="117" rx="18" ry="19"/><ellipse cx="60" cy="80" rx="16" ry="11"/></g><path class="animal-paw" d="M35 105q-19-12-20 0 0 14 20 13" fill="#be936e"/><path d="M87 103q14 0 13 13-2 11-14 5" fill="#be936e"/>`,
    cat: `<path class="animal-tail" d="M83 123q29 5 28-19-1-14-11-9" fill="none" stroke="#d6a16a" stroke-width="13"/><g fill="#e5bc85"><ellipse cx="60" cy="112" rx="27" ry="27"/><ellipse cx="41" cy="137" rx="14" ry="7"/><ellipse cx="79" cy="137" rx="14" ry="7"/><path d="m27 61-2-38 27 18h16l27-18-2 38q9 36-33 38-42-2-33-38Z"/></g><path d="m32 49-1-16 15 10m28 0 15-10-1 16" fill="#e7a2a0" stroke="none"/><path d="M51 43v9m18-9v9m-9-13v12" stroke="#bb8759" stroke-width="4"/><path d="m34 79-17-3m18 11-17 3m68-11 17-3m-18 11 17 3" stroke-width="2"/><ellipse cx="60" cy="118" rx="16" ry="16" fill="#fff2d8" stroke="none"/><path class="animal-paw" d="M35 105q-16 0-16 10 0 11 18 7" fill="#e5bc85"/>`,
    owl: `<path d="m33 112-9-76 21 12q15-8 30 0l22-12-9 77q-27 34-55-1Z" fill="#9a8b80"/><path d="M34 67q10-19 26-4 15-15 27 4v27q-24 30-51 0Z" fill="#fff0cc" stroke="none"/><path class="animal-wing animal-wing-left" d="M30 75Q3 77 13 111q17 6 22-8" fill="#7d716a"/><path class="animal-wing animal-wing-right" d="M91 75q27 2 17 36-17 6-22-8" fill="#7d716a"/><g fill="#e3b364"><path d="m42 135-10 4m10-4 9 4m23-4-10 4m10-4 9 4" stroke-width="4"/><path d="m54 84 6 9 7-9Z"/></g><path d="m48 112 5 5 6-5m6 9 5 5 6-5" stroke="#e7d4b2" fill="none"/>`,
    hedgehog: `<path d="m16 91-7-16 14-3-2-17 17 2 6-16 15 8 13-13 10 15 18-4 3 19 17 6-8 16 10 14-16 9 1 18-19-1-9 15-15-8-16 8-10-15-18 1 1-17Z" fill="#97745c"/><path d="M27 95q0-38 34-37 31 0 34 37 4 41-34 42-37-1-34-42Z" fill="#ead0a8"/><ellipse cx="61" cy="105" rx="18" ry="16" fill="#fae8c9" stroke="none"/><path d="M35 135h15m25 0h14" stroke-width="8"/><path class="animal-paw" d="m32 105-10 7 9 9" fill="#ead0a8" stroke-width="6"/>`,
    panda: `<g fill="#4c5350"><circle cx="34" cy="36" r="15"/><circle cx="88" cy="36" r="15"/><ellipse cx="40" cy="137" rx="14" ry="8"/><ellipse cx="81" cy="137" rx="14" ry="8"/></g><ellipse cx="60" cy="112" rx="28" ry="29" fill="#faf4e8"/><ellipse cx="60" cy="67" rx="35" ry="32" fill="#faf4e8"/><g fill="#4c5350" stroke="none"><ellipse cx="44" cy="69" rx="10" ry="13" transform="rotate(25 44 69)"/><ellipse cx="77" cy="69" rx="10" ry="13" transform="rotate(-25 77 69)"/></g><path class="animal-paw" d="M35 105q-19-11-20 1 0 13 20 13" fill="#4c5350"/><path d="M87 104q15 1 12 15-1 9-14 5" fill="#4c5350"/>`,
    duck: `<ellipse cx="60" cy="141" rx="42" ry="5" fill="#b7e0e1" stroke="none"/><path class="animal-tail" d="m84 113 22-13-7 24-21 5" fill="#efd078"/><ellipse cx="59" cy="113" rx="32" ry="25" fill="#efd078"/><circle cx="59" cy="65" r="30" fill="#f5d991"/><path d="M49 37q-9-16 1-16 9 1 10 15m0 0q2-15 10-12 7 6-3 14" fill="#f5d991"/><ellipse cx="59" cy="83" rx="17" ry="8" fill="#de9a4f"/><path class="animal-wing" d="M40 109q-23 5-10 18 17 8 25-7" fill="#e1b95f"/><g fill="#d9954b"><path d="m40 135-10 8h23l-4-8Zm31 0-3 8h22l-11-8Z"/></g>`,
    otter: `<path class="animal-tail" d="M80 127q40 20 35 2-24-3-29-18" fill="#9f7d62"/><g fill="#ae8b6c"><circle cx="33" cy="46" r="11"/><circle cx="87" cy="46" r="11"/><ellipse cx="60" cy="112" rx="27" ry="29"/><ellipse cx="41" cy="137" rx="13" ry="7"/><ellipse cx="80" cy="137" rx="13" ry="7"/><ellipse cx="60" cy="72" rx="35" ry="27"/></g><ellipse cx="60" cy="84" rx="23" ry="13" fill="#e9d2af" stroke="none"/><ellipse cx="60" cy="113" rx="17" ry="18" fill="#e9d2af" stroke="none"/><path d="m36 81-15-2m16 9-16 3m63-10 15-2m-16 9 16 3" stroke-width="2"/><path d="M44 116q15-19 30-1l-2 13H46Z" fill="#c6dce1"/><path class="animal-paw" d="m33 110 12 12m41-12-13 12" stroke="#ae8b6c" stroke-width="10"/>`
  };
  function character(type) {
    const key = drawings[type] ? type : 'rabbit';
    const eyes = key === 'panda'
      ? '<circle cx="46" cy="68" r="4" fill="#fff"/><circle cx="75" cy="68" r="4" fill="#fff"/><circle cx="47" cy="68" r="2"/><circle cx="76" cy="68" r="2"/>'
      : key === 'owl'
        ? '<circle cx="45" cy="76" r="10" fill="#fffdf4"/><circle cx="77" cy="76" r="10" fill="#fffdf4"/><circle cx="46" cy="76" r="4"/><circle cx="76" cy="76" r="4"/>'
        : `<circle cx="46" cy="${key === 'rabbit' ? 73 : 67}" r="3.5"/><circle cx="75" cy="${key === 'rabbit' ? 73 : 67}" r="3.5"/>`;
    const noseY = key === 'rabbit' ? 84 : key === 'hedgehog' ? 91 : 78;
    const mouth = ['duck','owl'].includes(key) ? '' : `<path d="m55 ${noseY} 5 4 5-4Z" fill="#554537"/><path d="m60 ${noseY+4}v4m-8-1q8 10 16 0" fill="none"/>`;
    return `<svg class="animal-character storybook-character" viewBox="0 0 120 150" aria-hidden="true" focusable="false"><ellipse cx="60" cy="143" rx="32" ry="5" fill="#345e33" opacity=".16"/><g class="animal-body" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${drawings[key]}<g class="animal-eyes" fill="${ink}" stroke="none">${eyes}</g>${mouth}</g></svg>`;
  }
  window.AnimalGarden = { character };
  document.addEventListener('DOMContentLoaded', () => {
    const garden = document.getElementById('animal-garden');
    if (!garden) return;
    garden.innerHTML = Object.entries(friends).map(([type, friend], i) => `<button type="button" class="animal-friend animal-${type}" data-animal="${type}" style="--order:${i}" aria-label="聽${friend.name}的小提醒" title="點擊聽${friend.name}說話">${character(type)}</button>`).join('');
    const speech = document.getElementById('storybook-speech');
    garden.addEventListener('click', event => {
      const friend = event.target.closest('[data-animal]');
      if (!friend) return;
      garden.querySelectorAll('.is-cheering').forEach(item => item.classList.remove('is-cheering'));
      friend.classList.add('is-cheering');
      const message = friends[friend.dataset.animal].message;
      speech.textContent = message;
      window.spEdAudio?.speak(message);
    });
    garden.addEventListener('animationend', event => {
      if (event.animationName === 'animal-cheer') event.target.closest('.animal-friend')?.classList.remove('is-cheering');
    });
    const gather = document.getElementById('storybook-greet');
    gather?.addEventListener('click', () => {
      const assembled = garden.classList.toggle('is-gathered');
      gather.setAttribute('aria-pressed', String(assembled));
      gather.querySelector('span').textContent = assembled ? '自由探索' : '夥伴集合';
      speech.textContent = assembled ? '動物小隊集合完畢！慢慢把數學玩懂。' : '出發！點點小動物，聽聽牠們的小提醒。';
    });
  });
})();
