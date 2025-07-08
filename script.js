document.getElementById("calculateBtn").addEventListener("click", () => {
  const VN = parseFloat(document.getElementById("valorNominal").value);
  const TEA = parseFloat(document.getElementById("tasaEfectiva").value) / 100;
  const COK = parseFloat(document.getElementById("tasaMercado").value) / 100;
  const frecuencia = parseInt(document.getElementById("frecuencia").value);
  const plazo = parseInt(document.getElementById("plazo").value);
  const tipoGracia = document.getElementById("tipoGracia").value;

  const n = frecuencia * plazo;
  const tasaPeriodoTEA = Math.pow(1 + TEA, 1 / frecuencia) - 1;
  const tasaPeriodoCOK = Math.pow(1 + COK, 1 / frecuencia) - 1;

  const numCuotasConGracia = frecuencia; // 1 año de gracia
  const numAmortiza = tipoGracia === "ninguna" ? n : n - numCuotasConGracia;
  const amortizacionBase = VN / numAmortiza;

  let saldo = VN;
  let precio = 0;

  // Crear tabla HTML
  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-bordered mt-3";
  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  const headers = [
    "N°",
    "Saldo Inicial",
    "Interés",
    "Amortización",
    "Cuota Total",
    "Saldo Final",
    "Flujo Descontado"
  ];
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
    if (tipoGracia === "total" && i <= numCuotasConGracia) {
      amort = 0;
    } else if (tipoGracia === "parcial" && i <= numCuotasConGracia) {
      amort = amortizacionBase * 0.5;
    }

    const cuota = interes + amort;
    const saldoFinal = saldoInicial - amort;
    const flujoDescontado = cuota / Math.pow(1 + tasaPeriodoCOK, i);

    precio += flujoDescontado;

    const fila = tbody.insertRow();
    const valores = [
      i,
      saldoInicial,
      interes,
      amort,
      cuota,
      saldoFinal,
      flujoDescontado
    ];

    valores.forEach((val) => {
      const td = fila.insertCell();
      td.textContent = format(val);
    });

    saldo = saldoFinal;
  }

  // Agregar fila resumen del precio
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
});
