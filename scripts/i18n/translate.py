"""Optional, build-time translation of public display copy. Browsers use the local catalog.

Run extract.cjs first. Existing translations are cached; --refresh is never automatic.
No browser/student data or executable source is sent to the translation service.
"""
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'Codex/i18n-translation-cache.json'
inventory = json.loads((ROOT / 'Codex/i18n-inventory.json').read_text())
published = ROOT / 'js/i18n-en.js'
cache = json.loads(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(require(process.argv[1])))',str(published)])) if published.exists() else {}
if CACHE.exists():
    cache.update(json.loads(CACHE.read_text()))
pending = [e['source'] for e in inventory if e['source'] not in cache]
batches, batch = [], []
for source in pending:
    candidate = batch + [source]
    if batch and len(urllib.parse.urlencode([('q', s) for s in candidate])) > 6500:
        batches.append(batch)
        batch = []
    batch.append(source)
if batch:
    batches.append(batch)

def translate(texts):
    params = [('client', 'dict-chrome-ex'), ('sl', 'zh-TW'), ('tl', 'en')]
    url = 'https://translate.googleapis.com/translate_a/t?' + urllib.parse.urlencode(params + [('q', s) for s in texts])
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'MathToolkit-localization-build'})
            result = json.load(urllib.request.urlopen(request, timeout=45))
            if not isinstance(result, list) or len(result) != len(texts) or not all(isinstance(s, str) for s in result):
                raise ValueError('Unexpected translation response')
            for source, target in zip(texts, result):
                if sorted(re.findall(r'⟦[^⟧]*⟧', source)) != sorted(re.findall(r'⟦[^⟧]*⟧', target)):
                    # A damaged interpolation must never enter a published template.
                    target = source
                cache[source] = target
            return len(texts)
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)

print(json.dumps({'missing':len(pending), 'batches':len(batches)}), flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    completed = 0
    for future in concurrent.futures.as_completed([pool.submit(translate, b) for b in batches]):
        completed += future.result()
        CACHE.write_text(json.dumps(dict(cache), ensure_ascii=False, indent=2))
        if completed % 100 < 25:
            print(json.dumps({'translated': completed, 'total':len(pending)}), flush=True)
print(json.dumps({'cached':len(cache)}), flush=True)
