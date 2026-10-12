// js/jefes.js
// Configuración de los Jefes de Licenciatura (Medicina, Psicología, Nutrición)
// Se guarda en localStorage y se usa en la firma del PDF de horarios.

const JEFES_CLAVE = 'fcs_jefes_carrera';
const JEFES_CARRERAS = [
  { id: 'medicina', nombre: 'Medicina', icono: '🩺' },
  { id: 'psicologia', nombre: 'Psicología', icono: '🧠' },
  { id: 'nutricion', nombre: 'Nutrición', icono: '🥗' }
];

function leerJefes() {
  try { return JSON.parse(localStorage.getItem(JEFES_CLAVE)) || {}; } catch (e) { return {}; }
}

window.obtenerJefeCarrera = function (carreraId) {
  return (leerJefes()[carreraId] || '').trim();
};

window.abrirModalJefes = function () {
  if (window.rolActual !== 'superadmin' && window.rolActual !== 'admin') return;
  const previo = document.getElementById('modalJefesCarrera');
  if (previo) previo.remove();

  const jefes = leerJefes();
  const campos = JEFES_CARRERAS.map(c => `
    <label style="display:block;margin-bottom:14px;text-align:left;">
      <span style="font-weight:700;font-size:0.85rem;color:var(--text-primary);">${c.icono} Jefe(a) de la Licenciatura en ${c.nombre}</span>
      <input type="text" data-jefe="${c.id}" value="${(jefes[c.id] || '').replace(/"/g, '&quot;')}"
        placeholder="Ej. Mtra. Brenda Quiñones Meneses"
        style="width:100%;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:0.9rem;box-sizing:border-box;">
    </label>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'modalJefesCarrera';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:20px;padding:1.8rem;width:92%;max-width:480px;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
      <h3 style="margin:0 0 4px;font-size:1.2rem;color:var(--text-primary);">👤 Jefes de Licenciatura</h3>
      <p style="margin:0 0 18px;font-size:0.82rem;color:var(--text-muted);">Aparecerán en la firma de los horarios en PDF.</p>
      ${campos}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">
        <button type="button" id="btnJefesCancelar" style="padding:9px 18px;border-radius:10px;border:1px solid var(--border-color);background:transparent;color:var(--text-primary);cursor:pointer;font-weight:600;">Cancelar</button>
        <button type="button" id="btnJefesGuardar" style="padding:9px 18px;border-radius:10px;border:none;background:var(--accent-primary);color:#fff;cursor:pointer;font-weight:700;">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const cerrar = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
  overlay.querySelector('#btnJefesCancelar').onclick = cerrar;
  overlay.querySelector('#btnJefesGuardar').onclick = () => {
    const nuevo = {};
    overlay.querySelectorAll('input[data-jefe]').forEach(i => { nuevo[i.dataset.jefe] = i.value.trim(); });
    localStorage.setItem(JEFES_CLAVE, JSON.stringify(nuevo));
    cerrar();
    alert('✅ Jefes de licenciatura guardados.');
  };
};
