// Reuse the established controller suite with a second portrait-stage asset.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.198-garden-inscription');
const original=fs.readFileSync(path.join(base,'test-handoff.cjs'),'utf8');
const marker="portraitImages=[makeImage('portrait',portraitReady)]";
assert(original.includes(marker),'Fixture shape must still match');
for(const source of [
 "portraitImages=[makeImage('portrait',portraitReady),makeImage('eaves',portraitReady)]",
 "portraitImages=[makeImage('portrait',true),makeImage('eaves',portraitReady)]"
]){
 const test=original.replace(marker,source);
 vm.runInNewContext(test,{require,__dirname:base,console},{filename:'two-portrait-assets.cjs'});
}
console.log('PASS: slow/error/loading-cancel sketch cases do not skip the new page or restart a cancelled route.');
