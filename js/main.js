let uiThresholds = Thresholds.getThresholds();

/* ===== Util ===== */
function formatTime(ms) { return new Date(ms).toLocaleTimeString(); }

/* ===== Dashboard ===== */
function updateCardsFromReading(reading) {
  const t = (reading.temp != null) ? Number(reading.temp).toFixed(0) : "--";
  const h = (reading.hum  != null) ? Number(reading.hum).toFixed(0)  : "--";
  document.getElementById("card-temp-value").innerText = `${t}°C`;
  document.getElementById("card-hum-value").innerText  = `${h}%`;

  const hs = (reading.humSoil != null) ? Number(reading.humSoil).toFixed(0) : "—";
  const elSoil = document.getElementById("card-humsoil-value");
  if (elSoil) elSoil.innerText = `${hs}%`;
}
function updateDashboard(reading) {
  document.getElementById("last-ts").innerText = formatTime(reading.ts);
  const humCard = document.getElementById("card-hum-card");
  if (humCard) {
    if (reading.hum < uiThresholds.humMin) humCard.classList.add("alert");
    else humCard.classList.remove("alert");
  }
}

/* ===== Mini chart 24h ===== */
function drawLineChart(canvasId, values, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  if (!values || !values.length) return;

  const pad = 20, x0 = pad, y0 = h - pad, x1 = w - pad, y1 = pad;
  const plotW = x1 - x0, plotH = y0 - y1;
  const minV = Math.min(...values), maxV = Math.max(...values);
  const span = (maxV === minV) ? 1 : (maxV - minV);

  ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1; ctx.beginPath();
  for (let i=0;i<=4;i++){ const y = y1 + (plotH * i/4); ctx.moveTo(x0,y); ctx.lineTo(x1,y); }
  ctx.stroke();

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = x0 + (plotW * (i / (values.length - 1 || 1)));
    const y = y1 + plotH * (1 - ((v - minV) / span));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.lineWidth = 2; ctx.strokeStyle = options.color || "#2f6b31"; ctx.stroke();

  ctx.fillStyle = ctx.strokeStyle;
  values.forEach((v, i) => {
    const x = x0 + (plotW * (i / (values.length - 1 || 1)));
    const y = y1 + plotH * (1 - ((v - minV) / span));
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
  });
}
function getLastHoursSeries(field, hours = 24) {
  const items = History.getLast(500);
  const now = Date.now(), from = now - hours*3600*1000;
  const filtered = items.filter(r => r.ts >= from).sort((a,b)=>a.ts-b.ts);
  return filtered.map(r => Number(r[field])).filter(v => !isNaN(v));
}
function renderDashboardChart24h() {
  const series = getLastHoursSeries("temp", 24);
  if (series.length) drawLineChart("chart-24h", series, { color: "#2f6b31" });
}

/* ===== Sensores ===== */
function onReading(reading) {
  updateCardsFromReading(reading);
  updateDashboard(reading);
  History.pushReading(reading);
  renderHistoryTable();
  Actuators.applyAuto(reading);
  renderDashboardChart24h();
}
function initDashboard() { Sensors.subscribeReadings(onReading); }

/* ===== Actuadores ===== */
function renderActuators(state) {
  const map = [
    ["bomba","act-bomba","lbl-bomba-estado"],
    ["ventilador","act-ventilador","lbl-ventilador-estado"],
    ["luces","act-luces","lbl-luces-estado"],
  ];
  map.forEach(([name, cardId, lblId]) => {
    const st = state[name] || { on: false };
    document.getElementById(lblId).innerText = st.on ? "ON" : "OFF";
    const card = document.getElementById(cardId);
    card.className = st.on ? "is-on" : "is-off";
  });
}
function bindActuatorEvents() {
  document.getElementById("btn-bomba-manual").onclick = () => {
    const cur = Actuators.getActuators().bomba.on;
    Actuators.setActuator("bomba", { on: !cur });
  };
  document.getElementById("chk-bomba-auto").onchange = (e) => {
    Actuators.setActuator("bomba", { mode: e.target.checked ? "auto" : "manual" });
  };
  document.getElementById("btn-ventilador-manual").onclick = () => {
    const cur = Actuators.getActuators().ventilador.on;
    Actuators.setActuator("ventilador", { on: !cur });
  };
  document.getElementById("chk-ventilador-auto").onchange = (e) => {
    Actuators.setActuator("ventilador", { mode: e.target.checked ? "auto" : "manual" });
  };
  document.getElementById("btn-luces-manual").onclick = () => {
    const cur = Actuators.getActuators().luces.on;
    Actuators.setActuator("luces", { on: !cur });
  };
  document.getElementById("chk-luces-auto").onchange = (e) => {
    Actuators.setActuator("luces", { mode: e.target.checked ? "auto" : "manual" });
  };
}
function initActuatorsView() {
  renderActuators(Actuators.getActuators());
  Actuators.subscribeActuators(renderActuators);
  bindActuatorEvents();
}

/* ===== Historial ===== */
function renderHistoryTable() {
  const rows = History.getLast(10);
  const table = document.getElementById("hist-table");
  table.innerHTML =
    `<tr><th>Hora</th><th>Temp (°C)</th><th>Hum (%)</th><th>Luz (lx)</th></tr>` +
    rows.map(r =>
      `<tr><td>${new Date(r.ts).toLocaleTimeString()}</td><td>${r.temp}</td><td>${r.hum}</td><td>${r.lux}</td></tr>`
    ).join("");
}
function downloadText(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
function initHistoryView() {
  document.getElementById("btn-export-csv").onclick  = () => downloadText("data.csv",  History.exportCSV());
  document.getElementById("btn-export-json").onclick = () => downloadText("data.json", History.exportJSON());
  document.getElementById("btn-clear-history").onclick = () => { History.clearHistory(); renderHistoryTable(); };
  renderHistoryTable();
}

/* ===== Config ===== */
function fillThresholdForm() {
  const th = Thresholds.getThresholds();
  document.getElementById("in-tempMax").value = th.tempMax;
  document.getElementById("in-humMin").value  = th.humMin;
  document.getElementById("in-luxMin").value  = th.luxMin;
}
function refreshUIAfterThresholdChange() {
  uiThresholds = Thresholds.getThresholds();
  const last = History.getLast ? History.getLast(1)[0] : null;
  if (last) updateDashboard(last);
}
function initConfigView() {
  const msg = document.getElementById("msg-config");
  fillThresholdForm();
  document.getElementById("btn-save-thresholds").onclick = () => {
    try {
      Thresholds.setThresholds({
        tempMax: Number(document.getElementById("in-tempMax").value),
        humMin:  Number(document.getElementById("in-humMin").value),
        luxMin:  Number(document.getElementById("in-luxMin").value),
      });
      msg.innerText = "Guardado ✔"; refreshUIAfterThresholdChange();
    } catch (e) { msg.innerText = e.message || "Error al guardar"; }
  };
  document.getElementById("btn-reset-thresholds").onclick = () => {
    Thresholds.resetThresholds(); fillThresholdForm(); msg.innerText = "Valores por defecto";
    refreshUIAfterThresholdChange();
  };
}

/* ===== Simulación ===== */
function rand(n, m) { return +(Math.random() * (m - n) + n).toFixed(1); }
function fakeReading(i=0) {
  return { temp: rand(18, 30), hum: rand(25, 70), lux: rand(200, 900), /*humSoil: rand(20,60),*/ ts: Date.now()+i*60000 };
}
let simTimer = null;
function initSim() {
  document.getElementById("btn-sim-1").onclick = () => onReading(fakeReading());
  document.getElementById("btn-sim-10").onclick = () => { for (let i=0;i<10;i++) onReading(fakeReading(i)); };
  document.getElementById("chk-sim-auto").onchange = (e) => {
    if (e.target.checked) simTimer = setInterval(() => onReading(fakeReading()), 3000);
    else { clearInterval(simTimer); simTimer = null; }
  };
}

/* ===== Menú hamburguesa ===== */
function initMenu() {
  const btn = document.getElementById('btn-menu');
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('menu-backdrop');
  if (!btn || !drawer || !backdrop) return;

  const open = () => { drawer.classList.add('open'); backdrop.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  const toggle = () => drawer.classList.contains('open') ? close() : open();

  btn.addEventListener('click', toggle);
  backdrop.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('hashchange', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ===== Topbar dinámica (título y back/menu) ===== */
function updateTopbarForView(name) {
  const back = document.getElementById('btn-back');
  const menu = document.getElementById('btn-menu');
  const title = document.getElementById('topbar-title');
  const titles = { dashboard:'Invernadero', actuators:'Actuadores', history:'Historial', config:'Config', sim:'Simulación' };
  title.textContent = titles[name] || 'Invernadero';

  if (name === 'dashboard') {
    back.classList.add('hidden');
    menu.classList.remove('hidden');
  } else {
    back.classList.remove('hidden');
    menu.classList.add('hidden');
  }
}
function initBackButton() {
  const back = document.getElementById('btn-back');
  if (!back) return;
  back.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#dashboard';
  });
}

/* ===== Router ===== */
function setActiveTab(name) {
  const ids = { dashboard:"tab-dashboard", actuators:"tab-actuators", history:"tab-history", config:"tab-config" };
  Object.values(ids).forEach(id => document.getElementById(id)?.classList.remove("active"));
  document.getElementById(ids[name])?.classList.add("active");
}
function showView(name) {
  ["dashboard","actuators","history","config","sim"].forEach(v => {
    const el = document.getElementById(`view-${v}`); if (el) el.classList.toggle("hidden", v !== name);
  });
  if (name === "history") renderHistoryTable();
  setActiveTab(name);
  updateTopbarForView(name);
}
function initRouter() {
  const go = () => {
    if (!location.hash) { location.replace('#dashboard'); return; }
    const name = location.hash.slice(1);
    showView(name);
  };
  window.addEventListener("hashchange", go);
  go();
}

/* ===== Altura móvil (vh real) ===== */
function setVhUnit() { const vh = window.innerHeight * 0.01; document.documentElement.style.setProperty('--vh', `${vh}px`); }
window.addEventListener('resize', setVhUnit); setVhUnit();

/* ===== Arranque ===== */
function initApp() {
  initDashboard();
  initActuatorsView();
  initHistoryView();
  initConfigView();
  initSim();
  initRouter();
  initMenu();
  initBackButton();
}
document.addEventListener("DOMContentLoaded", initApp);
