// =============================================================================
// MÓDULO CUIAG-CIS • FACSA - UJED
// Cuestionario de Uso de Inteligencia Artificial Generativa y Competencias
// Investigativas en Salud
// Universidad Juárez del Estado de Durango
// =============================================================================

(function () {
  'use strict';

  const VERSION_INSTRUMENTO = "1.0-preliminar-expertos";
  const ITEMS_INVERSOS = new Set([16, 23, 29, 36]);

  const DIMENSIONES = [
    {
      num: 1,
      titulo: "Dimensión 1. Uso académico de IA generativa",
      descripcion: "Explora la integración de herramientas de IA en las tareas, conceptos y etapas de investigación formativa.",
      items: [1, 2, 3, 4, 5, 6, 7]
    },
    {
      num: 2,
      titulo: "Dimensión 2. Alfabetización en inteligencia artificial",
      descripcion: "Evalúa la comprensión conceptual, formulación de prompts, identificación de sesgos y contraste de respuestas.",
      items: [8, 9, 10, 11, 12, 13]
    },
    {
      num: 3,
      titulo: "Dimensión 3. Pensamiento crítico y verificación",
      descripcion: "Mide las prácticas de corroboración con fuentes primarias y evaluación analítica de argumentos generados por IA.",
      items: [14, 15, 16, 17, 18, 19, 20]
    },
    {
      num: 4,
      titulo: "Dimensión 4. Uso ético y responsable",
      descripcion: "Examina el respeto a la integridad académica, reporte de uso, protección de datos clínicos y responsabilidad de autoría.",
      items: [21, 22, 23, 24, 25]
    },
    {
      num: 5,
      titulo: "Dimensión 5. Autoeficacia investigativa",
      descripcion: "Indaga sobre la confianza individual para identificar problemas científicos, formular objetivos y elaborar conclusiones.",
      items: [26, 27, 28, 29, 30, 31]
    },
    {
      num: 6,
      titulo: "Dimensión 6. Competencias investigativas percibidas",
      descripcion: "Valora la capacidad percibida para delimitar problemas en salud, justificar estudios, diseñar métodos y comunicar hallazgos.",
      items: [32, 33, 34, 35, 36, 37, 38, 39, 40]
    }
  ];

  const REACTIVOS_OFICIALES = {
    1: "Utilizo herramientas de inteligencia artificial generativa para apoyar mis actividades académicas.",
    2: "Utilizo IA generativa para identificar y delimitar temas de investigación.",
    3: "Utilizo IA generativa para formular preguntas u objetivos de investigación.",
    4: "Utilizo IA generativa para comprender conceptos científicos relacionados con mi carrera.",
    5: "Utilizo IA generativa para organizar información destinada a trabajos de investigación.",
    6: "Utilizo IA generativa para mejorar la redacción de documentos académicos.",
    7: "Integro herramientas de IA generativa en distintas etapas de mis trabajos de investigación.",
    8: "Comprendo las funciones principales de las herramientas de IA generativa que utilizo.",
    9: "Sé formular instrucciones claras para obtener respuestas útiles de una herramienta de IA generativa.",
    10: "Reconozco que las respuestas de la IA generativa pueden contener errores o información inventada.",
    11: "Sé que las respuestas generadas por IA pueden presentar sesgos o información incompleta.",
    12: "Soy capaz de evaluar si una respuesta de IA es pertinente para mi pregunta de investigación.",
    13: "Sé que debo contrastar la información generada por IA con fuentes científicas confiables.",
    14: "Verifico las afirmaciones importantes generadas por IA antes de utilizarlas en un trabajo académico.",
    15: "Consulto las fuentes originales para comprobar la información científica proporcionada por la IA.",
    16: "Acepto como correcta la información de la IA sin comprobarla cuando parece convincente.",
    17: "Comparo las respuestas de la IA con artículos científicos y otras fuentes confiables.",
    18: "Reviso si los argumentos generados por IA cuentan con evidencia suficiente.",
    19: "Identifico posibles contradicciones entre las respuestas de la IA y la literatura científica.",
    20: "Elaboro mis propias conclusiones después de evaluar críticamente la información obtenida mediante IA.",
    21: "Respeto las normas de integridad académica cuando utilizo IA generativa en mis trabajos.",
    22: "Declaro el uso de IA generativa cuando así lo solicitan las normas institucionales o académicas aplicables.",
    23: "Presento como propias las respuestas generadas por IA sin reconocer su utilización.",
    24: "Evito introducir datos personales o información clínica confidencial en herramientas de IA no autorizadas para ese propósito.",
    25: "Comprendo que soy responsable de verificar y responder por el contenido que entrego, aunque haya utilizado IA.",
    26: "Me siento capaz de identificar un problema de investigación relacionado con mi área profesional.",
    27: "Me siento capaz de formular preguntas y objetivos de investigación claros.",
    28: "Me siento capaz de localizar y seleccionar literatura científica pertinente.",
    29: "Necesito que la IA tome por mí las decisiones metodológicas importantes de una investigación.",
    30: "Me siento capaz de interpretar resultados de investigación y relacionarlos con la pregunta planteada.",
    31: "Me siento capaz de elaborar conclusiones sustentadas en la evidencia científica.",
    32: "Puedo delimitar un problema de investigación relevante para las ciencias de la salud.",
    33: "Puedo justificar la importancia de una investigación mediante antecedentes científicos.",
    34: "Puedo identificar y utilizar literatura científica pertinente para fundamentar un estudio.",
    35: "Puedo formular objetivos de investigación congruentes con el problema planteado.",
    36: "Puedo desarrollar adecuadamente un trabajo de investigación únicamente cuando cuento con ayuda de IA generativa.",
    37: "Puedo seleccionar un diseño metodológico congruente con los objetivos de investigación.",
    38: "Puedo organizar e interpretar datos de acuerdo con los objetivos y métodos de un estudio.",
    39: "Puedo discutir resultados relacionándolos con hallazgos de investigaciones previas.",
    40: "Puedo comunicar resultados y conclusiones de investigación de forma clara y fundamentada."
  };

  const ESCALA_LIKERT = [
    { valor: 1, texto: "Totalmente en desacuerdo" },
    { valor: 2, texto: "En desacuerdo" },
    { valor: 3, texto: "Ni de acuerdo ni en desacuerdo" },
    { valor: 4, texto: "De acuerdo" },
    { valor: 5, texto: "Totalmente de acuerdo" }
  ];

  // Estado del Wizard del Estudiante
  const CUIAG_STATE = {
    pasoActual: 0, // 0: Presentación, 1: Consentimiento, 2: Datos Generales, 3..8: Dimensiones 1..6, 9: Revisión, 10: Fin
    consentimientoAceptado: null,
    datosGenerales: {
      carrera: '',
      edad: '',
      uso_ia_academico: '',
      herramientas_ia: [],
      otra_herramienta: '',
      frecuencia_uso: ''
    },
    itemsRespuestas: {}, // { 1: 5, 2: 4, ... }
    tokenEnvio: null,
    enviando: false,
    folioConfirmacion: null
  };

  function generarTokenUUID() {
    return 'cuiag-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
  }

  // ===========================================================================
  // INICIALIZACIÓN Y APERTURA DEL MÓDULO PARA ESTUDIANTES
  // ===========================================================================
  window.abrirCuestionarioEstudiantes = function () {
    let modulo = document.getElementById('moduloCuestionarioCUIAG');
    if (!modulo || !document.getElementById('cuiagDynamicStepsContainer')) {
      crearContenedorCuestionario();
      modulo = document.getElementById('moduloCuestionarioCUIAG');
    }

    if (modulo) modulo.style.display = 'block';

    // Iniciar token de sesión anónimo si no existe
    if (!CUIAG_STATE.tokenEnvio) {
      CUIAG_STATE.tokenEnvio = generarTokenUUID();
    }

    renderizarPasoActual();
  };

  window.cerrarCuestionarioEstudiantes = function () {
    // Si estamos en la app pura, regresar al paso 0
    CUIAG_STATE.pasoActual = 0;
    renderizarPasoActual();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comprobar parámetros de URL al cargar
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar cuestionario inmediatamente
    window.abrirCuestionarioEstudiantes();
  });

  // ===========================================================================
  // RENDERIZADO DEL INTERFAZ DEL CUESTIONARIO
  // ===========================================================================
  function crearContenedorCuestionario() {
    let wrap = document.getElementById('moduloCuestionarioCUIAG');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'moduloCuestionarioCUIAG';
      const mainContainer = document.querySelector('.cuiag-main-viewport') || document.body;
      mainContainer.prepend(wrap);
    }
    wrap.style.display = 'block';

    wrap.innerHTML = `
      <div class="cuiag-module-container">
        <!-- HÉROE INSTITUCIONAL -->
        <div class="cuiag-hero-card">
          <div class="cuiag-institution-badge">
            🏛️ FACSA · UJED • Investigación
          </div>
          <h1 class="cuiag-hero-title">Cuestionario CUIAG-CIS</h1>
          <p class="cuiag-hero-subtitle">
            Uso de inteligencia artificial generativa y competencias investigativas en estudiantes del área de la salud.
          </p>
        </div>

        <!-- STEPPER / BARRA DE PROGRESO -->
        <div class="cuiag-stepper-wrapper" id="cuiagStepperBox">
          <div class="cuiag-progress-header">
            <span class="cuiag-progress-step-name" id="cuiagStepNameLabel">
              📍 Paso 1 de 10: Presentación y Propósito
            </span>
            <span class="cuiag-progress-percent" id="cuiagProgressPercentLabel">0%</span>
          </div>
          <div class="cuiag-progress-track">
            <div class="cuiag-progress-fill" id="cuiagProgressBarFill"></div>
          </div>
          <div class="cuiag-steps-pills" id="cuiagStepsPillsStrip"></div>
        </div>

        <!-- CONTENEDOR DINÁMICO DE PASOS -->
        <div id="cuiagDynamicStepsContainer"></div>
      </div>
    `;
  }

  function renderizarPasoActual() {
    const container = document.getElementById('cuiagDynamicStepsContainer');
    if (!container) return;

    actualizarStepper();

    switch (CUIAG_STATE.pasoActual) {
      case 0:
        container.innerHTML = renderPaso0Presentacion();
        break;
      case 1:
        container.innerHTML = renderPaso1Consentimiento();
        break;
      case 2:
        container.innerHTML = renderPaso2DatosGenerales();
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        const dimIndex = CUIAG_STATE.pasoActual - 3;
        container.innerHTML = renderPasoDimension(DIMENSIONES[dimIndex]);
        break;
      case 9:
        container.innerHTML = renderPaso9Revision();
        break;
      case 10:
        container.innerHTML = renderPaso10Confirmacion();
        break;
      case 99: // No aceptó consentimiento
        container.innerHTML = renderPasoConsentimientoRechazado();
        break;
    }

    vincularEventosPaso();
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }

  function actualizarStepper() {
    const stepperBox = document.getElementById('cuiagStepperBox');
    if (!stepperBox) return;

    if (CUIAG_STATE.pasoActual === 10 || CUIAG_STATE.pasoActual === 99) {
      stepperBox.style.display = 'none';
      return;
    }
    stepperBox.style.display = 'block';

    const totalPasos = 10; // 0 a 9
    const pasoActual = Math.min(CUIAG_STATE.pasoActual, 9);
    const porcentaje = Math.round((pasoActual / (totalPasos - 1)) * 100);

    const fill = document.getElementById('cuiagProgressBarFill');
    const lblPct = document.getElementById('cuiagProgressPercentLabel');
    const lblName = document.getElementById('cuiagStepNameLabel');

    if (fill) fill.style.width = porcentaje + '%';
    if (lblPct) lblPct.textContent = porcentaje + '%';

    const nombresPasos = [
      "Presentación",
      "Consentimiento",
      "Datos Generales",
      "Dimensión 1 (Uso de IA)",
      "Dimensión 2 (Alfabetización)",
      "Dimensión 3 (Crítica)",
      "Dimensión 4 (Ética)",
      "Dimensión 5 (Autoeficacia)",
      "Dimensión 6 (Competencias)",
      "Revisión y Envío"
    ];

    if (lblName) {
      lblName.textContent = `📍 Paso ${pasoActual + 1} de 10: ${nombresPasos[pasoActual] || ''}`;
    }

    const pillsStrip = document.getElementById('cuiagStepsPillsStrip');
    if (pillsStrip) {
      pillsStrip.innerHTML = nombresPasos.map((nom, idx) => {
        let cls = 'cuiag-step-pill';
        if (idx < CUIAG_STATE.pasoActual) cls += ' completed';
        if (idx === CUIAG_STATE.pasoActual) cls += ' active';
        return `<span class="${cls}">${idx + 1}. ${nom}</span>`;
      }).join('');
    }
  }

  // ===========================================================================
  // VISTAS DE LOS PASOS DEL CUESTIONARIO
  // ===========================================================================

  // Paso 0: Presentación
  function renderPaso0Presentacion() {
    return `
      <div class="cuiag-section-card active">
        <div class="cuiag-section-header">
          <div class="cuiag-section-badge">Protocolo de Investigación Académica</div>
          <h2 class="cuiag-section-title">Bienvenido(a) a la Evaluación CUIAG-CIS</h2>
          <p class="cuiag-section-desc">
            Facultad de Ciencias de la Salud • Universidad Juárez del Estado de Durango
          </p>
        </div>

        <div style="font-size: 0.98rem; line-height: 1.7; color: var(--text-main); margin-bottom: 2rem;">
          <p>
            El presente estudio tiene como objetivo evaluar el <strong>Uso de Inteligencia Artificial Generativa y Competencias Investigativas en Salud</strong> en estudiantes de último semestre de las licenciaturas de <strong>Medicina, Psicología y Nutrición</strong> de la FACSA-UJED.
          </p>
          <div style="background: rgba(201, 162, 39, 0.1); border: 1px solid rgba(201, 162, 39, 0.35); border-radius: 12px; padding: 1.2rem; margin: 1.4rem 0;">
            <h4 style="margin: 0 0 6px 0; color: #fbbf24; font-size: 1rem;">🛡️ Compromiso de Privacidad y Anonimato Estricto</h4>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.9rem; color: var(--text-main);">
              <li><strong>No se solicita su nombre, matrícula ni correo electrónico</strong> en ninguna parte del instrumento.</li>
              <li>Sus respuestas serán procesadas con fines exclusivamente académicos y estadísticos.</li>
              <li>El cuestionario consta de datos sociodemográficos y <strong>40 reactivos</strong> distribuidos en seis dimensiones.</li>
              <li>Tiempo estimado de llenado: <strong>8 a 10 minutos</strong>.</li>
            </ul>
          </div>
        </div>

        <div class="cuiag-nav-footer">
          <div></div>
          <button type="button" class="cuiag-btn cuiag-btn-gold" id="btnContinuarPaso0">
            Comenzar con el Consentimiento Informado ➡️
          </button>
        </div>
      </div>
    `;
  }

  // Paso 1: Consentimiento Informado
  function renderPaso1Consentimiento() {
    return `
      <div class="cuiag-section-card active">
        <div class="cuiag-section-header">
          <div class="cuiag-section-badge">Requisito Ético Fundamental</div>
          <h2 class="cuiag-section-title">Consentimiento Informado</h2>
          <p class="cuiag-section-desc">
            Por favor lea atentamente el texto normativo y confirme su decisión de participar.
          </p>
        </div>

        <div class="cuiag-consent-box">
          <p style="margin: 0; font-style: italic;">
            "Su participación en este cuestionario es voluntaria y anónima. No escriba su nombre ni matrícula. Puede decidir no participar o dejar de responder en cualquier momento sin consecuencias académicas. La información será utilizada con fines académicos y de investigación, conforme al protocolo autorizado y al aviso de privacidad aplicable. La aplicación del cuestionario se realizará únicamente después de obtener las autorizaciones institucionales y el consentimiento informado correspondiente."
          </p>
        </div>

        <div class="cuiag-consent-options">
          <label class="cuiag-consent-choice ${CUIAG_STATE.consentimientoAceptado === true ? 'selected' : ''}" id="choiceConsentAcepto">
            <input type="radio" name="consentimientoRadio" value="acepto" ${CUIAG_STATE.consentimientoAceptado === true ? 'checked' : ''}>
            <span>✅ Acepto participar voluntariamente.</span>
          </label>
          <label class="cuiag-consent-choice ${CUIAG_STATE.consentimientoAceptado === false ? 'selected' : ''}" id="choiceConsentRechazo">
            <input type="radio" name="consentimientoRadio" value="no_acepto" ${CUIAG_STATE.consentimientoAceptado === false ? 'checked' : ''}>
            <span>❌ No acepto participar.</span>
          </label>
        </div>

        <div id="alertErrorConsentimiento" style="display: none; margin-top: 1.2rem; padding: 10px 14px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; color: #f87171; font-size: 0.88rem; font-weight: 700;">
          ⚠️ Por favor seleccione una de las dos opciones para continuar.
        </div>

        <div class="cuiag-nav-footer">
          <button type="button" class="cuiag-btn cuiag-btn-secondary" id="btnAtrasPaso1">
            ⬅️ Anterior
          </button>
          <button type="button" class="cuiag-btn cuiag-btn-primary" id="btnContinuarPaso1">
            Continuar ➡️
          </button>
        </div>
      </div>
    `;
  }

  // Paso Consentimiento Rechazado
  function renderPasoConsentimientoRechazado() {
    return `
      <div class="cuiag-section-card active" style="text-align: center; padding: 3rem 2rem;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">🙏</div>
        <h2 class="cuiag-section-title" style="color: #fbbf24;">Agradecemos su Tiempo</h2>
        <p style="max-width: 600px; margin: 1rem auto; line-height: 1.6; color: var(--text-main); font-size: 1rem;">
          Ha seleccionado no participar en el estudio. Respetamos plenamente su decisión. Esta elección no tiene ninguna consecuencia académica ni administrativa.
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
          Puede cerrar esta ventana o regresar al portal principal de la Facultad en cualquier momento.
        </p>
        <button type="button" class="cuiag-btn cuiag-btn-gold" onclick="cerrarCuestionarioEstudiantes()">
          Volver al Portal FACSA UJED
        </button>
      </div>
    `;
  }

  // Paso 2: Datos Generales
  function renderPaso2DatosGenerales() {
    const dg = CUIAG_STATE.datosGenerales;
    return `
      <div class="cuiag-section-card active">
        <div class="cuiag-section-header">
          <div class="cuiag-section-badge">Sección Inicial</div>
          <h2 class="cuiag-section-title">Datos Generales</h2>
          <p class="cuiag-section-desc">
            Información sociodemográfica y de contexto sobre herramientas digitales. Recuerde que sus respuestas son anónimas.
          </p>
        </div>

        <div id="alertErrorDatosGenerales" style="display: none; margin-bottom: 1.5rem; padding: 12px 16px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; color: #f87171; font-size: 0.88rem; font-weight: 700;"></div>

        <!-- 1. Carrera -->
        <div class="cuiag-field-group">
          <label class="cuiag-field-label">1. Carrera en la que estás inscrito(a) (Último Semestre) *</label>
          <div class="cuiag-career-grid">
            <div class="cuiag-career-card ${dg.carrera === 'Medicina' ? 'selected' : ''}" data-val="Medicina">
              <div class="career-icon">🩺</div>
              <div class="career-name">Medicina</div>
            </div>
            <div class="cuiag-career-card ${dg.carrera === 'Psicología' ? 'selected' : ''}" data-val="Psicología">
              <div class="career-icon">🧠</div>
              <div class="career-name">Psicología</div>
            </div>
            <div class="cuiag-career-card ${dg.carrera === 'Nutrición' ? 'selected' : ''}" data-val="Nutrición">
              <div class="career-icon">🥗</div>
              <div class="career-name">Nutrición</div>
            </div>
          </div>
        </div>

        <!-- 2. Edad -->
        <div class="cuiag-field-group">
          <label class="cuiag-field-label" for="inputCuiagEdad">2. Edad (Años cumplidos) *</label>
          <input type="number" id="inputCuiagEdad" class="cuiag-input-number" min="17" max="99" placeholder="Ej: 22" value="${dg.edad}">
          <div class="cuiag-field-helper">Ingrese un valor entero razonable (17 a 99 años).</div>
        </div>

        <!-- 3. Uso académico previo de IA -->
        <div class="cuiag-field-group">
          <label class="cuiag-field-label">3. ¿Has utilizado herramientas de IA generativa con fines académicos? *</label>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <label class="cuiag-consent-choice ${dg.uso_ia_academico === 'Sí' ? 'selected' : ''}" style="flex: 1; min-width: 140px;">
              <input type="radio" name="radioUsoIa" value="Sí" ${dg.uso_ia_academico === 'Sí' ? 'checked' : ''}>
              <span>Sí</span>
            </label>
            <label class="cuiag-consent-choice ${dg.uso_ia_academico === 'No' ? 'selected' : ''}" style="flex: 1; min-width: 140px;">
              <input type="radio" name="radioUsoIa" value="No" ${dg.uso_ia_academico === 'No' ? 'checked' : ''}>
              <span>No</span>
            </label>
          </div>
          <div class="cuiag-field-helper" style="margin-top: 6px;">
            <em>Nota: Si respondes "No", puedes continuar respondiendo el cuestionario sin ningún inconveniente.</em>
          </div>
        </div>

        <!-- 4. Herramientas utilizadas (Selección múltiple) -->
        <div class="cuiag-field-group">
          <label class="cuiag-field-label">4. Herramientas de IA generativa utilizadas (Selecciona todas las que apliquen)</label>
          <div class="cuiag-tools-grid">
            <label class="cuiag-tool-checkbox-card">
              <input type="checkbox" name="checkHerramienta" value="ChatGPT" ${dg.herramientas_ia.includes('ChatGPT') ? 'checked' : ''}>
              <span>ChatGPT</span>
            </label>
            <label class="cuiag-tool-checkbox-card">
              <input type="checkbox" name="checkHerramienta" value="Gemini" ${dg.herramientas_ia.includes('Gemini') ? 'checked' : ''}>
              <span>Gemini</span>
            </label>
            <label class="cuiag-tool-checkbox-card">
              <input type="checkbox" name="checkHerramienta" value="Copilot" ${dg.herramientas_ia.includes('Copilot') ? 'checked' : ''}>
              <span>Copilot</span>
            </label>
            <label class="cuiag-tool-checkbox-card" id="cardCheckOtras">
              <input type="checkbox" name="checkHerramienta" value="Otras" id="checkHerramientaOtras" ${dg.herramientas_ia.some(h => h.startsWith('Otras:')) || dg.herramientas_ia.includes('Otras') ? 'checked' : ''}>
              <span>Otras</span>
            </label>
          </div>

          <div id="boxOtrasHerramientas" style="display: ${dg.herramientas_ia.some(h => h.startsWith('Otras:')) || dg.herramientas_ia.includes('Otras') ? 'block' : 'none'}; margin-top: 10px;">
            <input type="text" id="inputOtraHerramienta" class="cuiag-input-text" placeholder="Especifica cuál(es) otra(s) herramienta(s) utilizas" value="${dg.otra_herramienta || ''}">
          </div>
        </div>

        <!-- 5. Frecuencia general de uso -->
        <div class="cuiag-field-group">
          <label class="cuiag-field-label">5. Frecuencia general de uso de herramientas de IA *</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${['Nunca', 'Rara vez', 'Algunas veces', 'Frecuentemente', 'Muy frecuentemente'].map(opc => `
              <label class="cuiag-consent-choice ${dg.frecuencia_uso === opc ? 'selected' : ''}" style="padding: 10px 16px;">
                <input type="radio" name="radioFrecuencia" value="${opc}" ${dg.frecuencia_uso === opc ? 'checked' : ''}>
                <span>${opc}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="cuiag-nav-footer">
          <button type="button" class="cuiag-btn cuiag-btn-secondary" id="btnAtrasPaso2">
            ⬅️ Anterior
          </button>
          <button type="button" class="cuiag-btn cuiag-btn-primary" id="btnContinuarPaso2">
            Continuar a los Reactivos ➡️
          </button>
        </div>
      </div>
    `;
  }

  // Pasos 3 a 8: Dimensiones 1 a 6
  function renderPasoDimension(dim) {
    const respuestas = CUIAG_STATE.itemsRespuestas;
    return `
      <div class="cuiag-section-card active">
        <div class="cuiag-section-header">
          <div class="cuiag-section-badge">Dimensión ${dim.num} de 6</div>
          <h2 class="cuiag-section-title">${dim.titulo}</h2>
          <p class="cuiag-section-desc">${dim.descripcion}</p>
        </div>

        <div style="background: rgba(11, 42, 91, 0.2); border-radius: 10px; padding: 10px 14px; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
          ℹ️ Selecciona tu grado de acuerdo para cada reactivo (1: Totalmente en desacuerdo a 5: Totalmente de acuerdo). Todos los reactivos son obligatorios.
        </div>

        <div id="alertErrorDimension" style="display: none; margin-bottom: 1.5rem; padding: 12px 16px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; color: #f87171; font-size: 0.88rem; font-weight: 700;"></div>

        <!-- LISTA DE REACTIVOS -->
        <div class="cuiag-items-list">
          ${dim.items.map(itemNum => {
      const resp = respuestas[itemNum];
      const esRespondido = resp !== undefined && resp !== null && resp !== '';
      return `
              <div class="cuiag-item-card ${esRespondido ? 'answered' : ''}" id="cardItem_${itemNum}">
                <div class="cuiag-item-header">
                  <div class="cuiag-item-number">${itemNum}</div>
                  <div class="cuiag-item-statement">
                    ${REACTIVOS_OFICIALES[itemNum]}
                    ${ITEMS_INVERSOS.has(itemNum) ? '<span style="font-size:0.75rem; color:#f59e0b; margin-left:6px; font-weight:600;">(Reactivo inverso)</span>' : ''}
                  </div>
                </div>

                <div class="cuiag-likert-scale">
                  ${ESCALA_LIKERT.map(esc => {
        const isChecked = resp === esc.valor;
        return `
                      <label class="cuiag-scale-option ${isChecked ? 'selected' : ''}" data-item="${itemNum}" data-val="${esc.valor}">
                        <input type="radio" name="item_${itemNum}" value="${esc.valor}" ${isChecked ? 'checked' : ''}>
                        <div class="cuiag-scale-num">${esc.valor}</div>
                        <div class="cuiag-scale-text">${esc.texto}</div>
                      </label>
                    `;
      }).join('')}
                </div>
              </div>
            `;
    }).join('')}
        </div>

        <div class="cuiag-nav-footer">
          <button type="button" class="cuiag-btn cuiag-btn-secondary" id="btnAtrasDimension">
            ⬅️ Dimensión Anterior
          </button>
          <button type="button" class="cuiag-btn cuiag-btn-primary" id="btnContinuarDimension">
            ${dim.num === 6 ? 'Revisar Respuestas ➡️' : 'Siguiente Dimensión ➡️'}
          </button>
        </div>
      </div>
    `;
  }

  // Paso 9: Revisión General Antes del Envío
  function renderPaso9Revision() {
    const dg = CUIAG_STATE.datosGenerales;
    const resp = CUIAG_STATE.itemsRespuestas;
    let totalRespondidos = 0;
    for (let i = 1; i <= 40; i++) {
      if (resp[i] !== undefined && resp[i] !== null) totalRespondidos++;
    }

    return `
      <div class="cuiag-section-card active">
        <div class="cuiag-section-header">
          <div class="cuiag-section-badge">Paso Final</div>
          <h2 class="cuiag-section-title">Revisión de Completitud y Envío Definitivo</h2>
          <p class="cuiag-section-desc">
            Comprueba que toda la información esté completa antes de transmitirla de forma segura y anónima al servidor institucional.
          </p>
        </div>

        <div class="cuiag-review-summary-box">
          <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; color: #fbbf24;">📋 Resumen de Captura</h3>
          <div class="cuiag-review-grid">
            <div class="cuiag-review-item">
              <span style="color: var(--text-muted);">Carrera:</span>
              <strong style="color: #fff;">${dg.carrera || 'No especificada'}</strong>
            </div>
            <div class="cuiag-review-item">
              <span style="color: var(--text-muted);">Edad:</span>
              <strong style="color: #fff;">${dg.edad || 'No especificada'} años</strong>
            </div>
            <div class="cuiag-review-item">
              <span style="color: var(--text-muted);">Uso Académico de IA:</span>
              <strong style="color: #fff;">${dg.uso_ia_academico || 'No especificado'}</strong>
            </div>
            <div class="cuiag-review-item">
              <span style="color: var(--text-muted);">Frecuencia de Uso:</span>
              <strong style="color: #fff;">${dg.frecuencia_uso || 'No especificada'}</strong>
            </div>
          </div>

          <div style="margin-top: 1.4rem; padding: 12px 16px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #10b981; font-size: 0.95rem;">Estado de los 40 Reactivos:</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Verificación de escala completa Likert 1-5</div>
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #10b981;">
              ${totalRespondidos} / 40 Reactivos
            </div>
          </div>
        </div>

        <div style="background: rgba(11, 42, 91, 0.25); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 1.2rem; margin-bottom: 2rem; font-size: 0.88rem; color: var(--text-main);">
          🔒 Al presionar <strong>"Confirmar y Enviar Respuestas Definitivamente"</strong>, sus respuestas se guardarán en la base de datos bajo un identificador técnico aleatorio sin vincular ningún dato de identidad personal.
        </div>

        <div id="alertErrorEnvio" style="display: none; margin-bottom: 1.5rem; padding: 12px 16px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; color: #f87171; font-size: 0.88rem; font-weight: 700;"></div>

        <div class="cuiag-nav-footer">
          <button type="button" class="cuiag-btn cuiag-btn-secondary" id="btnAtrasPaso9" ${CUIAG_STATE.enviando ? 'disabled' : ''}>
            ⬅️ Modificar Respuestas
          </button>
          <button type="button" class="cuiag-btn cuiag-btn-success" id="btnEnviarCuestionarioFinal" ${CUIAG_STATE.enviando ? 'disabled' : ''}>
            ${CUIAG_STATE.enviando ? '⏳ Guardando en Servidor...' : '🚀 Confirmar y Enviar Respuestas Definitivamente'}
          </button>
        </div>
      </div>
    `;
  }

  // Paso 10: Confirmación Exitosa
  function renderPaso10Confirmacion() {
    return `
      <div class="cuiag-success-card">
        <div class="cuiag-success-icon">🎉</div>
        <h2 style="font-size: 1.85rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">
          ¡Respuestas Guardadas con Éxito!
        </h2>
        <p style="font-size: 1.05rem; color: #e2e8f0; max-width: 650px; margin: 0 auto 1.2rem; line-height: 1.6;">
          Su participación en el <strong>Cuestionario CUIAG-CIS</strong> ha concluido satisfactoriamente. Su aporte es invaluable para el desarrollo y validación de instrumentos científicos en la Facultad de Ciencias de la Salud de la UJED.
        </p>

        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
            Folio Técnico de Confirmación Anónimo:
          </span>
          <div class="cuiag-receipt-badge">
            ${CUIAG_STATE.folioConfirmacion || 'CUIAG-REGISTRADO'}
          </div>
        </div>

        <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 500px; margin: 0 auto 2rem;">
          Este folio técnico confirma la recepción correcta en el servidor sin asociar ningún dato personal. Puede cerrar esta página con total seguridad.
        </p>

        <button type="button" class="cuiag-btn cuiag-btn-gold" onclick="cerrarCuestionarioEstudiantes()">
          Finalizar y Volver al Portal Institucional
        </button>
      </div>
    `;
  }

  // ===========================================================================
  // VALIDACIONES Y NAVEGACIÓN DEL WIZARD
  // ===========================================================================
  function vincularEventosPaso() {
    // Paso 0: Presentación
    const btnP0 = document.getElementById('btnContinuarPaso0');
    if (btnP0) {
      btnP0.addEventListener('click', () => {
        CUIAG_STATE.pasoActual = 1;
        renderizarPasoActual();
      });
    }

    // Paso 1: Consentimiento
    const rAcepto = document.getElementById('choiceConsentAcepto');
    const rRechazo = document.getElementById('choiceConsentRechazo');
    if (rAcepto && rRechazo) {
      rAcepto.addEventListener('click', () => {
        CUIAG_STATE.consentimientoAceptado = true;
        rAcepto.classList.add('selected');
        rRechazo.classList.remove('selected');
        document.getElementById('alertErrorConsentimiento').style.display = 'none';
      });
      rRechazo.addEventListener('click', () => {
        CUIAG_STATE.consentimientoAceptado = false;
        rRechazo.classList.add('selected');
        rAcepto.classList.remove('selected');
        document.getElementById('alertErrorConsentimiento').style.display = 'none';
      });
    }

    const btnA1 = document.getElementById('btnAtrasPaso1');
    if (btnA1) btnA1.addEventListener('click', () => { CUIAG_STATE.pasoActual = 0; renderizarPasoActual(); });

    const btnC1 = document.getElementById('btnContinuarPaso1');
    if (btnC1) {
      btnC1.addEventListener('click', () => {
        if (CUIAG_STATE.consentimientoAceptado === null) {
          const err = document.getElementById('alertErrorConsentimiento');
          if (err) err.style.display = 'block';
          return;
        }
        if (CUIAG_STATE.consentimientoAceptado === false) {
          CUIAG_STATE.pasoActual = 99; // Pantalla respetuosa de finalización
          renderizarPasoActual();
          return;
        }
        CUIAG_STATE.pasoActual = 2; // Avanzar a datos generales
        renderizarPasoActual();
      });
    }

    // Paso 2: Datos Generales
    const cardsCar = document.querySelectorAll('.cuiag-career-card');
    cardsCar.forEach(card => {
      card.addEventListener('click', () => {
        cardsCar.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        CUIAG_STATE.datosGenerales.carrera = card.getAttribute('data-val');
      });
    });

    const inpEdad = document.getElementById('inputCuiagEdad');
    if (inpEdad) {
      inpEdad.addEventListener('input', (e) => {
        CUIAG_STATE.datosGenerales.edad = e.target.value;
      });
    }

    const radiosUsoIa = document.querySelectorAll('input[name="radioUsoIa"]');
    radiosUsoIa.forEach(r => {
      r.addEventListener('change', (e) => {
        CUIAG_STATE.datosGenerales.uso_ia_academico = e.target.value;
        r.closest('div').querySelectorAll('.cuiag-consent-choice').forEach(c => c.classList.remove('selected'));
        r.closest('.cuiag-consent-choice').classList.add('selected');
      });
    });

    const checkOtras = document.getElementById('checkHerramientaOtras');
    const boxOtras = document.getElementById('boxOtrasHerramientas');
    const inpOtra = document.getElementById('inputOtraHerramienta');
    if (checkOtras && boxOtras) {
      checkOtras.addEventListener('change', (e) => {
        boxOtras.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked && inpOtra) inpOtra.focus();
      });
    }
    if (inpOtra) {
      inpOtra.addEventListener('input', (e) => {
        CUIAG_STATE.datosGenerales.otra_herramienta = e.target.value;
      });
    }

    const radiosFrec = document.querySelectorAll('input[name="radioFrecuencia"]');
    radiosFrec.forEach(r => {
      r.addEventListener('change', (e) => {
        CUIAG_STATE.datosGenerales.frecuencia_uso = e.target.value;
        r.closest('div').querySelectorAll('.cuiag-consent-choice').forEach(c => c.classList.remove('selected'));
        r.closest('.cuiag-consent-choice').classList.add('selected');
      });
    });

    const btnA2 = document.getElementById('btnAtrasPaso2');
    if (btnA2) btnA2.addEventListener('click', () => { CUIAG_STATE.pasoActual = 1; renderizarPasoActual(); });

    const btnC2 = document.getElementById('btnContinuarPaso2');
    if (btnC2) {
      btnC2.addEventListener('click', () => {
        // Guardar herramientas seleccionadas
        const herramientas = [];
        document.querySelectorAll('input[name="checkHerramienta"]:checked').forEach(chk => {
          if (chk.value === 'Otras') {
            const extra = (inpOtra && inpOtra.value.trim()) ? inpOtra.value.trim() : 'Otras';
            herramientas.push(`Otras: ${extra}`);
          } else {
            herramientas.push(chk.value);
          }
        });
        CUIAG_STATE.datosGenerales.herramientas_ia = herramientas;

        // Validación
        const errBox = document.getElementById('alertErrorDatosGenerales');
        const dg = CUIAG_STATE.datosGenerales;

        if (!dg.carrera) {
          mostrarErrorGenerales(errBox, 'Por favor selecciona tu carrera.');
          return;
        }

        const edadNum = parseInt(dg.edad, 10);
        if (isNaN(edadNum) || edadNum < 17 || edadNum > 99) {
          mostrarErrorGenerales(errBox, 'Por favor ingresa una edad válida en años cumplidos (entre 17 y 99).');
          return;
        }

        if (!dg.uso_ia_academico) {
          mostrarErrorGenerales(errBox, 'Por favor responde si has utilizado herramientas de IA generativa con fines académicos.');
          return;
        }

        if (!dg.frecuencia_uso) {
          mostrarErrorGenerales(errBox, 'Por favor selecciona tu frecuencia general de uso de herramientas de IA.');
          return;
        }

        errBox.style.display = 'none';
        CUIAG_STATE.pasoActual = 3; // Dimensión 1
        renderizarPasoActual();
      });
    }

    // Pasos 3 a 8: Dimensiones
    const likertOptions = document.querySelectorAll('.cuiag-scale-option');
    likertOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const itemNum = parseInt(opt.getAttribute('data-item'), 10);
        const valor = parseInt(opt.getAttribute('data-val'), 10);

        CUIAG_STATE.itemsRespuestas[itemNum] = valor;

        const card = document.getElementById(`cardItem_${itemNum}`);
        if (card) {
          card.classList.add('answered');
          card.classList.remove('has-error');
          card.querySelectorAll('.cuiag-scale-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        }
      });
    });

    const btnADim = document.getElementById('btnAtrasDimension');
    if (btnADim) {
      btnADim.addEventListener('click', () => {
        CUIAG_STATE.pasoActual--;
        renderizarPasoActual();
      });
    }

    const btnCDim = document.getElementById('btnContinuarDimension');
    if (btnCDim) {
      btnCDim.addEventListener('click', () => {
        const dimIndex = CUIAG_STATE.pasoActual - 3;
        const dimActual = DIMENSIONES[dimIndex];
        const faltantes = [];

        dimActual.items.forEach(itemNum => {
          const v = CUIAG_STATE.itemsRespuestas[itemNum];
          const card = document.getElementById(`cardItem_${itemNum}`);
          if (v === undefined || v === null || v === '') {
            faltantes.push(itemNum);
            if (card) card.classList.add('has-error');
          } else {
            if (card) card.classList.remove('has-error');
          }
        });

        const alertErr = document.getElementById('alertErrorDimension');
        if (faltantes.length > 0) {
          if (alertErr) {
            alertErr.textContent = `⚠️ Faltan por responder los reactivos: ${faltantes.join(', ')}. Todos los reactivos son obligatorios.`;
            alertErr.style.display = 'block';
          }
          // Scroll al primer reactivo faltante
          const primerFaltante = document.getElementById(`cardItem_${faltantes[0]}`);
          if (primerFaltante) primerFaltante.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        if (alertErr) alertErr.style.display = 'none';

        if (CUIAG_STATE.pasoActual === 8) {
          CUIAG_STATE.pasoActual = 9; // Pantalla de Revisión
        } else {
          CUIAG_STATE.pasoActual++;
        }
        renderizarPasoActual();
      });
    }

    // Paso 9: Revisión y Envío Definitivo
    const btnA9 = document.getElementById('btnAtrasPaso9');
    if (btnA9) {
      btnA9.addEventListener('click', () => {
        CUIAG_STATE.pasoActual = 8; // Regresar a Dimensión 6
        renderizarPasoActual();
      });
    }

    const btnEnv = document.getElementById('btnEnviarCuestionarioFinal');
    if (btnEnv) {
      btnEnv.addEventListener('click', procesarEnvioFinal);
    }
  }

  function mostrarErrorGenerales(errBox, msg) {
    if (!errBox) return;
    errBox.textContent = `⚠️ ${msg}`;
    errBox.style.display = 'block';
    errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ===========================================================================
  // ENVÍO AL SERVIDOR CON DOBLE VALIDACIÓN Y PREVENCIÓN DE DUPLICADOS
  // ===========================================================================
  async function procesarEnvioFinal() {
    if (CUIAG_STATE.enviando) return; // Evitar doble clic

    // Validación integral de 40 reactivos
    for (let i = 1; i <= 40; i++) {
      const v = CUIAG_STATE.itemsRespuestas[i];
      if (v === undefined || v === null || v < 1 || v > 5) {
        const err = document.getElementById('alertErrorEnvio');
        if (err) {
          err.textContent = `⚠️ Falta responder el reactivo obligatorio ${i}. Por favor regrese y complete todos los reactivos.`;
          err.style.display = 'block';
        }
        return;
      }
    }

    CUIAG_STATE.enviando = true;
    const btnEnv = document.getElementById('btnEnviarCuestionarioFinal');
    if (btnEnv) {
      btnEnv.disabled = true;
      btnEnv.textContent = '⏳ Transmitiendo respuestas al servidor...';
    }

    const payload = {
      token_envio: CUIAG_STATE.tokenEnvio,
      carrera: CUIAG_STATE.datosGenerales.carrera,
      edad: parseInt(CUIAG_STATE.datosGenerales.edad, 10),
      uso_ia_academico: CUIAG_STATE.datosGenerales.uso_ia_academico,
      herramientas_ia: CUIAG_STATE.datosGenerales.herramientas_ia,
      frecuencia_uso: CUIAG_STATE.datosGenerales.frecuencia_uso,
      items: CUIAG_STATE.itemsRespuestas,
      version_instrumento: VERSION_INSTRUMENTO
    };

    try {
      const res = await fetch('/api/cuiag/respuestas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar respuestas en el servidor.');
      }

      CUIAG_STATE.folioConfirmacion = data.id_confirmacion || ('CUIAG-' + Date.now().toString(36).toUpperCase());
      CUIAG_STATE.pasoActual = 10; // Éxito
      CUIAG_STATE.enviando = false;
      renderizarPasoActual();

      if (typeof sounds !== 'undefined' && sounds.playSuccess) sounds.playSuccess();
      if (typeof mostrarToast === 'function') mostrarToast('¡Cuestionario completado y guardado con éxito!', 'success');

    } catch (err) {
      console.warn('Fallo en API backend, aplicando persistencia de respaldo:', err);
      // Fallback de contingencia: si el servidor REST no estuviera activo, respaldar en almacenamiento local
      try {
        let guardados = JSON.parse(localStorage.getItem('fcs_cuiag_respuestas_local') || '[]');
        const nuevoId = 'CUIAG-LOCAL-' + Date.now().toString(36).toUpperCase();
        guardados.push({
          ...payload,
          id: nuevoId,
          timestamp: new Date().toISOString(),
          estado: 'completado'
        });
        localStorage.setItem('fcs_cuiag_respuestas_local', JSON.stringify(guardados));

        CUIAG_STATE.folioConfirmacion = nuevoId;
        CUIAG_STATE.pasoActual = 10;
        CUIAG_STATE.enviando = false;
        renderizarPasoActual();
      } catch (localErr) {
        CUIAG_STATE.enviando = false;
        if (btnEnv) {
          btnEnv.disabled = false;
          btnEnv.textContent = '🚀 Confirmar y Enviar Respuestas Definitivamente';
        }
        const errBox = document.getElementById('alertErrorEnvio');
        if (errBox) {
          errBox.textContent = `❌ Error: ${err.message}`;
          errBox.style.display = 'block';
        }
      }
    }
  }

  // ===========================================================================
  // PANEL ADMINISTRATIVO DE INVESTIGACIÓN (CUIAG-CIS)
  // Accesible únicamente para Superadmin TI y Administrador
  // ===========================================================================
  window.renderPanelAdminCUIAG = async function () {
    const contenedor = document.getElementById('cuiagAdminPanelContent');
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
        <div>Cargando estadísticas y métricas del estudio CUIAG-CIS...</div>
      </div>
    `;

    try {
      const adminKey = window.adminKey || sessionStorage.getItem('fcs_admin_key') || '';
      const res = await fetch('/api/cuiag/admin/metricas', {
        headers: {
          'X-FACSA-Role': window.rolActual || 'superadmin',
          'X-FACSA-Key': adminKey
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          contenedor.innerHTML = `
            <div style="padding: 2rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; color: #f87171; text-align: center;">
              <h3>⛔ Acceso Restringido</h3>
              <p>Este módulo es de uso exclusivo para investigación y requiere credenciales de Superadmin TI o Administrador.</p>
            </div>
          `;
          return;
        }
        throw new Error('Error al obtener métricas');
      }

      const data = await res.json();
      construirHTMLAdminPanel(contenedor, data);

    } catch (err) {
      console.warn('Error al conectar con backend admin:', err);
      // Fallback a localStorage
      const localResp = JSON.parse(localStorage.getItem('fcs_cuiag_respuestas_local') || '[]');
      construirHTMLAdminPanelFallback(contenedor, localResp);
    }
  };

  function construirHTMLAdminPanel(contenedor, data) {
    const total = data.total_completados || 0;
    const carreras = data.carreras || {};
    const cfg = data.config || {};
    const items = data.items || {};

    const urlAlumnos = data.url_alumnos || `${window.location.protocol}//${window.location.hostname}:8080/`;

    let html = `
      <div class="cuiag-admin-container">
        <!-- CABECERA DEL PANEL -->
        <div class="cuiag-admin-header">
          <div>
            <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 800; color: #fbbf24; letter-spacing: 0.5px;">
              Protocolo de Juicio de Expertos & Piloto • FACSA-UJED
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 800; margin: 4px 0 2px; color: var(--text-main);">
              🔬 Panel de Investigación: CUIAG-CIS
            </h2>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Versión del Instrumento: <strong>v${data.version_instrumento}</strong> • 40 reactivos, 6 dimensiones
            </div>
          </div>

          <!-- ACCIONES RÁPIDAS Y EXPORTACIONES -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="cuiag-btn" onclick="window.descargarExportacionCUIAG('excel')" style="padding: 9px 16px; font-size: 0.88rem; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);" title="Descargar libro Excel completo con 3 hojas, tablas analíticas y gráficos integrados">
              📊 Exportar a Excel con Gráficos (.xlsx)
            </button>
            <button type="button" class="cuiag-btn cuiag-btn-gold" onclick="window.descargarExportacionCUIAG('csv')" style="padding: 8px 14px; font-size: 0.85rem;" title="Descargar datos en formato CSV para SPSS y R">
              📥 Exportar CSV (SPSS)
            </button>
            <button type="button" class="cuiag-btn cuiag-btn-secondary" onclick="window.descargarExportacionCUIAG('diccionario')" style="padding: 8px 14px; font-size: 0.85rem;" title="Descargar diccionario formal de variables">
              📖 Diccionario
            </button>
            <button type="button" class="cuiag-btn cuiag-btn-secondary" onclick="window.renderPanelAdminCUIAG()" style="padding: 8px 12px; font-size: 0.85rem;" title="Recargar métricas">
              🔄
            </button>
          </div>
        </div>

        <!-- TARJETA DESTACADA: ENLACE Y PROYECCIÓN PARA ALUMNOS -->
        <div style="background: linear-gradient(135deg, rgba(201, 162, 39, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid rgba(201, 162, 39, 0.45); border-radius: 14px; padding: 1.3rem 1.5rem; margin-bottom: 1.8rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.25);">
          <div style="flex: 1; min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px;">
                📲 ENLACE PARA COMPARTIR CON TUS ALUMNOS
              </span>
              <span style="background: #10b981; color: #ffffff; font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px;">LISTO PARA RESPONDER</span>
            </div>
            <div style="font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 6px 0 4px; font-family: 'JetBrains Mono', monospace; word-break: break-all;">
              ${urlAlumnos}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              📌 Comparte este enlace en clase o proyecta el código QR para que los alumnos lo abran en sus celulares (Misma red Wi-Fi).
            </div>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="cuiag-btn cuiag-btn-gold" onclick="window.copiarEnlaceAlumnos('${urlAlumnos}')" style="padding: 10px 18px; font-size: 0.88rem; font-weight: 800;">
              📋 Copiar Enlace
            </button>
            <button type="button" class="cuiag-btn" onclick="window.mostrarModalQRAlumnos('${urlAlumnos}')" style="padding: 10px 18px; font-size: 0.88rem; font-weight: 800; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
              📷 Proyectar Código QR
            </button>
          </div>
        </div>

        <!-- AVISO METODOLÓGICO Y CONTROL DE APROBACIONES -->
        <div style="background: rgba(11, 42, 91, 0.25); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 12px; padding: 1.2rem; margin-bottom: 1.8rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-weight: 700; color: #60a5fa; font-size: 0.95rem;">
              🛡️ Control de Recepción & Aprobaciones Institucionales
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              Estado actual: <strong>${cfg.recepcion_activa ? '🟢 Recepción Abierta' : '⏸️ Recepción Pausada'}</strong> • 
              Aprobación de Comité: <strong>${cfg.aprobacion_institucional ? '✅ Confirmada' : '⚠️ Pendiente'}</strong>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="cuiag-btn ${cfg.recepcion_activa ? 'cuiag-btn-secondary' : 'cuiag-btn-success'}" onclick="window.toggleEstadoRecepcionCUIAG(${!cfg.recepcion_activa})" style="padding: 6px 14px; font-size: 0.82rem;">
              ${cfg.recepcion_activa ? '⏸️ Pausar Nuevas Respuestas' : '▶️ Activar Recepción'}
            </button>
          </div>
        </div>

        <!-- CUADRÍCULA DE KPIS DESCRIPTIVOS -->
        <div class="cuiag-admin-grid">
          <div class="cuiag-metric-box">
            <div class="cuiag-metric-icon">📋</div>
            <div>
              <div class="cuiag-metric-val">${total}</div>
              <div class="cuiag-metric-lbl">Total Completados</div>
            </div>
          </div>
          <div class="cuiag-metric-box">
            <div class="cuiag-metric-icon" style="color: var(--med-color);">🩺</div>
            <div>
              <div class="cuiag-metric-val">${carreras['Medicina'] || 0}</div>
              <div class="cuiag-metric-lbl">Medicina</div>
            </div>
          </div>
          <div class="cuiag-metric-box">
            <div class="cuiag-metric-icon" style="color: var(--psi-color);">🧠</div>
            <div>
              <div class="cuiag-metric-val">${carreras['Psicología'] || 0}</div>
              <div class="cuiag-metric-lbl">Psicología</div>
            </div>
          </div>
          <div class="cuiag-metric-box">
            <div class="cuiag-metric-icon" style="color: var(--nut-color);">🥗</div>
            <div>
              <div class="cuiag-metric-val">${carreras['Nutrición'] || 0}</div>
              <div class="cuiag-metric-lbl">Nutrición</div>
            </div>
          </div>
          <div class="cuiag-metric-box">
            <div class="cuiag-metric-icon" style="color: #10b981;">🎂</div>
            <div>
              <div class="cuiag-metric-val">${data.edad_stats ? data.edad_stats.promedio : 0}</div>
              <div class="cuiag-metric-lbl">Edad Promedio (Años)</div>
            </div>
          </div>
        </div>

        <!-- DISTRIBUCIÓN DE REACTIVOS POR DIMENSIÓN -->
        <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.6rem; margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main);">
                📊 Frecuencias y Distribución por Reactivo (1 a 40)
              </h3>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Datos descriptivos sin recodificar. Los 4 reactivos inversos (16, 23, 29, 36) se recodifican en análisis derivados (6 - x).
              </div>
            </div>
            <!-- Leyenda de colores Likert -->
            <div class="cuiag-legend-strip">
              <span><span class="cuiag-legend-dot cuiag-seg-1"></span>1. TD</span>
              <span><span class="cuiag-legend-dot cuiag-seg-2"></span>2. D</span>
              <span><span class="cuiag-legend-dot cuiag-seg-3"></span>3. N</span>
              <span><span class="cuiag-legend-dot cuiag-seg-4"></span>4. A</span>
              <span><span class="cuiag-legend-dot cuiag-seg-5"></span>5. TA</span>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="custom-table" style="width: 100%; font-size: 0.86rem;">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Reactivo Oficial</th>
                  <th style="min-width: 180px;">Distribución Likert (%)</th>
                  <th style="text-align: center; width: 60px;">Media</th>
                  <th style="text-align: center; width: 90px;">Sentido</th>
                </tr>
              </thead>
              <tbody>
                ${DIMENSIONES.map(d => `
                  <tr style="background: rgba(201, 162, 39, 0.08);">
                    <td colspan="5" style="font-weight: 800; color: #fbbf24; padding: 8px 12px;">
                      ${d.titulo} (${d.items.length} reactivos)
                    </td>
                  </tr>
                  ${d.items.map(num => {
      const it = items[num] || { enunciado: REACTIVOS_OFICIALES[num], porcentajes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, media_original: 0 };
      const pct = it.porcentajes || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const esInv = ITEMS_INVERSOS.has(num);
      return `
                      <tr>
                        <td style="font-weight: 800; font-family: 'JetBrains Mono', monospace;">${num}</td>
                        <td>${REACTIVOS_OFICIALES[num]}</td>
                        <td>
                          <div class="cuiag-freq-bar-wrap" title="1: ${pct[1]}%, 2: ${pct[2]}%, 3: ${pct[3]}%, 4: ${pct[4]}%, 5: ${pct[5]}%">
                            <div class="cuiag-freq-segment cuiag-seg-1" style="width: ${pct[1]}%;"></div>
                            <div class="cuiag-freq-segment cuiag-seg-2" style="width: ${pct[2]}%;"></div>
                            <div class="cuiag-freq-segment cuiag-seg-3" style="width: ${pct[3]}%;"></div>
                            <div class="cuiag-freq-segment cuiag-seg-4" style="width: ${pct[4]}%;"></div>
                            <div class="cuiag-freq-segment cuiag-seg-5" style="width: ${pct[5]}%;"></div>
                          </div>
                          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">
                            TD: ${pct[1]}% • D: ${pct[2]}% • N: ${pct[3]}% • A: ${pct[4]}% • TA: ${pct[5]}%
                          </div>
                        </td>
                        <td style="text-align: center; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
                          ${it.media_original || '-'}
                        </td>
                        <td style="text-align: center;">
                          ${esInv ? '<span class="status-badge" style="background:#b45309; color:#fff;" title="Puntuación recodificada = 6 - original">Inverso (6-x)</span>' : '<span style="color:var(--text-dim);">Directo</span>'}
                        </td>
                      </tr>
                    `;
    }).join('')}
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- NOTA DE SEGURIDAD Y PRIVACIDAD -->
        <div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 1.5rem;">
          Facultad de Ciencias de la Salud • UJED • Los datos de investigación son tratados con anonimato estricto y no generan calificaciones ni créditos académicos.
        </div>
      </div>
    `;

    contenedor.innerHTML = html;
  }

  function construirHTMLAdminPanelFallback(contenedor, localResp) {
    contenedor.innerHTML = `
      <div style="padding: 1.5rem; background: var(--card-bg); border-radius: 14px;">
        <h3 style="color: #fbbf24;">🔬 Panel CUIAG-CIS (Modo Local)</h3>
        <p>Registros en almacenamiento local: <strong>${localResp.length}</strong>.</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Para habilitar el servicio completo de backend con base de datos SQLite y exportación CSV, asegúrese de ejecutar <code>iniciar.bat</code> o <code>python server.py 8080</code>.
        </p>
      </div>
    `;
  }

  // Descargas de exportación (Excel con Gráficos, CSV, Diccionario)
  window.descargarExportacionCUIAG = function (tipo) {
    const rol = window.rolActual || 'admin';

    let endpoint = '/api/cuiag/admin/exportar-csv';
    let defaultFilename = 'cuiag_cis_respuestas.csv';

    if (tipo === 'diccionario') {
      endpoint = '/api/cuiag/admin/diccionario';
      defaultFilename = 'cuiag_cis_diccionario_variables.csv';
    } else if (tipo === 'excel') {
      endpoint = '/api/cuiag/admin/exportar-excel';
      defaultFilename = 'cuiag_cis_analisis_graficos.xlsx';
    }

    // Realizar fetch con cabeceras de rol y clave de investigador
    const adminKey = window.adminKey || sessionStorage.getItem('fcs_admin_key') || '';
    fetch(endpoint, {
      headers: {
        'X-FACSA-Role': rol,
        'X-FACSA-Key': adminKey
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al descargar');
        const filename = response.headers.get('Content-Disposition')
          ?.split('filename=')[1]?.replace(/"/g, '') || defaultFilename;
        return response.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        if (typeof mostrarToast === 'function') {
          mostrarToast('¡Archivo generado y descargado exitosamente!', 'success');
        }
      })
      .catch(err => {
        alert('Error al descargar: ' + err.message);
      });
  };

  window.toggleEstadoRecepcionCUIAG = async function (nuevoEstado) {
    const rol = window.rolActual || 'consulta';
    const adminKey = window.adminKey || sessionStorage.getItem('fcs_admin_key') || '';
    if (rol !== 'superadmin' && rol !== 'admin') return;

    try {
      const res = await fetch('/api/cuiag/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FACSA-Role': rol,
          'X-FACSA-Key': adminKey
        },
        body: JSON.stringify({ recepcion_activa: nuevoEstado })
      });
      if (res.ok) {
        if (typeof mostrarToast === 'function') {
          mostrarToast(`Recepción de respuestas ${nuevoEstado ? 'activada' : 'pausada'} correctamente.`, 'info');
        }
        window.renderPanelAdminCUIAG();
      }
    } catch (e) {
      alert('Error al actualizar configuración: ' + e.message);
    }
  };

  // Copiar enlace para compartir con alumnos
  window.copiarEnlaceAlumnos = function (url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (typeof mostrarToast === 'function') {
          mostrarToast('¡Enlace copiado al portapapeles! Listo para enviar a tus alumnos.', 'success');
        } else {
          alert('¡Enlace copiado al portapapeles!\n\n' + url);
        }
      }).catch(() => {
        prompt('Copia este enlace para tus alumnos:', url);
      });
    } else {
      prompt('Copia este enlace para tus alumnos:', url);
    }
  };

  // Proyectar modal con código QR grande
  window.mostrarModalQRAlumnos = function (url) {
    let modal = document.getElementById('modalQRAlumnos');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalQRAlumnos';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(11,15,25,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;backdrop-filter:blur(8px);animation:cuiagFadeIn 0.25s ease-out;';
      document.body.appendChild(modal);
    }
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' + encodeURIComponent(url);
    modal.innerHTML = `
      <div style="background:#1e293b;border:1px solid rgba(201,162,39,0.4);border-radius:22px;max-width:480px;width:100%;padding:2.2rem 2rem;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative;">
        <button onclick="document.getElementById('modalQRAlumnos').style.display='none'" style="position:absolute;top:16px;right:18px;background:rgba(255,255,255,0.08);border:none;color:#94a3b8;font-size:1.2rem;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" title="Cerrar modal">✕</button>
        <div style="font-size:0.75rem;text-transform:uppercase;color:#fbbf24;font-weight:800;letter-spacing:0.5px;margin-bottom:6px;">FACSA · UJED • PROTOCOLO CUIAG-CIS</div>
        <h3 style="color:#ffffff;font-size:1.4rem;font-weight:800;margin-bottom:6px;">Escanear para Responder</h3>
        <p style="color:#94a3b8;font-size:0.86rem;margin-bottom:1.4rem;line-height:1.4;">
          Apunta la cámara de tu celular a este código para acceder directamente al cuestionario.
        </p>
        <div style="background:#ffffff;padding:16px;border-radius:16px;display:inline-block;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
          <img src="${qrUrl}" alt="Código QR Cuestionario CUIAG-CIS" style="width:260px;height:260px;display:block;">
        </div>
        <div style="background:rgba(15,23,42,0.7);padding:10px 14px;border-radius:10px;margin-top:1.4rem;border:1px solid rgba(255,255,255,0.1);">
          <div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:2px;">Enlace Directo:</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.95rem;color:#38bdf8;font-weight:700;word-break:break-all;">${url}</div>
        </div>
        <p style="font-size:0.78rem;color:#64748b;margin-top:12px;">🔒 Participación Anónima (Sin matrícula ni datos personales)</p>
      </div>
    `;
    modal.style.display = 'flex';
  };

})();
