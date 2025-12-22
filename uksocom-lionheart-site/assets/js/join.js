import { copyText, announce, fetchJSON, DATA } from './app.js';

function setInvalid(el, msg){
  el.setAttribute('aria-invalid','true');
  el.title = msg;
}

function clearInvalid(el){
  el.removeAttribute('aria-invalid');
  el.title = '';
}

function validate(form){
  let ok = true;
  const callsign = form.elements.callsign;
  const age = form.elements.age;
  const timezone = form.elements.timezone;
  const discord = form.elements.discord;

  [callsign, age, timezone, discord].forEach(clearInvalid);

  if(!callsign.value || callsign.value.trim().length < 3){ ok=false; setInvalid(callsign,'Callsign must be 3+ characters.'); }
  const ageNum = Number(age.value);
  if(!age.value || Number.isNaN(ageNum) || ageNum < 16){ ok=false; setInvalid(age,'Age must be 16+ (numbers only).'); }
  if(!timezone.value || timezone.value.trim().length < 3){ ok=false; setInvalid(timezone,'Timezone required.'); }
  if(!discord.value || discord.value.trim().length < 3){ ok=false; setInvalid(discord,'Discord user required.'); }

  return ok;
}

function buildMessage(form, unitName){
  const data = Object.fromEntries(new FormData(form).entries());
  return [
    `Recruitment Application — ${unitName}`,
    ``,
    `Callsign: ${data.callsign || ''}`,
    `Age: ${data.age || ''}`,
    `Timezone: ${data.timezone || ''}`,
    `Discord: ${data.discord || ''}`,
    `Preferred roles: ${data.roles || '(none)'} `,
    ``,
    `Experience:`,
    `${data.experience || '(none)'}`,
    ``,
    `Availability:`,
    `${data.availability || '(none)'}`,
  ].join('\n');
}

async function init(){
  let unitName = 'UKSOCOM Lionheart Company';
  try{
    const info = await fetchJSON(DATA.unitInfo);
    unitName = info.name;
  }catch{}

  const form = document.getElementById('join-form');
  const clearBtn = document.getElementById('join-clear');
  const out = document.getElementById('join-output');
  const msg = document.getElementById('join-message');
  const status = document.getElementById('join-status');
  const copyBtn = document.getElementById('join-copy');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    status.textContent = '';
    if(!validate(form)){
      status.textContent = 'Fix the highlighted fields, then try again.';
      return;
    }
    msg.value = buildMessage(form, unitName);
    out.hidden = false;
    out.scrollIntoView({behavior:'smooth', block:'start'});
    status.textContent = 'Generated — copy and send to a recruiter.';
  });

  clearBtn.addEventListener('click', ()=>{
    form.reset();
    out.hidden = true;
    status.textContent = '';
  });

  copyBtn.addEventListener('click', async ()=>{
    try{
      await copyText(msg.value);
      announce('Application copied');
      status.textContent = 'Copied to clipboard.';
    }catch{
      prompt('Copy this message:', msg.value);
    }
  });
}

init();
