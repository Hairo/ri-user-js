// ==UserScript==
// @name        Busqueda OFV
// @namespace   Violentmonkey Scripts
// @match       https://ofv.ri.gob.do/*
// @require     https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @grant       GM.openInTab
// @grant       none
// @version     0.3
// @author      -
// @description 13/10/2023, 1:06:32 p. m.
// ==/UserScript==

var XHR_RESULTADOS = null;
var ABRIR_DETALLES = false;

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("readystatechange", function() {
          if (this.responseURL == "https://aqua.ri.gob.do/NovusBackend/api/public-documents" && this.readyState == 4) {
            XHR_RESULTADOS = JSON.parse(this.response);
          }
          if (this.responseURL == "https://aqua.ri.gob.do/NovusBackend/api/public-documents/details" && this.readyState == 4) {
            const response = JSON.parse(this.response);
            if (ABRIR_DETALLES) {
              abrirTodos(response);
            } else {
              agregarContador(response);
            }
          }
          if (this.responseURL == "https://aqua.ri.gob.do/NovusBackend/api/political-division/provinces" && this.readyState == 4 && document.location.pathname == "/consultation/public-documents-consult") {
            waitElements();
          }
        }, false);
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);

function agregarBotones() {
  const resultados = document.getElementsByClassName("ant-table-content")[0].querySelectorAll(".ant-table-row-level-0");

  for (let i = 0; i < resultados.length; i++) {
    const ver_btn = resultados[i].firstChild;

    if (ver_btn.childElementCount == 1) {
      const todos_btn = document.createElement("button");
      todos_btn.setAttribute("type","button");
      todos_btn.className = "btn btn-primary btn-sm";
      todos_btn.textContent = "Todos";

      todos_btn.addEventListener('click', abirResultado.bind(null, ver_btn), false);
      ver_btn.appendChild(todos_btn);
    }
  }
}

function abrirTodosResultados() {
  const resultados = document.getElementsByClassName("ant-table-content")[0].querySelectorAll(".ant-table-row-level-0");

  for (let i = 0; i < resultados.length; i++) {
    const ver_btn = resultados[i].firstChild;
    abirResultado(ver_btn);
  }
}

async function abrirTodos(response) {
  document.getElementsByClassName("ant-modal-close-x")[0].click();

  for (let i = 0; i < response.length; i++) {
    await sleepRNG(100, 500);
    GM.openInTab(response[i].url, true);
  }

  ABRIR_DETALLES = false;
}

function sleepRNG(min, max) {
  var ms = Math.floor(Math.random() * (max - min) ) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function abirResultado(ver_btn) {
  ABRIR_DETALLES = true;
  ver_btn.firstChild.click();
}

function agregarContador(response) {
  document.getElementsByClassName("ant-modal-body")[1].firstChild.firstChild.textContent = `Imágenes del documento (${response.length})`;
}

const observer = new MutationObserver((mutationList, observer) => {
  agregarBotones();
});

function waitElements() {
  waitForKeyElements(".ant-table-content", (element) => {
    const elementToObserve = document.getElementsByClassName("ant-table-content")[0];
    observer.observe(elementToObserve, { subtree: true, childList: true, attributes: false });
  });
}
