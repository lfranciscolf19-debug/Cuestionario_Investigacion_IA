// js/respaldo.js
// Centro Institucional de Respaldo, Seguridad y Recuperación de Datos FACSA-UJED
// - Respaldo: exporta archivo JSON estructurado con metadatos, conteos y datos del campus.
// - Restauración: validación previa de esquema, conteo previo de entidades, respaldo preventivo y auditoría.
// - Recordatorio mensual: alerta proactiva si han transcurrido más de 30 días sin respaldo.
// - Reinicio seguro: disponible exclusivamente para Superadmin con confirmación textual y respaldo automático forzado.

const RESPALDO_ULTIMO = 'fcs_ultimo_respaldo';
const RESPALDO_DIAS = 30;

// Claves institucionales que se respaldan integralmente
const CLAVES_RESPALDO = [
  'fcs_semestre_activo',
  'fcs_asignaciones_semestre_a',
  'fcs_asignaciones_semestre_b',
  'fcs_asignaciones_v3',
  'fcs_asignaciones_v2',
  'fcs_capacidades',
  'unicampus_bitacora',
  'unicampus_incidencias',
  'fcs_docentes',
  'fcs_docente_passwords',
  'fcs_admin_edificios',
  'fcs_admin_aulas',
  'fcs_admin_deleted',
  'fcs_jefes_carrera',
  'fcs_auditoria',
  'unicampus_theme',
  'unicampus_sound',
  'fcs_propuesta_visual',
  'fcs_estilo_franja'
];

// Claves que se vacían con el reinicio de aulas (se conservan docentes y jefaturas)
const CLAVES_RESET_VACIAS = {
  'fcs_asignaciones_semestre_a': '[]',
  'fcs_asignaciones_semestre_b': '[]',
  'fcs_asignaciones_v3': '[]',
  'fcs_asignaciones_v2': '[]',
  'unicampus_bitacora': '[]',
  'unicampus_incidencias': '[]'
};
const CLAVES_RESET_BORRAR = [
  'fcs_capacidades',
  'fcs_admin_edificios',
  'fcs_admin_aulas',
  'fcs_admin_deleted'
];

function diasDesdeUltimoRespaldo() {
  const t = localStorage.getItem(RESPALDO_ULTIMO);
  if (!t) return Infinity;
  return (Date.now() - new Date(t).getTime()) / 86400000;
}

function textoUltimoRespaldo() {
  const t = localStorage.getItem(RESPALDO_ULTIMO);
  if (!t) return 'Sin respaldo previo registrado';
  return new Date(t).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
}

// Descarga el respaldo como archivo JSON con metadatos y estadísticas completas
window.descargarRespaldo = function (esPreventivo = false) {
  const datos = {};
  CLAVES_RESPALDO.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) datos[k] = v;
  });

  const asigs = (JSON.parse(localStorage.getItem('fcs_asignaciones_v3')) || []);
  const docs = (JSON.parse(localStorage.getItem('fcs_docentes')) || []);
  const bit = (JSON.parse(localStorage.getItem('unicampus_bitacora')) || []);
  const inc = (JSON.parse(localStorage.getItem('unicampus_incidencias')) || []);
  const aud = (JSON.parse(localStorage.getItem('fcs_auditoria')) || []);

  const paquete = {
    sistema: 'FACSA-UJED Control de Aulas',
    version: 2,
    tipo: esPreventivo ? 'respaldo_preventivo_seguridad' : 'respaldo_completo',
    fecha: new Date().toISOString(),
    usuario: window.rolActual || 'sistema',
    estadisticas: {
      totalAsignaciones: asigs.length,
      totalDocentes: docs.length,
      totalBitacora: bit.length,
      totalIncidencias: inc.length,
      totalAuditoria: aud.length
    },
    datos
  };

  const blob = new Blob([JSON.stringify(paquete, null, 2)], { type: 'application/json;charset=utf-8;' });
  const f = new Date();
  const pad = n => String(n).padStart(2, '0');
  const prefijo = esPreventivo ? 'respaldo-preventivo-facsa' : 'respaldo-facsa-ujed';
  const nombre = `${prefijo}-${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}-${pad(f.getHours())}${pad(f.getMinutes())}.json`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 600);

  localStorage.setItem(RESPALDO_ULTIMO, new Date().toISOString());

  if (typeof registrarAuditoria === 'function') {
    const accionTipo = esPreventivo ? 'Respaldo Preventivo' : 'Copia de Seguridad';
    registrarAuditoria(accionTipo, 'Seguridad', 'Sistema', `Descarga de paquete JSON "${nombre}" (${asigs.length} clases, ${docs.length} docentes, ${bit.length} registros bitácora)`, 'info');
  }

  if (typeof mostrarToast === 'function') {
    mostrarToast(`💾 Copia de seguridad guardada: ${nombre}`, 'success');
  }

  return nombre;
};

// Validación y vista previa de restauración desde archivo
function procesarArchivoRestauracion(file, contenedorResultado) {
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const contenido = JSON.parse(lector.result);
      if (!contenido) throw new Error('El archivo está vacío o no es un JSON válido.');

      // Soporte para formato v2 (contenido.datos) o plano legado (contenido directo)
      const datos = contenido.datos || contenido;
      if (typeof datos !== 'object' || datos === null) {
        throw new Error('Estructura de respaldo inválida.');
      }

      // Validar presencia de claves esenciales
      const tieneClavesValidas = Object.keys(datos).some(k => CLAVES_RESPALDO.includes(k));
      if (!tieneClavesValidas) {
        throw new Error('El archivo no contiene claves reconocibles del sistema FACSA-UJED.');
      }

      // Extraer estadísticas del archivo
      let countAsig = 0;
      let countDocs = 0;
      let countBit = 0;
      let countInc = 0;
      let countAud = 0;

      try { if (datos['fcs_asignaciones_v3']) countAsig = JSON.parse(datos['fcs_asignaciones_v3']).length; } catch (e) {}
      try { if (datos['fcs_docentes']) countDocs = JSON.parse(datos['fcs_docentes']).length; } catch (e) {}
      try { if (datos['unicampus_bitacora']) countBit = JSON.parse(datos['unicampus_bitacora']).length; } catch (e) {}
      try { if (datos['unicampus_incidencias']) countInc = JSON.parse(datos['unicampus_incidencias']).length; } catch (e) {}
      try { if (datos['fcs_auditoria']) countAud = JSON.parse(datos['fcs_auditoria']).length; } catch (e) {}

      const fechaArchivo = contenido.fecha ? new Date(contenido.fecha).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }) : 'Fecha no especificada';

      // Renderizar vista previa de confirmación
      contenedorResultado.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px; margin-top: 12px;">
          <div style="font-weight: 800; color: #10b981; font-size: 0.9rem; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>✅</span> Paquete de Respaldo Verificado
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
            Archivo: <strong style="color: var(--text-primary);">${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)<br>
            Fecha del paquete: <strong style="color: var(--text-primary);">${fechaArchivo}</strong>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.76rem; background: var(--bg-surface); padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--border-color);">
            <div>📅 Clases / Horarios: <strong style="color: var(--accent-primary);">${countAsig}</strong></div>
            <div>👨‍🏫 Docentes: <strong style="color: var(--accent-primary);">${countDocs}</strong></div>
            <div>📋 Bitácora llaves: <strong style="color: var(--accent-primary);">${countBit}</strong></div>
            <div>⚠️ Incidencias: <strong style="color: var(--accent-primary);">${countInc}</strong></div>
            ${countAud > 0 ? `<div>🛡️ Auditoría: <strong style="color: var(--accent-primary);">${countAud}</strong></div>` : ''}
          </div>

          <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 8px 10px; border-radius: 4px; font-size: 0.75rem; color: #f59e0b; margin-bottom: 12px;">
            ⚠️ <strong>Atención:</strong> Esta operación reemplazará los datos actuales. Se generará automáticamente un <strong>respaldo preventivo de seguridad</strong> antes de aplicar los cambios.
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" id="btnConfirmarRestauracionDefinitiva" style="flex: 1; padding: 9px 12px; border-radius: 8px; border: none; background: #10b981; color: white; font-weight: 700; cursor: pointer; font-size: 0.82rem;">
              Confirmar y Restaurar
            </button>
            <button type="button" id="btnCancelarRestauracion" style="padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); cursor: pointer; font-size: 0.82rem;">
              Cancelar
            </button>
          </div>
        </div>
      `;

      contenedorResultado.querySelector('#btnCancelarRestauracion').onclick = () => {
        contenedorResultado.innerHTML = '';
      };

      contenedorResultado.querySelector('#btnConfirmarRestauracionDefinitiva').onclick = () => {
        // 1. Respaldo preventivo forzado de seguridad
        descargarRespaldo(true);

        // 2. Aplicar claves
        setTimeout(() => {
          Object.keys(datos).forEach(k => {
            if (CLAVES_RESPALDO.includes(k)) {
              localStorage.setItem(k, datos[k]);
            }
          });

          // 3. Registrar auditoría
          if (typeof registrarAuditoria === 'function') {
            registrarAuditoria('Restauración de Respaldo', 'Seguridad', 'Sistema', `Restauración aplicada desde "${file.name}". ${countAsig} horarios, ${countDocs} docentes`, 'advertencia');
          }

          if (typeof mostrarToast === 'function') {
            mostrarToast('✅ Respaldo restaurado con éxito. Recargando sistema...', 'success');
          }

          setTimeout(() => {
            location.reload();
          }, 800);
        }, 500);
      };

    } catch (err) {
      contenedorResultado.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 12px; margin-top: 10px; font-size: 0.8rem; color: #ef4444;">
          ❌ <strong>Error al procesar archivo:</strong> ${err.message || 'Formato inválido.'}
        </div>
      `;
    }
  };
  lector.readAsText(file);
}

function ejecutarReset() {
  Object.keys(CLAVES_RESET_VACIAS).forEach(k => localStorage.setItem(k, CLAVES_RESET_VACIAS[k]));
  CLAVES_RESET_BORRAR.forEach(k => localStorage.removeItem(k));
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria('Reinicio de Infraestructura', 'Seguridad', 'Sistema', 'Reinicio completo de horarios y aulas por Superadmin', 'critica');
  }
  alert('🗑️ Información de aulas reiniciada correctamente. La página se recargará.');
  location.reload();
}

window.abrirModalRespaldo = function () {
  const rol = window.rolActual;
  if (rol !== 'superadmin' && rol !== 'admin') {
    if (typeof mostrarToast === 'function') {
      mostrarToast('⛔ Solo Administradores y Superadmins pueden acceder a respaldos.', 'advertencia');
    }
    return;
  }

  const previo = document.getElementById('modalRespaldo');
  if (previo) previo.remove();
  const esSuper = rol === 'superadmin';

  const asigsTotal = (JSON.parse(localStorage.getItem('fcs_asignaciones_v3')) || []).length;
  const docsTotal = (JSON.parse(localStorage.getItem('fcs_docentes')) || []).length;
  const bitTotal = (JSON.parse(localStorage.getItem('unicampus_bitacora')) || []).length;

  const btn = (id, txt, estilo) => `<button type="button" id="${id}" style="padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer;width:100%;transition:all 0.2s ease;${estilo}">${txt}</button>`;
  
  const overlay = document.createElement('div');
  overlay.id = 'modalRespaldo';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modalRespaldoTitulo');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.8);backdrop-filter:blur(6px);z-index:9500;display:flex;align-items:center;justify-content:center;';
  
  overlay.innerHTML = `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:20px;padding:1.6rem;width:92%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 48px rgba(0,0,0,0.5);text-align:left;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <h3 id="modalRespaldoTitulo" style="margin:0;font-size:1.25rem;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
          <span>💾</span> Centro de Respaldo y Seguridad
        </h3>
        <button type="button" id="btnRespCerrar" aria-label="Cerrar ventana" style="background:none;border:none;font-size:1.6rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
      </div>

      <!-- Métricas rápidas de datos actuales -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:12px;margin-bottom:14px;text-align:center;">
        <div>
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Clases Activas</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--accent-primary);">${asigsTotal}</div>
        </div>
        <div>
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Docentes</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${docsTotal}</div>
        </div>
        <div>
          <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Bitácora</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${bitTotal}</div>
        </div>
      </div>

      <p style="margin:0 0 14px;font-size:0.8rem;color:var(--text-muted);">
        Último respaldo: <b id="txtUltimoResp" style="color:var(--text-primary);">${textoUltimoRespaldo()}</b>.
      </p>

      <!-- SECCIÓN EXPORTACIÓN -->
      <div style="padding:14px;border:1px solid var(--border-color);border-radius:14px;margin-bottom:14px;background:rgba(255,255,255,0.015);">
        <div style="font-weight:800;font-size:0.92rem;color:var(--text-primary);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
          <span>📥</span> Copia de Seguridad Completa (JSON)
        </div>
        <p style="margin:0 0 10px;font-size:0.78rem;color:var(--text-muted);">
          Empaqueta en un único archivo JSON los horarios, asignaciones, bitácora de llaves, incidencias, directorio docente, infraestructura y auditoría.
        </p>
        ${btn('btnRespDescargar', '💾 Descargar Respaldo JSON Ahora', 'border:none;background:var(--accent-primary);color:#fff;')}

        ${esSuper ? `
        <div style="margin-top:12px;">
          <input type="file" id="inpRespArchivo" accept=".json" style="display:none;">
          ${btn('btnRespRestaurar', '📤 Restaurar desde un archivo JSON', 'border:1px solid var(--accent-primary);background:transparent;color:var(--accent-primary);')}
          <div id="contenedorPrevisualizacionRespaldo"></div>
        </div>` : ''}

        <div style="margin-top:10px;">
          ${btn('btnRespRestaurarBase', '🔄 Recargar Clases y Horarios Base de Docentes', 'border:1px solid #10b981;background:rgba(16,185,129,0.1);color:#10b981;')}
        </div>
        <div style="margin-top:10px;">
          ${btn('btnRespLimpiarAulas', '🧹 Dejar Todas las Aulas Libres (Vaciar Horarios)', 'border:1px solid #f59e0b;background:rgba(245,158,11,0.1);color:#f59e0b;')}
        </div>
      </div>

      <!-- ZONA DE PELIGRO (SUPERADMIN) -->
      ${esSuper ? `
      <div style="padding:14px;border:1px solid #ef4444;border-radius:14px;background:rgba(239,68,68,0.07);">
        <div style="font-weight:800;font-size:0.9rem;color:#ef4444;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
          <span>⚠️</span> Zona de Seguridad: Reiniciar Todo
        </div>
        <p style="margin:0 0 10px;font-size:0.78rem;color:var(--text-muted);">
          Elimina horarios, asignaciones, bitácora, incidencias y aulas añadidas. Se preserva el directorio docente. Se descargará automáticamente un respaldo de seguridad antes de reiniciar.
        </p>
        <input type="text" id="inpResetConfirmar" placeholder='Escribe RESETEAR para confirmar'
          style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid #ef4444;background:var(--bg-secondary);color:var(--text-primary);box-sizing:border-box;margin-bottom:10px;font-size:0.85rem;">
        ${btn('btnRespReset', '🗑️ Respaldar y Reiniciar Definitivamente', 'border:none;background:#ef4444;color:#fff;opacity:.5;')}
      </div>` : ''}
    </div>`;

  document.body.appendChild(overlay);

  const cerrar = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
  overlay.querySelector('#btnRespCerrar').onclick = cerrar;

  overlay.querySelector('#btnRespDescargar').onclick = () => {
    descargarRespaldo();
    overlay.querySelector('#txtUltimoResp').textContent = textoUltimoRespaldo();
  };

  const btnRestBase = overlay.querySelector('#btnRespRestaurarBase');
  if (btnRestBase) {
    btnRestBase.onclick = () => {
      if (confirm('¿Deseas restaurar todas las clases y horarios de docentes predeterminados?')) {
        if (typeof window.restaurarHorariosPredeterminados === 'function') {
          window.restaurarHorariosPredeterminados();
          cerrar();
        }
      }
    };
  }

  const btnLimpiar = overlay.querySelector('#btnRespLimpiarAulas');
  if (btnLimpiar) {
    btnLimpiar.onclick = () => {
      if (typeof window.limpiarHorariosDemoPrompt === 'function') {
        window.limpiarHorariosDemoPrompt();
        cerrar();
      }
    };
  }

  if (esSuper) {
    const inp = overlay.querySelector('#inpRespArchivo');
    const contenedorPreview = overlay.querySelector('#contenedorPrevisualizacionRespaldo');
    overlay.querySelector('#btnRespRestaurar').onclick = () => inp.click();
    inp.onchange = () => {
      if (inp.files[0]) {
        procesarArchivoRestauracion(inp.files[0], contenedorPreview);
      }
    };

    const txt = overlay.querySelector('#inpResetConfirmar');
    const btnReset = overlay.querySelector('#btnRespReset');
    txt.oninput = () => {
      btnReset.style.opacity = txt.value.trim() === 'RESETEAR' ? '1' : '.5';
    };
    btnReset.onclick = () => {
      if (txt.value.trim() !== 'RESETEAR') {
        alert('Escribe RESETEAR para confirmar.');
        return;
      }
      if (!confirm('Se descargará un respaldo y luego se BORRARÁ la información de las aulas. ¿Estás seguro?')) return;
      const archivo = descargarRespaldo(true);
      setTimeout(() => {
        if (confirm(`Copia preventiva guardada: ${archivo}\n\n¿Confirmas el REINICIO definitivo de aulas?`)) {
          ejecutarReset();
        }
      }, 800);
    };
  }
};

// Recordatorio mensual de respaldo (Admin / Superadmin)
window.revisarRespaldoMensual = function () {
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') return;
  if (document.getElementById('avisoRespaldo')) return;
  if (diasDesdeUltimoRespaldo() < RESPALDO_DIAS) return;

  const hoy = new Date().toDateString();
  if (localStorage.getItem('fcs_aviso_respaldo_dia') === hoy) return;
  localStorage.setItem('fcs_aviso_respaldo_dia', hoy);

  const aviso = document.createElement('div');
  aviso.id = 'avisoRespaldo';
  aviso.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9400;background:var(--card-bg);border:1px solid #f59e0b;border-left:5px solid #f59e0b;border-radius:14px;padding:14px 16px;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,0.4);';
  const dias = diasDesdeUltimoRespaldo();
  aviso.innerHTML = `
    <div style="font-weight:800;color:var(--text-primary);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
      <span>🗓️</span> Respaldo mensual pendiente
    </div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">
      ${dias === Infinity ? 'Aún no has hecho ningún respaldo de seguridad.' : 'Han pasado ' + Math.floor(dias) + ' días desde tu último respaldo.'}
    </div>
    <div style="display:flex;gap:8px;">
      <button type="button" id="btnAvisoResp" style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--accent-primary);color:#fff;font-weight:700;cursor:pointer;">Descargar ahora</button>
      <button type="button" id="btnAvisoCerrar" style="padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;background:transparent;color:var(--text-primary);cursor:pointer;">Luego</button>
    </div>`;
  document.body.appendChild(aviso);
  aviso.querySelector('#btnAvisoResp').onclick = () => { descargarRespaldo(); aviso.remove(); };
  aviso.querySelector('#btnAvisoCerrar').onclick = () => aviso.remove();
};
