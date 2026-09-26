(function(){
'use strict';
const sb=window.AimVaultCSSupabaseConfig?.getClient?.();
const CATS=['pro','dot','small','static','dynamic','green','cyan','white','yellow','funny','minimalist'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ghKey='aimvaultcs.github.settings.v2';
let all=[],session=null,playerPages=[],selectedPlayer=null;
const DEFAULT_SETTINGS={style:4,color:'#66c0f4',size:1,gap:-4,thickness:1,dot:false,outline:false,tstyle:false,recoil:false,alpha:255};
function toast(el,msg,ok=true){if(!el)return;el.textContent=msg;el.className='status '+(ok?'ok':'bad')}
function catsHtml(active=[],target='categoryChecks'){$(target).innerHTML=CATS.map(c=>`<label class="check"><input type="checkbox" value="${c}" ${active.includes(c)?'checked':''}> ${c[0].toUpperCase()+c.slice(1)}</label>`).join('')}
function parseConfig(text){
 const s={...DEFAULT_SETTINGS},t=String(text||'');
 const get=(name,def)=>{const m=t.match(new RegExp('(?:^|[;\\n])\\s*'+name+'\\s+(-?\\d+(?:\\.\\d+)?)','i'));return m?Number(m[1]):def};
 s.style=get('cl_crosshairstyle',4);s.size=get('cl_crosshairsize',1);s.gap=get('cl_crosshairgap',-4);s.thickness=get('cl_crosshairthickness',1);s.alpha=get('cl_crosshairalpha',255);
 s.dot=get('cl_crosshairdot',0)!==0;s.outline=get('cl_crosshair_drawoutline',0)!==0;s.tstyle=get('cl_crosshair_t',0)!==0;s.recoil=get('cl_crosshair_recoil',0)!==0;
 const r=get('cl_crosshaircolor_r',102),g=get('cl_crosshaircolor_g',192),b=get('cl_crosshaircolor_b',244);s.color='#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
 return s;
}
function currentSettings(){return parseConfig($('chCode').value.trim())}
function renderPreview(){
 const stage=$('previewStage');if(stage)stage.style.backgroundImage="linear-gradient(rgba(4,8,13,.28),rgba(4,8,13,.28)),url('/assets/images/crosshair-background.webp')";
 const s=currentSettings(),cross=$('liveCross');if(!cross)return;
 const len=Math.max(3,Math.min(24,Number(s.size||1)*5)),gap=Math.max(2,Math.min(24,(Number(s.gap??-4)+6)*2)),thick=Math.max(1,Math.min(7,Number(s.thickness||1)*2));
 cross.style.setProperty('--cross',s.color);cross.style.setProperty('--len',len+'px');cross.style.setProperty('--gap',gap+'px');cross.style.setProperty('--thick',thick+'px');cross.style.setProperty('--dot',s.dot?'5px':'0px');cross.style.setProperty('--outline',s.outline?'1px':'0px');cross.classList.toggle('tstyle',!!s.tstyle);
 $('liveCode').textContent=$('chCode').value.trim()||'Enter a CS2 share code or configuration above.';
}
function reset(){['chId','chName','chPlayer','chCode','chImage','chTags'].forEach(x=>$(x).value='');$('chPublished').checked=true;catsHtml([]);$('configOutput').value='';renderPreview();toast($('chStatus'),'Ready.')}
function loadCross(x){$('chId').value=x.id||'';$('chName').value=x.name||'';$('chPlayer').value=x.player||'';$('chCode').value=x.code||'';$('chImage').value=x.image_url||'';$('chTags').value=(x.tags||[]).join(', ');$('chPublished').checked=x.published!==false;catsHtml(x.categories||[]);$('configOutput').value=x.code&&x.code.includes('cl_')?x.code:'';renderPreview()}
async function loadCrosshairs(){
 if(!sb)return;const r=await sb.from('cs2_crosshairs').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;all=r.data||[];
 $('crosshairList').innerHTML=all.map(x=>`<div class="admin-item"><div><strong>${esc(x.name)}</strong><small>${esc((x.categories||[]).join(' · '))}${x.player?' · '+esc(x.player):''}${x.published?' · published':' · draft'} · copied ${Number(x.copy_count||0).toLocaleString()} times</small></div><div><button type="button" class="btn btn-dark" data-edit="${esc(x.id)}">Edit</button> <button type="button" class="btn btn-dark danger" data-delete="${esc(x.id)}">Delete</button></div></div>`).join('')||'<div class="status">No crosshairs yet.</div>';
}
function makeConfig(){
 const s=currentSettings(),hex=s.color.replace('#','');const r=parseInt(hex.slice(0,2),16)||102,g=parseInt(hex.slice(2,4),16)||192,b=parseInt(hex.slice(4,6),16)||244;
 const lines=[`cl_crosshairstyle ${s.style}`,`cl_crosshaircolor 5`,`cl_crosshaircolor_r ${r}`,`cl_crosshaircolor_g ${g}`,`cl_crosshaircolor_b ${b}`,`cl_crosshairusealpha 1`,`cl_crosshairalpha ${s.alpha}`,`cl_crosshairsize ${s.size}`,`cl_crosshairgap ${s.gap}`,`cl_crosshairthickness ${s.thickness}`,`cl_crosshairdot ${s.dot?1:0}`,`cl_crosshair_drawoutline ${s.outline?1:0}`,`cl_crosshair_outlinethickness 1`,`cl_crosshair_t ${s.tstyle?1:0}`,`cl_crosshair_recoil ${s.recoil?1:0}`];
 $('configOutput').value=lines.join('\n');if(!$('chCode').value.trim()){$('chCode').value=lines.join('; ');renderPreview()}return lines.join('; ')
}
async function saveCross(){
 if(!sb)return toast($('chStatus'),'Supabase is not configured.',false);
 const cats=[...$('categoryChecks').querySelectorAll('input:checked')].map(x=>x.value),code=$('chCode').value.trim();
 const data={name:$('chName').value.trim(),player:$('chPlayer').value.trim()||null,code:code||null,image_url:$('chImage').value.trim()||null,categories:cats,tags:$('chTags').value.split(',').map(x=>x.trim()).filter(Boolean),is_pro:cats.includes('pro'),published:$('chPublished').checked,settings:currentSettings()};
 if(!data.name)return toast($('chStatus'),'Name is required.',false);if(!data.code)return toast($('chStatus'),'Add a CS2 share code/configuration or click Generate default CS2 config.',false);
 const r=$('chId').value?await sb.from('cs2_crosshairs').update(data).eq('id',$('chId').value):await sb.from('cs2_crosshairs').insert(data);
 if(r.error){toast($('chStatus'),r.error.message,false);return}toast($('chStatus'),'Crosshair saved successfully.');await loadCrosshairs()
}
async function delCross(id){if(!confirm('Delete this crosshair?'))return;const r=await sb.from('cs2_crosshairs').delete().eq('id',id);if(r.error)return toast($('chStatus'),r.error.message,false);await loadCrosshairs();toast($('chStatus'),'Crosshair deleted.')}

function getGh(){try{return JSON.parse(localStorage.getItem(ghKey)||'{}')}catch(_){return {}}}
function setGh(){const v={owner:$('ghOwner').value.trim(),repo:$('ghRepo').value.trim(),branch:$('ghBranch').value.trim()||'main',token:$('ghToken').value.trim()};localStorage.setItem(ghKey,JSON.stringify(v));return v}
function loadGh(){const v=getGh();$('ghOwner').value=v.owner||'';$('ghRepo').value=v.repo||'';$('ghBranch').value=v.branch||'main';$('ghToken').value=v.token||'';if(v.owner&&v.repo&&v.token)toast($('ghStatus'),'GitHub settings loaded.')} 
function ghHeaders(v){return {'Accept':'application/vnd.github+json','Authorization':'Bearer '+v.token,'X-GitHub-Api-Version':'2022-11-28'}}
async function ghGet(path,v){const r=await fetch('https://api.github.com/repos/'+encodeURIComponent(v.owner)+'/'+encodeURIComponent(v.repo)+'/contents/'+path+(path?'?ref='+encodeURIComponent(v.branch):'?ref='+encodeURIComponent(v.branch)),{headers:ghHeaders(v)});const text=await r.text();let data;try{data=JSON.parse(text)}catch(_){data={message:text}}if(!r.ok)throw Error(`${data.message||'GitHub request failed'} (${r.status})`);return data}
async function scanDir(path,v,out,depth=0){if(depth>3)return;const items=await ghGet(path,v);if(!Array.isArray(items))return;for(const it of items){if(it.type==='file'&&it.name==='index.html'&&path!=='admin'&&path!=='assets'){try{const file=await ghGet(it.path,v);const html=decodeBase64(file.content);if(/window\.PLAYER\s*=\s*\{/.test(html))out.push({path:it.path,sha:file.sha,html})}catch(e){console.warn('Could not inspect',it.path,e)}}else if(it.type==='dir'&&!['assets','.github','node_modules','admin'].includes(it.name)){await scanDir(it.path,v,out,depth+1)}}}
function decodeBase64(s){const bin=atob(String(s).replace(/\n/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
function encodeBase64(s){const bytes=new TextEncoder().encode(s);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin)}
function extractPlayer(html){
 const m=html.match(/window\.PLAYER\s*=\s*([\s\S]*?);\s*(?=<\/script>)/);if(!m)return null;
 try{return Function('return ('+m[1]+')')()}catch(_){return null}
}
function playerForm(p,path,html,sha){
 selectedPlayer={path,html,sha};$('playerPath').value=path;$('playerSha').value=sha;$('plName').value=p.name||'';$('plReal').value=p.realName||'';$('plSlug').value=p.slug||path.split('/')[0];$('plTeam').value=p.team||'';$('plCountry').value=p.country||'';$('plRole').value=p.role||'';$('plIntro').value=p.introduction||'';$('plCode').value=p.crosshairCode||'';$('plImage').value=p.playerImageUrl||'';$('plCrossImage').value=p.crosshairImageUrl||'';$('plVerified').value=p.lastVerified||'';$('plSettings').value=JSON.stringify(p.crosshair||{},null,2);catsHtml(Array.isArray(p.crosshairCategories)?p.crosshairCategories:[], 'playerCategoryChecks');$('plSeoTitle').value=p.seoTitle||'';$('plSeoDescription').value=p.seoDescription||'';toast($('playerStatus'),'Loaded '+path)}
function renderPlayers(){const list=$('playerList');list.innerHTML=playerPages.map((x,i)=>{const p=extractPlayer(x.html)||{};return `<div class="admin-item"><div><strong>${esc(p.name||x.path.split('/')[0])}</strong><small>${esc(x.path)}${p.team?' · '+esc(p.team):''}</small></div><button type="button" class="btn btn-dark" data-player-index="${i}">Edit</button></div>`}).join('')||'<div class="status">No player pages detected.</div>'}
async function scanPlayers(){const v=getGh();if(!v.owner||!v.repo||!v.token)return toast($('ghStatus'),'Set GitHub owner, repository and token first.',false);toast($('playerStatus'),'Scanning GitHub repository…');try{const out=[];await scanDir('',v,out);playerPages=out;renderPlayers();toast($('playerStatus'),`Detected ${out.length} player page${out.length===1?'':'s'}.`)}catch(e){toast($('playerStatus'),e.message,false)}}
function jsValue(v){if(v===undefined||v===null)return '';return String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,'\\n')}
function buildPlayerBlock(p){
 const cross=p.crosshair||{};return `window.PLAYER={\n name:"${jsValue(p.name)}",realName:"${jsValue(p.realName)}",slug:"${jsValue(p.slug)}",team:"${jsValue(p.team)}",country:"${jsValue(p.country)}",role:"${jsValue(p.role)}",introduction:"${jsValue(p.introduction)}",\n crosshairCode:"${jsValue(p.crosshairCode)}",playerImageUrl:"${jsValue(p.playerImageUrl)}",crosshairImageUrl:"${jsValue(p.crosshairImageUrl)}",lastVerified:"${jsValue(p.lastVerified)}",\n crosshairCategories:${JSON.stringify(p.crosshairCategories||[])},crosshair:${JSON.stringify(cross)},seoTitle:"${jsValue(p.seoTitle)}",seoDescription:"${jsValue(p.seoDescription)}"\n};`}
function updateHtml(html,p){
 const block=buildPlayerBlock(p);if(!/window\.PLAYER\s*=/.test(html))throw Error('window.PLAYER block not found.');
 html=html.replace(/window\.PLAYER\s*=\s*[\s\S]*?;\s*(?=<\/script>)/,block);
 if(p.seoTitle){html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(p.seoTitle)}</title>`)}
 if(p.seoDescription){if(/<meta[^>]+name=["']description["'][^>]*>/i.test(html))html=html.replace(/<meta[^>]+name=["']description["'][^>]*>/i,`<meta name="description" content="${esc(p.seoDescription)}">`)}
 return html
}
function playerSettingsForDb(raw){
 let c={};try{c=typeof raw==='string'?JSON.parse(raw||'{}'):(raw||{})}catch(_){throw Error('Crosshair settings JSON is invalid.')}
 const colors={green:'#00ff00',cyan:'#00ffff',white:'#ffffff',yellow:'#ffff00',red:'#ff0000',blue:'#0000ff',purple:'#800080'};let color=String(c.color||'#66c0f4');if(!color.startsWith('#'))color=colors[color.toLowerCase()]||'#66c0f4';
 return {style:Number(c.style??4),color,size:Number(c.size??1),gap:Number(c.gap??-4),thickness:Number(c.thickness??1),dot:String(c.centerDot||'').toLowerCase()!=='off'&&String(c.centerDot||'').toLowerCase()!=='false',outline:String(c.outline||'').toLowerCase()!=='off'&&String(c.outline||'').toLowerCase()!=='false',alpha:Number(c.alpha??255)}
}
async function syncPlayerCrosshair(p){
 if(!sb||!p.crosshairCode)return;
 const cats=[...new Set(['pro',...(p.crosshairCategories||[])])];const settings=playerSettingsForDb(p.crosshair);const data={name:(p.name||p.slug||'Player')+' Crosshair',player:p.slug||p.name||null,code:p.crosshairCode,image_url:p.crosshairImageUrl||null,categories:cats,tags:[p.slug||p.name||'player','pro'],is_pro:true,published:true,settings};
 let q=await sb.from('cs2_crosshairs').select('id').eq('player',p.slug||p.name||'').eq('is_pro',true).limit(1).maybeSingle();if(q.error)throw q.error;
 const r=q.data?await sb.from('cs2_crosshairs').update(data).eq('id',q.data.id):await sb.from('cs2_crosshairs').insert(data);if(r.error)throw r.error;
}
async function savePlayer(){
 if(!selectedPlayer)return toast($('playerStatus'),'Select a detected player page first.',false);const p={name:$('plName').value.trim(),realName:$('plReal').value.trim(),slug:$('plSlug').value.trim(),team:$('plTeam').value.trim(),country:$('plCountry').value.trim(),role:$('plRole').value.trim(),introduction:$('plIntro').value.trim(),crosshairCode:$('plCode').value.trim(),playerImageUrl:$('plImage').value.trim(),crosshairImageUrl:$('plCrossImage').value.trim(),lastVerified:$('plVerified').value.trim(),crosshairCategories:[...$('playerCategoryChecks').querySelectorAll('input:checked')].map(x=>x.value),seoTitle:$('plSeoTitle').value.trim(),seoDescription:$('plSeoDescription').value.trim()};let cross;try{cross=JSON.parse($('plSettings').value||'{}')}catch(_){return toast($('playerStatus'),'Crosshair settings JSON is invalid.',false)}p.crosshair=cross;
 try{const v=getGh();if(!v.owner||!v.repo||!v.token)return toast($('playerStatus'),'Set GitHub owner, repository and token first.',false);const html=updateHtml(selectedPlayer.html,p);const body={message:`Update ${p.name||p.slug} player page`,content:encodeBase64(html),sha:selectedPlayer.sha,branch:v.branch||'main'};const r=await fetch('https://api.github.com/repos/'+encodeURIComponent(v.owner)+'/'+encodeURIComponent(v.repo)+'/contents/'+selectedPlayer.path,{method:'PUT',headers:{...ghHeaders(v),'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(`${data.message||'GitHub update failed'} (${r.status})`);selectedPlayer={path:selectedPlayer.path,html,sha:data.content?.sha||selectedPlayer.sha};const idx=playerPages.findIndex(x=>x.path===selectedPlayer.path);if(idx>=0)playerPages[idx]=selectedPlayer;try{await syncPlayerCrosshair(p)}catch(e){console.warn('Player page saved, but Supabase crosshair sync failed:',e);return toast($('playerStatus'),'Player page saved. Crosshair sync failed: '+e.message,false)}toast($('playerStatus'),'Player page and player crosshair saved successfully.');renderPlayers()}catch(e){toast($('playerStatus'),e.message,false)}}
function downloadPlayer(){if(!selectedPlayer)return toast($('playerStatus'),'Select a detected player page first.',false);const p={name:$('plName').value.trim(),realName:$('plReal').value.trim(),slug:$('plSlug').value.trim(),team:$('plTeam').value.trim(),country:$('plCountry').value.trim(),role:$('plRole').value.trim(),introduction:$('plIntro').value.trim(),crosshairCode:$('plCode').value.trim(),playerImageUrl:$('plImage').value.trim(),crosshairImageUrl:$('plCrossImage').value.trim(),lastVerified:$('plVerified').value.trim(),crosshairCategories:[...$('playerCategoryChecks').querySelectorAll('input:checked')].map(x=>x.value),seoTitle:$('plSeoTitle').value.trim(),seoDescription:$('plSeoDescription').value.trim()};try{p.crosshair=JSON.parse($('plSettings').value||'{}')}catch(_){return toast($('playerStatus'),'Crosshair settings JSON is invalid.',false)}const blob=new Blob([updateHtml(selectedPlayer.html,p)],{type:'text/html;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(p.slug||'player')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function afterLogin(){try{const {data,error}=await sb.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();if(error)throw error;if(!data)throw Error('This account is not in admin_users. Add its Auth user UUID there.');$('loginPanel').classList.add('hidden');$('dashboard').classList.remove('hidden');loadGh();await loadCrosshairs()}catch(e){toast($('loginStatus'),e.message,false);await sb.auth.signOut()}}
function init(){catsHtml([]);catsHtml([],'playerCategoryChecks');if(!sb){toast($('loginStatus'),'Supabase config is missing.',false);return}
 $('loginBtn').onclick=async()=>{const r=await sb.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});if(r.error)return toast($('loginStatus'),r.error.message,false);session=r.data.session;await afterLogin()};sb.auth.onAuthStateChange((_e,s)=>{session=s;if(s)afterLogin()});
 $('newCrosshair').onclick=reset;$('saveCrosshair').onclick=saveCross;$('generateConfig').onclick=makeConfig;$('chCode').addEventListener('input',renderPreview);
 $('copyLiveCode').onclick=async()=>{const code=$('chCode').value.trim();if(!code)return toast($('chStatus'),'No CS2 code to copy.',false);try{await navigator.clipboard.writeText(code);toast($('chStatus'),'CS2 code copied.')}catch(e){window.prompt('Copy CS2 code:',code)}};
 $('saveGh').onclick=()=>{const v=setGh();if(!v.owner||!v.repo||!v.token)return toast($('ghStatus'),'Owner, repository and token are required.',false);toast($('ghStatus'),'GitHub settings saved in this browser.')};$('clearGh').onclick=()=>{localStorage.removeItem(ghKey);$('ghToken').value='';toast($('ghStatus'),'GitHub token/settings cleared.')};
 $('scanPlayers').onclick=scanPlayers;$('savePlayer').onclick=savePlayer;$('downloadPlayer').onclick=downloadPlayer;
 document.querySelectorAll('.admin-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('[id^="tab-"]').forEach(x=>x.classList.add('hidden'));tab.classList.add('active');$('tab-'+tab.dataset.tab).classList.remove('hidden')}));
 document.addEventListener('click',async e=>{const edit=e.target.closest('[data-edit]');if(edit){loadCross(all.find(x=>x.id===edit.dataset.edit)||{});return}const del=e.target.closest('[data-delete]');if(del){await delCross(del.dataset.delete);return}const pi=e.target.closest('[data-player-index]');if(pi){const x=playerPages[Number(pi.dataset.playerIndex)];if(x){const p=extractPlayer(x.html);if(p)playerForm(p,x.path,x.html,x.sha);else toast($('playerStatus'),'Could not read PLAYER data.',false)}}});
 renderPreview()
}
window.addEventListener('DOMContentLoaded',()=>{init();if(window.initProIndex)window.initProIndex()})
})();
