#!/usr/bin/env node
// 參賽原稿、產製設定與所有 PDF 都只存在 Git 排除目錄。
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { sha, verifyAndSync: verifyGuide } = require('./local-guide.cjs');
const { copyPdf } = require('./local-pdf-copy.cjs');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = '參賽原稿/一起把數學玩懂_作品說明書.txt';
const WORD = '參賽原稿/一起把數學玩懂_作品說明書.docx';
const PDF = 'output/pdf/一起把數學玩懂_作品說明書.pdf';
const SUBMISSION_PDF = '參賽資料/一起把數學玩懂_作品說明書.pdf';
const PRIVATE = 'Codex/submission';
const INPUTS = [SOURCE, 'Codex/contest-description-20261101/build_document.py', 'Codex/submission/build_submission.py', 'Codex/contest-description-20261101/fonts.conf'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inputHashes = (root = ROOT) => Object.fromEntries(INPUTS.map(file => [file, sha(path.join(root, file))]));
function verify(root = ROOT) {
  const release = read(path.join(root, PRIVATE, 'release.json'));
  if (JSON.stringify(inputHashes(root)) !== JSON.stringify(release.inputs)) throw Error('參賽說明書 TXT 或製作檔已修改，請執行 npm run submission:pdf，並完成 PDF 逐頁覆核。');
  if (sha(path.join(root, PDF)) !== release.pdf_sha256 || sha(path.join(root, WORD)) !== release.word_sha256) throw Error('參賽說明書產製檔已變更，請重新產製並覆核。');
  const qa = read(path.join(root, PRIVATE, 'qa-review.json'));
  const pages = release.pages;
  if (!Number.isInteger(pages) || pages < 1 || qa.status !== 'PASS' || qa.pdf_sha256 !== release.pdf_sha256 || qa.pages !== pages || qa.reviewed_pages?.length !== pages || new Set(qa.reviewed_pages).size !== pages || !qa.reviewed_pages.every(n => Number.isInteger(n) && n >= 1 && n <= pages)) throw Error('參賽說明書尚未完成新版 PDF 逐頁視覺覆核。');
  return { pages, characters: release.characters };
}
function verifyAndSync(root = ROOT) {
  const info = verify(root);
  copyPdf(path.join(root, PDF), path.join(root, SUBMISSION_PDF));
  return info;
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw Error('參賽資料同步未完成，請檢查產製與覆核結果。');
}
function syncCompanions() {
  if (fs.existsSync(path.join(ROOT, 'Codex/website-guide'))) verifyGuide(ROOT);
  const worksheet = 'output/pdf/一起把數學玩懂_三上學習單彙整_36份.pdf';
  if (fs.existsSync(path.join(ROOT, worksheet))) {
    run(process.execPath, [path.join(__dirname, 'sync-worksheet-pdf.cjs'), '--check']);
    copyPdf(path.join(ROOT, worksheet), path.join(ROOT, '參賽資料/一起把數學玩懂_三上學習單彙整_36份.pdf'));
  }
}
function watchSource(root = ROOT, options = {}) {
  const file = path.join(root, SOURCE);
  let digest = sha(file), timer, stopped = false, queue = Promise.resolve();
  const rebuild = options.rebuild || (() => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts/local-submission.cjs'), '--build'], { cwd: root, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(Error('說明書自動同步未完成，請檢查本機產製紀錄。')));
  }));
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(() => stopped ? undefined : rebuild()).catch(options.onError || (error => console.error(error.message)));
    }, options.delay ?? 1500);
  };
  const listener = () => {
    if (!fs.existsSync(file)) return;
    const next = sha(file);
    if (next !== digest) { digest = next; schedule(); }
  };
  fs.watchFile(file, { interval: options.interval ?? 1000 }, listener);
  try {
    if (read(path.join(root, PRIVATE, 'release.json')).inputs[SOURCE] !== digest) schedule();
  } catch (_) { schedule(); }
  return () => { stopped = true; clearTimeout(timer); fs.unwatchFile(file, listener); };
}
function main() {
  if (process.argv.includes('--watch')) { watchSource(); console.log('已監看說明書 TXT，儲存修改後會自動重製參賽 PDF。'); return; }
  const prePush = process.argv.includes('--pre-push');
  if (prePush) {
    const refs = fs.readFileSync(0, 'utf8').trim().split('\n').filter(Boolean).map(line => line.split(/\s+/));
    if (!refs.some(ref => ref[2] === 'refs/heads/main' && !/^0+$/.test(ref[1]))) return;
    if (!fs.existsSync(path.join(ROOT, SOURCE))) {
      if (fs.existsSync(path.join(ROOT, PRIVATE))) throw Error('參賽原稿已遺失，請恢復原稿再同步參賽 PDF。');
      return;
    }
  }
  if (process.argv.includes('--build')) {
    const config = read(path.join(ROOT, PRIVATE, 'runtime.json'));
    run(config.python, [path.join(ROOT, PRIVATE, 'build_submission.py')]);
    copyPdf(path.join(ROOT, PDF), path.join(ROOT, SUBMISSION_PDF));
    syncCompanions();
    console.log('參賽說明書已產製並同步；請覆核新版頁面，再執行 npm run submission:check。');
    return;
  }
  const info = verifyAndSync();
  syncCompanions();
  console.log(`PASS：參賽說明書 ${info.pages} 頁、${info.characters} 字，原稿與核定 PDF 一致；送件副本已同步。`);
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.code === 'ENOENT' ? '本機參賽原稿或產製資料缺少，請補齊並完成覆核。' : error.message); process.exitCode = 1; }
}
module.exports = { SOURCE, WORD, PDF, SUBMISSION_PDF, PRIVATE, INPUTS, inputHashes, verify, verifyAndSync, watchSource };
