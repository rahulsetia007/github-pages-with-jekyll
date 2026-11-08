const {chromium}=require('playwright');const fs=require('fs');
const F=JSON.parse(fs.readFileSync(__dirname+'/demo_frames.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:900}});
await p.goto('file://'+__dirname+'/character.html');await p.evaluate(()=>window.__ready);
fs.mkdirSync(__dirname+'/df',{recursive:true});
for(let i=0;i<F.length;i++){await p.evaluate(o=>pose(o),F[i]);await p.screenshot({path:__dirname+`/df/f${String(i).padStart(4,'0')}.png`,omitBackground:true});}
await b.close();})();
