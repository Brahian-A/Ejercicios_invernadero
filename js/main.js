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

/* Llamadas de inicio */
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initActuatorsView();
});
