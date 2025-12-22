import { fetchJSON, DATA, el, normalize, uniqueSorted, tag, debounce } from './app.js';

let roster = [];
let squads = [];
let filtered = [];
let view = 'table';

const state = {
  q: '',
  squad: 'All',
  role: 'All',
  status: 'All',
  qual: 'All'
};

function populateSelect(sel, values){
  sel.innerHTML = '';
  sel.appendChild(el('option',{value:'All', text:'All'}));
  values.forEach(v=> sel.appendChild(el('option',{value:v, text:v})));
}

function memberMatches(m){
  const q = normalize(state.q);
  const hay = normalize([
    m.callsign, m.rank, m.role, m.squad, (m.qualifications||[]).join(' '), m.timezone, m.status
  ].join(' '));
  if(q && !hay.includes(q)) return false;
  if(state.squad !== 'All' && m.squad !== state.squad) return false;
  if(state.role !== 'All' && m.role !== state.role) return false;
  if(state.status !== 'All' && m.status !== state.status) return false;
  if(state.qual !== 'All' && !(m.qualifications||[]).includes(state.qual)) return false;
  return true;
}

function statusKind(status){
  if(status === 'Active') return 'status';
  if(status === 'Reserve') return 'warn';
  if(status === 'LOA') return 'danger';
  return 'info';
}

function squadName(id){
  return squads.find(s=> s.squadId === id)?.name || id;
}

function renderTable(rows){
  const tbody = document.querySelector('#roster-table tbody');
  tbody.innerHTML = '';
  for(const m of rows){
    const quals = (m.qualifications||[]).map(q=> `<span class="tag" data-kind="qual">${q}</span>`).join(' ');
    const tr = el('tr',{},[
      el('td',{text:m.callsign}),
      el('td',{text:m.rank}),
      el('td',{text:m.role}),
      el('td',{},[el('span',{class:'mono',text:m.squad}), el('div',{class:'muted small',text:squadName(m.squad)})]),
      el('td',{}), // placeholder then innerHTML
      el('td',{text:m.timezone}),
      el('td',{}),
      el('td',{text:m.joinedDate})
    ]);
    tr.children[4].innerHTML = quals || '<span class="muted">—</span>';
    tr.children[6].innerHTML = `<span class="tag" data-kind="${statusKind(m.status)}">${m.status}</span>`;
    tbody.appendChild(tr);
  }
}

function renderCards(rows){
  const wrap = document.getElementById('roster-cards-wrap');
  wrap.innerHTML = '';
  for(const m of rows){
    const quals = el('div',{class:'tag-list'}, (m.qualifications||[]).map(q=> tag(q,'qual')));
    const card = el('article',{class:'card'},[
      el('div',{class:'op-head'},[
        el('div',{},[
          el('div',{class:'h3',text:m.callsign}),
          el('div',{class:'muted small',text:`${m.rank} • ${m.role}`})
        ]),
        tag(m.status, statusKind(m.status))
      ]),
      el('div',{class:'muted small',text:squadName(m.squad)}),
      el('div',{class:'row'},[el('span',{class:'tag mono','data-kind':'info',text:m.squad})]),
      el('div',{},[
        el('div',{class:'muted small',text:'Qualifications'}),
        quals.childNodes.length ? quals : el('div',{class:'muted',text:'—'})
      ]),
      el('div',{class:'row mt-8'},[
        el('span',{class:'muted small',text:`Timezone: ${m.timezone}`}),
        el('span',{class:'muted small',text:`Joined: ${m.joinedDate}`})
      ])
    ]);
    wrap.appendChild(card);
  }
}

function apply(){
  filtered = roster.filter(memberMatches);
  document.getElementById('roster-count').textContent = `${filtered.length} member${filtered.length===1?'':'s'}`;
  if(view === 'table') renderTable(filtered);
  else renderCards(filtered);
}

function setView(next){
  view = next;
  const tableWrap = document.getElementById('roster-table-wrap');
  const cardWrap = document.getElementById('roster-cards-wrap');
  const bt = document.getElementById('view-table');
  const bc = document.getElementById('view-cards');
  if(view === 'table'){
    tableWrap.hidden = false; cardWrap.hidden = true;
    bt.setAttribute('aria-pressed','true'); bc.setAttribute('aria-pressed','false');
  }else{
    tableWrap.hidden = true; cardWrap.hidden = false;
    bt.setAttribute('aria-pressed','false'); bc.setAttribute('aria-pressed','true');
  }
  apply();
}

function clearFilters(){
  state.q = '';
  state.squad = state.role = state.status = state.qual = 'All';
  document.getElementById('roster-search').value = '';
  document.getElementById('filter-squad').value = 'All';
  document.getElementById('filter-role').value = 'All';
  document.getElementById('filter-status').value = 'All';
  document.getElementById('filter-qual').value = 'All';
  apply();
}

async function init(){
  [roster, squads] = await Promise.all([
    fetchJSON(DATA.roster),
    fetchJSON(DATA.squads)
  ]);

  // populate filters
  populateSelect(document.getElementById('filter-squad'), squads.map(s=> s.squadId));
  populateSelect(document.getElementById('filter-role'), uniqueSorted(roster.map(r=> r.role)));
  populateSelect(document.getElementById('filter-status'), uniqueSorted(roster.map(r=> r.status)));
  populateSelect(document.getElementById('filter-qual'), uniqueSorted(roster.flatMap(r=> r.qualifications || [])));

  // wire controls
  document.getElementById('roster-search').addEventListener('input', debounce((e)=>{
    state.q = e.target.value;
    apply();
  }, 120));

  document.getElementById('filter-squad').addEventListener('change', (e)=>{ state.squad = e.target.value; apply(); });
  document.getElementById('filter-role').addEventListener('change', (e)=>{ state.role = e.target.value; apply(); });
  document.getElementById('filter-status').addEventListener('change', (e)=>{ state.status = e.target.value; apply(); });
  document.getElementById('filter-qual').addEventListener('change', (e)=>{ state.qual = e.target.value; apply(); });

  document.getElementById('view-table').addEventListener('click', ()=> setView('table'));
  document.getElementById('view-cards').addEventListener('click', ()=> setView('cards'));
  document.getElementById('roster-clear').addEventListener('click', clearFilters);

  apply();
}

init().catch(e=>{
  console.error(e);
  document.getElementById('roster-count').textContent = 'Error loading roster data.';
});
