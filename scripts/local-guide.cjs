#!/usr/bin/env node
// 使用手冊、原稿與截圖只存在 Git 排除目錄；此程式只檢查本機版本。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { copyPdf } = require('./local-pdf-copy.cjs');
const ROOT = path.resolve(__dirname, '..');
const RELATIVE_PDF = 'output/pdf/數學慢慢懂_網站使用手冊.pdf';
const RELATIVE_SUBMISSION_PDF = '參賽資料/數學慢慢懂，來玩數學吧！_網站使用手冊.pdf';
const PRIVATE_DIR = 'Codex/website-guide';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || ['node_modules', '__pycache__'].includes(e.name)) return [];
    const file = path.join(dir, e.name);
    return e.isDirectory() ? walk(file) : e.isFile() ? [file] : [];
  });
}
function siteSources(root = ROOT) {
  const files = fs.readdirSync(root).filter(f => /\.(html|css|js|svg|webmanifest)$/.test(f)).map(f => path.join(root, f));
  for (const dir of ['assets', 'audio', 'css', 'js', 'games', 'islands']) files.push(...walk(path.join(root, dir)));
  return Object.fromEntries(files.filter(f => !/\.(log|tmp|bak|pyc)$/.test(f)).sort().map(f => [path.relative(root, f).split(path.sep).join('/'), sha(f)]));
}
function inputHashes(root = ROOT) {
  const here = path.join(root, PRIVATE_DIR);
  const files = ['build_guide.py', 'guide-content.json', 'capture-review.json', 'verify_guide_sync.py'].map(f => path.join(here, f));
  files.push(...walk(path.join(here, 'screenshots')));
  return Object.fromEntries(files.sort().map(f => [path.relative(here, f).split(path.sep).join('/'), sha(f)]));
}
function checkCaptureReview(root = ROOT) {
  const here = path.join(root, PRIVATE_DIR), review = read(path.join(here, 'capture-review.json'));
  if (!same(siteSources(root), review.site_sources)) throw Error('網站已更新：請覆核導覽原稿並重拍／覆核受影響的實際截圖，再重製使用手冊。');
  if (!Object.keys(review.screenshots || {}).length) throw Error('手冊尚無實際截圖覆核紀錄。');
  for (const [name, item] of Object.entries(review.screenshots)) {
    if (path.basename(name) !== name || sha(path.join(here, 'screenshots', name)) !== item.sha256) throw Error('截圖覆核已過期，請重新確認。');
  }
  return review;
}
function verify(root = ROOT) {
  const here = path.join(root, PRIVATE_DIR), review = checkCaptureReview(root);
  const release = read(path.join(here, 'guide-release.json'));
  if (release.pdf !== RELATIVE_PDF || !same(release.inputs, inputHashes(root))) throw Error('手冊原稿或截圖已更新，請重製 PDF。');
  if (!same(release.site_sources, review.site_sources) || sha(path.join(root, RELATIVE_PDF)) !== release.pdf_sha256) throw Error('使用手冊 PDF 與網站／核定版本不一致。');
  const qa = read(path.join(here, 'qa-review.json'));
  if (qa.status !== 'PASS' || qa.pdf_sha256 !== release.pdf_sha256 || qa.pages !== release.pages || qa.reviewed_pages?.length !== release.pages || new Set(qa.reviewed_pages).size !== release.pages || !qa.reviewed_pages.every(p => Number.isInteger(p) && p >= 1 && p <= release.pages)) throw Error('手冊重製後尚未完成逐頁視覺檢查。');
  return { pages: release.pages, screenshots: Object.keys(review.screenshots).length, sources: Object.keys(review.site_sources).length };
}
function syncSubmissionCopy(root = ROOT) {
  copyPdf(path.join(root, RELATIVE_PDF), path.join(root, RELATIVE_SUBMISSION_PDF));
}
function verifyAndSync(root = ROOT) {
  const info = verify(root);
  syncSubmissionCopy(root);
  return info;
}
function main() {
  if (process.argv.includes('--snapshot')) { console.log(JSON.stringify(siteSources())); return; }
  if (process.argv.includes('--review-check')) { console.log(JSON.stringify(checkCaptureReview())); return; }
  if (process.argv.includes('--build')) {
    const builder = path.join(ROOT, PRIVATE_DIR, 'build_guide.py');
    if (!fs.existsSync(builder)) throw Error('本機使用手冊原稿不存在，請先取得或建立本機私有手冊；不會從網站下載。');
    const python = process.env.GUIDE_PDF_PYTHON || path.join(ROOT, 'Codex/pdf-venv/bin/python');
    const result = spawnSync(python, [builder], { cwd: ROOT, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw Error('手冊產製未完成，請檢查本機 Python 與版面；不會沿用舊版推送。');
    syncSubmissionCopy();
    console.log('PDF 已重製並同步至參賽資料；請完成逐頁視覺檢查後執行 npm run manual:check。');
    return;
  }
  if (process.argv.includes('--pre-push')) {
    const refs = fs.readFileSync(0, 'utf8').trim().split('\n').filter(Boolean).map(l => l.split(/\s+/));
    if (!refs.some(r => r[2] === 'refs/heads/main' && !/^0+$/.test(r[1]))) return;
    const localGuideExists = fs.existsSync(path.join(ROOT, PRIVATE_DIR));
    const required = spawnSync('git', ['config', '--bool', '--get', 'localGuide.required'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim() === 'true';
    if (required && !localGuideExists) throw Error('此裝置的使用手冊資料已遺失，請恢復本機原稿並同步 PDF 後再發布。');
    // 新副本沒有本機私有出版品時，不假定其存在；此裝置已有手冊則必須通過。
    if (!localGuideExists) { console.log('此工作副本沒有本機使用手冊，未執行私有出版品檢查。'); return; }
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    if (refs.some(r => r[2] === 'refs/heads/main' && !/^0+$/.test(r[1]) && r[1] !== head)) throw Error('只檢查目前審查中的發布提交。');
    const dirty = spawnSync('git', ['diff', 'HEAD', '--name-only', '--', '*.html', '*.css', '*.js', '*.svg', 'assets', 'audio', 'css', 'js', 'games', 'islands'], { cwd: ROOT, encoding: 'utf8' });
    if (dirty.status !== 0 || dirty.stdout.trim()) throw Error('網站仍有未提交修改，請完成手冊同步與提交後再推送。');
  }
  const info = verifyAndSync();
  console.log(`PASS：本機使用手冊 ${info.pages} 頁、${info.screenshots} 張實際截圖、${info.sources} 個網站來源與逐頁覆核版本一致；參賽資料副本已同步。`);
}
if (require.main === module) { try { main(); } catch (e) { console.error(e.code === 'ENOENT' ? '本機手冊同步資料缺少，請重製並完成覆核。' : e.message); process.exitCode = 1; } }
module.exports = { RELATIVE_PDF, RELATIVE_SUBMISSION_PDF, PRIVATE_DIR, sha, siteSources, inputHashes, checkCaptureReview, verify, verifyAndSync };
