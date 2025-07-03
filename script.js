
function formatValue(val) {
  return Math.abs(val).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

document.getElementById("usaCuotaInicial").addEventListener("change", () => {
  const habilitar = document.getElementById("usaCuotaInicial").value === "si";
  document.getElementById("porcentajeInicial").disabled = !habilitar;
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  const usaCuota = document.getElementById("usaCuotaInicial").value === "si";
  const precioVenta = parseFloat(document.getElementById("precioVenta").value);
  const porcentajeInicial =
    parseFloat(document.getElementById("porcentajeInicial").value || "0") / 100;

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

  //Guardar la simulación
  const bonoData = {
    precioVenta,
    usaCuota,
    porcentajeInicial: porcentajeInicial * 100,
    tasaEfectiva: tasaAnual * 100,
    frecuencia,
    plazo,
    tipoGracia,
    fecha: new Date().toLocaleString(),
  };

  const bonosGuardados = JSON.parse(localStorage.getItem("bonos")) || [];
  bonosGuardados.push(bonoData);
  localStorage.setItem("bonos", JSON.stringify(bonosGuardados));

  mostrarBonos();
});

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
  const columnas = [
    "#",
    "Fecha",
    "Precio",
    "Cuota Inicial",
    "Tasa",
    "Plazo",
    "Frecuencia",
    "Gracia",
    "Acciones",
  ];
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
      formatValue(bono.precioVenta),
      bono.usaCuota ? bono.porcentajeInicial + "%" : "No",
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

  document.getElementById("precioVenta").value = bono.precioVenta;
  document.getElementById("usaCuotaInicial").value = bono.usaCuota ? "si" : "no";
  document.getElementById("porcentajeInicial").disabled = !bono.usaCuota;
  document.getElementById("porcentajeInicial").value = bono.porcentajeInicial;

  document.getElementById("tasaEfectiva").value = bono.tasaEfectiva;
  document.getElementById("frecuencia").value = bono.frecuencia;
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("tipoGracia").value = bono.tipoGracia;

  alert("Bono cargado en el formulario. Puedes recalcular o modificar.");
}

window.onload = mostrarBonos;


