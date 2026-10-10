const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=__dirname,W=1200,H=2000;
const scenes=[
 {source:'/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg',width:830,left:370,top:720,contour:'M 375 1130 Q 418 1077 511 1048 Q 618 1072 704 1035 Q 833 1002 915 967 Q 1053 925 1200 910 L 1200 1965 Q 1092 1971 1047 1940 Q 957 1960 884 1925 Q 790 1938 735 1905 Q 627 1903 559 1863 Q 490 1859 455 1803 Q 407 1763 417 1700 Q 396 1640 401 1570 L 373 1400 Q 379 1311 375 1130 Z'},
 {source:'/Users/eleme/Desktop/wedding/59636a811k762aacf68c8ec4b37bbc52.jpg',width:980,left:0,top:-250,contour:'M 0 10 Q 115 40 255 17 Q 365 42 470 15 Q 612 34 725 6 Q 864 3 945 48 Q 995 138 980 224 L 979 807 Q 970 902 949 939 Q 923 991 859 993 Q 774 1042 680 1030 Q 563 1080 459 1065 Q 380 1096 301 1069 Q 173 1081 70 1030 Q 0 1000 0 955 Z'}
];
(async()=>{
 const layers=[];
 for(const p of scenes){
  const photo=await sharp(p.source).rotate().resize({width:p.width}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path fill="white" d="${p.contour}"/></svg>`);
  const a=await sharp(svg).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  const rgba=Buffer.alloc(W*H*4);
  for(let y=0;y<photo.info.height;y++)for(let x=0;x<p.width;x++){
   const ox=x+p.left,oy=y+p.top;if(ox<0||ox>=W||oy<0||oy>=H)continue;
   const i=(oy*W+ox)*4,j=(y*p.width+x)*3;
   for(let c=0;c<3;c++)rgba[i+c]=photo.data[j+c];rgba[i+3]=a[oy*W+ox];
  }
  layers.push({input:await sharp(rgba,{raw:{width:W,height:H,channels:4}}).png().toBuffer()});
 }
 await sharp({create:{width:W,height:H,channels:3,background:'#f7f4ee'}}).composite(layers).png().toFile(path.join(root,'design/scene-guide.png'));
 console.log('Full-scene registration guide prepared; original portraits unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1});
