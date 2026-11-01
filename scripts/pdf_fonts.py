"""本機 PDF 專用標楷體；不發布作業系統字型檔。"""
from pathlib import Path
import hashlib
import json
import os
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'Codex/fonts'


def biaukai_path():
    """保留標楷體輪廓，轉為 ReportLab 可嵌入的 TrueType 格式。"""
    from reportlab.pdfbase.ttfonts import TTFont as ReportFont
    supplied = os.environ.get('BIAUKAI_TTF')
    if supplied:
        path = Path(supplied)
        font = ReportFont('BiauKaiValidation', str(path))
        if b'BiauKaiTC' not in font.face.name:
            raise ValueError('PDF 字型必須是標楷體 BiauKaiTC，不接受其他楷體代用。')
        return path
    sources = sorted(Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8').glob('*/AssetData/BiauKai.ttc'))
    if not sources:
        raise RuntimeError('本機缺少標楷體 BiauKaiTC，請以 BIAUKAI_TTF 指定可嵌入的標楷體字型。')
    source = sources[0]
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    out, manifest = CACHE / 'BiauKaiTC-Print.ttf', CACHE / 'biaukai.json'
    if out.exists() and manifest.exists():
        info = json.loads(manifest.read_text())
        if info.get('source_sha256') == digest and info.get('pdf_font_sha256') == hashlib.sha256(out.read_bytes()).hexdigest():
            return out
    # fontTools 僅在首次準備本機字型時使用；所有衍生檔維持 Git 排除。
    private_libs = ROOT / 'Codex/submission/font-normalization/python-libs'
    if private_libs.exists():
        sys.path.insert(0, str(private_libs))
    try:
        from fontTools.ttLib import TTFont, newTable
        from fontTools.pens.cu2quPen import Cu2QuPen
        from fontTools.pens.ttGlyphPen import TTGlyphPen
    except ImportError as exc:
        raise RuntimeError('首次準備標楷體需安裝 fonttools；請使用本機 PDF Python 環境。') from exc
    font = TTFont(source, fontNumber=1)
    assert font['name'].getDebugName(6) == 'BiauKaiTC-Regular'
    glyph_set = font.getGlyphSet()
    glyphs = {}
    for name in font.getGlyphOrder():
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, max_err=0.5, reverse_direction=True))
        glyphs[name] = pen.glyph()
    font['glyf'] = newTable('glyf')
    font['glyf'].glyphs = glyphs
    font['glyf'].glyphOrder = font.getGlyphOrder()
    font['loca'] = newTable('loca')
    del font['CFF ']
    font['maxp'] = newTable('maxp')
    for key, value in dict(tableVersion=0x00010000, numGlyphs=len(glyphs), maxPoints=0, maxContours=0,
                           maxCompositePoints=0, maxCompositeContours=0, maxZones=1, maxTwilightPoints=0,
                           maxStorage=0, maxFunctionDefs=0, maxInstructionDefs=0, maxStackElements=0,
                           maxSizeOfInstructions=0, maxComponentElements=0, maxComponentDepth=0).items():
        setattr(font['maxp'], key, value)
    font['post'].formatType = 3.0
    font.sfntVersion = '\x00\x01\x00\x00'
    CACHE.mkdir(parents=True, exist_ok=True)
    temp = out.with_suffix('.tmp.ttf')
    font.save(temp)
    assert b'BiauKaiTC' in ReportFont('BiauKaiValidation', str(temp)).face.name
    temp.replace(out)
    manifest.write_text(json.dumps({'source_sha256': digest, 'pdf_font_sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                                    'font': 'BiauKaiTC-Regular', 'purpose': '本機列印與 PDF 嵌入'}, ensure_ascii=False, indent=2) + '\n')
    return out


def register_biaukai(*names):
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    path = biaukai_path()
    for name in names:
        pdfmetrics.registerFont(TTFont(name, str(path)))
        pdfmetrics.registerFontFamily(name, normal=name, bold=name, italic=name, boldItalic=name)
    return path


if __name__ == '__main__':
    print(biaukai_path())
