/* 以程式繪製的皮克敏同人圖形；裝飾互動不會變更學習紀錄或獎勵。 */
(function () {
  'use strict';
  const types = {
    red: { name: '紅色皮克敏', color: '#e95d4e', shade: '#bd3c39', message: '紅色皮克敏：先數清楚，再往前走！' },
    yellow: { name: '黃色皮克敏', color: '#f3cf55', shade: '#c69a30', message: '黃色皮克敏：找到重要的數字了嗎？' },
    blue: { name: '藍色皮克敏', color: '#64a9df', shade: '#3779b5', message: '藍色皮克敏：換個方法，也能找到答案。' },
    purple: { name: '紫色皮克敏', color: '#a17bb8', shade: '#79548f', message: '紫色皮克敏：一步一步，我陪你慢慢想。' },
    white: { name: '白色皮克敏', color: '#faf2dc', shade: '#c6bca3', message: '白色皮克敏：仔細看看，線索藏在哪裡？' },
    rock: { name: '岩石皮克敏', color: '#838e91', shade: '#526166', message: '岩石皮克敏：用積木排一排，想法更清楚。' },
    winged: { name: '羽翅皮克敏', color: '#ed9ec1', shade: '#c8709b', message: '羽翅皮克敏：從圖畫裡，找找新的發現！' },
    ice: { name: '冰皮克敏', color: '#a8e5e8', shade: '#5eacbe', message: '冰皮克敏：停一下，檢查剛剛的步驟。' },
    glow: { name: '光皮克敏', color: '#c5e886', shade: '#88b451', message: '光皮克敏：你的小發現，也會閃閃發亮。' }
  };
  function character(type) {
    const kind = types[type] || types.red;
    const chunky = type === 'purple';
    const rocky = type === 'rock' || type === 'ice';
    const flower = ['purple', 'white', 'winged', 'glow'].includes(type);
    const face = rocky ? '<path d="M27 55 42 43 65 46 78 64 70 84 48 91 28 78Z"/>' : `<ellipse cx="50" cy="65" rx="${chunky ? 25 : 20}" ry="22"/>`;
    const body = rocky ? '<path d="m39 83 26 1 6 26-18 10-19-11Z"/>' : `<path d="M42 82C${chunky ? '16 105 26 128 51 125 78 126 86 104 59 82' : '32 104 35 117 50 119 66 117 68 104 58 82'}Z"/>`;
    const ears = type === 'yellow' ? '<path d="M33 54 9 37l10 29 14 5m34-17 24-17-10 29-14 5"/>' : '';
    const purpleHair = chunky ? '<path d="m34 47-6-9m16 6-2-11m17 12 4-11m9 17 8-8" fill="none" stroke-width="3"/>' : '';
    const nose = type === 'red' ? '<path d="m63 65 24 7-25 5Z"/>' : '';
    const mouth = type === 'blue' ? '<path d="M43 78q7-8 15 0" fill="#315f9c" stroke="#315f9c" stroke-width="2"/>' : '';
    const wings = type === 'winged' ? '<g class="pik-wing pik-wing-left"><ellipse cx="22" cy="83" rx="17" ry="8" transform="rotate(32 22 83)"/></g><g class="pik-wing pik-wing-right"><ellipse cx="78" cy="83" rx="17" ry="8" transform="rotate(-32 78 83)"/></g>' : '';
    const petals = flower ? '<g fill="#fff9df" stroke="#afab89" stroke-width=".8"><ellipse cx="57" cy="10" rx="5" ry="8"/><ellipse cx="64" cy="17" rx="8" ry="5"/><ellipse cx="61" cy="25" rx="5" ry="7"/><ellipse cx="51" cy="25" rx="5" ry="7"/><ellipse cx="48" cy="17" rx="8" ry="5"/><circle cx="56" cy="18" r="5" fill="#f0ce62"/></g>' : '<path d="M51 26Q48 3 77 10 73 31 51 26Z" fill="#87b95b" stroke="#4b783c"/><path d="m51 26 19-12" fill="none" stroke="#4b783c"/>';
    return `<svg class="pikmin-character storybook-character" viewBox="0 0 100 150" aria-hidden="true" focusable="false"><ellipse class="pik-shadow" cx="50" cy="139" rx="24" ry="5" fill="#264f2e" opacity=".18"/><g class="pik-figure" stroke="${kind.shade}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><g class="pik-sprout"><path d="M50 46Q42 31 55 20" stroke="#5e8e43" stroke-width="3" fill="none"/>${petals}</g><g fill="#e6f4e1" stroke="#b3d6b5" opacity=".85">${wings}</g><g fill="${kind.color}">${ears}${purpleHair}${body}${face}${nose}</g>${rocky ? '<path d="m28 59 20 6 17-18m-17 18 2 24m-1-24 27 0" fill="none" stroke="#ffffff" opacity=".28"/>' : '<ellipse cx="43" cy="57" rx="8" ry="5" fill="#fff" stroke="none" opacity=".18"/>'}<g class="pik-eyes" stroke="none"><ellipse cx="42" cy="65" rx="6" ry="8" fill="#fffdf5"/><ellipse cx="59" cy="65" rx="6" ry="8" fill="#fffdf5"/><ellipse cx="44" cy="66" rx="2.7" ry="4.7" fill="${type === 'white' ? '#d25456' : '#293b37'}"/><ellipse cx="61" cy="66" rx="2.7" ry="4.7" fill="${type === 'white' ? '#d25456' : '#293b37'}"/></g>${mouth}<g fill="none" stroke="${kind.color}" stroke-width="5"><path class="pik-arm pik-arm-left" d="m39 94-14 14-7-8"/><path class="pik-arm pik-arm-right" d="m62 94 14 10 7-10"/><path class="pik-leg pik-leg-left" d="m44 116-7 17-7 2"/><path class="pik-leg pik-leg-right" d="m57 116 6 17 8 2"/></g></g></svg>`;
  }
  window.PikminGarden = { character };
  document.addEventListener('DOMContentLoaded', () => {
    const garden = document.getElementById('pikmin-garden');
    if (!garden) return;
    garden.innerHTML = Object.entries(types).map(([type, kind], i) => `<button type="button" class="pikmin-friend pikmin-${type}" data-pikmin="${type}" style="--order:${i}" aria-label="和${kind.name}打招呼" title="${kind.name}">${character(type)}</button>`).join('');
    const speech = document.getElementById('storybook-speech');
    garden.addEventListener('click', event => {
      const friend = event.target.closest('[data-pikmin]');
      if (!friend) return;
      garden.querySelectorAll('.is-cheering').forEach(item => item.classList.remove('is-cheering'));
      friend.classList.add('is-cheering');
      speech.textContent = types[friend.dataset.pikmin].message;
    });
    garden.addEventListener('animationend', event => {
      if (event.animationName === 'pikmin-cheer') event.target.closest('.pikmin-friend')?.classList.remove('is-cheering');
    });
    const gather = document.getElementById('storybook-greet');
    gather?.addEventListener('click', () => {
      const assembled = garden.classList.toggle('is-gathered');
      gather.setAttribute('aria-pressed', String(assembled));
      gather.querySelector('span').textContent = assembled ? '自由探索' : '吹哨集合';
      speech.textContent = assembled ? '小隊集合完畢！一起把數學玩懂。' : '出發！點點皮克敏，聽聽它們的小提醒。';
    });
  });
})();
