"""Explicit OSS release only. Dry-run by default; credentials never written/logged."""
import argparse, base64, concurrent.futures, configparser, email.utils, getpass
import hashlib, hmac, http.client, json, mimetypes, os, pathlib, re, subprocess, sys, urllib.parse
from release_urls import rewrite_urls, validate_html

parser = argparse.ArgumentParser()
parser.add_argument('--deploy', action='store_true')
parser.add_argument('--write-manifest', action='store_true', help='Freeze the reviewed local release without deploying')
parser.add_argument('--credentials-file', type=pathlib.Path, help='Existing ossutil INI config; never printed')
args = parser.parse_args()
if args.deploy and args.write_manifest:
    parser.error('--write-manifest is a dry-run action; review before --deploy')
SOURCE = pathlib.Path(__file__).resolve().with_name('index.html')
ROOT = SOURCE.parents[2]
BUCKET = 'hq-wedding'
HOST = 'hq-wedding.oss-cn-hangzhou.aliyuncs.com'
REV = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
def sha(data): return hashlib.sha256(data).hexdigest()
ATTR = re.compile(r'\b(data-media-srcset|imagesrcset|srcset|data-media-src|data-original|data-src|src|href)="([^"]*)"')

def package(prefix):
    objects, raw, pending = {}, {}, []
    def route(url, base):
        url = url.strip()
        if not url or url.startswith(('#', '//')) or re.match(r'^[a-zA-Z][\w+.-]*:', url): return url
        parsed = urllib.parse.urlsplit(url)
        local = (base / urllib.parse.unquote(parsed.path)).resolve()
        if ROOT not in local.parents or not local.is_file():
            raise RuntimeError('Missing or out-of-scope dependency: ' + str(local))
        if local in (ROOT/'guest.html', ROOT/'index.html', ROOT/'versions/index.html'):
            raise RuntimeError('Unexpected entry dependency: ' + str(local))
        if local not in raw:
            raw[local] = local.read_bytes()
            pending.append(local)
        return '/' + prefix + urllib.parse.quote(local.relative_to(ROOT).as_posix(), safe='/') + (('?' + parsed.query) if parsed.query else '') + (('#' + parsed.fragment) if parsed.fragment else '')
    def rewrite(text, base, html=False):
        if html:
            def attr(m):
                name, value = m.groups()
                if name.endswith('srcset'):
                    value = ', '.join(' '.join([route(parts[0], base), *parts[1:]]) for item in value.split(',') if (parts := item.split()))
                else: value = route(value, base)
                return name + '="' + value + '"'
            text = ATTR.sub(attr, text)
        return rewrite_urls(text, lambda url: route(url, base))
    source = SOURCE.read_bytes()
    html = rewrite(source.decode(), SOURCE.parent, True).encode()
    validate_html(source.decode(), html.decode())
    while pending:
        file = pending.pop()
        data = raw[file]
        if file.suffix in ('.css', '.js'):
            if file.suffix == '.css' and '@import' in data.decode(): raise RuntimeError('CSS imports require explicit dependency handling')
            data = rewrite(data.decode(), file.parent).encode()
        objects[prefix + file.relative_to(ROOT).as_posix()] = (data, mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
    raw[SOURCE] = source
    # The immutable release identity also includes its transformation/validation code.
    for tool in ('publish.py', 'release_urls.py'):
        path = SOURCE.with_name(tool)
        raw[path] = path.read_bytes()
    fingerprint = sha(json.dumps([(p.relative_to(ROOT).as_posix(), sha(b)) for p, b in sorted(raw.items())], separators=(',', ':')).encode())
    return html, objects, fingerprint

_, _, fingerprint = package('audit/')
PREFIX = 'previews/v10.225-20261004-' + fingerprint[:12] + '/'
ENTRY = PREFIX + 'index.html'
html, objects, final_fingerprint = package(PREFIX)
assert fingerprint == final_fingerprint, 'Sources changed while packaging'
assert '<title>庄磊 & 吴郁 · 婚礼请柬</title>'.encode() in html and b'href="#our-story"' in html
assert b'V10.' not in re.search(b'<title>(.*?)</title>', html)[1]
assert b'class="cover-photo-reframe"' in html
assert any(key.endswith('/v10.180-closer-couple/cover-photo.css') for key in objects)
assert any(key.endswith('/v10.225-second-lakeside-photo/opening-runtime.js') for key in objects)
assert not any(key.endswith('/v10.180-closer-couple/opening-runtime.js') for key in objects)
assert html.count(b'data-memory-card=') == 12
assert 'aria-label="2024年"'.encode() in html
assert '诚邀您的光临'.encode() in html and '诚邀你的光临'.encode() not in html
assert '<p>开始于<span>...</span></p>'.encode() in html
assert '我们在一起了'.encode() in html
assert '闻涛厅'.encode() in html and '这一刻的幸福<br>想与你一同分享'.encode() in html
assert b'class="rsvp"' not in html and b'<footer>' not in html
assert '爬山徒步'.encode() in html and '爬上徒步'.encode() not in html
assert b'data-start-seconds="50"' in html
assert b'id="cover-music"' not in html
assert b'2026-10-06T16:58:00+08:00' in html
assert b'id="garden-portrait"' not in html
assert b'class="garden-paper-head"' not in html
assert '时日有序'.encode() not in html and '光景常新'.encode() not in html
assert b'garden-eaves' not in html
assert not any('/v10.200-' in key or '/v10.201-' in key or '/v10.195-' in key for key in objects)
assert not any(re.search(r'/(?:garden-paper|garden-feather|garden-portrait)\.css$|corridor-hq|lettering-flowing',key) for key in objects)
assert not any(re.search(r'/(?:memory-03|street-food|kayaking|memory-07|memory-08|birthday-wish|dinner|lakeside)\.webp$',key) for key in objects)
assert b'id="gathered-scenes"' in html and b'class="scene-gilded-join"' in html
assert any(key.endswith('/v10.198-garden-inscription/story-handoff.js') for key in objects)
assert any('/v10.193-compact-drawn-paper/media/' in key for key in objects)
assert any('/v10.191-compact-scene-lyrics/media/lyrics-' in key for key in objects)
assert any('/v10.197-gilded-scene-join/media/champagne-branch-' in key for key in objects)
assert len(objects) == 84
assert all(key.startswith(PREFIX) for key in objects)
font_key = next(key for key in objects if key.endswith('/media/timeline-handwriting.woff2'))
font_manifest = json.loads(SOURCE.with_name('font-manifest.json').read_text())
assert sha(objects[font_key][0]) == font_manifest['subsetSha256']
assert len(objects[font_key][0]) == font_manifest['subsetBytes']
assert not any(key.endswith('/assets/ma-shan-zheng-v10.6.ttf') for key in objects)
# Check transformed JS too: the deferred FontFace URL must point into this release.
scripts = {key:data.decode() for key,(data,kind) in objects.items() if key.endswith('.js')}
subprocess.run(['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node', '-e',
    'const fs=require("fs"),vm=require("vm");for(const [name,source] of Object.entries(JSON.parse(fs.readFileSync(0,"utf8"))))new vm.Script(source,{filename:name});'],
    input=json.dumps(scripts), text=True, check=True)
assert all('/'+font_key in source for key,source in scripts.items() if key.endswith('/handwriting.js'))
assert any(key.endswith('/v10.225-second-lakeside-photo/memory-math.js') for key in scripts)
memory_script_key = next(key for key in scripts if key.endswith('/v10.225-second-lakeside-photo/memory.js'))
assert 'page.append(finalPhoto)' in scripts[memory_script_key]
assert '(frameLimit-28)*ratio+16)*.94*.95)' in scripts[memory_script_key]
assert any(key.endswith('/v10.225-second-lakeside-photo/lawn-finale.css') for key in objects)
assert any(key.endswith('/v10.225-second-lakeside-photo/condensed-story.css') for key in objects)
assert any(key.endswith('/v10.225-second-lakeside-photo/media/polite-greeting.png') for key in objects)
music_script_key = next(key for key in scripts if key.endswith('/v10.225-second-lakeside-photo/music.js'))
assert "audio.addEventListener('ended',()=>{" in scripts[music_script_key]
assert 'request++;gesturePending=false;seekTo(start);' in scripts[music_script_key]
assert "document.addEventListener('wedding-cover-ready',startOnPage)" in scripts[music_script_key]
assert any(key.endswith('/v10.225-second-lakeside-photo/cover-music-ready.js') for key in scripts)
assert "document.addEventListener('touchend',recoverInGesture,{capture:true,passive:true})" in scripts[music_script_key]
assert "document.addEventListener('click',recoverInGesture,{capture:true})" in scripts[music_script_key]
assert b'id="music-start-prompt"' in html
assert any(key.endswith('/v10.225-second-lakeside-photo/music-gesture.css') for key in objects)
focus_key = next(key for key in objects if key.endswith('/v10.225-second-lakeside-photo/camera-photo-focus.css'))
assert b'transform:none' in objects[focus_key][0]
assert b'object-position:50% 40%' in objects[focus_key][0]
assert b'scale(' not in objects[focus_key][0]
assert 'new window.MutationObserver(recoverOnCoverTurn)' in scripts[music_script_key]
assert "if(turnAttempted||!root.classList.contains('turn-playing'))return;" in scripts[music_script_key]
assert 'if(contact)gesturePending=false;' in scripts[music_script_key]
assert "document.addEventListener('touchcancel'" in scripts[music_script_key]
assert 'if(!initialStarted&&!coverReady())return;' not in scripts[music_script_key]
photo_key = next(key for key in objects if key.endswith('/v10.225-second-lakeside-photo/media/camera-couple.jpg'))
assert sha(objects[photo_key][0]) == '51545be010524b5a201f5d4515b44cef934391b933c972fe821e5d0f4eda3778'
assert html.count(('src="/'+photo_key+'"').encode()) == 4
second_photo_key = next(key for key in objects if key.endswith('/v10.225-second-lakeside-photo/media/lakeside-second.png'))
assert sha(objects[second_photo_key][0]) == 'db4c2b5604150fa9b4e29224d4c302744e8ef6e307ccbc5bee51495350c2bb1f'
assert objects[second_photo_key][1] == 'image/png'
assert html.count(('src="/'+second_photo_key+'"').encode()) == 2
cards = re.findall(rb'<figure class="memory-card[^>]*>.*?</figure>',html,re.S)
assert ('/'+second_photo_key).encode() in cards[1]
assert sum(card.count(b'data-media-src=') for card in cards) == 15
assert b'memory-keepsake' in cards[-1] and cards[-1].count(b'data-media-src=') == 4
assert not any('/v10.125-keepsake-fast/media/couple-' in key or key.endswith('/v10.106-reference-party/couple-original.jpg') for key in objects)
assert not any(key.endswith('/v10.178-cover-music/music.js') for key in objects)
assert not any('/v10.205-readable-lyrics/' in key for key in objects)
plan = dict(version='V10.225', baseRevision=REV, sourceFingerprint=fingerprint, bucket=BUCKET,
            entry=ENTRY, dependencies=len(objects), bytes=sum(len(v[0]) for v in objects.values()),
            htmlBytes=len(html), htmlSha256=sha(html),
            files=[dict(key=k, bytes=len(v[0]), sha256=sha(v[0])) for k,v in sorted(objects.items())])
print(json.dumps({k:v for k,v in plan.items() if k != 'files'} if args.deploy or args.write_manifest else plan, ensure_ascii=False), flush=True)
if args.write_manifest:
    SOURCE.with_name('release-manifest.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2)+'\n')
if not args.deploy: raise SystemExit(0)

frozen = json.loads(SOURCE.with_name('release-manifest.json').read_text())
if any(plan[key] != frozen[key] for key in ['sourceFingerprint','htmlSha256','files']):
    raise RuntimeError('Release differs from the validated manifest; review before deploying')

if args.credentials_file:
    config = configparser.ConfigParser()
    if not config.read(args.credentials_file): raise RuntimeError('Credentials file unavailable')
    credentials = config['Credentials']
    AK, SK = credentials['accessKeyID'].strip(), credentials['accessKeySecret'].strip()
    STS = credentials.get('stsToken', '').strip()
    del config, credentials
elif os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID') or os.environ.get('OSS_ACCESS_KEY_ID'):
    AK = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID') or os.environ.get('OSS_ACCESS_KEY_ID', '')
    SK = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET') or os.environ.get('OSS_ACCESS_KEY_SECRET', '')
    STS = os.environ.get('ALIBABA_CLOUD_SECURITY_TOKEN') or os.environ.get('OSS_SECURITY_TOKEN', '')
elif sys.stdin.isatty():
    value = getpass.getpass('OSS AccessKeyId:AccessKeySecret (hidden, held in memory only): ')
    AK, SK = value.strip().split(':', 1)
    STS = ''
    del value
else:
    raise SystemExit('OSS authentication unavailable. Provide --credentials-file or authorized environment credentials; no network changes made.')
if not AK or not SK: raise RuntimeError('Empty OSS credentials')

def request(method, key, data=None, kind='', cache=None, optional=False, create_only=False, extra_headers=None):
    date = email.utils.formatdate(usegmt=True)
    digest = base64.b64encode(hashlib.md5(data).digest()).decode() if data is not None else ''
    headers = {'Date':date}
    if create_only: headers['x-oss-forbid-overwrite'] = 'true'
    if STS: headers['x-oss-security-token'] = STS
    canonical = method+'\n'+digest+'\n'+kind+'\n'+date+'\n'
    canonical += ''.join(k+':'+headers[k]+'\n' for k in sorted(headers) if k.startswith('x-oss-'))
    canonical += '/'+BUCKET+'/'+key
    sig = base64.b64encode(hmac.new(SK.encode(), canonical.encode(), hashlib.sha1).digest()).decode()
    headers['Authorization'] = 'OSS '+AK+':'+sig
    if kind: headers['Content-Type'] = kind
    if digest: headers['Content-MD5'] = digest
    if cache: headers['Cache-Control'] = cache
    if extra_headers: headers.update(extra_headers)
    conn = http.client.HTTPSConnection(HOST, timeout=55)
    try:
        conn.request(method, '/'+urllib.parse.quote(key, safe='/'), body=data, headers=headers)
        response = conn.getresponse()
        body = response.read()
        meta = {k.lower():v for k,v in response.getheaders()}
        if optional and response.status == 404: return None, meta
        if not 200 <= response.status < 300:
            code = re.search(b'<Code>(.*?)</Code>', body)
            raise RuntimeError(method+' '+key+': HTTP '+str(response.status)+' '+(code[1].decode() if code else ''))
        return body, meta
    finally: conn.close()

def put_verified(key, data, kind, immutable=True):
    existing, _ = request('GET', key, optional=True)
    if existing is not None:
        if existing != data: raise RuntimeError('Immutable destination differs: '+key)
        return 'reused'
    cache = 'public, max-age=31536000, immutable' if immutable else 'no-cache, max-age=0, must-revalidate'
    request('PUT', key, data, kind, cache, create_only=True)
    got, _ = request('GET', key)
    if got != data: raise RuntimeError('Byte verification failed: '+key)
    return 'uploaded'

snapshots = {key:request('GET', key) for key in ['love.html','index.html','guest.html']}
before = {key:value[0] for key,value in snapshots.items()}
previous_release = json.loads((SOURCE.parent.parent / 'v10.216-restored-centered-photo/DEPLOYMENT.json').read_text())
if sha(before['love.html']) != previous_release['htmlSha256']:
    raise RuntimeError('Live entry no longer matches reviewed V10.216; no network writes made')
entry_etag = snapshots['love.html'][1].get('etag')
if not entry_etag: raise RuntimeError('Missing live entry ETag; unable to perform the entry comparison')
print('Read-only preflight OK.', flush=True)
put_verified(PREFIX+'previous-love.html', before['love.html'], 'text/html; charset=utf-8', False)
print('Previous love.html backed up and byte-verified.', flush=True)
def publish_asset(item):
    key, (data,kind) = item
    state = put_verified(key, data, kind)
    print(state+' verified '+key.rsplit('/',1)[-1], flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(publish_asset, objects.items()))
music_key = next(key for key in objects if key.endswith('/media/love-duet-192.mp3'))
music_data = objects[music_key][0]
sample, music_headers = request('GET', music_key, extra_headers={'Range':'bytes=0-1023'})
assert sample == music_data[:1024], 'Audio byte-range response differs'
assert music_headers.get('content-range') == 'bytes 0-1023/'+str(len(music_data)), 'Audio range loading unavailable'
assert 'immutable' in music_headers.get('cache-control', ''), 'Audio cache headers missing'
print('Music byte-range loading and cache verified.', flush=True)
font_data, font_headers = request('GET', font_key)
assert sha(font_data) == font_manifest['subsetSha256'] and font_data[:4] == b'wOF2'
assert font_headers.get('content-type', '').split(';')[0] == 'font/woff2', 'Font MIME type differs'
assert 'immutable' in font_headers.get('cache-control', ''), 'Font cache headers missing'
print('Subset font bytes, WOFF2 type and cache verified.', flush=True)
second_photo, second_headers = request('GET', second_photo_key)
assert second_photo == objects[second_photo_key][0]
assert second_headers.get('content-type','').split(';')[0] == 'image/png'
print('New second stack photo bytes and PNG type verified.', flush=True)
music_script, _ = request('GET', music_script_key)
assert music_script == objects[music_script_key][0], 'Music gesture runtime readback differs'
print('Page-wide music gesture runtime verified.', flush=True)
put_verified(ENTRY, html, 'text/html; charset=utf-8', False)
current, current_headers = request('GET', 'love.html')
if current != before['love.html'] or current_headers.get('etag') != entry_etag:
    raise RuntimeError('love.html changed concurrently; entry NOT overwritten')
# OSS PutObject rejects conditional headers (0017-00000245). Keep the proven
# release workflow: byte + ETag comparison immediately before the final PUT,
# a verified backup, and a byte-for-byte readback. This is not atomic CAS.
# https://help.aliyun.com/en/oss/user-guide/0017-00000245
request('PUT', 'love.html', html, 'text/html; charset=utf-8', 'no-cache, max-age=0, must-revalidate')
online, headers = request('GET', 'love.html')
if online != html: raise RuntimeError('Live entry differs; investigate before further writes')
validate_html(SOURCE.read_text(), online.decode())
for key in ['index.html','guest.html']:
    after, _ = request('GET', key)
    if after != before[key]: raise RuntimeError('Unrelated entry changed: '+key)
result = {k:v for k,v in plan.items() if k != 'files'}
result.update(status='verified', cacheControl=headers.get('cache-control'),
              fontBytes=font_manifest['subsetBytes'], originalFontBytes=font_manifest['sourceBytes'],
              fontContentType=font_headers.get('content-type'), fontCache=font_headers.get('cache-control'),
              activeCadence='1.25x; node hold 1000ms; keepsake hold 3000ms; fade 1200ms', musicStartSeconds=50,
              musicRecovery='ordinary cover-ready attempt; one ordinary retry when actual cover turn starts; synchronous real-host/gesture retry without image wait; new touch clears prior pending swipe lock; cancellation bookkeeping; manual pause preserved',
              cameraPhotoScale=1, cameraPhotoOrigin='50% 50%', cameraPhotoPosition='50% 40%',
              coverIdleSeconds=3, cameraPhotoSha256=sha(objects[photo_key][0]),
              gardenPage='removed', stackCards=12, stackPhotos=15,
              secondStackPhotoSha256=sha(objects[second_photo_key][0]),
              lawnFinaleScale=.94*.95, musicLoopStartSeconds=50,
              musicRange=music_headers.get('content-range'), musicCache=music_headers.get('cache-control'),
              previousLoveSha256=sha(before['love.html']), indexSha256=sha(before['index.html']),
              guestSha256=sha(before['guest.html']), backup=PREFIX+'previous-love.html')
SOURCE.with_name('DEPLOYMENT.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print('DEPLOYMENT_RESULT '+json.dumps(result, ensure_ascii=False), flush=True)
