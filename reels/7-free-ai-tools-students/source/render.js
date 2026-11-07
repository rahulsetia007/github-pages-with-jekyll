const {chromium}=require('playwright');const fs=require('fs');
const segs=JSON.parse(fs.readFileSync('segs.json'));const cta=segs.segs.at(-1);
const DATA={segs:segs.segs,end:+(cta.start+cta.dur+1.3).toFixed(3)};
const [mode,a,b]=process.argv.slice(2); // still t1,t2,...  | frames from to
(async()=>{
 const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 pg.on('console',m=>console.log('PAGE',m.text()));pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.addInitScript(d=>{window.__DATA__=d},DATA);
 await pg.goto('file://'+__dirname+'/reel.html');await pg.evaluate(()=>window.__ready);
 if(mode==='still'){for(const t of a.split(',')){await pg.evaluate(t=>seek(+t),t);await pg.screenshot({path:`still_${t}.png`});}}
 else { fs.mkdirSync('frames',{recursive:true}); const fps=30;
   for(let f=+a;f<+b;f++){await pg.evaluate(t=>seek(t),f/fps);await pg.screenshot({path:`frames/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:95});}}
 if(mode==='info')console.log(DATA.end);
 await br.close();})();
