import { fetchJSON, DATA, el, tag, fmtDateTime, fmtDate, copyText, announce } from './app.js';

function opCardUpcoming(op){
  const card = el('article',{class:'card op', id: op.id },[]);
  const reqTags = (op.requirements || []).map(r=> tag(r,'info'));
  const meta = el('div',{class:'op-meta'},[
    tag(fmtDateTime(op.datetimeIso),'status'),
    tag(op.map,'info'),
    tag(op.faction,'qual')
  ]);
  card.appendChild(el('div',{class:'op-head'},[
    el('div',{},[
      el('div',{class:'h3',text:op.title}),
      meta
    ]),
    el('button',{class:'btn btn-ghost btn-sm', type:'button'},['Copy AAR template'])
  ]));
  card.appendChild(el('div',{class:'muted'},[op.brief]));
  card.appendChild(el('div',{class:'tag-list'},reqTags));

  const template = [
    `AAR — ${op.title}`,
    `Date/Time: ${fmtDateTime(op.datetimeIso)}`,
    `Map: ${op.map}`,
    `Faction: ${op.faction}`,
    ``,
    `1) Situation:`,
    `2) Mission:`,
    `3) Execution:`,
    `4) Sustainment:`,
    `5) Command & Signal:`,
    `6) Casualties:`,
    `7) Lessons Learned:`,
  ].join('\n');

  card.querySelector('button').addEventListener('click', async ()=>{
    try{
      await copyText(template);
      announce('AAR template copied');
    }catch{
      prompt('Copy AAR template:', template);
    }
  });

  return card;
}

function opCardPast(op){
  const card = el('article',{class:'card op', id: op.id },[]);
  const meta = el('div',{class:'op-meta'},[
    tag(fmtDate(op.dateIso),'status'),
    tag(op.map,'info'),
    tag(op.faction,'qual'),
    tag(op.result || '—', op.result === 'Success' ? 'status' : (op.result === 'Partial' ? 'warn' : 'danger'))
  ]);

  const btnCopy = el('button',{class:'btn btn-ghost btn-sm', type:'button'},['Copy AAR']);
  const btnLink = el('button',{class:'btn btn-ghost btn-sm', type:'button'},['Copy link']);

  card.appendChild(el('div',{class:'op-head'},[
    el('div',{},[
      el('div',{class:'h3',text:op.title}),
      meta
    ]),
    el('div',{class:'row'},[btnLink, btnCopy])
  ]));
  card.appendChild(el('div',{class:'muted'},[op.brief]));

  const templateObj = op.aarTemplate || {};
  const lines = [
    `AAR — ${op.title}`,
    `Date: ${fmtDateTime(op.dateIso)}`,
    `Map: ${op.map}`,
    `Faction: ${op.faction}`,
    `Result: ${op.result || '—'}`,
    ``,
    `Situation: ${templateObj.situation || ''}`,
    `Mission: ${templateObj.mission || ''}`,
    `Execution: ${templateObj.execution || ''}`,
    `Sustainment: ${templateObj.sustainment || ''}`,
    `Command & Signal: ${templateObj.commandSignal || ''}`,
    `Casualties: ${templateObj.casualties || ''}`,
    `Lessons Learned: ${templateObj.lessons || ''}`,
  ].join('\n');

  const pre = el('pre',{},[lines]);
  card.appendChild(pre);

  btnCopy.addEventListener('click', async ()=>{
    try{
      await copyText(lines);
      announce('AAR copied');
    }catch{
      prompt('Copy AAR:', lines);
    }
  });

  btnLink.addEventListener('click', async ()=>{
    const link = `${location.origin}${location.pathname}#${op.id}`;
    try{
      await copyText(link);
      announce('Link copied');
    }catch{
      prompt('Copy link:', link);
    }
  });

  return card;
}

async function init(){
  const [upcoming, past] = await Promise.all([
    fetchJSON(DATA.opsUpcoming),
    fetchJSON(DATA.opsPast),
  ]);

  const upWrap = document.getElementById('ops-upcoming');
  upWrap.innerHTML = '';
  upcoming.forEach(op=> upWrap.appendChild(opCardUpcoming(op)));

  const pastWrap = document.getElementById('ops-past');
  pastWrap.innerHTML = '';
  past.forEach(op=> pastWrap.appendChild(opCardPast(op)));

  // scroll to hash if present
  if(location.hash){
    const id = location.hash.replace('#','');
    const target = document.getElementById(id);
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

init().catch(e=>{
  console.error(e);
  document.getElementById('ops-upcoming').innerHTML = '<span class="tag" data-kind="danger">Error loading operations data.</span>';
});
