// Separate AimVaultCS Supabase configuration.
// Do not point this at the Valorant AimVault project.
window.AIMVAULTCS_SUPABASE={url:'https://mlchafojfypijsionosu.supabase.co',anonKey:'sb_publishable_E8X1DQ1w1j2ITT67BjizLw_rWckuTu-'};
window.AimVaultCSSupabaseConfig={getClient:function(){const c=window.AIMVAULTCS_SUPABASE||{},u=String(c.url||'').trim().replace(/\/$/,''),k=String(c.anonKey||'').trim();if(!u||!k||u.includes('YOUR-CS2')||k.includes('YOUR-CS2')||!window.supabase)return null;try{const x=new URL(u);if(x.protocol!=='https:'||!x.hostname.endsWith('.supabase.co'))return null}catch(e){return null}return window.supabase.createClient(u,k)}};
