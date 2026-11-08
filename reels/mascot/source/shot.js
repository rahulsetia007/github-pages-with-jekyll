const {chromium}=require('playwright');
const poses=JSON.parse(process.argv[2]);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:900}});
await p.goto('file://'+__dirname+'/character.html');await p.evaluate(()=>window.__ready);
for(const [name,o] of Object.entries(poses)){await p.evaluate(o=>pose(o),o);await p.screenshot({path:__dirname+'/'+name+'.png',omitBackground:true});}
await b.close();})();
