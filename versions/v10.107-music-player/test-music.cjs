const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'music-player.js'), 'utf8');
function setup(src = '') {
  const element = () => ({attrs:{},events:{},disabled:true,textContent:'',setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,v){this.events[k]=v}});
  const button=element(), mirror=element(), status=element();
  let audio, created=0;
  const document={baseURI:'https://example.com/v107/index.html',querySelector:s=>s.includes('toggle')?button:status,querySelectorAll:()=>[mirror],body:{appendChild(){}},createElement(tag){
    assert.equal(tag,'audio'); created++;
    audio=Object.assign(element(),{paused:true,plays:0,loads:0,async play(){this.plays++;if(this.reject)throw Error('blocked');this.paused=false;this.events.playing()},pause(){this.paused=true;this.events.pause()},load(){this.loads++}});
    return audio;
  }};
  vm.runInNewContext(source,{document,window:{WEDDING_MUSIC:{src,loop:true}},URL});
  return {button,mirror,status,get audio(){return audio},get created(){return created}};
}
(async()=>{
  const empty=setup();assert.equal(empty.created,0);assert.equal(empty.button.disabled,true);assert.equal(empty.button.events.click,undefined);
  const invalid=setup('javascript:alert(1)');assert.equal(invalid.button.disabled,true);assert.equal(invalid.created,0);
  const test=setup('./music.mp3');assert.equal(test.created,0);assert.equal(test.button.disabled,false);
  await test.button.events.click();assert.equal(test.created,1);assert.equal(test.audio.src,'https://example.com/v107/music.mp3');assert.equal(test.audio.preload,'none');assert.equal(test.button.attrs['aria-pressed'],'true');assert.equal(test.mirror.attrs['data-playing'],'true');
  await test.button.events.click();assert.equal(test.audio.paused,true);assert.equal(test.button.attrs['aria-pressed'],'false');
  test.audio.reject=true;await test.button.events.click();assert.ok(test.status.textContent);assert.equal(test.button.attrs['aria-busy'],undefined);assert.equal(test.button.attrs['aria-pressed'],'false');
  test.audio.reject=false;test.audio.events.error();await test.button.events.click();assert.equal(test.audio.loads,1);assert.equal(test.status.textContent,'');
  await test.button.events.click();let release;test.audio.play=()=>{test.audio.plays++;return new Promise(r=>release=r)};
  const first=test.button.events.click(), plays=test.audio.plays;await test.button.events.click();assert.equal(test.audio.plays,plays);release();await first;
  for(const name of ['index.html','preview.html']){
    const html=fs.readFileSync(path.join(__dirname,name),'utf8');
    assert.equal((html.match(/data-music-toggle /g)||[]).length,1);
    assert.equal((html.match(/data-music-mirror /g)||[]).length,name==='index.html'?1:0);
    const stripped=html.replace(/<style id="music-player-style">[\s\S]*?<\/style>/,'').replace(/\n?<script src="music-(?:config|player)\.js" defer><\/script>/g,'').replace(/<div class="music-slot">[\s\S]*?<\/div>/g,'').replaceAll('../v10.106-reference-party/','').replaceAll('V10.107','V10.106');
    const previous=fs.readFileSync(path.join(__dirname,'../v10.106-reference-party',name),'utf8');
    const normalize=text=>text.trim().replace(/>\s+</g,'><');
    assert.equal(normalize(stripped),normalize(previous),name+' must preserve original art, photo and motion');
    for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      if(/^(https?:|data:)/.test(match[1]))continue;
      assert.ok(fs.existsSync(path.resolve(__dirname,match[1].split('?')[0])),match[1]);
    }
  }
  console.log('PASS: empty reservation, lazy audio, play/pause, mirrored state, error/retry, click dedup, unchanged base pages, local references.');
})().catch(error=>{console.error(error);process.exitCode=1});
