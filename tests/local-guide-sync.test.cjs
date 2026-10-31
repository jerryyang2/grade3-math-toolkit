const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { RELATIVE_PDF, PRIVATE_DIR, sha, siteSources, inputHashes, verify } = require('../scripts/local-guide.cjs');
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
  const pdf = path.join(root, RELATIVE_PDF); fs.writeFileSync(pdf, '%PDF fixture');
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
