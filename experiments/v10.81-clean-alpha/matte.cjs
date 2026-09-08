// User-authorized local alpha-only extraction. RGB and source file stay intact.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const modules = '/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(path.join(modules, 'sharp'));
const { createCanvas } = require(path.join(modules, '@napi-rs/canvas'));
const source = path.resolve(__dirname, '../v10.80-flat-contact-frame/characters-generated.png');
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const silhouettes = [
  [[668,284],[663,269],[668,252],[704,230],[738,216],[728,179],[710,136],[710,108],[720,85],[742,65],[780,43],[826,27],[884,16],[938,12],[982,17],[1007,31],[1018,55],[1020,97],[1029,150],[1073,147],[1102,151],[1117,163],[1117,181],[1102,197],[1080,210],[1056,218],[1072,256],[1082,299],[1086,345],[1080,383],[1056,424],[1098,432],[1106,444],[1168,446],[1185,428],[1211,416],[1230,419],[1241,433],[1242,458],[1235,491],[1223,516],[1203,531],[1173,538],[1111,541],[1117,570],[1128,601],[1127,635],[1107,707],[1100,750],[1114,783],[1119,811],[1118,834],[1102,845],[1065,852],[1009,849],[977,841],[955,838],[952,811],[955,780],[949,747],[948,710],[926,747],[905,776],[880,789],[875,824],[865,848],[846,857],[814,860],[778,853],[749,841],[734,825],[732,806],[742,782],[760,759],[766,738],[778,706],[794,665],[799,636],[780,648],[754,657],[730,654],[710,645],[697,629],[692,609],[696,589],[709,568],[733,556],[755,525],[777,501],[776,485],[796,467],[812,462],[781,426],[758,389],[741,347],[734,299],[708,299],[686,295]],
  [[63,1060],[68,1047],[86,1035],[96,1021],[92,1010],[111,1005],[100,985],[78,977],[67,963],[76,946],[101,887],[128,826],[153,764],[175,702],[197,642],[180,607],[167,568],[157,530],[165,501],[184,465],[204,437],[238,449],[270,467],[296,488],[296,454],[295,423],[306,392],[334,355],[365,375],[401,400],[433,435],[457,467],[470,495],[442,505],[430,515],[463,526],[493,552],[519,582],[541,619],[560,663],[589,709],[614,754],[640,806],[665,849],[690,889],[704,894],[708,907],[699,918],[687,925],[707,948],[735,976],[758,1002],[778,1021],[785,1044],[796,1059],[794,1080],[780,1106],[755,1132],[719,1156],[681,1177],[637,1194],[584,1207],[527,1217],[463,1224],[398,1227],[336,1223],[275,1214],[221,1203],[170,1186],[129,1168],[96,1143],[76,1119],[66,1102],[72,1084]]
];
async function main() {
 const before = hash();
 const {data:rgb,info:{width:w,height:h}} = await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const n=w*h, canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 ctx.fillStyle='white';
 for (const points of silhouettes) {ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
 const drawn=ctx.getImageData(0,0,w,h).data;
 // Protect interiors of pale veil/clothing. Only exterior-connected neutral
 // checker pixels may be removed; garment shadows in the core are not keyed.
 const core=new Uint8Array(n);
 for(let y=12;y<h-12;y++)for(let x=12;x<w-12;x++){
   const i=y*w+x; if(drawn[i*4+3]<250)continue;
   let inside=true;
   for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12],[9,9],[-9,9],[9,-9],[-9,-9]]) if(drawn[((y+dy)*w+x+dx)*4+3]<250){inside=false;break;}
   if(inside)core[i]=1;
 }
 // Source-inspected white sleeve hem: its neutral gray shading resembles a
 // checker tile. Protect this interior strip explicitly, not the background.
 for(let y=520;y<=536;y++)for(let x=1106;x<=1168;x++)core[y*w+x]=1;
 const candidate=new Uint8Array(n), bg=new Uint8Array(n), q=new Int32Array(n);
 for(let i=0;i<n;i++){
   const r=rgb[i*3],g=rgb[i*3+1],b=rgb[i*3+2];
   candidate[i]=!core[i] && Math.max(r,g,b)-Math.min(r,g,b)<=14 && Math.min(r,g,b)>=100 && Math.max(r,g,b)<=222 ? 1:0;
 }
 let head=0,tail=0;
 function add(i){if(candidate[i]&&!bg[i]){bg[i]=1;q[tail++]=i;}}
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
 // Keep the two complete connected foreground silhouettes, discard isolated
 // residual checker compression specks without editing their source RGB.
 const labels=new Int32Array(n),components=[];let label=0;
 for(let start=0;start<n;start++)if(!bg[start]&&!labels[start]){
   label++;head=0;tail=0;q[tail++]=start;labels[start]=label;
   while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;for(const j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&!bg[j]&&!labels[j]){labels[j]=label;q[tail++]=j;}}
   components.push({label,count:tail});
 }
 components.sort((a,b)=>b.count-a.count);
 const keep=new Set(components.slice(0,2).map(c=>c.label));
 const alpha=Buffer.alloc(n);for(let i=0;i<n;i++)alpha[i]=keep.has(labels[i])?255:0;
 // Subpixel feather of alpha only. Never recolor the foreground.
 const soft=await sharp(alpha,{raw:{width:w,height:h,channels:1}}).blur(.4).greyscale().raw().toBuffer();
 if(soft.length!==n)throw Error('Alpha channel length mismatch');
 const rgba=Buffer.alloc(n*4);let transparent=0,opaque=0;
 for(let i=0;i<n;i++){rgb.copy(rgba,i*4,i*3,i*3+3);rgba[i*4+3]=soft[i];if(soft[i]===0)transparent++;if(soft[i]===255)opaque++;}
 const output=path.join(__dirname,'characters-transparent.png');
 await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(output);
 for(const [name,color] of [['red','#922c25'],['dark','#20242b']]){
   const merged=await sharp({create:{width:w,height:h,channels:4,background:color}}).composite([{input:output}]).png().toBuffer();
   await sharp(merged).resize(900).png().toFile(path.join(__dirname,`preview-${name}.png`));
 }
 const reread=await sharp(output).raw().toBuffer();for(let i=0;i<n;i++)for(let c=0;c<3;c++)if(reread[i*4+c]!==rgb[i*3+c])throw Error('RGB changed');
 const checks=[[940,345,'boy face'],[969,546,'boy shirt'],[1115,532,'sleeve hem'],[427,664,'girl face'],[527,772,'neckline'],[240,801,'veil'],[450,1110,'skirt']].map(([x,y,part])=>({part,alpha:soft[y*w+x]}));
 if(checks.some(c=>c.alpha!==255)||hash()!==before)throw Error('Preservation check failed');
 const report={source,sourceSha256:before,width:w,height:h,hasAlpha:true,transparent,opaque,foregroundComponents:components.slice(0,2),sourceRGBUnchanged:true,sourceFileUnchanged:true,checks};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
