const fs=require('node:fs'),path=require('node:path');
const deps='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));
const dir=process.argv[2];
(async()=>{
 const c=createCanvas(1500,1470),x=c.getContext('2d');
 x.fillStyle='#172532';x.fillRect(0,0,c.width,c.height);
 for(let k=0;k<9;k++){
  const f=k*12,dx=k%3*500,dy=Math.floor(k/3)*490;
  x.drawImage(await loadImage(path.join(dir,`frame-${String(f+1).padStart(3,'0')}.png`)),260,240,280,420,dx,dy+35,467,450);
  x.fillStyle='white';x.font='18px sans-serif';x.fillText(`frame ${f} / ${(f/24).toFixed(1)}s`,dx+5,dy+22);
  x.font='11px sans-serif';
  for(let gx=280;gx<=520;gx+=40){let xx=dx+(gx-260)*467/280;x.strokeStyle='#00ffff40';x.beginPath();x.moveTo(xx,dy+35);x.lineTo(xx,dy+485);x.stroke();x.fillText(gx,xx,dy+47);}
  for(let gy=280;gy<=640;gy+=40){let yy=dy+35+(gy-240)*450/420;x.strokeStyle='#00ffff40';x.beginPath();x.moveTo(dx,yy);x.lineTo(dx+467,yy);x.stroke();x.fillText(gy,dx+3,yy);}
 }
 fs.writeFileSync(path.join(__dirname,'source-grid.jpg'),c.toBuffer('image/jpeg'));
})();
