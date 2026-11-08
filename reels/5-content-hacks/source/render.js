const {chromium}=require('playwright');const fs=require('fs');
const segs=JSON.parse(fs.readFileSync(__dirname+'/segs.json'));const last=segs.segs.at(-1);
const DATA={segs:segs.segs,end:+(last.start+last.dur+1.5).toFixed(3)};
const [mode,a,b]=process.argv.slice(2);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.addInitScript(d=>{window.__DATA__=d},DATA);
 await pg.goto('file://'+__dirname+'/reel.html');await pg.evaluate(()=>window.__ready);
 if(mode==='info'){console.log(DATA.end);}
 else if(mode==='still'){for(const t of a.split(',')){await pg.evaluate(t=>seek(+t),t);await pg.screenshot({path:__dirname+`/still_${t}.png`});}}
 else{fs.mkdirSync(__dirname+'/frames2',{recursive:true});for(let f=+a;f<+b;f++){await pg.evaluate(t=>seek(t),f/30);await pg.screenshot({path:__dirname+`/frames2/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:95});}}
 await br.close();})();
