"""Explicit OSS release only. Dry-run by default; credentials never written/logged."""
import argparse, base64, concurrent.futures, configparser, email.utils, getpass
import hashlib, hmac, http.client, json, mimetypes, pathlib, re, subprocess, urllib.parse

parser = argparse.ArgumentParser()
parser.add_argument('--deploy', action='store_true')
parser.add_argument('--credentials-file', type=pathlib.Path, help='Existing ossutil INI config; never printed')
args = parser.parse_args()
SOURCE = pathlib.Path(__file__).resolve().with_name('index.html')
ROOT = SOURCE.parents[2]
BUCKET = 'hq-wedding'
HOST = 'hq-wedding.oss-cn-hangzhou.aliyuncs.com'
REV = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
def sha(data): return hashlib.sha256(data).hexdigest()
ATTR = re.compile(r'\b(data-media-srcset|imagesrcset|srcset|data-media-src|data-original|data-src|src|href)="([^"]*)"')
CSS = re.compile(r'url\(\s*([\"\x27]?)(.*?)\1\s*\)')

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
        return '/' + prefix + local.relative_to(ROOT).as_posix() + (('?' + parsed.query) if parsed.query else '') + (('#' + parsed.fragment) if parsed.fragment else '')
    def rewrite(text, base, html=False):
        if html:
            def attr(m):
                name, value = m.groups()
                if name.endswith('srcset'):
                    value = ', '.join(' '.join([route(parts[0], base), *parts[1:]]) for item in value.split(',') if (parts := item.split()))
                else: value = route(value, base)
                return name + '="' + value + '"'
            text = ATTR.sub(attr, text)
        return CSS.sub(lambda m: 'url("' + route(m[2], base) + '")', text)
    source = SOURCE.read_bytes()
    html = rewrite(source.decode(), SOURCE.parent, True).encode()
    while pending:
        file = pending.pop()
        data = raw[file]
        if file.suffix in ('.css', '.js'):
            if file.suffix == '.css' and '@import' in data.decode(): raise RuntimeError('CSS imports require explicit dependency handling')
            data = rewrite(data.decode(), file.parent).encode()
        objects[prefix + file.relative_to(ROOT).as_posix()] = (data, mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
    raw[SOURCE] = source
    fingerprint = sha(json.dumps([(p.relative_to(ROOT).as_posix(), sha(b)) for p, b in sorted(raw.items())], separators=(',', ':')).encode())
    return html, objects, fingerprint

_, _, fingerprint = package('audit/')
PREFIX = 'previews/v10.179-20260914-' + fingerprint[:12] + '/'
ENTRY = PREFIX + 'index.html'
html, objects, final_fingerprint = package(PREFIX)
assert fingerprint == final_fingerprint, 'Sources changed while packaging'
assert b'V10.179' in html and b'href="#our-story"' in html
assert html.count(b'data-memory-card=') == 19
assert '闻涛厅'.encode() in html and '这一刻的幸福<br>想与你一同分享'.encode() in html
assert b'class="rsvp"' not in html and b'<footer>' not in html
assert '爬山徒步'.encode() in html and '爬上徒步'.encode() not in html
assert b'data-start-seconds="0"' in html
assert b'id="cover-music"' not in html
assert b'2026-10-06T16:58:00+08:00' in html
assert len(objects) >= 50
assert all(key.startswith(PREFIX) for key in objects)
assert any(key.endswith('/assets/ma-shan-zheng-v10.6.ttf') for key in objects)
# Check transformed JS too: the deferred FontFace URL must point into this release.
scripts = {key:data.decode() for key,(data,kind) in objects.items() if key.endswith('.js')}
subprocess.run(['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node', '-e',
    'const fs=require("fs"),vm=require("vm");for(const [name,source] of Object.entries(JSON.parse(fs.readFileSync(0,"utf8"))))new vm.Script(source,{filename:name});'],
    input=json.dumps(scripts), text=True, check=True)
assert all('/'+PREFIX+'assets/ma-shan-zheng-v10.6.ttf' in source for key,source in scripts.items() if key.endswith('/handwriting.js'))
plan = dict(version='V10.179', baseRevision=REV, sourceFingerprint=fingerprint, bucket=BUCKET,
            entry=ENTRY, dependencies=len(objects), bytes=sum(len(v[0]) for v in objects.values()),
            htmlBytes=len(html), htmlSha256=sha(html),
            files=[dict(key=k, bytes=len(v[0]), sha256=sha(v[0])) for k,v in sorted(objects.items())])
print(json.dumps({k:v for k,v in plan.items() if k != 'files'} if args.deploy else plan, ensure_ascii=False), flush=True)
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
else:
    value = getpass.getpass('OSS AccessKeyId:AccessKeySecret (hidden, held in memory only): ')
    AK, SK = value.strip().split(':', 1)
    STS = ''
    del value
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

before = {key:request('GET', key)[0] for key in ['love.html','index.html','guest.html']}
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
put_verified(ENTRY, html, 'text/html; charset=utf-8', False)
current, _ = request('GET', 'love.html')
if current != before['love.html']: raise RuntimeError('love.html changed concurrently; entry NOT overwritten')
request('PUT', 'love.html', html, 'text/html; charset=utf-8', 'no-cache, max-age=0, must-revalidate')
online, headers = request('GET', 'love.html')
if online != html: raise RuntimeError('Live entry differs; investigate before further writes')
for key in ['index.html','guest.html']:
    after, _ = request('GET', key)
    if after != before[key]: raise RuntimeError('Unrelated entry changed: '+key)
result = {k:v for k,v in plan.items() if k != 'files'}
result.update(status='verified', cacheControl=headers.get('cache-control'),
              musicRange=music_headers.get('content-range'), musicCache=music_headers.get('cache-control'),
              previousLoveSha256=sha(before['love.html']), indexSha256=sha(before['index.html']),
              guestSha256=sha(before['guest.html']), backup=PREFIX+'previous-love.html')
print('DEPLOYMENT_RESULT '+json.dumps(result, ensure_ascii=False), flush=True)
