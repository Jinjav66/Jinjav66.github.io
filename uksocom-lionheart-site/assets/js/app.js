// Shared app utilities: nav, breadcrumbs, theme, fetch helpers, small UI primitives.
const DATA = {
  unitInfo: 'data/unitInfo.json',
  orbat: 'data/orbat.json',
  roster: 'data/roster.json',
  squads: 'data/squads.json',
  loadouts: 'data/loadouts.json',
  opsUpcoming: 'data/opsUpcoming.json',
  opsPast: 'data/opsPast.json'
};

export async function fetchJSON(path){
  const res = await fetch(path, { cache: 'no-store' });
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === 'class') node.className = v;
    else if(k === 'text') node.textContent = v;
    else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if(v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for(const c of children){
    if(typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if(c) node.appendChild(c);
  }
  return node;
}

export function fmtDateTime(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      weekday:'short', year:'numeric', month:'short', day:'2-digit',
      hour:'2-digit', minute:'2-digit', timeZoneName:'short'
    }).format(d);
  }catch{ return iso; }
}

export function fmtDate(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit' }).format(d);
  }catch{ return iso; }
}

export function setAriaCurrentNav(){
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    if(a.dataset.nav === page) a.setAttribute('aria-current','page');
  });
}

export function initTheme(){
  const root = document.documentElement;
  const saved = localStorage.getItem('lh_theme');
  const initial = saved || 'dark';
  root.dataset.theme = initial;

  const btn = document.getElementById('theme-toggle');
  if(btn){
    const label = ()=> btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    label();
    btn.addEventListener('click', ()=>{
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('lh_theme', root.dataset.theme);
      label();
    });
  }
}

export function initHeader(){
  const header = document.getElementById('site-header');
  if(!header) return;

  header.className = 'site-header';
  header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="UKSOCOM Lionheart Company home">
        <div class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10C7.5 21 4 17 4 12V6l8-4Z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="brand__text">
          <div class="brand__title">Lionheart Company</div>
          <div class="brand__subtitle">UKSOCOM • Arma 3 Milsim</div>
        </div>
      </a>

      <div class="topnav">
        <nav class="navlinks" aria-label="Primary">
          <a href="orbat.html" data-nav="orbat">ORBAT</a>
          <a href="roster.html" data-nav="roster">Roster</a>
          <a href="loadouts.html" data-nav="loadouts">Loadouts</a>
          <a href="operations.html" data-nav="operations">Operations</a>
          <a href="docs.html" data-nav="docs">SOP / Docs</a>
          <a href="join.html" data-nav="join">Join</a>
        </nav>
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm" id="theme-toggle" type="button" title="Theme toggle">☾/☀</button>
        </div>
      </div>
    </div>
  `;
  setAriaCurrentNav();
}

export function initBreadcrumb(){
  const bc = document.getElementById('breadcrumb');
  if(!bc) return;
  const page = document.body.dataset.page;
  const map = {
    home: { label: 'Home', href: 'index.html' },
    orbat: { label: 'ORBAT', href: 'orbat.html' },
    roster:{ label: 'Roster', href: 'roster.html' },
    loadouts:{ label:'Loadouts', href:'loadouts.html' },
    operations:{ label:'Operations', href:'operations.html' },
    docs:{ label:'SOP / Docs', href:'docs.html' },
    join:{ label:'Join', href:'join.html' }
  };
  const parts = [map.home];
  if(page && page !== 'home') parts.push(map[page] || {label: page, href: '#'});
  bc.innerHTML = '';
  for(let i=0;i<parts.length;i++){
    const p = parts[i];
    if(i>0) bc.append(el('span',{class:'sep',text:'/' }));
    if(i === parts.length - 1){
      bc.append(el('span',{text:p.label}));
    }else{
      bc.append(el('a',{href:p.href,text:p.label}));
    }
  }
}

export async function initUnitInfo(){
  try{
    const info = await fetchJSON(DATA.unitInfo);
    document.querySelectorAll('#unit-name').forEach(n=> n.textContent = info.name);
    document.querySelectorAll('#unit-motto').forEach(n=> n.textContent = info.motto);
    const tz = document.getElementById('unit-tz'); if(tz) tz.textContent = info.timezone;
    const ot = document.getElementById('unit-op-time'); if(ot) ot.textContent = info.standardOpTime;
    const discord = document.getElementById('discord-link'); if(discord) discord.textContent = info.discordInvitePlaceholder;
  }catch(e){
    console.warn(e);
  }
}

export function copyText(text){
  return navigator.clipboard?.writeText(text);
}

export function currentUrlWithHash(hash){
  const u = new URL(window.location.href);
  u.hash = hash || '';
  return u.toString();
}

export function announce(msg){
  const live = document.getElementById('aria-live');
  if(live){ live.textContent = msg; return; }
  const node = el('div', { id:'aria-live', class:'sr-only', 'aria-live':'polite' }, []);
  node.textContent = msg;
  document.body.appendChild(node);
}

export function debounce(fn, wait=150){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=> fn(...args), wait);
  };
}

export function tag(text, kind='info'){
  return el('span',{class:'tag','data-kind':kind, text});
}

export function normalize(s){
  return (s || '').toString().toLowerCase().trim();
}

export function uniqueSorted(arr){
  return Array.from(new Set(arr)).filter(Boolean).sort((a,b)=> a.localeCompare(b));
}

export function initBackToTop(){
  const btn = document.getElementById('to-top');
  if(!btn) return;
  btn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
}

export { DATA };

// bootstrap
initHeader();
initBreadcrumb();
initTheme();
initUnitInfo();
initBackToTop();
