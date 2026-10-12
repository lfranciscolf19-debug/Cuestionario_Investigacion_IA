# 🏛️ FACULTAD DE CIENCIAS DE LA SALUD (FACSA-UJED)
## Sistema Integral de Control, Programación y Gestión de Espacios Físicos

Sistema web institucional desarrollado para la **Facultad de Ciencias de la Salud de la Universidad Juárez del Estado de Durango (FACSA-UJED)** para la administración, optimización, seguridad y control en tiempo real de aulas, laboratorios, clínicas, áreas audiovisuales y complejos deportivos.

---

### 🎨 Identidad Institucional y Diseño
* **Paleta Universitaria:** Rojo Carmesí (`#7f1d1d`), Dorado Institucional (`#c9a227`), Azul Profundo (`#0b2a5b`) y soporte completo de modo oscuro/claro de alto contraste.
* **Tipografía Moderna:** *Plus Jakarta Sans* para interfaz y *JetBrains Mono* para códigos de aula y horarios.
* **Accesibilidad WCAG 2.1 AA:** Áreas táctiles optimizadas (≥44px), navegación completa por teclado con anillo de enfoque dorado (`:focus-visible`), soporte para lectores de pantalla mediante roles ARIA semánticos (`role="tablist"`, `role="dialog"`, `aria-live="polite"`), y atajo de cierre global con tecla **Escape**.
* **Rendimiento:** Cero dependencias pesadas en tiempo de ejecución, debounce inteligente en todas las búsquedas, y carga inmediata.

---

### 👥 Perfiles de Usuario y Matriz de Permisos

| Perfil | Nivel de Acceso | Funcionalidades Principales |
| :--- | :---: | :--- |
| **👑 Superadmin TI** | Total (Nivel 5) | Control absoluto, reinicio seguro, restauración de respaldos JSON, auditoría completa, depuración de logs y administración de infraestructura. |
| **👨‍💼 Administrador** | Coordinación (Nivel 4) | Programación de asignaciones y clases, matriz de horarios, gestión de directores de licenciatura, altas de docentes y reportes. |
| **🔑 Prefectura** | Operativo (Nivel 3) | Check-in de docentes, entrega de llaves, registro de devolución con verificación física del aula, y reporte de incidencias de mantenimiento. |
| **👨‍🏫 Docente** | Académico (Nivel 2) | Acceso a "Mi Horario" con visualización personalizada de clases asignadas, exportación a PDF oficial y consulta de espacios. |
| **👁️ Consulta Pública** | Informativo (Nivel 1) | Monitor en vivo de disponibilidad de aulas y matriz de horarios de libre acceso para alumnos y visitantes. |

---

### 🚀 Módulos del Sistema

#### 1. 🏢 Monitor de Espacios en Vivo
* Visualización en tiempo real del estado de cada aula: **🟢 Disponible**, **🔴 En Clase**, **🔑 Llave Entregada / Prestada**, o **⚠️ En Mantenimiento**.
* Filtros rápidos combinables por licenciatura (*Medicina*, *Psicología*, *Nutrición*, *Deportes*), por edificio y por tipo de espacio (*Aulas*, *Laboratorios*, *Audiovisuales*).
* Indicadores clave de rendimiento (KPIs) automáticos: ocupación porcentual, aulas libres y llaves en préstamo.

#### 2. 📅 Matriz Semanal de Horarios (07:00 a 22:00)
* Cuadrícula semanal interactiva de Lunes a Sábado con franjas horarias por hora.
* Selector jerárquico por Edificio y Aula con botones de navegación rápida anterior/siguiente (◀ / ▶).
* Clic en celda libre para agendar directamente; clic en celda ocupada para consultar ficha de clase, editar o desocupar inmediatamente.
* Detección de solapamientos con advertencias visuales y modo de reprogramación supervisada.

#### 3. 👨‍🏫 Directorio Docente Universitario
* Catálogo preinstalado de **+116 profesores** con grado académico, especialidad, carga horaria, cubículo y contacto.
* Ficha modal individual de docente con visualización de su horario semanal completo.
* Carga masiva de profesores vía archivo CSV y plantilla descargable en un clic.

#### 4. 📋 Bitácora & Control de Llaves
* Ciclo operativo formal de dos fases: **Entrega** y **Devolución de Llave**.
* Modal de devolución con registro de condición física de entrega del aula (*Óptimo*, *Detalle menor*, *Falla reportada*) y generación automática de incidencias.
* Banner de advertencia proactivo para llaves con demora o préstamos no devueltos al concluir el horario de clase.

#### 5. 📊 Métricas, Reportes y Exportación
* Gráficas de demanda y distribución horaria por licenciatura.
* Exportación oficial en formato CSV:
  * Asignaciones académicas completas con edificio y observaciones.
  * Directorio docente institucional.
  * Bitácora de llaves con marcas de tiempo de entrega y retorno.
  * Registro de auditoría del sistema.
* Generador de horarios imprimibles en PDF con membrete oficial FACSA-UJED.

#### 6. 🏗️ Administración de Infraestructura
* Alta y edición de nuevos edificios y aulas personalizadas con persistencia local.
* Configuración de capacidades personalizadas por aula.

#### 7. 🛡️ Auditoría de Operaciones y Seguridad
* Registro inmutable de cada acción relevante (programación, desocupación, entrega de llaves, inicio de sesión, cambios de directores y restauraciones).
* Clasificación por severidad (*Info*, *Advertencia*, *Crítica*) con filtros interactivos y exportación CSV.

#### 8. 💾 Centro de Respaldo y Recuperación de Datos
* Exportación de paquetes JSON estructurados (v2) con metadatos y estadísticas de contenido.
* Restauración con verificación previa de esquema, conteo de entidades y **descarga automática de respaldo preventivo** para protección total contra pérdidas accidentales.
* Alerta proactiva de recordatorio mensual de copia de seguridad.

---

### 💻 Instrucciones de Puesta en Marcha

1. **Ejecución Local Rápida en Windows:**
   * Haz doble clic sobre el archivo ejecutable `iniciar.bat`.
   * El sistema iniciará el servidor local y abrirá automáticamente tu navegador en:
     ```text
     http://localhost:8080/
     ```
2. **Ejecución mediante Terminal o Servidor Web:**
   * Abre PowerShell o CMD en la carpeta del proyecto y ejecuta:
     ```bash
     python -m http.server 8080
     ```
   * Accede desde cualquier navegador web en la red universitaria a `http://localhost:8080/`.

---

*FACSA-UJED • Facultad de Ciencias de la Salud • Universidad Juárez del Estado de Durango*
