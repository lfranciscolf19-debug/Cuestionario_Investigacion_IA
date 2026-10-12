/**
 * admin.js — Módulo de Administración de Espacios y Edificios
 * Permite crear/eliminar edificios y aulas de forma persistente.
 * Los cambios se sincronizan con localStorage y se reflejan en todos los tabs.
 */

const ADMIN_KEY_EDIFICIOS = 'fcs_admin_edificios';
const ADMIN_KEY_AULAS     = 'fcs_admin_aulas';
const ADMIN_KEY_DELETED   = 'fcs_admin_deleted';

function cargarEdificiosExtra() {
  return JSON.parse(localStorage.getItem(ADMIN_KEY_EDIFICIOS)) || {};
}
function cargarAulasExtra() {
  return JSON.parse(localStorage.getItem(ADMIN_KEY_AULAS)) || [];
}
function cargarEliminados() {
  return new Set(JSON.parse(localStorage.getItem(ADMIN_KEY_DELETED)) || []);
}

function obtenerTodosEspacios() {
  const eliminados = cargarEliminados();
  const base = ESPACIOS.filter(e => !eliminados.has(e.id));
  const extras = cargarAulasExtra().filter(e => !eliminados.has(e.id));
  return [...base, ...extras];
}

function obtenerTodosEdificios() {
  return { ...EDIFICIOS, ...cargarEdificiosExtra() };
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER DEL PANEL DE ADMINISTRACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function renderAdminPanel() {
  const sel = document.getElementById('adminAulaEdificio');
  if (!sel) return;

  const todosEdificios = obtenerTodosEdificios();
  sel.innerHTML = '';
  Object.values(todosEdificios).forEach(ed => {
    const opt = document.createElement('option');
    opt.value = ed.id;
    opt.textContent = `${ed.icono || '🏢'} ${ed.nombre}`;
    sel.appendChild(opt);
  });

  renderAdminEdificiosGrid();
}

function renderAdminEdificiosGrid() {
  const grid = document.getElementById('adminListaEdificios');
  const badge = document.getElementById('adminTotalEdificios');
  if (!grid) return;

  const todosEdificios = obtenerTodosEdificios();
  const todosEspacios  = obtenerTodosEspacios();
  const edificiosExtra = cargarEdificiosExtra();
  const aulasExtraIds  = new Set(cargarAulasExtra().map(a => a.id));

  const edList = Object.values(todosEdificios);
  if (badge) badge.textContent = edList.length + ' edificios';

  grid.innerHTML = '';

  edList.forEach(ed => {
    const espaciosEd = todosEspacios.filter(e => e.edificioId === ed.id);
    const esPersonalizado = !!edificiosExtra[ed.id];

    const card = document.createElement('div');
    card.className = 'admin-building-card';

    const chipsHtml = espaciosEd.length > 0
      ? espaciosEd.map(esp => {
          const tipoIcon = { aula: '🏫', laboratorio: '🔬', audiovisual: '📽️', cancha: '⚽', domo: '🎪' }[esp.tipo] || '🏫';
          const canDel = aulasExtraIds.has(esp.id) || esPersonalizado;
          return `
            <span class="admin-aula-chip">
              ${tipoIcon} ${esp.id}
              <span style="color:var(--text-muted); font-weight:400;">${esp.capacidad}p</span>
              ${canDel ? `<button class="admin-aula-chip-del" onclick="eliminarAula('${esp.id}')" title="Eliminar ${esp.id}">×</button>` : ''}
            </span>
          `;
        }).join('')
      : '<span style="font-size:0.78rem; color:var(--text-muted); padding:4px 0;">Sin espacios registrados</span>';

    card.innerHTML = `
      <div class="admin-building-header">
        <div class="admin-building-color-dot" style="background: ${ed.color || '#6366f1'};"></div>
        <span style="font-size:1.1rem;">${ed.icono || '🏢'}</span>
        <span class="admin-building-name">${ed.nombre}</span>
        ${esPersonalizado ? '<span class="admin-building-custom-badge">NUEVO</span>' : ''}
        <span class="admin-building-count">${espaciosEd.length} espacios</span>
        ${esPersonalizado ? `<button class="admin-building-delete" onclick="eliminarEdificio('${ed.id}')" title="Eliminar edificio">🗑️</button>` : ''}
      </div>
      <div class="admin-aulas-list">${chipsHtml}</div>
    `;
    
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCIONES
// ─────────────────────────────────────────────────────────────────────────────
function crearNuevoEdificio() {
  const nombre = (document.getElementById('adminEdifNombre')?.value || '').trim();
  const desc   = (document.getElementById('adminEdifDesc')?.value || '').trim();
  const icono  = (document.getElementById('adminEdifIcono')?.value || '🏢').trim() || '🏢';
  const color  = document.getElementById('adminEdifColor')?.value || '#6366f1';

  if (!nombre) {
    mostrarToastAdmin('⚠️ Escribe el nombre del edificio', 'warn');
    document.getElementById('adminEdifNombre').focus();
    return;
  }

  const extras = cargarEdificiosExtra();
  if (Object.values({ ...EDIFICIOS, ...extras }).some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarToastAdmin('⚠️ Ya existe un edificio con ese nombre', 'warn');
    return;
  }

  const id = 'edif_custom_' + nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
  extras[id] = { id, nombre, etiqueta: `${nombre}${desc ? ' (' + desc + ')' : ''}`, icono, color, descripcion: desc, esPersonalizado: true };
  localStorage.setItem(ADMIN_KEY_EDIFICIOS, JSON.stringify(extras));

  if (typeof AppState !== 'undefined') {
    AppState.bitacora.unshift({
      id: 'BIT-ED-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      espacio: nombre,
      accion: `Nuevo edificio creado: ${nombre}`,
      responsable: 'Administrador',
      tipo: 'creacion'
    });
    if (typeof guardarDatosLocales === 'function') guardarDatosLocales();
  }

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Creación Edificio', 'Espacios', nombre, `Nuevo edificio agregado: "${nombre}" (${desc || 'Sin descripción'})`, 'info');
  }

  document.getElementById('adminEdifNombre').value = '';
  document.getElementById('adminEdifDesc').value = '';
  document.getElementById('adminEdifIcono').value = '';

  sincronizarEspaciosConApp();
  renderAdminPanel();
  mostrarToastAdmin(`✅ Edificio "${nombre}" creado`, 'success');
}

function crearNuevaAula() {
  const edificioId = document.getElementById('adminAulaEdificio')?.value;
  const id         = (document.getElementById('adminAulaId')?.value || '').trim().toUpperCase();
  const nombre     = (document.getElementById('adminAulaNombre')?.value || '').trim();
  const capacidad  = parseInt(document.getElementById('adminAulaCapacidad')?.value);
  const tipo       = document.getElementById('adminAulaTipo')?.value || 'aula';
  const carrera    = document.getElementById('adminAulaCarrera')?.value || '';
  const equipRaw   = (document.getElementById('adminAulaEquipamiento')?.value || '').trim();

  if (!edificioId) { mostrarToastAdmin('⚠️ Selecciona un edificio', 'warn'); return; }
  if (!id) { mostrarToastAdmin('⚠️ Escribe el ID del espacio', 'warn'); return; }
  if (!nombre) { mostrarToastAdmin('⚠️ Escribe el nombre del espacio', 'warn'); return; }
  if (!capacidad || capacidad < 1) { mostrarToastAdmin('⚠️ Ingresa una capacidad válida', 'warn'); return; }

  if (obtenerTodosEspacios().some(e => e.id === id)) {
    mostrarToastAdmin(`⚠️ El ID "${id}" ya existe en otro espacio`, 'warn');
    return;
  }

  const edObj = obtenerTodosEdificios()[edificioId];
  if (!edObj) return;

  const equipamiento = equipRaw ? equipRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Proyector', 'Climatizado'];
  const nuevoEspacio = {
    id, nombre, tipo, edificioId, edificio: edObj.nombre, capacidad, equipamiento, estado: 'disponible', esPersonalizado: true
  };
  if (carrera) nuevoEspacio.carreraExclusiva = carrera;

  const aulasExtra = cargarAulasExtra();
  aulasExtra.push(nuevoEspacio);
  localStorage.setItem(ADMIN_KEY_AULAS, JSON.stringify(aulasExtra));

  if (typeof AppState !== 'undefined') {
    AppState.bitacora.unshift({
      id: 'BIT-AUL-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      espacio: nombre,
      accion: `Nuevo espacio: ${id} — ${nombre} en ${edObj.nombre}`,
      responsable: 'Administrador',
      tipo: 'creacion'
    });
    if (typeof guardarDatosLocales === 'function') guardarDatosLocales();
  }

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Creación Aula', 'Espacios', id, `Espacio ${id} (${nombre}) creado en ${edObj.nombre}. Capacidad: ${capacidad}`, 'info');
  }

  document.getElementById('adminAulaId').value = '';
  document.getElementById('adminAulaNombre').value = '';
  document.getElementById('adminAulaCapacidad').value = '';
  document.getElementById('adminAulaEquipamiento').value = '';
  document.getElementById('adminAulaCarrera').value = '';

  sincronizarEspaciosConApp();
  renderAdminPanel();
  mostrarToastAdmin(`✅ Espacio "${id}" agregado`, 'success');
}

function eliminarAula(espId) {
  if (!confirm(`¿Eliminar el espacio "${espId}"?\nEsta acción no se puede deshacer.`)) return;

  const eliminados = cargarEliminados();
  eliminados.add(espId);
  localStorage.setItem(ADMIN_KEY_DELETED, JSON.stringify([...eliminados]));

  const aulasExtra = cargarAulasExtra().filter(a => a.id !== espId);
  localStorage.setItem(ADMIN_KEY_AULAS, JSON.stringify(aulasExtra));

  if (typeof AppState !== 'undefined') {
    AppState.asignaciones = AppState.asignaciones.filter(a => a.espacioId !== espId);
    AppState.bitacora.unshift({
      id: 'BIT-DEL-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      espacio: espId,
      accion: `Espacio eliminado: ${espId}`,
      responsable: 'Administrador',
      tipo: 'eliminacion'
    });
    if (typeof guardarDatosLocales === 'function') guardarDatosLocales();
  }

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Eliminación Aula', 'Espacios', espId, `Espacio ${espId} eliminado de la base de datos física`, 'critica');
  }

  sincronizarEspaciosConApp();
  renderAdminPanel();
  mostrarToastAdmin(`🗑️ Espacio "${espId}" eliminado`, 'info');
}

function eliminarEdificio(edificioId) {
  const extras = cargarEdificiosExtra();
  const ed = extras[edificioId];
  if (!ed) return;

  const espaciosEd = obtenerTodosEspacios().filter(e => e.edificioId === edificioId);
  if (!confirm(`¿Eliminar el edificio "${ed.nombre}" y sus ${espaciosEd.length} espacios?\nEsta acción no se puede deshacer.`)) return;

  delete extras[edificioId];
  localStorage.setItem(ADMIN_KEY_EDIFICIOS, JSON.stringify(extras));

  const eliminados = cargarEliminados();
  espaciosEd.forEach(e => eliminados.add(e.id));
  localStorage.setItem(ADMIN_KEY_DELETED, JSON.stringify([...eliminados]));

  const aulasExtra = cargarAulasExtra().filter(a => a.edificioId !== edificioId);
  localStorage.setItem(ADMIN_KEY_AULAS, JSON.stringify(aulasExtra));

  if (typeof AppState !== 'undefined') {
    AppState.asignaciones = AppState.asignaciones.filter(a => !espaciosEd.some(e => e.id === a.espacioId));
    AppState.bitacora.unshift({
      id: 'BIT-EDDEL-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      espacio: ed.nombre,
      accion: `Edificio eliminado: ${ed.nombre}`,
      responsable: 'Administrador',
      tipo: 'eliminacion'
    });
    if (typeof guardarDatosLocales === 'function') guardarDatosLocales();
  }

  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Eliminación Edificio', 'Espacios', ed.nombre, `Edificio "${ed.nombre}" y sus ${espaciosEd.length} aulas eliminados`, 'critica');
  }

  sincronizarEspaciosConApp();
  renderAdminPanel();
  mostrarToastAdmin(`🗑️ Edificio "${ed.nombre}" eliminado`, 'info');
}

// ─────────────────────────────────────────────────────────────────────────────
// SINCRONIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function sincronizarEspaciosConApp() {
  const eliminados   = cargarEliminados();
  const aulasExtra   = cargarAulasExtra();
  const edificExtra  = cargarEdificiosExtra();

  Object.assign(EDIFICIOS, edificExtra);

  for (let i = ESPACIOS.length - 1; i >= 0; i--) {
    if (eliminados.has(ESPACIOS[i].id)) ESPACIOS.splice(i, 1);
  }

  aulasExtra.forEach(nuevo => {
    if (eliminados.has(nuevo.id)) return;
    const idx = ESPACIOS.findIndex(e => e.id === nuevo.id);
    if (idx === -1) ESPACIOS.push(nuevo);
    else ESPACIOS[idx] = nuevo;
  });

  if (typeof actualizarTodo === 'function') actualizarTodo();
  if (typeof actualizarSelectoresEspacios === 'function') actualizarSelectoresEspacios();
  if (typeof renderFiltroEdificios === 'function') renderFiltroEdificios();
}

function mostrarToastAdmin(msg, tipo = 'success') {
  if (typeof mostrarToast === 'function') {
    mostrarToast(msg, tipo);
    return;
  }
  const tc = document.getElementById('toastContainer');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + tipo;
  t.textContent = msg;
  t.style.cssText = 'background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:0.8rem 1.2rem;font-size:0.88rem;color:var(--text-primary);margin-top:0.5rem;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Exponer funciones en window para invocaciones inline y módulos externos
window.renderAdminPanel = renderAdminPanel;
window.renderAdminEdificiosGrid = renderAdminEdificiosGrid;
window.crearNuevoEdificio = crearNuevoEdificio;
window.crearNuevaAula = crearNuevaAula;
window.eliminarEdificio = eliminarEdificio;
window.eliminarAula = eliminarAula;

document.addEventListener('DOMContentLoaded', () => {
  sincronizarEspaciosConApp();
  renderAdminPanel();
  document.querySelectorAll('.nav-tab[data-tab="tab-admin"]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(renderAdminPanel, 20);
    });
  });
});