document.getElementById("calculateBtn").addEventListener("click", () => {
  const form = document.getElementById("bondForm");

  // Validación HTML5
  if (!form.checkValidity()) {
    form.reportValidity(); // Muestra los mensajes de validación del navegador
    return;
  }

  // === Variables únicas (NO repetir luego) ===
  const valorNominal = parseFloat(document.getElementById("valorNominal").value);
  const frecuencia = parseInt(document.getElementById("frecuencia").value);
  const plazo = parseInt(document.getElementById("plazo").value);
  const tasa = parseFloat(document.getElementById("tasaEfectiva").value);
  const tipoGracia = document.getElementById("tipoGracia").value;
  const tasaMercado = parseFloat(document.getElementById("tasaMercado").value);
  const costosInversionista = parseFloat(document.getElementById("costosInversionista").value);

  // === Validaciones
  if (![1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].includes(valorNominal)) {
    alert("El valor nominal debe estar entre 1000 y 10000, en múltiplos de 1000.");
    return;
  }

  if (![1, 2].includes(frecuencia)) {
    alert("La frecuencia de pago debe ser 1 (anual) o 2 (semestral).");
    return;
  }

  if (tasa < 2 || tasa > 15) {
    alert("La tasa efectiva debe estar entre 2% y 15%.");
    return;
  }

  if (plazo < 3 || plazo > 12) {
    alert("El plazo debe estar entre 3 y 12 años.");
    return;
  }

  // Validación extra (positivos)
  const campos = [
    { id: "valorNominal", nombre: "Valor Nominal" },
    { id: "tasaEfectiva", nombre: "Tasa Efectiva" },
    { id: "frecuencia", nombre: "Frecuencia de Pago" },
    { id: "plazo", nombre: "Plazo" },
    { id: "tasaMercado", nombre: "Tasa de Mercado" },
    { id: "costosInversionista", nombre: "Costos del Inversionista" },
  ];
  for (const campo of campos) {
    const valor = parseFloat(document.getElementById(campo.id).value);
    if (isNaN(valor) || valor <= 0) {
      alert(`Por favor, ingresa un valor válido y positivo para: ${campo.nombre}`);
      document.getElementById(campo.id).focus();
      return;
    }
  }

  const VN = valorNominal;
  const TEA = tasa / 100;
  const COK = tasaMercado / 100;
  const n = frecuencia * plazo;
  const tasaPeriodoTEA = Math.pow(1 + TEA, 1 / frecuencia) - 1;
  const tasaPeriodoCOK = Math.pow(1 + COK, 1 / frecuencia) - 1;

  const numCuotasConGracia = frecuencia;
  const numAmortiza = tipoGracia === "ninguna" ? n : n - numCuotasConGracia;
  const amortizacionBase = VN / numAmortiza;

  let saldo = VN;
  let precio = 0;
  let flujos = [];

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-bordered mt-3";
  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  const headers = ["N°", "Saldo Inicial", "Interés", "Amortización", "Cuota Total", "Saldo Final", "Flujo Descontado"];
  headers.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  const format = (val) =>
    Math.abs(val).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  for (let i = 1; i <= n; i++) {
    const saldoInicial = saldo;
    const interes = saldoInicial * tasaPeriodoTEA;

    let amort = amortizacionBase;
    if (tipoGracia === "total" && i <= numCuotasConGracia) amort = 0;
    else if (tipoGracia === "parcial" && i <= numCuotasConGracia) amort *= 0.5;

    const cuota = interes + amort;
    const saldoFinal = saldoInicial - amort;
    const flujoDescontado = cuota / Math.pow(1 + tasaPeriodoCOK, i);

    flujos.push({ t: i, flujo: cuota, flujoDescontado });
    precio += flujoDescontado;

    const fila = tbody.insertRow();
    [i, saldoInicial, interes, amort, cuota, saldoFinal, flujoDescontado].forEach((val) => {
      const td = fila.insertCell();
      td.textContent = format(val);
    });

    saldo = saldoFinal;
  }

  const rowTotal = tbody.insertRow();
  const cellLabel = rowTotal.insertCell();
  cellLabel.colSpan = 6;
  cellLabel.className = "fw-bold text-end";
  cellLabel.textContent = "Precio del Bono:";
  const cellPrecio = rowTotal.insertCell();
  cellPrecio.className = "fw-bold";
  cellPrecio.textContent = "S/ " + format(precio);

  document.getElementById("amortizationTable").innerHTML = "";
  document.getElementById("amortizationTable").appendChild(tabla);
  document.getElementById("results").classList.remove("d-none");

  // === Indicadores ===
  const montoInvertido = precio * (1 + costosInversionista / 100);

  const calcularIRR = (flujos, inversionInicial) => {
    let rate = 0.01;
    const precision = 1e-7;
    let diff;
    do {
      const npv = flujos.reduce((acc, f) => acc + f.flujo / Math.pow(1 + rate, f.t), -inversionInicial);
      const dNpv = flujos.reduce((acc, f) => acc - (f.t * f.flujo) / Math.pow(1 + rate, f.t + 1), 0);
      const newRate = rate - npv / dNpv;
      diff = Math.abs(newRate - rate);
      rate = newRate;
    } while (diff > precision);
    return rate;
  };

  const TREA = calcularIRR(flujos, montoInvertido);
  const duracionMacaulay = flujos.reduce((sum, f) => sum + f.t * f.flujoDescontado, 0) / precio;
  const duracionModificada = duracionMacaulay / (1 + tasaPeriodoCOK);
  const convexidad = flujos.reduce(
    (sum, f) => sum + (f.flujo * f.t * (f.t + 1)) / Math.pow(1 + tasaPeriodoCOK, f.t + 2),
    0
  ) / precio;

  const ul = document.getElementById("listaIndicadores");
  ul.innerHTML = `
    <li class="list-group-item">TREA del Inversionista: ${(TREA * frecuencia * 100).toFixed(2)}%</li>
    <li class="list-group-item">Duración (Macaulay): ${duracionMacaulay.toFixed(4)} años</li>
    <li class="list-group-item">Duración Modificada: ${duracionModificada.toFixed(4)}</li>
    <li class="list-group-item">Convexidad: ${convexidad.toFixed(4)}</li>
  `;
  document.getElementById("indicadores").classList.remove("d-none");

  // === Guardar
  const bonoData = {
    valorNominal: VN,
    tasaEfectiva: TEA * 100,
    frecuencia,
    plazo,
    tipoGracia,
    costosInversionista,
    precioCalculado: precio,
    fecha: new Date().toLocaleString(),
  };

  const bonosGuardados = JSON.parse(localStorage.getItem("bonos")) || [];
  bonosGuardados.push(bonoData);
  localStorage.setItem("bonos", JSON.stringify(bonosGuardados));
  mostrarBonos();
});

function formatValue(val) {
  return Math.abs(val).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function mostrarBonos() {
  const bonos = JSON.parse(localStorage.getItem("bonos")) || [];
  const tablaBonosDiv = document.getElementById("tablaBonos");
  const contenedor = document.getElementById("bonosGuardados");

  if (bonos.length === 0) {
    contenedor.classList.add("d-none");
    return;
  }

  contenedor.classList.remove("d-none");
  const tabla = document.createElement("table");
  tabla.className = "table table-hover table-bordered";

  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  const columnas = ["#", "Fecha", "Precio", "Tasa", "Plazo", "Frecuencia", "Gracia", "Acciones"];
  columnas.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  bonos.forEach((bono, index) => {
    const row = tbody.insertRow();
    const cells = [
      index + 1,
      bono.fecha,
      formatValue(bono.precioCalculado),
      bono.tasaEfectiva + "%",
      bono.plazo,
      bono.frecuencia,
      bono.tipoGracia,
    ];
    cells.forEach((val) => {
      const td = row.insertCell();
      td.textContent = val;
    });

    const acciones = row.insertCell();
    const btn = document.createElement("button");
    btn.textContent = "Editar";
    btn.className = "btn btn-sm btn-primary";
    btn.onclick = () => cargarBono(index);
    acciones.appendChild(btn);
  });

  tablaBonosDiv.innerHTML = "";
  tablaBonosDiv.appendChild(tabla);
}

function cargarBono(index) {
  const bonos = JSON.parse(localStorage.getItem("bonos")) || [];
  const bono = bonos[index];

  document.getElementById("valorNominal").value = bono.valorNominal;
  document.getElementById("tasaEfectiva").value = bono.tasaEfectiva;
  document.getElementById("frecuencia").value = bono.frecuencia;
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("tipoGracia").value = bono.tipoGracia;
  document.getElementById("costosInversionista").value = bono.costosInversionista;

  alert("Bono cargado en el formulario. Puedes recalcular o modificar.");
}

window.onload = mostrarBonos;
