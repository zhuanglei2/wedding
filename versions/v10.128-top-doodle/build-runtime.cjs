// Local source-of-truth build: CSS + ordered scripts, no minifier or network.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const read=name=>fs.readFileSync(path.resolve(__dirname,name),'utf8');
const manifest=JSON.parse(read('bundle-manifest.json'));
const bundle='/* V10.128: ordered deferred runtime bundle. */\n'+manifest.map(name=>';\n/* Source: '+name+' */\n'+read(name)).join('\n');
const html=read('index.html').replace(/<style id="camera-runtime-style">[\s\S]*?<\/style>/,'<style id="camera-runtime-style">\n'+read('camera-story.css')+'\n</style>');
let patch='*** Begin Patch\n';
for(const [name,body]of [['opening-runtime.js',bundle],['index.html',html]])patch+='*** Delete File: '+path.join(__dirname,name)+'\n*** Add File: '+path.join(__dirname,name)+'\n'+body.replace(/\n$/,'').split('\n').map(line=>'+'+line).join('\n')+'\n';
const exe=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();
const result=cp.spawnSync(exe,[],{input:patch+'*** End Patch\n',encoding:'utf8',maxBuffer:1024*1024});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.status)process.exit(result.status);
