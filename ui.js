/* jusqua120ans autonome : compte (lien magique), invitations par e-mail */
(function(){
const J=window.J120||{};
try{const st=document.createElement('style');st.textContent='.jx-nav{margin-right:8px;white-space:nowrap}';document.head.appendChild(st)}catch(e){}const $=id=>document.getElementById(id);
const esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function sheet(html){const o=document.createElement("div");o.className="jx-ov";o.innerHTML=`<div class="jx-box"><button type="button" class="jx-x" aria-label="Fermer">×</button>${html}</div>`;document.body.appendChild(o);o.querySelector(".jx-x").onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};return o}
function loginSheet(why){if(!J.sb){sheet(`<h3>Bientôt</h3><p>La connexion n'est pas encore configurée sur ce site.</p>`);return}
  const o=sheet(`<h3>🔐 Mon compte jusqua120ans</h3><p>${why||"Connectez-vous pour retrouver votre espace à deux, votre agenda partagé et vos quiz sur tous vos appareils."}</p>
   <form id="jxF"><input id="jxE" type="email" required placeholder="votre@email.fr" autocomplete="email"><button type="submit" class="btn btn-rose wide">Recevoir mon lien de connexion</button></form><p class="jx-s" id="jxS"></p><small>Pas de mot de passe : vous recevez un e-mail avec un lien, un clic et c'est fait.</small>`);
  o.querySelector("#jxF").onsubmit=async e=>{e.preventDefault();const em=o.querySelector("#jxE").value.trim(),st=o.querySelector("#jxS");st.textContent="Envoi…";
    try{await J.login(em);st.innerHTML=`✅ C'est envoyé à <b>${esc(em)}</b>. Ouvrez l'e-mail sur ce téléphone et touchez le lien.`}catch(err){st.textContent="Envoi impossible : "+(err&&err.message||"réessayez dans quelques minutes")}}}
function accountSheet(){const s=J.session;sheet(`<h3>Mon compte</h3><p>Connecté(e) avec <b>${esc(s.user.email)}</b>.</p><button type="button" class="btn btn-line wide" id="jxOut">Se déconnecter</button>`);$("jxOut").onclick=()=>J.logout()}
function open(){J.session?accountSheet():loginSheet()}
function chip(){const h=document.querySelector(".ahead > div:last-child");if(h&&!$("jxChip")){const b=document.createElement("button");b.type="button";b.id="jxChip";b.className="iconbtn jx-chip"+(J.session?" on":"");b.setAttribute("aria-label",J.session?"Mon compte":"Se connecter");b.textContent=J.session?"✓":"🔐";b.onclick=open;h.insertBefore(b,h.firstChild)}
  const w=document.querySelector("nav .wrap");if(w&&!$("jxNav")){const b=document.createElement("button");b.type="button";b.id="jxNav";b.className="btn btn-line jx-nav";b.textContent=J.session?"✓ Mon compte":"🔐 Se connecter";b.onclick=open;const o=w.querySelector('[data-open="lien"]');w.insertBefore(b,o)}
  const m=document.querySelector(".sitemenu");if(m&&!$("jxMenu")){const b=document.createElement("button");b.type="button";b.id="jxMenu";b.textContent=J.session?"✓ Mon compte":"🔐 Se connecter";b.onclick=open;m.appendChild(b)}}
document.addEventListener("click",e=>{if(e.target.closest("[data-jxlogin]"))open()});
(J.ready||Promise.resolve()).then(()=>{chip();
  if(!J.session&&/^#(c|e)-/.test(location.hash))setTimeout(()=>loginSheet(location.hash.startsWith("#e-")?"Pour ouvrir ton espace de révision jusqua20sur20, entre ton adresse e-mail : tu recevras un lien de connexion.":"Vous êtes invité(e) dans un espace à deux ♥ Entrez votre adresse e-mail pour le rejoindre : vous recevrez un lien de connexion."),600)});
document.addEventListener("click",async e=>{const b=e.target.closest("#sSend");if(!b)return;const em=($("sEm")||{}).value||"";const msg=($("iMsg")||{}).value||"";const m=msg.match(/#c-([a-z0-9]{4,10})/);const st=$("sSt");
  if(!/.+@.+\..+/.test(em)){st.textContent="Saisissez son adresse e-mail.";return}if(!m){st.textContent="Espace à deux pas encore créé : réessayez dans un instant.";return}
  if(!J.session){loginSheet("Connectez-vous d'abord : l'invitation partira de votre compte.");return}
  b.disabled=true;st.textContent="Envoi…";try{await J.invite(em.trim(),m[1]);st.innerHTML=`✅ Invitation envoyée à <b>${esc(em)}</b> : elle reçoit un e-mail avec un lien pour vous rejoindre.`}catch(err){st.textContent="Envoi impossible : "+(err&&err.message||"réessayez plus tard");b.disabled=false}});
})();
