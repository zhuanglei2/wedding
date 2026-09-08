// Read-only pixel analysis -> display clipping coordinates, never bitmap edits.
// Usage: node measure-head-masks.cjs (JSON to stdout).
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const scope={};vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
const inside=(x,y,ps)=>{let hit=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
}return hit;};
(async()=>{
  const im=await loadImage(__dirname+'/head-expressions.png'),c=createCanvas(im.width,im.height),ctx=c.getContext('2d');ctx.drawImage(im,0,0);
  const data=ctx.getImageData(0,0,c.width,c.height).data,N=180;
  const masks=[];
  for(let row=0;row<2;row++){
    masks[row]=[];
    for(let col=0;col<6;col++){
      const cx=row?183:182,cy=row?239:229,shape=scope.WeddingCharacterRig.outlines[row][col%3],radii=[];
      for(let i=0;i<N;i++){
        const a=i/N*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let radius=0;
        for(let r=350;r>=0;r--){
          const x=cx+dx*r,y=cy+dy*r;
          if(x<2||x>360||y<2||y>360||!inside(x,y,shape))continue;
          const ix=Math.round(col*362+x),iy=Math.round(row*362+y),k=(iy*c.width+ix)*4;
          const red=data[k],green=data[k+1],blue=data[k+2],min=Math.min(red,green,blue),max=Math.max(red,green,blue);
          if(!(min>143&&max-min<24)){radius=Math.max(0,r-4);break;}
        }
        radii.push(radius);
      }
      masks[row][col]=radii.map((r,i)=>{
        const avg=(radii[(i+N-1)%N]+r*2+radii[(i+1)%N])/4,a=i/N*Math.PI*2,v=Math.min(r,avg);
        return[+(cx+Math.cos(a)*v).toFixed(1),+(cy+Math.sin(a)*v).toFixed(1)];
      });
    }
  }
  process.stdout.write(JSON.stringify(masks));
})();
