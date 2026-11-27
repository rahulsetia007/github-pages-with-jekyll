// node preview.js 5  -> frames/ for the first N seconds only (quick reviews before a full render)
const {chromium}=require('playwright');const fs=require('fs');
const segs=JSON.parse(fs.readFileSync(__dirname+'/segs.json'));const last=segs.segs.at(-1);
const END=+(last.start+last.dur+0.9).toFixed(3); const SEC=+process.argv[2]||5;
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.addInitScript(d=>{window.__DATA__=d},{segs:segs.segs,end:END});
 await pg.goto('file://'+__dirname+'/reel.html');await pg.evaluate(()=>window.__ready);
 const out=__dirname+'/frames';fs.mkdirSync(out,{recursive:true});
 for(let f=0;f<Math.round(SEC*30);f++){await pg.evaluate(t=>seek(t),f/30);await pg.screenshot({path:`${out}/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:94});}
 await br.close();})();
