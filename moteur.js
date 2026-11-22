/* Moteur : réécriture de mots, tous les ordres. Partagé par la page et par les outils (node). */
function sites(w,r,f){
  if(r.debut){if(w.startsWith(r.l)&&(!r.fin||r.l.length===w.length))f(0);return}
  if(r.fin){const p=w.length-r.l.length;if(p>=0&&w.endsWith(r.l))f(p);return}
  for(let p=w.indexOf(r.l);p>=0;p=w.indexOf(r.l,p+1))f(p);
}
const systemeMots=regles=>({taille:w=>w.length,succ(w,f){regles.forEach((r,ri)=>sites(w,r,p=>f(w.slice(0,p)+r.r+w.slice(p+r.l.length),ri,p)))}});
/* Termes : A, C(A,B), E(A).
   Dans une règle, x y z valent un sous-terme entier et 1 2 une feuille quelconque du domaine. */
function lireTerme(src,sig,regle){let i=0;
  const t=()=>{const c=src[i++];if(c===undefined)throw 0;
    if(regle&&'xyz'.includes(c))return{v:c};
    if(regle&&(c==='1'||c==='2'))return{j:c};
    const a=sig[c];if(a===undefined)throw 0;
    if(a===0)return{s:c,k:[]};
    if(src[i]==='('){i++;const k=[t()];while(src[i]===','){i++;k.push(t())}if(src[i++]!==')'||k.length!==a)throw 0;return{s:c,k}}
    throw 0};
  const x=t();if(i!==src.length)throw 0;return x}
const cle=t=>t.v||t.j||(t.k.length?t.s+'('+t.k.map(cle).join(',')+')':t.s);
const filtre=(m,t,env)=>m.v?(env[m.v]=t,true):m.s===t.s&&m.k.every((c,i)=>filtre(c,t.k[i],env));
const subst=(r,env)=>r.v?env[r.v]:{s:r.s,k:r.k.map(c=>subst(c,env))};
function systemeTermes(regles,sig){const vus=new Map(),lu=w=>{let t=vus.get(w);if(!t){t=lireTerme(w,sig);vus.set(w,t)}return t};
  return{taille:w=>w.replace(/[(),]/g,'').length,
    succ(w,f){let pos=0;
      const rec=(n,refaire)=>{const p=pos++;regles.forEach((r,ri)=>{const env={};if(filtre(r.m,n,env))f(cle(refaire(subst(r.r,env))),ri,p)});
        n.k.forEach((c,i)=>rec(c,x=>refaire({s:n.s,k:n.k.map((d,j)=>j===i?x:d)})))};
      rec(lu(w),x=>x)}}}
const systeme=(niv,regles)=>niv.sig?systemeTermes(regles,niv.sig):systemeMots(regles);
/* Graphe complet des mots atteignables, avec le statut de chaque mot. */
function explorer(depart,sys,attendu,plafond,lmax){
  const N=[],rang=new Map();
  const noeud=(w,d)=>{let i=rang.get(w);if(i===undefined){if(N.length>=plafond||sys.taille(w)>lmax)return -1;i=N.length;rang.set(w,i);N.push({w,d,succ:[],coupe:false,boucle:false})}return i};
  noeud(depart,0);
  for(let q=0;q<N.length;q++){const n=N[q];
    sys.succ(n.w,(v,ri,p)=>{const j=noeud(v,n.d+1);if(j<0)n.coupe=true;else n.succ.push({to:j,ri,p})})}
  const etat=new Uint8Array(N.length),ordre=[];let cyclique=false;const pile=[[0,0]];etat[0]=1;
  while(pile.length){const top=pile[pile.length-1],n=N[top[0]];
    if(top[1]<n.succ.length){const j=n.succ[top[1]++].to;
      if(etat[j]===1){n.boucle=true;cyclique=true}else if(etat[j]===0){etat[j]=1;pile.push([j,0])}}
    else{etat[top[0]]=2;ordre.push(top[0]);pile.pop()}}
  for(const n of N){n.fin=!n.succ.length&&!n.coupe;n.juste=n.fin&&n.w===attendu;n.bon=n.juste;n.mauvais=(n.fin&&!n.juste)||n.coupe||n.boucle}
  for(let ch=true;ch;){ch=false;for(const n of N)for(const e of n.succ){const m=N[e.to];
    if(m.bon&&!n.bon){n.bon=true;ch=true}if(m.mauvais&&!n.mauvais){n.mauvais=true;ch=true}}}
  if(!cyclique){for(const n of N)n.d=0;for(let k=ordre.length-1;k>=0;k--){const n=N[ordre[k]];for(const e of n.succ)N[e.to].d=Math.max(N[e.to].d,n.d+1)}}
  return{N,ok:!N[0].mauvais,cyclique};
}
/* Verdict seul : s'arrête à la première issue fausse. */
function verdict(depart,sys,attendu,plafond,lmax){
  const W=[depart],S=[],rang=new Map([[depart,0]]);
  for(let q=0;q<W.length;q++){const w=W[q],s=[];let coupe=false;
    sys.succ(w,v=>{let j=rang.get(v);
      if(j===undefined){if(W.length>=plafond||sys.taille(v)>lmax){coupe=true;return}j=W.length;rang.set(v,j);W.push(v)}s.push(j)});
    if(coupe||(!s.length&&w!==attendu))return false;S.push(s)}
  const etat=new Uint8Array(W.length),pile=[[0,0]];etat[0]=1;
  while(pile.length){const top=pile[pile.length-1],s=S[top[0]];
    if(top[1]<s.length){const j=s[top[1]++];if(etat[j]===1)return false;if(etat[j]===0){etat[j]=1;pile.push([j,0])}}
    else{etat[top[0]]=2;pile.pop()}}
  return true;
}
/* Règles en texte : une par ligne, « motif > remplacement » (>, ->, =>, → ou = ; # commentaire).
   ^ et $ accrochent au début et à la fin du mot ; 1 et 2 valent une lettre quelconque du domaine. */
const COTE=6,COTE_T=7;
function lireTermes(texte,niv){const regles=[],fautes=[];let lignes=0,symboles=0;
  texte.split('\n').forEach((brut,i)=>{const l=brut.replace(/#.*/,'').replace(/\s+/g,'').replace(/[a-e]/g,c=>c.toUpperCase()).replace(/[XYZ]/g,c=>c.toLowerCase());if(!l)return;
    try{const m=l.match(/^(.+?)(?:->|=>|→|>|=)(.+)$/);if(!m)throw 0;
      const g=lireTerme(m[1],niv.sig,true),d=lireTerme(m[2],niv.sig,true),vg=[],jg=new Set();let ng=0,nd=0;
      if(g.v||g.j)throw 0;
      (function p(t){ng++;if(t.v){if(vg.includes(t.v))throw 0;vg.push(t.v)}else if(t.j){if(!niv.jokers)throw 0;jg.add(t.j)}else t.k.forEach(p)})(g);
      (function p(t){nd++;if(t.v){if(!vg.includes(t.v))throw 0}else if(t.j){if(!jg.has(t.j))throw 0}else t.k.forEach(p)})(d);
      if(ng>COTE_T||nd>COTE_T)throw 0;
      lignes++;symboles+=ng+nd;let cas=[{}];for(const k of jg)cas=cas.flatMap(a=>[...niv.jokers].map(x=>({...a,[k]:x})));
      for(const a of cas){const tr=t=>t.j?{s:a[t.j],k:[]}:t.v?t:{s:t.s,k:t.k.map(tr)};regles.push({m:tr(g),r:tr(d),ligne:i})}
    }catch(e){fautes.push(i)}});
  return{regles,fautes,lignes,symboles}}
function lire(texte,niv){if(niv.sig)return lireTermes(texte,niv);const regles=[],fautes=[];let lignes=0,symboles=0;
  texte.split('\n').forEach((brut,i)=>{const l=brut.replace(/#.*/,'').trim().toUpperCase();if(!l)return;
    const m=l.match(/^(\^?)([A-E12]+)(\$?)\s*(?:->|=>|→|>|=)\s*([A-E12]*)$/);let ok=!!m;
    if(ok){const g=m[2],d=m[4];
      if((m[1]||m[3])&&!niv.ancrages)ok=false;
      if(g.length>COTE||d.length>COTE)ok=false;
      for(const c of g+d)if(c==='1'||c==='2'){if(!niv.jokers||!g.includes(c))ok=false}else if(!niv.alphabet.includes(c))ok=false;
      if(ok){lignes++;symboles+=g.length+d.length;
        let cas=[{}];for(const k of new Set(g.match(/[12]/g)||[]))cas=cas.flatMap(a=>[...niv.jokers].map(x=>({...a,[k]:x})));
        for(const a of cas){const tr=s=>s.replace(/[12]/g,c=>a[c]);regles.push({l:tr(g),r:tr(d),debut:!!m[1],fin:!!m[3],ligne:i})}}}
    if(!ok)fautes.push(i)});
  return{regles,fautes,lignes,symboles}}

