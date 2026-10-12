// js/pdf.js
// Horarios en PDF con identidad UJED / FACSA:
//  - Por docente, por aula y por semestre/sección (grupo)
// Se genera una versión imprimible -> "Guardar como PDF" (horizontal, carta)

// Paleta institucional UJED (azul profundo + dorado)
const UJED = { azul: '#0b2a5b', azul2: '#143d82', oro: '#c9a227', oroClaro: '#f4e9bf', gris: '#f3f5f9' };

const COLOR_CARRERA = {
  medicina:   { bg: '#e3edff', borde: '#1d4ed8' },
  psicologia: { bg: '#f1e8ff', borde: '#7e3ff2' },
  nutricion:  { bg: '#e0f6ea', borde: '#15935a' },
  general:    { bg: '#eef1f6', borde: '#0b2a5b' }
};

const ESC = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ORDEN_DIAS = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };

// CSS de la cuadrícula (se usa dentro de .fcs-sched, tanto en pantalla como en PDF)
window.HORARIO_GRID_CSS = `
.fcs-sched { font-family: 'Segoe UI', 'Plus Jakarta Sans', Arial, sans-serif; color:#0f172a; }
.fcs-sched table.grid { width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed; font-size:12px;
  border:2px solid ${UJED.azul}; border-radius:10px; overflow:hidden; background:#fff; }
.fcs-sched .grid th { background:linear-gradient(180deg, ${UJED.azul2}, ${UJED.azul}); color:#fff; padding:10px 6px;
  letter-spacing:.8px; font-size:11.5px; text-transform:uppercase; border-right:1px solid rgba(255,255,255,.18); }
.fcs-sched .grid th:first-child { width:92px; background:${UJED.azul}; }
.fcs-sched .grid th.hoy { background:${UJED.oro}; color:${UJED.azul}; }
.fcs-sched .grid td { border-right:1px solid #dbe1ec; border-bottom:1px solid #dbe1ec; height:62px; padding:4px; vertical-align:middle; text-align:center; }
.fcs-sched .grid td:last-child { border-right:none; }
.fcs-sched .grid tr:last-child td { border-bottom:none; }
.fcs-sched .grid td.hora { background:${UJED.oroClaro}; color:${UJED.azul}; font-weight:800; font-size:11px; line-height:1.3; }
.fcs-sched .grid tr:nth-child(even) td:not(.hora):not(.clase) { background:${UJED.gris}; }
.fcs-sched .clase { border-left:4px solid ${UJED.azul}; text-align:left; padding:6px 8px; }
.fcs-sched .clase .mat { font-weight:800; font-size:11px; line-height:1.2; text-transform:uppercase; color:#0f172a; }
.fcs-sched .clase .aula { margin-top:3px; display:inline-block; font-size:10.5px; font-weight:700; color:#fff; background:${UJED.azul}; border-radius:20px; padding:1px 8px; }
.fcs-sched .clase .sub { margin-top:2px; font-size:10px; color:#475569; line-height:1.2; }
.fcs-sched .vacio { color:#b6c0d2; font-size:14px; }
.fcs-sched .gpo { display:inline-block; margin:3px 0 0 4px; font-size:10px; font-weight:700; color:#334155; }
`;

// Construye la cuadrícula semanal (HTML).
// modo: 'docente' (materia + aula + grupo) | 'aula' (materia + docente + grupo) | 'grupo' (materia + aula + docente)
window.generarHorarioGridHTML = function (clases, modo) {
  modo = modo || 'docente';
  const dias = (typeof DIAS_SEMANA !== 'undefined') ? DIAS_SEMANA : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const franjas = (typeof FRANJAS_HORARIAS !== 'undefined') ? FRANJAS_HORARIAS : [];

  // Rango visible: desde 07:00 hasta la última franja utilizada (mínimo hasta 15:00)
  let ultimo = 8;
  clases.forEach(c => { const i = franjas.findIndex(f => f.inicio === c.horaInicio); if (i > ultimo) ultimo = i; });
  const visibles = franjas.slice(0, ultimo + 1);

  const hoy = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
  const nombreDoc = c => c.docenteTitulo || c.docenteNombre || '';

  let html = '<table class="grid"><thead><tr><th>Hora</th>' +
    dias.map(d => `<th class="${d === hoy ? 'hoy' : ''}">${d}</th>`).join('') + '</tr></thead><tbody>';

  visibles.forEach(f => {
    html += `<tr><td class="hora">${f.inicio}<br>${f.fin}</td>`;
    dias.forEach(d => {
      const enCelda = clases.filter(x => x.dia === d && x.horaInicio === f.inicio);
      if (enCelda.length) {
        const c = enCelda[0];
        const col = COLOR_CARRERA[c.carrera] || COLOR_CARRERA.general;
        let detalle = '';
        if (modo === 'docente') {
          detalle = `<span class="aula" style="background:${col.borde}">${ESC(c.espacioId)}</span>${c.grupo ? `<span class="gpo">${ESC(c.grupo)}</span>` : ''}`;
        } else if (modo === 'aula') {
          detalle = `<div class="sub">${ESC(nombreDoc(c))}</div>${c.grupo ? `<span class="aula" style="background:${col.borde}">${ESC(c.grupo)}</span>` : ''}`;
        } else {
          detalle = `<span class="aula" style="background:${col.borde}">${ESC(c.espacioId)}</span><div class="sub">${ESC(nombreDoc(c))}</div>`;
        }
        html += `<td class="clase" style="background:${col.bg};border-left-color:${col.borde};">
          <div class="mat">${ESC(c.materia || 'Clase')}</div>${detalle}
          ${enCelda.length > 1 ? `<div class="sub" style="color:#b91c1c;font-weight:700;">+${enCelda.length - 1} traslape</div>` : ''}</td>`;
      } else {
        html += '<td><span class="vacio">·</span></td>';
      }
    });
    html += '</tr>';
  });
  return html + '</tbody></table>';
};

function ordenarClases(lista) {
  return lista.slice().sort((a, b) => (ORDEN_DIAS[a.dia] || 9) - (ORDEN_DIAS[b.dia] || 9) || a.horaInicio.localeCompare(b.horaInicio));
}

// ---------------------------------------------------------------------------
// Generador común del documento
// cfg: { titulo, subtitulo, carreraId, ficha:[[etiqueta, valor]], clases, modo, tabla:{cabeceras, filas} }
// ---------------------------------------------------------------------------
function abrirPDFHorario(cfg) {
  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const base = new URL('.', location.href).href;
  const carInfo = (typeof CARRERAS !== 'undefined' && CARRERAS[cfg.carreraId]) || null;
  const jefe = (carInfo && window.obtenerJefeCarrera && window.obtenerJefeCarrera(cfg.carreraId)) || '';

  const filas = cfg.tabla.filas.length
    ? cfg.tabla.filas.map(r => `<tr>${r.map(v => `<td>${ESC(v)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cfg.tabla.cabeceras.length}" style="text-align:center;color:#94a3b8">Sin clases asignadas</td></tr>`;

  const firma = carInfo
    ? `<div class="nombre-jefe">${jefe ? ESC(jefe) : '&nbsp;'}</div><div class="linea"></div>
       <b>Jefe(a) de la Licenciatura en ${ESC(carInfo.nombre)}</b><br>Facultad de Ciencias de la Salud · UJED`
    : `<div class="nombre-jefe">&nbsp;</div><div class="linea"></div>
       <b>Dirección / Coordinación Académica</b><br>Facultad de Ciencias de la Salud · UJED`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>${ESC(cfg.titulo)} - ${ESC(cfg.subtitulo)}</title>
<style>
  @page { size: 279mm 216mm; margin: 8mm; }
  @page { size: letter landscape; margin: 8mm; }
  html, body { width: 263mm; max-width: 100%; }
  @media screen { body { margin: 0 auto; padding: 8mm; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; color:#0f172a; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .banner { display:flex; align-items:center; gap:18px; background:#fff; border:1.5px solid #dbe1ec;
    padding:10px 18px; border-radius:12px; border-bottom:5px solid ${UJED.oro}; }
  .banner img { height:64px; width:auto; object-fit:contain; }
  .banner .titulo { margin-left:auto; text-align:right; padding-left:18px; border-left:3px solid ${UJED.oro}; }
  .banner .titulo b { display:block; font-size:17px; letter-spacing:1.5px; color:${UJED.azul}; text-transform:uppercase; }
  .banner .titulo span { font-size:11.5px; color:#475569; }
  .banner .lema { font-size:10.5px; color:#64748b; font-style:italic; margin-top:2px; }
  .ficha { display:flex; flex-wrap:wrap; gap:6px 26px; margin:12px 2px; font-size:12px; color:#334155; }
  .ficha b { color:${UJED.azul}; }
  .abajo { display:flex; gap:22px; margin-top:14px; align-items:flex-start; page-break-inside:avoid; }
  .resumen { flex:1.4; border-collapse:collapse; font-size:11px; border:1.5px solid ${UJED.azul}; }
  .resumen th { background:${UJED.azul}; color:#fff; text-align:left; padding:6px 8px; font-size:10.5px; letter-spacing:.6px; text-transform:uppercase; }
  .resumen td { padding:5px 8px; border-bottom:1px solid #dbe1ec; }
  .firma { flex:1; text-align:center; padding-top:30px; font-size:11px; color:#334155; }
  .firma .linea { border-top:1.5px solid ${UJED.azul}; width:80%; margin:0 auto 6px; }
  .firma b { color:${UJED.azul}; }
  .firma .nombre-jefe { font-weight:800; font-size:13px; color:#0f172a; text-transform:uppercase; min-height:18px; margin-bottom:2px; }
  .pie { margin-top:10px; border-top:3px solid ${UJED.oro}; padding-top:6px; display:flex; justify-content:space-between; font-size:9.5px; color:#64748b; }
  ${window.HORARIO_GRID_CSS}
</style></head><body>
  <div class="banner">
    <img src="${base}img/logo-facsa.png" alt="UJED · FACSA · Facultad de Ciencias de la Salud">
    <div class="lema">“Ciencia y Tecnología, Conciencia y Trabajo”</div>
    <div class="titulo"><b>${ESC(cfg.titulo)}</b><span>${ESC(cfg.subtitulo)}</span></div>
  </div>

  <div class="ficha">${cfg.ficha.map(([k, v]) => `<span><b>${ESC(k)}:</b> ${ESC(v)}</span>`).join('')}</div>

  <div class="fcs-sched">${window.generarHorarioGridHTML(cfg.clases, cfg.modo)}</div>

  <div class="abajo">
    <table class="resumen">
      <thead><tr>${cfg.tabla.cabeceras.map(h => `<th>${ESC(h)}</th>`).join('')}</tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <div class="firma">${firma}</div>
  </div>

  <div class="pie"><span>UJED · FACSA — Sistema de Control de Aulas</span><span>Generado el ${fecha}</span></div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 500); };<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para descargar el PDF.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function soloStaff() {
  if (window.rolActual !== 'admin' && window.rolActual !== 'superadmin') {
    alert('⛔ Solo Administradores pueden descargar este horario.');
    return false;
  }
  return true;
}

// Agrupa [materia -> Set(valores)] para las tablas resumen
function agrupar(clases, campoValor) {
  const m = {};
  clases.forEach(c => {
    const k = c.materia || 'Clase';
    m[k] = m[k] || new Set();
    const v = campoValor(c);
    if (v) m[k].add(v);
  });
  return m;
}

// ----------------------------- POR DOCENTE ---------------------------------
window.descargarHorarioDocentePDF = function (docenteId) {
  const esStaff = window.rolActual === 'admin' || window.rolActual === 'superadmin';
  const esPropio = window.rolActual === 'docente' && String(window.docenteActualId) === String(docenteId);
  if (!esStaff && !esPropio) { alert('Solo puedes descargar tu propio horario.'); return; }

  const doc = AppState.docentes.find(d => String(d.id) === String(docenteId));
  if (!doc) return;
  const clases = ordenarClases(AppState.asignaciones.filter(a => String(a.docenteId) === String(docenteId)));
  const carInfo = (typeof CARRERAS !== 'undefined' && CARRERAS[doc.carrera]) || { nombre: 'General' };

  const aulas = agrupar(clases, c => c.espacioId);
  const grupos = agrupar(clases, c => c.grupo);
  const semLabel = (typeof AppState !== 'undefined' && AppState.semestreActivo === 'semestre_b') 
    ? 'Semestre B (Agosto - Diciembre)' 
    : 'Semestre A (Enero - Junio)';
  abrirPDFHorario({
    titulo: 'Horario Docente', subtitulo: carInfo.nombre, carreraId: doc.carrera, modo: 'docente', clases,
    ficha: [['Docente', doc.titulo], ['Licenciatura', carInfo.nombre], ['Ciclo Escolar', semLabel], ['Carga semanal', (clases.length * 1.5) + ' hrs']],
    tabla: {
      cabeceras: ['Materia', 'Aula', 'Grado y Sección'],
      filas: Object.keys(aulas).sort().map(m => [m, [...aulas[m]].join(', '), [...grupos[m]].join(', ') || '-'])
    }
  });
};

// ------------------------------- POR AULA ----------------------------------
window.descargarHorarioAulaPDF = function (espacioId) {
  if (!soloStaff()) return;
  const esp = ESPACIOS.find(e => e.id === espacioId);
  if (!esp) return;
  const clases = ordenarClases(AppState.asignaciones.filter(a => a.espacioId === espacioId));
  const docs = agrupar(clases, c => c.docenteTitulo || c.docenteNombre);
  const grupos = agrupar(clases, c => c.grupo);
  const semLabel = (typeof AppState !== 'undefined' && AppState.semestreActivo === 'semestre_b') 
    ? 'Semestre B (Agosto - Diciembre)' 
    : 'Semestre A (Enero - Junio)';
  abrirPDFHorario({
    titulo: 'Horario de Aula', subtitulo: esp.id + ' · ' + (esp.edificio || ''), carreraId: null, modo: 'aula', clases,
    ficha: [['Aula', esp.id + ' — ' + (esp.nombre || '')], ['Edificio', esp.edificio || '-'], ['Ciclo Escolar', semLabel],
            ['Capacidad', (esp.capacidad || '-') + ' personas'], ['Horas ocupadas', (clases.length * 1.5) + ' hrs / semana']],
    tabla: {
      cabeceras: ['Materia', 'Maestros', 'Grado y Sección'],
      filas: Object.keys(docs).sort().map(m => [m, [...docs[m]].join(', '), [...grupos[m]].join(', ') || '-'])
    }
  });
};

// ----------------------- POR SEMESTRE Y SECCIÓN (GRUPO) --------------------
window.descargarHorarioGrupoPDF = function (grupo) {
  if (!soloStaff()) return;
  const clases = ordenarClases(AppState.asignaciones.filter(a => a.grupo === grupo));
  const m = (grupo.match(/(\d)\d{2}-([A-Z])/i) || []);
  const semestre = m[1] ? m[1] + '° Semestre' : '-';
  const seccion = m[2] ? m[2].toUpperCase() : '-';
  const carreraId = (clases[0] && clases[0].carrera) || null;
  const docs = agrupar(clases, c => c.docenteTitulo || c.docenteNombre);
  const aulas = agrupar(clases, c => c.espacioId);
  const semLabel = (typeof AppState !== 'undefined' && AppState.semestreActivo === 'semestre_b') 
    ? 'Semestre B (Agosto - Diciembre)' 
    : 'Semestre A (Enero - Junio)';
  abrirPDFHorario({
    titulo: 'Horario de Grupo', subtitulo: grupo, carreraId: carreraId === 'general' ? null : carreraId, modo: 'grupo', clases,
    ficha: [['Grupo', grupo], ['Semestre', semestre], ['Sección', seccion], ['Ciclo Escolar', semLabel],
            ['Licenciatura', (CARRERAS[carreraId] && CARRERAS[carreraId].nombre) || 'General']],
    tabla: {
      cabeceras: ['Materia', 'Maestros', 'Aula'],
      filas: Object.keys(docs).sort().map(mt => [mt, [...docs[mt]].join(', '), [...aulas[mt]].join(', ') || '-'])
    }
  });
};

// ---------------------------------------------------------------------------
// Ventana "Descargar horarios" (docente / aula / semestre y sección)
// ---------------------------------------------------------------------------
window.abrirModalDescargas = function () {
  if (!soloStaff()) return;
  const previo = document.getElementById('modalDescargasPDF');
  if (previo) previo.remove();

  const docentes = AppState.docentes.slice().sort((a, b) => a.titulo.localeCompare(b.titulo));
  const aulas = ESPACIOS.slice().sort((a, b) => a.id.localeCompare(b.id, 'es', { numeric: true }));
  const grupos = [...new Set(AppState.asignaciones.map(a => a.grupo).filter(Boolean))].sort();

  const estiloSel = 'width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:0.9rem;box-sizing:border-box;';
  const estiloBtn = 'margin-top:10px;width:100%;padding:10px;border-radius:10px;border:none;background:var(--accent-primary);color:#fff;font-weight:700;cursor:pointer;';
  const bloque = (icono, titulo, id, opciones, accion) => `
    <div style="text-align:left;margin-bottom:18px;padding:14px;border:1px solid var(--border-color);border-radius:14px;">
      <div style="font-weight:800;font-size:0.9rem;color:var(--text-primary);margin-bottom:8px;">${icono} ${titulo}</div>
      <select id="${id}" style="${estiloSel}">${opciones}</select>
      <button type="button" data-accion="${accion}" style="${estiloBtn}">📄 Descargar PDF</button>
    </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'modalDescargasPDF';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:20px;padding:1.6rem;width:92%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="margin:0;font-size:1.2rem;color:var(--text-primary);">📄 Descargar Horarios (PDF)</h3>
        <button type="button" id="btnDescargasCerrar" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);">&times;</button>
      </div>
      ${bloque('👨‍🏫', 'Por docente', 'selDescDocente', docentes.map(d => `<option value="${ESC(d.id)}">${ESC(d.titulo)}</option>`).join(''), 'docente')}
      ${bloque('🏫', 'Por aula', 'selDescAula', aulas.map(a => `<option value="${ESC(a.id)}">${ESC(a.id)} — ${ESC(a.edificio || '')}</option>`).join(''), 'aula')}
      ${bloque('🎓', 'Por semestre y sección', 'selDescGrupo', grupos.map(g => `<option value="${ESC(g)}">${ESC(g)}</option>`).join(''), 'grupo')}
    </div>`;
  document.body.appendChild(overlay);

  const cerrar = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
  overlay.querySelector('#btnDescargasCerrar').onclick = cerrar;
  overlay.querySelectorAll('button[data-accion]').forEach(b => {
    b.onclick = () => {
      const a = b.dataset.accion;
      if (a === 'docente') descargarHorarioDocentePDF(overlay.querySelector('#selDescDocente').value);
      if (a === 'aula') descargarHorarioAulaPDF(overlay.querySelector('#selDescAula').value);
      if (a === 'grupo') descargarHorarioGrupoPDF(overlay.querySelector('#selDescGrupo').value);
    };
  });
};
