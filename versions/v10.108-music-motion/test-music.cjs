const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'music-player.js'),'utf8');
function setup(config={}){
  const element=()=>({attrs:{},events:{},disabled:true,textContent:'',setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,v){this.events[k]=v}});
  const button=element(),mirror=element(),status=element(),caption=element(),title=element();
  let audio,created=0;
  const document={baseURI:'https://example.com/v108/index.html',querySelector:s=>s.includes('toggle')?button:status,querySelectorAll:s=>s.includes('mirror')?[mirror]:s.includes('caption')?[caption]:[title],body:{appendChild(){}},createElement(tag){
    assert.equal(tag,'audio');created++;
    audio=Object.assign(element(),{paused:true,plays:0,loads:0,async play(){this.plays++;if(this.reject)throw Error('blocked');this.paused=false;this.events.playing()},pause(){this.paused=true;this.events.pause()},load(){this.loads++}});
    return audio;
  }};
  vm.runInNewContext(source,{document,window:{WEDDING_MUSIC:config},URL});
  return {button,mirror,status,caption,title,get audio(){return audio},get created(){return created}};
}
(async()=>{
  const demo=setup({src:'',title:'我爱你不问归期',preview:true});
  assert.equal(demo.button.disabled,false);assert.equal(demo.title.textContent,'我爱你不问归期');assert.equal(demo.button.attrs['data-active'],'false');
  demo.button.events.click();assert.equal(demo.button.attrs['data-active'],'true');assert.equal(demo.button.attrs['data-playing'],'false');assert.equal(demo.mirror.attrs['data-active'],'true');assert.match(demo.caption.textContent,/无声/);assert.match(demo.button.attrs['aria-label'],/无声/);
  demo.button.events.click();assert.equal(demo.button.attrs['data-active'],'false');assert.equal(demo.created,0);
  assert.equal(setup().button.disabled,true);
  const invalid=setup({src:'javascript:alert(1)',preview:true});assert.equal(invalid.button.disabled,true);assert.equal(invalid.created,0);
  const real=setup({src:'./music.mp3',title:'我爱你不问归期',loop:true,preview:true});
  assert.equal(real.created,0);assert.equal(real.button.disabled,false);assert.doesNotMatch(real.caption.textContent,/无声/);
  await real.button.events.click();assert.equal(real.created,1);assert.equal(real.audio.preload,'none');assert.equal(real.audio.src,'https://example.com/v108/music.mp3');assert.equal(real.button.attrs['data-playing'],'true');
  real.audio.events.waiting();assert.equal(real.button.attrs['data-active'],'false');assert.equal(real.caption.textContent,'正在缓冲');real.audio.events.playing();assert.equal(real.button.attrs['data-active'],'true');
  await real.button.events.click();assert.equal(real.audio.paused,true);assert.equal(real.button.attrs['data-active'],'false');
  real.audio.reject=true;await real.button.events.click();assert.ok(real.status.textContent);assert.equal(real.button.attrs['aria-busy'],undefined);
  real.audio.reject=false;real.audio.events.error();await real.button.events.click();assert.equal(real.audio.loads,1);assert.equal(real.status.textContent,'');
  await real.button.events.click();let release;real.audio.play=()=>{real.audio.plays++;return new Promise(r=>release=r)};
  const first=real.button.events.click(),count=real.audio.plays;await real.button.events.click();assert.equal(real.audio.plays,count);release();await first;
  real.audio.events.ended();assert.equal(real.button.attrs['data-active'],'false');
  for(const name of ['index.html','preview.html']){
    const html=fs.readFileSync(path.join(__dirname,name),'utf8');
    assert.equal((html.match(/data-music-toggle /g)||[]).length,1);
    assert.equal((html.match(/data-music-mirror /g)||[]).length,name==='index.html'?1:0);
    assert.match(html,/prefers-reduced-motion:reduce/);assert.match(html,/animation-play-state:paused/);assert.match(html,/music-disc-turn 8s linear/);
    const stripped=html.replace(/<style id="music-player-style">[\s\S]*?<\/style>/,'').replace(/\n?<script src="music-(?:config|player)\.js" defer><\/script>/g,'').replace(/<div class="music-slot">[\s\S]*?<\/div>/g,'').replaceAll('../v10.106-reference-party/','').replaceAll('V10.108','V10.106');
    const previous=fs.readFileSync(path.join(__dirname,'../v10.106-reference-party',name),'utf8');
    const normalize=text=>text.trim().replace(/>\s+</g,'><');
    assert.equal(normalize(stripped),normalize(previous),'Original page, images and flip must not change');
    for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      if(/^(https?:|data:)/.test(match[1]))continue;
      assert.ok(fs.existsSync(path.resolve(__dirname,match[1].split('?')[0])),match[1]);
    }
  }
  console.log('PASS: silent demo and truthful labels; zero audio requests; real-source mode; event-driven motion; pause, buffer, end, retry and pending-click guards; unchanged pages; resources.');
})().catch(error=>{console.error(error);process.exitCode=1});
