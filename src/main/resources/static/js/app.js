const darkAttr = "&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors";

const osmAttr =
	"&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>, " +
	"Tiles courtesy of <a href='http://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>";

const esriAttr =
	"Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, " +
	"iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, " +
	"Esri China (Hong Kong), and the GIS User Community";

const cartoAttr =
	"&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> " +
	"&copy; <a href='http://cartodb.com/attributions'>CartoDB</a>";

const geodirAttr = "<a href='http://www.geodir.co/'><b>Geodir</b></a> &copy; Map";

const satelitalAttr = "Kenyojoel903@gmail.com";

let mapasBase = {
		Stadia_AlidadeSmoothDark: L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
			maxZoom: 20,
			attribution: darkAttr
		}),
			OpenStreetMap: L.tileLayer("http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
			attribution: osmAttr
		}),
		Satelital: L.tileLayer("https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}", {
			attribution: esriAttr,
			bounds: [[-75, -180], [81, 180]],
			minZoom: 2,
			maxZoom: 19,
			apikey: 'choisirgeoportail',
			format: 'image/jpeg',
			style: 'normal'
		}),
		CartoDB: L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
			attribution: cartoAttr
		})
};
let centroMapa = [ -12.062029, -75.291850 ];

let url = "/location-websocket"

function App(mapasBase, centroMapa, url) {
	this.mapasBase = mapasBase;
	this.centroMapa = centroMapa;
	this._mapa = null;
	this._controlLayer = null;
	this.nombreUsuario = '';
	this.url = url;
	this.stompClient = null;
	this.posicionActual = null;
	this.conectados = {};
}

App.prototype.onInit = function() {
	this._mapa = L.map("mapa", {
	      zoomControl: false,
	      center: this.centroMapa,
	      zoom: 5,
	      minZoom: 2,
	      maxZoom: 19,
	      layers: [this.mapasBase.Stadia_AlidadeSmoothDark]
	});
	L.control.zoom({ position: "topright" }).addTo(this._mapa );
	this._controlLayer = L.control.layers(this.mapasBase, {}).addTo(this._mapa);
	let that = this;
	this._mapa.on('locationfound', (e) => {
		
		that.posicionActual =  {
			latitud: e.latlng.lat,
			longitud: e.latlng.lng
		};
		that.enviarLocalizacion();
		/*let radius = e.accuracy / 2;
		let marker = new L.marker(e.latlng, {draggable:'false'}).bindPopup(that.nombreUsuario).openPopup();
		that._mapa.addLayer(marker);   
		let circle = L.circle(e.latlng, radius);
		that._mapa.addLayer(circle); */
	});
	this._mapa.on('locationerror', (e) => alert(e.message));
}

App.prototype.dibujarUbicacion = function(data) { 
	if(this.conectados[data.persona.name]) {
		this._controlLayer.removeLayer(this.conectados[data.persona.name]);
		this.conectados[data.persona.name].remove();
	}
	let latlng = {
		lat: data.latitud,
		lng: data.longitud
	};
	this.conectados[data.persona.name] = L.marker(latlng, {draggable:'false'}).bindPopup(data.persona.name);
	this.conectados[data.persona.name].addTo(this._mapa);
	this._controlLayer.addOverlay(this.conectados[data.persona.name], data.persona.name);
	
}

App.prototype.geoLocalizar = function () {
	this.nombreUsuario = document.getElementById("txtNombre").value;
	this._mapa.locate({setView: true, maxZoom: 16});
}

App.prototype.getMapa = function() {
	return this._mapa;
}

App.prototype.setConnect = function(conectado) {
	document.getElementById("btnConectar").disabled = conectado; 
	document.getElementById("btnDesconectar").disabled = !conectado; 
	
}

App.prototype.conectar = function () {
	document.getElementById("btnConectar").disabled = true; 
	document.getElementById("btnDesconectar").disabled = false; 
	let socket = new SockJS(this.url);
	this.stompClient = Stomp.over(socket);
	let that = this;
    this.stompClient.connect({}, function (frame) {
        that.setConnect(true);
        console.log('Connected: ' + frame);
        that.stompClient.subscribe('/topic/connect', function (greeting) {
			that.dibujarUbicacion(JSON.parse(greeting.body));
        });
    });
}

App.prototype.desconnectar = function () {
	if (this.stompClient !== null) {
        this.stompClient.disconnect();
    }
    this.setConnect(false);
    console.log("Disconnected");
}

App.prototype.enviarLocalizacion = function() {
	let that = this;
	let location = {
		longitud: that.posicionActual.longitud,
		latitud: that.posicionActual.latitud,
		persona: {
			name: that.nombreUsuario
		}
	};
	this.stompClient.send("/app/location", {}, JSON.stringify(location));
}

let app = new App(mapasBase, centroMapa, url);

let repeat;

setTimeout(() => {
	app.onInit();
	console.log(app);
}, 500);

function conectar(){
	app.conectar();
	app.geoLocalizar();
	repeat = setInterval(()=> {
		app.geoLocalizar();	
	}, 300000);
}

function desconectar() {
	app.desconnectar();
	clearInterval(repeat);
}



