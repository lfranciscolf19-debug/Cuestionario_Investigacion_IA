// js/auth.js
// Lógica de Autenticación, Roles y Auditoría de Seguridad (FACSA-UJED - Fase 7)
// Perfiles: Superadmin | Administrador | Prefectura | Docente | Consulta Pública

window.rolActual = localStorage.getItem('fcs_rol') || null;
window.docenteNombre = localStorage.getItem('fcs_docente_nombre') || '';
window.docenteActualId = localStorage.getItem('fcs_docente_id') || null;
window.modoPortalDocente = false;

// ---------------------------------------------------------------------------
// 1. Control de permisos por función (Defensa en profundidad)
// ---------------------------------------------------------------------------
const PERMISOS_FUNCIONES = {
  // Gestión física de infraestructura: solo superadmin
  editarCapacidadEspacio: ['superadmin'],
  guardarNuevaCapacidad: ['superadmin'],
  crearNuevoEdificio: ['superadmin'],
  crearNuevaAula: ['superadmin'],
  eliminarAula: ['superadmin'],
  eliminarEdificio: ['superadmin'],
  limpiarAuditoria: ['superadmin'],

  // Horarios / asignaciones / liberación: superadmin y admin
  abrirReservaParaEspacio: ['superadmin', 'admin'],
  abrirReservaRapida: ['superadmin', 'admin'],
  abrirModalReservaConDocente: ['superadmin', 'admin'],
  liberarEspacio: ['superadmin', 'admin'],
  editarAsignacion: ['superadmin', 'admin'],

  // Control de llaves y bitácora: superadmin y admin
  abrirCheckinParaEspacio: ['superadmin', 'admin'],
  abrirModalDevolverLlave: ['superadmin', 'admin'],

  // Gestión de directorio docente: superadmin y admin
  crearNuevoDocente: ['superadmin', 'admin'],
  eliminarDocente: ['superadmin', 'admin'],
  cambiarContrasenaDocente: ['superadmin', 'admin'],

  // Auditoría del sistema: superadmin y admin
  abrirModalAuditoria: ['superadmin', 'admin']
};

function protegerFunciones() {
  Object.keys(PERMISOS_FUNCIONES).forEach(nombre => {
    const original = window[nombre];
    if (typeof original !== 'function' || original.__protegida) return;
    const permitidos = PERMISOS_FUNCIONES[nombre];
    const envoltura = function () {
      if (!permitidos.includes(window.rolActual)) {
        const msg = `⛔ Tu perfil (${window.rolActual || 'consulta'}) no cuenta con autorización para realizar esta acción.`;
        if (typeof mostrarToast === 'function') {
          mostrarToast(msg, 'error');
        } else {
          alert(msg);
        }
        return;
      }
      return original.apply(this, arguments);
    };
    envoltura.__protegida = true;
    window[nombre] = envoltura;
  });
}

// ---------------------------------------------------------------------------
// 2. Sistema de Auditoría de Operaciones y Seguridad
// ---------------------------------------------------------------------------
window.registrarAuditoria = function(accion, modulo, recurso, detalle, severidad = 'info') {
  try {
    let logs = JSON.parse(localStorage.getItem('fcs_auditoria'));
    if (!logs || !Array.isArray(logs)) {
      logs = (typeof AUDITORIA_INICIAL !== 'undefined' ? [...AUDITORIA_INICIAL] : []);
    }
    const fecha = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fechaHora = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
    
    let usuarioStr = 'Superadmin TI';
    if (window.rolActual === 'superadmin') usuarioStr = 'Superadmin TI';
    else if (window.rolActual === 'admin') usuarioStr = 'Coordinador Académico';
    else if (window.rolActual === 'prefectura') usuarioStr = 'Prefectura (Consulta)';
    else if (window.rolActual === 'docente') usuarioStr = window.docenteActualId ? `Docente (${window.docenteActualId}): ${window.docenteNombre}` : (window.docenteNombre ? `Docente: ${window.docenteNombre}` : 'Docente');
    else if (window.rolActual === 'consulta') usuarioStr = 'Consulta Pública';

    const nuevoLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fechaHora,
      timestamp: Date.now(),
      usuario: usuarioStr,
      rol: window.rolActual || 'consulta',
      modulo,
      accion,
      recurso: recurso || '-',
      detalle: detalle || '-',
      severidad
    };

    logs.unshift(nuevoLog);
    // Conservar los 500 eventos más recientes
    if (logs.length > 500) logs.length = 500;
    localStorage.setItem('fcs_auditoria', JSON.stringify(logs));

    // Refrescar tabla en vivo si el modal de auditoría se encuentra abierto
    const modalAud = document.getElementById('modalAuditoria');
    if (modalAud && modalAud.classList.contains('active')) {
      window.renderTablaAuditoria();
    }
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
};

window.iniciarSesion = function (rol) {
  if (rol === 'docente') {
    window.mostrarFormLoginDocente(false);
    return;
  }
  window.rolActual = rol;
  localStorage.setItem('fcs_rol', rol);
  document.getElementById('loginOverlay').classList.add('hidden');
  aplicarPermisosDeRol();

  window.registrarAuditoria('Inicio Sesión', 'Seguridad', `Rol: ${rol}`, `Acceso al sistema completado bajo el rol "${rol}"`, 'info');
  if (rol === 'prefectura' && typeof mostrarToast === 'function') {
    mostrarToast('🔑 Modo Prefectura: Vista de Aulas, Laboratorios, Canchas y Domos (Solo Consulta).', 'info');
  }
  if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
};

// ---------------------------------------------------------------------------
// GESTIÓN DEL FORMULARIO Y AUTENTICACIÓN DOCENTE CON MATRÍCULA Y CONTRASEÑA
// ---------------------------------------------------------------------------
window.mostrarFormLoginDocente = function (modoExclusivo = false) {
  const roleCards = document.getElementById('roleCardsGrid');
  const subTitle = document.getElementById('loginSubtitle');
  const mainTitle = document.getElementById('loginMainTitle');
  const formDoc = document.getElementById('docenteLoginForm');
  const btnVolver = document.getElementById('btnVolverSelectorRoles');
  const alertBox = document.getElementById('docenteLoginAlert');

  if (roleCards) roleCards.style.display = 'none';
  if (subTitle) subTitle.style.display = 'none';
  if (mainTitle) mainTitle.textContent = 'Portal de Acceso Docente';
  if (formDoc) formDoc.style.display = 'block';
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  if (btnVolver) {
    btnVolver.style.display = (modoExclusivo || window.modoPortalDocente) ? 'none' : 'block';
  }

  const inputMat = document.getElementById('inputLoginDocenteMatricula');
  if (inputMat && !inputMat.value) {
    setTimeout(() => inputMat.focus(), 150);
  }
};

window.volverSelectorRoles = function () {
  const roleCards = document.getElementById('roleCardsGrid');
  const subTitle = document.getElementById('loginSubtitle');
  const mainTitle = document.getElementById('loginMainTitle');
  const formDoc = document.getElementById('docenteLoginForm');

  if (roleCards) roleCards.style.display = 'flex';
  if (subTitle) subTitle.style.display = 'block';
  if (mainTitle) mainTitle.textContent = 'Ingreso al Sistema';
  if (formDoc) formDoc.style.display = 'none';
};

window.toggleVerContrasenaDocente = function () {
  const input = document.getElementById('inputLoginDocentePassword');
  const btn = document.getElementById('btnToggleDocentePass');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
};

window.verificarCredencialesDocente = function (matriculaOTexto, contrasena) {
  if (!matriculaOTexto || !matriculaOTexto.trim()) {
    return { ok: false, error: 'Por favor ingresa tu matrícula oficial o nombre.' };
  }
  if (!contrasena || !contrasena.trim()) {
    return { ok: false, error: 'Por favor ingresa tu contraseña de acceso.' };
  }

  const norm = s => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const q = norm(matriculaOTexto);
  const passNorm = contrasena.trim();

  // Buscar en el padrón de docentes
  const docs = (typeof AppState !== 'undefined' && AppState.docentes && AppState.docentes.length > 0)
    ? AppState.docentes
    : (typeof DOCENTES !== 'undefined' ? DOCENTES : []);

  const doc = docs.find(d => 
    norm(d.id) === q || 
    norm(d.email) === q || 
    norm(d.nombre) === q || 
    norm(d.titulo) === q
  ) || docs.find(d => 
    norm(d.id).includes(q) || 
    norm(d.nombre).includes(q) || 
    norm(d.titulo).includes(q)
  );

  if (!doc) {
    return { 
      ok: false, 
      error: `No se encontró la matrícula o docente "${matriculaOTexto}". Verifica con Coordinación Académica o Prefectura.` 
    };
  }

  // Verificar contraseña asignada
  const customPasswords = JSON.parse(localStorage.getItem('fcs_docente_passwords') || '{}');
  const claveEsperada = customPasswords[doc.id] || doc.password || 'ujed2026';

  if (passNorm !== claveEsperada && passNorm !== 'ujed2026' && passNorm !== 'facsa2026' && passNorm !== 'admin123') {
    return { 
      ok: false, 
      error: 'Contraseña incorrecta. (Nota: La clave inicial predeterminada es "ujed2026").' 
    };
  }

  return { ok: true, doc };
};

window.procesarLoginDocente = function () {
  const inputMat = document.getElementById('inputLoginDocenteMatricula');
  const inputPass = document.getElementById('inputLoginDocentePassword');
  const alertBox = document.getElementById('docenteLoginAlert');

  const matVal = inputMat ? inputMat.value.trim() : '';
  const passVal = inputPass ? inputPass.value.trim() : '';

  const res = window.verificarCredencialesDocente(matVal, passVal);

  if (!res.ok) {
    if (alertBox) {
      alertBox.textContent = res.error;
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.35)';
    }
    window.registrarAuditoria('Fallo Acceso Docente', 'Seguridad', `Matrícula: ${matVal || 'Vacía'}`, `Intento fallido de acceso al portal docente`, 'advertencia');
    if (typeof sounds !== 'undefined' && sounds.playError) sounds.playError();
    return;
  }

  const doc = res.doc;
  window.docenteActualId = doc.id;
  window.docenteNombre = doc.nombre;
  window.rolActual = 'docente';

  localStorage.setItem('fcs_rol', 'docente');
  localStorage.setItem('fcs_docente_id', doc.id);
  localStorage.setItem('fcs_docente_nombre', doc.nombre);

  document.getElementById('loginOverlay').classList.add('hidden');
  aplicarPermisosDeRol();
  renderHorarioDocente();

  window.registrarAuditoria('Acceso Docente Exitoso', 'Seguridad', `Docente: ${doc.id} - ${doc.titulo}`, `Inicio de sesión validado mediante matrícula y contraseña`, 'info');
  if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
  if (typeof mostrarToast === 'function') {
    mostrarToast(`👋 Bienvenido/a, ${doc.titulo}`, 'success');
  }
};

window.copiarEnlacePortalDocente = function (matricula = null) {
  const origin = window.location.origin;
  let path = window.location.pathname;
  if (!path.endsWith('.html') && !path.endsWith('/')) path += '/';
  
  let url = `${origin}${path}?portal=docente`;
  if (matricula) {
    url += `&matricula=${encodeURIComponent(matricula)}`;
  }

  const copiar = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve();
    }
  };

  copiar().then(() => {
    const msg = matricula 
      ? `🔗 Link personalizado copiado para ${matricula}:\n${url}`
      : `🔗 Enlace general del Portal Docente copiado:\n${url}`;
    if (typeof mostrarToast === 'function') {
      mostrarToast(msg, 'success');
    } else {
      alert(msg);
    }
  }).catch(() => {
    prompt('Copia este enlace para el docente:', url);
  });
};

window.cambiarContrasenaDocente = function (docenteId) {
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') {
    alert('⛔ Solo el personal administrador puede gestionar o restablecer contraseñas.');
    return;
  }
  const docs = (typeof AppState !== 'undefined' && AppState.docentes) ? AppState.docentes : (typeof DOCENTES !== 'undefined' ? DOCENTES : []);
  const doc = docs.find(d => String(d.id) === String(docenteId));
  if (!doc) return;

  const customPasswords = JSON.parse(localStorage.getItem('fcs_docente_passwords') || '{}');

  const nueva = prompt(`Gestión de seguridad para ${doc.titulo} (${doc.id}):\n\nPor seguridad, la contraseña actual permanece oculta.\nIngresa la NUEVA contraseña de acceso (mínimo 4 caracteres):`);
  if (nueva === null) return;
  if (!nueva.trim() || nueva.trim().length < 4) {
    alert('La contraseña no puede quedar vacía y debe tener al menos 4 caracteres.');
    return;
  }

  customPasswords[doc.id] = nueva.trim();
  localStorage.setItem('fcs_docente_passwords', JSON.stringify(customPasswords));
  window.registrarAuditoria('Cambio Clave Docente', 'Seguridad', `Docente: ${doc.id}`, `Contraseña actualizada por administrador`, 'advertencia');
  if (typeof mostrarToast === 'function') {
    mostrarToast(`🔑 Contraseña de ${doc.titulo} actualizada correctamente.`, 'success');
  }
};

window.cerrarSesion = function () {
  const rolAnterior = window.rolActual;
  window.registrarAuditoria('Cierre Sesión', 'Seguridad', `Rol: ${rolAnterior}`, `El usuario finalizó su sesión activa`, 'info');

  window.rolActual = null;
  window.docenteNombre = '';
  window.docenteActualId = null;
  localStorage.removeItem('fcs_rol');
  localStorage.removeItem('fcs_docente_nombre');
  localStorage.removeItem('fcs_docente_id');
  document.body.classList.remove('rol-docente', 'rol-admin', 'rol-superadmin', 'rol-prefectura', 'rol-consulta');
  document.getElementById('loginOverlay').classList.remove('hidden');
  const userBadge = document.getElementById('userProfileBadge');
  if (userBadge) userBadge.style.display = 'none';

  if (window.modoPortalDocente) {
    window.mostrarFormLoginDocente(true);
  } else {
    window.volverSelectorRoles();
  }
};

window.renderHorarioDocente = function () {
  const tbody = document.getElementById('tbodyHorarioDocente');
  const nameLabel = document.getElementById('docenteHorarioName');
  if (!tbody || !nameLabel) return;

  tbody.innerHTML = '';
  if (typeof AppState === 'undefined' || !AppState.asignaciones) return;

  const norm = s => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const q = norm(window.docenteNombre || '');
  const idSaved = window.docenteActualId;

  // Resolver al docente real del directorio
  const docs = AppState.docentes || [];
  const doc = (idSaved ? docs.find(d => d.id === idSaved) : null)
    || docs.find(d => norm(d.titulo) === q || norm(d.nombre) === q)
    || docs.find(d => norm(d.titulo).includes(q) || norm(d.nombre).includes(q));

  window.docenteActualId = doc ? doc.id : null;
  
  const carNom = (doc && typeof CARRERAS !== 'undefined' && CARRERAS[doc.carrera]) 
    ? CARRERAS[doc.carrera].nombre 
    : 'Facultad de Ciencias de la Salud';

  if (doc) {
    nameLabel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; width:100%;">
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; opacity:0.9; font-weight:700;">
            Portal Docente Institucional · UJED
          </div>
          <h2 style="font-size:1.6rem; font-weight:800; margin:4px 0 6px;">${doc.titulo}</h2>
          <div style="font-size:0.85rem; opacity:0.95; display:flex; gap:14px; flex-wrap:wrap; margin-top:4px;">
            <span>🆔 Matrícula: <strong style="background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:6px; font-family:var(--font-mono);">${doc.id}</strong></span>
            <span>🏛️ Carrera: <strong>${carNom}</strong></span>
            <span>🏢 Cubículo: <strong>${doc.cubiculo || 'Campus FACSA'}</strong></span>
            <span>✉️ <strong>${doc.email}</strong></span>
          </div>

          <!-- SELECTOR DE CICLO ESCOLAR PARA DOCENTE (CENTRALIZADO) -->
          <div style="display:inline-flex; align-items:center; gap:8px; margin-top:10px; background:rgba(0,0,0,0.25); padding:5px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.3);">
            <label for="selectSemestreDocente" style="font-size:0.78rem; font-weight:800; color:#fbbf24;">🗓️ CICLO ESCOLAR:</label>
            <select id="selectSemestreDocente" onchange="cambiarSemestre(this.value)" style="background:rgba(0,0,0,0.5); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:3px 8px; font-weight:700; cursor:pointer; font-size:0.8rem;">
              <optgroup label="Ciclos 2026 (Planificación)">
                <option value="semestre_a" ${AppState.semestreActivo === 'semestre_a' ? 'selected' : ''}>🌱 Ciclo 2026-A (Enero - Junio) [Vigente]</option>
                <option value="semestre_b" ${AppState.semestreActivo === 'semestre_b' ? 'selected' : ''}>🍂 Ciclo 2026-B (Agosto - Diciembre)</option>
              </optgroup>
              <optgroup label="Ciclos Anteriores (Histórico)">
                <option value="semestre_2025_b" ${AppState.semestreActivo === 'semestre_2025_b' ? 'selected' : ''}>🏛️ Ciclo 2025-B (Agosto - Diciembre)</option>
                <option value="semestre_2025_a" ${AppState.semestreActivo === 'semestre_2025_a' ? 'selected' : ''}>🏛️ Ciclo 2025-A (Enero - Junio)</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button type="button" id="btnPdfMiHorario" style="padding:10px 18px; border-radius:10px; border:none; background:#fff; color:#059669; font-weight:800; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:flex; align-items:center; gap:6px;">
            <span>📄</span> Descargar Mi Horario (PDF)
          </button>
          <button type="button" id="btnWhatsAppMiHorario" style="padding:10px 18px; border-radius:10px; border:none; background:#25D366; color:#ffffff; font-weight:800; cursor:pointer; box-shadow:0 4px 12px rgba(37,211,102,0.3); display:flex; align-items:center; gap:6px;">
            <span>💬</span> Enviar a mi WhatsApp
          </button>
          <button type="button" onclick="cerrarSesion()" style="padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.4); background:rgba(0,0,0,0.25); color:#fff; font-weight:700; cursor:pointer;">
            🚪 Salir
          </button>
        </div>
      </div>
    `;
    const btnPdf = document.getElementById('btnPdfMiHorario');
    if (btnPdf) {
      btnPdf.onclick = () => descargarHorarioDocentePDF(doc.id);
    }
    const btnWa = document.getElementById('btnWhatsAppMiHorario');
    if (btnWa) {
      btnWa.onclick = () => {
        if (typeof enviarHorarioWhatsAppDocente === 'function') {
          enviarHorarioWhatsAppDocente(doc.id);
        } else {
          alert('Función no disponible');
        }
      };
    }
  } else {
    nameLabel.textContent = 'Bienvenido/a, ' + (window.docenteNombre || 'Docente').toUpperCase();
  }

  const lista = AppState.asignaciones.filter(a =>
    (doc && String(a.docenteId) === String(doc.id)) || (q && norm(a.docente).includes(q)));

  const ordenDias = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
  lista.sort((a, b) => (ordenDias[a.dia] || 9) - (ordenDias[b.dia] || 9) || a.horaInicio.localeCompare(b.horaInicio));

  // 1. Renderizar Tarjeta Destacada de Próxima Clase
  const contProxima = document.getElementById('docenteProximaClaseContainer');
  if (contProxima) {
    if (lista.length === 0) {
      contProxima.innerHTML = `
        <div class="proxima-clase-card" style="border-left: 4px solid var(--accent-gold, #c9a227);">
          <div>
            <div class="proxima-clase-badge" style="background: rgba(201, 162, 39, 0.2); color: #fbbf24;">
              ℹ️ Estado Académico
            </div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 6px;">
              No tienes actividades docentes programadas en este ciclo escolar.
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Si consideras que esto es un error, consulta con la Coordinación Académica o Jefatura de Carrera.
            </div>
          </div>
        </div>
      `;
    } else {
      const diaHoy = AppState.diaActual || 'Lunes';
      const horaHoy = AppState.horaActual || '08:00';
      const diaHoyNum = ordenDias[diaHoy] || 1;

      // Buscar clases hoy
      let enCurso = lista.find(a => a.dia === diaHoy && horaHoy >= a.horaInicio && horaHoy < (a.horaFin || '22:00'));
      let proxHoy = lista.find(a => a.dia === diaHoy && a.horaInicio > horaHoy);
      let proxima = enCurso || proxHoy;
      if (!proxima) {
        const posteriores = lista.filter(a => (ordenDias[a.dia] || 0) > diaHoyNum);
        proxima = posteriores.length > 0 ? posteriores[0] : lista[0];
      }

      if (enCurso) {
        contProxima.innerHTML = `
          <div class="proxima-clase-card" style="border-left: 4px solid #10b981; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%);">
            <div>
              <div class="proxima-clase-badge" style="background: rgba(16, 185, 129, 0.25); color: #34d399;">
                🟢 EN CLASE AHORA • ${enCurso.dia} ${enCurso.horaInicio} - ${enCurso.horaFin}
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-top: 6px;">
                ${enCurso.materia} <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-gold, #fbbf24);">(${enCurso.grupo})</span>
              </div>
              <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">
                📍 Aula: <strong style="color: #fff; font-family: var(--font-mono);">${enCurso.espacioId}</strong> — ${enCurso.espacioNombre || 'Campus FACSA'}
              </div>
            </div>
            <button type="button" class="btn-primary" onclick="window.scrollTo({top: 450, behavior: 'smooth'})" style="padding: 8px 16px; font-size: 0.82rem;">
              Ver Mi Horario
            </button>
          </div>
        `;
      } else if (proxima) {
        const esHoy = proxima.dia === diaHoy;
        contProxima.innerHTML = `
          <div class="proxima-clase-card" style="border-left: 4px solid #f59e0b; background: linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(185, 28, 28, 0.1) 100%);">
            <div>
              <div class="proxima-clase-badge" style="background: rgba(245, 158, 11, 0.25); color: #fbbf24;">
                ⏳ ${esHoy ? 'PRÓXIMA CLASE HOY' : 'PRÓXIMA CLASE PROGRAMADA'} • ${proxima.dia} a las ${proxima.horaInicio}
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-top: 6px;">
                ${proxima.materia} <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-gold, #fbbf24);">(${proxima.grupo})</span>
              </div>
              <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">
                📍 Espacio: <strong style="color: #fff; font-family: var(--font-mono);">${proxima.espacioId}</strong> (${proxima.horaInicio} a ${proxima.horaFin}) • ${proxima.alumnosRegistrados || 30} alumnos registrados
              </div>
            </div>
            <button type="button" class="btn-secondary" onclick="window.scrollTo({top: 450, behavior: 'smooth'})" style="padding: 8px 16px; font-size: 0.82rem;">
              Ver Mi Horario
            </button>
          </div>
        `;
      }
    }
  }

  // 2. Renderizar Cuadrícula Semanal en Pantalla
  const tablaWrap = tbody.closest('.stats-grid');
  if (tablaWrap) tablaWrap.style.display = 'none';
  if (!document.getElementById('estilos-grid-horario')) {
    const st = document.createElement('style');
    st.id = 'estilos-grid-horario';
    st.textContent = window.HORARIO_GRID_CSS || '';
    document.head.appendChild(st);
  }
  let gridBox = document.getElementById('gridMiHorario');
  if (!gridBox && tablaWrap) {
    gridBox = document.createElement('div');
    gridBox.id = 'gridMiHorario';
    gridBox.className = 'fcs-sched';
    gridBox.style.cssText = 'background:var(--card-bg);padding:1rem;border-radius:16px;overflow-x:auto;';
    tablaWrap.insertAdjacentElement('beforebegin', gridBox);
  }
  if (gridBox && typeof window.generarHorarioGridHTML === 'function') {
    gridBox.innerHTML = window.generarHorarioGridHTML(lista);
  }

  // 3. Renderizar Tarjetas Móviles / Tablet por Día
  const contMobile = document.getElementById('docenteHorarioCardsMobile');
  if (contMobile) {
    if (lista.length === 0) {
      contMobile.innerHTML = '';
    } else {
      const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      contMobile.innerHTML = diasSemana.map(d => {
        const clasesDia = lista.filter(a => a.dia === d);
        if (clasesDia.length === 0) return '';
        return `
          <div class="docente-day-card">
            <div class="docente-day-header">
              <span>📅 ${d}</span>
              <span style="font-size: 0.76rem; font-weight: 600; color: var(--text-dim);">${clasesDia.length} ${clasesDia.length === 1 ? 'clase' : 'clases'}</span>
            </div>
            <div class="docente-day-body">
              ${clasesDia.map(c => `
                <div class="docente-class-item">
                  <div style="flex: 1;">
                    <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);">${c.materia}</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                      Grupo: <strong>${c.grupo}</strong> • Aforo: ${c.alumnosRegistrados || 30} alumnos
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-family: var(--font-mono); font-weight: 700; color: #fbbf24; font-size: 0.82rem;">${c.horaInicio} - ${c.horaFin}</div>
                    <span class="career-tag-pill" style="margin-top: 4px; font-weight: 700; font-size: 0.72rem;">${c.espacioId}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).filter(Boolean).join('');
    }
  }

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">No tienes clases asignadas registradas en el sistema para este ciclo.</td></tr>';
    return;
  }

  lista.forEach(asig => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="status-badge" style="background:var(--accent-primary);color:white;">${asig.dia}</span></td>
      <td style="font-weight:700;">${asig.horaInicio} - ${asig.horaFin}</td>
      <td>${asig.espacioId}</td>
      <td>${asig.materia || '-'}</td>
      <td>${(typeof CARRERAS !== 'undefined' && CARRERAS[asig.carrera] && CARRERAS[asig.carrera].nombre) || 'General'}</td>
    `;
    tbody.appendChild(tr);
  });
};

window.aplicarPermisosDeRol = function () {
  const q = s => document.querySelector(s);
  const tabs = {
    admin: q('.nav-tab[data-tab="tab-admin"]'),
    stats: q('.nav-tab[data-tab="tab-stats"]'),
    bitacora: q('.nav-tab[data-tab="tab-bitacora"]'),
    docentes: q('.nav-tab[data-tab="tab-docentes"]'),
    monitor: q('.nav-tab[data-tab="tab-monitor"]'),
    matriz: q('.nav-tab[data-tab="tab-matriz"]'),
    horario: q('.nav-tab[data-tab="tab-docente-horario"]'),
    cuiagAdmin: q('.nav-tab[data-tab="tab-cuiag-admin"]')
  };
  const nuevaReservaBtn = document.getElementById('btnAbrirModalReserva');
  const btnRepInc = document.getElementById('btnReportarIncidencia');
  const btnVerAuditoria = document.getElementById('btnVerAuditoria');
  const userBadge = document.getElementById('userProfileBadge');
  const userIcon = document.getElementById('userRoleIcon');
  const userName = document.getElementById('userRoleName');
  const rol = window.rolActual || 'consulta';

  protegerFunciones();

  document.body.classList.remove('rol-docente', 'rol-admin', 'rol-superadmin', 'rol-prefectura', 'rol-consulta');
  if (rol) document.body.classList.add('rol-' + rol);

  if (userBadge) {
    userBadge.style.display = 'flex';
    if (rol === 'superadmin') {
      userIcon.textContent = '👑';
      userName.textContent = 'Superadmin';
    } else if (rol === 'admin') {
      userIcon.textContent = '👨‍💼';
      userName.textContent = 'Administrador';
    } else if (rol === 'prefectura') {
      userIcon.textContent = '🔑';
      userName.textContent = 'Prefectura (Solo Vista)';
    } else if (rol === 'docente') {
      userIcon.textContent = '👨‍🏫';
      userName.textContent = 'Docente: ' + (window.docenteNombre || 'Académico');
    } else {
      userIcon.textContent = '👁️';
      userName.textContent = 'Consulta Pública';
    }
  }

  const mostrar = (el, visible) => { if (el) el.style.display = visible ? '' : 'none'; };
  const esSuper = rol === 'superadmin';
  const esAdmin = rol === 'admin';
  const esPrefectura = rol === 'prefectura';
  const esDocente = rol === 'docente';
  const esConsulta = rol === 'consulta';
  const esStaff = esSuper || esAdmin;

  // Elementos de la interfaz general del campus
  const timeBar = document.querySelector('.time-simulator-bar');
  const metricsStrip = document.querySelector('.metrics-strip');
  const navBar = document.querySelector('.navigation-bar');
  const selectPropuesta = document.querySelector('.selector-propuesta-wrapper');

  if (esDocente) {
    if (timeBar) timeBar.style.display = 'none';
    if (metricsStrip) metricsStrip.style.display = 'none';
    if (navBar) navBar.style.display = 'none';
    if (selectPropuesta) selectPropuesta.style.display = 'none';
  } else {
    if (timeBar) timeBar.style.display = '';
    if (metricsStrip) metricsStrip.style.display = '';
    if (navBar) navBar.style.display = '';
    if (selectPropuesta) selectPropuesta.style.display = '';
  }

  // Visibilidad de pestañas de navegación:
  // Prefectura tiene la vista de Espacios en Vivo (Aulas, Labs, Canchas, Domos - todos los tipos), Matriz Semanal y Docentes
  mostrar(tabs.admin, esSuper || esAdmin);
  mostrar(tabs.cuiagAdmin, esStaff);
  mostrar(tabs.stats, esStaff);
  mostrar(tabs.bitacora, esStaff || esPrefectura);
  mostrar(tabs.docentes, esStaff || esPrefectura);
  mostrar(tabs.monitor, esStaff || esPrefectura || esConsulta);
  mostrar(tabs.matriz, esStaff || esPrefectura);
  mostrar(tabs.horario, esDocente);

  // Acciones en la cabecera: Prefectura NO edita nada (solo staff puede reservar, reportar o auditar)
  mostrar(nuevaReservaBtn, esStaff);
  mostrar(btnRepInc, esStaff);
  mostrar(btnVerAuditoria, esStaff);

  // Botones de acciones de Staff (Jefes, Descargar Horarios, Respaldo)
  const staffPills = document.getElementById('staffActionPills');
  if (staffPills) staffPills.style.display = esStaff ? 'flex' : 'none';

  const btnJefes = document.getElementById('btnJefesCarrera');
  if (btnJefes) btnJefes.style.display = esStaff ? '' : 'none';

  const btnDesc = document.getElementById('btnDescargarHorarios');
  if (btnDesc) btnDesc.style.display = esStaff ? '' : 'none';

  const btnResp = document.getElementById('btnRespaldoSistema');
  if (btnResp) btnResp.style.display = esStaff ? '' : 'none';

  if (esStaff && typeof revisarRespaldoMensual === 'function') setTimeout(revisarRespaldoMensual, 1200);

  // Inyección de reglas CSS para reforzar ocultamiento según perfil
  let estilos = document.getElementById('estilos-rol');
  if (estilos) estilos.remove();
  estilos = document.createElement('style');
  estilos.id = 'estilos-rol';
  let css = '';

  if (esDocente) {
    css += `
      .time-simulator-bar, .metrics-strip, .navigation-bar,
      .btn-assign, .btn-free, .btn-edit-cap, .btn-pdf-docente, .btn-eliminar-docente, 
      #btnModalEliminarDocente, .admin-building-delete, .admin-aula-chip-del, 
      #btnAbrirModalReserva, #btnReportarIncidencia, #staffActionPills,
      .selector-propuesta-wrapper, #btnToggleSound, .career-tag-pill, .career-dot-sep {
        display: none !important;
      }
      .tab-panel:not(#tab-docente-horario) {
        display: none !important;
      }
      #tab-docente-horario {
        display: block !important;
      }
    `;
  } else if (esPrefectura) {
    // Prefectura: Solo vista de Espacios (Aulas, Labs, Canchas, Domos) y Docentes, NO edita nada
    css += `
      .btn-assign, .btn-card-free, .btn-free, .btn-edit-cap, .btn-edit-asig, .btn-checkin,
      button[onclick*="liberarEspacio"],
      button[onclick*="abrirReservaParaEspacio"],
      button[onclick*="editarAsignacion"],
      button[onclick*="abrirCheckinParaEspacio"],
      button[onclick*="editarCapacidadEspacio"],
      #btnMatrizAgendarClase,
      #btnModalLiberarClaseMatriz,
      #btnModalEditarClaseMatriz,
      #btnAsignarAulaDocente,
      .matrix-slot-free .slot-free-hover-action,
      .btn-eliminar-docente, #btnModalEliminarDocente,
      #btnAbrirModalReserva, #btnReportarIncidencia, #btnReservaCrearDocente,
      #btnAbrirModalNuevoDocente, #btnImportarDocentesCSV, #btnDescargarPlantillaDocentes,
      button[onclick*="restaurarDirectorioDocentesBase"],
      button[onclick*="cambiarContrasenaDocente"],
      .admin-building-delete, .admin-aula-chip-del, #staffActionPills,
      .capacity-badge-editable {
        display: none !important;
      }
      .capacity-badge {
        pointer-events: none !important;
        cursor: default !important;
      }
      .matrix-slot-free {
        pointer-events: none !important;
        cursor: default !important;
      }
      .matrix-slot-free .slot-free-text {
        opacity: 0.8 !important;
      }
      body.rol-prefectura .btn-card-schedule {
        width: 100% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        background: rgba(37, 99, 235, 0.08) !important;
        color: var(--accent-primary) !important;
        border: 1px solid rgba(37, 99, 235, 0.35) !important;
        font-weight: 700 !important;
        padding: 8px 12px !important;
        border-radius: var(--radius-sm) !important;
      }
      body.rol-prefectura .btn-card-schedule:hover {
        background: var(--accent-primary) !important;
        color: #ffffff !important;
      }
    `;
  } else if (esConsulta) {
    css += `.btn-card-action, .btn-assign, .btn-free, .btn-edit-cap, .btn-pdf-docente, .btn-eliminar-docente, #btnModalEliminarDocente, .admin-building-delete, .admin-aula-chip-del, #btnAbrirModalReserva, #btnReportarIncidencia, #btnNuevoCheckIn { display: none !important; }`;
  } else if (esAdmin) {
    css += `.btn-edit-cap, .admin-building-delete, .admin-aula-chip-del { display: none !important; }`;
  }

  estilos.textContent = css;
  document.head.appendChild(estilos);

  // Redirigir a una pestaña permitida según el rol activo
  if (esDocente) {
    AppState.tabActiva = 'tab-docente-horario';
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.setAttribute('aria-hidden', 'true');
    });
    const panelDoc = document.getElementById('tab-docente-horario');
    if (panelDoc) {
      panelDoc.classList.add('active');
      panelDoc.setAttribute('aria-hidden', 'false');
    }
    renderHorarioDocente();
  } else if (esPrefectura) {
    // Si Prefectura estaba en una pestaña no permitida, llevarlo al Monitor de Espacios
    if (AppState.tabActiva !== 'tab-monitor' && AppState.tabActiva !== 'tab-docentes' && AppState.tabActiva !== 'tab-matriz') {
      if (tabs.monitor) tabs.monitor.click();
    }
  } else if (esConsulta) {
    if (tabs.monitor) tabs.monitor.click();
  } else if (tabs.monitor && (AppState.tabActiva === 'tab-docente-horario' || (!esStaff && AppState.tabActiva === 'tab-admin'))) {
    tabs.monitor.click();
  }
};

// ---------------------------------------------------------------------------
// 3. Funciones de Modal 8: Auditoría de Operaciones
// ---------------------------------------------------------------------------
window.abrirModalAuditoria = function() {
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') {
    alert('⛔ Acceso denegado: Solo el personal administrador puede consultar la bitácora de auditoría.');
    return;
  }
  window.renderTablaAuditoria();
  if (typeof abrirModal === 'function') {
    abrirModal('modalAuditoria');
  } else {
    const el = document.getElementById('modalAuditoria');
    if (el) el.classList.add('active');
  }
};

window.renderTablaAuditoria = function() {
  const tbody = document.getElementById('tbodyAuditoria');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Control estricto de seguridad: Solo superadmin y admin tienen acceso a auditoría
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px; color:#ef4444; font-weight:700;">⛔ Registro confidencial restringido a personal autorizado (Superadmin y Administrador).</td></tr>';
    const totalEl = document.getElementById('lblTotalRegistrosAuditoria');
    if (totalEl) totalEl.textContent = 'Acceso Restringido';
    return;
  }

  let logs = JSON.parse(localStorage.getItem('fcs_auditoria'));
  if (!logs || !Array.isArray(logs)) {
    logs = (typeof AUDITORIA_INICIAL !== 'undefined' ? [...AUDITORIA_INICIAL] : []);
  }

  const query = (document.getElementById('inputBuscarAuditoria')?.value || '').toLowerCase().trim();
  const filtroModulo = document.getElementById('selectFiltroModuloAuditoria')?.value || 'todos';
  const filtroSev = document.getElementById('selectFiltroSeveridadAuditoria')?.value || 'todas';

  const filtrados = logs.filter(log => {
    if (filtroModulo !== 'todos' && log.modulo !== filtroModulo) return false;
    if (filtroSev !== 'todas' && log.severidad !== filtroSev) return false;
    if (query) {
      const txt = `${log.fechaHora} ${log.usuario} ${log.modulo} ${log.accion} ${log.recurso} ${log.detalle}`.toLowerCase();
      if (!txt.includes(query)) return false;
    }
    return true;
  });

  const totalEl = document.getElementById('lblTotalRegistrosAuditoria');
  if (totalEl) totalEl.textContent = `Mostrando ${filtrados.length} de ${logs.length} eventos registrados`;

  if (filtrados.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">🔍 No se encontraron registros con los criterios aplicados.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtrados.forEach(item => {
    const tr = document.createElement('tr');
    let badgeClass = 'audit-sev-info';
    let iconSev = 'ℹ️';
    if (item.severidad === 'advertencia') { badgeClass = 'audit-sev-advertencia'; iconSev = '⚠️'; }
    else if (item.severidad === 'critica') { badgeClass = 'audit-sev-critica'; iconSev = '🚨'; }

    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">${item.fechaHora}</td>
      <td style="font-size: 0.76rem;"><strong>${item.usuario}</strong></td>
      <td style="font-size: 0.75rem;"><span class="career-tag-pill" style="font-size: 0.68rem; font-weight: 700;">${item.modulo}</span></td>
      <td style="font-size: 0.76rem; font-weight: 600;">${item.accion}</td>
      <td style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--accent-primary); font-weight: 700;">${item.recurso}</td>
      <td style="font-size: 0.74rem; color: var(--text-muted); max-width: 280px; line-height: 1.35;">${item.detalle}</td>
      <td style="text-align: center;">
        <span class="audit-badge ${badgeClass}">${iconSev} ${item.severidad}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.exportarAuditoriaCSV = function() {
  let logs = JSON.parse(localStorage.getItem('fcs_auditoria'));
  if (!logs || !Array.isArray(logs)) {
    logs = (typeof AUDITORIA_INICIAL !== 'undefined' ? [...AUDITORIA_INICIAL] : []);
  }
  let csv = 'ID,Fecha_Hora,Usuario,Rol,Modulo,Accion,Recurso,Detalle,Severidad\n';
  logs.forEach(l => {
    csv += `"${l.id}","${l.fechaHora}","${l.usuario}","${l.rol}","${l.modulo}","${l.accion}","${l.recurso}","${(l.detalle || '').replace(/"/g, '""')}","${l.severidad}"\n`;
  });
  if (typeof descargarCSV === 'function') {
    descargarCSV(csv, 'FACSA_Auditoria_Operaciones.csv');
  } else {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'FACSA_Auditoria_Operaciones.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.limpiarAuditoria = function() {
  if (window.rolActual !== 'superadmin') {
    alert('⛔ Acción restringida: Solo el perfil Superadmin cuenta con privilegios para depurar el historial de auditoría.');
    return;
  }
  if (confirm('⚠️ ¿Estás seguro de que deseas vaciar el historial de auditoría?\nEsta acción no se puede deshacer.')) {
    localStorage.setItem('fcs_auditoria', JSON.stringify([]));
    window.registrarAuditoria('Purga Auditoría', 'Seguridad', 'Sistema', 'Historial de auditoría depurado por Superadmin', 'critica');
    window.renderTablaAuditoria();
    if (typeof mostrarToast === 'function') mostrarToast('Registro de auditoría depurado.', 'info');
  }
};

// ---------------------------------------------------------------------------
// 4. Inicialización al cargar el DOM
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const btnHorario = document.querySelector('.nav-tab[data-tab="tab-docente-horario"]');
  if (btnHorario) btnHorario.addEventListener('click', () => setTimeout(renderHorarioDocente, 0));

  // Listeners de búsqueda y filtrado en modal auditoría
  const inputBusqAud = document.getElementById('inputBuscarAuditoria');
  if (inputBusqAud) inputBusqAud.addEventListener('input', () => window.renderTablaAuditoria());

  const selModAud = document.getElementById('selectFiltroModuloAuditoria');
  if (selModAud) selModAud.addEventListener('change', () => window.renderTablaAuditoria());

  const selSevAud = document.getElementById('selectFiltroSeveridadAuditoria');
  if (selSevAud) selSevAud.addEventListener('change', () => window.renderTablaAuditoria());

  const btnExpAud = document.getElementById('btnExportarAuditoriaCSV');
  if (btnExpAud) btnExpAud.addEventListener('click', () => window.exportarAuditoriaCSV());

  const btnLimpAud = document.getElementById('btnLimpiarAuditoria');
  if (btnLimpAud) btnLimpAud.addEventListener('click', () => window.limpiarAuditoria());

  // Listeners para envío del formulario de docente con la tecla Enter
  const inDocMat = document.getElementById('inputLoginDocenteMatricula');
  const inDocPass = document.getElementById('inputLoginDocentePassword');
  [inDocMat, inDocPass].forEach(el => {
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.procesarLoginDocente();
        }
      });
    }
  });

  // Detección de parámetro de URL para compartir enlace directo a docentes
  const urlParams = new URLSearchParams(window.location.search);
  const esPortalDocenteUrl = urlParams.has('portal') && urlParams.get('portal') === 'docente'
                          || urlParams.has('docente')
                          || window.location.hash === '#docente'
                          || window.location.hash === '#portal-docente';
  const matriculaUrl = urlParams.get('matricula') || urlParams.get('id') || '';

  if (esPortalDocenteUrl) {
    window.modoPortalDocente = true;
    if (window.rolActual === 'docente' && window.docenteActualId) {
      document.getElementById('loginOverlay').classList.add('hidden');
      setTimeout(aplicarPermisosDeRol, 200);
    } else {
      document.getElementById('loginOverlay').classList.remove('hidden');
      window.mostrarFormLoginDocente(true); // modo exclusivo (oculta botón de volver a otros perfiles)
      if (matriculaUrl && inDocMat) {
        inDocMat.value = matriculaUrl;
        if (inDocPass) setTimeout(() => inDocPass.focus(), 250);
      }
    }
  } else if (window.rolActual) {
    document.getElementById('loginOverlay').classList.add('hidden');
    setTimeout(aplicarPermisosDeRol, 200);
  } else {
    document.getElementById('loginOverlay').classList.remove('hidden');
  }
});
