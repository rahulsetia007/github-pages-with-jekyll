// usage: node render.js still t1,t2,...   |  node render.js frames <from> <to> <caps 0|1> <outdir>
const {chromium}=require('playwright');const fs=require('fs');
const segs=JSON.parse(fs.readFileSync(__dirname+'/segs.json'));const last=segs.segs.at(-1);
const END=+(last.start+last.dur+0.3).toFixed(3);
const [mode,a,b,caps,out]=process.argv.slice(2);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.addInitScript(d=>{window.__DATA__=d},{segs:segs.segs,end:END,caps:mode==='still'?true:caps==='1'});
 await pg.goto('file://'+__dirname+'/reel.html');await pg.evaluate(()=>window.__ready);
 if(mode==='info'){console.log(END,Math.round(END*30));}
 else if(mode==='still'){fs.mkdirSync(__dirname+'/stills',{recursive:true});for(const t of a.split(',')){await pg.evaluate(t=>seek(+t),t);await pg.screenshot({path:__dirname+`/stills/t${(+t).toFixed(2)}.png`});}}
 else{fs.mkdirSync(out,{recursive:true});for(let f=+a;f<+b;f++){await pg.evaluate(t=>seek(t),f/30);await pg.screenshot({path:`${out}/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:94});}}
 await br.close();})();
