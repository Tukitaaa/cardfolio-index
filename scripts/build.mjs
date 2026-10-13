// Arma index/cards.json con la huella de cada carta de pokemontcg.io.
// Incremental: solo descarga las imágenes de cartas nuevas.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PNG}=require('pngjs');const jpeg=require('jpeg-js');const {cfDesc}=require('./desc.js');
const OUT='index/cards.json',API='https://api.pokemontcg.io/v2/cards';
const KEY=process.env.PTCG_KEY,H=KEY?{'X-Api-Key':KEY}:{};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// la API de pokemontcg a veces se cuelga o corta: reintenta con espera creciente y corta a los 60 s
async function get(url,bin,tries=bin?6:12){for(let a=0;a<tries;a++){try{const r=await fetch(url,{headers:bin?{}:H,signal:AbortSignal.timeout(60000)});if(r.ok)return bin?Buffer.from(await r.arrayBuffer()):await r.json();if(r.status===404)return null;if(!bin)console.log('API respondió',r.status,'reintento',a+1)}catch(e){if(!bin)console.log('API falló:',e.message,'reintento',a+1)}await sleep(Math.min(60000,3000*(a+1)))}return null}
function decode(buf){if(buf[0]===0x89){const p=PNG.sync.read(buf);return {px:p.data,w:p.width,h:p.height}}const j=jpeg.decode(buf,{useTArray:true,formatAsRGBA:true});return {px:j.data,w:j.width,h:j.height}}
const old=new Map();
if(fs.existsSync(OUT)){const o=JSON.parse(fs.readFileSync(OUT,'utf8'));const d=Buffer.from(o.d,'base64');o.ids.forEach((id,i)=>old.set(id,d.subarray(i*64,i*64+64)))}
const all=[];
for(let page=1;;page++){const j=await get(`${API}?page=${page}&pageSize=250&select=id,images&orderBy=id`);if(!j||!j.data)throw new Error('API caída en página '+page);all.push(...j.data);console.log('página',page,all.length,'/',j.totalCount);if(all.length>=j.totalCount||!j.data.length)break}
const out=new Map();let todo=all.filter(c=>{if(old.has(c.id)){out.set(c.id,old.get(c.id));return false}return c.images&&c.images.small});
console.log('nuevas:',todo.length);let done=0,fail=0;
async function worker(){while(todo.length){const c=todo.shift();const b=await get(c.images.small,true);
  if(b){try{const {px,w,h}=decode(b);out.set(c.id,Buffer.from(cfDesc(px,w,h)))}catch(e){fail++}}else fail++;
  if(++done%500===0)console.log(done,'listas')}}
await Promise.all(Array.from({length:12},worker));
const ids=all.map(c=>c.id).filter(id=>out.has(id));
const d=Buffer.concat(ids.map(id=>out.get(id)));
fs.mkdirSync('index',{recursive:true});
const prev=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):null;
if(prev&&prev.d===d.toString('base64')){console.log('sin cambios');process.exit(0)}
fs.writeFileSync(OUT,JSON.stringify({v:1,n:ids.length,updated:new Date().toISOString().slice(0,10),ids,d:d.toString('base64')}));
console.log('índice:',ids.length,'cartas, fallidas:',fail);
