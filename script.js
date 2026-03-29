let userCoords=null,routeLine=null,lastDistKm=0,lastDurMin=0;

const map=L.map("map").setView([20.5937,78.9629],5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

navigator.geolocation.getCurrentPosition(pos=>{
 userCoords=[pos.coords.latitude,pos.coords.longitude];
 map.setView(userCoords,14);
});

map.on("click",async e=>{
 if(!userCoords) return alert("Location not ready");
 const {lat,lng}=e.latlng;

 const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${lng},${lat}?overview=full&geometries=geojson`);
 const data=await res.json();
 const route=data.routes[0];

 const coords=route.geometry.coordinates.map(c=>[c[1],c[0]]);
 if(routeLine) map.removeLayer(routeLine);
 routeLine=L.polyline(coords).addTo(map);

 map.fitBounds(routeLine.getBounds());

 lastDistKm=route.distance/1000;
 lastDurMin=Math.round(route.duration/60);

 updateUI();
});

/* FARE */
function estimateFares(d){
 const base=50;
 const surge=Math.random()>0.7?1.5:1;

 return[
  {name:"Uber",icon:"🚗",price:(base+d*13)*surge,eta:3,surge:surge>1},
  {name:"Ola",icon:"🚕",price:(base+d*12),eta:5},
  {name:"Rapido",icon:"🏍",price:(40+d*10),eta:2}
 ];
}

function updateUI(){
 document.getElementById("statDist").innerText=lastDistKm.toFixed(1)+" km";
 document.getElementById("statTime").innerText=lastDurMin+" min";
 renderFares();
}

function renderFares(){
 const fares=estimateFares(lastDistKm);
 const min=Math.min(...fares.map(f=>f.price));

 document.getElementById("fareBox").innerHTML=fares.map(f=>`
  <div class="fare-card ${f.price===min?'cheapest':''}">
    <div>${f.icon} ${f.name}</div>
    <div>
      ₹${f.price.toFixed(0)}
      ${f.price===min?'<span class="badge best">BEST</span>':''}
      ${f.surge?'<span class="badge surge">SURGE</span>':''}
    </div>
  </div>
 `).join("");
}
