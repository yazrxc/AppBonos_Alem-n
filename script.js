document.getElementById("usaCuotaInicial").addEventListener("change", () => {
  const habilitar = document.getElementById("usaCuotaInicial").value === "si";
  document.getElementById("porcentajeInicial").disabled = !habilitar;
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  const usaCuota = document.getElementById("usaCuotaInicial").value === "si";
  const precioVenta = parseFloat(document.getElementById("precioVenta").value);
  const porcentajeInicial =
    parseFloat(document.getElementById("porcentajeInicial").value) / 100;

  let principal;
  if (usaCuota && precioVenta > 0 && porcentajeInicial >= 0) {
    principal = precioVenta * (1 - porcentajeInicial);
  } else {
    principal = parseFloat(
      prompt("Ingrese el monto del préstamo (sin cuota inicial):")
    );
  }

  const tasaAnual =
    parseFloat(document.getElementById("tasaEfectiva").value) / 100;
  const frecuencia = parseInt(document.getElementById("frecuencia").value);
  const plazo = parseInt(document.getElementById("plazo").value);
  const tipoGracia = document.getElementById("tipoGracia").value;

  const n = frecuencia * plazo;
  const tasaPeriodo = Math.pow(1 + tasaAnual, 1 / frecuencia) - 1;
  const numPeriodosAmortiza =
    tipoGracia === "ninguna"
      ? n
      : tipoGracia === "total" || tipoGracia === "parcial"
      ? n - frecuencia
      : n;

  const amortizacion = principal / numPeriodosAmortiza;

  let saldo = principal;

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-bordered mt-3";
  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  const headers = [
    "N°",
    "Saldo Inicial",
    "Interés",
    "Amortización",
    "Cuota",
    "Saldo Final",
  ];
  headers.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  const formatValue = (val) => {
    return Math.abs(val).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  for (let i = 1; i <= n; i++) {
    const interes = saldo * tasaPeriodo;
    let amort = amortizacion;
    let cuota = interes + amort;

    if (tipoGracia === "total" && i <= frecuencia) {
      amort = 0;
      cuota = interes;
    } else if (tipoGracia === "parcial" && i <= frecuencia) {
      amort = amortizacion * 0.5;
      cuota = interes + amort;
    }

    const saldoFinal = saldo - amort;

    const row = tbody.insertRow();
    const valores = [i, saldo, interes, amort, cuota, saldoFinal];

    valores.forEach((val) => {
      const td = row.insertCell();
      td.textContent = formatValue(val);
    });

    saldo = saldoFinal;
  }

  document.getElementById("amortizationTable").innerHTML = "";
  document.getElementById("amortizationTable").appendChild(tabla);
  document.getElementById("results").classList.remove("d-none");
});
