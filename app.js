const display = document.getElementById("display");
const menu = document.getElementById("menu");
const akalcInput = document.getElementById("akalcInput");
const resetBtn = document.getElementById("resetAkalc");
const saveBtn = document.getElementById("saveAkalc");
const clearBtn = document.querySelector('[data-k="ac"]');

let mode = "normal"; // normal | secretDate | akalc (force)

let current = "0";
let operator = null;
let previous = null;
let waiting = false;

// ===== SECRET DATE =====
let X = null, Y = "", fullY = "", Z = 0, waitingForY = false;

// ===== FORCE MODE =====
let akalcNumber = localStorage.getItem("akalc") || "";
let akalcIndex = 0;
let akalcLocked = false;

// ================= DISPLAY =================
function update() {
  let raw = current.replace(',', '.'); // на всякий случай
  let parts = raw.split(".");
  // Разделяем целую часть пробелами по тысячам
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  display.textContent = parts.join(","); // дробная часть через запятую
}

// ================= CLEAR BUTTON =================
function updateClearButton() {
  clearBtn.textContent = mode === "secretDate" ? "AC" : "C";
}

// ================= NORMAL CALC =================
function calc(a, b, op) {
  if (op === "+") return a + b;
  if (op === "−") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return b === 0 ? 0 : a / b;
}

// ================= SECRET DATE =================
function getZ() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, "0");
  return Number(pad(d.getDate()) + pad(d.getMonth() + 1) + pad(d.getHours()) + pad(d.getMinutes()));
}

// ================= BUTTON HANDLER =================
document.addEventListener("pointerup", e => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  const k = btn.dataset.k;

  // ===== FORCE MODE =====
  if (mode === "akalc") {
    if (akalcLocked) return;

    if (akalcIndex < akalcNumber.length) {
      current = (current === "0" ? "" : current) + akalcNumber[akalcIndex++];
      update();
    }

    if (akalcIndex >= akalcNumber.length) akalcLocked = true;
    return;
  }

  // ===== SECRET DATE MODE =====
  if (mode === "secretDate") {
    if (waitingForY) {
      if (Y.length < fullY.length) {
        Y += fullY[Y.length];
        current = Y;
        update();
      }
      if (Y.length >= fullY.length) {
        waitingForY = false;
        current = Y; // фиксируем Y
      }
      return;
    }

    if (Y.length >= fullY.length && operator === "+") {
      if (k === "=") {
        current = String(Z);
        operator = null;
        update();
      }
      return;
    }
  }

  // ===== COMMON BUTTONS =====
  if (k === "clear") {
    if (mode === "secretDate") mode = "normal";
    current = "0"; previous = null; operator = null;
    X = null; Y = ""; fullY = ""; waitingForY = false;
    updateClearButton();
    update();
    return;
  }

  if (k === "%") {
    if (mode === "normal") {
      mode = "secretDate";
      current = "0";
      updateClearButton();
      update();
    }
    return;
  }

  if (!isNaN(k)) {
    if (waiting) { current = k; waiting = false; }
    else current = current === "0" ? k : current + k;
    update();
    return;
  }

  if (k === "=") {
    if (mode === "secretDate") {
      if (operator === "×") {
        X = calc(X, parseFloat(current), "×");
        current = String(X);
        operator = null;
      } else if (operator === "+" && !waitingForY) {
        current = String(Z);
        operator = null;
      }
      update();
      return;
    }

    if (operator) {
      current = String(calc(previous, parseFloat(current), operator));
      operator = null; previous = null;
      update();
    }
    return;
  }

  if (["+", "−", "×", "÷"].includes(k)) {
    if (mode === "secretDate") {
      const val = parseFloat(current);
      if (k === "×") {
        X = X === null ? val : calc(X, val, "×");
        operator = "×";
        waiting = true;
      }
      if (k === "+") {
        waitingForY = true;
        Y = ""; current = "0";
        Z = getZ();
        fullY = String(Z - X);
        operator = "+";
      }
      return;
    }

    previous = parseFloat(current);
    operator = k;
    waiting = true;
  }

  update();
});

// ================= TRIPLE SWIPE =================
let startY = null, active = false;
document.addEventListener("touchstart", e => {
  if (e.touches.length === 3) {
    active = true;
    startY = [...e.touches].reduce((a, t) => a + t.clientY, 0) / 3;
  }
}, { passive: true });

document.addEventListener("touchmove", e => {
  if (!active || e.touches.length !== 3) return;
  const y = [...e.touches].reduce((a, t) => a + t.clientY, 0) / 3;
  if (y - startY > 100 && mode === "normal") {
    menu.style.display = "flex";
    active = false;
  }
}, { passive: true });

document.addEventListener("touchend", () => active = false);

// ================= FORCE SECRET MENU =================
saveBtn.onclick = () => {
  akalcNumber = akalcInput.value.replace(/\D/g, "");
  localStorage.setItem("akalc", akalcNumber);

  akalcIndex = 0;
  akalcLocked = false;
  current = "0";
  mode = "akalc";
  menu.style.display = "none";
  update();
};

resetBtn.onclick = () => {
  mode = "normal";
  akalcIndex = 0;
  akalcLocked = false;
  current = "0";
  menu.style.display = "none";
  update();
  updateClearButton();
};

// ================= BUTTON ANIMATION =================
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("touchstart", e => e.preventDefault());

  btn.addEventListener("pointerup", () => {
    btn.classList.add("bounce");
    btn.addEventListener("animationend", () => {
      btn.classList.remove("bounce");
    }, { once: true });
  });
});

// ================= NO ZOOM / NO SCROLL =================
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
let last = 0;
document.addEventListener("touchend", e => {
  const now = Date.now();
  if (now - last < 300) e.preventDefault();
  last = now;
}, { passive: false });
document.addEventListener("selectstart", e => e.preventDefault());

// ================= START =================
update();
updateClearButton();
