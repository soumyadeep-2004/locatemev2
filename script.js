let userCoords = null;
let destCoords = null;
let routeLine = null;
let lastDistKm = 0;
let lastDurMin = 0;

const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

/* LOCATION */
navigator.geolocation.getCurrentPosition((pos) => {
  userCoords = [pos.coords.latitude, pos.coords.longitude];
  map.setView(userCoords, 14);
});

/* CLICK TO ROUTE */
map.on("click", async (e) => {
  if (!userCoords) return alert("Location not ready");

  const { lat, lng } = e.latlng;
  destCoords = [lat, lng];

  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${lng},${lat}?overview=full&geometries=geojson`
  );

  const data = await res.json();
  const route = data.routes[0];

  const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(coords, { color: "#4f8eff", weight: 5 }).addTo(map);

  map.fitBounds(routeLine.getBounds());

  lastDistKm = route.distance / 1000;
  lastDurMin = Math.round(route.duration / 60);

  updateUI();
});

/* FARE LOGIC */
function estimateFares(d) {
  const base = 50;
  const surge = Math.random() > 0.7 ? 1.5 : 1;

  return [
    {
      name: "Uber",
      icon: "🚗",
      price: (base + d * 13) * surge,
      eta: Math.floor(3 + Math.random() * 5),
      surge: surge > 1
    },
    {
      name: "Ola",
      icon: "🚕",
      price: (base + d * 12),
      eta: Math.floor(4 + Math.random() * 6),
      surge: false
    },
    {
      name: "Rapido",
      icon: "🏍",
      price: (40 + d * 10),
      eta: Math.floor(2 + Math.random() * 4),
      surge: false
    }
  ];
}

/* UI UPDATE */
function updateUI() {
  document.getElementById("statDist").innerText =
    lastDistKm.toFixed(1) + " km";

  document.getElementById("statTime").innerText =
    lastDurMin + " min";

  renderFares();
}

function renderFares() {
  const fares = estimateFares(lastDistKm);
  const min = Math.min(...fares.map(f => f.price));

  document.getElementById("fareBox").innerHTML = fares.map(f => `
    <div class="fare-card ${f.price === min ? 'cheapest' : ''}">
      <div class="fare-left">
        <div>${f.icon}</div>
        <div>
          <div>${f.name}</div>
          <small>${f.eta} min away</small>
        </div>
      </div>

      <div>
        ₹${f.price.toFixed(0)}
        ${f.price === min ? '<span class="badge best">BEST</span>' : ''}
        ${f.surge ? '<span class="badge surge">SURGE</span>' : ''}
      </div>
    </div>
  `).join("");
}
