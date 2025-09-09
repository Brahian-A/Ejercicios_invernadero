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
