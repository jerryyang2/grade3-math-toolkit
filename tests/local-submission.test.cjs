const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sha } = require('../scripts/local-guide.cjs');
const { SOURCE, WORD, PDF, SUBMISSION_PDF, PRIVATE, INPUTS, inputHashes, verifyAndSync, watchSource } = require('../scripts/local-submission.cjs');
const { setTimeout: pause } = require('node:timers/promises');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'math-submission-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
  for (const name of INPUTS) write(name, 'source fixture');
  write(WORD, 'word fixture'); write(PDF, '%PDF-1.7 reviewed');
  const release = { inputs: inputHashes(root), pages: 2, characters: 4900, pdf_sha256: sha(path.join(root, PDF)), word_sha256: sha(path.join(root, WORD)) };
  write(`${PRIVATE}/release.json`, JSON.stringify(release));
  write(`${PRIVATE}/qa-review.json`, JSON.stringify({ status: 'PASS', pages: 2, pdf_sha256: release.pdf_sha256, reviewed_pages: [1, 2] }));
  return { root, write, copy: path.join(root, SUBMISSION_PDF) };
}
test('submission folder receives the reviewed PDF and no editing source', t => {
  const f = fixture(t); assert.equal(verifyAndSync(f.root).pages, 2);
  assert.deepEqual(fs.readdirSync(path.dirname(f.copy)), [path.basename(PDF)]);
  assert.equal(sha(f.copy), sha(path.join(f.root, PDF)));
  f.write(SUBMISSION_PDF, '%PDF-1.7 outdated'); verifyAndSync(f.root);
  assert.equal(sha(f.copy), sha(path.join(f.root, PDF)));
});
test('editing the TXT stops release and does not replace the approved copy', t => {
  const f = fixture(t); verifyAndSync(f.root); const before = sha(f.copy);
  f.write(SOURCE, 'changed text');
  assert.throws(() => verifyAndSync(f.root), /TXT.*修改/);
  assert.equal(sha(f.copy), before);
});
test('changed PDFs and incomplete visual review cannot pass submission check', t => {
  const f = fixture(t); verifyAndSync(f.root); const before = sha(f.copy);
  f.write(`${PRIVATE}/qa-review.json`, JSON.stringify({ status: 'PASS', pages: 2, pdf_sha256: sha(path.join(f.root, PDF)), reviewed_pages: [1, 1] }));
  assert.throws(() => verifyAndSync(f.root), /逐頁視覺覆核/);
  assert.equal(sha(f.copy), before);
  f.write(PDF, '%PDF-1.7 changed');
  assert.throws(() => verifyAndSync(f.root), /產製檔已變更/);
});
test('saving the editing source automatically rebuilds the latest version and keeps watching after failures', async t => {
  const f = fixture(t), built = [], errors = [];
  let fail = true;
  const stop = watchSource(f.root, { interval: 10, delay: 35, rebuild: async () => {
    if (fail) { fail = false; throw Error('temporary failure'); }
    built.push(fs.readFileSync(path.join(f.root, SOURCE), 'utf8'));
  }, onError: error => errors.push(error.message) });
  t.after(stop);
  f.write(SOURCE, 'first edit');
  for (let i = 0; i < 40 && !errors.length; i++) await pause(15);
  assert.deepEqual(errors, ['temporary failure']);
  f.write(SOURCE, 'intermediate draft'); await pause(15);
  f.write(SOURCE, 'latest saved draft');
  for (let i = 0; i < 40 && !built.length; i++) await pause(15);
  assert.deepEqual(built, ['latest saved draft']);
});
