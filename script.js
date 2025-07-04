function formatValue(val) {
  return Math.abs(val).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const tipoTasaSelect = document.getElementById("tipoTasa");
const capitalizacionSelect = document.getElementById("capitalizacion");
tipoTasaSelect.addEventListener("change", () => {
  capitalizacionSelect.disabled = tipoTasaSelect.value !== "nominal";
});

document.getElementById("usaCuotaInicial").addEventListener("change", () => {
  const habilitar = document.getElementById("usaCuotaInicial").value === "si";
  document.getElementById("porcentajeInicial").disabled = !habilitar;
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  const usaCuota = document.getElementById("usaCuotaInicial").value === "si";
  const precioVenta = parseFloat(document.getElementById("precioVenta").value);
  const porcentajeInicial = parseFloat(document.getElementById("porcentajeInicial").value || "0") / 100;

  let principal = usaCuota ? precioVenta * (1 - porcentajeInicial) : parseFloat(prompt("Ingrese el monto del préstamo (sin cuota inicial):"));

  const tipoTasa = document.getElementById("tipoTasa").value;
  const tasaInput = parseFloat(document.getElementById("tasaAnual").value) / 100;
  const capitalizacion = tipoTasa === "nominal" ? parseInt(document.getElementById("capitalizacion").value) : null;
  const tipoAnio = parseInt(document.getElementById("tipoAnio").value);
  const frecuencia = parseInt(document.getElementById("frecuencia").value);
  const plazo = parseInt(document.getElementById("plazo").value);
  const tipoGracia = document.getElementById("tipoGracia").value;
  const fechaEmision = document.getElementById("fechaEmision").value;
  const estructura = parseFloat(document.getElementById("estructura").value || "0") / 100;
  const colocacion = parseFloat(document.getElementById("colocacion").value || "0") / 100;
  const cavali = parseFloat(document.getElementById("cavali").value || "0") / 100;
  const tasaMercado = parseFloat(document.getElementById("tasaMercado").value || "0") / 100;

  const n = frecuencia * plazo;
  const TEA = tipoTasa === "efectiva" ? tasaInput : Math.pow(1 + tasaInput / capitalizacion, capitalizacion) - 1;
  const tasaPeriodo = Math.pow(1 + TEA, 1 / frecuencia) - 1;
  const numPeriodosAmortiza = tipoGracia === "ninguna" ? n : n - frecuencia;
  const amortizacion = principal / numPeriodosAmortiza;
  let saldo = principal;

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-bordered mt-3";
  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  ["N°", "Saldo Inicial", "Interés", "Amortización", "Cuota", "Saldo Final"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  let flujoBonista = [];
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
    [i, saldo, interes, amort, cuota, saldoFinal].forEach(val => {
      const td = row.insertCell();
      td.textContent = formatValue(val);
    });
    flujoBonista.push({ flujo: cuota, t: i });
    saldo = saldoFinal;
  }

  document.getElementById("amortizationTable").innerHTML = "";
  document.getElementById("amortizationTable").appendChild(tabla);
  document.getElementById("results").classList.remove("d-none");

  // Indicadores
  const flujos = flujoBonista.map(f => f.flujo);
  const duraciones = flujoBonista.map(f => f.t);
  const pv = flujos.map((f, i) => f / Math.pow(1 + tasaMercado / frecuencia, i + 1));
  const precioActual = pv.reduce((a, b) => a + b, 0);
  const duration = pv.map((v, i) => (i + 1) * v).reduce((a, b) => a + b, 0) / precioActual;
  const durationMod = duration / (1 + tasaMercado / frecuencia);
  const convexity = pv.map((v, i) => v * (i + 1) * (i + 2)).reduce((a, b) => a + b, 0) / (Math.pow(1 + tasaMercado / frecuencia, 2) * precioActual);
  const trea = Math.pow(precioVenta / precioActual, 1 / n) - 1;
  const tcea = (flujoBonista.reduce((a, b) => a + b.flujo, 0) - precioVenta) / precioVenta;

  // Mostrar en los span
  document.getElementById("tceaEmisor").textContent = (tcea * 100).toFixed(3) + "%";
  document.getElementById("treaBonista").textContent = (trea * 100).toFixed(3) + "%";
  document.getElementById("duracion").textContent = duration.toFixed(3);
  document.getElementById("duracionModificada").textContent = durationMod.toFixed(3);
  document.getElementById("convexidad").textContent = convexity.toFixed(3);
  document.getElementById("precioBono").textContent = formatValue(precioActual);

  // Guardar bono
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
  ["#", "Fecha", "Precio", "Cuota Inicial", "Tasa", "Plazo", "Frecuencia", "Gracia", "Acciones"].forEach(text => {
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
    cells.forEach(val => {
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
  document.getElementById("tasaAnual").value = bono.tasaEfectiva;
  document.getElementById("frecuencia").value = bono.frecuencia;
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("tipoGracia").value = bono.tipoGracia;

  if (bono.tipoTasa) document.getElementById("tipoTasa").value = bono.tipoTasa;
  if (bono.capitalizacion) document.getElementById("capitalizacion").value = bono.capitalizacion;
  if (bono.tipoAnio) document.getElementById("tipoAnio").value = bono.tipoAnio;

  alert("Bono cargado en el formulario. Puedes recalcular o modificar.");
}

window.onload = mostrarBonos;



