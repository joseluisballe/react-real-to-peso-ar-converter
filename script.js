import React, { useState, useEffect } from "react";
import { ImCalculator } from "react-icons/im";
import { useForm } from "react-hook-form";
import { createRoot } from "react-dom/client";
import XMLParser from 'react-xml-parser';
function App(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [ultimaConsultaDolarSi, setUltimaConsultaDolarSi] = useState();
    const [brlXusd, setBrlXusd] = useState(0);
    const [montoEnDolares, setMontoEnDolares] = useState(0);
    const [arsXusdOficial, setArsXusdOficial] = useState(0);
    const [montoEnPesosOficial, setMontoEnPesosOficial] = useState(0);
    const [arsXusdTarjeta, setArsXusdTarjeta] = useState(0);
    const [montoEnPesosTarjeta, setMontoEnPesosTarjeta] = useState(0);
    const [arsXusdBolsa, setArsXusdBolsa] = useState(0);
    const [montoEnPesosBolsa, setMontoEnPesosBolsa] = useState(0);
    const { register, handleSubmit } = useForm();
    function consultarDolarBcb() {
        return fetch('https://www3.bcb.gov.br/bc_moeda/rest/cotacao/fechamento/ultima/1/220/2024-01-20')
            .then(response => response.text())
            .then(data => {
            var xml = new XMLParser().parseFromString(data);
            var taxaVenda = xml.getElementsByTagName('taxaVenda');
            if (taxaVenda.length > 0) {
                return taxaVenda[0].value;
            }
            else {
                return JSON.parse('{"error BCB":"Sin tasa de venta"}');
            }
        })
            .catch(error => {
            console.error(error);
            return JSON.parse('{"error BCB":"' + error + '"}');
        });
    }
    function consultarDolarSi(url) {
        console.log(url, "LOADING...");
        return fetch(url)
            .then(response => response.json())
            .then(data => { return data; })
            .catch(error => {
            console.error(error);
            return JSON.parse('{"error":"' + error + '"}');
        });
    }
    useEffect(() => {
        setIsLoading(false);
    }, []);
    const onSubmit = (data) => {
        console.log(data);
        if (isNaN(data.monto) || monto.value <= 0) {
            setErrorMessage("Ingresá un monto para convertir.");
            return;
        }
        Promise.all([consultarDolarSi('https://dolarapi.com/v1/dolares'),
            consultarDolarBcb()])
            .then((cotis) => {
            let realCot = cotis[1];
            if (realCot.erro == undefined) {
                setBrlXusd(Number(redondear(realCot)));
                setMontoEnDolares(Number(redondear(monto.value / realCot)));
                let tasa = cotis[0].find((obj) => obj.casa == 'oficial').venta;
                setArsXusdOficial(redondear(tasa));
                setMontoEnPesosOficial(Number(redondear((monto.value / realCot) * tasa)));
                tasa = cotis[0].find((obj) => obj.casa == 'tarjeta').venta;
                setArsXusdTarjeta(redondear(tasa));
                setMontoEnPesosTarjeta(Number(redondear((monto.value / realCot) * tasa)));
                tasa = cotis[0].find((obj) => obj.casa == 'bolsa').venta;
                setArsXusdBolsa(redondear(tasa));
                setMontoEnPesosBolsa(Number(redondear((monto.value / realCot) * tasa)));
                setUltimaConsultaDolarSi(tasa = cotis[0].find((obj) => obj.casa == 'oficial').fechaActualizacion);
            }
        })
            .catch(error => {
            setErrorMessage(error);
        });
    };
    const find = (array, id) => {
        var result;
        array.some(o => result = o.id === id ? o : find(o.children || [], id));
        return result;
    };
    function redondear(valor) {
        return Number.parseFloat(valor).toFixed(2);
        //return Math.round(valor * 100) / 100;
    }
    if (isLoading) {
        return (React.createElement("div", { className: "App" },
            React.createElement("h1", null, "Cargando...")));
    }
    else {
        return (React.createElement("form", { onSubmit: handleSubmit(onSubmit) },
            React.createElement("div", { className: "container" },
                React.createElement("h1", null, "MONTO"),
                React.createElement("div", { className: "row" },
                    React.createElement("input", Object.assign({ id: "monto", type: "number", defaultValue: "10" }, register("monto")))),
                React.createElement("div", { className: "row" },
                    React.createElement("table", { className: "centrada" },
                        React.createElement("tr", null,
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Dolares (BRL/USD ",
                                brlXusd,
                                ")"),
                            React.createElement("td", { style: { textAlign: "right" } }, montoEnDolares)),
                        React.createElement("tr", null,
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos BNA (AR$/USD ",
                                arsXusdOficial,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, montoEnPesosOficial)),
                        React.createElement("tr", null,
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos MEP (AR$/USD ",
                                arsXusdBolsa,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, montoEnPesosBolsa)),
                        React.createElement("tr", { style: { backgroundColor: "#00aa00" } },
                            React.createElement("td", { style: { textAlign: "right" } },
                                "Pesos Tarjeta (AR$/USD ",
                                arsXusdTarjeta,
                                ") "),
                            React.createElement("td", { style: { textAlign: "right" } }, montoEnPesosTarjeta)))),
                React.createElement("div", { className: "row" },
                    React.createElement("button", { type: "submit" },
                        React.createElement(ImCalculator, null))),
                React.createElement("div", { className: "row" }, (ultimaConsultaDolarSi instanceof Date) ? (new Date(ultimaConsultaDolarSi)).toLocaleTimeString('es-ES', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : '--'),
                errorMessage.length > 0 &&
                    React.createElement("div", { className: "row", className: "error" }, errorMessage))));
    }
}
const root = createRoot(document.querySelector("#app"));
root.render(React.createElement(App, { name: "React" }));
