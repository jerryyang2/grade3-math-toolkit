const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { RELATIVE_PDF, RELATIVE_SUBMISSION_PDF, PRIVATE_DIR, sha, siteSources, inputHashes, verify, verifyAndSync } = require('../scripts/local-guide.cjs');
const { spawnSync } = require('node:child_process');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'math-guide-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const here = path.join(root, PRIVATE_DIR);
  fs.mkdirSync(path.join(here, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.dirname(path.join(root, RELATIVE_PDF)), { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), '<main>Math lesson</main>');
  for (const file of ['build_guide.py', 'guide-content.json', 'verify_guide_sync.py']) fs.writeFileSync(path.join(here, file), 'fixture');
  const image = path.join(here, 'screenshots', 'lesson.jpg'); fs.writeFileSync(image, 'genuine capture fixture');
  const sources = siteSources(root);
  const write = (file, data) => fs.writeFileSync(path.join(here, file), JSON.stringify(data));
  write('capture-review.json', { site_sources: sources, screenshots: { 'lesson.jpg': { sha256: sha(image) } } });
  const pdf = path.join(root, RELATIVE_PDF); fs.writeFileSync(pdf, '%PDF-1.7 fixture');
  write('guide-release.json', { pages: 2, pdf: RELATIVE_PDF, pdf_sha256: sha(pdf), site_sources: sources, inputs: inputHashes(root) });
  write('qa-review.json', { status: 'PASS', pages: 2, pdf_sha256: sha(pdf), reviewed_pages: [1, 2] });
  return { root, here, pdf, image, write };
}
test('reviewed guide remains private and a changed lesson stops release', t => {
  const f = fixture(t); assert.equal(verify(f.root).pages, 2);
  fs.writeFileSync(path.join(f.root, 'index.html'), '<main>Changed lesson</main>');
  assert.throws(() => verify(f.root), /網站已更新/);
});
test('new visual assets require screenshot and content review', t => {
  const f = fixture(t); fs.mkdirSync(path.join(f.root, 'assets')); fs.writeFileSync(path.join(f.root, 'assets', 'new.svg'), '<svg/>');
  assert.throws(() => verify(f.root), /網站已更新/);
});
test('changed capture, content, and PDF cannot reuse a previous release', t => {
  const a = fixture(t); fs.appendFileSync(a.image, 'changed'); assert.throws(() => verify(a.root), /截圖覆核/);
  const b = fixture(t); fs.appendFileSync(path.join(b.here, 'guide-content.json'), 'changed'); assert.throws(() => verify(b.root), /重製 PDF/);
  const c = fixture(t); fs.appendFileSync(c.pdf, 'changed'); assert.throws(() => verify(c.root), /PDF 與/);
});
test('rebuilding without visual review, missing pages, or duplicate reviews stops release', t => {
  const f = fixture(t);
  for (const reviewed_pages of [[1], [1,1], [1,3]]) {
    f.write('qa-review.json', { status: 'PASS', pages: 2, pdf_sha256: sha(f.pdf), reviewed_pages });
    assert.throws(() => verify(f.root), /逐頁視覺檢查/);
  }
  fs.unlinkSync(f.image); assert.throws(() => verify(f.root));
});
test('reviewed guide recreates a missing submission copy and replaces an outdated copy', t => {
  const f = fixture(t), copy = path.join(f.root, RELATIVE_SUBMISSION_PDF);
  verifyAndSync(f.root); assert.equal(sha(copy), sha(f.pdf));
  fs.writeFileSync(copy, '%PDF-1.7 outdated');
  verifyAndSync(f.root); assert.equal(sha(copy), sha(f.pdf));
});
test('failed guide review cannot replace the submission copy', t => {
  const f = fixture(t), copy = path.join(f.root, RELATIVE_SUBMISSION_PDF);
  verifyAndSync(f.root);
  const before = sha(copy);
  f.write('qa-review.json', { status: 'FAIL', pages: 2, pdf_sha256: sha(f.pdf), reviewed_pages: [] });
  assert.throws(() => verifyAndSync(f.root), /逐頁視覺檢查/);
  assert.equal(sha(copy), before);
});
test('successful builds refresh the submission copy while failed builds preserve it', t => {
  const f = fixture(t), scripts = path.join(f.root, 'scripts');
  fs.mkdirSync(scripts);
  for (const file of ['local-guide.cjs', 'local-pdf-copy.cjs']) fs.copyFileSync(path.join(__dirname, '..', 'scripts', file), path.join(scripts, file));
  const builder = path.join(f.here, 'build_guide.py');
  fs.writeFileSync(builder, `require('node:fs').writeFileSync(${JSON.stringify(f.pdf)}, '%PDF-1.7 rebuilt');`);
  const build = () => spawnSync(process.execPath, [path.join(scripts, 'local-guide.cjs'), '--build'], { env: { ...process.env, GUIDE_PDF_PYTHON: process.execPath }, encoding: 'utf8' });
  assert.equal(build().status, 0);
  const copy = path.join(f.root, RELATIVE_SUBMISSION_PDF);
  assert.equal(fs.readFileSync(copy, 'utf8'), '%PDF-1.7 rebuilt');
  assert.throws(() => verify(f.root), /重製 PDF/);
  fs.writeFileSync(builder, 'process.exit(1);');
  assert.notEqual(build().status, 0);
  assert.equal(fs.readFileSync(copy, 'utf8'), '%PDF-1.7 rebuilt');
});

test('changing the shared publishing font helper requires a new guide and visual review', t => {
  const f = fixture(t), scripts = path.join(f.root, 'scripts');
  fs.mkdirSync(scripts);
  const helper = path.join(scripts, 'pdf_fonts.py');
  fs.writeFileSync(helper, 'reviewed font loader');
  const release = JSON.parse(fs.readFileSync(path.join(f.here, 'guide-release.json'), 'utf8'));
  release.inputs = inputHashes(f.root);
  f.write('guide-release.json', release);
  assert.equal(verify(f.root).pages, 2);
  fs.appendFileSync(helper, ' changed font');
  assert.throws(() => verify(f.root), /重製 PDF/);
});
