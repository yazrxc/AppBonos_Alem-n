// --- Funciones de Utilidad ---
function formatValue(val, currency = "PEN", isPercentage = false) {
  // Asegurarse de que la moneda nunca sea undefined
  const finalCurrency = currency || "PEN";

  if (isPercentage) {
    // Manejar el caso de que 'val' sea undefined
    if (typeof val !== 'number') return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  }

  // Manejar el caso de que 'val' sea undefined
  if (typeof val !== 'number') return formatValue(0, finalCurrency);

  const options = {
    style: "currency",
    currency: finalCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (Math.abs(val) < 0.005) {
    val = 0;
  }
  return val.toLocaleString("es-PE", options);
}

// --- Lógica Principal del Cálculo del Bono ---
document.getElementById("calculateBtn").addEventListener("click", () => {
  // 1. LEER DATOS DEL FORMULARIO
  const valorNominal = parseFloat(document.getElementById("precioVenta").value); // Mantengo el ID 'precioVenta' para que coincida con tu HTML
  const tasaAnualInput = parseFloat(document.getElementById("tasaAnual").value) / 100;
  const plazoEnAnios = parseInt(document.getElementById("plazo").value);
  const frecuenciaCupon = parseInt(document.getElementById("frecuenciaCupon").value);
  const tipoAnio = parseInt(document.getElementById("tipoAnio").value);
  const tipoGracia = document.getElementById("tipoGracia").value;
  const moneda = document.getElementById("moneda").value;
  
  if (isNaN(valorNominal) || isNaN(tasaAnualInput) || isNaN(plazoEnAnios)) {
    alert("Por favor, complete todos los campos requeridos: Valor Nominal, Tasa Anual y Plazo.");
    return;
  }
  
  // 2. CÁLCULOS PREVIOS
  const tipoTasa = "efectiva";
  const TEA = tasaAnualInput;

  const diasPorAnio = tipoAnio;
  const diasPorPeriodo = diasPorAnio / frecuenciaCupon;
  const tasaPeriodo = Math.pow(1 + TEA, diasPorPeriodo / diasPorAnio) - 1;

  const totalCupones = plazoEnAnios * frecuenciaCupon;
  const periodosGracia = (tipoGracia !== "ninguna") ? frecuenciaCupon : 0;
  const periodosParaAmortizar = totalCupones - periodosGracia;
  const amortizacionConstante = (periodosParaAmortizar > 0) ? valorNominal / periodosParaAmortizar : 0;

  let saldo = valorNominal;
  const cronograma = [];

  // 3. GENERAR EL CRONOGRAMA
  for (let i = 1; i <= totalCupones; i++) {
    // (Misma lógica de cálculo que en la versión anterior)
    const interes = saldo * tasaPeriodo;
    let amortizacionPeriodo = amortizacionConstante;
    
    if (tipoGracia === "total" && i <= periodosGracia) {
      amortizacionPeriodo = 0;
    } else if (tipoGracia === "parcial" && i <= periodosGracia) {
      amortizacionPeriodo = 0;
    }

    if (i > periodosGracia) {
        amortizacionPeriodo = amortizacionConstante;
    } else {
        amortizacionPeriodo = 0;
    }

    const cuponTotal = interes + amortizacionPeriodo;
    const saldoFinal = saldo - amortizacionPeriodo;

    if (i === totalCupones && saldoFinal.toFixed(2) != 0) {
      amortizacionPeriodo += saldoFinal;
    }

    cronograma.push({
      numero: i,
      saldoInicial: saldo,
      interes: interes,
      amortizacion: amortizacionPeriodo,
      cupon: cuponTotal,
      saldoFinal: saldo - amortizacionPeriodo,
    });
    saldo = saldo - amortizacionPeriodo;
  }

  // 4. MOSTRAR LA TABLA EN EL HTML
  mostrarTabla(cronograma, moneda);
  
  // 5. GUARDAR LA SIMULACIÓN
  guardarSimulacion({
    valorNominal: valorNominal,
    tasaAnual: tasaAnualInput,
    plazo: plazoEnAnios,
    frecuencia: frecuenciaCupon,
    tipoAnio: tipoAnio,
    tipoGracia: tipoGracia,
    moneda: moneda,
    fecha: new Date().toLocaleString("es-PE"),
  });

  // 6. ACTUALIZAR Y MOSTRAR LA TABLA DEL HISTORIAL
  mostrarBonos();
});

// --- Funciones para el Historial (LocalStorage) ---

function guardarSimulacion(bonoData) {
  const bonosGuardados = JSON.parse(localStorage.getItem("bonos")) || [];
  bonosGuardados.push(bonoData);
  localStorage.setItem("bonos", JSON.stringify(bonosGuardados));
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
  tablaBonosDiv.innerHTML = ""; // Limpiar antes de redibujar

  const tabla = document.createElement("table");
  tabla.className = "table table-hover table-sm table-bordered";

  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  // Columnas relevantes para el bono
  const columnas = [
    "#", "Fecha", "V. Nominal", "Tasa Anual", "Plazo (Años)", "Frec.", "Gracia", "Acciones"
  ];
  columnas.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  bonos.forEach((bono, index) => {
    const row = tbody.insertRow();
    
    // Contenido de las celdas adaptado a los datos del bono
    row.insertCell().textContent = index + 1;
    row.insertCell().textContent = bono.fecha;
    row.insertCell().textContent = formatValue(bono.valorNominal, bono.moneda);
    row.insertCell().textContent = formatValue(bono.tasaAnual, bono.moneda, true); // Formato de porcentaje
    row.insertCell().textContent = bono.plazo;
    row.insertCell().textContent = bono.frecuencia;
    row.insertCell().textContent = bono.tipoGracia;

    const acciones = row.insertCell();
    const btnCargar = document.createElement("button");
    btnCargar.textContent = "Cargar";
    btnCargar.className = "btn btn-sm btn-primary";
    btnCargar.onclick = () => cargarBono(index);
    acciones.appendChild(btnCargar);
  });

  tablaBonosDiv.appendChild(tabla);
}

function cargarBono(index) {
  const bonos = JSON.parse(localStorage.getItem("bonos")) || [];
  if (!bonos[index]) return;
  
  const bono = bonos[index];

  // Cargar los datos del bono guardado en el formulario
  document.getElementById("precioVenta").value = bono.valorNominal;
  document.getElementById("tasaAnual").value = bono.tasaAnual * 100; // Convertir de nuevo a %
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("frecuenciaCupon").value = bono.frecuencia;
  document.getElementById("tipoAnio").value = bono.tipoAnio;
  document.getElementById("tipoGracia").value = bono.tipoGracia;
  document.getElementById("moneda").value = bono.moneda;
  
  // Opcional: Desplazar la vista hacia el formulario para que el usuario vea que se cargó
  document.getElementById('bondForm').scrollIntoView({ behavior: 'smooth' });

  alert("Datos de la simulación cargados en el formulario.");
}

// --- Función para mostrar la tabla del cronograma ---
function mostrarTabla(cronograma, moneda) {
  // (Misma función mostrarTabla que en la versión anterior)
  const tablaContainer = document.getElementById("amortizationTable");
  tablaContainer.innerHTML = "";

  const tabla = document.createElement("table");
  tabla.className = "table table-striped table-bordered mt-3";
  
  const thead = tabla.createTHead();
  const headerRow = thead.insertRow();
  const headers = ["N° Cupón", "Saldo Inicial", "Interés", "Amortización", "Cupón + Amort.", "Saldo Final"];
  headers.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    th.className = "text-center";
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  cronograma.forEach((fila) => {
    const row = tbody.insertRow();
    const valores = [fila.numero, fila.saldoInicial, fila.interes, fila.amortizacion, fila.cupon, fila.saldoFinal];
    let td = row.insertCell();
    td.textContent = valores[0];
    td.className = "text-center";
    
    for (let i = 1; i < valores.length; i++) {
      td = row.insertCell();
      td.textContent = formatValue(valores[i], moneda);
      td.className = "text-end";
    }
  });

  tablaContainer.appendChild(tabla);
  document.getElementById("results").classList.remove("d-none");
}

// --- Evento de Carga Inicial ---
// Muestra el historial guardado tan pronto como la página se carga.
window.onload = mostrarBonos;