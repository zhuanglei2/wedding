from pathlib import Path
from html.parser import HTMLParser
import re

here = Path(__file__).resolve().parent
previous = here.parent / 'v10.104-cover-first-paint'
html = (here / 'index.html').read_text()
old = (previous / 'index.html').read_text()
normalized = html.replace('../v10.104-cover-first-paint/', '').replace('V10.105', 'V10.104')
style = re.search(r'<style id="editorial-story">([\s\S]*?)</style>\n', normalized)
assert style and style.group(1).count('{') == style.group(1).count('}')
assert not re.search(r'@keyframes|animation:|transition:|object-fit:|object-position:|--turn-vh|margin-top:', style.group(1).replace('margin-top:4px', '').replace('margin-top:3px', ''))
normalized = normalized.replace(style.group(0), '')
pattern = r'<article class="chapter classic"[\s\S]*?</article>'
new_article = re.search(pattern, normalized).group(0)
old_article = re.search(pattern, old).group(0)
assert 'story-prelude' in new_article and 'story-title' in new_article
assert '把这一刻' not in new_article
assert re.findall(r'<picture>[\s\S]*?</picture>', new_article) == re.findall(r'<picture>[\s\S]*?</picture>', old_article)
normalized = normalized.replace(new_article, old_article)
assert normalized.rstrip() == old.rstrip(), 'Unexpected changes outside second-page markup/style/version/resource paths'

class Assets(HTMLParser):
    count = 0
    def handle_starttag(self, tag, pairs):
        for key, value in pairs:
            if key in ('href', 'src', 'srcset', 'data-src') and value and not value.startswith(('http:', 'https:', '#', 'data:')):
                assert (here / value).exists(), 'Missing local reference: ' + value
                self.count += 1
check = Assets()
check.feed(html)
print('PASS: second-page-only change; all image/animation paths resolve; first cover, later chapters and inline scripts unchanged; %d references checked' % check.count)
