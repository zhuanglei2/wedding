"""Quote-preserving CSS URL rewriting and parsed-HTML release guards."""
import re
from html.parser import HTMLParser

CSS_URL = re.compile(r'url\(\s*(["\x27]?)(.*?)\1\s*\)')
RESOURCE_ATTRIBUTES = {
    'data-media-srcset', 'imagesrcset', 'srcset', 'data-media-src',
    'data-original', 'data-src', 'src', 'href',
}


def rewrite_urls(text, route):
    """Replace only URL contents, never add quotes to HTML attributes/JS strings.

    Fragment-only and external URLs stay byte-identical when routing is a no-op.
    The router must percent-encode unsafe path characters in new local URLs.
    """
    def replace(match):
        original = match[2]
        routed = route(original)
        if routed == original.strip():
            return match[0]
        start, end = match.span(2)
        return (match[0][:start - match.start()] + routed
                + match[0][end - match.start():])
    return CSS_URL.sub(replace, text)


class Markup(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.nodes = []
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, attrs))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def require(condition, message):
    if not condition:
        raise ValueError('Release HTML validation: ' + message)


def validate_html(source, release):
    """Check parsed attributes, not just whether expected strings are present."""
    before, after = Markup(source).nodes, Markup(release).nodes
    require(len(before) == len(after), 'element count changed')
    for (tag, original), (released_tag, packaged) in zip(before, after):
        require(tag == released_tag, 'element order changed')
        require([name for name, _ in original] == [name for name, _ in packaged],
                'attribute names/order changed on ' + tag)
        for (name, value), (_, actual) in zip(original, packaged):
            if name not in RESOURCE_ATTRIBUTES and name != 'style':
                require(value == actual, tag + '[' + name + '] changed')
            elif name == 'style':
                # Local asset URLs may be rerouted, but surrounding CSS may not.
                neutralize = lambda text: CSS_URL.sub('url(RESOURCE)', text or '')
                require(neutralize(value) == neutralize(actual), 'inline style damaged')
                fragments = lambda text: [m[2].strip() for m in CSS_URL.finditer(text or '')
                                          if m[2].strip().startswith('#')]
                require(fragments(value) == fragments(actual), 'inline SVG references changed')

    nodes = [(tag, dict(attrs)) for tag, attrs in after]
    ids = {attrs['id'] for _, attrs in nodes if 'id' in attrs}
    columns = [attrs for tag, attrs in nodes
               if tag == 'svg' and 'garden-verse' in attrs.get('class', '').split()]
    images = [attrs for tag, attrs in nodes
              if tag == 'image' and 'lettering-flowing-v15.webp' in attrs.get('href', '')]
    require(len(columns) == len(images) == 4, 'expected four garden lettering columns')
    for attrs in columns:
        require('filter: url(#garden-ink)' in attrs.get('style', ''), 'garden ink filter missing')
        require('garden-ink' in ids, 'garden ink definition missing')
    require([attrs.get('clip-path') for attrs in images] == [
        'url(#garden-opening-clip)', 'url(#garden-opening-clip)',
        'url(#garden-closing-clip)', 'url(#garden-closing-clip)',
    ], 'garden clips damaged')
    require({'garden-opening-clip', 'garden-closing-clip'} <= ids, 'garden clip definitions missing')
