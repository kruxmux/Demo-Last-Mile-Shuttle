var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;

var provider = new OpenStreetMapProvider();

var searchControl = new GeoSearchControl({
    provider: provider,
});

const form = document.getElementById('fr');
const input = form.querySelector('input[name="from"]');

const mobileFrom = document.getElementById('mobFr');
const inputMob = mobileFrom.querySelector('input[name="from"]');
// Variables
var rres = new Array();

var home = null;
var GlobalRes;

var GlobalDest;  
/*
var stops = {
    "Rödgatan, Västra Frölunda": [57.62788,11.900354],
    "Askim Stationsväg, Askim": [57.63528,11.93161],
    "Klåveskärsgatan, Västra Frölunda": [57.64239,11.88032],
    "Backa, Askim": [57.63666,11.94420],
    "Björnåsgatan, Västra Frölunda": [57.65464,11.87097],
    "Orkestergatan, Västra Frölunda": [57.65985,11.92029],
    "Smyckegatan, Tynnered": [57.65080,11.89757]
};
*/

// Listeners
form.addEventListener('input', async (event) => {
    event.preventDefault();
    GlobalRes = await provider.search({ query: input.value });
    rres = new Array();
    if (GlobalRes.length > 0) {
        // Shows 10 search results at a time
        for (i = 0; i < 10; i++) {
            if(i >= GlobalRes.length) {break;}
            rres.push(GlobalRes[i].label);
        }
    }
    
    $('input[name="from"]').autocomplete({
        delay: 500,
        source: rres
    });
    
});



mobileFrom.addEventListener('input', async (event) => {
    event.preventDefault();
    GlobalRes = await provider.search({ query: inputMob.value });
    rres = new Array();
    if (GlobalRes.length > 0) {
        // Shows 10 search results at a time
        for (i = 0; i < 10; i++) {
            if(i >= GlobalRes.length) {break;}
            rres.push(GlobalRes[i].label);
        }
    }
    $('input[name="from"]').autocomplete({
        delay: 500,
        source: rres
    });
});



$( 'input[name="from"]' ).on( "autocompleteselect", function( event, ui ) {
    var res = GlobalRes.find(function (obj) {
        if( obj.label == ui.item.value) {
            if(GlobalDest != null) {
                mymap.removeLayer(GlobalDest);
            } 
            GlobalDest = L.marker([obj.y, obj.x]);
            GlobalDest.addTo(mymap);
            return obj; 
        }
    });
} );
