import { fetchJSON, DATA, el, tag, normalize, debounce, copyText, currentUrlWithHash, announce } from './app.js';

let squads = [];
let loadouts = {};
let squadId = null;
let role = null;

function squadName(id){
  return squads.find(s=> s.squadId === id)?.name || id;
}

function rolesForSquad(id){
  const roles = loadouts[id]?.roles || {};
  return Object.keys(roles);
}

function populateSquads(){
  const sel = document.getElementById('loadout-squad');
  sel.innerHTML = '';
  squads.forEach(s=>{
    sel.appendChild(el('option',{value:s.squadId, text:s.name}));
  });
}

function populateRoles(){
  const sel = document.getElementById('loadout-role');
  sel.innerHTML = '';
  rolesForSquad(squadId).forEach(r=>{
    sel.appendChild(el('option',{value:r, text:r}));
  });
}

function renderMods(){
  const card = loadouts[squadId];
  const list = document.getElementById('mods-required');
  list.innerHTML = '';
  (card?.modsRequired || []).forEach(m=>{
    list.appendChild(el('li',{},[tag(m,'info')]));
  });
  const notes = document.getElementById('mods-notes');
  notes.innerHTML = `
    <div class="mt-8"><strong>ACE:</strong> ${card?.aceNotes || '—'}</div>
    <div class="mt-8"><strong>TFAR:</strong> ${card?.tfarNotes || '—'}</div>
  `;
}

function kvCard(title, obj){
  const rows = Object.entries(obj).map(([k,v])=>{
    const val = Array.isArray(v) ? (v.length ? `<ul class="list">${v.map(x=>`<li>${x}</li>`).join('')}</ul>` : `<span class="muted">—</span>`) : (v || '<span class="muted">—</span>');
    return `<div class="k">${k}</div><div class="v">${val}</div>`;
  }).join('');
  const node = el('article',{class:'card'},[]);
  node.innerHTML = `<h3 class="h3">${title}</h3><div class="kv">${rows}</div>`;
  return node;
}

function renderLoadout(){
  const title = document.getElementById('loadout-title');
  const subtitle = document.getElementById('loadout-subtitle');
  const detail = document.getElementById('loadout-detail');

  const card = loadouts[squadId];
  const data = card?.roles?.[role];
  if(!data){
    title.textContent = 'Select a loadout';
    subtitle.textContent = '—';
    detail.innerHTML = '';
    return;
  }

  title.textContent = `${squadName(squadId)} — ${role}`;
  subtitle.textContent = `Share: #${squadId}/${role}`;

  detail.innerHTML = '';
  detail.appendChild(kvCard('Weapons', {
    Primary: data.weapons.primary,
    Secondary: data.weapons.secondary,
    Launcher: data.weapons.launcher
  }));
  detail.appendChild(kvCard('Uniform / Kit', {
    Uniform: data.gear.uniform,
    Vest: data.gear.vest,
    Backpack: data.gear.backpack,
    Helmet: data.gear.helmet
  }));

  detail.appendChild(kvCard('Ammo', { Items: data.items.ammo }));
  detail.appendChild(kvCard('Medical', { Items: data.items.medical }));
  detail.appendChild(kvCard('Grenades', { Items: data.items.grenades }));
  detail.appendChild(kvCard('Tools', { Items: data.items.tools }));
  detail.appendChild(kvCard('Radios', { Items: data.items.radios }));
  detail.appendChild(kvCard('ACE Items', { Items: data.items.ace }));
  detail.appendChild(kvCard('Night Gear', { Items: data.items.nightGear }));

  const notes = el('article',{class:'card'},[]);
  notes.innerHTML = `<h3 class="h3">Notes</h3><div class="muted">${data.notes || '—'}</div>`;
  detail.appendChild(notes);
}

function buildTextExport(){
  const card = loadouts[squadId];
  const data = card?.roles?.[role];
  if(!data) return '';
  const lines = [];
  lines.push(`UKSOCOM Lionheart Company — Loadout`);
  lines.push(`Squad: ${squadName(squadId)} (${squadId})`);
  lines.push(`Role: ${role}`);
  lines.push('');
  lines.push(`[Weapons]`);
  lines.push(`Primary: ${data.weapons.primary}`);
  lines.push(`Secondary: ${data.weapons.secondary}`);
  lines.push(`Launcher: ${data.weapons.launcher}`);
  lines.push('');
  lines.push(`[Gear]`);
  lines.push(`Uniform: ${data.gear.uniform}`);
  lines.push(`Vest: ${data.gear.vest}`);
  lines.push(`Backpack: ${data.gear.backpack}`);
  lines.push(`Helmet: ${data.gear.helmet}`);
  lines.push('');
  const sections = [
    ['Ammo', data.items.ammo],
    ['Medical', data.items.medical],
    ['Grenades', data.items.grenades],
    ['Tools', data.items.tools],
    ['Radios', data.items.radios],
    ['ACE Items', data.items.ace],
    ['Night Gear', data.items.nightGear],
  ];
  for(const [name, arr] of sections){
    lines.push(`[${name}]`);
    (arr || []).forEach(x=> lines.push(`- ${x}`));
    lines.push('');
  }
  lines.push(`[Mods Required]`);
  (card.modsRequired || []).forEach(m=> lines.push(`- ${m}`));
  lines.push('');
  lines.push(`ACE: ${card.aceNotes || ''}`);
  lines.push(`TFAR: ${card.tfarNotes || ''}`);
  lines.push('');
  lines.push(`[Notes]`);
  lines.push(data.notes || '');
  return lines.join('\n');
}

function printCard(){
  const card = loadouts[squadId];
  const data = card?.roles?.[role];
  if(!data) return;

  const html = `
  <html>
    <head>
      <title>Loadout Card — ${squadId} ${role}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href="assets/css/print.css" />
    </head>
    <body>
      <div class="loadout-card">
        <h1>UKSOCOM Lionheart Company — Loadout Card</h1>
        <div class="mono">Squad: ${squadName(squadId)} (${squadId})</div>
        <div class="mono">Role: ${role}</div>

        <h2>Weapons</h2>
        <ul>
          <li><strong>Primary:</strong> ${data.weapons.primary}</li>
          <li><strong>Secondary:</strong> ${data.weapons.secondary}</li>
          <li><strong>Launcher:</strong> ${data.weapons.launcher}</li>
        </ul>

        <h2>Gear</h2>
        <ul>
          <li><strong>Uniform:</strong> ${data.gear.uniform}</li>
          <li><strong>Vest:</strong> ${data.gear.vest}</li>
          <li><strong>Backpack:</strong> ${data.gear.backpack}</li>
          <li><strong>Helmet:</strong> ${data.gear.helmet}</li>
        </ul>

        <h2>Items</h2>
        ${['Ammo','Medical','Grenades','Tools','Radios','ACE Items','Night Gear'].map((name)=>{
          const key = name === 'ACE Items' ? 'ace' : (name === 'Night Gear' ? 'nightGear' : name.toLowerCase());
          const arr = data.items[key] || [];
          return `<div><strong>${name}:</strong> ${arr.length ? `<ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul>` : '<div>—</div>'}</div>`;
        }).join('')}

        <h2>Mods</h2>
        <ul>${(card.modsRequired||[]).map(m=>`<li>${m}</li>`).join('')}</ul>

        <h2>Notes</h2>
        <div>${data.notes || '—'}</div>
      </div>

      <script>window.print();</script>
    </body>
  </html>
  `;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if(!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function applyHash(){
  const raw = window.location.hash.replace('#','').trim();
  if(!raw) return;
  const [s, r] = raw.split('/');
  if(s && loadouts[s]) squadId = s;
  if(r && loadouts[squadId]?.roles?.[r]) role = r;
}

function setHash(){
  window.location.hash = `${squadId}/${role}`;
}

function applySearch(query){
  const q = normalize(query);
  const roleSel = document.getElementById('loadout-role');
  if(!q){ // restore all
    populateRoles();
    roleSel.value = role;
    return;
  }
  const roles = rolesForSquad(squadId);
  roleSel.innerHTML = '';
  for(const r of roles){
    const text = normalize(r + ' ' + buildTextExport());
    // We only check role name plus current role export if same; better: check all roles for items
  }
  // Better: filter by searching each role export
  const matches = roles.filter(r=>{
    const d = loadouts[squadId].roles[r];
    const hay = normalize([
      r,
      d.weapons.primary, d.weapons.secondary, d.weapons.launcher,
      d.gear.uniform, d.gear.vest, d.gear.backpack, d.gear.helmet,
      ...(d.items.ammo||[]), ...(d.items.medical||[]), ...(d.items.grenades||[]),
      ...(d.items.tools||[]), ...(d.items.radios||[]), ...(d.items.ace||[]), ...(d.items.nightGear||[]),
      d.notes
    ].join(' '));
    return hay.includes(q);
  });
  matches.forEach(r=> roleSel.appendChild(el('option',{value:r,text:r})));
  if(!matches.includes(role)){
    role = matches[0] || roles[0];
  }
  roleSel.value = role;
  renderLoadout();
}

async function init(){
  [squads, loadouts] = await Promise.all([
    fetchJSON(DATA.squads),
    fetchJSON(DATA.loadouts)
  ]);

  populateSquads();
  squadId = squads[0]?.squadId;
  populateRoles();
  role = rolesForSquad(squadId)[0];

  applyHash();
  document.getElementById('loadout-squad').value = squadId;
  populateRoles();
  document.getElementById('loadout-role').value = role;

  renderMods();
  renderLoadout();
  setHash();

  document.getElementById('loadout-squad').addEventListener('change', (e)=>{
    squadId = e.target.value;
    populateRoles();
    role = rolesForSquad(squadId)[0];
    document.getElementById('loadout-role').value = role;
    renderMods();
    renderLoadout();
    setHash();
  });

  document.getElementById('loadout-role').addEventListener('change', (e)=>{
    role = e.target.value;
    renderLoadout();
    setHash();
  });

  document.getElementById('loadout-search').addEventListener('input', debounce((e)=>{
    applySearch(e.target.value);
  }, 120));

  document.getElementById('loadout-copy').addEventListener('click', async ()=>{
    const text = buildTextExport();
    try{
      await copyText(text);
      announce('Loadout copied');
      const btn = document.getElementById('loadout-copy');
      btn.textContent = 'Copied!';
      setTimeout(()=> btn.textContent='Copy as text', 1200);
    }catch{
      prompt('Copy loadout text:', text);
    }
  });

  document.getElementById('loadout-print').addEventListener('click', printCard);

  document.getElementById('loadout-share').addEventListener('click', async ()=>{
    const link = currentUrlWithHash(`${squadId}/${role}`);
    try{
      await copyText(link);
      announce('Link copied');
      const btn = document.getElementById('loadout-share');
      btn.textContent = 'Copied!';
      setTimeout(()=> btn.textContent='Copy share link', 1200);
    }catch{
      prompt('Copy this link:', link);
    }
  });

  window.addEventListener('hashchange', ()=>{
    const before = `${squadId}/${role}`;
    applyHash();
    const after = `${squadId}/${role}`;
    if(before !== after){
      document.getElementById('loadout-squad').value = squadId;
      populateRoles();
      document.getElementById('loadout-role').value = role;
      renderMods();
      renderLoadout();
    }
  });
}

init().catch(e=>{
  console.error(e);
  document.getElementById('loadout-title').textContent = 'Error loading loadouts data.';
});
