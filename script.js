import React, { useState, useEffect } from "react";
import { ImCalculator } from "react-icons/im";
import { GoDotFill } from "react-icons/go";
import XMLParser from 'react-xml-parser';
import { createRoot } from "react-dom/client";
function App(props) {
    //Todo en un solo estado
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [estado, setEstado] = useState({
        "monto": 10,
        "sonDolares": false,
        "coneccion": {
            "dolarSi": "green",
            "bcb": "green",
            "ultima_consulta": 0
        },
        "monedas": {
            "dolar_real": 0,
            "dolar_peso": {
                "oficial": 0,
                "bolsa": 0,
                "tarjeta": 0,
            },
        },
    });
    function consultarDolarBcb() {
        let hoy = new Date();
        let anio = hoy.getFullYear();
        let mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
        let dia = hoy.getDate();
        let url = 'https://www3.bcb.gov.br/bc_moeda/rest/cotacao/fechamento/ultima/1/220/' + anio + '-' + mes + '-' + dia;
        console.log(url, "LOADING...");
        return fetch(url.toString())
            .then(response => response.text())
            .then(data => {
            var xml = new XMLParser().parseFromString(data);
            var taxaVenda = xml.getElementsByTagName('taxaVenda');
            if (taxaVenda.length > 0) {
                return taxaVenda[0].value;
            }
            else {
                setEstado(Object.assign(Object.assign({}, estado), { "coneccion": Object.assign(Object.assign({}, estado.coneccion), { "bcb": "red" }) }));
                return JSON.parse('{"error BCB":"Sin tasa de venta"}');
            }
        })
            .catch(error => {
            return JSON.parse('{"error": "BCB ' + error + '"}');
        });
    }
    function showTyC() {
        alert('Use esta app con prudencia pués está en fase Beta. Verifique que los montos sean razonables.');
    }
    function consultarDolarSi(url) {
        console.log(url, "LOADING...");
        return fetch(url)
            .then(response => response.json())
            .then(data => { return data; })
            .catch(error => {
            console.error(url, error);
            setEstado(Object.assign(Object.assign({}, estado), { "coneccion": Object.assign(Object.assign({}, estado.coneccion), { "dolarSi": "red" }) }));
            return JSON.parse('{"error":"' + error + '"}');
        });
    }
    const handleChange = (event) => {
        setEstado((prevProps) => (Object.assign(Object.assign({}, prevProps), { [event.target.name]: event.target.value })));
    };
    useEffect(() => {
        if (isLoading) {
            resolver(estado);
            setIsLoading(false);
        }
    });
    const handleSubmit = (data) => {
        data.preventDefault();
        resolver(estado);
    };
    function resolver(data) {
        console.log(data);
        if (isNaN(data.monto)) {
            setErrorMessage("Ingresá un monto para convertir.");
            return;
        }
        if (data.monto < 0) {
            setErrorMessage("Ingresá un monto para convertir.");
            return;
        }
        Promise.all([consultarDolarSi('https://dolarapi.com/v1/dolares'),
            consultarDolarBcb()])
            .then((cotis) => {
            let dolarCot = cotis[0];
            let realCot = cotis[1];
            if ((realCot.error == undefined)
                && (dolarCot.error == undefined)) {
                let nuevoEstado = Object.assign(Object.assign({}, estado), { "monedas": Object.assign(Object.assign({}, estado.monedas), { "dolar_real": Number(redondear(realCot)) }) });
                let tasa = cotis[0].find((obj) => obj.casa == 'oficial').venta;
                nuevoEstado = Object.assign(Object.assign({}, nuevoEstado), { "monedas": Object.assign(Object.assign({}, nuevoEstado.monedas), { "dolar_peso": Object.assign(Object.assign({}, nuevoEstado.monedas.dolar_peso), { "oficial": Number(tasa) }) }) });
                tasa = cotis[0].find((obj) => obj.casa == 'bolsa').venta;
                nuevoEstado = Object.assign(Object.assign({}, nuevoEstado), { "monedas": Object.assign(Object.assign({}, nuevoEstado.monedas), { "dolar_peso": Object.assign(Object.assign({}, nuevoEstado.monedas.dolar_peso), { "bolsa": Number(tasa) }) }) });
                tasa = cotis[0].find((obj) => obj.casa == 'tarjeta').venta;
                nuevoEstado = Object.assign(Object.assign({}, nuevoEstado), { "monedas": Object.assign(Object.assign({}, nuevoEstado.monedas), { "dolar_peso": Object.assign(Object.assign({}, nuevoEstado.monedas.dolar_peso), { "tarjeta": Number(tasa) }) }) });
                nuevoEstado = Object.assign(Object.assign({}, nuevoEstado), { "coneccion": Object.assign(Object.assign({}, nuevoEstado.coneccion), { "ultima_consulta": (new Date()).getTime() }) });
                setEstado(nuevoEstado);
            }
            else {
                setEstado(Object.assign(Object.assign({}, estado), { "coneccion": Object.assign(Object.assign({}, estado.coneccion), { "bcb": "red", "dolarSi": "red" }) }));
            }
        })
            .catch(error => {
            console.log('CATCH', error);
            setErrorMessage(error);
        });
    }
    const find = (array, id) => {
        var result;
        array.some(o => result = o.id === id ? o : find(o.children || [], id));
        return result;
    };
    const setIngresoReales = () => {
        setEstado(Object.assign(Object.assign({}, estado), { "sonDolares": false }));
    };
    const setIngresoDolares = () => {
        setEstado(Object.assign(Object.assign({}, estado), { "sonDolares": true }));
    };
    function redondear(valor) {
        return Number.parseFloat(valor).toFixed(2);
    }
    if (isLoading) {
        return (React.createElement("div", { className: "App" },
            React.createElement("h1", null, "Cargando...")));
    }
    else {
        return (React.createElement("form", { onSubmit: handleSubmit },
            React.createElement("div", { className: "container" },
                React.createElement("h1", null, "CALCULAME"),
                React.createElement("div", { className: "row" },
                    React.createElement("div", { id: "swReales", className: (estado.sonDolares) ? 'swDolarReal' : 'swDolarRealActivo', onClick: setIngresoReales }, "REALES"),
                    React.createElement("div", { id: "swDolares", className: (estado.sonDolares) ? 'swDolarRealActivo' : 'swDolarReal', onClick: setIngresoDolares }, "DOLARES")),
                React.createElement("div", { className: "row" },
                    React.createElement("input", { id: "monto", name: "monto", type: "number", step: ".01", value: estado.monto, onChange: handleChange })),
                React.createElement("div", { className: "row" },
                    React.createElement("table", { className: "centrada" },
                        estado.sonDolares &&
                            React.createElement("tr", null,
                                React.createElement("td", { style: { textAlign: "right" } },
                                    "Reales (BRL/USD ",
                                    estado.monedas.dolar_real,
                                    ")"),
                                React.createElement("td", { style: { textAlign: "right" } }, redondear(Number(estado.monto) * Number(estado.monedas.dolar_real)))),
                        !estado.sonDolares &&
                            React.createElement("tr", null,
                                React.createElement("td", { style: { textAlign: "right" } },
                                    "Dolares (BRL/USD ",
                                    estado.monedas.dolar_real,
                                    ")"),
                                React.createElement("td", { style: { textAlign: "right" } }, redondear(Number(estado.monto) / Number(estado.monedas.dolar_real)))),
                        React.createElement("tr", null,
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos BNA (AR$/USD ",
                                estado.monedas.dolar_peso.oficial,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, redondear(Number(estado.monedas.dolar_peso.oficial) * Number(estado.monto) / ((estado.sonDolares) ? 1 : (Number(estado.monedas.dolar_real)))))),
                        React.createElement("tr", null,
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos MEP (AR$/USD ",
                                estado.monedas.dolar_peso.bolsa,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, redondear(Number(estado.monedas.dolar_peso.bolsa) * Number(estado.monto) / ((estado.sonDolares) ? 1 : (Number(estado.monedas.dolar_real)))))),
                        React.createElement("tr", { style: { backgroundColor: "#00aa00" } },
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos Tarjeta (AR$/USD ",
                                estado.monedas.dolar_peso.tarjeta,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, redondear(Number(estado.monedas.dolar_peso.tarjeta) * Number(estado.monto) / ((estado.sonDolares) ? 1 : (Number(estado.monedas.dolar_real)))))))),
                React.createElement("div", { className: "row" },
                    React.createElement("button", { type: "submit" },
                        React.createElement(ImCalculator, null))),
                React.createElement("div", { className: "row" },
                    "Ultima cotizaci\u00F3n ",
                    new Date(estado.coneccion.ultima_consulta).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: 'numeric', hour: '2-digit', minute: "2-digit", second: "2-digit" })),
                errorMessage.length > 0 &&
                    React.createElement("div", { className: "row", className: "error" }, errorMessage),
                React.createElement(GoDotFill, { style: { color: estado.coneccion.dolarSi } }),
                " ",
                React.createElement("a", { href: "https://dolarapi.com/docs/", target: "_blank" }, "DolarAPI"),
                " -",
                React.createElement(GoDotFill, { style: { color: estado.coneccion.bcb } }),
                " ",
                React.createElement("a", { href: "https://www.bcb.gov.br/conversao", target: "_blank" }, "BCB"),
                React.createElement("br", null))));
    }
}
const root = createRoot(document.querySelector("#app"));
root.render(React.createElement(App, { name: "React" }));
