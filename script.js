// --- Funciones de Utilidad ---
function formatValue(val, currency = "PEN", isPercentage = false) {
  const finalCurrency = currency || "PEN";
  if (isPercentage) {
    if (typeof val !== 'number') return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  }
  if (typeof val !== 'number') return formatValue(0, finalCurrency);
  const options = {
    style: "currency",
    currency: finalCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (Math.abs(val) < 0.005) { val = 0; }
  return val.toLocaleString("es-PE", options);
}

// --- Lógica para mostrar/ocultar el Plazo de Gracia ---
document.getElementById("tipoGracia").addEventListener("change", function() {
  const plazoGraciaWrapper = document.getElementById("plazoGraciaWrapper");
  plazoGraciaWrapper.style.display = (this.value !== "ninguna") ? "block" : "none";
});

// --- Lógica Principal del Cálculo del Bono ---
document.getElementById("calculateBtn").addEventListener("click", () => {
  // 1. LEER DATOS DEL FORMULARIO
  const valorNominal = parseFloat(document.getElementById("precioVenta").value);
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
  const TEA = tasaAnualInput;
  const diasPorAnio = tipoAnio;
  const diasPorPeriodo = diasPorAnio / frecuenciaCupon;
  const tasaPeriodo = Math.pow(1 + TEA, diasPorPeriodo / diasPorAnio) - 1;

  const totalCupones = plazoEnAnios * frecuenciaCupon;
  const plazoGraciaAnios = (tipoGracia !== 'ninguna') ? parseInt(document.getElementById("plazoGracia").value) : 0;
  const periodosGracia = plazoGraciaAnios * frecuenciaCupon;
  
  // El capital se amortiza sobre los periodos SIN NINGUN TIPO de gracia.
  // En ambos casos de gracia (Total y Parcial), la amortización es 0.
  const periodosParaAmortizar = totalCupones - periodosGracia;
  
  if (periodosGracia >= totalCupones) {
    alert("El plazo del período de gracia no puede ser igual o mayor al plazo total del bono.");
    return;
  }
  
  // La amortización constante se calcula sobre el SALDO que queda DESPUÉS del periodo de gracia.
  // Este cálculo se debe hacer DENTRO del bucle si hay gracia total.
  let amortizacionConstante = 0;
  let saldoPostGracia = valorNominal; // Valor inicial antes de cualquier gracia
  
  // Si la gracia es total, el saldo aumenta.
  if (tipoGracia === 'total') {
      for (let i = 0; i < periodosGracia; i++) {
          saldoPostGracia += saldoPostGracia * tasaPeriodo;
      }
  }

  if (periodosParaAmortizar > 0) {
      amortizacionConstante = saldoPostGracia / periodosParaAmortizar;
  }


  let saldo = valorNominal;
  const cronograma = [];

  // 3. GENERAR EL CRONOGRAMA CON LA LÓGICA CORRECTA
  for (let i = 1; i <= totalCupones; i++) {
    const interes = saldo * tasaPeriodo;
    let amortizacionPeriodo = 0; // Por defecto
    let cuponTotal = 0; // Por defecto
    let saldoFinal;

    const esPeriodoDeGracia = i <= periodosGracia;

    if (esPeriodoDeGracia) {
      if (tipoGracia === "total") {
        // REGLA: No se paga nada, el interés se capitaliza.
        amortizacionPeriodo = 0;
        cuponTotal = 0;
        saldoFinal = saldo + interes;
      } else { // tipoGracia === "parcial"
        // REGLA: Se paga solo el interés, el saldo no cambia.
        amortizacionPeriodo = 0;
        cuponTotal = interes;
        saldoFinal = saldo;
      }
    } else {
      // PERÍODO NORMAL (SIN GRACIA - MÉTODO ALEMÁN)
      amortizacionPeriodo = amortizacionConstante;
      cuponTotal = interes + amortizacionPeriodo;
      saldoFinal = saldo - amortizacionPeriodo;
    }

    // Ajuste final para que el último saldo sea exactamente 0
    if (i === totalCupones && Math.abs(saldoFinal) > 0.005) {
      amortizacionPeriodo += saldoFinal;
      cuponTotal += saldoFinal;
      saldoFinal = 0;
    }
    
    cronograma.push({
      numero: i,
      saldoInicial: saldo,
      interes: interes,
      amortizacion: amortizacionPeriodo,
      cupon: cuponTotal,
      saldoFinal: saldoFinal,
    });

    saldo = saldoFinal;
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
    plazoGracia: plazoGraciaAnios,
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
  const columnas = ["#", "Fecha", "V. Nominal", "Tasa Anual", "Plazo (Años)", "Frec.", "Gracia", "Acciones"];
  columnas.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  const tbody = tabla.createTBody();
  bonos.forEach((bono, index) => {
    const row = tbody.insertRow();
    row.insertCell().textContent = index + 1;
    row.insertCell().textContent = bono.fecha;
    row.insertCell().textContent = formatValue(bono.valorNominal, bono.moneda);
    row.insertCell().textContent = formatValue(bono.tasaAnual, bono.moneda, true);
    row.insertCell().textContent = bono.plazo;
    row.insertCell().textContent = bono.frecuencia;
    row.insertCell().textContent = `${bono.tipoGracia}${bono.tipoGracia !== 'ninguna' ? ` (${bono.plazoGracia}a)` : ''}`;
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

  document.getElementById("precioVenta").value = bono.valorNominal;
  document.getElementById("tasaAnual").value = bono.tasaAnual * 100;
  document.getElementById("plazo").value = bono.plazo;
  document.getElementById("frecuenciaCupon").value = bono.frecuencia;
  document.getElementById("tipoAnio").value = bono.tipoAnio;
  document.getElementById("tipoGracia").value = bono.tipoGracia;
  document.getElementById("moneda").value = bono.moneda;

  const plazoGraciaWrapper = document.getElementById("plazoGraciaWrapper");
  if (bono.tipoGracia !== 'ninguna' && bono.plazoGracia) {
    document.getElementById("plazoGracia").value = bono.plazoGracia;
    plazoGraciaWrapper.style.display = 'block';
  } else {
    plazoGraciaWrapper.style.display = 'none';
  }
  
  document.getElementById('bondForm').scrollIntoView({ behavior: 'smooth' });
  alert("Datos de la simulación cargados en el formulario.");
}

// --- Función para mostrar la tabla del cronograma ---
function mostrarTabla(cronograma, moneda) {
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
window.onload = mostrarBonos;