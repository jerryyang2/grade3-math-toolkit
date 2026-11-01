const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function copyPdf(source, target) {
  const contents = fs.readFileSync(source);
  if (contents.subarray(0, 5).toString('ascii') !== '%PDF-') throw Error('來源不是 PDF，未更新參賽副本。');
  const expected = crypto.createHash('sha256').update(contents).digest('hex');
  if (fs.existsSync(target) && sha(target) === expected) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, contents, { flag: 'wx' });
    if (sha(temporary) !== expected) throw Error('參賽 PDF 副本不完整，未替換原有副本。');
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
module.exports = { copyPdf };
