/* ---------- helpers ---------- */
function link(slider,num){
  slider.addEventListener('input',()=>num.value=slider.value);
  num.addEventListener('input',()=>{const v=+num.value;if(!isNaN(v))slider.value=Math.min(v,slider.max);});
}
const attSlider=document.getElementById('attackerSlider'),
      attNum   =document.getElementById('attackerNumber'),
      defSlider=document.getElementById('defenderSlider'),
      defNum   =document.getElementById('defenderNumber');
link(attSlider,attNum); link(defSlider,defNum);

/* DOM refs */
const simsInput=document.getElementById('simulations'),
      btn      =document.getElementById('calculateBtn'),
      resDiv   =document.getElementById('results'),
      curAttS  =document.getElementById('curAtt'),
      curDefS  =document.getElementById('curDef'),
      winAttS  =document.getElementById('winAtt'),
      winDefS  =document.getElementById('winDef'),
      mpoAttS  =document.getElementById('mpoAtt'),
      mpoDefS  =document.getElementById('mpoDef'),
      riskP    =document.getElementById('riskVal');

/* ---------- chart ---------- */
const ctx=document.getElementById('modChart').getContext('2d');
const modChart=new Chart(ctx,{
  type:'line',
  data:{labels:[],datasets:[
    {data:[],borderColor:'#ff5252',pointRadius:0,tension:.25,borderWidth:2},
    {data:[],borderColor:'#448aff',pointRadius:0,tension:.25,borderWidth:2}
  ]},
  options:{
    plugins:{legend:{display:false}},
    scales:{
      x:{display:false},
      y:{ticks:{color:getCSS('--fg')},grid:{color:'rgba(255,255,255,0.08)'}}
    },
    responsive:true,maintainAspectRatio:false
  }
});
function getCSS(v){return getComputedStyle(document.documentElement).getPropertyValue(v);}
const roll=()=>Math.floor(Math.random()*6)+1;

/* ---------- simulation ---------- */
btn.addEventListener('click',()=>{
  const A0=+attNum.value, D0=+defNum.value, N=+simsInput.value;
  if(A0<1||D0<1||N<1){alert('Values must be positive');return;}

  curAttS.textContent=A0; curDefS.textContent=D0; resDiv.classList.remove('hidden');

  /* containers */
  const attPerRoll=[], defPerRoll=[];
  const outcomes=new Map();        // "a|d" -> count
  const attRemArr=[];              // for risk index σ

  for(let s=0;s<N;s++){
    let a=A0,d=D0,rollIx=0;
    while(a>0&&d>0){
      const ad=Math.min(3,a), dd=Math.min(3,d),   // 3-dice defenders
            ar=[...Array(ad)].map(roll).sort((x,y)=>y-x),
            dr=[...Array(dd)].map(roll).sort((x,y)=>y-x),
            fights=Math.min(ad,dd);

      for(let i=0;i<fights;i++){
        if(attPerRoll.length<=rollIx){attPerRoll.push(new Map());defPerRoll.push(new Map());}
        inc(attPerRoll[rollIx],a); inc(defPerRoll[rollIx],d);

        if(ar[i]>dr[i]) d--; else a--;
        rollIx++; if(a===0||d===0) break;
      }
    }
    inc(outcomes,`${a}|${d}`);
    attRemArr.push(a);
  }

  /* win percentages */
  const attWins=[...outcomes.entries()].reduce((s,[k,c])=>s+(k.split('|')[1]==='0'?c:0),0);
  const attPct=(attWins/N*100).toFixed(2), defPct=(100-attPct).toFixed(2);
  winAttS.textContent=`${attPct}%`; winDefS.textContent=`${defPct}%`;

  /* most-probable outcome */
  let mpoKey='',mpoCnt=0; outcomes.forEach((c,k)=>{if(c>mpoCnt){mpoCnt=c;mpoKey=k;}});
  const [mpA,mpD]=mpoKey.split('|').map(Number);
  mpoAttS.textContent=mpA; mpoDefS.textContent=mpD;

  /* chart – mode per roll */
  const modeA=attPerRoll.map(mode), modeD=defPerRoll.map(mode);
  modChart.data.labels=modeA.map((_,i)=>i+1);
  modChart.data.datasets[0].data=modeA;
  modChart.data.datasets[1].data=modeD;
  modChart.update();

  /* risk index: σ(attacker remaining)/initial attackers */
  const μ=attRemArr.reduce((s,x)=>s+x,0)/N;
  const σ=Math.sqrt(attRemArr.reduce((s,x)=>s+(x-μ)**2,0)/N);
  riskP.textContent=`Risk index: ${(σ/A0).toFixed(2)}`;
});

/* ---------- utils ---------- */
function inc(map,key){map.set(key,(map.get(key)||0)+1);}
function mode(map){let topK=0,topC=0;map.forEach((c,k)=>{if(c>topC){topC=c;topK=k;}});return +topK;}
