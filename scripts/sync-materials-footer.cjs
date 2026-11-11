#!/usr/bin/env node
// materials.html 是來源；首頁保留可直接閱讀的靜態副本。
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'materials.html'), 'utf8');
const { document } = parseHTML(source);
const main = document.querySelector('main');
if (!main || main.querySelector('script, iframe, form')) throw Error('教材來源頁的內容結構不符合首頁嵌入規則。');
main.querySelector('.materials-eyebrow')?.remove();
main.querySelector('h1')?.remove();
for (const old of main.querySelectorAll('h2')) {
  const heading = document.createElement('h3');
  heading.innerHTML = old.innerHTML;
  old.replaceWith(heading);
}
const content = main.innerHTML.trim().split('\n').map(line => '        ' + line.trim()).join('\n');
const start = '<!-- materials-home:start -->';
const end = '<!-- materials-home:end -->';
const block = `${start}\n    <details id="home-materials-notes" class="materials-home-details">\n      <summary><h2>教材來源與使用說明</h2><span class="materials-home-hint">點此展開／收合</span></summary>\n      <div class="materials-home-content">\n${content}\n      </div>\n    </details>\n    <p class="materials-separate-link"><a href="materials.html">另開完整說明頁</a></p>\n    ${end}`;
const file = path.join(root, 'index.html');
const original = fs.readFileSync(file, 'utf8');
const from = original.indexOf(start), to = original.indexOf(end);
if (from < 0 || to < from || original.indexOf(start, from + start.length) !== -1) throw Error('首頁缺少唯一的教材說明同步區塊。');
const expected = original.slice(0, from) + block + original.slice(to + end.length);
if (process.argv.includes('--check')) {
  if (original !== expected) throw Error('首頁說明與來源頁不同步，請執行 npm run materials:sync。');
  console.log('PASS：首頁完整說明與教材來源頁一致。');
} else {
  if (original !== expected) fs.writeFileSync(file, expected);
  console.log('已同步首頁最下方的完整教材來源說明。');
}
