/**
 * UniCampus - Base de Datos Local Inicial
 * Carreras: Medicina, Psicología, Nutrición
 * Horario: 07:00 a 22:00 (Lunes a Sábado)
 * Espacios: Aulas, Laboratorios, Audiovisual, Canchas de Fútbol, Domos
 * +100 Docentes Universitarios
 */

// =============================================================================
// CATÁLOGO INSTITUCIONAL CENTRALIZADO DE CICLOS ESCOLARES (FACSA - UJED)
// Permite ciclo vigente actual y consulta auditada de ciclos anteriores
// =============================================================================
const CICLOS_ESCOLARES = {
  'semestre_a': {
    id: 'semestre_a',
    codigoOficial: '2026-A',
    nombre: 'Ciclo 2026-A (Enero - Junio)',
    periodo: 'Enero - Junio 2026',
    icono: '🌱',
    vigente: true,
    historico: false
  },
  'semestre_b': {
    id: 'semestre_b',
    codigoOficial: '2026-B',
    nombre: 'Ciclo 2026-B (Agosto - Diciembre)',
    periodo: 'Agosto - Diciembre 2026',
    icono: '🍂',
    vigente: false,
    historico: false
  },
  'semestre_2025_b': {
    id: 'semestre_2025_b',
    codigoOficial: '2025-B',
    nombre: 'Ciclo 2025-B (Agosto - Diciembre)',
    periodo: 'Agosto - Diciembre 2025',
    icono: '🏛️',
    vigente: false,
    historico: true
  },
  'semestre_2025_a': {
    id: 'semestre_2025_a',
    codigoOficial: '2025-A',
    nombre: 'Ciclo 2025-A (Enero - Junio)',
    periodo: 'Enero - Junio 2025',
    icono: '🏛️',
    vigente: false,
    historico: true
  }
};

const CARRERAS = {
  medicina: {
    id: 'medicina',
    nombre: 'Medicina',
    abreviatura: 'MED',
    color: '#2563eb',
    colorLight: '#dbeafe',
    colorText: '#1e40af',
    icono: '🩺',
    edificio: 'Edificio A - Ciencias de la Salud',
    coordinador: 'Dr. Fernando Salazar Valenzuela'
  },
  psicologia: {
    id: 'psicologia',
    nombre: 'Psicología',
    abreviatura: 'PSI',
    color: '#8b5cf6',
    colorLight: '#ede9fe',
    colorText: '#6d28d9',
    icono: '🧠',
    edificio: 'Edificio B - Ciencias Humanas',
    coordinador: 'Dra. Mariana Castro Rivas'
  },
  nutricion: {
    id: 'nutricion',
    nombre: 'Nutrición',
    abreviatura: 'NUT',
    color: '#059669',
    colorLight: '#d1fae5',
    colorText: '#065f46',
    icono: '🥗',
    edificio: 'Edificio Nutrición',
    coordinador: 'Mtra. Elena Morales Pineda'
  },
  general: {
    id: 'general',
    nombre: 'Áreas Comunes / Deportes',
    abreviatura: 'DEP/ACT',
    color: '#f59e0b',
    colorLight: '#fef3c7',
    colorText: '#b45309',
    icono: '🏆',
    edificio: 'Complejo Deportivo y Domos',
    coordinador: 'Lic. Andrés Paredes Soto'
  }
};

const EDIFICIOS = {
  posgrado: {
    id: 'posgrado',
    nombre: 'Edificio Posgrado',
    etiqueta: 'Posgrado (0-4)',
    icono: '🎓',
    color: '#6366f1',
    descripcion: 'Aulas 0 a 4 — Programas de Especialidad y Posgrado'
  },
  edificio_a: {
    id: 'edificio_a',
    nombre: 'Edificio A',
    etiqueta: 'Edificio A (0-4)',
    icono: '🏢',
    color: '#0ea5e9',
    descripcion: 'Aulas 0 a 4 — Nivel Central'
  },
  edificio_b: {
    id: 'edificio_b',
    nombre: 'Edificio B',
    etiqueta: 'Edificio B (5-8)',
    icono: '🏢',
    color: '#8b5cf6',
    descripcion: 'Aulas 5 a 8 — Ciencias Clínicas y Humanas'
  },
  edificio_c: {
    id: 'edificio_c',
    nombre: 'Edificio C',
    etiqueta: 'Edificio C (9-13, 16-21)',
    icono: '🏢',
    color: '#ec4899',
    descripcion: 'Aulas 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21'
  },
  edificio_n: {
    id: 'edificio_n',
    nombre: 'Edificio N',
    etiqueta: 'Edificio N (14-15)',
    icono: '🏢',
    color: '#14b8a6',
    descripcion: 'Aulas 14 y 15'
  },
  edificio_l: {
    id: 'edificio_l',
    nombre: 'Edificio L',
    etiqueta: 'Edificio L (22-23)',
    icono: '🏢',
    color: '#f97316',
    descripcion: 'Aulas 22 y 23'
  },
  edificio_k: {
    id: 'edificio_k',
    nombre: 'Edificio K',
    etiqueta: 'Edificio K (24-25)',
    icono: '🏢',
    color: '#eab308',
    descripcion: 'Aulas 24 y 25'
  },
  edificio_nutricion: {
    id: 'edificio_nutricion',
    nombre: 'Edificio Nutrición',
    etiqueta: 'Edificio Nutrición (1-8)',
    icono: '🥗',
    color: '#10b981',
    descripcion: 'Aulas 1 a 8 — Área de Ciencias de los Alimentos'
  },
  laboratorios: {
    id: 'laboratorios',
    nombre: 'Laboratorios Especializados',
    etiqueta: 'Laboratorios',
    icono: '🔬',
    color: '#a855f7',
    descripcion: 'Anatomía, Simulación, Gesell, Bromatología, Bioquímica'
  },
  audiovisual: {
    id: 'audiovisual',
    nombre: 'Áreas Audiovisuales y Auditorios',
    etiqueta: 'Audiovisual',
    icono: '📽️',
    color: '#3b82f6',
    descripcion: 'Auditorio Magno Hipócrates, Salas Multimedia y Telemedicina'
  },
  deportes_domos: {
    id: 'deportes_domos',
    nombre: 'Canchas y Domos Universitarios',
    etiqueta: 'Canchas y Domos',
    icono: '⚽',
    color: '#f59e0b',
    descripcion: 'Canchas de Fútbol 11/Rápido, Gran Domo Polideportivo'
  }
};

const ESPACIOS = [
  // ==========================================
  // EDIFICIO POSGRADO (Aulas 0-4)
  // ==========================================
  { id: 'POS-0', nombre: 'Aula Posgrado 0', tipo: 'aula', edificioId: 'posgrado', edificio: 'Edificio Posgrado', capacidad: 35, equipamiento: ['Proyector 4K', 'Climatizado', 'SmartBoard', 'Audio Envolvente'], estado: 'disponible' },
  { id: 'POS-1', nombre: 'Aula Posgrado 1', tipo: 'aula', edificioId: 'posgrado', edificio: 'Edificio Posgrado', capacidad: 35, equipamiento: ['Proyector Láser', 'Climatizado', 'Conferencia Híbrida'], estado: 'disponible' },
  { id: 'POS-2', nombre: 'Aula Posgrado 2', tipo: 'aula', edificioId: 'posgrado', edificio: 'Edificio Posgrado', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'POS-3', nombre: 'Aula Posgrado 3', tipo: 'aula', edificioId: 'posgrado', edificio: 'Edificio Posgrado', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'POS-4', nombre: 'Aula Posgrado 4', tipo: 'aula', edificioId: 'posgrado', edificio: 'Edificio Posgrado', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'Cámara PTZ'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO A (Aulas 0-4)
  // ==========================================
  { id: 'A-0', nombre: 'Aula A-0', tipo: 'aula', edificioId: 'edificio_a', edificio: 'Edificio A', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'A-1', nombre: 'Aula A-1', tipo: 'aula', edificioId: 'edificio_a', edificio: 'Edificio A', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'Pizarra Magnética'], estado: 'disponible' },
  { id: 'A-2', nombre: 'Aula A-2', tipo: 'aula', edificioId: 'edificio_a', edificio: 'Edificio A', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado', 'Cámara Streaming'], estado: 'disponible' },
  { id: 'A-3', nombre: 'Aula A-3', tipo: 'aula', edificioId: 'edificio_a', edificio: 'Edificio A', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'A-4', nombre: 'Aula A-4', tipo: 'aula', edificioId: 'edificio_a', edificio: 'Edificio A', capacidad: 55, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO B (Aulas 5-8)
  // ==========================================
  { id: 'B-5', nombre: 'Aula B-5', tipo: 'aula', edificioId: 'edificio_b', edificio: 'Edificio B', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'B-6', nombre: 'Aula B-6', tipo: 'aula', edificioId: 'edificio_b', edificio: 'Edificio B', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'B-7', nombre: 'Aula B-7', tipo: 'aula', edificioId: 'edificio_b', edificio: 'Edificio B', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'B-8', nombre: 'Aula B-8', tipo: 'aula', edificioId: 'edificio_b', edificio: 'Edificio B', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO C (Aulas 9-13, 16-21)
  // ==========================================
  { id: 'C-9', nombre: 'Aula C-9', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-10', nombre: 'Aula C-10', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'C-11', nombre: 'Aula C-11', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-12', nombre: 'Aula C-12', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado', 'Sonido Digital'], estado: 'disponible' },
  { id: 'C-13', nombre: 'Aula C-13', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-16', nombre: 'Aula C-16', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'C-17', nombre: 'Aula C-17', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 50, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-18', nombre: 'Aula C-18', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 55, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-19', nombre: 'Aula C-19', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 55, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'C-20', nombre: 'Aula C-20', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 60, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'C-21', nombre: 'Aula C-21', tipo: 'aula', edificioId: 'edificio_c', edificio: 'Edificio C', capacidad: 60, equipamiento: ['Proyector Láser', 'Climatizado', 'Audio Envolvente'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO N (Aulas 14-15)
  // ==========================================
  { id: 'N-14', nombre: 'Aula N-14', tipo: 'aula', edificioId: 'edificio_n', edificio: 'Edificio N', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'N-15', nombre: 'Aula N-15', tipo: 'aula', edificioId: 'edificio_n', edificio: 'Edificio N', capacidad: 40, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO L (Aulas 22-23)
  // ==========================================
  { id: 'L-22', nombre: 'Aula L-22', tipo: 'aula', edificioId: 'edificio_l', edificio: 'Edificio L', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'L-23', nombre: 'Aula L-23', tipo: 'aula', edificioId: 'edificio_l', edificio: 'Edificio L', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO K (Aulas 24-25)
  // ==========================================
  { id: 'K-24', nombre: 'Aula K-24', tipo: 'aula', edificioId: 'edificio_k', edificio: 'Edificio K', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'K-25', nombre: 'Aula K-25', tipo: 'aula', edificioId: 'edificio_k', edificio: 'Edificio K', capacidad: 45, equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },

  // ==========================================
  // EDIFICIO NUTRICIÓN (Aulas 1-8)
  // ==========================================
  { id: 'NUT-1', nombre: 'Aula Nutrición 1', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 40, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'NUT-2', nombre: 'Aula Nutrición 2', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 40, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'NUT-3', nombre: 'Aula Nutrición 3', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 45, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'NUT-4', nombre: 'Aula Nutrición 4', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 45, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'NUT-5', nombre: 'Aula Nutrición 5', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 45, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'NUT-6', nombre: 'Aula Nutrición 6', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 50, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado', 'SmartBoard'], estado: 'disponible' },
  { id: 'NUT-7', nombre: 'Aula Nutrición 7', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 50, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado'], estado: 'disponible' },
  { id: 'NUT-8', nombre: 'Aula Nutrición 8', tipo: 'aula', edificioId: 'edificio_nutricion', edificio: 'Edificio Nutrición', capacidad: 50, carreraExclusiva: 'nutricion', equipamiento: ['Proyector Láser', 'Climatizado', 'Cámara Streaming'], estado: 'disponible' },

  // ==========================================
  // LABORATORIOS ESPECIALIZADOS
  // ==========================================
  { id: 'LAB-MED-01', nombre: 'Lab. Anatomía y Disección Humana', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio A - Sótano', capacidad: 32, equipamiento: ['Mesas de Disección Cadavérica', 'Modelos Anatómicos 3D', 'Extractor Quirúrgico', 'Lámparas Cialíticas'], carreraExclusiva: 'medicina', estado: 'disponible' },
  { id: 'LAB-MED-02', nombre: 'Centro de Simulación Clínica & Triage', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio A - Nivel 3', capacidad: 28, equipamiento: ['Simuladores de Alta Fidelidad (SimMan)', 'Monitores Multiparámetro', 'Camas Hospitalarias', 'Gases Medicinales'], carreraExclusiva: 'medicina', estado: 'disponible' },
  { id: 'LAB-MED-03', nombre: 'Lab. Microbiología, Bioquímica y Patología', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio A - Nivel 2', capacidad: 30, equipamiento: ['Microscopios Binoculares Ópticos', 'Autoclave', 'Centrífugas Clínicas', 'Cabinas de Flujo Laminar'], carreraExclusiva: 'medicina', estado: 'disponible' },
  { id: 'LAB-MED-04', nombre: 'Lab. Farmacología y Fisiología', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio A - Nivel 2', capacidad: 30, equipamiento: ['Fisiógrafos Digitales', 'Equipos de ECG', 'Reactivos y Espectrofotómetro'], carreraExclusiva: 'medicina', estado: 'disponible' },
  { id: 'LAB-PSI-01', nombre: 'Cámara de Gesell 1 (Observación Clínica)', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio B - Nivel 1', capacidad: 20, equipamiento: ['Espejo Unidireccional', 'Micrófonos Ambientales Sennheiser', 'Circuito Cerrado de TV 4K', 'Sala de Observación Aislada'], carreraExclusiva: 'psicologia', estado: 'disponible' },
  { id: 'LAB-PSI-02', nombre: 'Cámara de Gesell 2 (Terapia Familiar/Infantil)', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio B - Nivel 1', capacidad: 18, equipamiento: ['Mobiliario Lúdico', 'Grabación Multi-ángulo', 'Espejo Unidireccional', 'Sonido Insonorizado'], carreraExclusiva: 'psicologia', estado: 'disponible' },
  { id: 'LAB-PSI-03', nombre: 'Lab. Psicometría y Neuroevaluación', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio B - Nivel 3', capacidad: 25, equipamiento: ['Baterías Neuropsicológicas (WAIS, WISC)', 'Software de Diagnóstico', 'Cabinas Individuales'], carreraExclusiva: 'psicologia', estado: 'disponible' },
  { id: 'LAB-PSI-04', nombre: 'Lab. Psicofisiología y Neurociencias', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio B - Nivel 3', capacidad: 22, equipamiento: ['Electroencefalograma (EEG)', 'Biosensores GSR', 'Eye-tracker Tobii', 'Software Biofeedback'], carreraExclusiva: 'psicologia', estado: 'disponible' },
  { id: 'LAB-NUT-01', nombre: 'Lab. Bromatología y Análisis de Alimentos', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio Nutrición - Nivel 2', capacidad: 28, equipamiento: ['Destiladores Kjeldahl', 'Mufas de Calcinación', 'Refractómetros Digitales', 'Campana de Extracción'], carreraExclusiva: 'nutricion', estado: 'disponible' },
  { id: 'LAB-NUT-02', nombre: 'Lab. Técnica Dietética y Cocina Experimental', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio Nutrición - Nivel 1', capacidad: 30, equipamiento: ['Estaciones de Cocción de Acero Inoxidable', 'Hornos Convectores', 'Básculas Grameras de Precisión', 'Refrigeración Industrial'], carreraExclusiva: 'nutricion', estado: 'disponible' },
  { id: 'LAB-NUT-03', nombre: 'Lab. Antropometría y Evaluación Nutricional', tipo: 'laboratorio', edificioId: 'laboratorios', edificio: 'Edificio Nutrición - Nivel 2', capacidad: 26, equipamiento: ['Bioimpedancia InBody 770', 'Plicómetros Holtain/Harpenden', 'Estadiómetros Seca', 'Cintas Antropométricas Lufkin'], carreraExclusiva: 'nutricion', estado: 'disponible' },

  // ==========================================
  // ÁREAS AUDIOVISUALES
  // ==========================================
  { id: 'AUD-01', nombre: 'Auditorio Magno "Hipócrates"', tipo: 'audiovisual', edificioId: 'audiovisual', edificio: 'Plaza Central - Planta Baja', capacidad: 250, equipamiento: ['Proyector Láser Cinema 4K', 'Consola Digital 32 Canales', 'Microfonía Inalámbrica Shure', 'Cabina de Streaming'], estado: 'disponible' },
  { id: 'AUD-02', nombre: 'Sala Audiovisual Multimedia 1', tipo: 'audiovisual', edificioId: 'audiovisual', edificio: 'Biblioteca Central - Nivel 2', capacidad: 80, equipamiento: ['Pantalla Doble Proyección', 'Sistema Acústico JBL', 'Atril Inteligente', 'Video-conferencia Zoom Rooms'], estado: 'disponible' },
  { id: 'AUD-03', nombre: 'Sala de Telemedicina y Conferencias Clínicas', tipo: 'audiovisual', edificioId: 'audiovisual', edificio: 'Edificio A - Nivel 3', capacidad: 60, equipamiento: ['Pantallas 85" Duales', 'Cámara PTZ con seguimiento por voz', 'Conexión Fibra Óptica'], estado: 'disponible' },

  // ==========================================
  // CANCHAS Y DOMOS UNIVERSITARIOS
  // ==========================================
  { id: 'DEP-FUT-01', nombre: 'Cancha de Fútbol 11 (Césped Natural)', tipo: 'cancha', edificioId: 'deportes_domos', edificio: 'Complejo Deportivo Norte', capacidad: 120, equipamiento: ['Césped con Drenaje Francés', 'Bancos de Suplentes Techados', 'Iluminación LED Nocturna', 'Porterías Reglamentarias'], estado: 'disponible' },
  { id: 'DEP-FUT-02', nombre: 'Cancha de Fútbol Rápido (Sintético)', tipo: 'cancha', edificioId: 'deportes_domos', edificio: 'Complejo Deportivo Sur', capacidad: 70, equipamiento: ['Pasto Sintético FIFA Quality', 'Malla Perimetral Protectora', 'Marcador Electrónico', 'Gradas Techadas'], estado: 'disponible' },
  { id: 'DOMO-01', nombre: 'Gran Domo Polideportivo Universitario', tipo: 'domo', edificioId: 'deportes_domos', edificio: 'Complejo Central', capacidad: 800, equipamiento: ['Duela de Madera Amortiguada', 'Tableros Hidráulicos Básquet', 'Red Vóley Profesional', 'Sistema de Sonido Masivo', 'Gradas Telescópicas'], estado: 'disponible' },
  { id: 'DOMO-02', nombre: 'Domo de Dinámicas Grupales y Bienestar', tipo: 'domo', edificioId: 'deportes_domos', edificio: 'Área de Jardines Universitarios', capacidad: 150, equipamiento: ['Piso Suave Antifatiga', 'Iluminación Cálida Regulable', 'Colchonetas y Tapetes Yoga', 'Sistema de Audio Relajación'], estado: 'disponible' }
];

// Generador coherente de +105 Docentes
const NOMBRES = [
  'Carlos', 'María', 'Alejandro', 'Ana', 'Fernando', 'Laura', 'Ricardo', 'Sofía', 'Javier', 'Valeria',
  'Miguel', 'Patricia', 'Roberto', 'Gabriela', 'Eduardo', 'Carmen', 'Daniel', 'Andrea', 'Héctor', 'Lucía',
  'Gonzalo', 'Daniela', 'Mauricio', 'Camila', 'Sergio', 'Elena', 'Arturo', 'Natalia', 'Jorge', 'Claudia',
  'Francisco', 'Teresa', 'Álvaro', 'Verónica', 'Hugo', 'Mariana', 'Luis', 'Beatriz', 'Raúl', 'Adriana'
];

const APELLIDOS = [
  'Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz',
  'Flores', 'Gómez', 'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Díaz', 'Torres', 'Gutiérrez', 'Ruiz',
  'Mendoza', 'Aguilar', 'Ortiz', 'Moreno', 'Castillo', 'Romero', 'Álvarez', 'Mendez', 'Chávez', 'Rivera',
  'Salazar', 'Vargas', 'Ramos', 'Navarro', 'Castro', 'Contreras', 'Paredes', 'Villanueva', 'Peña', 'Guerrero'
];

const MATERIAS_DOCENTES = {
  medicina: [
    'Anatomía Quirúrgica y Disección', 'Fisiología Humana I', 'Fisiología Humana II',
    'Bioquímica Médica', 'Histología y Embriología', 'Microbiología y Parasitología',
    'Farmacología Médica Básica', 'Farmacología Clínica', 'Patología General y Sistémica',
    'Propedéutica Clínica y Triage', 'Medicina Interna I', 'Medicina Interna II',
    'Cirugía General y Simulación', 'Pediatría y Neonatología', 'Ginecología y Obstetricia',
    'Inmunología Médica', 'Cardiología y EKG', 'Neurología Clínica', 'Urgencias y Soporte Vital'
  ],
  psicologia: [
    'Introducción a la Psicología Científica', 'Neuroanatomía y Conducta',
    'Psicopatología de la Infancia y Adolescencia', 'Psicopatología del Adulto',
    'Teorías y Sistemas de la Personalidad', 'Entrevista Clínica y Diagnóstico',
    'Evaluación Psicométrica e Interpretación', 'Terapia Cognitivo-Conductual',
    'Psicología Social y Comunitaria', 'Psicoterapia Psicoanalítica',
    'Técnicas de Observación en Cámara Gesell', 'Neuropsicología Clínica',
    'Psicología Educativa y del Aprendizaje', 'Psicofisiología Experimental',
    'Dinámicas de Grupo y Facilitación'
  ],
  nutricion: [
    'Fundamentos de la Nutrición Humana', 'Bromatología y Composición de Alimentos',
    'Técnica Dietética y Cocina Experimental', 'Cálculo Dietético del Individuo Sano',
    'Nutrición en el Embarazo y Lactancia', 'Nutrición del Niño y Adolescente',
    'Dietoterapia en Enfermedades Crónicas', 'Nutrición Clínica Hospitalaria',
    'Evaluación del Estado Nutricio y Antropometría', 'Bioquímica Nutricional y Metabolismo',
    'Toxicología de Alimentos y Conservación', 'Nutrición Deportiva y Rendimiento',
    'Políticas Públicas y Nutrición Comunitaria', 'Microbiología de los Alimentos'
  ],
  general: [
    'Acondicionamiento Físico y Salud', 'Fútbol Formativo y Universitario',
    'Entrenamiento Funcional', 'Gestión de Eventos y Liderazgo',
    'Psicología Deportiva Aplicada', 'Dinámicas Corporales y Manejo de Estrés'
  ]
};

// Generar array de 110 docentes
const DOCENTES = [];
let docIdCounter = 1;

function generarDocentes() {
  const grados = ['Dr.', 'Dra.', 'Mtro.', 'Mtra.', 'Esp.', 'Lic.'];
  
  // 42 docentes medicina
  for (let i = 0; i < 42; i++) {
    const nom = NOMBRES[(i * 3 + 2) % NOMBRES.length];
    const ape1 = APELLIDOS[(i * 2 + 1) % APELLIDOS.length];
    const ape2 = APELLIDOS[(i * 5 + 7) % APELLIDOS.length];
    const esMujer = ['María', 'Ana', 'Laura', 'Sofía', 'Valeria', 'Patricia', 'Gabriela', 'Carmen', 'Andrea', 'Lucía', 'Daniela', 'Camila', 'Elena', 'Natalia', 'Claudia', 'Teresa', 'Verónica', 'Mariana', 'Beatriz', 'Adriana'].includes(nom);
    const pref = esMujer ? (i % 3 === 0 ? 'Dra.' : (i % 3 === 1 ? 'Mtra.' : 'Esp.')) : (i % 3 === 0 ? 'Dr.' : (i % 3 === 1 ? 'Mtro.' : 'Esp.'));
    const matIndex = i % MATERIAS_DOCENTES.medicina.length;
    
    DOCENTES.push({
      id: `DOC-MED-${String(docIdCounter++).padStart(3, '0')}`,
      nombre: `${nom} ${ape1} ${ape2}`,
      titulo: `${pref} ${nom} ${ape1}`,
      prefijo: pref,
      carrera: 'medicina',
      especialidad: MATERIAS_DOCENTES.medicina[matIndex],
      materias: [MATERIAS_DOCENTES.medicina[matIndex], MATERIAS_DOCENTES.medicina[(matIndex + 3) % MATERIAS_DOCENTES.medicina.length]],
      email: `${nom.toLowerCase()}.${ape1.toLowerCase()}@unicampus.edu.mx`,
      telefono: `+52 (55) 5482-${String(1000 + i * 17).slice(-4)}`,
      cubiculo: `Edif. A - Cub. M-${101 + (i % 25)}`,
      horasSemanales: 18 + (i % 12),
      activo: true
    });
  }

  // 36 docentes psicología
  for (let i = 0; i < 36; i++) {
    const nom = NOMBRES[(i * 4 + 5) % NOMBRES.length];
    const ape1 = APELLIDOS[(i * 3 + 4) % APELLIDOS.length];
    const ape2 = APELLIDOS[(i * 2 + 9) % APELLIDOS.length];
    const esMujer = ['María', 'Ana', 'Laura', 'Sofía', 'Valeria', 'Patricia', 'Gabriela', 'Carmen', 'Andrea', 'Lucía', 'Daniela', 'Camila', 'Elena', 'Natalia', 'Claudia', 'Teresa', 'Verónica', 'Mariana', 'Beatriz', 'Adriana'].includes(nom);
    const pref = esMujer ? (i % 2 === 0 ? 'Dra.' : 'Mtra.') : (i % 2 === 0 ? 'Dr.' : 'Mtro.');
    const matIndex = i % MATERIAS_DOCENTES.psicologia.length;
    
    DOCENTES.push({
      id: `DOC-PSI-${String(docIdCounter++).padStart(3, '0')}`,
      nombre: `${nom} ${ape1} ${ape2}`,
      titulo: `${pref} ${nom} ${ape1}`,
      prefijo: pref,
      carrera: 'psicologia',
      especialidad: MATERIAS_DOCENTES.psicologia[matIndex],
      materias: [MATERIAS_DOCENTES.psicologia[matIndex], MATERIAS_DOCENTES.psicologia[(matIndex + 2) % MATERIAS_DOCENTES.psicologia.length]],
      email: `${nom.toLowerCase()}.${ape1.toLowerCase()}@unicampus.edu.mx`,
      telefono: `+52 (55) 5482-${String(2000 + i * 23).slice(-4)}`,
      cubiculo: `Edif. B - Cub. P-${201 + (i % 20)}`,
      horasSemanales: 16 + (i % 14),
      activo: true
    });
  }

  // 32 docentes nutrición
  for (let i = 0; i < 32; i++) {
    const nom = NOMBRES[(i * 2 + 8) % NOMBRES.length];
    const ape1 = APELLIDOS[(i * 4 + 3) % APELLIDOS.length];
    const ape2 = APELLIDOS[(i * 3 + 1) % APELLIDOS.length];
    const esMujer = ['María', 'Ana', 'Laura', 'Sofía', 'Valeria', 'Patricia', 'Gabriela', 'Carmen', 'Andrea', 'Lucía', 'Daniela', 'Camila', 'Elena', 'Natalia', 'Claudia', 'Teresa', 'Verónica', 'Mariana', 'Beatriz', 'Adriana'].includes(nom);
    const pref = esMujer ? (i % 3 === 0 ? 'Dra.' : (i % 3 === 1 ? 'Mtra.' : 'Lic.')) : (i % 3 === 0 ? 'Dr.' : (i % 3 === 1 ? 'Mtro.' : 'Lic.'));
    const matIndex = i % MATERIAS_DOCENTES.nutricion.length;
    
    DOCENTES.push({
      id: `DOC-NUT-${String(docIdCounter++).padStart(3, '0')}`,
      nombre: `${nom} ${ape1} ${ape2}`,
      titulo: `${pref} ${nom} ${ape1}`,
      prefijo: pref,
      carrera: 'nutricion',
      especialidad: MATERIAS_DOCENTES.nutricion[matIndex],
      materias: [MATERIAS_DOCENTES.nutricion[matIndex], MATERIAS_DOCENTES.nutricion[(matIndex + 2) % MATERIAS_DOCENTES.nutricion.length]],
      email: `${nom.toLowerCase()}.${ape1.toLowerCase()}@unicampus.edu.mx`,
      telefono: `+52 (55) 5482-${String(3000 + i * 19).slice(-4)}`,
      cubiculo: `Edif. C - Cub. N-${101 + (i % 18)}`,
      horasSemanales: 18 + (i % 10),
      activo: true
    });
  }

  // 6 docentes áreas deportivas y domo
  for (let i = 0; i < 6; i++) {
    const nom = ['Rodrigo', 'Esteban', 'Valeria', 'Mauricio', 'Lorena', 'Fabián'][i];
    const ape1 = ['Márquez', 'Beltrán', 'Solís', 'Padilla', 'Armenta', 'Villalobos'][i];
    const matIndex = i % MATERIAS_DOCENTES.general.length;
    DOCENTES.push({
      id: `DOC-DEP-${String(docIdCounter++).padStart(3, '0')}`,
      nombre: `${nom} ${ape1}`,
      titulo: `Lic. ${nom} ${ape1}`,
      prefijo: 'Lic.',
      carrera: 'general',
      especialidad: MATERIAS_DOCENTES.general[matIndex],
      materias: [MATERIAS_DOCENTES.general[matIndex]],
      email: `${nom.toLowerCase()}.${ape1.toLowerCase()}@unicampus.edu.mx`,
      telefono: `+52 (55) 5482-${String(4000 + i * 31).slice(-4)}`,
      cubiculo: `Complejo Deportivo - Oficina ${1 + i}`,
      horasSemanales: 20,
      activo: true
    });
  }
}

generarDocentes();

// Días de la semana: Lunes a Sábado
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Franjas horarias de 07:00 a 22:00 (Secciones por hora: 7 a 8, 8 a 9, etc.)
const FRANJAS_HORARIAS = [
  { inicio: '07:00', fin: '08:00', etiqueta: '07:00 - 08:00', horaNum: 7 },
  { inicio: '08:00', fin: '09:00', etiqueta: '08:00 - 09:00', horaNum: 8 },
  { inicio: '09:00', fin: '10:00', etiqueta: '09:00 - 10:00', horaNum: 9 },
  { inicio: '10:00', fin: '11:00', etiqueta: '10:00 - 11:00', horaNum: 10 },
  { inicio: '11:00', fin: '12:00', etiqueta: '11:00 - 12:00', horaNum: 11 },
  { inicio: '12:00', fin: '13:00', etiqueta: '12:00 - 13:00', horaNum: 12 },
  { inicio: '13:00', fin: '14:00', etiqueta: '13:00 - 14:00', horaNum: 13 },
  { inicio: '14:00', fin: '15:00', etiqueta: '14:00 - 15:00', horaNum: 14 },
  { inicio: '15:00', fin: '16:00', etiqueta: '15:00 - 16:00', horaNum: 15 },
  { inicio: '16:00', fin: '17:00', etiqueta: '16:00 - 17:00', horaNum: 16 },
  { inicio: '17:00', fin: '18:00', etiqueta: '17:00 - 18:00', horaNum: 17 },
  { inicio: '18:00', fin: '19:00', etiqueta: '18:00 - 19:00', horaNum: 18 },
  { inicio: '19:00', fin: '20:00', etiqueta: '19:00 - 20:00', horaNum: 19 },
  { inicio: '20:00', fin: '21:00', etiqueta: '20:00 - 21:00', horaNum: 20 },
  { inicio: '21:00', fin: '22:00', etiqueta: '21:00 - 22:00', horaNum: 21 }
];

// Generador de Asignaciones y Horarios Semanales Realistas
const ASIGNACIONES_INICIALES = [];

function inicializarHorariosBase() {
  let asignacionId = 1;

  // Asignaciones fijas representativas distribuidas de Lunes a Sábado
  // Para cada día y espacio, crearemos una programación rica y coherente.
  
  DIAS_SEMANA.forEach((dia, diaIdx) => {
    ESPACIOS.forEach((espacio, espIdx) => {
      // Sábado tiene clases de 07:00 a 16:00 normalmente o posgrados hasta 20:00
      const maxFranja = dia === 'Sábado' ? 9 : FRANJAS_HORARIAS.length;
      
      // Decidir si este espacio tiene clase en ciertas franjas
      FRANJAS_HORARIAS.slice(0, maxFranja).forEach((franja, franjaIdx) => {
        // Algoritmo pseudo-aleatorio determinista para llenar ~70% de ocupación
        const semilla = (diaIdx * 37 + espIdx * 19 + franjaIdx * 11) % 100;
        
        // Exclusividades de carreras para laboratorios
        let carreraDestino = 'medicina';
        if (espacio.carreraExclusiva) {
          carreraDestino = espacio.carreraExclusiva;
        } else if (espacio.tipo === 'cancha' || espacio.tipo === 'domo') {
          carreraDestino = (semilla % 4 === 0) ? 'general' : ((semilla % 3 === 0) ? 'psicologia' : 'nutricion');
        } else {
          // Aulas o audiovisuales
          if (espacio.id.startsWith('A-')) carreraDestino = 'medicina';
          else if (espacio.id.startsWith('B-')) carreraDestino = 'psicologia';
          else if (espacio.id.startsWith('C-')) carreraDestino = 'nutricion';
          else carreraDestino = ['medicina', 'psicologia', 'nutricion'][semilla % 3];
        }

        // Curva de ocupación universitaria dinámica según la hora del día
        const PROBABILIDAD_POR_HORA = {
          '07:00': 35, '08:00': 55, '09:00': 75, '10:00': 80,
          '11:00': 70, '12:00': 55, '13:00': 35, '14:00': 28,
          '15:00': 45, '16:00': 65, '17:00': 70, '18:00': 55,
          '19:00': 42, '20:00': 25, '21:00': 14
        };
        const probBase = PROBABILIDAD_POR_HORA[franja.inicio] || 50;
        const probOcupado = dia === 'Sábado' ? Math.round(probBase * 0.6) : probBase;
        if (semilla < probOcupado) {
          // Buscar docentes de esa carrera
          const docentesCarrera = DOCENTES.filter(d => d.carrera === carreraDestino);
          if (docentesCarrera.length === 0) return;
          
          const doc = docentesCarrera[(diaIdx + espIdx * 2 + franjaIdx * 3) % docentesCarrera.length];
          const materia = doc.materias[franjaIdx % doc.materias.length];

          // Semestre/Grupo
          const grupos = ['101-A', '201-B', '301-A', '402-C', '501-A', '602-B', '701-A', '801-C'];
          const grupo = grupos[(espIdx + diaIdx + franjaIdx) % grupos.length];

          // Asistencia o estado de llave
          const estadosAsistencia = ['presente', 'pendiente', 'en_curso', 'concluido'];
          const estado = estadosAsistencia[(diaIdx + franjaIdx) % estadosAsistencia.length];

          ASIGNACIONES_INICIALES.push({
            id: `ASIG-${String(asignacionId++).padStart(4, '0')}`,
            espacioId: espacio.id,
            espacioNombre: espacio.nombre,
            docenteId: doc.id,
            docenteNombre: doc.nombre,
            docenteTitulo: doc.titulo,
            carrera: carreraDestino,
            materia: materia,
            grupo: `Gpo ${grupo}`,
            dia: dia,
            horaInicio: franja.inicio,
            horaFin: franja.fin,
            alumnosRegistrados: 24 + ((espIdx * 3) % 20),
            estadoAsistencia: estado,
            llaveEntregada: (franjaIdx % 2 === 0),
            observaciones: franjaIdx === 2 ? 'Requiere proyector y audio calibrado' : ''
          });
        }
      });
    });
  });
}

inicializarHorariosBase();

// Bitácora Inicial de Registro de Llaves y Asistencia con Ciclo de Devolución
const BITACORA_INICIAL = [
  {
    id: 'REG-101',
    fecha: '2026-10-06',
    hora: '07:05',
    docenteNombre: 'Dr. Fernando Salazar Valenzuela',
    carrera: 'medicina',
    espacioId: 'LAB-MED-01',
    espacioNombre: 'Lab. Anatomía y Disección Humana',
    accion: 'Entrega de Llave & Encendido de Equipos',
    llaveEntregada: true,
    estadoLlave: 'devuelta',
    recibioPersonal: 'Guardia Javier Peña',
    estadoEquipos: 'Óptimo (Lámparas y extractores activos)',
    observaciones: 'Práctica de disección con 28 alumnos.',
    fechaDevolucion: '2026-10-06',
    horaDevolucion: '09:00',
    recibioDevolucion: 'Prefectura Turno Matutino',
    estadoFisicoAula: '✅ En óptimas condiciones (Limpio y apagado)',
    observacionesDevolucion: 'Mesa de disección y cubetas sanitizadas.'
  },
  {
    id: 'REG-102',
    fecha: '2026-10-06',
    hora: '08:35',
    docenteNombre: 'Dra. Mariana Castro Rivas',
    carrera: 'psicologia',
    espacioId: 'LAB-PSI-01',
    espacioNombre: 'Cámara de Gesell 1',
    accion: 'Check-in Docente & Entrega de Llave',
    llaveEntregada: true,
    estadoLlave: 'prestada',
    recibioPersonal: 'Coordinador Juan Solano',
    estadoEquipos: 'Micrófonos y circuito cerrado operando',
    observaciones: 'Simulación de entrevista clínica en curso.',
    fechaDevolucion: null,
    horaDevolucion: null,
    recibioDevolucion: null,
    estadoFisicoAula: null,
    observacionesDevolucion: null
  },
  {
    id: 'REG-103',
    fecha: '2026-10-06',
    hora: '10:02',
    docenteNombre: 'Mtra. Elena Morales Pineda',
    carrera: 'nutricion',
    espacioId: 'LAB-NUT-02',
    espacioNombre: 'Lab. Técnica Dietética y Cocina Experimental',
    accion: 'Check-in Docente & Entrega de Llave',
    llaveEntregada: true,
    estadoLlave: 'prestada',
    recibioPersonal: 'Auxiliar Mario Tapia',
    estadoEquipos: 'Hornos y campanas de extracción revisadas',
    observaciones: 'Práctica de dietas líquidas y trituradas.',
    fechaDevolucion: null,
    horaDevolucion: null,
    recibioDevolucion: null,
    estadoFisicoAula: null,
    observacionesDevolucion: null
  },
  {
    id: 'REG-104',
    fecha: '2026-10-06',
    hora: '11:32',
    docenteNombre: 'Lic. Andrés Paredes Soto',
    carrera: 'general',
    espacioId: 'DEP-FUT-01',
    espacioNombre: 'Cancha de Fútbol 11',
    accion: 'Préstamo de Material Deportivo y Cancha',
    llaveEntregada: false,
    estadoLlave: 'sin_llave',
    recibioPersonal: 'Guardia Javier Peña',
    estadoEquipos: 'Balones y conos entregados completos',
    observaciones: 'Torneo interfacultades de Medicina vs Nutrición.',
    fechaDevolucion: null,
    horaDevolucion: null,
    recibioDevolucion: null,
    estadoFisicoAula: null,
    observacionesDevolucion: null
  },
  {
    id: 'REG-105',
    fecha: '2026-10-06',
    hora: '14:35',
    docenteNombre: 'Dr. Alejandro Martínez Cruz',
    carrera: 'medicina',
    espacioId: 'AUD-01',
    espacioNombre: 'Auditorio Magno "Hipócrates"',
    accion: 'Entrega de Llave y Cabina Audiovisual',
    llaveEntregada: true,
    estadoLlave: 'prestada',
    recibioPersonal: 'Téc. Multimedia Raúl Vargas',
    estadoEquipos: 'Proyector láser y consola calibrados',
    observaciones: 'Cátedra magistral de Cirugía de Trauma.',
    fechaDevolucion: null,
    horaDevolucion: null,
    recibioDevolucion: null,
    estadoFisicoAula: null,
    observacionesDevolucion: null
  }
];

// Incidencias activas registradas
const INCIDENCIAS_INICIALES = [
  {
    id: 'INC-01',
    espacioId: 'A-1',
    espacioNombre: 'Aula A-1 (Edificio A)',
    reportadoPor: 'Dra. Patricia Ortiz Flores (Medicina)',
    prioridad: 'Media',
    descripcion: 'El cable HDMI del proyector presenta falso contacto intermitente.',
    estado: 'En Atención',
    fechaHora: '06/10/2026 09:15'
  },
  {
    id: 'INC-02',
    espacioId: 'LAB-NUT-01',
    espacioNombre: 'Lab. Bromatología y Alimentos',
    reportadoPor: 'Mtro. Héctor Mendoza Ramos (Nutrición)',
    prioridad: 'Baja',
    descripcion: 'Se requiere recarga de reactivos para prueba de lípidos en estación 3.',
    estado: 'Programado',
    fechaHora: '06/10/2026 11:40'
  }
];

// Registro inicial de Auditoría de Operaciones y Seguridad (Fase 7)
const AUDITORIA_INICIAL = [
  {
    id: 'AUD-001',
    fechaHora: '06/10/2026 07:05:12',
    timestamp: 1791331200000,
    usuario: 'Javier Peña (Prefectura)',
    rol: 'prefectura',
    modulo: 'Llaves',
    accion: 'Préstamo Llave',
    recurso: 'LAB-MED-01',
    detalle: 'Entrega de llave física y encendido de extractores a Dr. Fernando Salazar',
    severidad: 'info'
  },
  {
    id: 'AUD-002',
    fechaHora: '06/10/2026 08:35:40',
    timestamp: 1791336600000,
    usuario: 'Coordinador Académico',
    rol: 'admin',
    modulo: 'Horarios',
    accion: 'Asignación Horario',
    recurso: 'Aula A-1',
    detalle: 'Asignación de clase Bioquímica Médica I (Medicina) de 08:00 a 10:00',
    severidad: 'info'
  },
  {
    id: 'AUD-003',
    fechaHora: '06/10/2026 09:15:20',
    timestamp: 1791339000000,
    usuario: 'Dra. Patricia Ortiz',
    rol: 'docente',
    modulo: 'Incidencias',
    accion: 'Reporte Incidencia',
    recurso: 'Aula A-1',
    detalle: 'Reporte de falso contacto en cable HDMI en el proyector del aula',
    severidad: 'advertencia'
  },
  {
    id: 'AUD-004',
    fechaHora: '06/10/2026 13:00:15',
    timestamp: 1791352800000,
    usuario: 'Prefectura Matutina',
    rol: 'prefectura',
    modulo: 'Llaves',
    accion: 'Devolución Llave',
    recurso: 'LAB-MED-01',
    detalle: 'Recepción de llave física. Aula entregada limpia y equipo apagado',
    severidad: 'info'
  },
  {
    id: 'AUD-005',
    fechaHora: '06/10/2026 14:00:10',
    timestamp: 1791356000000,
    usuario: 'Superadmin TI',
    rol: 'superadmin',
    modulo: 'Espacios',
    accion: 'Edición Capacidad',
    recurso: 'LAB-PSI-01',
    detalle: 'Ajuste de capacidad máxima física de 20 a 25 alumnos',
    severidad: 'advertencia'
  }
];

