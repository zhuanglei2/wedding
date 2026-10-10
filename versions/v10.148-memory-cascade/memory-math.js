((root)=>{'use strict';
 const poses=[[-19,-9,-12],[16,-15,9],[-9,16,-7],[20,12,13],[-22,5,-14],[10,-6,6],[-12,20,-5],[23,-4,12],[-17,-13,-9],[6,18,7],[0,2,-3]];
 function schedule(count){let start=0;return Array.from({length:count},(_,i)=>{const item={start,duration:Math.max(380,790-i*36),pose:poses[i%poses.length]};start+=Math.max(180,880-i*78);return item})}
 function readDuration(text){return Math.max(1200,Math.min(4200,text.length*95))}
 const api={schedule,readDuration,poses};if(typeof module!=='undefined')module.exports=api;root.WeddingMemoryMath=api;
})(typeof window!=='undefined'?window:globalThis);
