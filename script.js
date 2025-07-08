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

  // Guardar la simulación
  const bonoData = {
    precioVenta,
    usaCuota,
    porcentajeInicial: porcentajeInicial * 100,
    tasaEfectiva: TEA * 100,
    frecuencia,
    plazo,
    tipoGracia,
    tipoTasa,
    capitalizacion,
    tipoAnio,
    fecha: new Date().toLocaleString(),
  };

  const bonosGuardados = JSON.parse(localStorage.getItem("bonos")) || [];
  bonosGuardados.push(bonoData);
  localStorage.setItem("bonos", JSON.stringify(bonosGuardados));

  mostrarBonos();
});

// Mostrar lista de bonos
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

// Cargar datos en el formulario
function cargarBono(index) {
  const bonos = JSON.parse(localStorage.getItem("bonos")) || [];
  const bono = bonos[index];

  document.getElementById("precioVenta").value = bono.precioVenta;
  document.getElementById("usaCuotaInicial").value = bono.usaCuota ? "si" : "no";
  document.getElementById("porcentajeInicial").disabled = !bono.usaCuota;
  document.getElementById("porcentajeInicial").value = bono.porcentajeInicial;

  document.getElementById("tasaAnual").value = bono.tasaEfectiva;
  document.getElementById("frecuencia").value = bono.frecuencia;
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("tipoGracia").value = bono.tipoGracia;

  if (bono.tipoTasa) document.getElementById("tipoTasa").value = bono.tipoTasa;
  if (bono.capitalizacion)
    document.getElementById("capitalizacion").value = bono.capitalizacion;
  if (bono.tipoAnio)
    document.getElementById("tipoAnio").value = bono.tipoAnio;

  alert("Bono cargado en el formulario. Puedes recalcular o modificar.");
}

window.onload = mostrarBonos;



