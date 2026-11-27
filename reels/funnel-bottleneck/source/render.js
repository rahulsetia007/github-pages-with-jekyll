// node render.js still 0.5,4,7   -> stills/*.png      |  node render.js video  -> frames/ (30 fps JPEG)
const {chromium}=require('playwright');const fs=require('fs');
const segs=JSON.parse(fs.readFileSync(__dirname+'/segs.json'));const last=segs.segs.at(-1);
const END=+(last.start+last.dur+0.9).toFixed(3);
const [mode,list]=process.argv.slice(2);
(async()=>{const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.addInitScript(d=>{window.__DATA__=d},{segs:segs.segs,end:END});
 await pg.goto('file://'+__dirname+'/reel.html');await pg.evaluate(()=>window.__ready);
 if(mode==='still'){fs.mkdirSync(__dirname+'/stills',{recursive:true});for(const t of list.split(',')){await pg.evaluate(t=>seek(+t),t);await pg.screenshot({path:__dirname+`/stills/t${(+t).toFixed(2)}.png`});}}
 else{const out=__dirname+'/frames';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);const N=Math.round(END*30);
  for(let f=0;f<N;f++){await pg.evaluate(t=>seek(t),f/30);await pg.screenshot({path:`${out}/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:94});}
  console.log('frames',N,'end',END);}
 await br.close();})();
