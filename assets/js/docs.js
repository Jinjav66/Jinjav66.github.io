import { el, copyText, announce } from './app.js';

const sections = [
  {
    id:'comms',
    title:'Comms (TFAR) — Radio Procedure',
    body: `
      <p><strong>Baseline:</strong> Keep transmissions short, confirm readbacks, and use proper callsigns.</p>
      <ul class="list">
        <li><strong>Check-in format:</strong> "Odin, JackRabbit-1, radio check, over."</li>
        <li><strong>Contact report (SALTA):</strong> Size, Activity, Location, Time, Assessment.</li>
        <li><strong>Net discipline:</strong> Urgent traffic only on LR. Use SR for fireteam chatter.</li>
        <li><strong>Lost comms:</strong> Revert to alternate freq, then rally point; send runner only as last resort.</li>
      </ul>
      <p class="muted small">Edit this content in <span class="mono">assets/js/docs.js</span> or swap to JSON if you prefer.</p>
    `
  },
  {
    id:'medical',
    title:'Medical (ACE) — Triage & CASEVAC',
    body: `
      <ul class="list">
        <li><strong>Self aid:</strong> Tourniquet first, then bandage, then meds as directed.</li>
        <li><strong>CLS:</strong> Stabilise and handoff to Medic. Call out treatment status on SR.</li>
        <li><strong>Medic:</strong> Prioritise airway/bleeding; stage casualties for CASEVAC.</li>
        <li><strong>9-liner:</strong> Use standard MEDEVAC request when Sierra is available.</li>
      </ul>
    `
  },
  {
    id:'roe',
    title:'Rules of Engagement (ROE)',
    body: `
      <ul class="list">
        <li>PID before engagement. If unsure, do not shoot.</li>
        <li>Minimise collateral. Avoid explosives near civilians unless authorised.</li>
        <li>Escalation of force: verbal → show of force → non-lethal (if available) → lethal.</li>
        <li>HVT capture preferred unless mission dictates otherwise.</li>
      </ul>
    `
  },
  {
    id:'uniform',
    title:'Uniform Standards',
    body: `
      <ul class="list">
        <li>Unit uniform: MTP (or mission-specific variant).</li>
        <li>IR strobes on night ops (toggle only when directed).</li>
        <li>Helmet markings: squad colour tape (placeholder).</li>
        <li>No novelty gear unless approved for the scenario.</li>
      </ul>
    `
  },
  {
    id:'zeus',
    title:'Zeus Guidelines',
    body: `
      <ul class="list">
        <li>Prioritise player agency. Use gentle pressure, not hard rails.</li>
        <li>Spawn sparingly; reinforce only if the plan breaks spectacularly.</li>
        <li>Reward recon and good comms with actionable intel.</li>
        <li>AAR: capture key moments and provide a short debrief.</li>
      </ul>
    `
  }
];

function buildAccordion(){
  const acc = document.getElementById('docs-accordion');
  const nav = document.getElementById('docs-nav');
  acc.innerHTML = '';
  nav.innerHTML = '';

  sections.forEach((s, idx)=>{
    // nav links
    nav.appendChild(el('a',{href:`#${s.id}`, text:s.title}));

    const item = el('div',{class:'acc-item', id:s.id, 'data-open': idx===0 ? 'true':'false'},[]);
    const btn = el('button',{class:'acc-button', type:'button', 'aria-expanded': idx===0 ? 'true':'false'},[
      el('span',{class:'acc-title', text:s.title}),
      el('span',{class:'acc-icon', 'aria-hidden':'true', text:'⌄'})
    ]);
    const panel = el('div',{class:'acc-panel'},[]);
    panel.innerHTML = `
      ${s.body}
      <div class="row mt-8">
        <button class="btn btn-ghost btn-sm" type="button" data-copy>Copy section link</button>
      </div>
    `;

    btn.addEventListener('click', ()=>{
      const open = item.dataset.open === 'true';
      item.dataset.open = open ? 'false' : 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });

    panel.querySelector('[data-copy]').addEventListener('click', async ()=>{
      const link = `${location.origin}${location.pathname}#${s.id}`;
      try{
        await copyText(link);
        announce('Link copied');
      }catch{
        prompt('Copy link:', link);
      }
    });

    item.appendChild(btn);
    item.appendChild(panel);
    acc.appendChild(item);
  });
}

function openFromHash(){
  const id = location.hash.replace('#','');
  if(!id) return;
  const target = document.getElementById(id);
  if(!target) return;

  document.querySelectorAll('.acc-item').forEach(i=>{
    i.dataset.open = i.id === id ? 'true' : 'false';
    const b = i.querySelector('.acc-button');
    if(b) b.setAttribute('aria-expanded', i.id === id ? 'true' : 'false');
  });
  target.scrollIntoView({behavior:'smooth', block:'start'});
}

buildAccordion();
window.addEventListener('hashchange', openFromHash);
openFromHash();
