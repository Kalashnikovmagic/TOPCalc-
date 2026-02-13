const display=document.getElementById("display");
const menu=document.getElementById("menu");
const akalcInput=document.getElementById("akalcInput");
const clearBtn=document.querySelector('[data-k="clear"]');
const keys=document.getElementById("keys");

let mode="normal"; // normal | Data | Force
let current="0";
let previous=null;
let operator=null;
let waiting=false;

// Data mode
let X=null,Y="",fullY="",Z=0,waitingForY=false;

// Force mode
let forceNumber=localStorage.getItem("force")||"";
let forceIndex=0;
let forceLocked=false;

// ===== Display =====
function update(){ display.textContent=current.replace('.',','); }
function updateClearButton(){ clearBtn.textContent=(mode==="Data")?"AC":"C"; }

// ===== Calculation =====
function calc(a,b,op){ if(op==="+")return a+b;if(op==="−")return a-b;if(op==="×")return a*b;if(op==="÷")return b===0?0:a/b; }

// ===== Data helper =====
function getZ(){ const d=new Date(); const p=n=>n.toString().padStart(2,"0"); return Number(p(d.getDate())+p(d.getMonth()+1)+p(d.getHours())+p(d.getMinutes())); }

// ===== Pointer handler =====
document.addEventListener("pointerup",e=>{
  const btn=e.target.closest(".btn");
  if(!btn) return;
  const k=btn.dataset.k;

  // FORCE MODE
  if(mode==="Force"){
    if(forceLocked) return;
    if(forceIndex<forceNumber.length){ current=(current==="0"?"":current)+forceNumber[forceIndex++]; update(); }
    if(forceIndex>=forceNumber.length) forceLocked=true;
    return;
  }

  // DATA MODE
  if(mode==="Data"){
    if(waitingForY){
      if(Y.length<fullY.length){ Y+=fullY[Y.length]; current=Y; update(); }
      if(Y.length>=fullY.length){ waitingForY=false; current=Y; }
      e.stopPropagation(); e.preventDefault(); return;
    }
    if(Y.length===fullY.length){
      if(["0","1","2","3","4","5","6","7","8","9","+/-","C","AC","←"].includes(btn.textContent)){ e.preventDefault(); return; }
    }
  }

  // COMMON HANDLING
  if(k==="clear"){ mode="normal"; current="0"; previous=null; operator=null; X=null; Y=""; fullY=""; waitingForY=false; forceIndex=0; forceLocked=false; menu.style.display="none"; update(); updateClearButton(); return; }
  if(k==="%"){ if(mode==="normal"){ mode="Data"; current="0"; X=null; fullY=""; Y=""; waitingForY=false; Z=0; update(); updateClearButton(); } return; }

  if(!isNaN(k)){ if(waiting){ current=k; waiting=false; } else current=current==="0"?k:current+k; update(); return; }

  if(k==="="){
    if(mode==="Data"){
      if(operator==="×"){ X=calc(X,parseFloat(current),"×"); current=String(X); operator=null; update(); return; }
      else if(operator==="+" && !waitingForY){ current=String(Z); operator=null; update(); return; }
    }
    if(operator){ current=String(calc(previous,parseFloat(current),operator)); operator=null; previous=null; update(); return; }
  }

  if(["+","−","×","÷"].includes(k)){
    if(mode==="Data"){
      const val=parseFloat(current);
      if(k==="×"){ X=X===null?val:calc(X,val,"×"); operator="×"; waiting=true; return; }
      if(k==="+"){ waitingForY=true; Y=""; current="0"; Z=getZ(); fullY=String(Z-X); operator="+"; return; }
    }
    previous=parseFloat(current); operator=k; waiting=true;
  }

  update();
});

// ===== TRIPLE SWIPE FOR FORCE MENU =====
let startY=null,active=false;
document.addEventListener("touchstart", e => { if(e.touches.length===3){ active=true; startY=[...e.touches].reduce((a,t)=>a+t.clientY,0)/3; } }, {passive:true});
document.addEventListener("touchmove", e => { 
  if(!active||e.touches.length!==3) return; 
  const y=[...e.touches].reduce((a,t)=>a+t.clientY,0)/3; 
  if(y-startY>100){ if(mode==="normal") menu.style.display="flex"; active=false; } 
}, {passive:true});
document.addEventListener("touchend",()=>active=false);

// ===== FORCE MENU HANDLERS =====
document.getElementById("saveForce").onclick=()=>{
  forceNumber=akalcInput.value.replace(/\D/g,"");
  localStorage.setItem("force",forceNumber);
  forceIndex=0; forceLocked=false; current="0"; mode="Force"; menu.style.display="none"; update();
};
document.getElementById("resetForce").onclick=()=>{
  mode="normal"; forceIndex=0; forceLocked=false; current="0"; menu.style.display="none"; update(); updateClearButton();
};

// ===== BUTTON ANIMATION =====
document.querySelectorAll(".btn, .menuBtn").forEach(btn=>{
  btn.addEventListener("touchstart", e=>e.preventDefault());
  btn.addEventListener("pointerup", ()=>{
    btn.classList.add("bounce");
    btn.addEventListener("animationend", ()=>{ btn.classList.remove("bounce"); },{once:true});
  });
});

// ===== NO ZOOM / NO SCROLL =====
document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("touchmove",e=>e.preventDefault(),{passive:false});
let last=0;
document.addEventListener("touchend",e=>{ const now=Date.now(); if(now-last<300)e.preventDefault(); last=now; },{passive:false});
document.addEventListener("selectstart",e=>e.preventDefault());

// ===== START =====
mode = "normal";
current = "0";
previous = null;
operator = null;
waiting = false;
X = null; Y = ""; fullY = ""; Z = 0; waitingForY = false;
forceIndex = 0; forceLocked = false;
menu.style.display="none";
update();
updateClearButton();
