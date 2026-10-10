// One-time source transformation. Emits an apply_patch patch; never writes files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.join(__dirname,'index.html'),html=fs.readFileSync(file,'utf8');
const old=html.split('\n').find(line=>line.includes('<section id="story-timeline"'));
assert(old&&old.includes('data-story-node="4"'));
const list=old.match(/<ol>([\s\S]*?)<\/ol>/)[1];
const nodes=[...list.matchAll(/<li class="story-node[^>]*>[\s\S]*?<\/li>/g)].map(x=>x[0]);
assert.equal(nodes.length,5);
const memoryTail=nodes[3].slice(nodes[3].indexOf('<div class="memory-stack"'));
assert(memoryTail&&memoryTail.endsWith('</li>'));
const glyphs=text=>[...text].map(ch=>'<span class="type-glyph" aria-hidden="true">'+ch+'</span>').join('');
const run=text=>'<span class="story-phrase">'+glyphs(text)+'</span>';
const row=(text,content)=>'<p class="type-block" aria-label="'+text+'">'+content+'</p>';
const first=row('撸串、螺蛳粉、火锅...', ['撸串、','螺蛳粉、','火锅...'].map(run).join(''));
const second=row('拼乐高、骑公路车、听古风演唱会、爬山徒步…',
 ['拼乐高、','骑公路车、'].map(run).join('')+'<br>'+['听古风演唱会、','爬山徒步…'].map(run).join(''));
const last=row('我们在一起了',glyphs('我们在一起了'));
const merged='<li class="story-node memory-node condensed-node" data-story-node="0">'+
 '<h3 class="type-block" aria-label="2024～2026"><time>'+glyphs('2024～2026')+'</time></h3>'+
 '<div class="memory-copy"><div class="timeline-prose condensed-prose">'+first+second+last+'</div>'+memoryTail;
const wedding=nodes[4].replace('data-story-node="4"','data-story-node="1"');
const next=old.replace('<ol>'+list+'</ol>','<ol>'+merged+wedding+'</ol>');
process.stdout.write('*** Begin Patch\n*** Update File: '+file+'\n@@\n-'+old+'\n+'+next+'\n*** End Patch\n');
