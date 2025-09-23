let uiThresholds = Thresholds.getThresholds();

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString();
}

function updateDashboard(reading) {
  document.getElementById("card-temp").innerText = `Temperatura: ${reading.temp} °C`;
  document.getElementById("card-hum").innerText  = `Humedad: ${reading.hum} %`;
  document.getElementById("card-lux").innerText  = `Luz: ${reading.lux} lx`;
  document.getElementById("last-ts").innerText   = formatTime(reading.ts);

  const humCard = document.getElementById("card-hum");
  if (reading.hum < uiThresholds.humMin) humCard.classList.add("alert");
  else humCard.classList.remove("alert");
}

function onReading(reading) {
  updateDashboard(reading);
  History.pushReading(reading);
  renderHistoryTable();   // ← actualiza tabla
  Actuators.applyAuto(reading);
}

function initDashboard() {
  Sensors.subscribeReadings(onReading);
}

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

/* ======= Historial ======= */
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
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function initHistoryView() {
  document.getElementById("btn-export-csv").onclick  = () => downloadText("data.csv",  History.exportCSV());
  document.getElementById("btn-export-json").onclick = () => downloadText("data.json", History.exportJSON());
  document.getElementById("btn-clear-history").onclick = () => { History.clearHistory(); renderHistoryTable(); };
  renderHistoryTable();
}

/* ======= Simulación (esto va ANTES del DOMContentLoaded) ======= */
function rand(n, m) { return +(Math.random() * (m - n) + n).toFixed(1); }
function fakeReading(i=0) {
  return { temp: rand(18, 30), hum: rand(25, 70), lux: rand(200, 900), ts: Date.now()+i*60000 };
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

/* ======= Inicio ======= */
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initActuatorsView();
  initHistoryView();
  initSim(); // ← acá, al final
});
