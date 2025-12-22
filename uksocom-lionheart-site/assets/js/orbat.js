import { fetchJSON, DATA, el, normalize, debounce, copyText, currentUrlWithHash, announce, tag } from './app.js';

let ORBAT = null;
let flatIndex = new Map();
let selectedId = null;

function flatten(node, depth=0, parentId=null){
  flatIndex.set(node.id, { ...node, depth, parentId });
  (node.children || []).forEach(ch=> flatten(ch, depth+1, node.id));
}

function buildTree(node, depth=0){
  const btn = el('button', {
    type:'button',
    role:'treeitem',
    'data-id': node.id,
    'aria-selected': 'false'
  }, [
    `${'—'.repeat(Math.min(depth,3))} ${node.name} `,
  ]);

  btn.addEventListener('click', ()=> select(node.id, true));

  const wrap = el('div', { class: depth ? 'indent' : '' }, [btn]);

  (node.children || []).forEach(ch=>{
    wrap.appendChild(buildTree(ch, depth+1));
  });

  return wrap;
}

function setSelectedButton(id){
  document.querySelectorAll('#orbat-tree button[data-id]').forEach(b=>{
    b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false');
  });
}

function renderDetail(id){
  const item = flatIndex.get(id);
  const title = document.getElementById('orbat-title');
  const panel = document.getElementById('orbat-detail');
  if(!item || !title || !panel) return;

  title.textContent = item.name;
  const leader = item.leader ? `${item.leader.callsign} — ${item.leader.name} (${item.leader.role})` : '—';
  const comms = item.comms ? `${item.comms.primary} / ${item.comms.secondary}` : '—';
  const commsNotes = item.comms?.notes || '';
  const tasks = item.tasks?.length ? `<ul class="list">${item.tasks.map(t=>`<li>${t}</li>`).join('')}</ul>` : `<div class="muted">No tasks listed.</div>`;

  panel.innerHTML = `
    <div class="kv">
      <div class="k">Type</div><div class="v">${item.type || '—'}</div>
      <div class="k">Leader</div><div class="v">${leader}</div>
      <div class="k">Comms</div><div class="v"><span class="mono">${comms}</span> <div class="muted small">${commsNotes}</div></div>
    </div>
    <div class="mt-16">
      <div class="k">Description</div>
      <div class="v">${item.description || '<span class="muted">—</span>'}</div>
    </div>
    <div class="mt-16">
      <div class="k">Tasks</div>
      <div class="v">${tasks}</div>
    </div>
  `;
}

function select(id, pushHash=false){
  if(!flatIndex.has(id)) return;
  selectedId = id;
  setSelectedButton(id);
  renderDetail(id);
  if(pushHash) window.location.hash = id;
}

function applyHash(){
  const id = window.location.hash.replace('#','').trim();
  if(id && flatIndex.has(id)) select(id, false);
}

function filterTree(query){
  const q = normalize(query);
  document.querySelectorAll('#orbat-tree button[data-id]').forEach(b=>{
    const id = b.dataset.id;
    const item = flatIndex.get(id);
    const text = normalize(item.name + ' ' + (item.type||'') + ' ' + (item.leader?.callsign||'') + ' ' + (item.leader?.name||''));
    const show = !q || text.includes(q);
    b.closest('div').style.display = show ? '' : 'none';
  });
}

async function init(){
  ORBAT = await fetchJSON(DATA.orbat);
  flatten(ORBAT);
  const tree = document.getElementById('orbat-tree');
  tree.innerHTML = '';
  tree.appendChild(buildTree(ORBAT, 0));

  // default selection: root
  select(ORBAT.id);

  const search = document.getElementById('orbat-search');
  search.addEventListener('input', debounce(()=> filterTree(search.value), 120));

  const share = document.getElementById('orbat-share');
  share.addEventListener('click', async ()=>{
    const link = currentUrlWithHash(selectedId || ORBAT.id);
    try{
      await copyText(link);
      announce('Link copied');
      share.textContent = 'Copied!';
      setTimeout(()=> share.textContent='Copy share link', 1200);
    }catch{
      prompt('Copy this link:', link);
    }
  });

  window.addEventListener('hashchange', applyHash);
  applyHash();
}

init().catch(e=>{
  console.error(e);
  const panel = document.getElementById('orbat-detail');
  if(panel) panel.innerHTML = `<span class="tag" data-kind="danger">Error loading ORBAT data.</span>`;
});
