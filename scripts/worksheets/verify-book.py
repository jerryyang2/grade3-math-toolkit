from pathlib import Path
import json,re,subprocess,hashlib
from pypdf import PdfReader
from reportlab.pdfbase.ttfonts import TTFont
ROOT=Path(__file__).resolve().parents[2]
pdf=ROOT/'output/pdf/數學慢慢懂_三上學習單彙整_36份.pdf'
manifest=json.loads((ROOT/'Codex/worksheet-book-manifest.json').read_text())
sheets=json.loads((ROOT/'tmp/pdfs/worksheets.json').read_text())
r=PdfReader(pdf)
assert len(r.pages)==manifest['pages']
assert manifest['worksheets']==len(sheets)==36
normalize=lambda s:re.sub(r'\s+','',s.replace('➔','→'))
texts=[p.extract_text() for p in r.pages]
count=0
for record,sheet in zip(manifest['sheets'],sheets):
    text=normalize(''.join(texts[record['start']-1:record['end']]))
    assert [q['id'] for q in record['questions']]==[p['id'] for p in sheet['problems']],sheet['id']
    assert len(re.findall(r'第\s*\d+\s*題',''.join(texts[record['start']-1:record['end']])))==10,sheet['id']
    for p in sheet['problems']:
        assert normalize(p['question']) in text,(sheet['id'],p['id'],'missing question')
        assert all(normalize(o) in text for o in p['options']),(sheet['id'],p['id'],'missing option')
        count+=1
    for q in record['questions']:
        assert q['x']>=28.34 and q['x']+q['width']<=float(r.pages[0].mediabox.width)-28.34
        assert q['bottom']>=28.34 and q['top']<=float(r.pages[0].mediabox.height)-28.34
for page in r.pages:
    assert abs(float(page.mediabox.width)-595.2756)<.1
    assert abs(float(page.mediabox.height)-841.8898)<.1
assert count==360
alltext=''.join(texts)+str(r.metadata)
assert not re.search(r'output/artifacts',alltext)
assert '\x00' not in alltext
assert all('數學慢慢懂' not in text for text in texts[1:])
assert '點選小節名稱或 PDF 書籤可跳頁' not in alltext
assert '三年級上學期數學｜學習單彙編' not in alltext
assert not re.search(r'(?m)^計算區$', '\n'.join(texts[3:]))
fontpath=next(Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8').glob('*/AssetData/Kaiti.ttc'))
kai=TTFont('CheckKai',str(fontpath),subfontIndex=2).face.charWidths
chars=set(''.join(normalize(p['question']+''.join(p['options'])) for s in sheets for p in s['problems']))
missing=[ch for ch in chars if ord(ch) not in kai]
assert not missing,missing
outlines=[]
def walk(entries,level=0):
    for entry in entries:
        if isinstance(entry,list):walk(entry,level+1)
        else:outlines.append((entry.title,r.get_destination_page_number(entry)+1,level))
walk(r.outline)
children=[entry for entry in outlines if entry[2]==1]
assert len(children)==36
assert [(entry[0],entry[1]) for entry in children]==[(s['title'],s['start']) for s in manifest['sheets']]
toc_links=sum(1 for page in r.pages[1:3] for annotation in page.get('/Annots',[]) if annotation.get_object().get('/Subtype')=='/Link')
assert toc_links==36
assert len(re.findall(r'第\s*\d+\s*題',''.join(texts)))==360
assert subprocess.run(['git','check-ignore','-q',str(pdf.relative_to(ROOT))],cwd=ROOT).returncode==0
assert not subprocess.check_output(['git','ls-files','--','output/pdf/','tmp/pdfs/','Codex/'],cwd=ROOT).strip()
result={'status':'PASS','pages':len(r.pages),'worksheets':36,'questions':count,'a4':True,
        'all_question_text_and_options_present':True,'anonymous_metadata':True,'font_coverage':True,
        'worksheet_bookmarks':len(children),'toc_links':toc_links,'excluded_from_git':True,
        'pdf_sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),
        'over_two_pages':manifest['over_two_pages'],
        'source_sha256':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in json.loads((ROOT/'scripts/worksheets/sources.json').read_text())}}
(ROOT/'Codex/worksheet-book-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
