#!/usr/bin/env node
// 共用同一份推送 refs，保留既有學習單同步，再檢查本機使用手冊。
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const refs = fs.readFileSync(0);
for (const file of ['sync-worksheet-pdf.cjs', 'local-guide.cjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file), '--pre-push', ...process.argv.slice(2)], { input: refs, stdio: ['pipe', 'inherit', 'inherit'] });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
