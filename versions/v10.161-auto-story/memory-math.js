((root)=>{'use strict';
 const poses=[[-19,-9,-12],[16,-15,9],[-9,16,-7],[20,12,13],[-22,5,-14],[10,-6,6],[-12,20,-5],[23,-4,12],[-17,-13,-9],[6,18,7],[0,0,-2]];
 function photoSchedule(count=11){let start=0;return Array.from({length:count},(_,i)=>{const result={start,duration:Math.max(400,790-i*35),pose:i===count-1?poses[poses.length-1]:poses[i%(poses.length-1)]};start+=Math.max(180,880-i*78);return result})}
 const nodeHold=1000;
 function glyphDelay(glyph,heading=false){if(/[，、：；]/u.test(glyph))return 75;if(/[。！？…]/u.test(glyph))return 120;if(/[\sA-Za-z0-9]/u.test(glyph))return heading?38:18;return heading?44:30}
 function makePlan(nodes,photoCount=11){let t=400;const events=[];let photoStart=0,holdStart=0,fadeStart=0,photoEnd=0;
  nodes.forEach((blocks,node)=>{events.push({at:t,kind:'node',node});for(let block=0;block<blocks.length;block++){events.push({at:t,kind:'block',node,block});blocks[block].forEach((glyph,index)=>{t+=glyphDelay(glyph,block===0);events.push({at:t,kind:'glyph',node,block,index})});events.push({at:t,kind:'block-end',node,block});if(block<blocks.length-1)t+=block===0?320:240}t+=nodeHold;
   if(node===nodes.length-2){photoStart=t;const schedule=photoSchedule(photoCount);holdStart=t+Math.max(...schedule.map(s=>s.start+s.duration));fadeStart=holdStart+3000;photoEnd=fadeStart+1200;events.push({at:t,kind:'photos',node});events.push({at:photoEnd,kind:'photos-end',node});t=photoEnd+500}
  });const finalPhotoStart=t;events.push({at:t,kind:'final-photo',node:nodes.length-1});return {events,photoStart,holdStart,fadeStart,photoEnd,finalPhotoStart,end:t+2000};
 }
 const api={poses,photoSchedule,glyphDelay,makePlan,nodeHold,keepsakeHold:3000,fadeDuration:1200};
 if(typeof module!=='undefined')module.exports=api;root.WeddingMemoryMath=api;
})(typeof window!=='undefined'?window:globalThis);
