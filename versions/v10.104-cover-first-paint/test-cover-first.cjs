const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script id="after-cover-font">([\s\S]*?)<\/script>/)[1];
const head=html.split('</head>')[0].replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
assert.ok(!/<link[^>]+rel="stylesheet"/.test(head),'No external render-blocking stylesheets');
assert.ok(!head.includes('fonts.googleapis.com'),'No font request before cover');
assert.ok(head.includes('rel="preload" as="image" href="cover.webp"'));
for(const name of ['motion.css','titles.css','page-turn.css'])assert.ok(head.includes('<style data-inline-source="'+name+'">\n'+fs.readFileSync(__dirname+'/'+name,'utf8')+'</style>'));
async function scenario({complete=false,broken=false,noDecode=false,reject=false,throws=false,noRAF=false}={}){
 const frames=[],requests=[],events={};let release;
 const cover={complete,naturalWidth:broken?0:1400,addEventListener:(event,fn)=>events[event]=fn};
 if(!noDecode)cover.decode=()=>{if(throws)throw Error('decode');return new Promise((ok,fail)=>{release=()=>reject?fail(Error('decode')):ok();});};
 const win={setTimeout:fn=>frames.push(fn)};if(!noRAF)win.requestAnimationFrame=fn=>frames.push(fn);
 const document={querySelector:()=>cover,createElement:()=>({}),head:{appendChild:el=>requests.push(el)}};
 vm.runInNewContext(script,{window:win,document});
 assert.equal(requests.length,0);
 if(!complete){assert.equal(frames.length,0);events.load();}
 if(release){assert.equal(frames.length,0,'Wait for decode before scheduling fonts');release();await Promise.resolve();}
 if(broken){assert.equal(frames.length,0);return;}
 assert.equal(frames.length,1);frames.shift()();assert.equal(requests.length,0,'First frame does not request font');
 frames.shift()();assert.equal(requests.length,1);
 assert.equal(requests[0].media,'print','Late font must not become a blocking stylesheet');
 requests[0].onload();assert.equal(requests[0].media,'all');
 events.load();if(release){release();await Promise.resolve();}assert.equal(frames.length,0,'Only one font request');
}
(async()=>{
 for(const options of [{},{complete:true},{broken:true},{noDecode:true},{reject:true},{throws:true},{noRAF:true}])await scenario(options);
 console.log('PASS: zero external blocking CSS; identical inline styles; cover preload; delayed font after decode/two frames, cached/error/legacy/duplicate paths');
})();
