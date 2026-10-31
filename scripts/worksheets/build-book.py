"""將網站現有的學習單資料整理為本機專用 PDF，不修改網站。"""
from pathlib import Path
from html import escape, unescape
from functools import lru_cache
from datetime import datetime
from zoneinfo import ZoneInfo
import json, math, re, subprocess
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/pdf/數學慢慢懂_三上學習單彙整_36份.pdf'
TMP = ROOT / 'tmp/pdfs'
subprocess.run(['node', str(ROOT/'scripts/worksheets/export-data.cjs')], check=True)
SHEETS = json.loads((TMP/'worksheets.json').read_text())
FONT_PATH = next(Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8').glob('*/AssetData/Kaiti.ttc'))
pdfmetrics.registerFont(TTFont('BookKai', str(FONT_PATH), subfontIndex=2))
pdfmetrics.registerFont(TTFont('BookHei', '/System/Library/Fonts/STHeiti Medium.ttc', subfontIndex=0))
pdfmetrics.registerFontFamily('BookKai', normal='BookKai', bold='BookHei')
pdfmetrics.registerFontFamily('BookHei', normal='BookHei', bold='BookHei')
W,H = A4
M = 10*mm
GAP = 6*mm
CW = (W-2*M-GAP)/2
TOP = H-M-77
BOTTOM = M+48
CAP = TOP-BOTTOM
INK = colors.HexColor('#173c30')
GRAY = colors.HexColor('#555555')
RULE = colors.HexColor('#999999')

def paragraph(text, size=14, font='BookKai', leading=None, color=colors.black):
    style = ParagraphStyle('text', fontName=font, fontSize=size, leading=leading or size*1.35,
                           wordWrap='CJK', textColor=color, allowWidows=0, allowOrphans=0)
    return Paragraph(escape(str(text).replace('➔','→')), style)

class Question:
    def __init__(self, p, number, review, profile):
        self.problem=p; self.number=number; self.parts=[]; self.w=CW;self.profile=profile
        inner=CW-4*mm
        def add(kind, value, height): self.parts.append((kind,value,height))
        add('heading',None,14)
        self.section_code=p['sectionTitle'].split(' ')[0] if review else ''
        para=paragraph(p['question']); _,height=para.wrap(inner,1000)
        add('paragraph',para,height+4)
        if p['svg']:
            # 高解析圖保留原 SVG 的繁體字、斜線填色與圖形比例。
            image=ImageReader(str(TMP/(p['id']+'.png')))
            iw,ih=image.getSize();scale=min(inner/iw,(profile['diagram_mm']*mm)/ih)
            add('diagram',(image,iw*scale,ih*scale),ih*scale+3)
        # 依實際排字寬度決定選項欄數，避免長數字被誤判成過長選項。
        half=(inner-7)/2
        columns=2 if all(paragraph(f'({"ABCD"[i]}) {o}',12).wrap(half,1000)[1]<=32.5 for i,o in enumerate(p['options'])) else 1
        ow=(inner-7)/columns
        options=[]
        for i,opt in enumerate(p['options']):
            para=paragraph(f'({"ABCD"[i]}) {opt}',12)
            _,height=para.wrap(ow,1000);options.append((para,height))
        rows=[]
        for i in range(0,len(options),columns):
            row=options[i:i+columns]; rows.append((row,max(h for _,h in row)+2))
        if profile['side_grid']:
            side_width=inner*.55-4
            side_options=[]
            for i,opt in enumerate(p['options']):
                para=paragraph(f'({"ABCD"[i]}) {opt}',12)
                _,h=para.wrap(side_width,1000);side_options.append((para,h+2))
            side_height=max(sum(h for _,h in side_options),profile['grid_mm']*mm+11)
            vertical_height=sum(h for _,h in rows)+profile['grid_mm']*mm+13
            if side_height<vertical_height:
                add('side-bottom',(side_options,inner*.55+3,inner*.45-3),side_height)
            else:
                add('label',None,10);add('grid',None,profile['grid_mm']*mm+3)
                add('options',(columns,ow,rows),sum(h for _,h in rows))
        else:
            add('label',None,10);add('grid',None,profile['grid_mm']*mm+3)
            add('options',(columns,ow,rows),sum(h for _,h in rows))
        self.height=3*mm+sum(h for _,_,h in self.parts)
        if self.height>CAP: raise ValueError('Question exceeds page capacity '+p['id'])

    def draw(self,c,x,y):
        top=y; inner=CW-4*mm; cursor=y-1.5*mm
        c.setStrokeColor(RULE);c.setLineWidth(.45)
        c.roundRect(x,y-self.height,CW,self.height,2.5,stroke=1,fill=0)
        left=x+2*mm
        for kind,value,height in self.parts:
            if kind=='heading':
                c.setFillColor(colors.black);c.setFont('BookHei',9.5 if self.section_code else 11)
                c.drawString(left,cursor-11,f'第 {self.number} 題'+(' · '+self.section_code if self.section_code else ''))
                c.setFont('BookHei',8.5)
                c.drawString(left+(80 if self.section_code else 47),cursor-10,['基礎觀念','熟練運算','生活應用'][self.problem['level']-1])
                c.setFont('BookHei',10);c.drawRightString(left+inner,cursor-11,'答：____')
            elif kind=='paragraph':
                value.drawOn(c,left,cursor-value.height)
            elif kind=='diagram':
                image,iw,ih=value
                c.drawImage(image,left+(inner-iw)/2,cursor-ih-2,width=iw,height=ih,mask='auto')
            elif kind=='label':
                c.setFillColor(GRAY);c.setFont('BookHei',8.5)
                c.drawString(left,cursor-9,'計算區（直式從右邊個位開始寫）')
            elif kind=='grid':
                grid_height=self.profile['grid_mm']*mm
                bottom=cursor-grid_height
                c.saveState();c.setStrokeColor(RULE);c.setLineWidth(.35);c.setDash(1,2)
                for j in range(7): c.line(left+j*inner/6,bottom,left+j*inner/6,cursor)
                for j in range(4): c.line(left,bottom+j*grid_height/3,left+inner,bottom+j*grid_height/3)
                c.restoreState()
            elif kind=='side-bottom':
                options,offset,gw=value;opt_y=cursor
                for para,ph in options:
                    para.drawOn(c,left,opt_y-para.height);opt_y-=ph
                gx=left+offset;gtop=cursor-11;gh=self.profile['grid_mm']*mm
                c.setFillColor(GRAY);c.setFont('BookHei',8);c.drawString(gx,cursor-8,'計算區')
                c.saveState();c.setStrokeColor(RULE);c.setLineWidth(.35);c.setDash(1,2)
                for j in range(7):c.line(gx+j*gw/6,gtop-gh,gx+j*gw/6,gtop)
                for j in range(4):c.line(gx,gtop-j*gh/3,gx+gw,gtop-j*gh/3)
                c.restoreState()
            elif kind=='options':
                columns,ow,rows=value; opt_y=cursor
                for row,rh in rows:
                    for j,(para,ph) in enumerate(row): para.drawOn(c,left+j*(ow+7),opt_y-ph)
                    opt_y-=rh
            cursor-=height
        return {'id':self.problem['id'],'x':x,'top':top,'bottom':y-self.height,'width':CW}

def divide(questions):
    @lru_cache(None)
    def fit(start,columns):
        if not columns:return (0,[]) if start==len(questions) else (float('inf'),[])
        best=(float('inf'),[]);height=0
        for end in range(start+1,len(questions)-columns+2):
            height+=questions[end-1].height+3*mm
            if height-3*mm>CAP:break
            cost,groups=fit(end,columns-1)
            cost+=(CAP-height+3*mm)**2
            if cost<best[0]:best=(cost,[questions[start:end]]+groups)
        return best
    cost,columns=fit(0,4)
    if math.isfinite(cost):return [columns[:2],columns[2:]]
    pages=[];remaining=questions[:]
    while remaining:
        best=(1,[remaining[:1]])
        for end in range(2,len(remaining)+1):
            candidates=[]
            for split in range(1,end):
                left=sum(q.height+3*mm for q in remaining[:split])-3*mm
                right=sum(q.height+3*mm for q in remaining[split:end])-3*mm
                if max(left,right)<=CAP:
                    candidates.append((abs(left-right),split))
            if candidates:
                _,split=min(candidates)
                best=(end,[remaining[:split],remaining[split:end]])
        count,columns=best;pages.append(columns);remaining=remaining[count:]
    return pages

PROFILES=[{'name':'標準','grid_mm':26,'diagram_mm':24,'side_grid':False},
          {'name':'緊密','grid_mm':24,'diagram_mm':22,'side_grid':False},
          {'name':'圖文並排','grid_mm':24,'diagram_mm':22,'side_grid':True},
          {'name':'小格並排','grid_mm':22,'diagram_mm':20,'side_grid':True}]
plan=[];page=4
for sheet in SHEETS:
    for profile in PROFILES:
        questions=[Question(p,i+1,sheet['review'],profile) for i,p in enumerate(sheet['problems'])]
        pages=divide(questions)
        if len(pages)<=2:break
    plan.append({'sheet':sheet,'pages':pages,'start':page,'end':page+len(pages)-1,'profile':profile})
    page+=len(pages)
TOTAL=page-1

OUT.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('數學慢慢懂，來玩數學吧！｜三年級上學期學習單彙整')
c.setAuthor('數學教材編輯')
c.setCreator('本機學習單彙整工具')
c.setSubject('27份小節學習單與9份單元總複習，每份10題，共360題')
c.setKeywords('南一版本,三年級上學期,數學,學習單,本機彙整')

def footer(page):
    c.setFont('BookHei',8);c.setFillColor(GRAY)
    c.drawString(M,M+3,'三年級上學期數學｜學習單彙編')
    c.drawRightString(W-M,M+3,f'{page} / {TOTAL}')

def rule(y,color=RULE):
    c.setStrokeColor(color);c.setLineWidth(.55);c.line(M,y,W-M,y)

def cover():
    c.bookmarkPage('cover');c.addOutlineEntry('封面','cover',0)
    c.setFillColor(INK);c.rect(M,H-46*mm,6*mm,31*mm,fill=1,stroke=0)
    c.setFont('BookHei',12);c.drawString(M+12*mm,H-24*mm,'適用南一版本三年級上學期')
    c.setFont('BookHei',29);c.drawString(M,H-73*mm,'數學慢慢懂，')
    c.drawString(M,H-91*mm,'來玩數學吧！')
    c.setFont('BookHei',21);c.drawString(M,H-115*mm,'學習單彙整本')
    c.setStrokeColor(INK);c.setLineWidth(1.5);c.line(M,H-125*mm,W-M,H-125*mm)
    c.setFont('BookHei',14);c.drawString(M,H-144*mm,'9 個單元  /  27 份小節卷  /  9 份總複習')
    c.setFont('BookHei',12);c.drawString(M,H-158*mm,'共 36 份學習單，每份 10 題，共 360 題。')
    instructions=[
        '每單元先收錄各小節學習單，再收錄單元總複習。',
        '總複習涵蓋該單元各小節；學生姓名與日期皆留白。',
        'A4 直式雙欄，四邊各 1 公分，每題保留三排計算格。',
        '依內容分頁；同一份學習單的頁碼範圍標示於目錄。',
        '示意圖不按實物比例繪製，請依題目的已知條件作答。',
        '列印建議：A4、實際大小或 100%，勿再增加印表機縮放。']
    y=H-181*mm
    for text in instructions:
        p=paragraph(text,11,'BookHei',17);p.wrap(W-2*M,100);p.drawOn(c,M,y-p.height);y-=p.height+7
    c.setFillColor(GRAY);c.setFont('BookHei',10)
    c.drawString(M,M+34,'整理日期：'+datetime.now(ZoneInfo('Asia/Taipei')).strftime('%Y-%m-%d'))
    footer(1);c.showPage()

def toc(unit_numbers,page):
    c.bookmarkPage('toc'+str(page))
    if page==2:c.addOutlineEntry('目錄','toc2',0)
    c.setFillColor(INK);c.setFont('BookHei',22);c.drawString(M,H-M-24,'學習單目錄')
    rule(H-M-37);y=H-M-64
    for number in unit_numbers:
        rows=[p for p in plan if p['sheet']['unitNumber']==number]
        unit=rows[0]['sheet']
        c.setFillColor(INK);c.setFont('BookHei',13)
        c.drawString(M,y,f'第 {number} 單元　{unit["unitTitle"]}');y-=24
        for p in rows:
            label=p['sheet']['title'];c.setFont('BookHei',10.5);c.setFillColor(colors.black)
            c.drawString(M+4*mm,y,label)
            pages=f'{p["start"]}' if p['start']==p['end'] else f'{p["start"]}-{p["end"]}'
            c.drawRightString(W-M,y,pages)
            c.linkRect('',p['sheet']['id'],(M,y-3,W-M,y+12),relative=0,thickness=0)
            y-=21
        y-=13
    if y<M+30:raise ValueError('Contents overflow')
    footer(page);c.showPage()

def worksheet_header(sheet,part,count,page):
    c.setFillColor(colors.black)
    c.setFont('BookHei',10.5)
    c.drawCentredString(W/2,H-M-11,f'南一版三年級上學期數學 · 第 {sheet["unitNumber"]} 單元：{sheet["unitTitle"]}')
    c.setFont('BookHei',12);c.drawCentredString(W/2,H-M-29,sheet['title']+' · 共 10 題')
    c.setFont('BookHei',9.5)
    c.drawString(M,H-M-47,'姓名：____________　日期：____ 年 ___ 月 ___ 日')
    c.drawRightString(W-M,H-M-47,f'本份第 {part} / {count} 頁　得分：______')
    c.setFont('BookHei',8)
    c.drawString(M,H-M-62,'圖依已知條件繪製；關係方框不按數量比例，測量示意圖請依標示判讀。')
    rule(H-M-69,colors.black)
    c.setStrokeColor(colors.HexColor('#bbbbbb'));c.setLineWidth(.3)
    c.line(W/2,BOTTOM,W/2,TOP)
    footer(page)

def support_stamp():
    y=M+14; height=30
    c.setStrokeColor(RULE);c.setLineWidth(.5);c.rect(M,y,W-2*M,height,stroke=1,fill=0)
    c.setFont('BookHei',9);c.setFillColor(colors.black)
    c.drawString(M+5,y+22,'個別化支持紀錄（教師依實際提供的支持勾選）')
    items=['學習內容：題意簡化、圖像提示','學習歷程：計算對齊、分段引導',
           '學習環境：減少干擾、安心練習','學習評量：延長時間、報讀題目']
    for i,text in enumerate(items):
        x=M+5+(i%2)*(W-2*M)/2;yy=y+13-(i//2)*9
        c.rect(x,yy,5,5,stroke=1,fill=0);c.setFont('BookHei',8.4);c.drawString(x+9,yy-1,text)

cover();toc(range(1,5),2);toc(range(5,10),3)
manifest={'worksheets':36,'questions':360,'pages':TOTAL,'sheets':[],'layout':{'size':'A4','margin_mm':10,'columns':2,'question_pt':14,'options_pt':12}}
current=4;seen_units=set()
for item in plan:
    sheet=item['sheet'];c.bookmarkPage(sheet['id'])
    if sheet['unitId'] not in seen_units:
        key='unit-'+sheet['unitId'];c.bookmarkPage(key)
        c.addOutlineEntry(f'第 {sheet["unitNumber"]} 單元：{sheet["unitTitle"]}',key,0,closed=False)
        seen_units.add(sheet['unitId'])
    c.addOutlineEntry(sheet['title'],sheet['id'],1,closed=False)
    record={'id':sheet['id'],'title':sheet['title'],'start':current,'end':item['end'],'profile':item['profile'],'questions':[]}
    for part,columns in enumerate(item['pages'],1):
        worksheet_header(sheet,part,len(item['pages']),current)
        for col,questions in enumerate(columns):
            x=M+col*(CW+GAP);y=TOP
            for question in questions:
                bounds=question.draw(c,x,y);bounds['page']=current;record['questions'].append(bounds)
                y-=question.height+3*mm
                if y+3*mm<BOTTOM-0.01:raise ValueError('Question below margin')
        if part==len(item['pages']):support_stamp()
        c.showPage();current+=1
    manifest['sheets'].append(record)
assert current-1==TOTAL
c.save()
manifest['over_two_pages']=[{'id':p['sheet']['id'],'unit':p['sheet']['unitNumber'],'title':p['sheet']['title'],'pages':len(p['pages'])} for p in plan if len(p['pages'])>2]
(ROOT/'Codex/worksheet-book-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'pdf':str(OUT),'pages':TOTAL,'worksheets':36,'questions':360,'bytes':OUT.stat().st_size},ensure_ascii=False))
