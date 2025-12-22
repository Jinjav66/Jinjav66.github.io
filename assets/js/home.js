import { fetchJSON, DATA } from './app.js';

function pad(n){ return String(n).padStart(2,'0'); }

function formatDuration(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const d = Math.floor(s/86400);
  const h = Math.floor((s%86400)/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  if(d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
}

async function initCountdown(){
  const timeEl = document.getElementById('countdown-time');
  const labelEl = document.getElementById('countdown-label');
  if(!timeEl || !labelEl) return;

  try{
    const info = await fetchJSON(DATA.unitInfo);
    const target = new Date(info.nextOpIso).getTime();
    labelEl.textContent = `Target: ${new Date(info.nextOpIso).toUTCString()}`;

    const tick = ()=>{
      const now = Date.now();
      const diff = target - now;
      if(diff <= 0){
        timeEl.textContent = 'LIVE / PASSED';
        return;
      }
      timeEl.textContent = formatDuration(diff);
      requestAnimationFrame(()=>{});
    };

    tick();
    setInterval(tick, 1000);
  }catch(e){
    timeEl.textContent = '—';
    labelEl.textContent = 'Set nextOpIso in data/unitInfo.json';
  }
}

initCountdown();
