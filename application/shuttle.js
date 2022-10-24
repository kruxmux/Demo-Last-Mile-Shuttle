// Ex: var s = new Shuttle([57.634164,11.897773],0);
const status = Object.freeze({ "idle": 0, "working": 1 });

var skyttelBild = L.icon({
    iconUrl: 'icons/shuttleImage.png',
    iconSize: [30, 30],
    popupAnchor: [-3, -76],
});

class Shuttle {
    constructor(coords) {
        this.baseStation = coords;
        this.stops = [];
        this.nextRound = [];
        this.legs = [];
        this.legDuration = [];
        this.passangers = 0;
        this.status = status.idle;
        this.travelLine = null;
        this.statMarker = L.marker(this.baseStation, { icon: skyttelBild }).addTo(mymap);
        this.marker = null;
        this.activeShuttle = false;
    }

    addToMap(map) {
        this.marker = L.motion.polyline([this.baseStation, this.baseStation], {
            color: 'red'
        }, {
            duration: -1,
            auto: true
        }, {
            removeOnEnd: false,
            icon: skyttelBild
       }).addTo(mymap);
    }

    getCoords() {
        if(mymap.hasLayer(this.marker)){
         	  return this.marker.getMarkers()[0].getLatLng();
        }else{
            return L.latLng(this.baseStation);
        }
    }

    removeFromMap(map) {
        map.removeLayer(this.marker);
    }
}
