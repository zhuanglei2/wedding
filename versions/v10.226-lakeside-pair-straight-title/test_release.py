"""Offline regression checks; never authenticate or deploy."""
import contextlib
import importlib.util
import io
import pathlib
import re
import sys
import unittest
from release_urls import rewrite_urls, validate_html, Markup

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = (HERE / 'index.html').read_text()


class ReleaseTests(unittest.TestCase):
    def test_fragments_and_external_urls_stay_byte_identical(self):
        text = '''<svg style="filter: url(#garden-ink)"><image clip-path="url(#clip)"/></svg>
        .a {mask:url( '#clip' ); background:url("https://example.com/a.png")}
        .b {background:url(data:image/png;base64,AAAA)}'''
        self.assertEqual(rewrite_urls(text, lambda url: url.strip()), text)

    def test_existing_quote_contexts_and_unquoted_urls(self):
        for value in ['url(a.webp)', 'url("a.webp")', "url('a.webp')"]:
            self.assertEqual(rewrite_urls(value, lambda url: '/release/' + url),
                             value.replace('a.webp', '/release/a.webp'))
        html = '''<div style="background:url('a.webp')"></div>'''
        result = rewrite_urls(html, lambda url: '/release/' + url)
        self.assertEqual(Markup(result).nodes[0][1], [('style', "background:url('/release/a.webp')")])
        js = '''const font = 'url("font.ttf")';'''
        self.assertEqual(rewrite_urls(js, lambda url: '/release/' + url),
                         '''const font = 'url("/release/font.ttf")';''')

    def test_old_packager_damage_is_rejected(self):
        sample = '<svg><g style="filter: url(#ink)"/></svg>'
        broken = re.sub(r'url\((#[^)]+)\)', r'url("\1")', sample)
        with self.assertRaisesRegex(ValueError, 'attribute names/order changed'):
            validate_html(sample, broken)

    def test_missing_clip_and_filter_are_rejected(self):
        garden = (HERE.parent / 'v10.216-restored-centered-photo/index.html').read_text()
        for value in ['url(#garden-ink)', 'url(#garden-opening-clip)']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_html(garden, garden.replace(value, 'none', 1))

    def test_local_design_unchanged(self):
        previous = (HERE.parent / 'v10.225-second-lakeside-photo/index.html').read_text()
        original = (HERE.parent / 'v10.223-lawn-gentler/index.html').read_text()
        pattern = r'<figure class="memory-card[^>]*>.*?</figure>'
        boy = re.findall(pattern, original, re.S)[1].replace('data-memory-card="1"','data-memory-card="2"').replace('data-added-memory="lakeside"','data-added-memory="lakeside-boy"')
        def restore(match):
            card = match[0]
            number = int(re.search(r'data-memory-card="(\d+)"',card)[1])
            if number == 1: return card + boy
            if number > 1: return re.sub(r'data-memory-card="\d+"', 'data-memory-card="'+str(number+1)+'"',card)
            return card
        expected = re.sub(pattern,restore,previous,flags=re.S).replace('<link rel="stylesheet" href="lawn-finale.css">','<link rel="stylesheet" href="lawn-finale.css"><link rel="stylesheet" href="story-heading.css">')
        self.assertEqual(SOURCE, expected, 'Only restore boy after girl and add title override')
        for name in ('memory-math.js', 'handwriting.js', 'media/timeline-handwriting.woff2', 'font-manifest.json'):
            self.assertEqual((HERE / name).read_bytes(), (HERE.parent / 'v10.225-second-lakeside-photo' / name).read_bytes(), name)

    def test_fallback_is_fixed_hidden_by_default_and_accessible(self):
        buttons = [dict(attrs) for tag, attrs in Markup(SOURCE).nodes if tag == 'button' and dict(attrs).get('id') == 'music-start-prompt']
        self.assertEqual(len(buttons), 1)
        self.assertIn('hidden', buttons[0])
        self.assertEqual(buttons[0]['type'], 'button')
        self.assertEqual(buttons[0]['aria-label'], '开启音乐')
        self.assertNotIn('disabled', buttons[0])
        css = (HERE / 'music-gesture.css').read_text()
        self.assertIn('position:fixed', css)
        self.assertIn('min-height:32px', css)
        self.assertIn('inset:-6px', css)
        self.assertIn('[hidden]{display:none!important}', css)
        self.assertIn(':focus-visible', css)
        self.assertNotIn('@import', css)
        self.assertNotIn('AboutHand', css)

    def test_full_packaged_release(self):
        spec = importlib.util.spec_from_file_location('dry_run_release', HERE / 'publish.py')
        module = importlib.util.module_from_spec(spec)
        old_argv = sys.argv
        try:
            sys.argv = [str(HERE / 'publish.py')]
            with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(SystemExit) as end:
                spec.loader.exec_module(module)
            self.assertEqual(end.exception.code, 0)
        finally:
            sys.argv = old_argv
        validate_html(SOURCE, module.html.decode())
        self.assertEqual(len(module.objects), 86)
        self.assertEqual(module.plan['version'], 'V10.226')
        self.assertEqual(module.objects[module.second_photo_key][1], 'image/png')
        self.assertEqual(module.objects[module.boy_photo_key][1], 'image/webp')
        self.assertIn(b'#celebration #reactions-title{transform:none}',module.objects[module.heading_key][0])
        self.assertNotIn(b'id="garden-portrait"',module.html)
        self.assertEqual(module.html.count(b'data-memory-card='),13)
        self.assertIn(b'.94*.95',module.objects[module.memory_script_key][0])
        self.assertIn(b'transform:none', module.objects[module.focus_key][0])
        self.assertIn(b'object-position:50% 40%', module.objects[module.focus_key][0])
        self.assertNotIn(b'scale(', module.objects[module.focus_key][0])
        self.assertIn(b'new window.MutationObserver(recoverOnCoverTurn)', module.objects[module.music_script_key][0])
        self.assertIn(b'if(contact)gesturePending=false;', module.objects[module.music_script_key][0])
        self.assertEqual(module.objects[module.photo_key][1], 'image/jpeg')
        self.assertIn(b'wedding-cover-ready', module.objects[module.music_script_key][0])
        self.assertFalse(any(key.endswith('ma-shan-zheng-v10.6.ttf') for key in module.objects))
        self.assertEqual(sum(key.endswith('timeline-handwriting.woff2') for key in module.objects), 1)
        self.assertEqual(module.objects[module.font_key][1], 'font/woff2')
        self.assertIn(b'data-start-seconds="50"', module.html)
        images = [dict(attrs) for tag, attrs in Markup(module.html.decode()).nodes
                  if tag == 'image' and 'lettering-flowing' in dict(attrs).get('href', '')]
        for attrs in images:
            self.assertIn(attrs['href'].lstrip('/'), module.objects)
        self.assertNotIn(b'="url("', module.html)


if __name__ == '__main__':
    unittest.main(verbosity=2)
