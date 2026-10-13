// Huella visual de una carta: 64 bytes = pHash carta (8) + pHash arte (8) + color 4x4 RGB (48).
// El mismo código corre en Node (armador del índice) y en el navegador (escáner).
function cfDesc(px,w,h){
  const N=32;
  function gray(x0,y0,x1,y1){
    const g=new Float64Array(N*N),W=x1-x0,H=y1-y0;
    for(let j=0;j<N;j++){const ya=y0+Math.floor(j*H/N),yb=Math.max(ya+1,y0+Math.floor((j+1)*H/N));
      for(let i=0;i<N;i++){const xa=x0+Math.floor(i*W/N),xb=Math.max(xa+1,x0+Math.floor((i+1)*W/N));let s=0,c=0;
        for(let y=ya;y<yb;y++)for(let x=xa;x<xb;x++){const k=(y*w+x)*4;s+=.299*px[k]+.587*px[k+1]+.114*px[k+2];c++}
        g[j*N+i]=s/c}}
    return g}
  const C=[];for(let u=0;u<8;u++){C[u]=new Float64Array(N);for(let x=0;x<N;x++)C[u][x]=Math.cos((2*x+1)*u*Math.PI/(2*N))}
  function phash(g){
    const t=new Float64Array(8*N);
    for(let u=0;u<8;u++)for(let y=0;y<N;y++){let s=0;for(let x=0;x<N;x++)s+=g[y*N+x]*C[u][x];t[u*N+y]=s}
    const d=new Float64Array(64);
    for(let v=0;v<8;v++)for(let u=0;u<8;u++){let s=0;for(let y=0;y<N;y++)s+=t[u*N+y]*C[v][y];d[v*8+u]=s}
    const m=Array.from(d.slice(1)).sort((a,b)=>a-b)[31];
    const o=new Uint8Array(8);for(let i=0;i<64;i++)if(d[i]>m)o[i>>3]|=1<<(i&7);return o}
  const out=new Uint8Array(64);
  out.set(phash(gray(0,0,w,h)),0);
  out.set(phash(gray(Math.round(w*.08),Math.round(h*.10),Math.round(w*.92),Math.round(h*.52))),8);
  let p=16;
  for(let j=0;j<4;j++){const ya=Math.floor(j*h/4),yb=Math.floor((j+1)*h/4);
    for(let i=0;i<4;i++){const xa=Math.floor(i*w/4),xb=Math.floor((i+1)*w/4);let r=0,g=0,b=0,c=0;
      for(let y=ya;y<yb;y+=2)for(let x=xa;x<xb;x+=2){const k=(y*w+x)*4;r+=px[k];g+=px[k+1];b+=px[k+2];c++}
      out[p++]=r/c;out[p++]=g/c;out[p++]=b/c}}
  return out}
if(typeof module!=='undefined')module.exports={cfDesc};
