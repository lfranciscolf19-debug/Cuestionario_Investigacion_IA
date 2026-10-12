/**
 * UniCampus - Aplicación Principal y Controlador
 * Manejo de Estado, Detección de Conflictos, Matriz de Horarios,
 * Simulador en Tiempo Real, Bitácora y Directorio de Docentes.
 */

// =============================================================================
// GESTIÓN DE CICLOS ESCOLARES (SEMESTRE A: ENE-JUN | SEMESTRE B: AGO-DIC)
// =============================================================================
const SEMESTRES = (typeof CICLOS_ESCOLARES !== 'undefined') ? CICLOS_ESCOLARES : {
  semestre_a: {
    id: 'semestre_a',
    codigoOficial: '2026-A',
    nombre: 'Ciclo 2026-A (Enero - Junio)',
    periodo: 'Enero - Junio 2026',
    icono: '🌱',
    vigente: true,
    historico: false
  },
  semestre_b: {
    id: 'semestre_b',
    codigoOficial: '2026-B',
    nombre: 'Ciclo 2026-B (Agosto - Diciembre)',
    periodo: 'Agosto - Diciembre 2026',
    icono: '🍂',
    vigente: false,
    historico: false
  },
  semestre_2025_b: {
    id: 'semestre_2025_b',
    codigoOficial: '2025-B',
    nombre: 'Ciclo 2025-B (Agosto - Diciembre)',
    periodo: 'Agosto - Diciembre 2025',
    icono: '🏛️',
    vigente: false,
    historico: true
  },
  semestre_2025_a: {
    id: 'semestre_2025_a',
    codigoOficial: '2025-A',
    nombre: 'Ciclo 2025-A (Enero - Junio)',
    periodo: 'Enero - Junio 2025',
    icono: '🏛️',
    vigente: false,
    historico: true
  }
};

function obtenerSemestreActivo() {
  return localStorage.getItem('fcs_semestre_activo') || 'semestre_a';
}

function cargarAsignacionesPorSemestre(semestreId) {
  const sem = semestreId || obtenerSemestreActivo();
  const key = 'fcs_asignaciones_' + sem;
  let data = JSON.parse(localStorage.getItem(key));
  if (data === null || !Array.isArray(data)) {
    if (sem === 'semestre_a') {
      const v3 = JSON.parse(localStorage.getItem('fcs_asignaciones_v3'));
      data = (v3 && Array.isArray(v3) && v3.length > 0)
        ? v3
        : ((typeof ASIGNACIONES_INICIALES !== 'undefined' && ASIGNACIONES_INICIALES.length > 0) ? ASIGNACIONES_INICIALES : []);
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem('fcs_asignaciones_v3', JSON.stringify(data));
    } else {
      data = [];
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
  return data;
}

let semestreInicial = obtenerSemestreActivo();
let asignacionesGuardadas = cargarAsignacionesPorSemestre(semestreInicial);

window.cambiarSemestre = function(nuevoSemestre) {
  if (AppState.semestreActivo === nuevoSemestre) return;
  guardarDatosLocales();

  AppState.semestreActivo = nuevoSemestre;
  localStorage.setItem('fcs_semestre_activo', nuevoSemestre);
  AppState.asignaciones = cargarAsignacionesPorSemestre(nuevoSemestre);

  const info = SEMESTRES[nuevoSemestre] || { nombre: nuevoSemestre };
  AppState.esCicloHistorico = !!info.historico;

  // Sincronizar selectores en la interfaz
  const selTop = document.getElementById('selectSemestreActivo');
  if (selTop) selTop.value = nuevoSemestre;
  const selDoc = document.getElementById('selectSemestreDocente');
  if (selDoc) selDoc.value = nuevoSemestre;

  // Si Semestre B está vacío y Semestre A tiene datos, sugerir clonar
  if (nuevoSemestre === 'semestre_b' && AppState.asignaciones.length === 0) {
    const asigA = cargarAsignacionesPorSemestre('semestre_a');
    if (asigA && asigA.length > 0) {
      setTimeout(() => {
        if (confirm('🗓️ Has cambiado a Semestre B (Agosto - Diciembre) y aún no tiene clases asignadas.\n\n¿Deseas duplicar los horarios del Semestre A como plantilla base para modificarlos?')) {
          AppState.asignaciones = JSON.parse(JSON.stringify(asigA));
          guardarDatosLocales();
          actualizarTodo();
          if (typeof renderHorarioDocente === 'function') renderHorarioDocente();
          mostrarToast('📋 Horarios del Semestre A copiados al Semestre B.', 'success');
        }
      }, 200);
    }
  }

  actualizarTodo();
  if (typeof renderHorarioDocente === 'function') renderHorarioDocente();
  if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
  
  if (AppState.esCicloHistorico) {
    mostrarToast(`🏛️ Modo Consulta Histórica: ${info.nombre} (Solo Lectura)`, 'warning');
  } else {
    mostrarToast(`🗓️ Ciclo activo: ${info.nombre}`, 'info');
  }
};

window.limpiarHorariosDemoPrompt = function() {
  const semNom = (SEMESTRES[AppState.semestreActivo] && SEMESTRES[AppState.semestreActivo].nombre) || 'el semestre activo';
  if (confirm(`¿Deseas vaciar todas las asignaciones de horarios en ${semNom} y dejar todas las aulas 100% libres?\n\nEsto te permitirá programar tus propios horarios desde cero sin ningún conflicto.`)) {
    AppState.asignaciones = [];
    guardarDatosLocales();
    actualizarTodo();
    if (typeof renderHorarioDocente === 'function') renderHorarioDocente();
    sounds.playSuccess && sounds.playSuccess();
    mostrarToast(`🧹 Todas las aulas quedaron libres en ${semNom}.`, 'info');
  }
};

window.restaurarHorariosPredeterminados = function() {
  const semNom = (SEMESTRES[AppState.semestreActivo] && SEMESTRES[AppState.semestreActivo].nombre) || 'el semestre activo';
  if (confirm(`¿Deseas restaurar los horarios predeterminados para ${semNom}?`)) {
    if (typeof ASIGNACIONES_INICIALES !== 'undefined' && ASIGNACIONES_INICIALES.length > 0) {
      AppState.asignaciones = JSON.parse(JSON.stringify(ASIGNACIONES_INICIALES));
      guardarDatosLocales();
      actualizarTodo();
      if (typeof renderHorarioDocente === 'function') renderHorarioDocente();
      sounds.playSuccess && sounds.playSuccess();
      mostrarToast(`✅ Horarios predeterminados restaurados para ${semNom}.`, 'success');
    }
  }
};

window.restaurarDirectorioDocentesBase = function() {
  if (confirm('¿Deseas restaurar el directorio completo con los 116 docentes universitarios y sus materias?')) {
    if (typeof DOCENTES !== 'undefined' && DOCENTES.length > 0) {
      AppState.docentes = JSON.parse(JSON.stringify(DOCENTES));
      localStorage.setItem('fcs_docentes', JSON.stringify(AppState.docentes));
      actualizarTodo();
      sounds.playSuccess && sounds.playSuccess();
      mostrarToast('✅ Directorio de 116 docentes universitarios restaurado.', 'success');
    }
  }
};

// Capacidades personalizadas (sobreescriben los valores de data.js)
const capacidadesPersonalizadas = JSON.parse(localStorage.getItem('fcs_capacidades')) || {};
ESPACIOS.forEach(esp => {
  if (capacidadesPersonalizadas[esp.id] !== undefined) {
    esp.capacidad = capacidadesPersonalizadas[esp.id];
  }
});

// Estado Global de la Aplicación
const AppState = {
  semestreActivo: semestreInicial,
  esCicloHistorico: !!(SEMESTRES[semestreInicial] && SEMESTRES[semestreInicial].historico),
  diaActual: 'Martes',
  horaActual: '10:00',
  filtroCarrera: 'todas',
  filtroTipoEspacio: 'todos',
  filtroEdificio: 'todos',
  filtroEstadoRapido: 'todos',
  busquedaEspacio: '',
  busquedaDocente: '',
  filtroBitacoraLlave: 'todas',
  busquedaBitacora: '',
  espacioSeleccionadoMatriz: 'POS-0',
  tabActiva: 'tab-monitor',
  tema: localStorage.getItem('unicampus_theme') || 'dark',
  sonidoHabilitado: localStorage.getItem('unicampus_sound') !== 'false',
  
  // Datos persistentes
  asignaciones: asignacionesGuardadas,
  bitacora: (JSON.parse(localStorage.getItem('unicampus_bitacora')) || BITACORA_INICIAL).map(b => ({
    ...b,
    estadoLlave: b.estadoLlave || (b.llaveEntregada ? (b.horaDevolucion ? 'devuelta' : 'prestada') : 'sin_llave')
  })),
  incidencias: JSON.parse(localStorage.getItem('unicampus_incidencias')) || INCIDENCIAS_INICIALES,
  docentes: JSON.parse(localStorage.getItem('fcs_docentes')) || DOCENTES
};

// Sincronización automática: elimina clases asignadas a docentes que ya no existen en el directorio
window.sincronizarAsignacionesConDocentes = function() {
  if (!AppState.docentes || !Array.isArray(AppState.docentes)) return 0;
  
  const idsValidos = new Set(AppState.docentes.map(d => String(d.id)));
  const nombresValidos = new Set(AppState.docentes.map(d => (d.nombre || '').toLowerCase().trim()));
  const titulosValidos = new Set(AppState.docentes.map(d => (d.titulo || '').toLowerCase().trim()));

  const totalOriginal = AppState.asignaciones.length;
  AppState.asignaciones = AppState.asignaciones.filter(a => {
    // Si la asignación tiene ID de docente, verificar si existe en la lista activa
    if (a.docenteId && idsValidos.has(String(a.docenteId))) return true;

    // Verificar si coincide con el nombre o título de algún docente activo
    const nom = (a.docenteNombre || '').toLowerCase().trim();
    const tit = (a.docenteTitulo || '').toLowerCase().trim();
    if (nom && nombresValidos.has(nom)) return true;
    if (tit && titulosValidos.has(tit)) return true;

    // Si no coincide con ningún docente activo en el directorio:
    // es una clase huérfana de prueba que se descarta para liberar el aula
    return false;
  });

  const eliminadas = totalOriginal - AppState.asignaciones.length;
  if (eliminadas > 0) {
    guardarDatosLocales();
    console.log(`🧹 Depuradas ${eliminadas} clases asignadas a docentes que no existen en el directorio.`);
  }
  return eliminadas;
};

// Sincronizar inmediatamente al cargar el estado
sincronizarAsignacionesConDocentes();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  sincronizarAsignacionesConDocentes();
  inicializarTema();
  inicializarLogo();
  inicializarEventosNavegacion();
  inicializarSimuladorTiempo();
  inicializarFormularios();
  inicializarGestionDocentes();
  inicializarExportaciones();

  // Sincronizar selector de semestre en cabecera
  const selTop = document.getElementById('selectSemestreActivo');
  if (selTop) selTop.value = AppState.semestreActivo;

  // Render inicial
  actualizarTodo();
});

function guardarDatosLocales() {
  const sem = AppState.semestreActivo || 'semestre_a';
  localStorage.setItem('fcs_asignaciones_' + sem, JSON.stringify(AppState.asignaciones));
  if (sem === 'semestre_a') {
    localStorage.setItem('fcs_asignaciones_v3', JSON.stringify(AppState.asignaciones));
    localStorage.setItem('fcs_asignaciones_v2', JSON.stringify(AppState.asignaciones));
  }
  localStorage.setItem('unicampus_bitacora', JSON.stringify(AppState.bitacora));
  localStorage.setItem('unicampus_incidencias', JSON.stringify(AppState.incidencias));
  localStorage.setItem('fcs_docentes', JSON.stringify(AppState.docentes));
}

function guardarCapacidades() {
  const mapa = {};
  ESPACIOS.forEach(esp => { mapa[esp.id] = esp.capacidad; });
  localStorage.setItem('fcs_capacidades', JSON.stringify(mapa));
}

// =============================================================================
// EDICIÓN DE CAPACIDAD DE AULA
// =============================================================================
function editarCapacidadEspacio(espId) {
  const esp = ESPACIOS.find(e => e.id === espId);
  if (!esp) return;

  // Crear modal dinámico
  const existente = document.getElementById('modalEditCapacidad');
  if (existente) existente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalEditCapacidad';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
  `;
  modal.innerHTML = `
    <div style="
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 2rem 2.4rem;
      width: min(420px, 92vw);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: slideDown 0.25s ease;
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.4rem;">
        <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary);">✏️ Editar Capacidad</h3>
        <button onclick="document.getElementById('modalEditCapacidad').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);line-height:1;">×</button>
      </div>

      <div style="background:var(--bg-secondary); border-radius:10px; padding:0.9rem 1rem; margin-bottom:1.4rem;">
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Espacio seleccionado</div>
        <div style="font-weight:700; color:var(--accent-primary); font-size:1rem;">${esp.id}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${esp.nombre}</div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px;">📍 ${esp.edificio}</div>
      </div>

      <label style="display:block; font-size:0.85rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.5rem;">
        👥 Nueva capacidad (número de alumnos)
      </label>
      <div style="display:flex; gap:0.6rem; align-items:center; margin-bottom:1.4rem;">
        <button onclick="ajustarCapacidadInput(-5)" style="width:38px;height:38px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:1.1rem;cursor:pointer;flex-shrink:0;">−5</button>
        <button onclick="ajustarCapacidadInput(-1)" style="width:34px;height:38px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:1.1rem;cursor:pointer;flex-shrink:0;">−</button>
        <input
          id="inputNuevaCapacidad"
          type="number"
          min="1" max="2000"
          value="${esp.capacidad}"
          style="
            flex:1; text-align:center; font-size:1.5rem; font-weight:700;
            background:var(--bg-secondary); border:2px solid var(--accent-primary);
            border-radius:10px; color:var(--text-primary); padding:0.4rem;
            outline:none;
          "
        />
        <button onclick="ajustarCapacidadInput(1)" style="width:34px;height:38px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:1.1rem;cursor:pointer;flex-shrink:0;">+</button>
        <button onclick="ajustarCapacidadInput(5)" style="width:38px;height:38px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:1.1rem;cursor:pointer;flex-shrink:0;">+5</button>
      </div>

      <div style="display:flex; gap:0.7rem;">
        <button
          onclick="guardarNuevaCapacidad('${esp.id}')"
          style="
            flex:1; padding:0.75rem; border:none; border-radius:10px;
            background:var(--accent-primary); color:#fff; font-size:0.9rem;
            font-weight:700; cursor:pointer;
            transition: opacity .2s;
          "
          onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'"
        >💾 Guardar Cambio</button>
        <button
          onclick="document.getElementById('modalEditCapacidad').remove()"
          style="
            padding:0.75rem 1.2rem; border:1px solid var(--border-color);
            border-radius:10px; background:var(--bg-secondary);
            color:var(--text-secondary); font-size:0.9rem; cursor:pointer;
          "
        >Cancelar</button>
      </div>
    </div>
  `;

  // Cerrar al clic fuera
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  document.getElementById('inputNuevaCapacidad').focus();
  document.getElementById('inputNuevaCapacidad').select();
}

function ajustarCapacidadInput(delta) {
  const inp = document.getElementById('inputNuevaCapacidad');
  if (!inp) return;
  const val = Math.max(1, (parseInt(inp.value) || 0) + delta);
  inp.value = val;
}

function guardarNuevaCapacidad(espId) {
  const inp = document.getElementById('inputNuevaCapacidad');
  if (!inp) return;
  const nuevaCapacidad = parseInt(inp.value);
  if (isNaN(nuevaCapacidad) || nuevaCapacidad < 1) {
    inp.style.borderColor = 'var(--status-busy)';
    inp.focus();
    return;
  }

  const esp = ESPACIOS.find(e => e.id === espId);
  if (!esp) return;

  const anterior = esp.capacidad;
  esp.capacidad = nuevaCapacidad;
  guardarCapacidades();

  // Registrar en bitácora
  AppState.bitacora.unshift({
    id: 'BIT-CAP-' + Date.now(),
    fecha: new Date().toLocaleDateString('es-MX'),
    hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    espacio: esp.nombre,
    accion: `Capacidad modificada: ${anterior} → ${nuevaCapacidad} alumnos`,
    responsable: 'Administrador',
    tipo: 'modificacion'
  });
  guardarDatosLocales();

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Edición Capacidad', 'Espacios', esp.id, `Capacidad física ajustada: ${anterior} → ${nuevaCapacidad} alumnos`, 'advertencia');
  }

  document.getElementById('modalEditCapacidad').remove();
  actualizarTodo();
  sounds.playClick && sounds.playClick();
}

// =============================================================================
// TEMA Y EFECTOS DE SONIDO (DÍA / NOCHE & SELECTOR DE PROPUESTAS VISUALES)
// =============================================================================
function inicializarTema() {
  // 1. Cargar tema (light / dark)
  document.documentElement.setAttribute('data-theme', AppState.tema);

  // 2. Cargar propuesta visual activa (propuesta-1, propuesta-2, propuesta-3)
  const propuestaGuardada = localStorage.getItem('fcs_propuesta_visual') || 'propuesta-1';
  document.documentElement.setAttribute('data-propuesta', propuestaGuardada);
  const selPropuesta = document.getElementById('selectPropuestaVisual');
  if (selPropuesta) selPropuesta.value = propuestaGuardada;

  // 3. Estilo de franjas para propuesta 2 y 3
  const estiloFranja = localStorage.getItem('fcs_estilo_franja') || 'diagonal';
  aplicarEstiloFranja(estiloFranja);

  const btnTheme = document.getElementById('btnToggleTheme');
  actualizarTextoBotonTema(btnTheme);

  btnTheme.addEventListener('click', () => {
    AppState.tema = AppState.tema === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', AppState.tema);
    localStorage.setItem('unicampus_theme', AppState.tema);
    actualizarTextoBotonTema(btnTheme);
    sounds.playClick();
    const nombrePropuesta = obtenerNombrePropuesta(document.documentElement.getAttribute('data-propuesta') || 'propuesta-1');
    mostrarToast(AppState.tema === 'light' ? `☀️ Modo Día Activado (${nombrePropuesta})` : `🌙 Modo Noche Activado (${nombrePropuesta})`, 'info');
  });

  // Selector para cambiar entre las 3 propuestas visuales
  window.cambiarPropuestaVisual = function(propuesta) {
    document.documentElement.setAttribute('data-propuesta', propuesta);
    localStorage.setItem('fcs_propuesta_visual', propuesta);
    sounds.playClick && sounds.playClick();
    const nombrePropuesta = obtenerNombrePropuesta(propuesta);
    mostrarToast(`🎨 ${nombrePropuesta} aplicada con éxito`, 'info');
  };

  const btnSound = document.getElementById('btnToggleSound');
  if (btnSound) {
    btnSound.textContent = AppState.sonidoHabilitado ? '🔔' : '🔕';
    sounds.enabled = AppState.sonidoHabilitado;

    btnSound.addEventListener('click', () => {
      AppState.sonidoHabilitado = !AppState.sonidoHabilitado;
      sounds.enabled = AppState.sonidoHabilitado;
      localStorage.setItem('unicampus_sound', AppState.sonidoHabilitado);
      btnSound.textContent = AppState.sonidoHabilitado ? '🔔' : '🔕';
      if (AppState.sonidoHabilitado) sounds.playClick();
    });
  }
}

function actualizarTextoBotonTema(btn) {
  if (!btn) return;
  if (AppState.tema === 'dark') {
    btn.innerHTML = '🌙 Noche';
    btn.title = 'Cambiar a Modo Día';
  } else {
    btn.innerHTML = '☀️ Día';
    btn.title = 'Cambiar a Modo Noche';
  }
}

function obtenerNombrePropuesta(propuestaId) {
  switch (propuestaId) {
    case 'propuesta-2': return 'Propuesta 2: Carmesí & Cristal';
    case 'propuesta-3': return 'Propuesta 3: Diplomático & Oro UJED';
    case 'propuesta-1':
    default: return 'Propuesta 1: Marfil Ejecutivo UJED';
  }
}

function aplicarEstiloFranja(estilo) {
  document.body.classList.remove('franjas-verticales', 'franjas-doradas');
  if (estilo === 'vertical') {
    document.body.classList.add('franjas-verticales');
  } else if (estilo === 'dorada') {
    document.body.classList.add('franjas-doradas');
  }
}

// =============================================================================
// GESTIÓN DEL LOGO INSTITUCIONAL (FACULTAD DE CIENCIAS DE LA SALUD)
// =============================================================================
function inicializarLogo() {
  const container = document.getElementById('brandLogoContainer');
  const input = document.getElementById('inputSubirLogo');
  const img = document.getElementById('brandLogoImg');
  const placeholder = document.getElementById('brandLogoPlaceholder');

  // Cargar logo guardado previamente en localStorage
  const logoGuardado = localStorage.getItem('fcs_custom_logo');
  if (logoGuardado) {
    img.src = logoGuardado;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  // Al hacer clic sobre el logo o badge de cámara
  if (container && input) {
    container.addEventListener('click', () => {
      input.click();
    });

    // Al seleccionar un archivo de imagen
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        mostrarToast('Por favor selecciona un archivo de imagen válido (.png, .jpg, .svg, .webp).', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        localStorage.setItem('fcs_custom_logo', dataUrl);
        img.src = dataUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
        sounds.playSuccess();
        mostrarToast('¡Logo de la Facultad de Ciencias de la Salud actualizado correctamente!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
}

// =============================================================================
// GESTIÓN Y ALIMENTACIÓN DE DOCENTES (ALTA MANUAL Y CARGA MASIVA CSV)
// =============================================================================
function inicializarGestionDocentes() {
  // 1. Botón para abrir modal de nuevo docente
  const btnNuevoDoc = document.getElementById('btnAbrirModalNuevoDocente');
  if (btnNuevoDoc) {
    btnNuevoDoc.addEventListener('click', () => {
      abrirModal('modalNuevoDocente');
      sounds.playClick();
    });
  }

  // 2. Formulario de alta manual de nuevo docente
  const formNuevoDoc = document.getElementById('formNuevoDocente');
  if (formNuevoDoc) {
    formNuevoDoc.addEventListener('submit', (e) => {
      e.preventDefault();
      const prefijoRaw = document.getElementById('docentePrefijo').value.trim();
      const prefijo = prefijoRaw ? (prefijoRaw.endsWith('.') ? prefijoRaw : prefijoRaw + '.') : '';
      const carrera = document.getElementById('docenteCarrera').value;
      const nombreCompleto = document.getElementById('docenteNombreCompleto').value.trim();
      const especialidadEl = document.getElementById('docenteEspecialidad');
      const especialidad = (especialidadEl && especialidadEl.value.trim()) ? especialidadEl.value.trim() : 'Docente';
      const materia1El = document.getElementById('docenteMateria1');
      const materia1 = (materia1El && materia1El.value.trim()) ? materia1El.value.trim() : 'Asignatura General';
      const email = (document.getElementById('docenteEmail')?.value || '').trim() || 'Sin registrar';
      const telefono = (document.getElementById('docenteTelefono')?.value || '').trim() || 'Sin registrar';
      const cubiculoEl = document.getElementById('docenteCubiculo');
      const cubiculo = (cubiculoEl && cubiculoEl.value.trim()) ? cubiculoEl.value.trim() : 'Edif. Central';

      const tituloFinal = prefijo ? `${prefijo} ${nombreCompleto}` : nombreCompleto;

      const nuevoDocente = {
        id: `DOC-${carrera.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        nombre: nombreCompleto,
        titulo: tituloFinal,
        prefijo: prefijo,
        carrera: carrera,
        especialidad: especialidad,
        materias: [materia1],
        email: email,
        telefono: telefono,
        cubiculo: cubiculo,
        horasSemanales: 20,
        activo: true
      };

      AppState.docentes.unshift(nuevoDocente);
      guardarDatosLocales();
      actualizarTodo();
      if (typeof registrarAuditoria === 'function') {
        registrarAuditoria('Alta Docente', 'Docentes', nuevoDocente.titulo, `Nuevo docente registrado en ${carrera.toUpperCase()}: ${especialidad}`, 'info');
      }
      cerrarModal('modalNuevoDocente');
      formNuevoDoc.reset();
      sounds.playSuccess();
      mostrarToast(`¡Docente ${nuevoDocente.titulo} registrado en ${CARRERAS[carrera].nombre}!`, 'success');
    });
  }

  // 3. Importación masiva desde archivo CSV
  const btnImportarCSV = document.getElementById('btnImportarDocentesCSV');
  const inputCSV = document.getElementById('inputArchivoDocentesCSV');
  if (btnImportarCSV && inputCSV) {
    btnImportarCSV.addEventListener('click', () => {
      inputCSV.click();
    });

    inputCSV.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const texto = event.target.result;
          const lineas = texto.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lineas.length < 2) {
            mostrarToast('El archivo CSV está vacío o solo contiene encabezados.', 'error');
            return;
          }

          let importados = 0;
          for (let i = 1; i < lineas.length; i++) {
            const sep = lineas[i].includes(';') ? ';' : ',';
            const cols = lineas[i].split(sep).map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 2 && cols[0]) {
              const nombre = cols[0];
              const prefijo = cols[1] || 'Lic.';
              let carrera = (cols[2] || 'medicina').toLowerCase();
              if (!['medicina', 'psicologia', 'nutricion', 'general'].includes(carrera)) {
                if (carrera.includes('med')) carrera = 'medicina';
                else if (carrera.includes('psi')) carrera = 'psicologia';
                else if (carrera.includes('nut')) carrera = 'nutricion';
                else carrera = 'general';
              }
              const esp = cols[3] || 'Docencia General';
              const email = cols[4] || `${nombre.toLowerCase().replace(/\s+/g, '.')}@cienciasdelasalud.edu`;
              const tel = cols[5] || 'Sin teléfono';
              const cub = cols[6] || 'Edif. Central';

              AppState.docentes.push({
                id: `DOC-IMP-${String(Date.now()).slice(-4)}-${i}`,
                nombre: nombre,
                titulo: `${prefijo} ${nombre}`,
                prefijo: prefijo,
                carrera: carrera,
                especialidad: esp,
                materias: [esp],
                email: email,
                telefono: tel,
                cubiculo: cub,
                horasSemanales: 20,
                activo: true
              });
              importados++;
            }
          }

          guardarDatosLocales();
          actualizarTodo();
          sounds.playSuccess();
          mostrarToast(`¡Se importaron ${importados} docentes exitosamente al sistema!`, 'success');
        } catch (err) {
          console.error(err);
          mostrarToast('Error al procesar el archivo CSV. Revisa el formato.', 'error');
        }
        inputCSV.value = '';
      };
      reader.readAsText(file);
    });
  }

  // 4. Descargar Plantilla CSV para que el usuario la llene
  const btnDescargarPlantilla = document.getElementById('btnDescargarPlantillaDocentes');
  if (btnDescargarPlantilla) {
    btnDescargarPlantilla.addEventListener('click', () => {
      const encabezados = 'Nombre Completo,Grado/Prefijo,Carrera (medicina/psicologia/nutricion),Especialidad/Materia,Email Institucional,Telefono,Cubiculo\n';
      const ejemplos = [
        '"Dr. Carlos Roberto Mendoza","Dr.","medicina","Anatomía Quirúrgica","carlos.mendoza@cienciasdelasalud.edu","+52 55 5482-1010","Edif. A - Cub. M-101"',
        '"Dra. Laura Sofía Morales","Dra.","psicologia","Evaluación Psicométrica","laura.morales@cienciasdelasalud.edu","+52 55 5482-2020","Edif. B - Cub. P-201"',
        '"Mtra. Mariana Castro Rivera","Mtra.","nutricion","Bromatología y Alimentos","mariana.castro@cienciasdelasalud.edu","+52 55 5482-3030","Edif. C - Cub. N-102"',
        '"Lic. Rodrigo Beltrán Solís","Lic.","general","Acondicionamiento Físico","rodrigo.beltran@cienciasdelasalud.edu","+52 55 5482-4040","Domo Central - Ofic. 1"'
      ].join('\n');

      descargarCSV(encabezados + ejemplos, 'Plantilla_Docentes_Facultad_Ciencias_Salud.csv');
    });
  }
}

// =============================================================================
// SIMULADOR DE TIEMPO REAL Y RELOJ
// =============================================================================
function inicializarSimuladorTiempo() {
  const selDia = document.getElementById('selectDiaActual');
  const selHora = document.getElementById('selectHoraActual');
  const btnAhora = document.getElementById('btnSincronizarAhora');

  selDia.value = AppState.diaActual;
  selHora.value = AppState.horaActual;

  selDia.addEventListener('change', (e) => {
    AppState.diaActual = e.target.value;
    actualizarTodo();
    sounds.playClick();
  });

  selHora.addEventListener('change', (e) => {
    AppState.horaActual = e.target.value;
    actualizarTodo();
    sounds.playClick();
  });

  btnAhora.addEventListener('click', () => {
    const ahora = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let diaSemana = dias[ahora.getDay()];
    if (diaSemana === 'Domingo') diaSemana = 'Lunes'; // Campus cerrado domingos
    
    // Convertir hora a la franja más cercana
    const hora = ahora.getHours();
    const min = ahora.getMinutes();
    const horaFloat = hora + min / 60;

    let franjaCercana = FRANJAS_HORARIAS[0].inicio;
    for (const f of FRANJAS_HORARIAS) {
      if (horaFloat >= f.horaNum) {
        franjaCercana = f.inicio;
      }
    }

    AppState.diaActual = diaSemana;
    AppState.horaActual = franjaCercana;
    selDia.value = diaSemana;
    selHora.value = franjaCercana;

    actualizarTodo();
    sounds.playSuccess();
    mostrarToast(`🕒 Sincronizado con horario real: ${diaSemana} ${franjaCercana}`, 'info');
  });
}

// =============================================================================
// NAVEGACIÓN Y FILTROS
// =============================================================================

// Función helper debounce para rendimiento óptimo de búsqueda
function debounce(func, wait = 180) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function inicializarEventosNavegacion() {
  // Tabs con accesibilidad ARIA
  const tabBtns = document.querySelectorAll('.nav-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      AppState.tabActiva = targetTab;

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
      });
      const activePanel = document.getElementById(targetTab);
      if (activePanel) {
        activePanel.classList.add('active');
        activePanel.setAttribute('aria-hidden', 'false');
      }

      sounds.playClick();
      renderTabActual();
    });
  });

  // Filtro de Carreras (Header)
  const careerBtns = document.querySelectorAll('.career-pill-btn');
  careerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      careerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filtroCarrera = btn.getAttribute('data-career');

      // Sincronizar espacio de la matriz con la carrera elegida
      if (AppState.filtroCarrera !== 'todas') {
        const espActual = ESPACIOS.find(esp => esp.id === AppState.espacioSeleccionadoMatriz);
        if (!espActual || (espActual.carreraExclusiva && espActual.carreraExclusiva !== AppState.filtroCarrera)) {
          const espDeCarrera = ESPACIOS.find(esp => esp.carreraExclusiva === AppState.filtroCarrera) || ESPACIOS[0];
          if (espDeCarrera) AppState.espacioSeleccionadoMatriz = espDeCarrera.id;
        }
      }

      sounds.playClick();
      actualizarTodo();
    });
  });

  // Filtro de Tipo de Espacio (Tab 1)
  const typeBtns = document.querySelectorAll('.type-filter-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filtroTipoEspacio = btn.getAttribute('data-type');
      sounds.playClick();
      renderMonitorEspacios();
    });
  });

  // Filtro por Edificio (Tab 1)
  const buildingBtns = document.querySelectorAll('.building-pill-btn');
  buildingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      buildingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filtroEdificio = btn.getAttribute('data-edificio');
      sounds.playClick();
      renderMonitorEspacios();
    });
  });

  // Filtro Rápido de Estado Operativo (Tab 1 - Consulta Rápida Prefectura y Superadmin)
  const statusFilterBtns = document.querySelectorAll('.status-pill-filter');
  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filtroEstadoRapido = btn.getAttribute('data-status-filter') || 'todos';
      sounds.playClick && sounds.playClick();
      renderMonitorEspacios();
    });
  });

  // Buscador de Espacios con Debounce
  const inputBusqEspacio = document.getElementById('inputBuscarEspacio');
  if (inputBusqEspacio) {
    inputBusqEspacio.addEventListener('input', debounce((e) => {
      AppState.busquedaEspacio = e.target.value.toLowerCase().trim();
      renderMonitorEspacios();
    }, 180));
  }

  // Buscador de Docentes con Debounce
  const inputBusqDocente = document.getElementById('inputBuscarDocente');
  if (inputBusqDocente) {
    inputBusqDocente.addEventListener('input', debounce((e) => {
      AppState.busquedaDocente = e.target.value.toLowerCase().trim();
      renderDirectorioDocentes();
    }, 180));
  }

  // Selector de Edificio para Matriz Semanal
  const selMatrizEdificio = document.getElementById('selectEdificioMatriz');
  if (selMatrizEdificio) {
    selMatrizEdificio.addEventListener('change', (e) => {
      const edifVal = e.target.value;
      const espaciosValidos = edifVal === 'todos' 
        ? ESPACIOS 
        : ESPACIOS.filter(esp => esp.edificioId === edifVal);

      if (espaciosValidos.length > 0) {
        if (!espaciosValidos.some(esp => esp.id === AppState.espacioSeleccionadoMatriz)) {
          AppState.espacioSeleccionadoMatriz = espaciosValidos[0].id;
        }
      }
      renderMatrizSemanal();
      sounds.playClick && sounds.playClick();
    });
  }

  // Selector de espacio para Matriz Semanal
  const selMatrizEspacio = document.getElementById('selectEspacioMatriz');
  if (selMatrizEspacio) {
    selMatrizEspacio.addEventListener('change', (e) => {
      AppState.espacioSeleccionadoMatriz = e.target.value;
      renderMatrizSemanal();
      sounds.playClick && sounds.playClick();
    });
  }

  // Botones de Navegación Rápida Anterior y Siguiente
  const btnPrev = document.getElementById('btnMatrizEspacioPrev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      navegarEspacioMatriz(-1);
    });
  }
  const btnNext = document.getElementById('btnMatrizEspacioNext');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      navegarEspacioMatriz(1);
    });
  }

  // Botón Programar en Aula desde la Matriz
  const btnAgendarMatriz = document.getElementById('btnMatrizAgendarClase');
  if (btnAgendarMatriz) {
    btnAgendarMatriz.addEventListener('click', () => {
      const espId = AppState.espacioSeleccionadoMatriz || (ESPACIOS[0]?.id || 'A-101');
      abrirReservaParaEspacio(espId);
    });
  }

  // Imprimir horario oficial UJED
  const btnImp = document.getElementById('btnImprimirHorario');
  if (btnImp) {
    btnImp.addEventListener('click', () => {
      window.print();
    });
  }
}

function navegarEspacioMatriz(delta) {
  const selEdif = document.getElementById('selectEdificioMatriz')?.value || 'todos';
  const espaciosValidos = selEdif === 'todos' 
    ? ESPACIOS 
    : ESPACIOS.filter(esp => esp.edificioId === selEdif);

  if (espaciosValidos.length === 0) return;
  const currentIdx = espaciosValidos.findIndex(esp => esp.id === AppState.espacioSeleccionadoMatriz);
  let nextIdx = (currentIdx === -1 ? 0 : currentIdx) + delta;
  if (nextIdx < 0) nextIdx = espaciosValidos.length - 1;
  if (nextIdx >= espaciosValidos.length) nextIdx = 0;

  AppState.espacioSeleccionadoMatriz = espaciosValidos[nextIdx].id;
  renderMatrizSemanal();
  sounds.playClick && sounds.playClick();
}

// =============================================================================
// ACTUALIZACIÓN GENERAL Y RENDERIZADO
// =============================================================================
function actualizarContadoresDocentesGlobales() {
  const total = AppState.docentes ? AppState.docentes.length : 0;
  const badge = document.getElementById('tabBadgeDocentes');
  if (badge) badge.textContent = total;
  const countDisp = document.getElementById('docentesCountDisplay');
  if (countDisp && AppState.tabActiva !== 'tab-docentes') {
    countDisp.textContent = total;
  }
}

function actualizarTodo() {
  sincronizarAsignacionesConDocentes();
  actualizarContadoresDocentesGlobales();
  calcularYRenderizarKPIs();
  renderTabActual();
  if (typeof window.renderAdminPanel === 'function') {
    window.renderAdminPanel();
  }
}

function renderTabActual() {
  switch (AppState.tabActiva) {
    case 'tab-monitor':
      renderMonitorEspacios();
      break;
    case 'tab-matriz':
      renderMatrizSemanal();
      break;
    case 'tab-docentes':
      renderDirectorioDocentes();
      break;
    case 'tab-bitacora':
      renderBitacoraEIncidencias();
      break;
    case 'tab-stats':
      renderEstadisticas();
      break;
    case 'tab-admin':
      if (typeof window.renderAdminPanel === 'function') {
        window.renderAdminPanel();
      }
      break;
    case 'tab-cuiag-admin':
      if (typeof window.renderPanelAdminCUIAG === 'function') {
        window.renderPanelAdminCUIAG();
      }
      break;
    case 'tab-docente-horario':
      if (typeof window.renderHorarioDocente === 'function') {
        window.renderHorarioDocente();
      }
      break;
  }
}

// =============================================================================
// TAB 1: MONITOR DE ESPACIOS EN VIVO (KPIs & TARJETAS)
// =============================================================================
function obtenerOcupacionEspacio(espacioId, dia, hora) {
  if (!AppState.asignaciones || !Array.isArray(AppState.asignaciones)) return null;
  return AppState.asignaciones.find(a => {
    if (a.espacioId !== espacioId || a.dia !== dia) return false;
    // Coincidencia exacta de hora de inicio
    if (a.horaInicio === hora) return true;
    // Si la clase tiene un rango definido (ej: de 07:00 a 09:00 y la hora consultada es 08:00)
    if (a.horaFin && a.horaInicio < a.horaFin) {
      return hora >= a.horaInicio && hora < a.horaFin;
    }
    return false;
  });
}

function calcularYRenderizarKPIs() {
  const listaEspacios = (typeof obtenerTodosEspacios === 'function') ? obtenerTodosEspacios() : ESPACIOS;
  
  // Considerar filtro de carrera si está activo
  const espaciosFiltrados = (AppState.filtroCarrera === 'todas')
    ? listaEspacios
    : listaEspacios.filter(esp => !esp.carreraExclusiva || esp.carreraExclusiva === AppState.filtroCarrera);
    
  const totalEspacios = espaciosFiltrados.length;
  let ocupados = 0;
  let llavesActivas = 0;
  let enMantenimiento = 0;
  const docentesEnClaseSet = new Set();

  espaciosFiltrados.forEach(esp => {
    // 1. Verificar si el espacio está inhabilitado o en mantenimiento
    const incActiva = AppState.incidencias ? AppState.incidencias.find(i => 
      i.espacioId === esp.id && i.estado !== 'Resuelta'
    ) : null;
    const esMantenimiento = (esp.estado === 'mantenimiento' || esp.mantenimiento === true || !!incActiva);
    if (esMantenimiento) {
      enMantenimiento++;
      return; // El aula en mantenimiento no computa como aula operativa libre ni ocupada
    }

    // 2. Verificar ocupación en la hora y día consultados
    const asig = obtenerOcupacionEspacio(esp.id, AppState.diaActual, AppState.horaActual);
    if (asig) {
      if (AppState.filtroCarrera === 'todas' || asig.carrera === AppState.filtroCarrera) {
        ocupados++;
        const idDoc = asig.docenteId || asig.docenteNombre;
        if (idDoc) docentesEnClaseSet.add(idDoc);
        if (asig.llaveEntregada) llavesActivas++;
      }
    }
  });

  let docentesEnClase = docentesEnClaseSet.size;
  const totalDocentes = (AppState.docentes && AppState.docentes.length > 0) ? AppState.docentes.length : 1;
  docentesEnClase = Math.min(docentesEnClase, totalDocentes);

  // Espacios operativamente libres: totalEspacios - ocupados - enMantenimiento
  const libres = Math.max(0, totalEspacios - ocupados - enMantenimiento);
  const porcentaje = totalEspacios > 0 ? Math.round((ocupados / totalEspacios) * 100) : 0;

  const kpiTotal = document.getElementById('kpiTotalEspacios');
  if (kpiTotal) {
    kpiTotal.innerHTML = `${totalEspacios} <span class="metric-sub">${AppState.filtroCarrera === 'todas' ? 'Espacios' : 'del Área'}</span>`;
  }

  const kpiOcup = document.getElementById('kpiOcupacionPercent');
  if (kpiOcup) {
    kpiOcup.innerHTML = `${porcentaje}% <span class="metric-sub">${ocupados} de ${totalEspacios}</span>`;
  }

  const kpiDoc = document.getElementById('kpiDocentesEnClase');
  if (kpiDoc) {
    kpiDoc.innerHTML = `${docentesEnClase} <span class="metric-sub">de ${totalDocentes} doc.</span>`;
  }

  const kpiLibres = document.getElementById('kpiAulasLibresCount');
  if (kpiLibres) {
    const textoSub = enMantenimiento > 0 ? `(${enMantenimiento} en mant.)` : 'Disponibles';
    kpiLibres.innerHTML = `${libres} <span class="metric-sub">${textoSub}</span>`;
  }

  const kpiLlaves = document.getElementById('kpiLlavesActivas');
  if (kpiLlaves) {
    const llavesPrestadasBitacora = AppState.bitacora ? AppState.bitacora.filter(b => (b.estadoLlave || (b.llaveEntregada && !b.horaDevolucion ? 'prestada' : '')) === 'prestada').length : 0;
    const llavesTotal = Math.max(llavesActivas, llavesPrestadasBitacora);
    kpiLlaves.innerHTML = `${llavesTotal} <span class="metric-sub">${llavesTotal === 1 ? 'Entregada' : 'Entregadas'}</span>`;
  }
}

function renderMonitorEspacios() {
  const container = document.getElementById('spacesGridContainer');
  container.innerHTML = '';

  // Filtrar espacios
  const espaciosFiltrados = ESPACIOS.filter(esp => {
    // Filtro por tipo
    if (AppState.filtroTipoEspacio !== 'todos' && esp.tipo !== AppState.filtroTipoEspacio) {
      return false;
    }

    // Filtro por edificio
    if (AppState.filtroEdificio !== 'todos' && esp.edificioId !== AppState.filtroEdificio) {
      return false;
    }

    // Comprobar si hay asignación y mantenimiento en este momento
    const asig = obtenerOcupacionEspacio(esp.id, AppState.diaActual, AppState.horaActual);
    const incActiva = AppState.incidencias ? AppState.incidencias.find(i => 
      i.espacioId === esp.id && i.estado !== 'Resuelta'
    ) : null;
    const esMantenimiento = (esp.estado === 'mantenimiento' || esp.mantenimiento === true || !!incActiva);

    // Filtro rápido de estado operativo (Consulta rápida para Prefectura y Staff)
    if (AppState.filtroEstadoRapido && AppState.filtroEstadoRapido !== 'todos') {
      if (AppState.filtroEstadoRapido === 'libres') {
        if (asig || esMantenimiento) return false;
      } else if (AppState.filtroEstadoRapido === 'ocupados') {
        if (!asig || esMantenimiento) return false;
      } else if (AppState.filtroEstadoRapido === 'mantenimiento') {
        if (!esMantenimiento) return false;
      } else if (AppState.filtroEstadoRapido === 'llaves') {
        const tieneLlave = (asig && asig.llaveEntregada) || (AppState.bitacora && AppState.bitacora.some(b => b.espacioId === esp.id && (b.estadoLlave || (b.llaveEntregada && !b.horaDevolucion ? 'prestada' : '')) === 'prestada'));
        if (!tieneLlave) return false;
      }
    }

    // Filtro por carrera
    if (AppState.filtroCarrera !== 'todas') {
      if (asig && asig.carrera !== AppState.filtroCarrera) return false;
      if (!asig && esp.carreraExclusiva && esp.carreraExclusiva !== AppState.filtroCarrera) return false;
    }

    // Filtro por texto de búsqueda
    if (AppState.busquedaEspacio) {
      const matchId = esp.id.toLowerCase().includes(AppState.busquedaEspacio);
      const matchNom = esp.nombre.toLowerCase().includes(AppState.busquedaEspacio);
      const matchEdif = esp.edificio.toLowerCase().includes(AppState.busquedaEspacio);
      const matchDoc = asig ? asig.docenteNombre.toLowerCase().includes(AppState.busquedaEspacio) : false;
      const matchMat = asig ? asig.materia.toLowerCase().includes(AppState.busquedaEspacio) : false;
      if (!matchId && !matchNom && !matchEdif && !matchDoc && !matchMat) return false;
    }

    return true;
  });

  if (espaciosFiltrados.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 6px;">No se encontraron espacios coincidentes</h3>
        <p style="font-size: 0.85rem;">Intenta cambiar el filtro de estado, edificio, carrera o el término de búsqueda.</p>
      </div>
    `;
    return;
  }

  let ultimoEdificioId = null;

  espaciosFiltrados.forEach(esp => {
    // Si cambia de edificio, insertar encabezado divisor
    if (esp.edificioId !== ultimoEdificioId) {
      const edifInfo = EDIFICIOS[esp.edificioId] || { nombre: esp.edificio, icono: '🏢', etiqueta: '' };
      const totalEnEdif = espaciosFiltrados.filter(e => e.edificioId === esp.edificioId).length;

      const headerSection = document.createElement('div');
      headerSection.className = 'building-section-header';
      headerSection.innerHTML = `
        <div class="building-section-title">
          <span>${edifInfo.icono}</span> ${edifInfo.nombre.toUpperCase()} 
          <span style="font-size: 0.78rem; font-weight: 600; opacity: 0.75; margin-left: 8px;">(${edifInfo.descripcion || edifInfo.etiqueta || ''})</span>
        </div>
        <div class="building-section-count">${totalEnEdif} ${totalEnEdif === 1 ? 'Espacio' : 'Aulas/Espacios'}</div>
      `;
      container.appendChild(headerSection);
      ultimoEdificioId = esp.edificioId;
    }

    const asig = obtenerOcupacionEspacio(esp.id, AppState.diaActual, AppState.horaActual);
    const incActiva = AppState.incidencias ? AppState.incidencias.find(i => 
      i.espacioId === esp.id && i.estado !== 'Resuelta'
    ) : null;
    const esMantenimiento = (esp.estado === 'mantenimiento' || esp.mantenimiento === true || !!incActiva);

    let proximaAsig = null;
    if (!asig && !esMantenimiento) {
      const idxHora = FRANJAS_HORARIAS.findIndex(f => f.inicio === AppState.horaActual);
      if (idxHora !== -1 && idxHora + 1 < FRANJAS_HORARIAS.length) {
        const horaSig = FRANJAS_HORARIAS[idxHora + 1].inicio;
        proximaAsig = obtenerOcupacionEspacio(esp.id, AppState.diaActual, horaSig);
      }
    }

    const card = document.createElement('div');
    card.className = 'space-card';

    // Determinar badge de tipo
    let tipoIcon = '🏫';
    if (esp.tipo === 'laboratorio') tipoIcon = '🔬';
    else if (esp.tipo === 'audiovisual') tipoIcon = '📽️';
    else if (esp.tipo === 'cancha') tipoIcon = '⚽';
    else if (esp.tipo === 'domo') tipoIcon = '🎪';

    // Construir píldora de estado y cuadro de ocupación para los 4 estados
    let statusPillHtml = '';
    let occupancyHtml = '';

    if (esMantenimiento) {
      statusPillHtml = `<span class="status-pill maintenance">⚠️ MANTENIMIENTO</span>`;
      const descMaint = incActiva ? incActiva.descripcion : (esp.motivoMantenimiento || 'Espacio temporalmente deshabilitado por mantenimiento preventivo');
      const repMaint = incActiva ? (incActiva.reportadoPor || 'Personal') : 'Servicios Generales';
      occupancyHtml = `
        <div class="occupancy-box status-maintenance-border">
          <div class="occ-time-row">
            <span class="occ-time-badge" style="color: #ef4444;">🔧 En Mantenimiento</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: #f87171;">${incActiva ? ('Prioridad ' + (incActiva.prioridad || 'Alta')) : 'Programado'}</span>
          </div>
          <div class="occ-subject" style="color: #fca5a5;">${descMaint}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
            <span>Reportó: ${repMaint} ${incActiva && incActiva.fechaHora ? '(' + incActiva.fechaHora + ')' : ''}</span>
          </div>
        </div>
      `;
    } else if (asig) {
      let borderClass = '';
      if (asig.carrera === 'medicina') borderClass = 'busy-border-med';
      else if (asig.carrera === 'psicologia') borderClass = 'busy-border-psi';
      else if (asig.carrera === 'nutricion') borderClass = 'busy-border-nut';
      else borderClass = 'busy-border-gen';

      const carInfo = CARRERAS[asig.carrera] || { icono: '📚', abreviatura: 'GRAL' };
      const carreraBadgeHtml = `<span class="career-tag-pill pill-${asig.carrera === 'general' ? 'dep' : (asig.carrera === 'medicina' ? 'med' : (asig.carrera === 'psicologia' ? 'psi' : 'nut'))}" style="font-size: 0.68rem;">${carInfo.icono} ${carInfo.abreviatura}</span>`;

      statusPillHtml = `<span class="status-pill busy"><span class="dot-pulse"></span> EN CLASE</span>`;
      occupancyHtml = `
        <div class="occupancy-box ${borderClass}" onclick="mostrarDetalleAsignacion('${asig.id}')" style="cursor: pointer;" title="Clic para ver detalle de la clase">
          <div class="occ-time-row">
            <span class="occ-time-badge">⏰ ${asig.horaInicio} - ${asig.horaFin}</span>
            ${carreraBadgeHtml}
          </div>
          <div class="occ-subject">${asig.materia}</div>
          <div class="occ-teacher">
            <span>👨‍🏫 ${asig.docenteTitulo}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.72rem; color: var(--text-muted);">
            <span>👥 ${asig.grupo} (${asig.alumnosRegistrados} al.)</span>
            <span>${asig.llaveEntregada ? '🔑 Llave Entregada' : '🔒 Sin entrega de llave'}</span>
          </div>
        </div>
      `;
    } else if (proximaAsig) {
      statusPillHtml = `<span class="status-pill upcoming">⏳ PRÓX. ${proximaAsig.horaInicio}</span>`;
      const carInfo = CARRERAS[proximaAsig.carrera] || { icono: '📚', abreviatura: 'GRAL' };
      occupancyHtml = `
        <div class="occupancy-box status-upcoming-border" onclick="mostrarDetalleAsignacion('${proximaAsig.id}')" style="cursor: pointer;" title="Clic para ver detalle de la próxima clase">
          <div class="occ-time-row">
            <span class="occ-time-badge" style="color: #d97706; font-weight: 800;">🟢 Libre ahora • Próx. a las ${proximaAsig.horaInicio}</span>
            <span class="career-tag-pill pill-${proximaAsig.carrera === 'general' ? 'dep' : (proximaAsig.carrera === 'medicina' ? 'med' : (proximaAsig.carrera === 'psicologia' ? 'psi' : 'nut'))}" style="font-size: 0.68rem;">${carInfo.icono} ${carInfo.abreviatura}</span>
          </div>
          <div class="occ-subject">${proximaAsig.materia}</div>
          <div class="occ-teacher">
            <span>👨‍🏫 ${proximaAsig.docenteTitulo}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.72rem; color: var(--text-muted);">
            <span>👥 ${proximaAsig.grupo}</span>
            <span style="color: #d97706; font-weight: 600;">Se ocupa en la sig. hora</span>
          </div>
        </div>
      `;
    } else {
      statusPillHtml = `<span class="status-pill free">● LIBRE AHORA</span>`;
      occupancyHtml = `
        <div class="occupancy-box" onclick="verHorarioCompletoEspacio('${esp.id}')" style="cursor: pointer;" title="Clic para consultar cronograma semanal">
          <div class="occ-empty-msg">
            <span style="font-size: 1.25rem;">✨</span>
            <span style="font-weight: 700; color: var(--status-free);">Espacio libre en este bloque</span>
            <span style="font-size: 0.72rem;">Disponible para impartir clase o práctica</span>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="space-card-header">
          <span class="space-type-badge type-${esp.tipo}">
            ${tipoIcon} ${esp.tipo.toUpperCase()}
          </span>
          ${statusPillHtml}
        </div>

        <div class="space-id-title">
          <span style="font-weight: 800; color: var(--accent-primary); font-size: 1.15rem;">${esp.id}</span>
          <span class="space-name-tag" style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-left: 4px;">${esp.nombre}</span>
          <span class="capacity-pill" style="margin-left: auto; font-size: 0.74rem; font-weight: 600; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 12px;">👥 ${esp.capacidad} pers.</span>
        </div>
        <div class="space-building">📍 ${esp.edificio}</div>
      </div>

      <!-- Cuadro de ocupación en 4 estados -->
      ${occupancyHtml}

      <!-- Equipamiento disponible -->
      <div class="space-equipment-tags">
        ${esp.equipamiento.slice(0, 4).map(eq => `<span class="equip-tag">✓ ${eq}</span>`).join('')}
        ${esp.equipamiento.length > 4 ? `<span class="equip-tag">+${esp.equipamiento.length - 4}</span>` : ''}
      </div>

      <!-- Acciones de Tarjeta -->
      <div class="space-card-actions">
        ${asig ? `
          <button class="btn-card-action btn-card-free" onclick="liberarEspacio('${asig.id}')" title="Desocupar espacio de inmediato">
            🔓 Desocupar
          </button>
          <button class="btn-card-action btn-edit-asig" onclick="editarAsignacion('${asig.id}')" title="Editar materia, docente u horario">
            ✏️ Editar
          </button>
          <button class="btn-card-action btn-checkin" onclick="abrirCheckinParaEspacio('${esp.id}', '${asig.docenteId}')">
            📋 Check-in
          </button>
        ` : `
          <button class="btn-card-action btn-assign" onclick="abrirReservaParaEspacio('${esp.id}')">
            ✨ Asignar Espacio
          </button>
        `}
        <button class="btn-card-action btn-card-schedule" onclick="verHorarioCompletoEspacio('${esp.id}')" title="Ver horario semanal de este espacio">
          📅 Ver Horario Semanal
        </button>
        <button class="btn-card-action btn-edit-cap" onclick="editarCapacidadEspacio('${esp.id}')" title="Modificar capacidad de alumnos">
          ✏️ Capacidad
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// =============================================================================
// TAB 2: MATRIZ SEMANAL DE HORARIOS
// =============================================================================
function renderMatrizSemanal() {
  const tbody = document.getElementById('tbodyMatrizHorarios');
  if (!tbody) return;
  tbody.innerHTML = '';

  let espacioIdActual = AppState.espacioSeleccionadoMatriz;
  if (!espacioIdActual || !ESPACIOS.some(e => e.id === espacioIdActual)) {
    espacioIdActual = ESPACIOS[0]?.id || 'A-101';
    AppState.espacioSeleccionadoMatriz = espacioIdActual;
  }
  const espActual = ESPACIOS.find(e => e.id === espacioIdActual) || ESPACIOS[0];

  // 1. Selector de Edificio en Matriz
  const selEdificio = document.getElementById('selectEdificioMatriz');
  if (selEdificio && selEdificio.options.length <= 1) {
    selEdificio.innerHTML = '<option value="todos">🏢 Todos los Edificios</option>';
    Object.keys(EDIFICIOS).forEach(edifKey => {
      const edif = EDIFICIOS[edifKey];
      const opt = document.createElement('option');
      opt.value = edifKey;
      opt.textContent = `${edif.icono} ${edif.nombre} (${edif.etiqueta || ''})`;
      selEdificio.appendChild(opt);
    });
  }

  // 2. Selector de Espacios agrupados o filtrados
  const selEspacio = document.getElementById('selectEspacioMatriz');
  if (selEspacio) {
    const edifFiltro = selEdificio?.value || 'todos';
    const carFiltro = AppState.filtroCarrera || 'todas';

    selEspacio.innerHTML = '';
    Object.keys(EDIFICIOS).forEach(edifKey => {
      if (edifFiltro !== 'todos' && edifKey !== edifFiltro) return;

      const edif = EDIFICIOS[edifKey];
      const espaciosEdif = ESPACIOS.filter(e => {
        if (e.edificioId !== edifKey) return false;
        if (carFiltro !== 'todas' && e.carreraExclusiva && e.carreraExclusiva !== carFiltro) return false;
        return true;
      });

      if (espaciosEdif.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${edif.icono} ${edif.nombre.toUpperCase()}`;
        espaciosEdif.forEach(esp => {
          const opt = document.createElement('option');
          opt.value = esp.id;
          opt.textContent = `${esp.id} — ${esp.nombre} (${esp.capacidad} pers.)`;
          if (esp.id === espacioIdActual) opt.selected = true;
          optgroup.appendChild(opt);
        });
        selEspacio.appendChild(optgroup);
      }
    });

    if (espacioIdActual) selEspacio.value = espacioIdActual;
  }

  // 3. Banner Informativo del Espacio Seleccionado
  const banner = document.getElementById('matrixSpaceBanner');
  if (banner && espActual) {
    const asignacionesEspacio = AppState.asignaciones.filter(a => a.espacioId === espacioIdActual);
    let totalHorasSemana = 0;
    const materiasUnicas = new Set();
    const docentesUnicos = new Set();

    asignacionesEspacio.forEach(a => {
      if (a.materia) materiasUnicas.add(a.materia);
      if (a.docenteTitulo) docentesUnicos.add(a.docenteTitulo);
      const hIni = parseInt(a.horaInicio.split(':')[0], 10);
      const hFin = parseInt((a.horaFin || '22:00').split(':')[0], 10);
      totalHorasSemana += Math.max(1, hFin - hIni);
    });

    const pctOcupacion = Math.min(100, Math.round((totalHorasSemana / 90) * 100));

    banner.innerHTML = `
      <div class="banner-space-title">
        <span class="banner-badge">${espActual.id}</span>
        <span class="banner-name">${espActual.nombre}</span>
        <span class="banner-building">📍 ${espActual.edificio}</span>
      </div>
      <div class="banner-space-metrics">
        <span class="banner-stat">👥 Capacidad: <strong>${espActual.capacidad} alumnos</strong></span>
        <span class="banner-stat">🏷️ Tipo: <strong>${(espActual.tipo || 'Aula').toUpperCase()}</strong></span>
        <span class="banner-stat">⚡ Ocupación: <strong>${totalHorasSemana} hrs / 90 (${pctOcupacion}%)</strong></span>
        <span class="banner-stat">📚 Materias: <strong>${materiasUnicas.size}</strong> • 👨‍🏫 Docentes: <strong>${docentesUnicos.size}</strong></span>
      </div>
    `;
  }

  // 4. Resaltado dinámico del Día Actual en los encabezados
  const diasHeaderMap = {
    'Lunes': 'thDiaLunes',
    'Martes': 'thDiaMartes',
    'Miércoles': 'thDiaMiercoles',
    'Jueves': 'thDiaJueves',
    'Viernes': 'thDiaViernes',
    'Sábado': 'thDiaSabado'
  };

  Object.keys(diasHeaderMap).forEach(d => {
    const th = document.getElementById(diasHeaderMap[d]);
    if (th) {
      if (d === AppState.diaActual) {
        th.classList.add('th-day-current');
        th.innerHTML = `${d} <span style="font-size:0.65rem; color:#fde047; font-weight:800;">(HOY)</span>`;
      } else {
        th.classList.remove('th-day-current');
        th.textContent = d;
      }
    }
  });

  // 5. Generar filas para cada franja horaria (07:00 a 22:00)
  FRANJAS_HORARIAS.forEach(franja => {
    const tr = document.createElement('tr');

    // Celda de hora sticky (resaltada si coincide con la hora actual)
    const tdHora = document.createElement('td');
    const esHoraActual = franja.inicio === AppState.horaActual;
    tdHora.className = `time-cell ${esHoraActual ? 'time-cell-current' : ''}`;
    tdHora.innerHTML = `
      <strong>${franja.inicio}</strong><br>
      <span style="color: var(--text-dim); font-size: 0.68rem;">${franja.fin}</span>
      ${esHoraActual ? '<br><span style="font-size:0.58rem; color:#fde047; font-weight:800;">(AHORA)</span>' : ''}
    `;
    tr.appendChild(tdHora);

    // Celdas para cada día de Lunes a Sábado
    DIAS_SEMANA.forEach(dia => {
      const tdDia = document.createElement('td');
      const esDiaYHoraActual = (dia === AppState.diaActual && franja.inicio === AppState.horaActual);
      if (esDiaYHoraActual) tdDia.classList.add('slot-cell-now');

      // Buscar si hay clase cubriendo este horario (soporta intervalos multihomarios)
      const asig = AppState.asignaciones.find(a => 
        a.espacioId === espacioIdActual && 
        a.dia === dia && 
        (franja.inicio >= a.horaInicio && franja.inicio < a.horaFin)
      );

      if (asig) {
        let cardColorClass = 'slot-card-med';
        if (asig.carrera === 'psicologia') cardColorClass = 'slot-card-psi';
        else if (asig.carrera === 'nutricion') cardColorClass = 'slot-card-nut';
        else if (asig.carrera === 'general') cardColorClass = 'slot-card-gen';

        const carInfo = (typeof CARRERAS !== 'undefined' && CARRERAS[asig.carrera]) 
          ? CARRERAS[asig.carrera] 
          : { icono: '📚', abreviatura: 'GRAL' };

        const esInicioClase = (asig.horaInicio === franja.inicio);

        if (esInicioClase) {
          const hIniNum = parseInt(asig.horaInicio.split(':')[0], 10);
          const hFinNum = parseInt((asig.horaFin || '22:00').split(':')[0], 10);
          const duracion = Math.max(1, hFinNum - hIniNum);

          tdDia.innerHTML = `
            <div class="matrix-slot-card ${cardColorClass}" onclick="mostrarDetalleAsignacion('${asig.id}')" title="Gestionar clase: ${asig.materia} (${asig.horaInicio} - ${asig.horaFin})">
              <div class="slot-title">${asig.materia}</div>
              <div class="slot-teacher">👨‍🏫 ${asig.docenteTitulo}</div>
              <div class="slot-meta">
                <span>👥 ${asig.grupo}</span>
                <span>⏰ ${asig.horaInicio}-${asig.horaFin} ${duracion > 1 ? `(${duracion}h)` : ''}</span>
              </div>
            </div>
          `;
        } else {
          // Bloque intermedio de clase multihomaria
          tdDia.innerHTML = `
            <div class="matrix-slot-card ${cardColorClass} slot-card-continuation" onclick="mostrarDetalleAsignacion('${asig.id}')" title="Continuación: ${asig.materia} (${asig.horaInicio} a ${asig.horaFin})">
              <div class="slot-title" style="font-size: 0.74rem;">↳ ${asig.materia}</div>
              <div class="slot-meta" style="font-size: 0.65rem;">
                <span>Bloque ${asig.horaInicio}-${asig.horaFin}</span>
                <span>${carInfo.icono}</span>
              </div>
            </div>
          `;
        }
      } else {
        // Celda Libre
        tdDia.innerHTML = `
          <div class="matrix-slot-free" 
               onclick="abrirReservaRapida('${espacioIdActual}', '${dia}', '${franja.inicio}')" 
               title="Libre: Clic para agendar clase el ${dia} de ${franja.inicio} a ${franja.fin}">
            <span class="slot-free-text">🟢 Libre</span>
            <span class="slot-free-hover-action">+ Agendar</span>
          </div>
        `;
      }

      tr.appendChild(tdDia);
    });

    tbody.appendChild(tr);
  });
}

// =============================================================================
// TAB 3: DIRECTORIO DE +100 DOCENTES
// =============================================================================
function renderDirectorioDocentes() {
  const container = document.getElementById('teachersGridContainer');
  container.innerHTML = '';

  const docentesFiltrados = AppState.docentes.filter(doc => {
    // Filtro por carrera
    if (AppState.filtroCarrera !== 'todas' && doc.carrera !== AppState.filtroCarrera) {
      return false;
    }

    // Filtro por búsqueda
    if (AppState.busquedaDocente) {
      const q = AppState.busquedaDocente;
      const matchNom = doc.nombre.toLowerCase().includes(q);
      const matchTit = doc.titulo.toLowerCase().includes(q);
      const matchEsp = doc.especialidad.toLowerCase().includes(q);
      const matchMat = doc.materias.some(m => m.toLowerCase().includes(q));
      if (!matchNom && !matchTit && !matchEsp && !matchMat) return false;
    }

    return true;
  });

  document.getElementById('docentesCountDisplay').textContent = docentesFiltrados.length;
  const badgeDoc = document.getElementById('tabBadgeDocentes');
  if (badgeDoc) badgeDoc.textContent = AppState.docentes.length;

  docentesFiltrados.forEach(doc => {
    // Verificar si el docente está impartiendo clase ahora mismo
    const claseActiva = AppState.asignaciones.find(a => 
      a.docenteId === doc.id && 
      a.dia === AppState.diaActual && 
      a.horaInicio === AppState.horaActual
    );

    // Contar total de horas asignadas semanalmente
    const totalClasesSemana = AppState.asignaciones.filter(a => a.docenteId === doc.id).length;

    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.onclick = () => abrirModalDocente(doc.id);

    // Avatar iniciales
    const partes = doc.nombre.split(' ');
    const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
    const avatarClass = `avatar-${doc.carrera === 'general' ? 'gen' : (doc.carrera === 'medicina' ? 'med' : (doc.carrera === 'psicologia' ? 'psi' : 'nut'))}`;
    const carInfo = CARRERAS[doc.carrera] || CARRERAS.general;

    card.innerHTML = `
      <div class="teacher-card-top">
        <div class="teacher-avatar ${avatarClass}">
          ${iniciales}
        </div>
        <div class="teacher-info">
          <div class="teacher-name">${doc.titulo}</div>
          <div class="teacher-specialty">${doc.especialidad}</div>
          <div style="font-size: 0.72rem; color: #10b981; font-weight: 700; font-family: var(--font-mono); margin-top: 2px;">
            🆔 Matrícula: ${doc.id}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            ${carInfo.icono} ${carInfo.nombre}
          </div>
        </div>
      </div>

      <div class="teacher-details-list">
        <div class="teacher-detail-item">
          <span>Carga Horaria Semanal:</span>
          <span class="teacher-detail-val">${totalClasesSemana} hrs (${totalClasesSemana} sesiones/sem)</span>
        </div>
        <div class="teacher-detail-item">
          <span>Contacto / Tel.:</span>
          <span class="teacher-detail-val" style="font-family: var(--font-mono); font-size: 0.68rem;">${doc.telefono}</span>
        </div>
      </div>

      <div class="teacher-current-status">
        ${claseActiva ? `
          <span style="color: #f87171; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            <span class="dot-pulse" style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></span>
            En Clase: ${claseActiva.espacioId}
          </span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${claseActiva.horaInicio}-${claseActiva.horaFin}</span>
        ` : `
          <span style="color: var(--status-free); font-weight: 700;">🟢 Disponible Ahora</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Sin clase activa</span>
        `}
      </div>

      <div style="display:flex; gap:6px; margin-top:10px; flex-wrap: wrap;">
        <button type="button" class="btn-pdf-docente" title="Descargar horario en PDF"
          onclick="event.stopPropagation(); descargarHorarioDocentePDF('${doc.id}')"
          style="flex:1; min-width: 65px; padding:6px 8px; border-radius:8px; border:1px solid var(--accent-primary); background:transparent; color:var(--accent-primary); font-weight:700; cursor:pointer; font-size:0.75rem;">
          📄 PDF
        </button>
        <button type="button" class="btn-whatsapp-docente" title="Enviar horario completo por WhatsApp"
          onclick="event.stopPropagation(); enviarHorarioWhatsAppDocente('${doc.id}')"
          style="flex:1; min-width: 80px; padding:6px 8px; border-radius:8px; border:none; background:#25D366; color:#ffffff; font-weight:700; cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:0 2px 5px rgba(37,211,102,0.25);">
          💬 WhatsApp
        </button>
        <button type="button" title="Copiar enlace directo para este docente"
          onclick="event.stopPropagation(); copiarEnlacePortalDocente('${doc.id}')"
          style="padding:6px 8px; border-radius:8px; border:1px solid #10b981; background:rgba(16,185,129,0.08); color:#10b981; font-weight:700; cursor:pointer; font-size:0.75rem;">
          🔗 Link
        </button>
        <button type="button" title="Gestionar contraseña de este docente"
          onclick="event.stopPropagation(); cambiarContrasenaDocente('${doc.id}')"
          style="padding:6px 9px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-surface); color:var(--text-main); font-weight:700; cursor:pointer; font-size:0.75rem;">
          🔑
        </button>
        <button type="button" class="btn-eliminar-docente" title="Eliminar docente del sistema"
          onclick="event.stopPropagation(); eliminarDocente('${doc.id}')"
          style="padding:6px 10px; border-radius:8px; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.08); color:#ef4444; font-weight:700; cursor:pointer; font-size:0.75rem;">
          🗑️
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.eliminarDocente = function(docenteId) {
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') {
    alert('⛔ Solo Administradores y Superadmin pueden eliminar docentes.');
    return;
  }
  const doc = AppState.docentes.find(d => String(d.id) === String(docenteId));
  if (!doc) return;

  const tieneAsignaciones = AppState.asignaciones.filter(a => String(a.docenteId) === String(docenteId)).length;
  let mensaje = `¿Estás seguro de eliminar a "${doc.titulo}"?`;
  if (tieneAsignaciones > 0) {
    mensaje += `\n\n⚠️ Este docente tiene ${tieneAsignaciones} clase(s) asignada(s). Sus asignaciones quedarán liberadas.`;
  }

  if (!confirm(mensaje)) return;

  // 1. Quitar docente de la lista
  AppState.docentes = AppState.docentes.filter(d => String(d.id) !== String(docenteId));

  // 2. Liberar sus asignaciones de aula para que no queden huérfanas
  if (tieneAsignaciones > 0) {
    AppState.asignaciones = AppState.asignaciones.filter(a => String(a.docenteId) !== String(docenteId));
  }

  // 3. Persistir en localStorage
  guardarDatosLocales();

  // Registrar en Auditoría
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Baja Docente', 'Docentes', doc.titulo, `Docente eliminado del directorio institucional. ${tieneAsignaciones} clases desvinculadas.`, 'critica');
  }

  // 4. Actualizar vistas
  cerrarModal('modalDocente');
  actualizarTodo();
  if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
  mostrarToast(`Docente ${doc.titulo} eliminado correctamente.`, 'info');
};

function abrirModalDocente(docenteId) {
  const doc = AppState.docentes.find(d => String(d.id) === String(docenteId));
  if (!doc) return;

  const modal = document.getElementById('modalDocente');
  const title = document.getElementById('modalDocenteTitle');
  const body = document.getElementById('modalDocenteBody');
  const btnAsignar = document.getElementById('btnAsignarAulaDocente');

  title.innerHTML = `<span>👨‍🏫</span> ${doc.titulo}`;

  // Clases del docente (coincidencia por ID o por nombre)
  const clases = AppState.asignaciones.filter(a => 
    String(a.docenteId) === String(doc.id) ||
    (doc.nombre && a.docenteNombre && a.docenteNombre.toLowerCase().trim() === doc.nombre.toLowerCase().trim())
  );
  const carInfo = (typeof CARRERAS !== 'undefined' && CARRERAS[doc.carrera]) ? CARRERAS[doc.carrera] : { nombre: doc.carrera };

  const rol = window.rolActual || localStorage.getItem('fcs_rol') || 'superadmin';
  const esStaff = ['superadmin', 'admin'].includes(rol);

  body.innerHTML = `
    <div style="display: flex; gap: 16px; align-items: center; background: var(--bg-card); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
      <div class="teacher-avatar avatar-${doc.carrera === 'general' ? 'gen' : (doc.carrera === 'medicina' ? 'med' : (doc.carrera === 'psicologia' ? 'psi' : 'nut'))}" style="width: 60px; height: 60px; font-size: 1.4rem;">
        ${doc.nombre.charAt(0)}
      </div>
      <div style="flex: 1;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${doc.nombre}</h3>
        <p style="font-size: 0.76rem; color: var(--text-dim); margin-top: 4px; display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
          <span>✉️ ${doc.email && doc.email !== 'Sin registrar' ? doc.email : 'Sin correo registrado'}</span>
          <span>|</span>
          <span>📞 ${doc.telefono && doc.telefono !== 'Sin registrar' ? doc.telefono : 'Sin teléfono'}</span>
          <button type="button" onclick="enviarHorarioWhatsAppDocente('${doc.id}')" title="Enviar horario completo a este docente por WhatsApp" style="background:#25D366; color:#ffffff; border:none; border-radius:6px; padding:3px 9px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 5px rgba(37,211,102,0.25);">
            💬 WhatsApp
          </button>
        </p>
      </div>
    </div>

    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="font-size: 0.9rem; font-weight: 800; margin: 0; color: var(--text-main);">
          📅 Horario Semanal Asignado (${clases.length} clases programadas)
        </h4>
        ${esStaff ? `
          <button type="button" class="btn-secondary btn-sm" onclick="cerrarModal('modalDocente'); abrirModalReservaConDocente('${doc.id}', '${doc.carrera}')" style="padding: 4px 10px; font-size: 0.74rem; font-weight: 700; color: var(--accent-primary); border-color: rgba(37,99,235,0.4);">
            + Asignar Horario
          </button>
        ` : ''}
      </div>
      <div style="max-height: 260px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
        <table class="custom-table" style="font-size: 0.76rem;">
          <thead>
            <tr>
              <th>Día</th>
              <th>Horario</th>
              <th>Espacio</th>
              <th>Materia</th>
              <th>Grupo</th>
              ${esStaff ? '<th style="text-align: center; width: 150px;">Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${clases.length > 0 ? clases.map(c => `
              <tr>
                <td><strong>${c.dia}</strong></td>
                <td><span style="font-family: var(--font-mono); font-weight: 700;">${c.horaInicio} - ${c.horaFin}</span></td>
                <td><span class="career-tag-pill" style="font-weight: 700;">${c.espacioId}</span></td>
                <td>${c.materia}</td>
                <td>${c.grupo}</td>
                ${esStaff ? `
                  <td style="text-align: center; white-space: nowrap;">
                    <button type="button" class="btn-secondary btn-sm" onclick="cerrarModal('modalDocente'); editarAsignacion('${c.id}')" title="Editar este horario" style="padding: 4px 10px; font-size: 0.74rem; font-weight: 700; color: var(--accent-primary); border-color: rgba(37,99,235,0.4); margin-right: 4px; cursor: pointer;">
                      ✏️ Editar
                    </button>
                    <button type="button" class="btn-secondary btn-sm" onclick="cerrarModal('modalDocente'); liberarEspacio('${c.id}')" title="Desocupar o eliminar esta clase" style="padding: 4px 10px; font-size: 0.74rem; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.4); cursor: pointer;">
                      🗑️ Liberar
                    </button>
                  </td>
                ` : ''}
              </tr>
            `).join('') : `
              <tr><td colspan="${esStaff ? 6 : 5}" style="text-align: center; color: var(--text-dim); padding: 20px;">No tiene clases programadas actualmente.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const btnEliminar = document.getElementById('btnModalEliminarDocente');
  if (btnEliminar) {
    if (window.rolActual === 'docente' || window.rolActual === 'prefectura') {
      btnEliminar.style.display = 'none';
    } else {
      btnEliminar.style.display = 'inline-block';
      btnEliminar.onclick = () => {
        eliminarDocente(doc.id);
      };
    }
  }

  const btnWhatsApp = document.getElementById('btnModalWhatsAppDocente');
  if (btnWhatsApp) {
    btnWhatsApp.onclick = () => {
      enviarHorarioWhatsAppDocente(doc.id);
    };
  }

  btnAsignar.onclick = () => {
    cerrarModal('modalDocente');
    abrirModalReservaConDocente(doc.id, doc.carrera);
  };

  abrirModal('modalDocente');
}

/**
 * Envío automatizado de horario por WhatsApp a docentes
 * Genera un mensaje institucional estructurado y abre la API oficial de WhatsApp
 */
window.enviarHorarioWhatsAppDocente = function(docenteId, customTelefono = null) {
  const doc = (AppState.docentes || []).find(d => String(d.id) === String(docenteId));
  if (!doc) {
    mostrarToast('No se encontró el registro del docente', 'error');
    return;
  }

  // 1. Obtener y limpiar teléfono
  let tel = customTelefono || doc.telefono || '';
  let digitos = String(tel).replace(/\D/g, '');

  // Si no tiene teléfono o tiene menos de 10 dígitos, solicitar al usuario
  if (!digitos || digitos.length < 10) {
    const inputTel = prompt(
      `El docente "${doc.nombre}" no tiene un número celular registrado o es inválido.\n\nPor favor, ingresa el número de WhatsApp a 10 dígitos (ej. 8711234567):`,
      digitos || ''
    );
    if (!inputTel) return; // cancelado por usuario
    digitos = String(inputTel).replace(/\D/g, '');
    if (digitos.length < 10) {
      alert('⚠️ El número de celular debe contener al menos 10 dígitos.');
      return;
    }
    // Formatear y actualizar en memoria/localStorage
    doc.telefono = digitos.length === 10
      ? `+52 ${digitos.substring(0, 3)} ${digitos.substring(3, 6)} ${digitos.substring(6)}`
      : `+${digitos}`;
    if (typeof guardarDatosLocales === 'function') guardarDatosLocales();
    mostrarToast('Teléfono de docente guardado en el sistema.', 'info');
  }

  // Si son 10 dígitos (formato estándar de México), anteponer código 52
  let waPhone = digitos;
  if (waPhone.length === 10) {
    waPhone = '52' + waPhone;
  }

  // 2. Obtener clases del docente
  const clases = (AppState.asignaciones || []).filter(a => 
    String(a.docenteId) === String(doc.id) ||
    (doc.nombre && a.docenteNombre && a.docenteNombre.toLowerCase().trim() === doc.nombre.toLowerCase().trim())
  );

  const ordenDias = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
  clases.sort((a, b) => (ordenDias[a.dia] || 9) - (ordenDias[b.dia] || 9) || a.horaInicio.localeCompare(b.horaInicio));

  const ciclo = (AppState.config && AppState.config.cicloActivo) ? AppState.config.cicloActivo : '2026-A';
  const totalHoras = clases.length;

  // 3. Redactar mensaje con formato institucional para WhatsApp
  let msg = `🏛️ *FACULTAD DE CIENCIAS DE LA SALUD - UJED*\n`;
  msg += `📋 *HORARIO ACADÉMICO OFICIAL*\n`;
  msg += `🗓️ *Ciclo Escolar:* ${ciclo}\n\n`;
  msg += `👨‍🏫 *Docente:* ${doc.nombre}\n`;
  msg += `🆔 *Matrícula:* ${doc.id}\n`;
  msg += `🎓 *Carrera:* ${doc.carrera ? doc.carrera.toUpperCase() : 'FACSA'}\n`;
  msg += `📚 *Carga Horaria:* ${totalHoras} clase(s) semanales\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (clases.length === 0) {
    msg += `ℹ️ _Actualmente no tiene horarios de clase programados en el sistema institucional._\n\n`;
  } else {
    // Agrupar por día
    const porDia = {};
    clases.forEach(c => {
      const d = c.dia || 'General';
      if (!porDia[d]) porDia[d] = [];
      porDia[d].push(c);
    });

    Object.keys(porDia).forEach(dia => {
      msg += `📌 *${dia.toUpperCase()}*\n`;
      porDia[dia].forEach(c => {
        msg += `  ⏰ *${c.horaInicio} - ${c.horaFin}* | 📍 *${c.espacioId}*\n`;
        msg += `  📖 _${c.materia}_ (Grupo: ${c.grupo || 'N/A'})\n`;
      });
      msg += `\n`;
    });
  }

  // Enlace directo al portal del docente (con fallback seguro)
  const baseUrl = window.location.origin && window.location.origin !== 'null'
    ? `${window.location.origin}${window.location.pathname}`
    : 'http://localhost:8080/';
  const portalUrl = `${baseUrl}?portal=docente&matricula=${encodeURIComponent(doc.id)}`;

  msg += `🔗 *Consulta tu horario en tiempo real y descarga tu PDF oficial:*\n${portalUrl}\n\n`;
  msg += `_Atentamente, Secretaría Académica y Coordinación de Espacios FACSA-UJED_`;

  // 4. Crear URL de WhatsApp y abrir
  const urlWhatsApp = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(msg)}`;
  
  window.open(urlWhatsApp, '_blank');
  mostrarToast(`Abriendo WhatsApp con el horario de ${doc.nombre}...`, 'success');

  // Registrar auditoría si está disponible
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Envío WhatsApp', 'Docentes', doc.nombre, `Horario del ciclo ${ciclo} enviado por WhatsApp a +${waPhone}`, 'baja');
  }
};

// =============================================================================
// TAB 4: BITÁCORA Y REGISTRO DE LLAVES
// =============================================================================
function parseHoraMinutos(hStr) {
  if (!hStr) return 0;
  const p = hStr.split(':');
  return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
}

function renderBitacoraEIncidencias() {
  const tbody = document.getElementById('tbodyBitacora');
  if (!tbody) return;
  tbody.innerHTML = '';

  const fechaHoyStr = new Date().toISOString().slice(0, 10);
  const horaActualMin = parseHoraMinutos(AppState.horaActual || '08:00');

  // Normalizar y clasificar cada registro de la bitácora
  const registrosProcesados = AppState.bitacora.map(reg => {
    const estado = reg.estadoLlave || (reg.llaveEntregada ? (reg.horaDevolucion ? 'devuelta' : 'prestada') : 'sin_llave');
    
    // Evaluar si la llave se encuentra demorada
    let esDemorada = false;
    if (estado === 'prestada') {
      if (reg.fecha && reg.fecha < fechaHoyStr) {
        esDemorada = true;
      } else if (reg.hora) {
        const horaEntregaMin = parseHoraMinutos(reg.hora);
        // Demorada si han transcurrido más de 120 minutos (2 horas)
        if (horaActualMin - horaEntregaMin >= 120) {
          esDemorada = true;
        }
      }
    }

    return {
      ...reg,
      estadoCalculado: estado,
      esDemorada
    };
  });

  // Conteos estadísticos de llaves para los botones de filtro
  const countTodas = registrosProcesados.length;
  const countPrestadas = registrosProcesados.filter(r => r.estadoCalculado === 'prestada').length;
  const countDevueltas = registrosProcesados.filter(r => r.estadoCalculado === 'devuelta').length;
  const countDemoradas = registrosProcesados.filter(r => r.esDemorada).length;

  const elCountTodas = document.getElementById('countBitacoraTodas');
  if (elCountTodas) elCountTodas.textContent = countTodas;
  const elCountPrestadas = document.getElementById('countBitacoraPrestadas');
  if (elCountPrestadas) elCountPrestadas.textContent = countPrestadas;
  const elCountDevueltas = document.getElementById('countBitacoraDevueltas');
  if (elCountDevueltas) elCountDevueltas.textContent = countDevueltas;
  const elCountDemoradas = document.getElementById('countBitacoraDemoradas');
  if (elCountDemoradas) elCountDemoradas.textContent = countDemoradas;

  // Renderizar banner de alerta superior según estatus crítico
  const bannerContainer = document.getElementById('alertaLlavesPendientesContainer');
  if (bannerContainer) {
    if (countDemoradas > 0) {
      bannerContainer.style.display = 'block';
      bannerContainer.innerHTML = `
        <div class="bitacora-alert-banner alerta-demora">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.4rem;">⚠️</span>
            <div>
              <strong style="font-size: 0.9rem; color: #fee2e2;">Atención de Prefectura: ${countDemoradas} llave(s) con retraso en entrega pendientes de devolución.</strong>
              <div style="font-size: 0.76rem; opacity: 0.95;">Superaron el límite de impartición académica. Solicitar entrega inmediata para liberar espacios.</div>
            </div>
          </div>
          <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer;" onclick="filtrarBitacoraDemoradasRapido()">
            Ver Demoradas
          </button>
        </div>
      `;
    } else if (countPrestadas > 0) {
      bannerContainer.style.display = 'block';
      bannerContainer.innerHTML = `
        <div class="bitacora-alert-banner alerta-prestamo">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.3rem;">🔑</span>
            <div>
              <strong style="font-size: 0.88rem; color: #fef3c7;">Control de Llaves Activo: ${countPrestadas} llave(s) físicas en uso.</strong>
              <div style="font-size: 0.76rem; opacity: 0.92;">Aulas abiertas bajo responsabilidad de los docentes y prefectura asignada.</div>
            </div>
          </div>
        </div>
      `;
    } else {
      bannerContainer.style.display = 'none';
      bannerContainer.innerHTML = '';
    }
  }

  // Filtrado de la tabla según filtros seleccionados
  const filtro = AppState.filtroBitacoraLlave || 'todas';
  const query = (AppState.busquedaBitacora || '').toLowerCase().trim();

  const filtrados = registrosProcesados.filter(r => {
    // Filtro por píldoras de estado
    if (filtro === 'prestada' && r.estadoCalculado !== 'prestada') return false;
    if (filtro === 'devuelta' && r.estadoCalculado !== 'devuelta') return false;
    if (filtro === 'demorada' && !r.esDemorada) return false;

    // Filtro por búsqueda general
    if (query) {
      const matchDoc = (r.docenteNombre || '').toLowerCase().includes(query);
      const matchEspId = (r.espacioId || '').toLowerCase().includes(query);
      const matchEspNom = (r.espacioNombre || '').toLowerCase().includes(query);
      const matchRec = (r.recibioPersonal || '').toLowerCase().includes(query);
      const matchDev = (r.recibioDevolucion || '').toLowerCase().includes(query);
      if (!matchDoc && !matchEspId && !matchEspNom && !matchRec && !matchDev) return false;
    }

    return true;
  });

  if (filtrados.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 28px; color: var(--text-muted); font-size: 0.85rem;">
        🔍 No se encontraron registros de bitácora con los filtros aplicados.
      </td>
    `;
    tbody.appendChild(tr);
  } else {
    filtrados.forEach(reg => {
      const tr = document.createElement('tr');

      // Badge de estado de llave
      let badgeEstado = '';
      if (reg.estadoCalculado === 'devuelta') {
        badgeEstado = `<span class="badge-llave-devuelta"><span>✅</span> Devuelta</span>`;
      } else if (reg.esDemorada) {
        badgeEstado = `<span class="badge-llave-demorada"><span>⚠️</span> Demorada</span>`;
      } else if (reg.estadoCalculado === 'prestada') {
        badgeEstado = `<span class="badge-llave-prestada"><span>🔑</span> En Préstamo</span>`;
      } else {
        badgeEstado = `<span class="badge-sin-llave"><span>🔒</span> Sin Llave</span>`;
      }

      // Detalle de devolución y cierre
      let colDevolucion = '';
      if (reg.estadoCalculado === 'devuelta') {
        colDevolucion = `
          <div style="font-size: 0.78rem; font-weight: 700; color: #34d399;">
            🕒 ${reg.horaDevolucion || ''} <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: normal;">(${reg.fechaDevolucion || reg.fecha})</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Recibió: ${reg.recibioDevolucion || 'Prefectura'}</div>
          <div style="font-size: 0.7rem; color: var(--text-dim);">${reg.estadoFisicoAula || reg.observacionesDevolucion || 'En orden'}</div>
        `;
      } else if (reg.estadoCalculado === 'prestada') {
        colDevolucion = `
          <div style="font-size: 0.76rem; color: ${reg.esDemorada ? '#ef4444' : '#f59e0b'}; font-weight: 700;">
            ${reg.esDemorada ? '⏳ Retraso en devolución' : '⏳ En impartición de clase'}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-dim);">Pendiente de entrega a prefectura</div>
        `;
      } else {
        colDevolucion = `
          <div style="font-size: 0.74rem; color: var(--text-dim);">Acceso libre / Sin llave física</div>
        `;
      }

      // Botón de gestión
      let colGestion = '';
      if (reg.estadoCalculado === 'prestada') {
        colGestion = `
          <button type="button" class="btn-now" style="font-size: 0.72rem; padding: 4px 10px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; cursor: pointer; border-radius: 6px; font-weight: 700;" onclick="abrirModalDevolverLlave('${reg.id}')" title="Registrar recepción de llave">
            📥 Devolver
          </button>
        `;
      } else {
        colGestion = `
          <button type="button" class="btn-secondary" style="font-size: 0.7rem; padding: 3px 8px; opacity: 0.8; cursor: pointer;" onclick="verDetalleBitacora('${reg.id}')" title="Ver detalle del cierre">
            ℹ️ Detalle
          </button>
        `;
      }

      tr.innerHTML = `
        <td>
          <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem;">${reg.hora}</div>
          <div style="font-size: 0.7rem; color: var(--text-dim);">${reg.fecha}</div>
        </td>
        <td>
          <strong>${reg.docenteNombre}</strong><br>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${(reg.carrera || 'general').toUpperCase()}</span>
        </td>
        <td>
          <span class="career-tag-pill" style="font-size: 0.72rem; font-weight: 700;">${reg.espacioId}</span><br>
          <span style="font-size: 0.7rem; color: var(--text-dim);">${reg.espacioNombre}</span>
        </td>
        <td>
          ${badgeEstado}
          <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 3px;">${reg.accion}</div>
        </td>
        <td style="font-size: 0.76rem;">
          <div style="font-weight: 600;">${reg.recibioPersonal || 'Prefectura'}</div>
          <div style="font-size: 0.7rem; color: var(--text-dim);">${reg.estadoEquipos || 'Equipos verificados'}</div>
        </td>
        <td>
          ${colDevolucion}
        </td>
        <td style="text-align: center;">
          ${colGestion}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Renderizar Incidencias
  const containerInc = document.getElementById('listaIncidenciasContainer');
  if (containerInc) {
    containerInc.innerHTML = '';
    const badgeCount = document.getElementById('badgeIncidenciasCount');
    if (badgeCount) badgeCount.textContent = `${AppState.incidencias.length} Activas`;

    if (AppState.incidencias.length === 0) {
      containerInc.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
          ✅ No hay incidencias pendientes reportadas.
        </div>
      `;
    } else {
      AppState.incidencias.forEach(inc => {
        const card = document.createElement('div');
        card.className = `incident-card priority-${inc.prioridad}`;
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 0.82rem; color: var(--text-main);">${inc.espacioId} - ${inc.espacioNombre}</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: ${inc.prioridad === 'Alta' ? '#ef4444' : (inc.prioridad === 'Media' ? '#f59e0b' : '#3b82f6')};">
              Prioridad ${inc.prioridad}
            </span>
          </div>
          <p style="font-size: 0.76rem; color: var(--text-muted); margin: 4px 0;">${inc.descripcion}</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-dim); margin-top: 4px;">
            <span>Por: ${inc.reportadoPor}</span>
            <span>${inc.fechaHora}</span>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button type="button" class="btn-now" style="font-size: 0.7rem;" onclick="resolverIncidencia('${inc.id}')">
              ✓ Marcar Resuelto
            </button>
          </div>
        `;
        containerInc.appendChild(card);
      });
    }
  }
}

window.filtrarBitacoraDemoradasRapido = function() {
  AppState.filtroBitacoraLlave = 'demorada';
  document.querySelectorAll('[data-filter-llave]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter-llave') === 'demorada');
  });
  renderBitacoraEIncidencias();
};

window.verDetalleBitacora = function(regId) {
  const reg = AppState.bitacora.find(b => b.id === regId);
  if (!reg) return;
  const info = `📋 Registro ${reg.id} - ${reg.espacioId}\nDocente: ${reg.docenteNombre}\nEntrega: ${reg.fecha} ${reg.hora} (${reg.recibioPersonal || 'Prefectura'})\nDevolución: ${reg.fechaDevolucion || 'N/A'} ${reg.horaDevolucion || ''} (${reg.recibioDevolucion || 'N/A'})\nCondición: ${reg.estadoFisicoAula || 'En orden'}\nObservaciones: ${reg.observaciones || reg.observacionesDevolucion || 'Sin notas adicionale'}`;
  mostrarToast(`Cierre: ${reg.espacioId} - ${reg.estadoFisicoAula || 'Devuelta en orden'}`, 'info');
};

function resolverIncidencia(incId) {
  const inc = AppState.incidencias.find(i => i.id === incId);
  AppState.incidencias = AppState.incidencias.filter(i => i.id !== incId);
  guardarDatosLocales();
  renderBitacoraEIncidencias();
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Resolución Incidencia', 'Incidencias', inc ? inc.espacioId : 'Aula', `Incidencia resuelta satisfactoriamente: ${inc ? inc.descripcion : incId}`, 'info');
  }
  sounds.playSuccess();
  mostrarToast('Incidencia resuelta satisfactoriamente.', 'success');
}

// =============================================================================
// TAB 5: ESTADÍSTICAS Y REPORTES
// =============================================================================
function renderEstadisticas() {
  const total = AppState.asignaciones.length;
  if (total === 0) return;

  const med = AppState.asignaciones.filter(a => a.carrera === 'medicina').length;
  const psi = AppState.asignaciones.filter(a => a.carrera === 'psicologia').length;
  const nut = AppState.asignaciones.filter(a => a.carrera === 'nutricion').length;
  const gen = AppState.asignaciones.filter(a => a.carrera === 'general').length;

  const pMed = Math.round((med / total) * 100);
  const pPsi = Math.round((psi / total) * 100);
  const pNut = Math.round((nut / total) * 100);
  const pGen = Math.round((gen / total) * 100);

  document.getElementById('statMedPercent').textContent = `${pMed}% (${med} clases)`;
  document.getElementById('statPsiPercent').textContent = `${pPsi}% (${psi} clases)`;
  document.getElementById('statNutPercent').textContent = `${pNut}% (${nut} clases)`;
  document.getElementById('statGenPercent').textContent = `${pGen}% (${gen} clases)`;
}

// =============================================================================
// MOTOR DE DETECCIÓN DE CONFLICTOS Y GESTOR DE RESERVAS
// =============================================================================
function inicializarFormularios() {
  const selCarrera = document.getElementById('formCarrera');
  const selEspacio = document.getElementById('formEspacio');
  const selDocente = document.getElementById('formDocente');
  const selDia = document.getElementById('formDia');
  const selFranja = document.getElementById('formFranja');
  const selHoraFin = document.getElementById('formHoraFin');
  const inputAlumnos = document.getElementById('formAlumnos');
  const inputGrupo = document.getElementById('formGrupo');
  const inputMateria = document.getElementById('formMateria');
  const inputIdEditar = document.getElementById('formAsignacionIdEditar');

  // Cargar franjas horarias de inicio (07:00 a 21:00)
  selFranja.innerHTML = '';
  FRANJAS_HORARIAS.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.inicio;
    opt.textContent = `${f.inicio} - ${f.fin}`;
    selFranja.appendChild(opt);
  });

  const HORAS_FIN_LISTA = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00'
  ];

  function actualizarHorasFinDisponibles() {
    if (!selHoraFin) return;
    const horaInicio = selFranja?.value || '07:00';
    const valorPrevio = selHoraFin.value;
    selHoraFin.innerHTML = '';

    const validas = HORAS_FIN_LISTA.filter(h => h > horaInicio);
    validas.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      const hIniNum = parseInt(horaInicio.split(':')[0], 10);
      const hFinNum = parseInt(h.split(':')[0], 10);
      const dur = hFinNum - hIniNum;
      opt.textContent = `${h} (${dur} ${dur === 1 ? 'hora' : 'horas'})`;
      selHoraFin.appendChild(opt);
    });

    if (valorPrevio && validas.includes(valorPrevio)) {
      selHoraFin.value = valorPrevio;
    } else if (validas.length > 0) {
      selHoraFin.value = validas[0];
    }
  }

  // Actualizar docentes y espacios según carrera
  function actualizarOpcionesFormulario() {
    const car = selCarrera.value;

    // Espacios disponibles agrupados por Edificio
    selEspacio.innerHTML = '';
    Object.keys(EDIFICIOS).forEach(edifKey => {
      const edif = EDIFICIOS[edifKey];
      const espaciosEdif = ESPACIOS.filter(esp => {
        if (esp.carreraExclusiva && esp.carreraExclusiva !== car) return false;
        return esp.edificioId === edifKey;
      });

      if (espaciosEdif.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${edif.icono} ${edif.nombre.toUpperCase()}`;
        espaciosEdif.forEach(esp => {
          const opt = document.createElement('option');
          opt.value = esp.id;
          opt.textContent = `${esp.id} — ${esp.nombre} (${esp.capacidad} pers.)`;
          optgroup.appendChild(opt);
        });
        selEspacio.appendChild(optgroup);
      }
    });

    // Docentes disponibles: agrupados por la carrera elegida Y TODOS los demás registrados
    selDocente.innerHTML = '';
    const docentesDeCarrera = AppState.docentes.filter(d => d.carrera === car);
    const otrosDocentes = AppState.docentes.filter(d => d.carrera !== car);

    if (AppState.docentes.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '⚠️ Sin docentes registrados — Haz clic en "+ Registrar Nuevo Docente" arriba';
      selDocente.appendChild(opt);
    } else {
      if (docentesDeCarrera.length > 0) {
        const groupActual = document.createElement('optgroup');
        const nombreCarrera = (typeof CARRERAS !== 'undefined' && CARRERAS[car]) ? CARRERAS[car].nombre : car;
        groupActual.label = `⭐ Docentes de ${nombreCarrera} (${docentesDeCarrera.length})`;
        docentesDeCarrera.forEach(doc => {
          const opt = document.createElement('option');
          opt.value = doc.id;
          opt.textContent = `${doc.titulo} — (${doc.especialidad || 'Docente'})`;
          groupActual.appendChild(opt);
        });
        selDocente.appendChild(groupActual);
      }
      if (otrosDocentes.length > 0) {
        const groupOtros = document.createElement('optgroup');
        groupOtros.label = `👨‍🏫 Otros Docentes Registrados (${otrosDocentes.length})`;
        otrosDocentes.forEach(doc => {
          const opt = document.createElement('option');
          opt.value = doc.id;
          const nomCar = (typeof CARRERAS !== 'undefined' && CARRERAS[doc.carrera]) ? CARRERAS[doc.carrera].nombre : doc.carrera;
          opt.textContent = `${doc.titulo} [${nomCar}]`;
          groupOtros.appendChild(opt);
        });
        selDocente.appendChild(groupOtros);
      }
    }

    // Actualizar estados disponibles en selector de franjas (considerando intervalo)
    const espacioIdActual = selEspacio.value;
    const diaActualSel = selDia.value;
    Array.from(selFranja.options).forEach(opt => {
      const hora = opt.value;
      const f = FRANJAS_HORARIAS.find(fh => fh.inicio === hora);
      const textoBase = f ? `${f.inicio} - ${f.fin}` : hora;
      const estaOcupado = AppState.asignaciones.some(a => 
        a.espacioId === espacioIdActual && a.dia === diaActualSel && (hora >= a.horaInicio && hora < a.horaFin)
      );
      opt.textContent = estaOcupado ? `${textoBase} (🔴 Ocupado)` : `${textoBase} (🟢 Libre)`;
    });

    actualizarHorasFinDisponibles();

    // Sugerencia de materia según docente seleccionado
    if (selDocente.value) {
      const docSel = AppState.docentes.find(d => d.id === selDocente.value);
      if (docSel && docSel.materias && docSel.materias.length > 0) {
        inputMateria.value = docSel.materias[0];
      }
    }

    verificarConflictos();
  }

  selCarrera.addEventListener('change', actualizarOpcionesFormulario);
  selDocente.addEventListener('change', () => {
    const doc = AppState.docentes.find(d => d.id === selDocente.value);
    if (doc && doc.materias && doc.materias.length > 0) {
      inputMateria.value = doc.materias[0];
    }
    verificarConflictos();
  });

  selEspacio.addEventListener('change', () => {
    actualizarOpcionesFormulario();
  });
  selDia.addEventListener('change', () => {
    actualizarOpcionesFormulario();
  });
  selFranja.addEventListener('change', () => {
    actualizarHorasFinDisponibles();
    verificarConflictos();
  });
  if (selHoraFin) selHoraFin.addEventListener('change', verificarConflictos);
  if (inputAlumnos) inputAlumnos.addEventListener('input', verificarConflictos);
  if (inputGrupo) inputGrupo.addEventListener('input', verificarConflictos);
  if (inputMateria) inputMateria.addEventListener('input', verificarConflictos);

  // Botones de resolución rápida de conflicto
  const btnBuscarHorario = document.getElementById('btnBuscarHorarioLibre');
  if (btnBuscarHorario) {
    btnBuscarHorario.addEventListener('click', () => {
      const espId = selEspacio.value;
      const dia = selDia.value;
      const libre = FRANJAS_HORARIAS.find(f => 
        !AppState.asignaciones.some(a => a.espacioId === espId && a.dia === dia && (f.inicio < a.horaFin && f.fin > a.horaInicio))
      );
      if (libre) {
        selFranja.value = libre.inicio;
        actualizarHorasFinDisponibles();
        actualizarOpcionesFormulario();
        mostrarToast(`⏰ Horario libre seleccionado: ${libre.inicio} a ${libre.fin}`, 'info');
      } else {
        mostrarToast('⚠️ Este espacio no tiene horarios libres el día ' + dia, 'warning');
      }
    });
  }

  const btnBuscarAula = document.getElementById('btnBuscarAulaLibre');
  if (btnBuscarAula) {
    btnBuscarAula.addEventListener('click', () => {
      const dia = selDia.value;
      const horaIni = selFranja.value;
      const horaFin = selHoraFin?.value || (FRANJAS_HORARIAS.find(f => f.inicio === horaIni)?.fin || '22:00');
      const car = selCarrera.value;
      const espaciosValidos = ESPACIOS.filter(esp => {
        if (esp.carreraExclusiva && esp.carreraExclusiva !== car) return false;
        if (esp.estado === 'mantenimiento' || esp.mantenimiento === true) return false;
        return true;
      });
      const libre = espaciosValidos.find(esp => 
        !AppState.asignaciones.some(a => a.espacioId === esp.id && a.dia === dia && (horaIni < a.horaFin && horaFin > a.horaInicio))
      );
      if (libre) {
        selEspacio.value = libre.id;
        actualizarOpcionesFormulario();
        mostrarToast(`🏢 Aula libre seleccionada: ${libre.id} (${libre.nombre})`, 'info');
      } else {
        mostrarToast(`⚠️ No hay aulas de esta área libres entre ${horaIni} y ${horaFin}`, 'warning');
      }
    });
  }

  const chkSobreescribir = document.getElementById('chkSobreescribir');
  if (chkSobreescribir) {
    chkSobreescribir.addEventListener('change', verificarConflictos);
  }

  const btnForzar = document.getElementById('btnForzarReemplazoDirecto');
  if (btnForzar) {
    btnForzar.addEventListener('click', () => {
      if (chkSobreescribir) chkSobreescribir.checked = true;
      const btnGuardar = document.getElementById('btnGuardarReserva');
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.style.opacity = '1';
        btnGuardar.style.cursor = 'pointer';
      }
      const form = document.getElementById('formNuevaReserva');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    });
  }

  const btnCrearDoc = document.getElementById('btnReservaCrearDocente');
  if (btnCrearDoc) {
    btnCrearDoc.addEventListener('click', () => {
      cerrarModal('modalReserva');
      abrirModal('modalNuevoDocente');
    });
  }

  const btnCargarBase = document.getElementById('btnReservaCargarBaseDocentes');
  if (btnCargarBase) {
    btnCargarBase.addEventListener('click', () => {
      if (confirm('¿Deseas restaurar la plantilla completa con los 116 docentes universitarios?')) {
        if (typeof DOCENTES !== 'undefined' && DOCENTES.length > 0) {
          AppState.docentes = JSON.parse(JSON.stringify(DOCENTES));
          localStorage.setItem('fcs_docentes', JSON.stringify(AppState.docentes));
          actualizarTodo();
          actualizarOpcionesFormulario();
          mostrarToast('✅ Plantilla de 116 docentes restaurada.', 'success');
        }
      }
    });
  }

  actualizarOpcionesFormulario();
  actualizarHorasFinDisponibles();

  // Envío del formulario de reserva (Crear o Editar)
  document.getElementById('formNuevaReserva').addEventListener('submit', (e) => {
    e.preventDefault();

    const idEditar = (inputIdEditar?.value || '').trim();
    const chkOver = document.getElementById('chkSobreescribir');
    const permiteSobreescribir = chkOver && chkOver.checked;

    const conflicto = validarConflictoDetallado(idEditar || null);
    if (conflicto && (!permiteSobreescribir || conflicto.tipo !== 'espacio')) {
      sounds.playConflict && sounds.playConflict();
      mostrarToast(conflicto.mensaje, 'error');
      return;
    }

    const doc = AppState.docentes.find(d => d.id === selDocente.value);
    if (!doc) {
      mostrarToast('Por favor selecciona o registra un docente responsable.', 'warning');
      return;
    }
    const esp = ESPACIOS.find(s => s.id === selEspacio.value);
    if (!esp) {
      mostrarToast('Por favor selecciona un aula o espacio.', 'warning');
      return;
    }

    const horaInicio = selFranja.value;
    const horaFin = selHoraFin?.value || (FRANJAS_HORARIAS.find(f => f.inicio === horaInicio)?.fin || '22:00');
    const materia = inputMateria.value.trim() || 'Cátedra Universitaria';
    const grupo = (inputGrupo?.value || '').trim() || 'Gpo 101';
    const alumnos = parseInt(inputAlumnos?.value) || 30;
    const observaciones = (document.getElementById('formObservaciones')?.value || '').trim();

    const haySolapamiento = (i1, f1, i2, f2) => (i1 < f2 && f1 > i2);

    if (idEditar) {
      // EDICIÓN DE ASIGNACIÓN EXISTENTE
      const asig = AppState.asignaciones.find(a => String(a.id) === String(idEditar));
      if (asig) {
        asig.espacioId = esp.id;
        asig.espacioNombre = esp.nombre;
        asig.docenteId = doc.id;
        asig.docenteNombre = doc.nombre;
        asig.docenteTitulo = doc.titulo;
        asig.carrera = selCarrera.value;
        asig.materia = materia;
        asig.grupo = grupo;
        asig.dia = selDia.value;
        asig.horaInicio = horaInicio;
        asig.horaFin = horaFin;
        asig.alumnosRegistrados = alumnos;
        asig.observaciones = observaciones;

        AppState.bitacora.unshift({
          id: 'BIT-ASIG-' + Date.now(),
          fecha: new Date().toLocaleDateString('es-MX'),
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          espacio: esp.nombre,
          accion: `Asignación modificada: ${materia} (${grupo}) con ${doc.titulo} [${horaInicio}-${horaFin}]`,
          responsable: window.rolActual || 'Administrador',
          tipo: 'modificacion'
        });

        if (typeof registrarAuditoria === 'function') {
          registrarAuditoria('Modificación Horario', 'Horarios', esp.id, `${materia} (${grupo}) con ${doc.titulo} [${selDia.value} ${horaInicio}-${horaFin}]`, 'info');
        }

        mostrarToast(`✏️ Asignación actualizada con éxito en ${esp.id} para ${doc.titulo}.`, 'success');
      }
    } else {
      // NUEVA ASIGNACIÓN
      if (permiteSobreescribir) {
        AppState.asignaciones = AppState.asignaciones.filter(a => 
          !(a.espacioId === esp.id && a.dia === selDia.value && haySolapamiento(horaInicio, horaFin, a.horaInicio, a.horaFin))
        );
      }

      const nuevaAsignacion = {
        id: `ASIG-${Date.now().toString().slice(-5)}`,
        espacioId: esp.id,
        espacioNombre: esp.nombre,
        docenteId: doc.id,
        docenteNombre: doc.nombre,
        docenteTitulo: doc.titulo,
        carrera: selCarrera.value,
        materia: materia,
        grupo: grupo,
        dia: selDia.value,
        horaInicio: horaInicio,
        horaFin: horaFin,
        alumnosRegistrados: alumnos,
        estadoAsistencia: 'pendiente',
        llaveEntregada: false,
        observaciones: observaciones
      };

      AppState.asignaciones.push(nuevaAsignacion);

      AppState.bitacora.unshift({
        id: 'BIT-ASIG-' + Date.now(),
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        espacio: esp.nombre,
        accion: `Nueva clase programada: ${materia} (${grupo}) con ${doc.titulo} [${horaInicio}-${horaFin}]`,
        responsable: window.rolActual || 'Administrador',
        tipo: 'programacion'
      });

      if (typeof registrarAuditoria === 'function') {
        registrarAuditoria(
          permiteSobreescribir ? 'Reemplazo Forzado Horario' : 'Asignación Horario',
          'Horarios',
          esp.id,
          `${materia} (${grupo}) con ${doc.titulo} [${selDia.value} ${horaInicio}-${horaFin}]`,
          permiteSobreescribir ? 'advertencia' : 'info'
        );
      }

      const txtExito = permiteSobreescribir 
        ? `¡Clase reasignada y reemplazada con éxito en ${esp.id} para ${doc.titulo}!`
        : `¡Clase programada con éxito en ${esp.id} para ${doc.titulo}!`;
      mostrarToast(txtExito, 'success');
    }

    guardarDatosLocales();
    actualizarTodo();

    if (inputIdEditar) inputIdEditar.value = '';
    const btnGuardar = document.getElementById('btnGuardarReserva');
    if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';
    const tituloModal = document.querySelector('#modalReserva .modal-title');
    if (tituloModal) tituloModal.innerHTML = '<span>✨</span> Programar Clase o Reserva de Espacio';

    cerrarModal('modalReserva');
    sounds.playSuccess && sounds.playSuccess();
  });

  // Botón abrir modal general con selección inteligente de horario libre
  document.getElementById('btnAbrirModalReserva').addEventListener('click', () => {
    if (inputIdEditar) inputIdEditar.value = '';
    const tituloModal = document.querySelector('#modalReserva .modal-title');
    if (tituloModal) tituloModal.innerHTML = '<span>✨</span> Programar Clase o Reserva de Espacio';
    const btnGuardar = document.getElementById('btnGuardarReserva');
    if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';

    actualizarOpcionesFormulario();

    // Sincronizar con día y hora del simulador si existen
    if (AppState.diaActual && selDia) selDia.value = AppState.diaActual;
    if (AppState.horaActual && selFranja) {
      const matchFranja = FRANJAS_HORARIAS.find(f => f.inicio === AppState.horaActual);
      if (matchFranja) selFranja.value = matchFranja.inicio;
    }
    actualizarHorasFinDisponibles();

    // Buscar proactivamente una combinación libre para que no abra con error de conflicto
    const conflictoInicial = validarConflictoDetallado();
    if (conflictoInicial && conflictoInicial.tipo === 'espacio') {
      const franjaLibre = FRANJAS_HORARIAS.find(f => 
        !AppState.asignaciones.some(a => a.espacioId === selEspacio.value && a.dia === selDia.value && a.horaInicio === f.inicio)
      );
      if (franjaLibre) {
        selFranja.value = franjaLibre.inicio;
        actualizarHorasFinDisponibles();
      } else {
        const espLibre = ESPACIOS.find(esp => 
          (!esp.carreraExclusiva || esp.carreraExclusiva === selCarrera.value) &&
          !AppState.asignaciones.some(a => a.espacioId === esp.id && a.dia === selDia.value && a.horaInicio === selFranja.value)
        );
        if (espLibre) selEspacio.value = espLibre.id;
      }
    }

    actualizarOpcionesFormulario();
    abrirModal('modalReserva');
  });

  // Modal Reportar Incidencia
  const selIncEspacio = document.getElementById('incidenciaEspacio');
  ESPACIOS.forEach(esp => {
    const opt = document.createElement('option');
    opt.value = esp.id;
    opt.textContent = `${esp.id} - ${esp.nombre}`;
    selIncEspacio.appendChild(opt);
  });

  document.getElementById('btnReportarIncidencia').addEventListener('click', () => {
    abrirModal('modalIncidencia');
  });

  document.getElementById('formReportarIncidencia').addEventListener('submit', (e) => {
    e.preventDefault();
    const espId = selIncEspacio.value;
    const esp = ESPACIOS.find(s => s.id === espId);

    const nuevaInc = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      espacioId: esp.id,
      espacioNombre: esp.nombre,
      reportadoPor: document.getElementById('incidenciaReporta').value.trim(),
      prioridad: document.getElementById('incidenciaPrioridad').value,
      descripcion: document.getElementById('incidenciaDesc').value.trim(),
      estado: 'Pendiente',
      fechaHora: new Date().toLocaleDateString('es-MX') + ' ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    AppState.incidencias.unshift(nuevaInc);
    guardarDatosLocales();
    renderBitacoraEIncidencias();
    if (typeof registrarAuditoria === 'function') {
      registrarAuditoria('Reporte Incidencia', 'Incidencias', esp.id, `Prioridad ${nuevaInc.prioridad}: ${nuevaInc.descripcion}`, 'advertencia');
    }
    cerrarModal('modalIncidencia');
    sounds.playSuccess();
    mostrarToast(`Incidencia reportada para ${esp.id}`, 'info');
  });

  // Modal Check-in
  document.getElementById('btnNuevoCheckIn').addEventListener('click', () => {
    prepararModalCheckin();
    abrirModal('modalCheckin');
  });

  document.getElementById('formCheckin').addEventListener('submit', (e) => {
    e.preventDefault();
    const espId = document.getElementById('checkinEspacio').value;
    const docId = document.getElementById('checkinDocente').value;
    const esp = ESPACIOS.find(s => s.id === espId);
    const doc = DOCENTES.find(d => d.id === docId);

    const nuevoReg = {
      id: `REG-${Date.now().toString().slice(-4)}`,
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      docenteNombre: doc ? doc.titulo : 'Docente Registrado',
      carrera: doc ? doc.carrera : 'medicina',
      espacioId: esp.id,
      espacioNombre: esp.nombre,
      accion: 'Check-in y Asignación de Llave',
      llaveEntregada: document.getElementById('checkinLlave').value === 'true',
      estadoLlave: document.getElementById('checkinLlave').value === 'true' ? 'prestada' : 'sin_llave',
      recibioPersonal: document.getElementById('checkinPersonal').value.trim(),
      estadoEquipos: document.getElementById('checkinEquipos').value.trim(),
      observaciones: document.getElementById('checkinNotas').value.trim(),
      fechaDevolucion: null,
      horaDevolucion: null,
      recibioDevolucion: null,
      estadoFisicoAula: null,
      observacionesDevolucion: null
    };

    AppState.bitacora.unshift(nuevoReg);

    // Actualizar estado de llave en asignación si coincide
    const asig = AppState.asignaciones.find(a => a.espacioId === espId && a.dia === AppState.diaActual && a.horaInicio === AppState.horaActual);
    if (asig) {
      asig.llaveEntregada = nuevoReg.llaveEntregada;
      asig.estadoAsistencia = 'presente';
    }

    guardarDatosLocales();
    actualizarTodo();
    if (typeof registrarAuditoria === 'function') {
      registrarAuditoria(
        'Préstamo Llave',
        'Llaves',
        nuevoReg.espacioId,
        `Entrega de llave a ${nuevoReg.docenteNombre} por prefecto ${nuevoReg.recibioPersonal}. Estado: ${nuevoReg.llaveEntregada ? 'Llave Física' : 'Acceso Electrónico'}`,
        'info'
      );
    }
    cerrarModal('modalCheckin');
    sounds.playSuccess();
    mostrarToast(`Check-in registrado para ${esp.id}`, 'success');
  });

  // Modal 7: Devolución de Llave y Cierre de Aula
  const formDevolver = document.getElementById('formDevolverLlave');
  if (formDevolver) {
    formDevolver.addEventListener('submit', (e) => {
      e.preventDefault();
      const regId = document.getElementById('devolverRegistroId').value;
      const reg = AppState.bitacora.find(b => b.id === regId);
      if (!reg) return;

      const fechaDev = document.getElementById('devolverFecha').value;
      const horaDev = document.getElementById('devolverHora').value;
      const prefecto = document.getElementById('devolverPrefecto').value.trim();
      const selCond = document.getElementById('devolverCondicion');
      const condicionTexto = selCond ? selCond.options[selCond.selectedIndex].text : 'En óptimas condiciones';
      const notasDev = document.getElementById('devolverNotas').value.trim();
      const genInc = document.getElementById('devolverGenerarIncidencia').checked;
      const detInc = document.getElementById('devolverIncidenciaDetalle').value.trim();

      reg.estadoLlave = 'devuelta';
      reg.fechaDevolucion = fechaDev;
      reg.horaDevolucion = horaDev;
      reg.recibioDevolucion = prefecto;
      reg.estadoFisicoAula = condicionTexto;
      reg.observacionesDevolucion = notasDev;

      // Si se solicita generar reporte de incidencia
      if (genInc) {
        const nuevaInc = {
          id: `INC-${Date.now().toString().slice(-4)}`,
          espacioId: reg.espacioId,
          espacioNombre: reg.espacioNombre,
          reportadoPor: `${prefecto} (Cierre de Aula)`,
          prioridad: 'Media',
          descripcion: detInc || `Reporte al cierre de llave: ${condicionTexto}`,
          estado: 'Pendiente',
          fechaHora: `${fechaDev} ${horaDev}`
        };
        AppState.incidencias.unshift(nuevaInc);
      }

      // Si hay una asignación activa en este espacio con llave entregada, actualizarla a false
      const asigActiva = AppState.asignaciones.find(a => a.espacioId === reg.espacioId && a.dia === AppState.diaActual && a.llaveEntregada);
      if (asigActiva) {
        asigActiva.llaveEntregada = false;
      }

      guardarDatosLocales();
      actualizarTodo();
      if (typeof registrarAuditoria === 'function') {
        registrarAuditoria(
          'Devolución Llave',
          'Llaves',
          reg.espacioId,
          `Recepción de llave por ${prefecto}. Condición: ${condicionTexto}${genInc ? ' (Con incidencia generada)' : ''}`,
          genInc ? 'advertencia' : 'info'
        );
      }
      cerrarModal('modalDevolverLlave');
      sounds.playSuccess();
      mostrarToast(`✅ Devolución de llave registrada para ${reg.espacioId}`, 'success');
    });
  }

  // Toggle campo detalle de incidencia en modal devolución
  const chkDevInc = document.getElementById('devolverGenerarIncidencia');
  const fldDevInc = document.getElementById('devolverIncidenciaFields');
  if (chkDevInc && fldDevInc) {
    chkDevInc.addEventListener('change', () => {
      fldDevInc.style.display = chkDevInc.checked ? 'block' : 'none';
    });
  }

  // Filtros de píldoras en la Bitácora
  document.querySelectorAll('[data-filter-llave]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-llave]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.filtroBitacoraLlave = btn.getAttribute('data-filter-llave');
      renderBitacoraEIncidencias();
    });
  });

  // Búsqueda en Bitácora con Debounce
  const inputBusqBit = document.getElementById('inputBuscarBitacora');
  if (inputBusqBit) {
    inputBusqBit.addEventListener('input', debounce((e) => {
      AppState.busquedaBitacora = e.target.value.toLowerCase().trim();
      renderBitacoraEIncidencias();
    }, 180));
  }

  // Botón Reportar Incidencia desde la Bitácora
  const btnBitRep = document.getElementById('btnBitacoraReportarIncidencia');
  if (btnBitRep) {
    btnBitRep.addEventListener('click', () => {
      abrirModal('modalIncidencia');
    });
  }

  // Cerrar modales con botones de cierre
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      cerrarModal(modalId);
    });
  });

  // Cerrar haciendo clic en el backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cerrarModal(overlay.id);
      }
    });
  });

  // Cerrar modal accesible con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      const modalAbierto = document.querySelector('.modal-overlay.active');
      if (modalAbierto && modalAbierto.id) {
        cerrarModal(modalAbierto.id);
      }
    }
  });
}

window.abrirModalDevolverLlave = function(regId) {
  const reg = AppState.bitacora.find(b => b.id === regId);
  if (!reg) return;

  const idInp = document.getElementById('devolverRegistroId');
  if (idInp) idInp.value = reg.id;

  const badge = document.getElementById('devolverEspacioBadge');
  if (badge) badge.textContent = `${reg.espacioId} — ${reg.espacioNombre}`;

  const fh = document.getElementById('devolverFechaHoraEntrega');
  if (fh) fh.textContent = `Entrega registrada: ${reg.fecha} ${reg.hora}`;

  const doc = document.getElementById('devolverDocenteNombre');
  if (doc) doc.textContent = reg.docenteNombre;

  const pe = document.getElementById('devolverPersonalEntrego');
  if (pe) pe.textContent = `Entregó: ${reg.recibioPersonal || 'Prefectura'} | Acción: ${reg.accion}`;

  const now = new Date();
  const fInp = document.getElementById('devolverFecha');
  if (fInp) fInp.value = now.toISOString().slice(0, 10);

  const hInp = document.getElementById('devolverHora');
  if (hInp) {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    hInp.value = `${hh}:${mm}`;
  }

  const prefInp = document.getElementById('devolverPrefecto');
  if (prefInp && !prefInp.value) prefInp.value = 'Prefectura Turno General';

  const cond = document.getElementById('devolverCondicion');
  if (cond) cond.value = 'optimo';

  const notas = document.getElementById('devolverNotas');
  if (notas) notas.value = '';

  const chkInc = document.getElementById('devolverGenerarIncidencia');
  if (chkInc) chkInc.checked = false;

  const fldInc = document.getElementById('devolverIncidenciaFields');
  if (fldInc) fldInc.style.display = 'none';

  abrirModal('modalDevolverLlave');
};

function validarConflictoDetallado(idEditar = null) {
  const espacioId = document.getElementById('formEspacio')?.value;
  const docenteId = document.getElementById('formDocente')?.value;
  const dia = document.getElementById('formDia')?.value;
  const horaInicio = document.getElementById('formFranja')?.value;
  const horaFin = document.getElementById('formHoraFin')?.value || '22:00';
  const alumnosReq = parseInt(document.getElementById('formAlumnos')?.value) || 0;
  const grupo = (document.getElementById('formGrupo')?.value || '').trim();
  const idEdicion = idEditar !== null && idEditar !== undefined ? idEditar : (document.getElementById('formAsignacionIdEditar')?.value?.trim() || null);

  // 0. Regla 7: Control de Rol / Permisos
  if (window.rolActual && !['superadmin', 'admin'].includes(window.rolActual)) {
    return {
      tipo: 'rol',
      mensaje: `⛔ Tu perfil de usuario (${window.rolActual}) no cuenta con permisos para programar o modificar asignaciones.`
    };
  }

  // 1. Regla 1: Coherencia de Horario
  if (horaInicio && horaFin && horaFin <= horaInicio) {
    return {
      tipo: 'horario',
      mensaje: `⚠️ Error de Horario: La hora de término (${horaFin}) debe ser posterior a la hora de inicio (${horaInicio}).`
    };
  }

  // 2. Regla 2: Estado del Espacio (Mantenimiento / Deshabilitado)
  const esp = ESPACIOS.find(s => s.id === espacioId);
  if (esp) {
    const enMantenimiento = esp.estado === 'mantenimiento' || esp.mantenimiento === true;
    const conIncidenciaActiva = AppState.incidencias && AppState.incidencias.some(inc => inc.espacioId === esp.id && inc.estado === 'activa');
    if (enMantenimiento || conIncidenciaActiva) {
      return {
        tipo: 'mantenimiento',
        mensaje: `⚠️ Espacio No Disponible: El aula ${esp.nombre} (${esp.id}) se encuentra en mantenimiento o reporta una incidencia activa.`
      };
    }

    // 3. Regla 3: Aforo y Capacidad
    if (alumnosReq > 0 && esp.capacidad && alumnosReq > esp.capacidad) {
      return {
        tipo: 'capacidad',
        mensaje: `⚠️ Aforo Excedido: Se solicitan ${alumnosReq} alumnos pero el aula ${esp.id} solo tiene capacidad para ${esp.capacidad} personas.`
      };
    }
  }

  // Helper para solapamiento de intervalos temporales
  // [ini1, fin1] y [ini2, fin2] se solapan si (ini1 < fin2 && fin1 > ini2)
  const haySolapamiento = (ini1, fin1, ini2, fin2) => (ini1 < fin2 && fin1 > ini2);

  // 4. Regla 4: Conflicto de Espacio (Solapamiento en la misma aula y día)
  const choqueEspacio = AppState.asignaciones.find(a => 
    (!idEdicion || String(a.id) !== String(idEdicion)) &&
    a.espacioId === espacioId && 
    a.dia === dia && 
    haySolapamiento(horaInicio, horaFin, a.horaInicio, a.horaFin)
  );

  if (choqueEspacio) {
    // Comprobar si el docente de la clase existente existe en el directorio activo
    const docExiste = AppState.docentes && AppState.docentes.some(d => 
      String(d.id) === String(choqueEspacio.docenteId) || 
      (d.titulo && choqueEspacio.docenteTitulo && d.titulo.toLowerCase().trim() === choqueEspacio.docenteTitulo.toLowerCase().trim()) ||
      (d.nombre && choqueEspacio.docenteNombre && d.nombre.toLowerCase().trim() === choqueEspacio.docenteNombre.toLowerCase().trim())
    );

    // Si la clase pertenece a un docente fantasma que ya no existe en el directorio:
    if (!docExiste) {
      console.log(`🧹 Liberando aula ${espacioId} de clase de prueba de docente no registrado ("${choqueEspacio.docenteTitulo || choqueEspacio.docenteNombre || 'Docente'}")`);
      AppState.asignaciones = AppState.asignaciones.filter(a => String(a.id) !== String(choqueEspacio.id));
      guardarDatosLocales();
      // Volver a verificar recursivamente por si hay otra colisión en este mismo rango de horas
      return validarConflictoDetallado(idEdicion);
    }

    return {
      tipo: 'espacio',
      asignacionExistente: choqueEspacio,
      mensaje: `⚠️ Conflicto de Espacio: ${choqueEspacio.espacioNombre || espacioId} ya está ocupado el ${dia} de ${choqueEspacio.horaInicio} a ${choqueEspacio.horaFin} por "${choqueEspacio.materia}" (${choqueEspacio.docenteTitulo || choqueEspacio.docente || 'Docente'}).`
    };
  }

  // 5. Regla 5: Conflicto de Docente (El docente ya tiene clase en otro lugar a esa hora)
  if (docenteId) {
    const choqueDocente = AppState.asignaciones.find(a => 
      (!idEdicion || String(a.id) !== String(idEdicion)) &&
      String(a.docenteId) === String(docenteId) && 
      a.dia === dia && 
      haySolapamiento(horaInicio, horaFin, a.horaInicio, a.horaFin)
    );

    if (choqueDocente) {
      return {
        tipo: 'docente',
        asignacionExistente: choqueDocente,
        mensaje: `⚠️ Conflicto de Docente: ${choqueDocente.docenteTitulo || 'El docente'} ya tiene asignada clase de "${choqueDocente.materia}" en ${choqueDocente.espacioId} el ${dia} de ${choqueDocente.horaInicio} a ${choqueDocente.horaFin}.`
      };
    }
  }

  // 6. Regla 6: Conflicto de Grupo (El mismo grupo no puede estar en dos aulas a la vez)
  if (grupo) {
    const choqueGrupo = AppState.asignaciones.find(a => 
      (!idEdicion || String(a.id) !== String(idEdicion)) &&
      a.grupo && a.grupo.toLowerCase().trim() === grupo.toLowerCase().trim() &&
      a.dia === dia && 
      haySolapamiento(horaInicio, horaFin, a.horaInicio, a.horaFin)
    );

    if (choqueGrupo) {
      return {
        tipo: 'grupo',
        asignacionExistente: choqueGrupo,
        mensaje: `⚠️ Conflicto de Grupo: El grupo "${choqueGrupo.grupo}" ya tiene clase de "${choqueGrupo.materia}" en ${choqueGrupo.espacioId} el ${dia} de ${choqueGrupo.horaInicio} a ${choqueGrupo.horaFin}.`
      };
    }
  }

  return null;
}

function verificarConflictos() {
  const alertBox = document.getElementById('conflictAlertBox');
  const alertText = document.getElementById('conflictAlertText');
  const btnGuardar = document.getElementById('btnGuardarReserva');
  const chkSobreescribir = document.getElementById('chkSobreescribir');
  const txtHora = document.getElementById('txtHoraConflicto');

  const horaSel = document.getElementById('formFranja')?.value;
  if (txtHora && horaSel) txtHora.textContent = horaSel;

  const conflicto = validarConflictoDetallado();

  if (conflicto) {
    alertText.textContent = conflicto.mensaje;
    alertBox.classList.add('active');

    if (chkSobreescribir && chkSobreescribir.checked && conflicto.tipo === 'espacio') {
      btnGuardar.disabled = false;
      btnGuardar.style.opacity = '1';
      btnGuardar.style.cursor = 'pointer';
    } else {
      btnGuardar.disabled = true;
      btnGuardar.style.opacity = '0.5';
      btnGuardar.style.cursor = 'not-allowed';
      sounds.playConflict && sounds.playConflict();
    }
  } else {
    alertBox.classList.remove('active');
    if (chkSobreescribir) chkSobreescribir.checked = false;
    btnGuardar.disabled = false;
    btnGuardar.style.opacity = '1';
    btnGuardar.style.cursor = 'pointer';
  }
}

// Helpers para abrir modales contextuales
function abrirModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    m.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const focusable = m.querySelector('input:not([type="hidden"]), select, textarea, button:not([data-close])');
      if (focusable) focusable.focus();
    }, 50);
  }
}

function cerrarModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
  }

  if (modalId === 'modalReserva') {
    const inputId = document.getElementById('formAsignacionIdEditar');
    if (inputId) inputId.value = '';
    const tituloModal = document.querySelector('#modalReserva .modal-title');
    if (tituloModal) tituloModal.innerHTML = '<span>✨</span> Programar Clase o Reserva de Espacio';
    const btnGuardar = document.getElementById('btnGuardarReserva');
    if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';
    const chkOver = document.getElementById('chkSobreescribir');
    if (chkOver) chkOver.checked = false;
    const alertBox = document.getElementById('conflictAlertBox');
    if (alertBox) alertBox.classList.remove('active');
  }
}

window.editarAsignacion = function(asignacionId) {
  const asig = AppState.asignaciones.find(a => String(a.id) === String(asignacionId));
  if (!asig) {
    mostrarToast('No se encontró la asignación especificada.', 'error');
    return;
  }

  // Establecer ID a editar
  const inputId = document.getElementById('formAsignacionIdEditar');
  if (inputId) inputId.value = String(asig.id);

  // Cambiar título y texto del botón
  const tituloModal = document.querySelector('#modalReserva .modal-title');
  if (tituloModal) tituloModal.innerHTML = `<span>✏️</span> Editar Horario (${asig.espacioId} - ${asig.materia})`;
  const btnGuardar = document.getElementById('btnGuardarReserva');
  if (btnGuardar) {
    btnGuardar.textContent = '💾 Actualizar Horario';
    btnGuardar.disabled = false;
    btnGuardar.style.opacity = '1';
    btnGuardar.style.cursor = 'pointer';
  }

  // Poblar carrera sin reiniciar valores de forma abrupta
  const selCarrera = document.getElementById('formCarrera');
  if (selCarrera) {
    selCarrera.value = asig.carrera || 'medicina';
  }

  // Reconstruir opciones para esta carrera
  actualizarOpcionesFormulario();

  // Asignar valores exactos de la clase a editar
  const selEspacio = document.getElementById('formEspacio');
  if (selEspacio) selEspacio.value = asig.espacioId;

  const selDocente = document.getElementById('formDocente');
  if (selDocente) selDocente.value = asig.docenteId;

  const selDia = document.getElementById('formDia');
  if (selDia) selDia.value = asig.dia;

  const selFranja = document.getElementById('formFranja');
  if (selFranja) selFranja.value = asig.horaInicio;

  // Actualizar selector de hora fin y asignar el valor original
  actualizarHorasFinDisponibles();
  const selHoraFin = document.getElementById('formHoraFin');
  if (selHoraFin) selHoraFin.value = asig.horaFin;

  const inputAlumnos = document.getElementById('formAlumnos');
  if (inputAlumnos) inputAlumnos.value = asig.alumnosRegistrados || 30;

  const inputMateria = document.getElementById('formMateria');
  if (inputMateria) inputMateria.value = asig.materia || '';

  const inputGrupo = document.getElementById('formGrupo');
  if (inputGrupo) inputGrupo.value = asig.grupo || 'Gpo 101';

  const formObs = document.getElementById('formObservaciones');
  if (formObs) formObs.value = asig.observaciones || '';

  // Verificar conflictos pasando el ID de la asignación para que no choque consigo misma
  verificarConflictos();
  abrirModal('modalReserva');
};

window.abrirReservaParaEspacio = function(espacioId) {
  const esp = ESPACIOS.find(s => s.id === espacioId);
  if (!esp) return;

  const inputId = document.getElementById('formAsignacionIdEditar');
  if (inputId) inputId.value = '';
  const tituloModal = document.querySelector('#modalReserva .modal-title');
  if (tituloModal) tituloModal.innerHTML = `<span>✨</span> Programar Clase en ${esp.id} (${esp.nombre})`;
  const btnGuardar = document.getElementById('btnGuardarReserva');
  if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';

  const selCarrera = document.getElementById('formCarrera');
  if (esp.carreraExclusiva) {
    selCarrera.value = esp.carreraExclusiva;
  }
  selCarrera.dispatchEvent(new Event('change'));

  document.getElementById('formEspacio').value = espacioId;
  document.getElementById('formDia').value = AppState.diaActual;
  const selFranja = document.getElementById('formFranja');
  if (selFranja) {
    selFranja.value = AppState.horaActual;
    const selHoraFin = document.getElementById('formHoraFin');
    if (selHoraFin) {
      const HORAS_FIN_LISTA = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
        '20:00', '21:00', '22:00'
      ];
      selHoraFin.innerHTML = '';
      const validas = HORAS_FIN_LISTA.filter(h => h > AppState.horaActual);
      validas.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        const hIniNum = parseInt(AppState.horaActual.split(':')[0], 10);
        const hFinNum = parseInt(h.split(':')[0], 10);
        const dur = hFinNum - hIniNum;
        opt.textContent = `${h} (${dur} ${dur === 1 ? 'hora' : 'horas'})`;
        selHoraFin.appendChild(opt);
      });
      if (validas.length > 0) selHoraFin.value = validas[0];
    }
  }

  verificarConflictos();
  abrirModal('modalReserva');
};

window.abrirReservaRapida = function(espacioId, dia, hora) {
  const inputId = document.getElementById('formAsignacionIdEditar');
  if (inputId) inputId.value = '';
  const tituloModal = document.querySelector('#modalReserva .modal-title');
  if (tituloModal) tituloModal.innerHTML = `<span>✨</span> Programar Clase en ${espacioId}`;
  const btnGuardar = document.getElementById('btnGuardarReserva');
  if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';

  document.getElementById('formEspacio').value = espacioId;
  document.getElementById('formDia').value = dia;
  const selFranja = document.getElementById('formFranja');
  if (selFranja) {
    selFranja.value = hora;
    const selHoraFin = document.getElementById('formHoraFin');
    if (selHoraFin) {
      const HORAS_FIN_LISTA = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
        '20:00', '21:00', '22:00'
      ];
      selHoraFin.innerHTML = '';
      const validas = HORAS_FIN_LISTA.filter(h => h > hora);
      validas.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        const hIniNum = parseInt(hora.split(':')[0], 10);
        const hFinNum = parseInt(h.split(':')[0], 10);
        const dur = hFinNum - hIniNum;
        opt.textContent = `${h} (${dur} ${dur === 1 ? 'hora' : 'horas'})`;
        selHoraFin.appendChild(opt);
      });
      if (validas.length > 0) selHoraFin.value = validas[0];
    }
  }
  verificarConflictos();
  abrirModal('modalReserva');
};

function abrirModalReservaConDocente(docenteId, carrera) {
  const inputId = document.getElementById('formAsignacionIdEditar');
  if (inputId) inputId.value = '';
  const tituloModal = document.querySelector('#modalReserva .modal-title');
  if (tituloModal) tituloModal.innerHTML = '<span>✨</span> Programar Clase o Reserva de Espacio';
  const btnGuardar = document.getElementById('btnGuardarReserva');
  if (btnGuardar) btnGuardar.textContent = 'Guardar Asignación';

  const selCarrera = document.getElementById('formCarrera');
  selCarrera.value = carrera;
  selCarrera.dispatchEvent(new Event('change'));

  document.getElementById('formDocente').value = docenteId;
  document.getElementById('formDia').value = AppState.diaActual;
  const selFranja = document.getElementById('formFranja');
  if (selFranja) {
    selFranja.value = AppState.horaActual;
    const selHoraFin = document.getElementById('formHoraFin');
    if (selHoraFin) {
      const HORAS_FIN_LISTA = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
        '20:00', '21:00', '22:00'
      ];
      selHoraFin.innerHTML = '';
      const validas = HORAS_FIN_LISTA.filter(h => h > AppState.horaActual);
      validas.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        const hIniNum = parseInt(AppState.horaActual.split(':')[0], 10);
        const hFinNum = parseInt(h.split(':')[0], 10);
        const dur = hFinNum - hIniNum;
        opt.textContent = `${h} (${dur} ${dur === 1 ? 'hora' : 'horas'})`;
        selHoraFin.appendChild(opt);
      });
      if (validas.length > 0) selHoraFin.value = validas[0];
    }
  }

  verificarConflictos();
  abrirModal('modalReserva');
}

window.liberarEspacio = function(asignacionId) {
  const asig = AppState.asignaciones.find(a => String(a.id) === String(asignacionId));
  if (!asig) return;
  if (confirm(`¿Estás seguro de que deseas desocupar y liberar el aula ${asig.espacioId} (${asig.espacioNombre || asig.espacioId}) de la clase "${asig.materia || 'Asignada'}"?`)) {
    AppState.asignaciones = AppState.asignaciones.filter(a => String(a.id) !== String(asignacionId));
    guardarDatosLocales();
    actualizarTodo();
    if (typeof registrarAuditoria === 'function') {
      registrarAuditoria('Desocupación Aula', 'Horarios', asig.espacioId, `Liberación inmediata de la clase "${asig.materia}" de ${asig.docenteTitulo}`, 'advertencia');
    }
    if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
    mostrarToast(`Espacio ${asig.espacioId} liberado y disponible.`, 'success');
  }
};

window.verHorarioCompletoEspacio = function(espacioId) {
  AppState.espacioSeleccionadoMatriz = espacioId;
  const esp = ESPACIOS.find(e => e.id === espacioId);
  if (esp) {
    const selEdif = document.getElementById('selectEdificioMatriz');
    if (selEdif) selEdif.value = esp.edificioId || 'todos';
  }
  
  // Cambiar a pestaña matriz
  const tabBtnMatriz = document.querySelector('[data-tab="tab-matriz"]');
  if (tabBtnMatriz) tabBtnMatriz.click();

  renderMatrizSemanal();

  const matEl = document.getElementById('tab-matriz');
  if (matEl) matEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.mostrarDetalleAsignacion = function(asigId) {
  const asig = AppState.asignaciones.find(a => String(a.id) === String(asigId));
  if (!asig) {
    mostrarToast('No se encontró la asignación especificada.', 'error');
    return;
  }

  const esp = ESPACIOS.find(s => s.id === asig.espacioId);
  const doc = AppState.docentes.find(d => String(d.id) === String(asig.docenteId));
  const carInfo = (typeof CARRERAS !== 'undefined' && CARRERAS[asig.carrera]) 
    ? CARRERAS[asig.carrera] 
    : { nombre: asig.carrera, icono: '📚', color: 'var(--accent-primary)' };

  const hIni = parseInt(asig.horaInicio.split(':')[0], 10);
  const hFin = parseInt((asig.horaFin || '22:00').split(':')[0], 10);
  const duracion = Math.max(1, hFin - hIni);

  const titleEl = document.getElementById('modalDetalleClaseTitle');
  if (titleEl) {
    titleEl.innerHTML = `<span>📌</span> Detalle de Asignación • ${asig.espacioId}`;
  }

  const bodyEl = document.getElementById('modalDetalleClaseBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="border-left: 4px solid ${carInfo.color || 'var(--accent-primary)'}; padding-left: 12px; margin-bottom: 14px;">
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">${asig.materia}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
          ${carInfo.icono || '📚'} Carrera: <strong>${carInfo.nombre}</strong> • Grupo: <strong style="color:var(--text-main);">${asig.grupo}</strong>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
        <div style="background: var(--bg-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">🏫 AULA / ESPACIO:</div>
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
            ${asig.espacioId} — ${asig.espacioNombre || esp?.nombre || ''}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">📍 ${esp?.edificio || ''} • Capacidad: ${esp?.capacidad || 0} pers.</div>
        </div>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">⏰ HORARIO PROGRAMADO:</div>
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--gold-primary); margin-top: 2px;">
            ${asig.dia} ${asig.horaInicio} a ${asig.horaFin}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Duración: ${duracion} ${duracion === 1 ? 'hora' : 'horas'}</div>
        </div>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">👨‍🏫 DOCENTE ASIGNADO:</div>
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
            ${asig.docenteTitulo}
          </div>
          <button type="button" onclick="cerrarModal('modalDetalleClaseMatriz'); abrirModalDocente('${asig.docenteId}')" style="background:none; border:none; color:var(--accent-primary); font-size:0.72rem; cursor:pointer; text-decoration:underline; padding:0; margin-top:3px;">
            Ver perfil y carga semanal
          </button>
        </div>

        <div style="background: var(--bg-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">👥 AFORO Y LLAVE:</div>
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
            ${asig.alumnosRegistrados || 30} alumnos registrados
          </div>
          <div style="font-size: 0.72rem; color: ${asig.llaveEntregada ? '#10b981' : '#f59e0b'};">
            🔑 Llave: ${asig.llaveEntregada ? 'Entregada en Bitácora' : 'No entregada / Pendiente'}
          </div>
        </div>
      </div>

      ${asig.observaciones ? `
        <div style="background: var(--bg-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 6px;">
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">📝 OBSERVACIONES / REQUERIMIENTOS:</div>
          <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">${asig.observaciones}</div>
        </div>
      ` : ''}
    `;
  }

  // Configurar botones del modal
  const btnLiberar = document.getElementById('btnModalLiberarClaseMatriz');
  if (btnLiberar) {
    btnLiberar.onclick = () => {
      cerrarModal('modalDetalleClaseMatriz');
      liberarEspacio(asig.id);
    };
  }

  const btnEditar = document.getElementById('btnModalEditarClaseMatriz');
  if (btnEditar) {
    btnEditar.onclick = () => {
      cerrarModal('modalDetalleClaseMatriz');
      editarAsignacion(asig.id);
    };
  }

  abrirModal('modalDetalleClaseMatriz');
};

function prepararModalCheckin() {
  const selEsp = document.getElementById('checkinEspacio');
  const selDoc = document.getElementById('checkinDocente');

  selEsp.innerHTML = '';
  Object.keys(EDIFICIOS).forEach(edifKey => {
    const edif = EDIFICIOS[edifKey];
    const espaciosEdif = ESPACIOS.filter(e => e.edificioId === edifKey);
    if (espaciosEdif.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = `${edif.icono} ${edif.nombre.toUpperCase()}`;
      espaciosEdif.forEach(esp => {
        const opt = document.createElement('option');
        opt.value = esp.id;
        opt.textContent = `${esp.id} — ${esp.nombre}`;
        optgroup.appendChild(opt);
      });
      selEsp.appendChild(optgroup);
    }
  });

  selDoc.innerHTML = '';
  AppState.docentes.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = `${doc.titulo} (${doc.carrera.toUpperCase()})`;
    selDoc.appendChild(opt);
  });
}

window.abrirCheckinParaEspacio = function(espacioId, docenteId) {
  prepararModalCheckin();
  document.getElementById('checkinEspacio').value = espacioId;
  if (docenteId) document.getElementById('checkinDocente').value = docenteId;
  abrirModal('modalCheckin');
};

// =============================================================================
// =============================================================================
// EXPORTACIÓN A CSV Y RESPALDO
// =============================================================================
function inicializarExportaciones() {
  const btnExpAsig = document.getElementById('btnExportarCSV');
  if (btnExpAsig) btnExpAsig.addEventListener('click', () => exportarAsignacionesCSV());

  const btnExpDocs = document.getElementById('btnExportarDocentesCSV');
  if (btnExpDocs) btnExpDocs.addEventListener('click', () => exportarDocentesCSV());

  const btnExpBit = document.getElementById('btnExportarBitacoraCSV');
  if (btnExpBit) btnExpBit.addEventListener('click', () => exportarBitacoraCSV());

  const btnExpBitTab5 = document.getElementById('btnExportarBitacoraCSVTab5');
  if (btnExpBitTab5) btnExpBitTab5.addEventListener('click', () => exportarBitacoraCSV());

  const btnExpAudTab5 = document.getElementById('btnExportarAuditoriaCSVTab5');
  if (btnExpAudTab5) {
    btnExpAudTab5.addEventListener('click', () => {
      if (typeof window.exportarAuditoriaCSV === 'function') {
        window.exportarAuditoriaCSV();
      } else {
        mostrarToast('Módulo de auditoría no disponible.', 'advertencia');
      }
    });
  }

  const btnExpRespJSON = document.getElementById('btnExportarRespaldoJSONTab5');
  if (btnExpRespJSON) {
    btnExpRespJSON.addEventListener('click', () => {
      if (typeof window.descargarRespaldo === 'function') {
        window.descargarRespaldo();
      } else {
        mostrarToast('Módulo de respaldo no inicializado.', 'error');
      }
    });
  }
}

function descargarCSV(contenido, nombreArchivo) {
  const blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
  if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
  mostrarToast(`Archivo descargado: ${nombreArchivo}`, 'success');
}
window.descargarCSV = descargarCSV;

function exportarAsignacionesCSV() {
  let csv = 'ID,Espacio ID,Nombre Espacio,Edificio,Carrera,Materia,Docente,Dia,Hora Inicio,Hora Fin,Grupo,Alumnos Registrados,Llave Entregada,Observaciones\n';
  AppState.asignaciones.forEach(a => {
    const esp = ESPACIOS.find(s => s.id === a.espacioId);
    const edifNombre = (esp && EDIFICIOS[esp.edificioId]) ? EDIFICIOS[esp.edificioId].nombre : (a.edificio || 'Campus FACSA');
    const obs = (a.observaciones || '').replace(/"/g, '""');
    const mat = (a.materia || '').replace(/"/g, '""');
    const doc = (a.docenteTitulo || '').replace(/"/g, '""');
    const espNom = (a.espacioNombre || (esp ? esp.nombre : a.espacioId)).replace(/"/g, '""');
    csv += `"${a.id}","${a.espacioId}","${espNom}","${edifNombre}","${a.carrera}","${mat}","${doc}","${a.dia}","${a.horaInicio}","${a.horaFin}","${a.grupo}",${a.alumnosRegistrados || 0},"${a.llaveEntregada ? 'SI' : 'NO'}","${obs}"\n`;
  });
  descargarCSV(csv, 'FACSA_UJED_Asignaciones_Horarios.csv');
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Exportación CSV', 'Horarios', 'Asignaciones', `Descarga de reporte CSV de asignaciones con ${AppState.asignaciones.length} registros`, 'info');
  }
}

function exportarDocentesCSV() {
  let csv = 'ID,Nombre Completo,Titulo,Carrera,Especialidad,Email,Telefono,Cubiculo,Carga Horaria Semanal\n';
  AppState.docentes.forEach(d => {
    const nom = (d.nombre || '').replace(/"/g, '""');
    const tit = (d.titulo || '').replace(/"/g, '""');
    const esp = (d.especialidad || '').replace(/"/g, '""');
    const cub = (d.cubiculo || '').replace(/"/g, '""');
    csv += `"${d.id}","${nom}","${tit}","${d.carrera}","${esp}","${d.email}","${d.telefono}","${cub}",${d.horasSemanales || 0}\n`;
  });
  descargarCSV(csv, 'Facultad_Ciencias_Salud_Directorio_Docentes.csv');
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Exportación CSV', 'Docentes', 'Directorio', `Descarga de directorio docente con ${AppState.docentes.length} profesores`, 'info');
  }
}

function exportarBitacoraCSV() {
  let csv = 'ID,Fecha Entrega,Hora Entrega,Docente,Carrera,Espacio ID,Espacio Nombre,Accion,Estado Llave,Personal Entrego,Fecha Devolucion,Hora Devolucion,Recibio Devolucion,Condicion Cierre Aula,Observaciones\n';
  AppState.bitacora.forEach(b => {
    const estado = b.estadoLlave || (b.llaveEntregada ? (b.horaDevolucion ? 'devuelta' : 'prestada') : 'sin_llave');
    const docNom = (b.docenteNombre || '').replace(/"/g, '""');
    const espNom = (b.espacioNombre || '').replace(/"/g, '""');
    const persEnt = (b.recibioPersonal || '').replace(/"/g, '""');
    const persDev = (b.recibioDevolucion || '').replace(/"/g, '""');
    const cond = (b.estadoFisicoAula || '').replace(/"/g, '""');
    const obs = (b.observaciones || b.observacionesDevolucion || '').replace(/"/g, '""');
    csv += `"${b.id}","${b.fecha}","${b.hora}","${docNom}","${b.carrera || ''}","${b.espacioId}","${espNom}","${b.accion}","${estado}","${persEnt}","${b.fechaDevolucion || ''}","${b.horaDevolucion || ''}","${persDev}","${cond}","${obs}"\n`;
  });
  descargarCSV(csv, 'FACSA_UJED_Bitacora_Control_Llaves.csv');
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Exportación CSV', 'Llaves', 'Bitácora', `Descarga de bitácora con ${AppState.bitacora.length} registros`, 'info');
  }
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
function mostrarToast(mensaje, tipo = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;

  let icon = 'ℹ️';
  if (tipo === 'success') icon = '✅';
  if (tipo === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${mensaje}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
