/* ============  input ↔ slider sync  ============ */
function link(slider, num) {
  slider.addEventListener('input', () => (num.value = slider.value));
  num.addEventListener('input', () => {
    const v = +num.value;
    if (!isNaN(v)) slider.value = Math.min(v, slider.max);
  });
}
const attSlider = document.getElementById('attackerSlider');
const attNum    = document.getElementById('attackerNumber');
const defSlider = document.getElementById('defenderSlider');
const defNum    = document.getElementById('defenderNumber');
link(attSlider, attNum);
link(defSlider, defNum);

/* ============  DOM refs  ============ */
const simsInput = document.getElementById('simulations');
const btn       = document.getElementById('calculateBtn');
const resDiv    = document.getElementById('results');
const curAttS   = document.getElementById('curAtt');
const curDefS   = document.getElementById('curDef');
const winAttS   = document.getElementById('winAtt');
const winDefS   = document.getElementById('winDef');
const mpoAttS   = document.getElementById('mpoAtt');
const mpoDefS   = document.getElementById('mpoDef');
const riskP     = document.getElementById('riskVal');

/* ============  Chart.js setup  ============ */
const ctx = document.getElementById('modChart').getContext('2d');
const modChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { data: [], borderColor: '#ff5252', pointRadius: 0, tension: 0.25, borderWidth: 2 },
      { data: [], borderColor: '#448aff', pointRadius: 0, tension: 0.25, borderWidth: 2 }
    ]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: true,
        ticks: { color: getCSS('--fg') },
        grid : { color: 'rgba(255,255,255,0.08)' }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  }
});
function getCSS(v) { return getComputedStyle(document.documentElement).getPropertyValue(v); }
const rollDie = () => Math.floor(Math.random() * 6) + 1;

/* ============  Monte-Carlo simulation  ============ */
btn.addEventListener('click', () => {
  const A0 = +attNum.value, D0 = +defNum.value, N = +simsInput.value;
  if (A0 < 2 || D0 < 1 || N < 1) {
    alert('Attacker needs ≥2, Defender ≥1, simulations positive.');
    return;
  }

  curAttS.textContent = A0;
  curDefS.textContent = D0;
  resDiv.classList.remove('hidden');

  const attPerRoll = [], defPerRoll = [];
  const outcomes   = new Map();
  const attRemArr  = [];

  for (let s = 0; s < N; s++) {
    let a = A0, d = D0, rollIx = 0;
    while (a > 1 && d > 0) {
      const ad = Math.min(3, a - 1);  // attacker leaves 1 behind
      const dd = Math.min(3, d);      // defender up to 3 dice
      const ar = Array.from({ length: ad }, rollDie).sort((x, y) => y - x);
      const dr = Array.from({ length: dd }, rollDie).sort((x, y) => y - x);
      const fights = Math.min(ad, dd);

      for (let i = 0; i < fights; i++) {
        if (attPerRoll.length <= rollIx) {
          attPerRoll.push(new Map());
          defPerRoll.push(new Map());
        }
        inc(attPerRoll[rollIx], a);
        inc(defPerRoll[rollIx], d);

        if (ar[i] > dr[i]) d--;
        else              a--;
        rollIx++;
        if (a <= 1 || d === 0) break;
      }
    }
    inc(outcomes, `${a}|${d}`);
    attRemArr.push(a);
  }

  /* Win percentages */
  const attWins = [...outcomes.entries()]
    .reduce((sum, [k,c]) => sum + (k.split('|')[1]==='0' ? c : 0), 0);
  const attPct  = (attWins/N*100).toFixed(2);
  const defPct  = (100-attPct).toFixed(2);
  winAttS.textContent = `${attPct}%`;
  winDefS.textContent = `${defPct}%`;

  /* Most probable outcome */
  let bestKey='', bestCnt=0;
  outcomes.forEach((c,k)=>{ if(c>bestCnt){ bestCnt=c; bestKey=k; } });
  const [mpA, mpD] = bestKey.split('|').map(Number);
  mpoAttS.textContent = mpA;
  mpoDefS.textContent = mpD;

  /* Mode per roll & trim at battle end */
  const modeA = attPerRoll.map(modeOfMap);
  const modeD = defPerRoll.map(modeOfMap);
  let trimLen = modeA.length;
  for (let i=0; i<modeA.length; i++) {
    if (modeA[i] <= 1 || modeD[i] === 0) { trimLen = i+1; break; }
  }
  modChart.data.labels              = Array.from({length:trimLen},(_,i)=>i+1);
  modChart.data.datasets[0].data    = modeA.slice(0, trimLen);
  modChart.data.datasets[1].data    = modeD.slice(0, trimLen);
  modChart.update();

  /* Risk = 20 × σ(attRem) / initial attackers */
  const μ = attRemArr.reduce((s,x)=>s+x,0)/N;
  const σ = Math.sqrt(attRemArr.reduce((s,x)=>s+(x-μ)**2,0)/N);
  riskP.textContent = `Risk: ${(20*σ/A0).toFixed(2)}`;
});

/* ============  helpers  ============ */
function inc(map, key) { map.set(key, (map.get(key)||0) + 1); }
function modeOfMap(map) {
  let tk=0, tc=0;
  map.forEach((c,k) => { if (c>tc) { tc=c; tk=k; } });
  return +tk;
}
"""

// Paste the above into your project's script.js, replacing its contents.
