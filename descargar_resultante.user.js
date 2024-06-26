// ==UserScript==
// @name        Descargar Resultante
// @require     https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.2/proj4.js
// @namespace   Violentmonkey Scripts
// @match       https://servicios.ri.gob.do/LocalizadorDeInmuebles
// @grant       none
// @version     0.4
// @author      -
// @run-at      document-start
// @description 26/6/2024, 11:16:32 a. m.
// ==/UserScript==

const utm = '+proj=utm +ellps=WGS84 +datum=WGS84 +units=m +no_defs +zone=19Q';
const latlon = '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs';

var RES_DATA = null;

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("readystatechange", function() {
          if (this.responseURL == "https://servicios.ri.gob.do/LocalizadorDeInmuebles/GetResulting" && this.readyState == 4) {
            RES_DATA = JSON.parse(this.response);
          }
        }, false);
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);

window.addEventListener('load', function () {
    // Botones nuevos
    var obtn = document.getElementById("btn-search").parentElement.parentElement;
    var br = document.createElement("br");
    var space = document.createTextNode('\u00A0');

    var boton1 = document.createElement("button");
    boton1.innerHTML = "Descargar DXF";
    boton1.addEventListener('click', function() { descargarResultante(1); }, false);

    var boton2 = document.createElement("button");
    boton2.innerHTML = "Descargar KML";
    boton2.addEventListener('click', function() { descargarResultante(2); }, false);

    boton1.className = "btn btn-primary";
    boton2.className = "btn btn-primary";

    obtn.parentNode.insertBefore(boton2, obtn.nextSibling);
    obtn.parentNode.insertBefore(space, obtn.nextSibling);
    obtn.parentNode.insertBefore(boton1, obtn.nextSibling);
    obtn.parentNode.insertBefore(br, obtn.nextSibling);
});

function convertLatLon(punto) {
    var p = proj4(latlon, utm, punto);
    return [ p[0].toFixed(2), p[1].toFixed(2) ];
}

function convertAll(resp) {
    resp.coordinates.pop(); //borrar la ultima coordenada repetida
    var res = []
    for (var i = 0; i < resp.coordinates.length; i++) {
        var cutm = convertLatLon(resp.coordinates[i]);
        res.push(cutm);
    }
    return res;
}

function descargarResultante(modo) {
    if (RES_DATA !== null) {
        var numero = document.getElementById("DCPosicional").value;
        switch(modo) {
          case 1:
            var coords = convertAll(RES_DATA);
            generarDXF(numero, coords);
            break;
          case 2:
            generarKML(numero, RES_DATA.coordinates);
            break;
          default:
            console.log("?????");
        }
    } else {
      alert("Se debe realizar una busqueda para descargar.");
    }
}

function generarKML(numero, coords) {
    var puntos = "";
    for (var i = 0; i < coords.length; i++) {
        puntos = puntos+`${coords[i][0]},${coords[i][1]},0\n`;
    }

    var res = kml_template.replace("REPL_LL", puntos).replace("REPL_N", numero);
    download(res, "application/vnd.google-earth.kml+xml", numero+".kml");
}

function generarDXF(numero, coords) {
    var vert = "";
    for (var i = 0; i < coords.length; i++) {
        vert = vert+vertex_template.replace("REPL_1", coords[i][0]).replace("REPL_2", coords[i][1]);
    }

    var res = dxf_template.replace("REPL_V\n", vert);
    download(res, "application/dxf", numero+".dxf");
}

function download(content, mimeType, filename){
    var a = document.createElement('a');
    var blob = new Blob([content], {type: mimeType});
    var url = URL.createObjectURL(blob);
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    a.remove();
}

const dxf_template = `0
SECTION
2
ENTITIES
0
POLYLINE
8
0
62
0
66
1
70
1
0
REPL_V
SEQEND
0
ENDSEC
0
EOF`

const vertex_template = `VERTEX
8
0
70
32
10
REPL_1
20
REPL_2
30
0
0
`

const kml_template = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
	<name>REPL_N</name>
	<Style id="style">
		<LineStyle>
			<color>ff0000ff</color>
			<width>2.0</width>
		</LineStyle>
		<PolyStyle>
			<fill>0</fill>
		</PolyStyle>
	</Style>
	<Placemark>
		<styleUrl>#style</styleUrl>
		<Polygon>
			<outerBoundaryIs>
				<LinearRing>
					<coordinates>
              		    REPL_LL
					</coordinates>
				</LinearRing>
			</outerBoundaryIs>
		</Polygon>
	</Placemark>
</Document>
</kml>
`
