(function(){
const p=window.PLAYER||{},e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
document.addEventListener('DOMContentLoaded',()=>{
 const set=(id,v)=>{const x=document.getElementById(id);if(x)x.innerHTML=v}; const setAll=(ids,v)=>ids.forEach(id=>document.querySelectorAll('[id=\"'+id+'\"]').forEach(x=>x.innerHTML=v));
 set('playerName',e(p.name||'Player'));set('realName',e(p.realName||'Not available'));setAll(['team','team2'],e(p.team||'Not available'));setAll(['country','country2'],e(p.country||'Not available'));setAll(['role','role2'],e(p.role||'Not available'));set('verified',e(p.lastVerified||'Not available'));set('code',e(p.crosshairCode||'Not available'));set('playerIntroduction',e(p.introduction||'Not available'));
 const pi=document.getElementById('playerImage'),ci=document.getElementById('crosshairImage');
 if(p.playerImageUrl){pi.src=p.playerImageUrl;pi.style.display='block';document.getElementById('playerInitials').style.display='none';pi.onerror=()=>{pi.style.display='none';document.getElementById('playerInitials').style.display='flex'}}
 if(p.crosshairImageUrl){ci.src=p.crosshairImageUrl;ci.style.display='block';document.getElementById('crosshairVisual').style.display='none';ci.onerror=()=>{ci.style.display='none';document.getElementById('crosshairVisual').style.display='block'}}
 const copyBtn=document.getElementById('copyPlayerCode');
 const countEl=document.getElementById('playerCopyCount');
 async function refreshCount(){
   const client=window.AimVaultCSSupabaseConfig?.getClient?.();
   if(!client||!p.crosshairCode||!countEl)return;
   try{const r=await client.from('cs2_crosshairs').select('id,copy_count').eq('code',p.crosshairCode).eq('published',true).limit(1).maybeSingle();if(r.error||!r.data)return;countEl.textContent=`Copied ${Number(r.data.copy_count||0).toLocaleString()} ${Number(r.data.copy_count||0)===1?'time':'times'}`;countEl.dataset.crosshairId=r.data.id;}
   catch(_){ }
 }
 refreshCount();
 copyBtn?.addEventListener('click',async()=>{
   const code=p.crosshairCode||''; if(!code)return;
   try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(code);else window.prompt('Copy CS2 code:',code);alert('CS2 code copied.');
     const client=window.AimVaultCSSupabaseConfig?.getClient?.(),id=countEl?.dataset.crosshairId;
     if(client&&id){const r=await client.rpc('increment_cs2_copy_count',{p_crosshair_id:id});if(!r.error&&countEl){const n=Number(r.data||0);countEl.textContent=`Copied ${n.toLocaleString()} ${n===1?'time':'times'}`;}}
   }catch(_){alert('Could not copy the CS2 code.');}
 });
 if(window.supabase&&window.AimVaultCSSupabaseConfig){try{const client=window.AimVaultCSSupabaseConfig.getClient?.();client?.channel('player-copy-counts').on('postgres_changes',{event:'UPDATE',schema:'public',table:'cs2_crosshairs'},payload=>{if(payload.new?.id===countEl?.dataset.crosshairId&&countEl){const n=Number(payload.new.copy_count||0);countEl.textContent=`Copied ${n.toLocaleString()} ${n===1?'time':'times'}`;}}).subscribe()}catch(_){}}
});
})();