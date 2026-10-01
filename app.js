
let people=[], filtered=[], seedPeople=[], accounts=[], session=null;
const $=s=>document.querySelector(s);
const uid=()=> (crypto?.randomUUID ? crypto.randomUUID() : 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
const DEFAULT_COMPANY='KEP CONGO';
const DEFAULT_CLIENT_NAME='KEP Congo';
const EXCEL_FILE_NAME='Personnel KEP CONGO.xlsx';

/* ============================================================
   Base de données locale (IndexedDB)
   ------------------------------------------------------------
   Deux tables :
   - employees : les collaborateurs de l'annuaire
   - accounts  : les comptes d'accès (utilisateurs / administrateurs),
                 mots de passe stockés hachés (PBKDF2-SHA256 + sel),
                 jamais en clair.
   La base reste propre à CE navigateur/appareil : pour la faire
   suivre sur un autre poste, utiliser Sauvegarder / Restaurer.
   ============================================================ */
const DB_NAME='kep_connect_db', DB_VERSION=1, STORE='employees', ACCOUNTS='accounts';

/* Connexion robuste pour mobile : Safari (iPhone) et certains Android
   ferment la connexion IndexedDB en arrière-plan ou après inactivité.
   On ne réutilise donc jamais une connexion fermée : on la rouvre, et
   toute opération échouée pour cette raison est rejouée une fois. */
let _dbPromise=null;
function resetDB(){ const p=_dbPromise; _dbPromise=null; if(p) p.then(db=>{ try{ db.close(); }catch(e){} }).catch(()=>{}); }
function openDB(){
  if(_dbPromise) return _dbPromise;
  _dbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)||!window.indexedDB){ reject(new Error('IndexedDB non disponible dans ce navigateur')); return; }
    let req;
    try{ req=indexedDB.open(DB_NAME, DB_VERSION); }catch(e){ reject(e); return; }
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('department','department',{unique:false});
        store.createIndex('location','location',{unique:false});
      }
      if(!db.objectStoreNames.contains(ACCOUNTS)){
        const acc=db.createObjectStore(ACCOUNTS,{keyPath:'id'});
        acc.createIndex('login','login',{unique:true});
      }
    };
    req.onsuccess=()=>{
      const db=req.result;
      db.onclose=()=>{ _dbPromise=null; };                       // fermée par le navigateur
      db.onversionchange=()=>{ try{ db.close(); }catch(e){} _dbPromise=null; }; // autre onglet / mise à jour
      resolve(db);
    };
    req.onerror=()=>{ _dbPromise=null; reject(req.error||new Error('Ouverture de la base impossible')); };
    req.onblocked=()=>{ /* un ancien onglet garde la base ouverte : on attend qu'il la libère */ };
  });
  return _dbPromise;
}
const isClosedDbError=e=>!!e && (e.name==='InvalidStateError' || e.name==='TransactionInactiveError' || /closing|closed|connection.*lost|lost.*connection/i.test(e.message||''));
/* Exécute une opération sur une table ; si la connexion était fermée,
   on rouvre la base et on réessaie (jusqu'à 2 fois). */
async function withStore(store, mode, work, attempt=0){
  try{
    const db=await openDB();
    return await new Promise((resolve,reject)=>{
      let tx;
      try{ tx=db.transaction(store,mode); }catch(e){ reject(e); return; }
      let result;
      try{ result=work(tx.objectStore(store)); }catch(e){ reject(e); return; }
      tx.oncomplete=()=>resolve(result instanceof IDBRequest ? result.result : result);
      tx.onerror=()=>reject(tx.error||new Error('Erreur de la base locale'));
      tx.onabort=()=>reject(tx.error||new Error('Opération annulée par le navigateur (connection closing)'));
    });
  }catch(e){
    if(attempt<2 && isClosedDbError(e)){ resetDB(); await new Promise(r=>setTimeout(r,120*(attempt+1))); return withStore(store,mode,work,attempt+1); }
    throw e;
  }
}
function dbGetAll(store=STORE){ return withStore(store,'readonly',s=>s.getAll()); }
function dbPut(record,store=STORE){ return withStore(store,'readwrite',s=>{ s.put(record); }).then(()=>{}); }
function dbBulkPut(records,store=STORE){ if(!records.length) return Promise.resolve(); return withStore(store,'readwrite',s=>{ records.forEach(r=>s.put(r)); }).then(()=>{}); }
function dbDelete(id,store=STORE){ return withStore(store,'readwrite',s=>{ s.delete(id); }).then(()=>{}); }
function dbClear(store=STORE){ return withStore(store,'readwrite',s=>{ s.clear(); }).then(()=>{}); }
// Au retour sur l'application (téléphone sorti de veille, changement d'app), on repart d'une connexion neuve.
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') resetDB(); });
window.addEventListener('pageshow',e=>{ if(e.persisted) resetDB(); });

/* ============================================================
   Icônes SVG (identité visuelle cohérente, aucun emoji)
   ============================================================ */
const ICONS={
  search:'<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  x:'<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  check:'<polyline points="5 13 10 18 19 7"/>',
  building:'<rect x="4" y="3" width="9" height="18" rx="1"/><rect x="15" y="9" width="5" height="12" rx="1"/><line x1="7" y1="7" x2="7" y2="7.01"/><line x1="10" y1="7" x2="10" y2="7.01"/><line x1="7" y1="11" x2="7" y2="11.01"/><line x1="10" y1="11" x2="10" y2="11.01"/><line x1="7" y1="15" x2="7" y2="15.01"/><line x1="10" y1="15" x2="10" y2="15.01"/>',
  'map-pin':'<path d="M12 21s-7-7.6-7-12a7 7 0 1 1 14 0c0 4.4-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone:'<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.1.3 2.3.5 3.5.5.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1A17.5 17.5 0 0 1 4.5 6.6c0-.6.4-1 1-1H9c.6 0 1 .4 1 1 0 1.2.2 2.4.5 3.5.1.4 0 .8-.3 1.1z"/>',
  'user-plus':'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.3 3-5.5 5.5-5.5s4.9 2.2 5.5 5.5"/><line x1="18" y1="8" x2="18" y2="14"/><line x1="15" y1="11" x2="21" y2="11"/>',
  user:'<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.8 3.6-6 7.5-6s6.7 2.2 7.5 6"/>',
  briefcase:'<rect x="3" y="8" width="18" height="11" rx="1.5"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/>',
  sliders:'<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="1.8"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="1.8"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="1.8"/>',
  home:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/>',
  users:'<circle cx="8.5" cy="8" r="3"/><path d="M2.5 19.5c.6-3 2.9-5 6-5s5.4 2 6 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 14.2c2 .3 3.6 1.8 4 4.3"/>',
  download:'<line x1="12" y1="4" x2="12" y2="14"/><polyline points="7 10 12 15 17 10"/><path d="M5 19h14"/>',
  upload:'<line x1="12" y1="15" x2="12" y2="5"/><polyline points="7 9 12 4 17 9"/><path d="M5 19h14"/>',
  pencil:'<path d="M4 20l1-4.5L16 4.5a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19 4 20z"/><line x1="14" y1="6.5" x2="17.5" y2="10"/>',
  trash:'<polyline points="4 7 20 7"/><path d="M6 7l1 13a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  'rotate-ccw':'<path d="M4.5 9A8 8 0 1 1 5 16"/><polyline points="4 4 4.5 9 9.5 8.3"/>',
  filter:'<path d="M4 5h16l-6.2 7.2v5.6l-3.6 1.8v-7.4z"/>',
  image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M4 17l4.5-4.5c.6-.6 1.4-.6 2 0L14 16"/><path d="M13 15l2-2c.6-.6 1.4-.6 2 0l3 3"/>',
  'bar-chart':'<line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="7"/><line x1="19" y1="20" x2="19" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/>',
  'id-card':'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><line x1="13" y1="10" x2="18" y2="10"/><line x1="13" y1="13" x2="18" y2="13"/>',
  database:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  shield:'<path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z"/><polyline points="9 12 11 14 15 10"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  'log-in':'<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><polyline points="10 8 14 12 10 16"/><line x1="4" y1="12" x2="14" y2="12"/>',
  'log-out':'<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><polyline points="15 8 19 12 15 16"/><line x1="9" y1="12" x2="19" y2="12"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l2 2"/><path d="M14 9l2 2"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/>'
};
function icon(name,cls){
  const body=ICONS[name];
  if(!body) return '';
  return `<svg class="icon${cls?(' '+cls):''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function applyIcons(){
  document.querySelectorAll('[data-icon]').forEach(el=>{
    if(!el.querySelector('svg')) el.innerHTML=icon(el.getAttribute('data-icon'));
  });
}

const AVATAR_PALETTE=['#0B2566','#1F4FD0','#0A84F0','#0E9F8A','#0A8A5F','#4338CA'];
function avatarColor(p){
  const s=(p.last||'')+(p.first||'');
  let h=0; for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

const escVCard=s=>(s??'').toString().replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\n','\\n');
const HTML_ESCAPES={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escHtml=s=>(s??'').toString().replace(/[&<>"']/g,c=>HTML_ESCAPES[c]);
const initials=p=>((p.last?.[0]||'')+(p.first?.[0]||'')).toUpperCase();
const normText=s=>(s??'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();

/* Champs réellement inclus dans la recherche — on exclut sciemment `id` et
   `photo` (chaîne base64 potentiellement énorme). */
const SEARCHABLE_FIELDS=['first','last','matricule','title','department','location','email','phone','phone_display','company'];

function todayStamp(){
  const d=new Date(), p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
function downloadBlob(blob,filename){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}

/* ============================================================
   AUTHENTIFICATION
   ------------------------------------------------------------
   Deux rôles :
   - admin : gère le personnel (import Excel, ajout, modification,
             suppression) et crée les comptes utilisateurs/admins ;
   - user  : consulte l'annuaire et ajoute un collègue à ses
             contacts (vCard sur téléphone, CSV sur ordinateur).
   Les mots de passe sont hachés (PBKDF2-SHA256, 150 000 itérations,
   sel aléatoire). La session vit dans sessionStorage : elle se ferme
   avec l'onglet / l'application, d'où une connexion à chaque ouverture.
   ⚠️ Prototype sans serveur : ce contrôle se fait dans le navigateur.
   Voir docs/AUTHENTIFICATION.md pour ses limites.
   ============================================================ */
const PBKDF2_ITER=150000;
const SESSION_KEY='eureka_session';
const SESSION_MAX_MS=12*60*60*1000;
const LOCK_KEY='eureka_login_lock';
const MAX_ATTEMPTS=5, LOCK_MS=60*1000;

/* Comptes de test créés au tout premier lancement (hachés, pas de mot de
   passe en clair dans le code). Identifiants fournis séparément. */
const SEED_ACCOUNTS=[
  {id:'seed-admin', name:'Administrateur test', login:'admin.kep', role:'admin', salt:'/ZHxdP/pRJd+YS130L9rzg==', hash:'s8ariBcfic4cCbpwxHcxCAjapJNs9RNVkjbtsIyeWhw=', iter:PBKDF2_ITER, createdAt:'2026-09-29T00:00:00Z'},
  {id:'seed-user',  name:'Utilisateur test',    login:'user.kep',  role:'user',  salt:'QpkvLSEC8n+ygrouKZT6oQ==', hash:'hHP4FTbv7ZvqAChT0Hlpa4MHS9kFw+kn1Ckwa3TdVs8=', iter:PBKDF2_ITER, createdAt:'2026-09-29T00:00:00Z'}
];

const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hashPassword(pwd,saltB64,iter=PBKDF2_ITER){
  if(!crypto?.subtle) throw new Error("Chiffrement indisponible : ouvrez l'application en HTTPS (ou via localhost).");
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pwd),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unb64(saltB64),iterations:iter},key,256);
  return b64(bits);
}
function safeEqual(a,b){ if(a.length!==b.length) return false; let r=0; for(let i=0;i<a.length;i++) r|=a.charCodeAt(i)^b.charCodeAt(i); return r===0; }
async function makeCredentials(pwd){
  const salt=b64(crypto.getRandomValues(new Uint8Array(16)));
  return {salt, hash:await hashPassword(pwd,salt), iter:PBKDF2_ITER};
}
const normLogin=s=>(s??'').toString().trim().toLowerCase();
const isAdmin=()=>session?.role==='admin';
function requireAdmin(){
  if(isAdmin()) return true;
  alert("Action réservée aux administrateurs.");
  return false;
}

async function loadAccounts(){
  accounts=await dbGetAll(ACCOUNTS);
  if(!accounts.some(a=>a.role==='admin')){
    // Aucun administrateur : on (re)crée les comptes de test pour ne jamais verrouiller l'application.
    const missing=SEED_ACCOUNTS.filter(s=>!accounts.some(a=>normLogin(a.login)===s.login));
    await dbBulkPut(missing,ACCOUNTS);
    accounts=await dbGetAll(ACCOUNTS);
  }
}

let authTab='user';
function switchAuthTab(tab){
  authTab=tab;
  $('#tabUser').classList.toggle('active',tab==='user'); $('#tabUser').setAttribute('aria-selected',tab==='user');
  $('#tabAdmin').classList.toggle('active',tab==='admin'); $('#tabAdmin').setAttribute('aria-selected',tab==='admin');
  $('#authTitle').textContent= tab==='admin' ? 'Connexion administrateur' : 'Connexion utilisateur';
  $('#authHint').textContent= tab==='admin'
    ? 'Gérez le personnel, les imports Excel et les comptes d\u2019accès.'
    : 'Consultez l\u2019annuaire et ajoutez vos collègues à vos contacts.';
  $('#loginError').textContent='';
  $('#loginId').focus();
}
function togglePwd(id,btn){
  const i=$('#'+id); const show=i.type==='password';
  i.type=show?'text':'password';
  btn.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');
}
function lockState(){ try{ return JSON.parse(localStorage.getItem(LOCK_KEY))||{n:0,until:0}; }catch(e){ return {n:0,until:0}; } }
function setLockState(s){ try{ localStorage.setItem(LOCK_KEY,JSON.stringify(s)); }catch(e){} }

async function submitLogin(e){
  e.preventDefault();
  const err=$('#loginError'), btn=$('#loginBtn');
  const lock=lockState();
  if(lock.until>Date.now()){
    err.textContent=`Trop de tentatives. Réessayez dans ${Math.ceil((lock.until-Date.now())/1000)} s.`; return;
  }
  const login=normLogin($('#loginId').value), pwd=$('#loginPwd').value;
  if(!login||!pwd){ err.textContent='Saisissez votre identifiant et votre mot de passe.'; return; }
  btn.disabled=true; err.textContent='';
  try{
    await loadAccounts();
    const acc=accounts.find(a=>normLogin(a.login)===login);
    // Hachage effectué même si le compte n'existe pas : même temps de réponse.
    const h=await hashPassword(pwd, acc?acc.salt:'AAAAAAAAAAAAAAAAAAAAAA==', acc?.iter||PBKDF2_ITER);
    const ok=acc && safeEqual(h,acc.hash);
    if(!ok){
      const n=lock.n+1;
      setLockState(n>=MAX_ATTEMPTS?{n:0,until:Date.now()+LOCK_MS}:{n,until:0});
      err.textContent= n>=MAX_ATTEMPTS ? 'Trop de tentatives. Connexion bloquée 60 secondes.' : 'Identifiant ou mot de passe incorrect.';
      return;
    }
    if(authTab==='admin' && acc.role!=='admin'){
      err.textContent="Ce compte n'a pas les droits administrateur. Utilisez l'onglet « Utilisateur ».";
      return;
    }
    setLockState({n:0,until:0});
    session={id:acc.id, role:(authTab==='user'?'user':acc.role), name:acc.name, login:acc.login, at:Date.now()};
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
    $('#loginPwd').value='';
    await enterApp();
  }catch(ex){
    err.textContent=ex.message||'Connexion impossible.';
  }finally{ btn.disabled=false; }
}

async function restoreSession(){
  let s=null;
  try{ s=JSON.parse(sessionStorage.getItem(SESSION_KEY)); }catch(e){}
  if(!s||!s.id||Date.now()-(s.at||0)>SESSION_MAX_MS) return null;
  const acc=accounts.find(a=>a.id===s.id);
  if(!acc) return null;
  // Le rôle est relu depuis la base, jamais depuis la session seule.
  const role = s.role==='admin' && acc.role==='admin' ? 'admin' : 'user';
  return {...s, role, name:acc.name, login:acc.login};
}

function logout(){
  sessionStorage.removeItem(SESSION_KEY);
  session=null; people=[];
  closeAdmin(); closePersonForm();
  document.body.classList.remove('authed','role-admin','role-user');
  $('#grid').innerHTML=''; $('#q').value='';
  $('#loginId').value=''; $('#loginPwd').value='';
  switchAuthTab('user');
  window.scrollTo(0,0);
}

async function enterApp(){
  document.body.classList.add('authed');
  document.body.classList.toggle('role-admin',isAdmin());
  document.body.classList.toggle('role-user',!isAdmin());
  $('#whoami').innerHTML=`${icon(isAdmin()?'shield':'user')}<span>${escHtml(session.name)}<small>${isAdmin()?'Administrateur':'Utilisateur'}</small></span>`;
  $('#heroText').textContent= isAdmin()
    ? 'Gérez le personnel de KEP Congo : ajoutez, modifiez, retirez des collaborateurs ou importez le fichier Excel.'
    : (isMobileDevice()
        ? 'Recherchez, appelez et ajoutez vos collègues directement dans les contacts de votre téléphone.'
        : 'Recherchez vos collègues et téléchargez leur fiche contact (.vcf) pour l\u2019importer dans votre messagerie ou votre téléphone.');
  await boot();
  window.scrollTo(0,0);
}

async function initAuth(){
  try{
    await loadAccounts();
    session=await restoreSession();
  }catch(err){
    $('#loginError').textContent="Base locale indisponible ("+err.message+"). Désactivez la navigation privée ou changez de navigateur.";
    return;
  }
  if(session) await enterApp();
  else setTimeout(()=>$('#loginId')?.focus(),50);
}

/* ============================================================
   Démarrage de l'annuaire (après connexion). La base locale est la
   source de vérité ; data/employees.json n'amorce qu'une base vide.
   ============================================================ */
function seedRecord(p){ return {...p, id:uid(), matricule:p.matricule||'', company:p.company||DEFAULT_COMPANY, photo:''}; }
async function boot(){
  try{ seedPeople = await fetch('data/employees.json',{cache:'no-cache'}).then(r=>r.json()); }catch(e){ seedPeople=[]; }
  try{
    let existing = await dbGetAll();
    if(!existing.length){
      existing = seedPeople.map(seedRecord);
      await dbBulkPut(existing);
    } else if(seedPeople.length && localStorage.getItem(SEED_VERSION_KEY)!==SEED_VERSION){
      existing = await migrateSeed(existing);
    }
    try{ localStorage.setItem(SEED_VERSION_KEY,SEED_VERSION); }catch(e){}
    people = sortPeople(existing);
  }catch(err){
    alert("Impossible d'ouvrir la base locale de l'annuaire (IndexedDB) : "+err.message+"\nEssayez un autre navigateur ou désactivez la navigation privée.");
    people=[];
  }
  refreshFilters(); render();
}
/* Version des données fournies avec le site (data/employees.json).
   Quand elle change, les appareils qui avaient déjà une base :
   - retirent les anciens agents fictifs de démonstration (@kepcongo.cg) ;
   - reçoivent les agents du fichier, fusionnés par email (sans doublon),
   en conservant les ajouts, modifications et photos faits localement. */
const SEED_VERSION='kep-cartes-visite-2026-09-29-matricules';
const SEED_VERSION_KEY='eureka_seed_version';
const isDemoRecord=p=>/@kepcongo\.cg$/i.test(p.email||'') && /^KEP-00\d\d$/.test(p.matricule||'');
async function migrateSeed(existing){
  const demo=existing.filter(isDemoRecord);
  for(const d of demo) await dbDelete(d.id);
  people=existing.filter(p=>!isDemoRecord(p));
  const plan=planMerge(seedPeople.map(p=>({...p, company:p.company||DEFAULT_COMPANY})));
  await commitMergePlan(plan);
  return people;
}
/* Ordre alphabétique par NOM de famille (sans tenir compte des accents ni
   des majuscules), puis par prénom en cas d'homonymie. */
const _collator=new Intl.Collator('fr',{sensitivity:'base',ignorePunctuation:true});
const byLastName=(a,b)=>_collator.compare((a.last||'').trim(),(b.last||'').trim())||_collator.compare((a.first||'').trim(),(b.first||'').trim());
function sortPeople(list){ return [...list].sort(byLastName); }

function refreshFilters(){
  const dv=$('#dept'), sv=$('#site'), d0=dv.value, s0=sv.value;
  dv.innerHTML='<option value="">Tous les services</option>'; sv.innerHTML='<option value="">Tous les sites</option>';
  const depts=[...new Set(people.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
  depts.forEach(v=>dv.add(new Option(v,v)));
  [...new Set(people.map(x=>x.location).filter(Boolean))].sort().forEach(v=>sv.add(new Option(v,v)));
  dv.value=d0; sv.value=s0;
  const dl=$('#deptList'); if(dl) dl.innerHTML=depts.map(d=>`<option value="${escHtml(d)}">`).join('');
}

/* ============================================================
   Contacts (vCard) — disponible pour tous les comptes
   - « Télécharger le vcf » : enregistre le fichier .vcf de l'agent ;
   - « Ajouter »            : ouvre la fiche directement dans l'app
                              Contacts du téléphone (un appui sur
                              « Enregistrer » suffit) ;
   - « Télécharger le vcf » en bas de page : un seul .vcf avec tous
                              les agents de l'annuaire.
   ============================================================ */
function isMobileDevice(){
  const ua=navigator.userAgent||'';
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints>1);
}
function makeVCard(p, withPhoto=true){
  let a=['BEGIN:VCARD','VERSION:3.0',`N:${escVCard(p.last)};${escVCard(p.first)};;;`,`FN:${escVCard(((p.first||'')+' '+(p.last||'')).trim())}`];
  if(p.company||p.department)a.push(`ORG:${escVCard(p.company||DEFAULT_COMPANY)};${escVCard(p.department)}`);
  if(p.title)a.push(`TITLE:${escVCard(p.title)}`);
  if(p.matricule)a.push(`X-MATRICULE:${escVCard(p.matricule)}`);
  if(p.phone)a.push(`TEL;TYPE=CELL:${escVCard(p.phone)}`);
  if(p.phone_office)a.push(`TEL;TYPE=WORK:${escVCard(normPhone(p.phone_office)||p.phone_office)}`);
  if(p.email)a.push(`EMAIL;TYPE=WORK:${escVCard(p.email)}`);
  if(p.address)a.push(`ADR;TYPE=WORK:;;${escVCard(p.address)};;;;`);
  if(p.location)a.push(`NOTE:${escVCard('Site: '+p.location+(p.matricule?' — Matricule: '+p.matricule:''))}`);
  if(withPhoto && p.photo){
    const m=/^data:(image\/\w+);base64,(.+)$/.exec(p.photo);
    if(m) a.push(`PHOTO;ENCODING=b;TYPE=${m[1].split('/')[1].toUpperCase()}:${m[2]}`);
  }
  a.push('END:VCARD'); return a.join('\r\n')+'\r\n';
}
const csvCell=v=>`"${(v??'').toString().replaceAll('"','""')}"`;
const fileSafe=s=>normText(s).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'contact';
const vcfName=p=>`${fileSafe(p.first)}_${fileSafe(p.last)}.vcf`;
const isIOSDevice=()=>/iphone|ipad|ipod/i.test(navigator.userAgent||'') || (/Macintosh/.test(navigator.userAgent||'') && navigator.maxTouchPoints>1);

/* Bouton « Télécharger le vcf » d'une fiche */
function downloadVCF(i){
  const p=people[i]; if(!p) return;
  downloadBlob(new Blob([makeVCard(p)],{type:'text/vcard;charset=utf-8'}), vcfName(p));
}

/* Bouton « Ajouter » : enregistrer le numéro dans le téléphone.
   Un site web ne peut pas écrire seul dans le carnet d'adresses : on
   ouvre la fiche dans l'app Contacts, qui demande une confirmation. */
async function addToPhone(i){
  const p=people[i]; if(!p) return;
  const vcf=makeVCard(p);
  const file=new File([vcf], vcfName(p), {type:'text/vcard'});
  // iPhone / iPad : Safari affiche directement la fiche avec « Créer un contact ».
  if(isIOSDevice()){
    const url=URL.createObjectURL(file);
    window.location.href=url;
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    return;
  }
  // Android : partage vers l'app Contacts lorsque le navigateur le permet.
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:`${p.first} ${p.last}`});
      return;
    }
  }catch(err){ if(err && err.name==='AbortError') return; }
  // Sinon : le fichier est téléchargé, un appui dessus ouvre l'app Contacts.
  downloadBlob(new Blob([vcf],{type:'text/vcard;charset=utf-8'}), vcfName(p));
  if(isMobileDevice()) showToast(`Fiche de ${p.first} ${p.last} téléchargée : touchez la notification pour l'enregistrer dans vos contacts.`);
  else showToast(`Fiche de ${p.first} ${p.last} téléchargée : ouvrez le fichier .vcf pour l'ajouter à vos contacts.`);
}

/* Bouton global « Télécharger le vcf » (bas de page) : TOUS les agents
   dans un seul fichier .vcf.
   - Téléphone : le fichier est téléchargé directement ; iPhone et Android
     proposent « Ajouter tous les contacts ».
   - Ordinateur : une fenêtre liste les agents inclus et propose aussi une
     version CSV pour Outlook, car Outlook / Contacts Windows n'affichent
     que la PREMIÈRE fiche d'un .vcf au double-clic. */
const allVCFName=()=>`Annuaire_KEP_CONGO_${people.length}_agents.vcf`;
function buildAllVCF(){ return sortPeople(people).map(p=>makeVCard(p,false)).join(''); }
function saveAllVCF(){
  if(!people.length){ alert("L'annuaire est vide."); return; }
  downloadBlob(new Blob([buildAllVCF()],{type:'text/vcard;charset=utf-8'}), allVCFName());
  showToast(`${people.length} contacts exportés dans un seul fichier .vcf.`);
}
function makeContactCSV(list){
  // En-têtes Outlook, également reconnus par Outlook.com et Google Contacts.
  const head=['First Name','Last Name','Company','Department','Job Title','E-mail Address','Mobile Phone','Business Phone','Business Street','Notes'];
  const rows=list.map(p=>[p.first,(p.last||'').toUpperCase(),p.company||DEFAULT_COMPANY,p.department,p.title,p.email,
    p.phone||p.phone_display,p.phone_office?(normPhone(p.phone_office)||p.phone_office):'',p.address||'',
    [p.matricule?'Matricule: '+p.matricule:'',p.location?'Site: '+p.location:''].filter(Boolean).join(' — ')]);
  return '﻿'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
function saveAllCSV(){
  if(!people.length){ alert("L'annuaire est vide."); return; }
  downloadBlob(new Blob([makeContactCSV(sortPeople(people))],{type:'text/csv;charset=utf-8'}), `Annuaire_KEP_CONGO_${people.length}_agents_Outlook.csv`);
  showToast(`${people.length} contacts exportés pour Outlook (CSV).`);
}
function downloadAllVCF(){
  if(!people.length){ alert("L'annuaire est vide."); return; }
  if(isMobileDevice()){ saveAllVCF(); return; }
  $('#exportCount').textContent=`${people.length} agent${people.length>1?'s':''}`;
  $('#exportList').innerHTML=sortPeople(people).map(p=>`<li><b>${escHtml((p.last||'').toUpperCase())}</b> ${escHtml(p.first)}<span>${escHtml(p.title||'')}${p.phone_display||p.phone?' · '+escHtml(p.phone_display||p.phone):''}</span></li>`).join('');
  $('#exportModal').classList.add('open');
}
function closeExportModal(){ $('#exportModal')?.classList.remove('open'); }

let _toastTimer=null;
function showToast(msg){
  let t=$('#toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>t.classList.remove('show'),4200);
}

function render(){
  const s=normText($('#q').value),d=$('#dept').value,l=$('#site').value;
  const admin=isAdmin();
  filtered=people.map((p,i)=>({p,i})).filter(({p})=>{
    const hay=s?normText(SEARCHABLE_FIELDS.map(k=>p[k]||'').join(' ')):'';
    return (!s||hay.includes(s))&&(!d||p.department===d)&&(!l||p.location===l);
  }).sort((x,y)=>byLastName(x.p,y.p));
  $('#count').textContent=`${filtered.length} collaborateur${filtered.length!==1?'s':''}`;
  const info=$('#exportAllInfo'); if(info) info.textContent=`Un seul fichier .vcf contenant les ${people.length} agents enregistrés dans l'annuaire.`;
  $('#grid').innerHTML=filtered.length?filtered.map(({p,i})=>{
    const bg=avatarColor(p);
    const avatar=p.photo
      ?`<div class="avatar avatar-photo"><img src="${escHtml(p.photo)}" alt=""></div>`
      :`<div class="avatar" style="background:${bg}22;color:${bg}">${escHtml(initials(p))}</div>`;
    const fullName=`${p.first||''} ${p.last||''}`.trim();
    const adminBtns = admin ? `<div class="card-admin">
        <button class="icon-btn" onclick="editPerson(${i})" aria-label="Modifier ${escHtml(fullName)}" title="Modifier">${icon('pencil')}</button>
        <button class="icon-btn danger" onclick="deletePerson(${i})" aria-label="Retirer ${escHtml(fullName)} des effectifs" title="Retirer des effectifs">${icon('trash')}</button>
      </div>` : '';
    return `<article class="card${admin?' card-with-admin':''}">
      ${adminBtns}
      <div class="head">
        ${avatar}
        <div class="head-text">
          <div class="name"><span class="name-last">${escHtml((p.last||'').toUpperCase())}</span> ${escHtml(p.first)}</div>
          <div class="role">${escHtml(p.title)||'Fonction non renseignée'}</div>
          ${p.matricule?`<div class="matricule-badge">${icon('id-card')}<span>Matricule ${escHtml(p.matricule)}</span></div>`:''}
        </div>
      </div>
      <div class="facts">
        <div class="fact">${icon('building','fact-icon')}<span>${escHtml(p.department)||'—'}</span></div>
        <div class="fact">${icon('map-pin','fact-icon')}<span>${escHtml(p.location)||'—'}</span></div>
        <div class="fact">${icon('mail','fact-icon')}<span>${escHtml(p.email)||'—'}</span></div>
        <div class="fact">${icon('phone','fact-icon')}<span>${escHtml(p.phone_display||p.phone)||'À confirmer'}</span></div>
      </div>
      <div class="actions">
        ${p.phone?`<a class="btn btn-outline" href="tel:${encodeURIComponent(p.phone)}">${icon('phone')}<span>Appeler</span></a>`:''}
        ${p.email?`<a class="btn btn-outline" href="mailto:${encodeURIComponent(p.email)}">${icon('mail')}<span>Email</span></a>`:''}
        <button class="btn btn-outline btn-vcf" onclick="downloadVCF(${i})">${icon('download')}<span>Télécharger le vcf</span></button>
        <button class="btn btn-primary" onclick="addToPhone(${i})">${icon('user-plus')}<span>Ajouter</span></button>
      </div>
    </article>`;
  }).join(''):`<div class="empty">${icon('search','empty-icon')}<p>Aucun collaborateur trouvé.</p></div>`;
}

/* ============================================================
   Administration (réservée au rôle admin)
   ============================================================ */
function openAdmin(){ if(!requireAdmin()) return; $('#admin').classList.add('open'); adminRender(); accountsRender(); }
function closeAdmin(){ $('#admin')?.classList.remove('open'); }
function adminRender(){
  if(!isAdmin()) return;
  $('#statPeople').textContent=people.length;
  $('#statDept').textContent=new Set(people.map(x=>x.department).filter(Boolean)).size;
  $('#statSites').textContent=new Set(people.map(x=>x.location).filter(Boolean)).size;
  $('#adminRows').innerHTML=people.map((p,i)=>{
    const thumb=p.photo
      ?`<img class="table-avatar" src="${escHtml(p.photo)}" alt="">`
      :`<div class="table-avatar table-avatar-fallback">${escHtml(initials(p))}</div>`;
    return `<tr>
      <td class="table-photo-cell">${thumb}</td>
      <td><b>${escHtml((p.last||'').toUpperCase())}</b> ${escHtml(p.first)}</td>
      <td>${escHtml(p.matricule)||'—'}</td>
      <td>${escHtml(p.department)}</td>
      <td>${escHtml(p.location)}</td>
      <td class="row-actions"><button class="icon-btn" onclick="editPerson(${i})" aria-label="Modifier">${icon('pencil')}</button><button class="icon-btn danger" onclick="deletePerson(${i})" aria-label="Supprimer">${icon('trash')}</button></td>
    </tr>`;
  }).join('');
}

/* ---------- Comptes d'accès ---------- */
function accountsRender(){
  if(!isAdmin()) return;
  const list=[...accounts].sort((a,b)=>(a.role===b.role?0:a.role==='admin'?-1:1)||(a.name||'').localeCompare(b.name||'','fr'));
  $('#accountRows').innerHTML=list.map(a=>{
    const me=a.id===session.id;
    return `<tr>
      <td>${escHtml(a.name)}${me?' <span class="tag">vous</span>':''}</td>
      <td>${escHtml(a.login)}</td>
      <td><span class="role-pill ${a.role==='admin'?'role-pill-admin':''}">${a.role==='admin'?'Administrateur':'Utilisateur'}</span></td>
      <td class="row-actions">
        <button class="icon-btn" onclick="resetAccountPassword('${escHtml(a.id)}')" aria-label="Changer le mot de passe de ${escHtml(a.name)}" title="Changer le mot de passe">${icon('key')}</button>
        ${me?'':`<button class="icon-btn danger" onclick="deleteAccount('${escHtml(a.id)}')" aria-label="Supprimer le compte ${escHtml(a.name)}" title="Supprimer le compte">${icon('trash')}</button>`}
      </td>
    </tr>`;
  }).join('');
}
async function submitAccount(e){
  e.preventDefault(); if(!requireAdmin()) return;
  const name=$('#a_name').value.trim(), login=normLogin($('#a_login').value), pwd=$('#a_pwd').value, role=$('#a_role').value==='admin'?'admin':'user';
  if(!name||!login){ alert('Nom et identifiant obligatoires.'); return; }
  if(!/^[a-z0-9._@+-]{3,64}$/.test(login)){ alert("Identifiant invalide : 3 à 64 caractères (lettres, chiffres, . _ - @ +), sans espace."); return; }
  if(pwd.length<8){ alert('Le mot de passe doit contenir au moins 8 caractères.'); return; }
  await loadAccounts();
  if(accounts.some(a=>normLogin(a.login)===login)){ alert('Cet identifiant existe déjà.'); return; }
  try{
    const acc={id:uid(), name, login, role, ...(await makeCredentials(pwd)), createdAt:new Date().toISOString(), createdBy:session.login};
    await dbPut(acc,ACCOUNTS);
    accounts.push(acc);
    $('#accountForm').reset();
    accountsRender();
    alert(`Compte ${role==='admin'?'administrateur':'utilisateur'} créé.\nIdentifiant : ${login}\nTransmettez le mot de passe à ${name} de manière confidentielle.`);
  }catch(err){ alert('Création du compte impossible : '+err.message); }
}
async function deleteAccount(id){
  if(!requireAdmin()) return;
  const acc=accounts.find(a=>a.id===id); if(!acc) return;
  if(acc.id===session.id){ alert('Vous ne pouvez pas supprimer votre propre compte.'); return; }
  if(acc.role==='admin' && accounts.filter(a=>a.role==='admin').length<=1){ alert('Impossible : il doit rester au moins un administrateur.'); return; }
  if(!confirm(`Supprimer le compte de ${acc.name} (${acc.login}) ?\nCette personne ne pourra plus se connecter.`)) return;
  await dbDelete(id,ACCOUNTS);
  accounts=accounts.filter(a=>a.id!==id);
  accountsRender();
}
async function resetAccountPassword(id){
  if(!requireAdmin()) return;
  const acc=accounts.find(a=>a.id===id); if(!acc) return;
  const pwd=prompt(`Nouveau mot de passe pour ${acc.name} (8 caractères minimum) :`);
  if(pwd==null) return;
  if(pwd.length<8){ alert('Le mot de passe doit contenir au moins 8 caractères.'); return; }
  const updated={...acc, ...(await makeCredentials(pwd)), updatedAt:new Date().toISOString()};
  await dbPut(updated,ACCOUNTS);
  accounts=accounts.map(a=>a.id===id?updated:a);
  alert('Mot de passe mis à jour.');
}

/* ---------- Fiche collaborateur ---------- */
const FORM_FIELDS=['first','last','matricule','title','department','location','email','phone'];
let pendingPhoto=null; // null = inchangée · '' = retirée · 'data:...' = nouvelle photo

function setPhotoAvatar(dataUrl){
  const el=$('#photoAvatar'); if(!el) return;
  el.innerHTML = dataUrl ? `<img src="${escHtml(dataUrl)}" alt="">` : icon('user');
}
function resetPhotoField(){ pendingPhoto=null; setPhotoAvatar(''); }
function clearPhoto(){ pendingPhoto=''; setPhotoAvatar(''); }

/* Redimensionne côté client (max 320px, JPEG ~82%) avant stockage. */
function resizeImageFile(file,maxDim=320,quality=0.82){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let {width,height}=img;
        if(width>height){ if(width>maxDim){ height=Math.round(height*maxDim/width); width=maxDim; } }
        else { if(height>maxDim){ width=Math.round(width*maxDim/height); height=maxDim; } }
        const canvas=document.createElement('canvas');
        canvas.width=width; canvas.height=height;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height);
        ctx.drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.onerror=()=>reject(new Error('Image illisible ou corrompue'));
      img.src=reader.result;
    };
    reader.onerror=()=>reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}
const PHOTO_ALLOWED_TYPES=['image/png','image/jpeg','image/webp'];
const PHOTO_MAX_RAW_BYTES=8*1024*1024;
async function onPhotoSelected(ev){
  const f=ev.target.files[0]; if(!f) return;
  if(!PHOTO_ALLOWED_TYPES.includes(f.type)){ alert('Format non supporté. Utilisez PNG, JPEG ou WebP.'); ev.target.value=''; return; }
  if(f.size>PHOTO_MAX_RAW_BYTES){ alert('Photo trop volumineuse (8 Mo max avant compression automatique).'); ev.target.value=''; return; }
  try{
    pendingPhoto=await resizeImageFile(f);
    setPhotoAvatar(pendingPhoto);
  }catch(err){ alert("Impossible de traiter cette image : "+err.message); }
  ev.target.value='';
}

function ensureSiteOption(v){
  const sel=$('#f_location'); if(!v||[...sel.options].some(o=>o.value===v)) return;
  sel.add(new Option(v,v));
}
function openPersonForm(){ $('#personModal').classList.add('open'); setTimeout(()=>$('#f_last').focus(),60); }
function closePersonForm(){ $('#personModal')?.classList.remove('open'); resetPhotoField(); }
function emptyForm(){ FORM_FIELDS.forEach(x=>$('#f_'+x).value=''); $('#editIndex').value='-1'; resetPhotoField(); }
function addNew(){
  if(!requireAdmin()) return;
  emptyForm(); $('#formTitle').textContent='Ajouter un collaborateur'; openPersonForm();
}
function editPerson(i){
  if(!requireAdmin()) return;
  const p=people[i]; if(!p) return;
  $('#editIndex').value=i;
  ensureSiteOption(p.location);
  FORM_FIELDS.forEach(x=>$('#f_'+x).value=(x==='phone'?(p.phone_display||p.phone):p[x])||'');
  pendingPhoto=null; setPhotoAvatar(p.photo||'');
  $('#formTitle').textContent='Modifier le collaborateur'; openPersonForm();
}
async function submitPerson(e){
  e.preventDefault(); if(!requireAdmin()) return;
  const i=+$('#editIndex').value;
  const existing = i>=0 ? people[i] : null;
  const p={ id: existing?existing.id:uid(), company: existing?.company||DEFAULT_COMPANY };
  FORM_FIELDS.forEach(x=>p[x]=$('#f_'+x).value.trim());
  const mat=normText(p.matricule);
  if(mat && people.some(o=>o.id!==p.id && normText(o.matricule)===mat)){ alert(`Le matricule ${p.matricule} est déjà attribué à un autre collaborateur.`); return; }
  p.phone_display=p.phone;
  p.phone=normPhone(p.phone);
  p.photo = pendingPhoto!==null ? pendingPhoto : (existing?.photo||'');
  await dbPut(p);
  if(i>=0) people[i]={...people[i],...p}; else people.push(p);
  people=sortPeople(people);
  refreshFilters(); render(); adminRender();
  closePersonForm();
}
async function deletePerson(i){
  if(!requireAdmin()) return;
  const p=people[i]; if(!p) return;
  const label=`${p.first||''} ${p.last||''}`.trim()+(p.matricule?` (matricule ${p.matricule})`:'');
  if(!confirm(`Retirer ${label} des effectifs ?\n\nLa fiche sera supprimée de l'annuaire. Pensez aussi à retirer sa ligne du fichier « Personnel KEP CONGO », sinon un prochain import la recréera.`)) return;
  await dbDelete(p.id);
  people.splice(i,1);
  refreshFilters(); render(); adminRender();
}
async function resetData(){
  if(!requireAdmin()) return;
  if(!confirm('Revenir aux données fournies au démarrage ? Cette action remplace toute la base des collaborateurs (y compris les photos et modifications manuelles). Les comptes d\u2019accès ne sont pas touchés.')) return;
  const restored=seedPeople.map(seedRecord);
  await dbClear(); await dbBulkPut(restored);
  people=sortPeople(restored); refreshFilters(); render(); adminRender();
}
function exportCSV(){
  if(!requireAdmin()) return;
  const cols=['matricule','last','first','title','department','location','email','phone'];
  const head=['Matricule','Nom','Prénom','Fonction','Service','Site','Email','Téléphone'];
  const s=head.join(';')+'\n'+people.map(p=>cols.map(c=>csvCell(c==='phone'?(p.phone_display||p.phone):p[c])).join(';')).join('\n');
  downloadBlob(new Blob(['\ufeff'+s],{type:'text/csv;charset=utf-8'}),`Personnel_KEP_CONGO_${todayStamp()}.csv`);
}

/* ============================================================
   Import Excel/CSV — FUSION plutôt que remplacement.
   Rattachement : 1) matricule, 2) email, 3) nom + prénom.
   Les cellules vides n'effacent jamais une information existante.
   ============================================================ */
function planMerge(importedRows){
  const byMat=new Map(), byEmail=new Map(), byName=new Map();
  people.forEach(p=>{
    const m=normText(p.matricule); if(m) byMat.set(m,p);
    const e=normText(p.email); if(e) byEmail.set(e,p);
    if(p.last||p.first) byName.set(normText((p.last||'')+'|'+(p.first||'')),p);
  });
  const updates=new Map(), inserts=[];
  importedRows.forEach(row=>{
    const m=normText(row.matricule), e=normText(row.email);
    let match=(m&&byMat.get(m))||(e&&byEmail.get(e))||((row.last||row.first)&&byName.get(normText((row.last||'')+'|'+(row.first||''))))||null;
    if(match && m && normText(match.matricule) && normText(match.matricule)!==m) match=null;
    if(match){
      const merged={...(updates.get(match.id)||match)};
      Object.keys(row).forEach(k=>{
        if(row[k]===''||row[k]==null) return;
        if(k==='phone_display' && !row.phone) return;
        merged[k]=row[k];
      });
      merged.id=match.id; merged.photo=match.photo||'';
      updates.set(match.id,merged);
    } else {
      const n={...row, id:uid(), photo:''};
      inserts.push(n);
      if(m) byMat.set(m,n);               // évite les doublons si la même ligne apparaît deux fois
      if(e) byEmail.set(e,n);
    }
  });
  return {updates:[...updates.values()], inserts};
}
async function commitMergePlan(plan){
  await dbBulkPut([...plan.updates, ...plan.inserts]);
  const byId=new Map(people.map(p=>[p.id,p]));
  plan.updates.forEach(u=>byId.set(u.id,u));
  plan.inserts.forEach(n=>byId.set(n.id,n));
  people=sortPeople([...byId.values()]);
}

function detectSeparator(firstLine){ return firstLine.includes(';') ? ';' : ','; }
function parseCSV(text, sep){
  const rows=[]; let row=[]; let field=''; let inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else { inQuotes=false; } } else field+=c;
    } else if(c==='"'){ inQuotes=true; }
    else if(c===sep){ row.push(field); field=''; }
    else if(c==='\r'){ /* ignoré */ }
    else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }
    else field+=c;
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r=>r.some(c=>c.trim()!==''));
}
function rowToPerson(row){
  const rawPhone=pick(row,['Numéro','Numero','Téléphone','Telephone','Phone','Mobile','phone']);
  return {
    company:pick(row,['Société','Societe','Entreprise','company'])||DEFAULT_COMPANY,
    matricule:pickMatricule(row),
    location:normSite(pick(row,['Site','Lieux','Lieu','location'])),
    last:pick(row,['Nom','Last name','last']),
    first:pick(row,['Prénom','Prenom','First name','first']),
    department:pick(row,['Service','Département','Departement','department']),
    title:pick(row,['Fonction','Poste','Job title','title']),
    email:pick(row,['Email','E-mail','Mail','email']),
    phone:normPhone(rawPhone),
    phone_display:rawPhone
  };
}
/* Harmonise l'écriture des sites (pnr, Pointe-Noire → PNR ; bzv, Brazzaville → BZV ; bondji → Bondji). */
function normSite(v){
  const n=normText(v);
  if(!n) return '';
  if(n==='pnr'||n.startsWith('pointe')) return 'PNR';
  if(n==='bzv'||n.startsWith('brazza')) return 'BZV';
  if(n.startsWith('bondji')) return 'Bondji';
  return (v||'').toString().trim();
}

function importCSV(ev){
  if(!requireAdmin()){ ev.target.value=''; return; }
  const f=ev.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=async ()=>{
    try{
      const text=r.result.replace(/^\ufeff/,'');
      const sep=detectSeparator((text.split(/\r?\n/)[0]||''));
      const matrix=parseCSV(text, sep);
      if(!matrix.length) throw new Error('Fichier vide ou illisible');
      const headers=matrix[0].map(x=>x.replace(/^"|"$/g,'').trim());
      const dataRows=matrix.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h, (r[i]??'').trim()])));
      const imported=dataRows.map(rowToPerson).filter(p=>p.first||p.last||p.email);
      if(!imported.length) throw new Error('Aucun collaborateur reconnu dans ce fichier');
      const plan=planMerge(imported);
      if(!confirm(`Import CSV :\n${importSummary(plan,imported)}\n\nContinuer ?`)){ return; }
      await commitMergePlan(plan);
      refreshFilters(); render(); adminRender(); closePersonForm();
      alert('Import terminé.\n'+importSummary(plan,imported));
    }catch(err){ alert('Import CSV impossible : '+err.message); }
  };
  r.readAsText(f,'UTF-8'); ev.target.value='';
}

function normPhone(v){
  let s=(v??'').toString().replace(/\u00a0/g,' ').trim(), d=s.replace(/\D/g,'');
  if(d.length===9 && /^0[1-9]/.test(d)) return '+242'+d;
  if(d.length===12 && d.startsWith('242') && /^0[1-9]/.test(d.slice(3))) return '+'+d;
  return s.toLowerCase().includes('confirmer')?'':s;
}
function pick(row,names){
  const keys=Object.keys(row); const norm=x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  for(const n of names){const k=keys.find(k=>norm(k)===norm(n)); if(k) return (row[k]??'').toString().trim();}
  return '';
}
const MATRICULE_HEADERS=['Matricule','Matricule RH','N° Matricule','N°Matricule','No Matricule','Numéro matricule','Numero matricule','Mat','Mat.','Immatriculation','ID Employé','ID employe','Code agent','Identifiant'];
function pickMatricule(row){
  const direct=pick(row,MATRICULE_HEADERS);
  if(direct) return direct;
  const norm=x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const k=Object.keys(row).find(k=>norm(k).includes('matricule'));
  return k ? (row[k]??'').toString().trim() : '';
}
function importSummary(plan,imported){
  const withMat=imported.filter(p=>p.matricule).length;
  return `${plan.updates.length} fiche(s) mise(s) à jour, ${plan.inserts.length} nouveau(x) collaborateur(s) ajouté(s).\nMatricule reconnu pour ${withMat} agent(s) sur ${imported.length}.`;
}
function importExcel(ev){
  if(!requireAdmin()){ ev.target.value=''; return; }
  const f=ev.target.files[0]; if(!f)return;
  if(typeof XLSX==='undefined'){alert("Le module Excel n'est pas chargé. Connectez-vous à Internet lors du premier test ou utilisez l'import CSV."); ev.target.value=''; return;}
  const r=new FileReader();
  r.onload=async e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'});
      const sheetName=wb.SheetNames.find(n=>normText(n)==='personnel')||wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      let rows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
      if(!rows.length || !Object.keys(rows[0]).some(k=>/nom|prénom|prenom/i.test(k))){
        const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
        const hi=matrix.findIndex(r=>r.some(c=>/^(nom|prénom|prenom)$/i.test(String(c).trim())));
        if(hi>=0){
          const headers=matrix[hi].map(x=>String(x).trim());
          rows=matrix.slice(hi+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
        }
      }
      const imported=rows.map(rowToPerson).filter(p=>p.first||p.last||p.email);
      if(!imported.length) throw new Error("Aucun collaborateur reconnu");
      const plan=planMerge(imported);
      if(!confirm(`Import Excel :\n${importSummary(plan,imported)}\n\nContinuer ?`)){ return; }
      await commitMergePlan(plan);
      refreshFilters(); render(); adminRender(); closePersonForm();
      alert('Import terminé.\n'+importSummary(plan,imported));
    }catch(err){alert("Import Excel impossible : "+err.message);}
  };
  r.readAsArrayBuffer(f); ev.target.value='';
}

/* ============================================================
   Sauvegarde / restauration (collaborateurs + comptes + branding).
   Les comptes sont exportés avec leurs mots de passe HACHÉS
   (jamais en clair) — le fichier reste néanmoins confidentiel.
   ============================================================ */
async function backupDatabase(){
  if(!requireAdmin()) return;
  try{
    const payload={
      app:'eureka-connect', client:'KEP Congo', version:2, exportedAt:new Date().toISOString(),
      branding:{ name: localStorage.getItem('eureka_client_name')||'', logo: localStorage.getItem('eureka_client_logo')||'' },
      employees: await dbGetAll(),
      accounts: await dbGetAll(ACCOUNTS)
    };
    downloadBlob(new Blob([JSON.stringify(payload)],{type:'application/json'}),`eureka-connect-kep-sauvegarde-${todayStamp()}.json`);
  }catch(err){ alert('Sauvegarde impossible : '+err.message); }
}
function restoreDatabase(ev){
  if(!requireAdmin()){ ev.target.value=''; return; }
  const f=ev.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=async ()=>{
    try{
      const payload=JSON.parse(r.result);
      const list=Array.isArray(payload)?payload:payload.employees;
      if(!Array.isArray(list)||!list.length) throw new Error('Fichier de sauvegarde invalide ou vide');
      const accs=Array.isArray(payload.accounts)?payload.accounts.filter(a=>a&&a.id&&a.login&&a.hash&&a.salt&&(a.role==='admin'||a.role==='user')):[];
      const withAccounts=accs.some(a=>a.role==='admin');
      if(!confirm(`Restaurer cette sauvegarde va remplacer les ${people.length} collaborateur(s) actuels par ${list.length} collaborateur(s)`+(withAccounts?` et les comptes d'accès par ${accs.length} compte(s)`:'')+'. Continuer ?')) return;
      const restored=list.map(p=>({...p, id:p.id||uid(), matricule:p.matricule||'', photo:p.photo||''}));
      await dbClear(); await dbBulkPut(restored);
      people=sortPeople(restored);
      if(withAccounts){ await dbClear(ACCOUNTS); await dbBulkPut(accs,ACCOUNTS); accounts=accs; }
      const brand=payload.branding||payload.client;
      if(brand && typeof brand==='object'){
        if(brand.name) localStorage.setItem('eureka_client_name',brand.name);
        if(brand.logo) try{ localStorage.setItem('eureka_client_logo',brand.logo); }catch(e){}
        loadClientBrand();
      }
      refreshFilters(); render(); adminRender(); accountsRender(); closePersonForm();
      alert(restored.length+' collaborateurs restaurés depuis la sauvegarde.');
      if(withAccounts && !accounts.some(a=>a.id===session.id)){ alert('Votre compte ne figure pas dans la sauvegarde : reconnectez-vous avec un compte restauré.'); logout(); }
    }catch(err){ alert('Restauration impossible : '+err.message); }
  };
  r.readAsText(f,'UTF-8'); ev.target.value='';
}

/* --- Logo client (branding) --- */
const CLIENT_LOGO_ALLOWED_TYPES=['image/png','image/jpeg','image/webp','image/svg+xml'];
const CLIENT_LOGO_MAX_BYTES=1.5*1024*1024;
function showLogo(logo){
  const img=$('#clientLogo'), wrap=$('#clientLogoWrap');
  if(img&&wrap){
    if(logo){ img.src=logo; img.style.display='block'; wrap.classList.add('has-logo'); wrap.style.display='flex'; }
    else { img.removeAttribute('src'); img.style.display='none'; wrap.classList.remove('has-logo'); wrap.style.display='none'; }
  }
  const pv=$('#logoAdminPreview');
  if(pv) pv.innerHTML = logo ? `<img src="${escHtml(logo)}" alt="Logo actuel">` : '<span class="logo-admin-empty">Aucun logo</span>';
  const rm=$('#removeLogoBtn'); if(rm) rm.disabled=!logo;
}
/* Logo PARTAGÉ : le fichier icons/logo-client.png publié avec le site
   (GitHub) est vu par tous les appareils. Un logo téléchargé dans
   l'administration ne vit que dans CE navigateur : pour le diffuser,
   l'administrateur télécharge « logo-client.png » et le dépose dans le
   dossier icons/ du dépôt. */
const SHARED_LOGO_URL='icons/logo-client.png';
let sharedLogo='';
function checkSharedLogo(){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{ sharedLogo=SHARED_LOGO_URL+'?v='+Date.now().toString(36).slice(0,-3); resolve(sharedLogo); };
    img.onerror=()=>{ sharedLogo=''; resolve(''); };
    img.src=SHARED_LOGO_URL+'?check='+Date.now();
  });
}
const currentLogo=()=>localStorage.getItem('eureka_client_logo')||sharedLogo||'';
function removeClientLogo(){
  if(!requireAdmin()) return;
  if(!localStorage.getItem('eureka_client_logo')){
    alert("Ce logo est celui publié sur le site (icons/logo-client.png). Pour le retirer pour tout le monde, supprimez ce fichier du dépôt GitHub.");
    return;
  }
  if(!confirm('Retirer le logo téléchargé sur cet appareil ?')) return;
  localStorage.removeItem('eureka_client_logo'); showLogo(currentLogo());
}
/* Donne à l'administrateur le fichier PNG à publier sur GitHub. */
function downloadLogoForSite(){
  if(!requireAdmin()) return;
  const src=currentLogo();
  if(!src){ alert("Téléchargez d'abord un logo."); return; }
  const img=new Image();
  img.onload=()=>{
    const max=512, k=Math.min(1, max/Math.max(img.naturalWidth||max, img.naturalHeight||max));
    const c=document.createElement('canvas'); c.width=Math.round((img.naturalWidth||max)*k); c.height=Math.round((img.naturalHeight||max)*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    c.toBlob(b=>{ if(b){ downloadBlob(b,'logo-client.png'); showToast('Déposez logo-client.png dans le dossier icons/ de votre dépôt GitHub.'); } },'image/png');
  };
  img.onerror=()=>alert('Conversion du logo impossible.');
  img.src=src;
}
function loadClientBrand(){
  const name=localStorage.getItem('eureka_client_name')||DEFAULT_CLIENT_NAME;
  const n=$('#clientName'), a=$('#authClient');
  if(n) n.value=name; if(a) a.textContent=name;
  showLogo(currentLogo());
  checkSharedLogo().then(()=>showLogo(currentLogo()));
}
function saveClientBrand(){
  if(!isAdmin()) return;
  const name=$('#clientName')?.value||'';
  localStorage.setItem('eureka_client_name',name);
  const shown=name||DEFAULT_CLIENT_NAME;
  const a=$('#authClient'); if(a) a.textContent=shown;
}
function loadClientLogo(e){
  if(!requireAdmin()){ e.target.value=''; return; }
  const f=e.target.files[0]; if(!f)return;
  if(!CLIENT_LOGO_ALLOWED_TYPES.includes(f.type)){ alert('Format de logo non supporté. Utilisez PNG, JPEG, WebP ou SVG.'); e.target.value=''; return; }
  if(f.size>CLIENT_LOGO_MAX_BYTES){ alert('Le logo est trop volumineux (max ~1,5 Mo). Choisissez une image plus légère.'); e.target.value=''; return; }
  const r=new FileReader();
  r.onload=()=>{
    try{ localStorage.setItem('eureka_client_logo',r.result); }
    catch(err){ alert("Le logo n'a pas pu être enregistré (espace de stockage local insuffisant)."); return; }
    showLogo(r.result);
    showToast('Logo enregistré sur cet appareil. Pour tous les téléphones : « Fichier pour le site ».');
  };
  r.readAsDataURL(f); e.target.value='';
}

function wireSearchClear(){
  const q=$('#q'), clear=$('#qClear');
  if(!q||!clear) return;
  const sync=()=>{ clear.style.display=q.value?'flex':'none'; };
  q.addEventListener('input', sync);
  clear.addEventListener('click', ()=>{ q.value=''; sync(); render(); q.focus(); });
  sync();
}
function toggleMobileFilters(){ const s=$('.search'); if(s) s.classList.toggle('mobile-filters-open'); }
function ensureMobileFilterToggle(){
  const s=$('.search');
  if(!s || $('#filterToggle')) return;
  const b=document.createElement('button');
  b.id='filterToggle'; b.type='button'; b.className='filter-toggle';
  b.innerHTML=icon('filter')+'<span>Filtres</span>';
  b.onclick=toggleMobileFilters;
  s.appendChild(b);
}
function syncModalBodyLock(){
  const modals=[...document.querySelectorAll('.admin')];
  const obs=new MutationObserver(()=>{ document.body.style.overflow=modals.some(m=>m.classList.contains('open'))?'hidden':''; });
  modals.forEach(m=>obs.observe(m,{attributes:true,attributeFilter:['class']}));
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if($('#exportModal')?.classList.contains('open')) closeExportModal();
  else if($('#personModal')?.classList.contains('open')) closePersonForm();
  else if($('#admin')?.classList.contains('open')) closeAdmin();
});

document.addEventListener('DOMContentLoaded',()=>{
  applyIcons();
  loadClientBrand();
  wireSearchClear();
  ensureMobileFilterToggle();
  syncModalBodyLock();
  ['q','dept','site'].forEach(id=>$('#'+id).addEventListener(id==='q'?'input':'change',render));
  initAuth();
});

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault(); deferredInstallPrompt=e;
  const b=$('#installAppBtn'); if(b) b.style.display='inline-flex';
});
window.addEventListener('appinstalled', ()=>{
  const b=$('#installAppBtn'); if(b) b.style.display='none';
  deferredInstallPrompt=null;
});
async function installApp(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  try{ await deferredInstallPrompt.userChoice; }catch(e){}
  deferredInstallPrompt=null;
  const b=$('#installAppBtn'); if(b) b.style.display='none';
}
function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone(){ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true; }
function maybeShowIOSHint(){
  const dismissed=localStorage.getItem('eureka_ios_hint_dismissed');
  const h=$('#iosInstallHint');
  if(h && isIOS() && !isStandalone() && !dismissed) h.style.display='flex';
}
function dismissIOSHint(){
  localStorage.setItem('eureka_ios_hint_dismissed','1');
  const h=$('#iosInstallHint'); if(h) h.style.display='none';
}
function activateNav(btn){ document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); if(btn) btn.classList.add('active'); }
function goHome(btn){ activateNav(btn); window.scrollTo({top:0,behavior:'smooth'}); }
function focusDirectory(btn){ activateNav(btn); const g=$('#grid'); if(g) g.scrollIntoView({behavior:'smooth',block:'start'}); }
function focusSearch(btn){ activateNav(btn); const q=$('#q'); if(q){ q.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>q.focus(),250); } }
function openAdminFromNav(btn){ activateNav(btn); openAdmin(); }
window.addEventListener('load', maybeShowIOSHint);
