"""Build/check a lossless page-specific font. Requires fonttools[woff]==4.66.0.

Run again whenever page copy changes. --check never writes files. Keep the full
source font for historical versions; publish only the generated WOFF2 here.
"""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = ROOT / 'assets/ma-shan-zheng-v10.6.ttf'
OUTPUT = HERE / 'media/timeline-handwriting.woff2'
REPORT = HERE / 'font-manifest.json'
RUNTIME = HERE / 'memory.js'


class PageText(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.excluded = 0
        self.parts = []
        self.stylesheets = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self.excluded += 1
        values = dict(attrs)
        for name in ('alt', 'title', 'aria-label', 'aria-valuetext'):
            self.parts.append(values.get(name) or '')
        if tag == 'link' and values.get('rel') == 'stylesheet':
            self.stylesheets.append(values['href'])

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.excluded -= 1

    def handle_data(self, data):
        if not self.excluded:
            self.parts.append(data)


def required_codepoints():
    html = (HERE / 'index.html').read_text()
    page = PageText(html)
    # Include runtime retry copy as well as the full page (not just the timeline).
    runtime_copy = re.findall(r"\.textContent\s*=\s*'([^'\\]*)'", RUNTIME.read_text())
    assert '照片未加载，轻点重试' in runtime_copy
    styles = [html]
    for href in page.stylesheets:
        if not re.match(r'^(?:[a-z]+:|//)', href):
            styles.append((HERE / href.split('?')[0]).read_text())
    generated_copy = re.findall(r'''\bcontent\s*:\s*["']([^"'\\]*)["']''', '\n'.join(styles))
    text = ''.join(page.parts + runtime_copy + generated_copy)
    # ASCII supports dynamic counts/dates/punctuation without retaining unused CJK.
    return set(range(32, 127)) | {ord(c) for c in text if not c.isspace()}


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(original, compact, required):
    before, after = original.getBestCmap(), compact.getBestCmap()
    supported = required & before.keys()
    assert supported <= after.keys(), 'Page copy is missing from font; rebuild subset'
    assert set(after) == supported, 'Unexpected subset coverage; rebuild from current copy'
    orig_glyphs, sub_glyphs = original.getGlyphSet(), compact.getGlyphSet()
    for cp in sorted(supported):
        left, right = before[cp], after[cp]
        a, b = DecomposingRecordingPen(orig_glyphs), DecomposingRecordingPen(sub_glyphs)
        orig_glyphs[left].draw(a)
        sub_glyphs[right].draw(b)
        assert a.value == b.value, f'Outline changed for U+{cp:04X}'
        assert original['hmtx'][left] == compact['hmtx'][right], f'Width changed for U+{cp:04X}'
        for font, name in ((original, left), (compact, right)):
            glyph = font['glyf'][name]
            program = getattr(glyph, 'program', None)
            instructions = bytes(program.getBytecode()) if program else b''
            if font is original:
                original_instructions = instructions
            else:
                assert instructions == original_instructions, f'Hinting changed for U+{cp:04X}'
    for table, fields in {
        'head': ['unitsPerEm'],
        'hhea': ['ascent', 'descent', 'lineGap', 'caretSlopeRise', 'caretSlopeRun', 'caretOffset'],
        'OS/2': ['sTypoAscender', 'sTypoDescender', 'sTypoLineGap', 'usWinAscent', 'usWinDescent', 'fsSelection'],
    }.items():
        for field in fields:
            assert getattr(original[table], field) == getattr(compact[table], field), (table, field)
    for table in ('prep', 'fpgm', 'cvt ', 'gasp'):
        if table in original:
            assert table in compact and original.getTableData(table) == compact.getTableData(table), table
    for name_id in (0, 13, 14):
        def names(font):
            return {record.toUnicode() for record in font['name'].names if record.nameID == name_id}
        assert names(original) == names(compact), 'Font copyright/license must be retained'
    return sorted(supported), sorted(required - before.keys())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    required = required_codepoints()
    original = TTFont(SOURCE, recalcTimestamp=False)
    if not args.check:
        font = TTFont(SOURCE, recalcTimestamp=False)
        options = subset.Options()
        options.hinting = True
        options.layout_features = ['*']
        options.name_IDs = ['*']
        options.name_legacy = True
        options.name_languages = ['*']
        options.glyph_names = True
        options.notdef_outline = True
        options.recalc_timestamp = False
        worker = subset.Subsetter(options=options)
        worker.populate(unicodes=required & original.getBestCmap().keys())
        worker.subset(font)
        font.flavor = 'woff2'
        font.save(OUTPUT)
        font.close()
    compact = TTFont(OUTPUT, recalcTimestamp=False)
    supported, fallback = validate(original, compact, required)
    result = dict(source=SOURCE.relative_to(ROOT).as_posix(), sourceSha256=fingerprint(SOURCE),
                  sourceBytes=SOURCE.stat().st_size, subset=OUTPUT.relative_to(HERE).as_posix(),
                  subsetSha256=fingerprint(OUTPUT), subsetBytes=OUTPUT.stat().st_size,
                  requiredCodepoints=sorted(required), retainedCodepoints=supported,
                  existingFallbackCodepoints=fallback,
                  verification='All retained outlines, advance widths, sidebearings, hinting and vertical metrics equal source; copyright/license retained')
    assert result['subsetBytes'] < result['sourceBytes'] * .2, 'Unexpected font size regression'
    if args.check:
        assert result == json.loads(REPORT.read_text()), 'Manifest stale; rebuild font'
    else:
        REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if not k.endswith('Codepoints')}, ensure_ascii=False))
    print(f'PASS: {len(supported)} codepoints retain exact outlines/metrics; {len(fallback)} previously unsupported symbols retain original fallback.')


if __name__ == '__main__':
    main()
