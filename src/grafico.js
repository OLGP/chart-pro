// ===== 🔷 PARTE 1: CONFIGURACIÓN INICIAL Y CARGA DE DATOS =====
console.log("🚀 Gráfico unificado con Estocástico separado");

let chart, candleSeries, stochChart;
let kSeries, dSeries, highLineSeries, lowLineSeries;
let historial = [];
let seguirVelas = false;
let stochVisible = true;
let periodoK = 14;
let periodoD = 3;
let rsiChart, rsiSeries, rsiHighLine, rsiLowLine;
let rsiPeriodo = 14;
let cambioManual = true;
let bollingerSMA, bollingerUpper, bollingerLower;
let sarSeries;
let sarStep = 0.02, sarMax = 0.2, sarMinAf = 0.02;
let fractalLookback = 2;
let socket; // Variable para gestionar la conexión WebSocket

const simbolo = localStorage.getItem("activoSeleccionado") || "btcusdt";
localStorage.setItem("activoSeleccionado", simbolo);

const intervalo = localStorage.getItem("intervaloSeleccionado") || "1m";
localStorage.setItem("intervaloSeleccionado", intervalo);

window.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("main-chart");

    chart = LightweightCharts.createChart(contenedor, {
        layout: { background: { color: "#1e1e1e" }, textColor: "#ccc" },
        grid: { vertLines: { color: "#2c2c2c" }, horLines: { color: "#2c2c2c" } },
        timeScale: { timeVisible: true, secondsVisible: true },
        crosshair: { mode: 1 }
    });
    chart.resize(
        contenedor.clientWidth,
        contenedor.clientHeight
    );

    chart.applyOptions({
        handleScroll: { vertTouchDrag: false, vertMouseDrag: false }
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        borderVisible: false
    });

    // Inicializar series de Bollinger Bands
    bollingerSMA = chart.addLineSeries({ color: "#999", lineWidth: 1 });
    bollingerUpper = chart.addLineSeries({ color: "#2962FF", lineWidth: 1 });
    bollingerLower = chart.addLineSeries({ color: "#FF6D00", lineWidth: 1 });

    // Desactiva autoscroll si el usuario hace zoom o pan en el gráfico principal
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (!cambioManual) return; // Ignora cambios programáticos
        if (seguirVelas) {
            seguirVelas = false;
            document.getElementById("btn-autoscroll").textContent = "🔄 Seguir velas";
        }
    });

    const selector = document.getElementById("activo");
    if (selector) {
        const activoGuardado = localStorage.getItem("activoSeleccionado");
        if (activoGuardado) selector.value = activoGuardado;

        selector.addEventListener("change", (e) => {
            localStorage.setItem("activoSeleccionado", e.target.value);
            location.reload(); // Recarga la página al cambiar el activo
        });
    }

    const selectorIntervalo = document.getElementById("interval-selector");
    if (selectorIntervalo) {
        const intervaloGuardado = localStorage.getItem("intervaloSeleccionado");
        if (intervaloGuardado) selectorIntervalo.value = intervaloGuardado;

        selectorIntervalo.addEventListener("change", (e) => {
            localStorage.setItem("intervaloSeleccionado", e.target.value);
            location.reload(); // Recarga la página al cambiar el intervalo
        });
    }

    document.getElementById("toggle-indicator-panel").addEventListener("click", () => {
        const panel = document.getElementById("indicator-selector");
        panel.classList.toggle("visible");
    });
});
// ===== 📘 PARTE 2: CÁLCULOS E INICIALIZACIÓN DE INDICADORES =====

function calcularRSI(data, periodo = 14) {
    const rsi = [];
    let gananciaAcumulada = 0;
    let perdidaAcumulada = 0;

    for (let i = 1; i < data.length; i++) {
        const cambio = data[i].close - data[i - 1].close;
        const ganancia = cambio > 0 ? cambio : 0;
        const perdida = cambio < 0 ? -cambio : 0;

        if (i <= periodo) {
            gananciaAcumulada += ganancia;
            perdidaAcumulada += perdida;
            rsi.push({ time: data[i].time, value: null });
        } else {
            if (i === periodo + 1) {
                gananciaAcumulada /= periodo;
                perdidaAcumulada /= periodo;
            } else {
                gananciaAcumulada = (gananciaAcumulada * (periodo - 1) + ganancia) / periodo;
                perdidaAcumulada = (perdidaAcumulada * (periodo - 1) + perdida) / periodo;
            }

            const rs = gananciaAcumulada / (perdidaAcumulada || 1);
            const valorRSI = 100 - (100 / (1 + rs));
            rsi.push({ time: data[i].time, value: valorRSI });
        }
    }
    return rsi;
}

function inicializarRSI(data) {
    const contenedor = document.getElementById("rsi-chart");
    rsiChart = LightweightCharts.createChart(contenedor, {
        layout: { background: { color: "#1e1e1e" }, textColor: "#ccc" },
        grid: { vertLines: { color: "#2c2c2c" }, horLines: { color: "#2c2c2c" } },
        timeScale: { 
            timeVisible: true, 
            secondsVisible: true,
            axisDoubleClickReset: true,
            mouseWheel: true,
            pinch: true
        },
        rightPriceScale: {
            visible: true,
            autoScale: false,
            mode: LightweightCharts.PriceScaleMode.Normal,
            min: 0,
            max: 100,
            scaleMargins: { top: 0.1, bottom: 0.1 },
            borderVisible: true,
            alignLabels: true
        },
        handleScroll: {
            vertTouchDrag: false,
            vertMouseDrag: false,
            horzTouchDrag: true,
            mouseWheel: true,
            pressedMouseMove: true
        },
        handleScale: {
            axisPressedMouseMove:true ,
            axisDoubleClickReset: true,
            mouseWheel: true,
            pinch: true
        }
    });

    rsiChart.resize(contenedor.clientWidth, contenedor.clientHeight);
    // rsiChart.timeScale().fitContent(); // Comentar esta línea si quieres evitar el fitContent inicial en RSI

    rsiSeries = rsiChart.addLineSeries({
        color: "#fbc02d",
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false
    });

    rsiHighLine = rsiChart.addLineSeries({
        color: "#ff5252",
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dotted
    });

    rsiLowLine = rsiChart.addLineSeries({
        color: "#4caf50",
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dotted
    });

    actualizarRSI(data);

    // Sincronización de rango visible para RSI
    rsiChart.timeScale().subscribeVisibleTimeRangeChange(range => {
        if (cambioManual) {
            chart.timeScale().setVisibleRange(range);
            stochChart?.timeScale().setVisibleRange(range);

            if (seguirVelas) {
                seguirVelas = false;
                document.getElementById("btn-autoscroll").textContent = "🔄 Seguir velas";
                console.log("Desactivado seguirVelas por interacción manual en gráfico RSI.");
            }
        }
    });
}

function actualizarRSI(data) {
    const rsi = calcularRSI(data, rsiPeriodo);
    rsiSeries.setData(rsi);

    const desde = data[0].time;
    const hasta = data[data.length - 1].time;

    rsiHighLine.setData([
        { time: desde, value: 70 },
        { time: hasta, value: 70 }
    ]);

    rsiLowLine.setData([
        { time: desde, value: 30 },
        { time: hasta, value: 30 }
    ]);
}

function calcularSAR(data, min_af = 0.02, step_af = 0.02, max_af = 0.2) {
    const sarPoints = [];
    if (data.length < 2) {
        for (let i = 0; i < data.length; i++) {
            sarPoints.push({ time: data[i].time, value: null });
        }
        return sarPoints;
    }

    let isLong;
    let sar;
    let ep;
    let af = min_af;

    if (data[1].close > data[0].close) {
        isLong = true;
        sar = data[0].low;
        ep = data[0].high;
    } else {
        isLong = false;
        sar = data[0].high;
        ep = data[0].low;
    }

    sarPoints.push({ time: data[0].time, value: null });

    for (let i = 1; i < data.length; i++) {
        const currentBar = data[i];
        const prevBar = data[i - 1];

        let newSar = sar + af * (ep - sar);
        let trendReversed = false;

        if (isLong) {
            newSar = Math.min(newSar, prevBar.low, currentBar.low);

            if (currentBar.close < newSar) {
                trendReversed = true;
                isLong = false;
                sar = ep;
                ep = currentBar.low;
                af = min_af;
            } else {
                if (currentBar.high > ep) {
                    ep = currentBar.high;
                    af = Math.min(af + step_af, max_af);
                }
            }
        } else {
            newSar = Math.max(newSar, prevBar.high, currentBar.high);

            if (currentBar.close > newSar) {
                trendReversed = true;
                isLong = true;
                sar = ep;
                ep = currentBar.high;
                af = min_af;
            } else {
                if (currentBar.low < ep) {
                    ep = currentBar.low;
                    af = Math.min(af + step_af, max_af);
                }
            }
        }

        sarPoints.push({
            time: currentBar.time,
            value: sar
        });

        if (!trendReversed) {
            sar = newSar;
        }
    }
    return sarPoints;
}

function calcularFractales(data, lookback = 2) {
    const up = [], down = [];

    if (data.length <= lookback * 2) return { up: [], down: [] };

    for (let i = lookback; i < data.length - lookback; i++) {
        const highs = data.slice(i - lookback, i + lookback + 1).map(p => p.high);
        const lows = data.slice(i - lookback, i + lookback + 1).map(p => p.low);
        const mid = data[i];

        // Fractal alcista
        if (mid.high === Math.max(...highs)) {
            up.push({ time: mid.time, position: 'belowBar', color: '#FDD835', shape: 'arrowUp', text: '' });
        }
        // Fractal bajista
        if (mid.low === Math.min(...lows)) {
            down.push({ time: mid.time, position: 'aboveBar', color: '#FF5252', shape: 'arrowDown', text: '' });
        }
    }
    return { up, down };
}

function inicializarSARyFractales(data) {
    if (!sarSeries) {
        sarSeries = chart.addLineSeries({
            color: "#4BFFB5",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 2,
        });
    }

    const allMarkers = [];

    const isSarActive = document.getElementById("toggle-sar")?.checked;
    const isFractalsActive = document.getElementById("toggle-fractals")?.checked;

    if (isSarActive) {
        const sarData = calcularSAR(data, sarMinAf, sarStep, sarMax);
        sarSeries.setData(sarData);
        sarSeries.applyOptions({ visible: true });
    } else {
        sarSeries.applyOptions({ visible: false });
    }

    if (isFractalsActive) {
        const { up, down } = calcularFractales(data, fractalLookback);

        up.forEach(f => {
            allMarkers.push({
                time: f.time,
                position: 'belowBar',
                color: '#FDD835',
                shape: 'arrowUp',
                text: f.text || '',
                size: 1.5,
            });
        });

        down.forEach(f => {
            allMarkers.push({
                time: f.time,
                position: 'aboveBar',
                color: '#FF5252',
                shape: 'arrowDown',
                text: f.text || '',
                size: 1.5,
            });
        });
    }

    candleSeries.setMarkers(allMarkers);

    console.log("🔍 Marcadores de Fractales aplicados:", allMarkers.length);
}

function calcularEstocastico(data, periodoK = 14, periodoD = 3) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const k = [], d = [];

    for (let i = 0; i < data.length; i++) {
        if (i < periodoK - 1) {
            k.push({ time: data[i].time, value: null });
            continue;
        }
        const slice = data.slice(i - periodoK + 1, i + 1);
        const low = Math.min(...slice.map(p => p.low));
        const high = Math.max(...slice.map(p => p.high));
        const close = data[i].close;
        const val = high === low ? 0 : ((close - low) / (high - low)) * 100;
        k.push({ time: data[i].time, value: clamp(val, 0, 100) });
    }

    for (let i = 0; i < k.length; i++) {
        if (i < periodoD - 1 || k[i].value == null) {
            d.push({ time: k[i].time, value: null });
            continue;
        }
        const slice = k.slice(i - periodoD + 1, i + 1).map(p => p.value);
        const avg = slice.reduce((a, b) => a + b, 0) / periodoD;
        d.push({ time: k[i].time, value: clamp(avg, 0, 100) });
    }

    return { k, d };
}

function inicializarIndicadores(data) {
    console.log("✅ Estocástico inicializado con", data.length, "velas");

    const { k, d } = calcularEstocastico(data, periodoK, periodoD);

    kSeries = stochChart.addLineSeries({
        color: "#42a5f5",
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: () => ({
            priceRange: {
                minValue: 0,
                maxValue: 100
            }
        })
    });

    dSeries = stochChart.addLineSeries({
        color: "#ef5350",
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: () => ({
            priceRange: {
                minValue: 0,
                maxValue: 100
            }
        })
    });
    kSeries.setData(k);
    dSeries.setData(d);

    highLineSeries = stochChart.addLineSeries({
        color: '#FF0000',
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dotted,
        priceLineVisible: true,
        lastValueVisible: false
    });

    lowLineSeries = stochChart.addLineSeries({
        color: '#00FF00',
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dotted,
        priceLineVisible: true,
        lastValueVisible: false
    });

    const desde = data[0].time;
    const hasta = data[data.length - 1].time;

    highLineSeries.setData([
        { time: desde, value: 80 },
        { time: hasta, value: 80 }
    ]);

    lowLineSeries.setData([
        { time: desde, value: 20 },
        { time: hasta, value: 20 }
    ]);

    // Sincronización de rango visible para el Estocástico
    stochChart.timeScale().subscribeVisibleTimeRangeChange(range => {
        if (cambioManual) {
            chart.timeScale().setVisibleRange(range);
            rsiChart?.timeScale().setVisibleRange(range);

            if (seguirVelas) {
                seguirVelas = false;
                document.getElementById("btn-autoscroll").textContent = "🔄 Seguir velas";
                console.log("Desactivado seguirVelas por interacción manual en gráfico Estocástico.");
            }
        }
    });
}

// Eventos de configuración RSI
document.getElementById("btn-config-rsi").addEventListener("click", () => {
    const panel = document.getElementById("rsi-panel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
});

document.getElementById("btn-apply-rsi").addEventListener("click", () => {
    const input = parseInt(document.getElementById("input-rsi-period").value);
    if (!isNaN(input) && input > 0) {
        rsiPeriodo = input;
        actualizarRSI(historial);
        document.getElementById("rsi-panel").style.display = "none";
    }
});

document.getElementById("toggle-rsi").addEventListener("change", (e) => {
    const container = document.getElementById("rsi-chart-container");
    container.style.display = e.target.checked ? "block" : "none";
    
    // Asegura que los gráficos se redibujen si es necesario y ajusten su espacio
    chart.resize(document.getElementById("main-chart").clientWidth, document.getElementById("main-chart").clientHeight);
    stochChart?.resize(document.getElementById("stochastic-chart-container").clientWidth, document.getElementById("stochastic-chart-container").clientHeight);
    rsiChart?.resize(container.clientWidth, container.clientHeight);
});

// Eventos de configuración Estocástico
document.getElementById("toggle-stoch").addEventListener("change", (e) => {
    const container = document.getElementById("stochastic-chart-container");
    container.style.display = e.target.checked ? "block" : "none";

    stochVisible = e.target.checked;
    
    // Esto es para que los gráficos se redibujen si es necesario y ajusten su espacio
    chart.resize(document.getElementById("main-chart").clientWidth, document.getElementById("main-chart").clientHeight);
    stochChart.resize(container.clientWidth, container.clientHeight);
    rsiChart?.resize(document.getElementById("rsi-chart").clientWidth, document.getElementById("rsi-chart").clientHeight);
});

document.getElementById("btn-config-stoch").addEventListener("click", () => {
    const panel = document.getElementById("stoch-panel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
});

document.getElementById("btn-apply-stoch").addEventListener("click", () => {
    periodoK = parseInt(document.getElementById("input-k").value);
    periodoD = parseInt(document.getElementById("input-d").value);
    if (!isNaN(periodoK) && !isNaN(periodoD) && periodoK > 0 && periodoD > 0) {
        // Recalcular y actualizar Estocástico con los nuevos parámetros
        const { k, d } = calcularEstocastico(historial, periodoK, periodoD);
        kSeries.setData(k);
        dSeries.setData(d);
        document.getElementById("stoch-panel").style.display = "none";
    }
});

// ===== 🔌 PARTE 3: FETCH, WEBSOCKET Y AUTOSCROLL =====

function calcularBollinger(historial, periodo = 20, desviacion = 2) {
    const sma = [], upper = [], lower = [];

    for (let i = 0; i < historial.length; i++) {
        if (i < periodo - 1) {
            sma.push({ time: historial[i].time, value: null });
            upper.push({ time: historial[i].time, value: null });
            lower.push({ time: historial[i].time, value: null });
            continue;
        }

        const slice = historial.slice(i - periodo + 1, i + 1);
        const closes = slice.map(c => c.close);
        const media = closes.reduce((a, b) => a + b, 0) / periodo;
        const std = Math.sqrt(closes.reduce((sum, c) => sum + Math.pow(c - media, 2), 0) / periodo);

        sma.push({ time: historial[i].time, value: media });
        upper.push({ time: historial[i].time, value: media + desviacion * std });
        lower.push({ time: historial[i].time, value: media - desviacion * std });
    }

    return { sma, upper, lower };
}

fetch(`https://api.binance.com/api/v3/klines?symbol=${simbolo.toUpperCase()}&interval=${intervalo}&limit=100`)
    .then(res => res.json())
    .then(data => {
        historial = data.map(c => ({
            time: Math.floor(c[0] / 1000),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4])
        }));

        candleSeries.setData(historial);
        chart.timeScale().fitContent(); // Asegura que el gráfico principal se ajuste al contenido inicial

        const periodoBB = parseInt(document.getElementById("bb-periodo").value);
        const desviacionBB = parseFloat(document.getElementById("bb-desviacion").value);
        const { sma, upper, lower } = calcularBollinger(historial, periodoBB, desviacionBB);
        bollingerSMA.setData(sma);
        bollingerUpper.setData(upper);
        bollingerLower.setData(lower);

        const contenedorStoch = document.getElementById("stochastic-chart");
        stochChart = LightweightCharts.createChart(contenedorStoch, {
            layout: { background: "#1e1e1e", textColor: "#ccc" },
            grid: { vertLines: { color: "#2c2c2c" }, horLines: { color: "#2c2c2c" } },
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
                borderColor: '#434651',
                barSpacing: 10
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: {
                visible: true,
                autoScale: false,
                mode: LightweightCharts.PriceScaleMode.Normal,
                min: 0,
                max: 100,
                alignLabels: true,
                scaleMargins: { top: 0.1, bottom: 0.1 },
                textColor: '#D1D4DC',
                borderColor: '#434651',
                borderVisible: true
            },
            handleScroll: {
                vertTouchDrag: false,
                vertMouseDrag: false,
                horzTouchDrag: true,
                mouseWheel: true,
                pressedMouseMove: true
            },
            handleScale: {
                axisPressedMouseMove: true,
                axisDoubleClickReset: true,
                mouseWheel: true,
                pinch: true
            }
        });

        stochChart.resize(contenedorStoch.clientWidth, contenedorStoch.clientHeight);
        stochChart.timeScale().fitContent(); // Asegura que el gráfico estocástico se ajuste al contenido inicial

        // Sincronización de rango visible para stochChart
        stochChart.timeScale().subscribeVisibleTimeRangeChange(range => {
            if (cambioManual) {
                chart.timeScale().setVisibleRange(range);
                rsiChart?.timeScale().setVisibleRange(range);
                if (seguirVelas) {
                    seguirVelas = false;
                    document.getElementById("btn-autoscroll").textContent = "🔄 Seguir velas";
                    console.log("Desactivado seguirVelas por interacción manual en gráfico Estocástico.");
                }
            }
        });

        try {
            inicializarIndicadores(historial); // Inicializa el Estocástico
            inicializarRSI(historial);      // Inicializa el RSI
            inicializarSARyFractales(historial); // Inicializa el SAR y Fractales
        } catch (err) {
            console.error("❌ Error al inicializar indicadores:", err);
        }

        conectarWebSocket();

        window.addEventListener("resize", () => {
            chart.resize(document.getElementById("main-chart").clientWidth, document.getElementById("main-chart").clientHeight);
            stochChart.resize(contenedorStoch.clientWidth, contenedorStoch.clientHeight);
            rsiChart?.resize(
                document.getElementById("rsi-chart").clientWidth,
                document.getElementById("rsi-chart").clientHeight
            );
        });
    })
    .catch(err => {
        console.error("❌ Error al cargar historial:", err);
    });

function conectarWebSocket() {
    // Si ya existe una conexión, la cierra antes de crear una nueva
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log("Cerrando conexión WebSocket existente.");
    }

    socket = new WebSocket(`wss://stream.binance.com:9443/ws/${simbolo}@kline_${intervalo}`);

    socket.onmessage = event => {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        const nueva = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c)
        };
        if (historial.length === 0 || nueva.time > historial[historial.length - 1].time) {
            historial.push(nueva);
            if (historial.length > 300) historial.shift(); // Mantener un historial manejable
            candleSeries.update(nueva);
        } else if (nueva.time === historial[historial.length - 1].time) {
            historial[historial.length - 1] = nueva;
            candleSeries.update(nueva);
        }
        try {
            if (bollingerSMA && bollingerUpper && bollingerLower) {
                const periodoBB = parseInt(document.getElementById("bb-periodo").value);
                const desviacionBB = parseFloat(document.getElementById("bb-desviacion").value);
                const { sma, upper, lower } = calcularBollinger(historial, periodoBB, desviacionBB);
                bollingerSMA.setData(sma);
                bollingerUpper.setData(upper);
                bollingerLower.setData(lower);
            }
        } catch (err) {
            console.warn("⚠️ Error al actualizar BB:", err);
        }
        if (kSeries && dSeries) {
            const { k: newK, d: newD } = calcularEstocastico(historial, periodoK, periodoD);
            const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

            const kClamped = newK.map(p => ({
                time: p.time,
                value: p.value !== null ? clamp(p.value, 0, 100) : null
            }));

            const dClamped = newD.map(p => ({
                time: p.time,
                value: p.value !== null ? clamp(p.value, 0, 100) : null
            }));

            kSeries.setData(kClamped);
            dSeries.setData(dClamped);

            highLineSeries.setData([
                { time: historial[0].time, value: 80 },
                { time: historial[historial.length - 1].time, value: 80 }
            ]);
            lowLineSeries.setData([
                { time: historial[0].time, value: 20 },
                { time: historial[historial.length - 1].time, value: 20 }
            ]);
        }
        if (rsiSeries) {
            actualizarRSI(historial);
        }

        inicializarSARyFractales(historial); // Recalcula y aplica SAR y Fractales con cada tick

        if (seguirVelas) {
            const ultima = nueva.time;
            const segundosPorIntervalo = {
                "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400, "1w": 604800, "1M": 2592000
            };
            const segundosVisibles = segundosPorIntervalo[intervalo] * 50 || 3600;
            const desde = ultima - segundosVisibles;

            cambioManual = false; // Desactiva el modo manual antes del cambio programático
            [chart, stochChart, rsiChart].forEach(g => {
                if (g && g.timeScale) {
                    g.timeScale().setVisibleRange({ from: desde, to: ultima });
                    g.timeScale().applyOptions({ rightOffset: 20 });
                }
            });
            setTimeout(() => cambioManual = true, 100); // Reactiva el modo manual un poco después
        }
    };
    socket.onerror = err => {
        console.error("❌ Error en WebSocket:", err);
    };
}

// --- Eventos para Bollinger Bands ---
document.getElementById("toggle-bb").addEventListener("change", (e) => {
    const visible = e.target.checked;
    bollingerSMA?.applyOptions({ visible });
    bollingerUpper?.applyOptions({ visible });
    bollingerLower?.applyOptions({ visible });
    document.getElementById("bb-panel").style.display = visible ? "block" : "none";
});

document.getElementById("btn-apply-bb").addEventListener("click", () => {
    const periodo = parseInt(document.getElementById("bb-periodo").value);
    const desviacion = parseFloat(document.getElementById("bb-desviacion").value);

    if (isNaN(periodo) || isNaN(desviacion) || periodo < 1 || desviacion <= 0) {
        alert("Parámetros inválidos");
        return;
    }
    const { sma, upper, lower } = calcularBollinger(historial, periodo, desviacion);
    bollingerSMA.setData(sma);
    bollingerUpper.setData(upper);
    bollingerLower.setData(lower);
});

document.getElementById("btn-config-bb").addEventListener("click", () => {
    const panel = document.getElementById("bb-panel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
});

// --- Eventos para Autoscroll ---
document.getElementById("btn-autoscroll").addEventListener("click", () => {
    seguirVelas = !seguirVelas;

    const btn = document.getElementById("btn-autoscroll");
    btn.textContent = seguirVelas ? "✅ Siguiendo velas" : "🔄 Seguir velas";

    if (seguirVelas) {
        const ultimaVela = historial[historial.length - 1];
        if (ultimaVela) {
            const segundosPorIntervalo = {
                "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400, "1w": 604800, "1M": 2592000
            };
            const segundosVisibles = segundosPorIntervalo[intervalo] * 50 || 3600;
            const desde = ultimaVela.time - segundosVisibles;

            cambioManual = false;
            [chart, stochChart, rsiChart].forEach(g => {
                if (g && g.timeScale) {
                    g.timeScale().setVisibleRange({ from: desde, to: ultimaVela.time });
                    g.timeScale().applyOptions({ rightOffset: 20 });
                }
            });
            setTimeout(() => cambioManual = true, 100);
        }
    }
});

// --- Eventos para SAR ---
document.getElementById("toggle-sar").addEventListener("change", (e) => {
    inicializarSARyFractales(historial);
    document.getElementById("sar-panel").style.display = e.target.checked ? "block" : "none";
});

document.getElementById("btn-config-sar").addEventListener("click", () => {
    const panel = document.getElementById("sar-panel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
});

document.getElementById("btn-apply-sar").addEventListener("click", () => {
    sarStep = parseFloat(document.getElementById("sar-step").value);
    sarMax = parseFloat(document.getElementById("sar-max").value);
    sarMinAf = parseFloat(document.getElementById("sar-min-af").value);
    inicializarSARyFractales(historial);
    document.getElementById("sar-panel").style.display = "none";
});

// --- Eventos para Fractales ---
document.getElementById("toggle-fractals").addEventListener("change", (e) => {
    inicializarSARyFractales(historial);
    document.getElementById("fractals-panel").style.display = e.target.checked ? "block" : "none";
});

document.getElementById("btn-config-fractals").addEventListener("click", () => {
    const panel = document.getElementById("fractals-panel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
});

document.getElementById("btn-apply-fractals").addEventListener("click", () => {
    fractalLookback = parseInt(document.getElementById("fractal-lookback").value);
    inicializarSARyFractales(historial);
    document.getElementById("fractals-panel").style.display = "none";
});