(function(){
const $=id=>document.getElementById(id),v=id=>$(id).value;
const defaults={style:4,color:1,r:0,g:255,b:0,alpha:255,size:1,gap:-4,thickness:1,dot:0,outline:0,outlineThickness:0.5,tstyle:0,recoil:0,weaponGap:0,fixedGap:0};
const colorNames={0:'Red',1:'Green',2:'Yellow',3:'Blue',4:'Custom',5:'Custom'};
function setFromHash(){try{const q=new URLSearchParams(location.hash.slice(1));Object.keys(defaults).forEach(k=>{if(q.has(k)&&$(k))$(k).value=q.get(k)});update()}catch(e){}}
function config(){const x={style:+v('style'),color:+v('color'),r:+v('r'),g:+v('g'),b:+v('b'),alpha:+v('alpha'),size:+v('size'),gap:+v('gap'),thickness:+v('thickness'),dot:+v('dot'),outline:+v('outline'),outlineThickness:+v('outlineThickness'),tstyle:+v('tstyle'),recoil:+v('recoil'),weaponGap:+v('weaponGap'),fixedGap:+v('fixedGap')};return x}
function commands(x){return [
`cl_crosshairstyle ${x.style}`,
`cl_crosshaircolor ${x.color}`,
`cl_crosshaircolor_r ${x.r}`,
`cl_crosshaircolor_g ${x.g}`,
`cl_crosshaircolor_b ${x.b}`,
`cl_crosshairalpha ${x.alpha}`,
`cl_crosshairsize ${x.size}`,
`cl_crosshairgap ${x.gap}`,
`cl_crosshairthickness ${x.thickness}`,
`cl_crosshairdot ${x.dot}`,
`cl_crosshair_drawoutline ${x.outline}`,
`cl_crosshair_outlinethickness ${x.outlineThickness}`,
`cl_crosshair_t ${x.tstyle}`,
`cl_crosshair_recoil ${x.recoil}`,
`cl_crosshairgap_useweaponvalue ${x.weaponGap}`,
`cl_fixedcrosshairgap ${x.fixedGap}`
].join('; ')+';'}
function update(){
 const x=config(), color=x.color>=4?`rgb(${x.r},${x.g},${x.b})`:x.color===1?'#00ff00':x.color===2?'#ffff00':x.color===3?'#66c0f4':'#ff3b3b';
 const len=Math.max(4,Math.min(20,x.size*5)),gap=Math.max(2,Math.min(18,(x.gap+6)*2)),thick=Math.max(1,Math.min(5,x.thickness*2)),dot=x.dot?Math.max(3,Math.min(8,4)):0;
 $('genCross').style.cssText=`--cross:${color};--len:${len}px;--gap:${gap}px;--thick:${thick}px;--dot:${dot}px;--outline:${x.outline?'1px':'0px'}`;
 $('output').value=commands(x);$('summary').textContent=`Style ${x.style} · ${colorNames[x.color]||'Custom'} · Size ${x.size} · Gap ${x.gap} · Thickness ${x.thickness}`;
 const q=new URLSearchParams();Object.entries(x).forEach(([k,z])=>q.set(k,z));history.replaceState(null,'','#'+q.toString());
}
document.addEventListener('DOMContentLoaded',()=>{Object.keys(defaults).forEach(k=>$(k)?.addEventListener('input',update));$('reset').onclick=()=>{Object.entries(defaults).forEach(([k,z])=>{if($(k))$(k).value=z});history.replaceState(null,'',location.pathname);update()};$('copy').onclick=()=>navigator.clipboard.writeText($('output').value).then(()=>alert('CS2 configuration copied.'));$('share').onclick=()=>navigator.clipboard.writeText(location.href).then(()=>alert('Generator link copied.'));$('generate').onclick=update;setFromHash()});
})();