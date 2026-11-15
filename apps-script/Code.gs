// YAKI v2 — API Apps Script. Après collage : lancer setup() (EFFACE les données), puis Déployer > Gérer les déploiements > Modifier > Nouvelle version.
const SH={Membres:['id','prenom','login','sel','pinHash','tokenHash','role','creation','modif','profil'],
Groupes:['id','nom','sel','codeHash','createur','creation'],
Adhesions:['groupeId','userId','date'],
Dispos:['id','userId','jour','debut','fin','type','modif'],
Sorties:['id','groupeId','nom','date','debut','fin','lieu','description','lien','organisateur','statut','creation','type','dateFin','budget','compteur'],
Depenses:['id','sortieId','libelle','montant','payeur','parts','creation','modif'],
Participations:['sortieId','userId','reponse','creation','modif'],
Activites:['id','groupeId','userId','type','sortieId','date']};
const STATUTS=['proposition','confirmée','annulée','terminée'];
function setup(){const ss=SpreadsheetApp.getActive();Object.keys(SH).forEach(n=>{let s=ss.getSheetByName(n)||ss.insertSheet(n);s.clear();s.getRange(1,1,s.getMaxRows(),SH[n].length).setNumberFormat('@');s.getRange(1,1,1,SH[n].length).setValues([SH[n]]).setFontWeight('bold');s.setFrozenRows(1)})}
const sh=n=>SpreadsheetApp.getActive().getSheetByName(n);
function rows(n){const v=sh(n).getDataRange().getValues();const h=v.shift();return v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=String(r[j]));return o}).filter(o=>o[h[0]]!=='')}
const add=(n,o)=>sh(n).appendRow(SH[n].map(k=>o[k]==null?'':o[k]));
const put=(n,r,o)=>sh(n).getRange(r,1,1,SH[n].length).setValues([SH[n].map(k=>o[k]==null?'':o[k])]);
const now=()=>Utilities.formatDate(new Date(),'Europe/Paris',"yyyy-MM-dd'T'HH:mm:ss");
const hash=s=>Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s));
const clean=(s,max)=>String(s==null?'':s).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,max);
const fail=m=>{throw new Error(m)};
const uid=()=>Utilities.getUuid();
function doGet(){return out({ok:true,app:'YAKI'})}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function doPost(e){const lock=LockService.getScriptLock();try{lock.waitLock(20000);const b=JSON.parse(e.postData.contents);const f=H[b.action];if(!f)fail('Action inconnue');
 const open=b.action==='register'||b.action==='login';return out({ok:true,data:f(b,open?null:auth(b.token))})}catch(err){return out({ok:false,error:String(err.message||err)})}finally{try{lock.releaseLock()}catch(x){}}}
function auth(t){const [id,sec]=String(t||'').split('.');if(!id||!sec)fail('Non connecté');const m=rows('Membres').find(r=>r.id===id);if(!m||m.tokenHash!==hash(sec))fail('Session invalide');return m}
function newToken(m){const sec=uid()+uid();m.tokenHash=hash(sec);m.modif=now();put('Membres',m._row,m);return m.id+'.'+sec}
const pub=m=>({id:m.id,prenom:m.prenom,login:m.login,role:m.role,done:!!m.profil});
const pj=s=>{try{return JSON.parse(s)||{}}catch(e){return{}}};
const log=(g,u,t,s)=>add('Activites',{id:uid(),groupeId:g,userId:u,type:t,sortieId:s||'',date:now()});
const isMember=(me,g)=>rows('Adhesions').some(a=>a.groupeId===g&&a.userId===me.id);
const need=(me,g)=>{if(!isMember(me,g))fail('Tu ne fais pas partie de ce groupe')};
function throttle(k){const c=CacheService.getScriptCache(),n=+c.get(k)||0;if(n>=5)fail("Trop d'essais, réessaie dans 10 min");return ()=>c.put(k,String(n+1),600)}
const H={
register(b){const prenom=clean(String(b.prenom).split('#')[0],30);if(!prenom)fail('Prénom requis');if(!/^\d{4,8}$/.test(String(b.pin)))fail('Code : 4 à 8 chiffres');
 const all=rows('Membres');let login;do{login=prenom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'')+'#'+Math.floor(1000+Math.random()*9000)}while(all.some(r=>r.login===login));
 const sel=uid(),m={id:uid(),prenom,login,sel,pinHash:hash(sel+b.pin),role:'membre',creation:now(),modif:now()};add('Membres',m);m._row=sh('Membres').getLastRow();return{token:newToken(m),me:pub(m)}},
login(b){const nl=String(b.login).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g,''),k='f'+nl,bump=throttle(k);const m=rows('Membres').find(r=>r.login.toLowerCase()===nl);
 if(!m||m.pinHash!==hash(m.sel+b.pin)){bump();fail('Identifiant ou code incorrect')}CacheService.getScriptCache().remove(k);return{token:newToken(m),me:pub(m)}},
state(b,me){const ad=rows('Adhesions'),mine=ad.filter(a=>a.userId===me.id).map(a=>a.groupeId),inG=a=>mine.indexOf(a.groupeId)>=0;
 const groupes=rows('Groupes').filter(g=>mine.indexOf(g.id)>=0).map(g=>({id:g.id,nom:g.nom,n:ad.filter(a=>a.groupeId===g.id).length}));
 const adh=ad.filter(inG).map(a=>({groupeId:a.groupeId,userId:a.userId})),uids=adh.map(a=>a.userId);
 const sorties=rows('Sorties').filter(inG).map(s=>({id:s.id,groupeId:s.groupeId,nom:s.nom,date:s.date,debut:s.debut,fin:s.fin,lieu:s.lieu,description:s.description,lien:s.lien,organisateur:s.organisateur,statut:s.statut,type:s.type||'sortie',dateFin:s.dateFin,budget:+s.budget||0,compteur:s.compteur==='1'})),ids=sorties.map(s=>s.id);
 return{me:pub(me),groupes,adhesions:adh,membres:rows('Membres').filter(m=>uids.indexOf(m.id)>=0).map(m=>{const p=pj(m.profil);return{id:m.id,prenom:m.prenom,days:p.days||[],hrs:p.hrs||[],likes:p.likes||[]}}),
 sorties,
 depenses:rows('Depenses').filter(d=>ids.indexOf(d.sortieId)>=0).map(d=>({id:d.id,sortieId:d.sortieId,libelle:d.libelle,montant:+d.montant,payeur:d.payeur,parts:d.parts.split(',')})),
 participations:rows('Participations').filter(p=>ids.indexOf(p.sortieId)>=0).map(p=>({sortieId:p.sortieId,userId:p.userId,reponse:p.reponse}))}},
groupCreate(b,me){const nom=clean(b.nom,40),code=String(b.code||'');if(nom.length<2)fail('Nom trop court');if(code.length<4||code.length>20)fail('Code : 4 à 20 caractères');
 if(rows('Groupes').some(g=>g.nom.toLowerCase()===nom.toLowerCase()))fail('Ce nom de groupe existe déjà');
 const sel=uid(),g={id:uid(),nom,sel,codeHash:hash(sel+code),createur:me.id,creation:now()};add('Groupes',g);add('Adhesions',{groupeId:g.id,userId:me.id,date:now()});log(g.id,me.id,'création du groupe');return{id:g.id}},
groupSearch(b){const q=clean(b.q,40).toLowerCase();if(q.length<2)return[];return rows('Groupes').filter(g=>g.nom.toLowerCase().indexOf(q)>=0).slice(0,10).map(g=>({id:g.id,nom:g.nom}))},
groupJoin(b,me){const g=rows('Groupes').find(r=>r.id===b.groupeId);if(!g)fail('Groupe introuvable');const k='j'+me.id,bump=throttle(k);
 if(g.codeHash!==hash(g.sel+String(b.code||''))){bump();fail('Code incorrect')}if(!isMember(me,g.id)){add('Adhesions',{groupeId:g.id,userId:me.id,date:now()});log(g.id,me.id,'a rejoint le groupe')}return{id:g.id}},
groupInfo(b){const g=rows('Groupes').find(r=>r.id===b.id);if(!g)fail('Groupe introuvable');return{id:g.id,nom:g.nom}},
groupLeave(b,me){const a=rows('Adhesions').find(x=>x.groupeId===b.groupeId&&x.userId===me.id);if(a)sh('Adhesions').deleteRow(a._row);return{}},
sortieSave(b,me){const nom=clean(b.nom,80);if(!nom)fail('Nom requis');if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date))fail('Date invalide');
 const t=v=>/^\d{2}:\d{2}$/.test(v)?v:'',lien=/^https?:\/\//.test(b.lien||'')?clean(b.lien,300):'';
 const o={nom,date:b.date,debut:t(b.debut),fin:t(b.fin),lieu:clean(b.lieu,100),description:clean(b.description,500),lien};
 const typ=b.type==='voyage'?'voyage':'sortie';o.type=typ;o.dateFin=typ==='voyage'&&/^\d{4}-\d{2}-\d{2}$/.test(b.dateFin||'')&&b.dateFin>=b.date?b.dateFin:'';const bu=Math.round(+b.budget||0);o.budget=bu>0&&bu<=100000?bu:'';
 if(!b.id){need(me,b.groupeId);const s=Object.assign({id:uid(),groupeId:b.groupeId},o,{organisateur:me.id,statut:'proposition',creation:now()});add('Sorties',s);log(s.groupeId,me.id,'proposition',s.id);return{id:s.id}}
 const s=rows('Sorties').find(r=>r.id===b.id);if(!s)fail('Sortie introuvable');need(me,s.groupeId);if(s.organisateur!==me.id&&me.role!=='admin')fail('Interdit');
 Object.assign(s,o);if(STATUTS.indexOf(b.statut)>=0)s.statut=b.statut;put('Sorties',s._row,s);log(s.groupeId,me.id,'modification',s.id);return{id:s.id}},
sortieCompteur(b,me){const s=rows('Sorties').find(r=>r.id===b.id);if(!s)fail('Sortie introuvable');need(me,s.groupeId);s.compteur='1';put('Sorties',s._row,s);return{}},
depSave(b,me){const s=rows('Sorties').find(r=>r.id===b.sortieId);if(!s)fail('Sortie introuvable');need(me,s.groupeId);if(s.compteur!=='1')fail('Compteur non activé');
 const mem=rows('Adhesions').filter(a=>a.groupeId===s.groupeId).map(a=>a.userId),m=Math.round(+b.montant*100)/100,parts=Array.isArray(b.parts)?b.parts:[];
 if(!(m>0&&m<=100000))fail('Montant invalide');if(mem.indexOf(b.payeur)<0)fail('Payeur invalide');if(!parts.length||parts.some(p=>mem.indexOf(p)<0))fail('Participants invalides');
 const d={id:uid(),sortieId:s.id,libelle:clean(b.libelle,60)||'Dépense',montant:m,payeur:b.payeur,parts:parts.join(','),creation:now(),modif:now()};
 if(!b.id){add('Depenses',d);log(s.groupeId,me.id,'dépense',s.id);return{}}
 const o=rows('Depenses').find(r=>r.id===b.id&&r.sortieId===s.id);if(!o)fail('Dépense introuvable');if(o.payeur!==me.id&&s.organisateur!==me.id&&me.role!=='admin')fail('Interdit');
 d.id=o.id;d.creation=o.creation;put('Depenses',o._row,d);return{}},
depDelete(b,me){const o=rows('Depenses').find(r=>r.id===b.id);if(!o)fail('Dépense introuvable');const s=rows('Sorties').find(r=>r.id===o.sortieId);if(!s)fail('Sortie introuvable');need(me,s.groupeId);
 if(o.payeur!==me.id&&s.organisateur!==me.id&&me.role!=='admin')fail('Interdit');sh('Depenses').deleteRow(o._row);return{}},
sortieDelete(b,me){const s=rows('Sorties').find(r=>r.id===b.id);if(!s)fail('Sortie introuvable');need(me,s.groupeId);if(s.organisateur!==me.id&&me.role!=='admin')fail('Interdit');
 rows('Participations').filter(p=>p.sortieId===s.id).reverse().forEach(p=>sh('Participations').deleteRow(p._row));rows('Depenses').filter(d=>d.sortieId===s.id).reverse().forEach(d=>sh('Depenses').deleteRow(d._row));sh('Sorties').deleteRow(s._row);return{}},
respond(b,me){if(['disponible','indisponible'].indexOf(b.reponse)<0)fail('Réponse invalide');const s=rows('Sorties').find(r=>r.id===b.sortieId);if(!s)fail('Sortie introuvable');need(me,s.groupeId);
 const p=rows('Participations').find(r=>r.sortieId===s.id&&r.userId===me.id);if(p){p.reponse=b.reponse;p.modif=now();put('Participations',p._row,p)}else add('Participations',{sortieId:s.id,userId:me.id,reponse:b.reponse,creation:now(),modif:now()});log(s.groupeId,me.id,'réponse',s.id);return{}},
dispoSet(b,me){const r=Array.isArray(b.rules)?b.rules.slice(0,40):fail('Règles invalides');r.forEach(x=>{const j=+x.jour;if(!(j>=0&&j<=6)||['disponible','indisponible'].indexOf(x.type)<0)fail('Règle invalide')});
 rows('Dispos').filter(d=>d.userId===me.id).reverse().forEach(d=>sh('Dispos').deleteRow(d._row));
 r.forEach(x=>add('Dispos',{id:uid(),userId:me.id,jour:+x.jour,debut:/^\d{2}:\d{2}$/.test(x.debut)?x.debut:'',fin:/^\d{2}:\d{2}$/.test(x.fin)?x.fin:'',type:x.type,modif:now()}));return{}},
profilSave(b,me){const ok=(a,max)=>Array.isArray(a)&&a.length<=10&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=max);if(!ok(b.days,6)||!ok(b.hrs,3)||!ok(b.likes,7))fail('Données invalides');me.profil=JSON.stringify({days:b.days,hrs:b.hrs,likes:b.likes});me.modif=now();put('Membres',me._row,me);return{}},
profil(b,me){const p=clean(b.prenom,30);if(!p)fail('Prénom requis');me.prenom=p;me.modif=now();put('Membres',me._row,me);return pub(me)}};
