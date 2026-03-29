/* ================= STATE ================= */
let userCoords = null;
let destCoords = null;
let routeLine = null;
let lastDistKm = 0;
let lastDurMin = 0;

/* ================= MAP ================= */
const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

/* ================= GEOLOCATION ================= */
navigator.geolocation.getCurrentPosition((pos) => {
  userCoords = [pos.coords.latitude, pos.coords.longitude];
  map.setView(userCoords, 14);
});

/* ================= CLICK TO SET DEST ================= */
map.on("click", async (e) => {
  const { lat, lng } = e.latlng;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();

  placeDestination(lat, lng, data.display_name);
});

/* ================= DESTINATION ================= */
function placeDestination(lat, lon, name) {
  destCoords = [lat, lon];

  document.getElementById("panelName").textContent = name;

  if (userCoords) fetchRoute(lat, lon);
}

/* ================= ROUTING ================= */
async function fetchRoute(lat, lon) {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${lon},${lat}?overview=full&geometries=geojson`
  );

  const data = await res.json();
  const route = data.routes[0];

  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(coords).addTo(map);
  map.fitBounds(routeLine.getBounds());

  lastDistKm = route.distance / 1000;
  lastDurMin = Math.round(route.duration / 60);

  updateStats();
}

/* ================= 💰 FARE SYSTEM ================= */
function estimateFares(distanceKm) {
  const base = 50;

  return {
    uber: base + distanceKm * 13,
    ola: base + distanceKm * 12,
    rapido: base + distanceKm * 10
  };
}

/* ================= UPDATE PANEL ================= */
function updateStats() {
  document.getElementById("statDist").innerHTML =
    `${lastDistKm.toFixed(1)} km`;

  document.getElementById("statTime").innerHTML =
    `${lastDurMin} min`;

  const fares = estimateFares(lastDistKm);

  document.getElementById("fareBox").innerHTML = `
    <div>🚗 Uber: ₹${fares.uber.toFixed(0)}</div>
    <div>🚕 Ola: ₹${fares.ola.toFixed(0)}</div>
    <div>🏍 Rapido: ₹${fares.rapido.toFixed(0)}</div>
  `;
}

/* ================= REDIRECT ================= */
function openUber() {
  if (!destCoords) return;

  window.open(
    `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${destCoords[0]}&dropoff[longitude]=${destCoords[1]}`
  );
}

function openOla() {
  window.open("https://book.olacabs.com/");
}
