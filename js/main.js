// Simulación de thresholds
const Thresholds = {
    getThresholds: () => ({ humMin: 40 }) // humedad mínima = 40
  };
  
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
  
  // función pública para probar manualmente en consola
  function onReading(reading) {
    updateDashboard(reading);
  }
  
  // Ejemplo automático: una lectura cada 3 segundos
  setInterval(() => {
    onReading({
      temp: (20 + Math.random() * 10).toFixed(1),
      hum: (30 + Math.random() * 30).toFixed(0),
      lux: (100 + Math.random() * 900).toFixed(0),
      ts: Date.now()
    });
  }, 3000);
