/* jusqua120ans autonome : remplace les capacités Claude par Supabase */
(function(){
// Famille visible par défaut tant que le profil ne dit pas « pas d'enfants »
try{const v=JSON.parse(localStorage.getItem("j120")||"null")||{};const m=v.mods||{};if(!("famille" in m)&&!(v.ans&&v.ans.enfants==="non")){v.mods={...m,famille:true};localStorage.setItem("j120",JSON.stringify(v))}}catch(e){}
const CFG=window.J120_CONFIG||{};const OK=!!(CFG.url&&CFG.key&&window.supabase);
const sb=OK?window.supabase.createClient(CFG.url,CFG.key,{auth:{flowType:"implicit",persistSession:true,detectSessionInUrl:true}}):null;
window.J120={sb,ready:null,session:null};
const sessP=(async()=>{if(!sb)return null;try{const {data}=await sb.auth.getSession();window.J120.session=data.session;return data.session}catch(e){return null}})();
window.J120.ready=sessP;
// invitation par lien e-mail : ?c=code ou ?e=code-prenom -> hash de l'appli
sessP.then(()=>{try{const q=new URLSearchParams(location.search);const c=q.get("c"),e=q.get("e");if(c||e){history.replaceState(null,"",location.pathname+(c?"#c-"+c:"#e-"+e));if(!sessionStorage.j120r){sessionStorage.j120r=1;location.reload()}}else{try{sessionStorage.removeItem("j120r")}catch(e){}}
  const h=localStorage.getItem("j120_hash");if(h&&!location.hash.startsWith("#c-")&&!location.hash.startsWith("#e-")){localStorage.removeItem("j120_hash");if(h!==location.hash){location.hash=h}}}catch(e){}});
const uid=()=>window.J120.session&&window.J120.session.user&&window.J120.session.user.id;
const joined={};
async function ensure(path){const m=String(path).match(/^couples\/([a-z0-9]{4,10})/);if(!m||joined[m[1]])return;joined[m[1]]=sb.rpc("join_couple",{c:m[1]}).then(r=>{if(r.error)console.warn(r.error)});await joined[m[1]]}
const snap=rows=>({docs:rows.map(r=>({id:r.id,data:()=>r.data})),metadata:{fromCache:false}});
function docRef(path){const parts=path.split("/");const id=parts.pop(),parent=parts.join("/");
  return {id,
   async get(){await ensure(path);const {data,error}=await sb.from("docs").select("data").eq("path",path).maybeSingle();if(error)throw error;return {exists:!!data,id,data:()=>data?data.data:undefined}},
   async set(v){await ensure(path);const {error}=await sb.from("docs").upsert({path,parent,id,data:JSON.parse(JSON.stringify(v)),updated_at:new Date().toISOString()});if(error)throw error},
   async update(v){const d=await this.get();await this.set({...(d.data()||{}),...v})},
   async delete(){await ensure(path);const {error}=await sb.from("docs").delete().eq("path",path);if(error)throw error}}}
function coll(parent){
  return {doc:id=>docRef(parent+"/"+id),
   async get(){await ensure(parent);const {data,error}=await sb.from("docs").select("id,data").eq("parent",parent);if(error)throw error;return snap(data||[])},
   onSnapshot(cb,err){let stop=false,ch=null,t=null;
     const load=async()=>{try{await ensure(parent);const {data,error}=await sb.from("docs").select("id,data").eq("parent",parent);if(error)throw error;if(!stop)cb(snap(data||[]))}catch(e){if(err)err(e)}};
     load();
     ch=sb.channel("p:"+parent+":"+Math.random().toString(36).slice(2)).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"parent=eq."+parent},()=>{clearTimeout(t);t=setTimeout(load,120)}).subscribe();
     const iv=setInterval(()=>{if(document.visibilityState==="visible")load()},60000);
     return ()=>{stop=true;clearInterval(iv);try{sb.removeChannel(ch)}catch(e){}}}}}
const db={collection:coll,doc:docRef};
function room(){const me=uid()+":"+Math.random().toString(36).slice(2,6);
  return {join:async name=>{const ch=sb.channel("room:"+name,{config:{presence:{key:me}}});let cbs=[];let mine=null;
     const peers=()=>{const st=ch.presenceState();return Object.entries(st).map(([k,arr])=>{const p=(arr[arr.length-1]||{});const {presence_ref,...rest}=p;return {peer:k,isMe:k===me,kind:"viewer",presence:rest}})};
     ch.on("presence",{event:"sync"},()=>{const P=peers();cbs.forEach(f=>{try{f(P)}catch(e){}})});
     await new Promise(r=>ch.subscribe(s=>{if(s==="SUBSCRIBED")r()}));
     return {presence:async o=>{mine=o;await ch.track(o)},peers,onPeers:f=>{cbs.push(f);return ()=>{cbs=cbs.filter(x=>x!==f)}},leave:async()=>{try{await ch.untrack();sb.removeChannel(ch)}catch(e){}},emit:(t,d)=>ch.send({type:"broadcast",event:t,payload:d}),on:(t,f)=>{ch.on("broadcast",{event:t},m=>f(m.payload))}}}}}
let adminP=null;
const user={id:async()=>uid()||null,me:async()=>({id:uid()}),isOwner:()=>!!window.J120.isAdmin,canEdit:()=>true,can:()=>true,profiles:async()=>({})};
const downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);return {status:"saved"}}};
window.claude={use:async name=>{
  if(name==="downloads")return downloads;
  if(!sb)return null;const s=await sessP;if(!s)return null;
  if(!adminP)adminP=sb.from("admins").select("uid").eq("uid",uid()).maybeSingle().then(r=>{window.J120.isAdmin=!!(r.data)}).catch(()=>{});
  if(name==="db")return db;if(name==="user"){await adminP;return user}if(name==="room")return room();return null}};
// ----- connexion par lien magique -----
window.J120.login=async(email,redirectQuery)=>{if(!sb)throw new Error("config");const hm=location.hash.match(/^#(c|e)-(.+)$/);if(hm&&!redirectQuery)redirectQuery="?"+hm[1]+"="+encodeURIComponent(hm[2]);else{try{localStorage.setItem("j120_hash",location.hash||"")}catch(e){}}
  const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+(redirectQuery||"")}});if(error)throw error};
window.J120.invite=async(email,code)=>{if(!sb)throw new Error("config");const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+"?c="+code}});if(error)throw error};
window.J120.logout=async()=>{await sb.auth.signOut();location.reload()};
})();
