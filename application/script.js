// Initialize the map at Näset
var mymap = L.map('mapid').setView([57.634164, 11.897773], 12);

// Add map tiles from Mapbox using OpenStreetMap as provider
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
     maxZoom: 18,
     id: 'mapbox.streets',
     accessToken: 'pk.eyJ1IjoibXlzZmFrdG9yIiwiYSI6ImNrMzhnaHVmMTA1ZnYzYnBiMmVyeXhyZzQifQ.cC-BUqfAiGFV5iJ2Ixsu6g'
}).addTo(mymap);

// Global variables
var stationMarkers = [];
var passengers = [];
var travelLine;
const toggle = document.getElementById("knappe");
var userShuttle;
var stations = [[57.62788,11.900354],[57.63528,11.93161],[57.64239,11.88032],[57.63666,11.94420],[57.65464,11.87097],[57.65985,11.92029],[57.65080,11.89757]];
var simulateInterval;  // used to clear user simulation


var stationBild = L.icon({
     iconUrl: 'icons/my-icon.png',
     iconSize: [40, 36],
     popupAnchor: [-3, -76],
});
var hus = L.icon({
    iconUrl: 'icons/house.png',
    iconSize: [30, 26],
    popupAnchor: [0, -15],
});
var passagerare = L.icon({
     iconUrl: 'icons/passagerare.png',
     iconSize: [30, 30],
     popupAnchor: [0, -15],
});

var shuttles = [];
stations.forEach(stationCoord => {
     // Create a new shuttle
     var shotl = new Shuttle(stationCoord);

     shuttles.push(shotl);
     // Add all staion markers to map
     stationMarkers.push(L.marker(L.latLng(stationCoord), { icon: stationBild }).addTo(mymap));

     shotl.addToMap(mymap);
});



function onMapClick(e) {
     if(GlobalDest != null) {
          mymap.removeLayer(GlobalDest);
     }
     GlobalDest = L.marker(e.latlng);
     GlobalDest.addTo(mymap);
     var osrmCoords = [e.latlng.lat, e.latlng.lng];
     isAdmin = toggle.checked;
     // chilla med animering
     input.value = osrmCoords;


}

function animateAgain(targetStation,targetShuttle, station){ //Kör ut igen om man har kö på stationen och grejer

     if (mymap.hasLayer(targetShuttle.travelLine)) { //To only remove if previously painted
          mymap.removeLayer(targetShuttle.travelLine);
     }

     var baseStationLastShuttleFirst = targetShuttle.stops.slice();
     baseStationLastShuttleFirst.push(targetStation);

     let shuttleMarker = targetShuttle.getCoords();
     baseStationLastShuttleFirst.unshift([shuttleMarker.lat, shuttleMarker.lng]);

     var routeResult = route(baseStationLastShuttleFirst);
     if (routeResult !== null) { //Will crash if null is passed as argument

          travelLine = L.polyline(routeResult["poly"]).addTo(mymap);
          targetShuttle.travelLine = travelLine;
          targetShuttle.legs = routeResult["legs"];
          targetShuttle.legDuration = routeResult["legDuration"];

          skyttelAnimation(targetShuttle);
     }
}



function placeAndAnimate(onWayHome, coords, station) {
     //TODO
     // toStation & station param. functionality

     // Chooses the closest station at the moment
     var targetStation = closestStation(stations,coords);

     var targetShuttle = null;
     // Chooses the closest shuttle at the moment (that is assigned to the specific station)
     for (var i = 0; i < shuttles.length; i++) {
          var shuttle = shuttles[i];
          if (shuttle.baseStation == targetStation) {
               //todo: choose closes of the possible shuttles
               targetShuttle = shuttle;
          }
     }
     targetShuttle.activeShuttle = true;

     if(onWayHome && !mymap.hasLayer(targetShuttle.statMarker)){ //Om man ska hem blir man köad
          targetShuttle.nextRound.push(coords);

          var fastRoute = route([targetStation,coords]);

          var waypoints = fastRoute["waypoints"];
          var snappedPos = waypoints[waypoints.length - 1].location.reverse();

          targetShuttle.nextRound.pop();
          targetShuttle.nextRound.push(snappedPos); //Ersätter råa coords med snapped

          var marker = L.marker([coords[0], coords[1]], { icon: hus }).addTo(mymap);
          var passenger = new Passenger(marker,snappedPos,onWayHome);

          passengers.push(passenger);
          return;
     }

     targetShuttle.stops.push(coords);

     if (mymap.hasLayer(targetShuttle.travelLine)) { //To only remove if previously painted
          mymap.removeLayer(targetShuttle.travelLine);
     }

     var baseStationLastShuttleFirst = targetShuttle.stops.slice();
     baseStationLastShuttleFirst.push(targetStation);

     let shuttleMarker = targetShuttle.getCoords();
     baseStationLastShuttleFirst.unshift([shuttleMarker.lat, shuttleMarker.lng]);

     var routeResult = route(baseStationLastShuttleFirst);
     if (routeResult !== null) { //Will crash if null is passed as argument

          travelLine = L.polyline(routeResult["poly"]).addTo(mymap);
          targetShuttle.travelLine = travelLine;
          targetShuttle.legs = routeResult["legs"];
          targetShuttle.legDuration = routeResult["legDuration"];

          // --- Create and append a passanger ---
          var waypoints = routeResult["waypoints"];
          var snappedPos = waypoints[waypoints.length - 2].location.reverse();

          targetShuttle.stops.pop();
          targetShuttle.stops.push(snappedPos); //Ersätter råa coords med snapped


          var marker;

          if(onWayHome){
               marker = L.marker([coords[0], coords[1]], { icon: hus }).addTo(mymap);
          }else{
               marker = L.marker([coords[0], coords[1]], { icon: passagerare }).addTo(mymap);
          }




          var passenger = new Passenger(marker,snappedPos,onWayHome);
          passengers.push(passenger);
          if(toggle.checked){
          marker.bindPopup("<b>Förväntad restid:</b><br>" +  Math.round(routeResult["duration"]/60) + " minuter").openPopup();

          for(var p in passengers){
               passengers[p].marker.setPopupContent("<b>Förväntad restid:</b><br>" +  Math.round(routeResult["duration"]/60) + " minuter");
          }
     }

          skyttelAnimation(targetShuttle);
     }
}

function search() {
     if(GlobalDest == null) {
          window.alert("Input saknas");
     }
     else if(home == null) {
          window.alert("Välj utresa/hemresa");
     }
     else {
          mymap.removeLayer(GlobalDest);
          coord = GlobalDest.getLatLng();
          placeAndAnimate(home, [coord.lat, coord.lng] , null);
     }
}

/**
*  Function that is called when changing view between admin and user.
*/
function changeView() {
     var isUser = toggle.checked;

     var overmap = document.getElementById("overmap");  // non-mobile booking interface
     var undermap = document.getElementById("undermap");  // mobile booking interface

     for(var s in shuttles){
          if (isUser) {
               shuttles[s].activeShuttle = false;
               shuttles[s].marker.getMarker().setOpacity(0);
               shuttles[s].marker.setStyle({opacity: 0});
               if(mymap.hasLayer(shuttles[s].travelLine)){
                    shuttles[s].travelLine.setStyle({opacity: 0});
               }
          }else{
               shuttles[s].marker.getMarker().setOpacity(1);
               shuttles[s].marker.setStyle({opacity: 1});
               if(mymap.hasLayer(shuttles[s].travelLine)){
                    shuttles[s].travelLine.setStyle({opacity: 0});
               }
          }
     }

     for(var p in passengers){
          if(isUser){
               passengers[p].marker.setOpacity(0);
          }else{
               passengers[p].marker.setOpacity(1);
          }
     }

     if(isUser){

          overmap.setAttribute("style", "display:block");
          undermap.setAttribute("style", "display:block");
          clearInterval(simulateInterval);
     } else {
          // We need to set CSS as !important to override Bootstrap CSS
          overmap.setAttribute("style", "display:none !important");
          undermap.setAttribute("style", "display:none !important");

          simulateInterval = setInterval(function(){
               placeAndAnimate(randomBool(), genPos(), null);
          }, 2500);
     }
}
// Set correct view on start
changeView();


function skyttelAnimation(minSkyttel) {
     if (minSkyttel.legs.length > 0) {
          if (mymap.hasLayer(minSkyttel.marker)) {
               minSkyttel.marker.off("motion-ended");
               mymap.removeLayer(minSkyttel.marker);
          }
          if (mymap.hasLayer(minSkyttel.statMarker)) {
               mymap.removeLayer(minSkyttel.statMarker);
          }


          minSkyttel.marker = L.motion.polyline(minSkyttel.legs[0], {
               color: 'red'
          }, {
               auto: true,
               duration: minSkyttel.legDuration[0] * 50
          }, {
               icon: skyttelBild
          });
          console.log(minSkyttel.activeShuttle);
          if(toggle.checked && !minSkyttel.activeShuttle){
               minSkyttel.marker.getMarker().setOpacity(0);
               minSkyttel.marker.setStyle({opacity: 0});
               minSkyttel.travelLine.setStyle({opacity: 0});
          }
          mymap.addLayer(minSkyttel.marker);
          //minSkyttel.marker.getMarker().setOpacity(0);

          var stopCords = minSkyttel.legs[0][minSkyttel.legs[0].length - 1];

          minSkyttel.legs.shift();
          minSkyttel.legDuration.shift();

          minSkyttel.marker.on("motion-ended", function (e) {
               minSkyttel.marker.off("motion-ended");
               if (minSkyttel.legs.length > 0) {
                    passengerBoard(minSkyttel.stops, stopCords);
               }
               skyttelAnimation(minSkyttel);
          });
     } else {
          //Tar bort polylines, lägger till ny png för skytteln.
          minSkyttel.marker.off("motion-ended");

          if (mymap.hasLayer(minSkyttel.marker)) {
               mymap.removeLayer(minSkyttel.marker);
               minSkyttel.statMarker.addTo(mymap);
          }
          if (mymap.hasLayer(minSkyttel.travelLine)) {
               mymap.removeLayer(minSkyttel.travelLine);
          }
          if(minSkyttel.nextRound.length > 0){ //Köra ut de som ska hem i nästa runda

               minSkyttel.stops = minSkyttel.nextRound.slice();
               minSkyttel.nextRound = [];

               let shuttleMarker = minSkyttel.getCoords();
               animateAgain([shuttleMarker.lat, shuttleMarker.lng], minSkyttel, null);
          }

     }
}

function passengerBoard(stops, endCoord) {
     for (var p in passengers) {
          var marker = passengers[p].marker;
          var tempCords = passengers[p].snappedPos;
          if (L.latLng(endCoord).distanceTo(L.latLng(tempCords)) < 10) {
               mymap.removeLayer(marker);
               passengers.splice(p, 1);
          }
     }
     for (var c in stops) {
          if (L.latLng(endCoord).distanceTo(L.latLng(stops[c])) < 10) {
               stops.splice(c, 1);
          }
     }
     //stops.splice(stops.indexOf(endCoord), 1);
}

/**
* Takes a list of coordinates and returns a polyline
* Ex. use
* var poly = Route([[57.689991, 11.973447],
     *                   [57.693469, 11.971748],
     *                   [57.706807, 11.978466]]);
     */
     function route(list) {
          var coords = "";
          for (var i in list) {
               // Flip lat and long for API call
               coords += list[i][1] + ',' + list[i][0] + ';';
          }
          coords = coords.slice(0, -1);  // remove last semicolon
          var url = getRequest('https://api.mapbox.com/optimized-trips/v1/mapbox/driving/'
          + coords +
          '?annotations=duration' +
          '&roundtrip=false' +
          '&source=first' +
          '&destination=last' +
          '&steps=true' +
          '&access_token=pk.eyJ1IjoibXlzZmFrdG9yIiwiYSI6ImNrMzhnaHVmMTA1ZnYzYnBiMmVyeXhyZzQifQ.cC-BUqfAiGFV5iJ2Ixsu6g');
          var json_obj = JSON.parse(url);

          if (json_obj.code == "Ok") {
               var legs = [];
               var legDuration = [];

               for (var l in json_obj.trips[0].legs) {
                    var tempLeg = [];
                    for (var s in json_obj.trips[0].legs[l].steps) {
                         tempLeg = tempLeg.concat(polyline.decode(json_obj.trips[0].legs[l].steps[s].geometry));
                    }
                    legDuration[l] = json_obj.trips[0].legs[l].duration;
                    legs[l] = tempLeg;
               }

               var duration = json_obj.trips[0].duration;
               var poly = polyline.decode(json_obj.trips[0].geometry);
               var waypoints = json_obj.waypoints;
               return {"poly":poly, "duration":duration, "legs":legs, "legDuration":legDuration, "waypoints":waypoints};
          }
          console.log("Route error: " + json_obj.message);
          return null;
     }

     // Returns random color for testing purposes
     function randomColor() {
          var r = Math.floor(Math.random() * 255);
          var g = Math.floor(Math.random() * 255);
          var b = Math.floor(Math.random() * 255);
          return "rgb(" + r + " ," + g + "," + b + ")";
     }

     function randomBool(){
          return (Math.random()<0.5); // Readable, succint
     }
     /*
     * Returns the closest station to point in a [Lat, Lng] format
     */
     function closestStation(stations, point) {
          //console.log(point);
          if (stations.length != 0 && point != null) {
               var closest = stations[0];
               for (var i in stations) {
                    if (L.latLng(point).distanceTo(stations[i]) < L.latLng(point).distanceTo(closest)) {
                         closest = stations[i];
                    }
               }
               return closest;
          }
          return null;
     }

     // Magiska internet grejer
     function getRequest(yourUrl) {
          var Httpreq = new XMLHttpRequest(); // a new request
          Httpreq.open("GET", yourUrl, false);
          Httpreq.send(null);
          return Httpreq.responseText;
     }

     function genPos() {
          let latRand = Math.floor(Math.random() * 52913);
          let latitude = (57622932 + latRand) / 1000000;

          let longRand = Math.floor(Math.random() * 76512);
          let longitude = (11860153 + longRand) / 1000000;

          let result = [latitude, longitude];

          return result;
     }

     mymap.on('click', onMapClick);
