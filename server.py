#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UniCampus & Módulo CUIAG-CIS - Servidor HTTP y API REST Institucional
Facultad de Ciencias de la Salud (FACSA - UJED)
Implementación nativa sin dependencias externas (Python Standard Library).
"""

import sys
import os
import json
import sqlite3
import uuid
import csv
import io
import socket
import urllib.parse
from datetime import datetime
try:
    from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
except ImportError:
    from http.server import HTTPServer as ThreadingHTTPServer, SimpleHTTPRequestHandler
from excel_report import generar_excel_cuiag
import db_adapter

def obtener_ip_red():
    """Detecta la IP local de la computadora en la red Wi-Fi o Ethernet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return '127.0.0.1'

PORT = int(os.environ.get('PORT', 8080))
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, 'cuiag_investigacion.db')

VERSION_INSTRUMENTO = "1.0-preliminar-expertos"
ADMIN_PASSWORD = os.environ.get('CUIAG_ADMIN_PASSWORD', 'facsa2026')
ITEMS_INVERSOS = {16, 23, 29, 36}

DIMENSIONES_METADATA = [
    {"num": 1, "nombre": "Uso académico de IA generativa", "items": list(range(1, 8))},
    {"num": 2, "nombre": "Alfabetización en inteligencia artificial", "items": list(range(8, 14))},
    {"num": 3, "nombre": "Pensamiento crítico y verificación", "items": list(range(14, 21))},
    {"num": 4, "nombre": "Uso ético y responsable", "items": list(range(21, 26))},
    {"num": 5, "nombre": "Autoeficacia investigativa", "items": list(range(26, 32))},
    {"num": 6, "nombre": "Competencias investigativas percibidas", "items": list(range(32, 41))}
]

ENUNCIADOS_ITEMS = {
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
    16: "Acepto como correcta la información de la IA sin comprobarla cuando parece convincente. (Reactivo inverso)",
    17: "Comparo las respuestas de la IA con artículos científicos y otras fuentes confiables.",
    18: "Reviso si los argumentos generados por IA cuentan con evidencia suficiente.",
    19: "Identifico posibles contradicciones entre las respuestas de la IA y la literatura científica.",
    20: "Elaboro mis propias conclusiones después de evaluar críticamente la información obtenida mediante IA.",
    21: "Respeto las normas de integridad académica cuando utilizo IA generativa en mis trabajos.",
    22: "Declaro el uso de IA generativa cuando así lo solicitan las normas institucionales o académicas aplicables.",
    23: "Presento como propias las respuestas generadas por IA sin reconocer su utilización. (Reactivo inverso)",
    24: "Evito introducir datos personales o información clínica confidencial en herramientas de IA no autorizadas para ese propósito.",
    25: "Comprendo que soy responsable de verificar y responder por el contenido que entrego, aunque haya utilizado IA.",
    26: "Me siento capaz de identificar un problema de investigación relacionado con mi área profesional.",
    27: "Me siento capaz de formular preguntas y objetivos de investigación claros.",
    28: "Me siento capaz de localizar y seleccionar literatura científica pertinente.",
    29: "Necesito que la IA tome por mí las decisiones metodológicas importantes de una investigación. (Reactivo inverso)",
    30: "Me siento capaz de interpretar resultados de investigación y relacionarlos con la pregunta planteada.",
    31: "Me siento capaz de elaborar conclusiones sustentadas en la evidencia científica.",
    32: "Puedo delimitar un problema de investigación relevante para las ciencias de la salud.",
    33: "Puedo justificar la importancia de una investigación mediante antecedentes científicos.",
    34: "Puedo identificar y utilizar literatura científica pertinente para fundamentar un estudio.",
    35: "Puedo formular objetivos de investigación congruentes con el problema planteado.",
    36: "Puedo desarrollar adecuadamente un trabajo de investigación únicamente cuando cuento con ayuda de IA generativa. (Reactivo inverso)",
    37: "Puedo seleccionar un diseño metodológico congruente con los objetivos de investigación.",
    38: "Puedo organizar e interpretar datos de acuerdo con los objetivos y métodos de un estudio.",
    39: "Puedo discutir resultados relacionándolos con hallazgos de investigaciones previas.",
    40: "Puedo comunicar resultados y conclusiones de investigación de forma clara y fundamentada."
}

def inicializar_bd():
    """Inicializa la base de datos (PostgreSQL en la nube o SQLite local)."""
    db_adapter.inicializar_bd()

def registrar_auditoria_admin(usuario_rol, accion, detalle):
    """Registra una acción administrativa en la base de datos de auditoría."""
    try:
        conn = db_adapter.obtener_conexion()
        cursor = conn.cursor()
        sql = db_adapter.adaptar_sql(
            "INSERT INTO cuiag_auditoria_admin (id, timestamp, usuario_rol, accion, detalle) VALUES (?, ?, ?, ?, ?)"
        )
        cursor.execute(
            sql,
            (f"AUD-CUIAG-{uuid.uuid4().hex[:8]}", datetime.now().isoformat(), usuario_rol, accion, detalle)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Error Auditoría] {e}", file=sys.stderr)

class FACSAHTTPHandler(SimpleHTTPRequestHandler):
    """Manejador HTTP que combina servidor de archivos estáticos y API REST CUIAG-CIS."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _responder_json(self, codigo, datos):
        self.send_response(codigo)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-FACSA-Role, X-FACSA-Key')
        self.end_headers()
        import decimal
        def json_serial(obj):
            if isinstance(obj, decimal.Decimal):
                return float(obj)
            return str(obj)
        self.wfile.write(json.dumps(datos, ensure_ascii=False, default=json_serial).encode('utf-8'))

    def _es_autorizado_admin(self):
        """Verifica que la petición provenga de un usuario administrativo con clave válida."""
        clave = self.headers.get('X-FACSA-Key', '').strip()
        if clave == ADMIN_PASSWORD:
            return True
        rol = self.headers.get('X-FACSA-Role', '').strip().lower()
        client_ip = self.client_address[0] if hasattr(self, 'client_address') else ''
        if client_ip in ('127.0.0.1', 'localhost', '::1') and rol in ['superadmin', 'admin']:
            return True
        return False

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-FACSA-Role, X-FACSA-Key')
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # -------------------------------------------------------------
        # Rutas de API REST
        # -------------------------------------------------------------
        if path == '/api/cuiag/estado':
            self.manejar_get_estado()
            return

        if path == '/api/cuiag/admin/metricas':
            self.manejar_get_metricas()
            return

        if path == '/api/cuiag/admin/exportar-csv':
            self.manejar_exportar_csv()
            return

        if path == '/api/cuiag/admin/exportar-excel':
            self.manejar_exportar_excel()
            return

        if path == '/api/cuiag/admin/diccionario':
            self.manejar_exportar_diccionario()
            return

        if path == '/api/cuiag/admin/auditoria':
            self.manejar_get_auditoria()
            return

        if path in ['/admin', '/admin/']:
            self.path = '/admin.html'

        if path in ['/cuestionario', '/cuestionario/']:
            self.path = '/index.html'

        # Para cualquier otra ruta, servir archivos estáticos con SimpleHTTPRequestHandler
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == '/api/cuiag/respuestas':
            self.manejar_post_respuestas()
            return

        if path == '/api/cuiag/admin/login':
            self.manejar_post_login_admin()
            return

        if path == '/api/cuiag/admin/config':
            self.manejar_post_config()
            return

        self._responder_json(404, {"error": "Ruta de API no encontrada"})

    def manejar_post_login_admin(self):
        """Valida la contraseña de acceso al panel de investigación."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            datos = json.loads(body) if body else {}
            clave = str(datos.get('clave', '')).strip()

            if clave == ADMIN_PASSWORD:
                rol_asignado = 'superadmin'
                registrar_auditoria_admin(rol_asignado, 'Inicio de Sesión', 'Acceso autorizado al panel de investigación con clave')
                self._responder_json(200, {
                    "ok": True,
                    "mensaje": "Acceso de investigación autorizado.",
                    "rol": rol_asignado,
                    "key": ADMIN_PASSWORD
                })
            else:
                self._responder_json(401, {"error": "Contraseña de acceso incorrecta. Intente de nuevo."})
        except Exception as e:
            self._responder_json(400, {"error": f"Petición inválida: {str(e)}"})

    # -----------------------------------------------------------------
    # CONTROLADORES DE ENDPOINTS
    # -----------------------------------------------------------------

    def manejar_get_estado(self):
        """Devuelve el estado público de recepción del cuestionario."""
        try:
            conn = db_adapter.obtener_conexion()
            cursor = conn.cursor()
            cursor.execute(db_adapter.adaptar_sql("SELECT clave, valor FROM cuiag_config"))
            config = dict(cursor.fetchall())
            conn.close()

            activo = config.get("recepcion_activa", "1") == "1"
            confirmacion = config.get("confirmacion_aprobacion_institucional", "1") == "1"
            mensaje = config.get("mensaje_inactivo", "La recepción de respuestas se encuentra actualmente pausada.")

            self._responder_json(200, {
                "ok": True,
                "activo": activo and confirmacion,
                "recepcion_activa": activo,
                "aprobacion_institucional": confirmacion,
                "mensaje": mensaje,
                "version": VERSION_INSTRUMENTO
            })
        except Exception as e:
            self._responder_json(500, {"error": "Error al consultar estado del cuestionario"})

    def manejar_post_respuestas(self):
        """Recibe, valida exhaustivamente en el backend y almacena respuestas anónimas."""
        # 1. Verificar estado de recepción
        try:
            conn = db_adapter.obtener_conexion()
            cursor = conn.cursor()
            cursor.execute(db_adapter.adaptar_sql("SELECT clave, valor FROM cuiag_config"))
            config = dict(cursor.fetchall())
            if config.get("recepcion_activa", "1") != "1" or config.get("confirmacion_aprobacion_institucional", "1") != "1":
                conn.close()
                self._responder_json(403, {
                    "ok": False,
                    "error": config.get("mensaje_inactivo", "La recepción de respuestas se encuentra temporalmente inactiva.")
                })
                return
        except Exception as e:
            self._responder_json(500, {"error": "Error interno del servidor al verificar configuración"})
            return

        # 2. Leer cuerpo de la petición
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 100000:  # Límite preventivo de 100KB
                self._responder_json(413, {"error": "Carga útil excede el tamaño máximo permitido"})
                return
            body_bytes = self.wfile if False else self.rfile.read(content_length)
            datos = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self._responder_json(400, {"error": "Formato de solicitud inválido (se requiere JSON válido)"})
            return

        # 3. Validación de Token Anti-Duplicado (evita envíos dobles o accidentales)
        token_envio = str(datos.get('token_envio', '')).strip()
        if not token_envio or len(token_envio) < 8:
            token_envio = uuid.uuid4().hex

        # Verificar si el token ya fue registrado previamente
        try:
            cursor.execute(db_adapter.adaptar_sql("SELECT id FROM cuiag_respuestas WHERE token_envio = ?"), (token_envio,))
            existente = cursor.fetchone()
            if existente:
                conn.close()
                self._responder_json(200, {
                    "ok": True,
                    "mensaje": "Respuesta previamente guardada con éxito (duplicado descartado).",
                    "id_confirmacion": existente[0]
                })
                return
        except Exception as e:
            pass

        # 4. Validación rigurosa de Datos Generales
        carrera = str(datos.get('carrera', '')).strip()
        carreras_validas = {'Medicina', 'Psicología', 'Nutrición'}
        if carrera not in carreras_validas:
            conn.close()
            self._responder_json(422, {"error": f"Carrera inválida. Opciones permitidas: {', '.join(carreras_validas)}"})
            return

        try:
            edad = int(datos.get('edad', 0))
            if edad < 17 or edad > 99:
                conn.close()
                self._responder_json(422, {"error": "Edad fuera de rango válido (17-99 años)."})
                return
        except (ValueError, TypeError):
            conn.close()
            self._responder_json(422, {"error": "Edad debe ser un número entero válido."})
            return

        uso_ia = str(datos.get('uso_ia_academico', '')).strip()
        if uso_ia not in {'Sí', 'No'}:
            conn.close()
            self._responder_json(422, {"error": "Respuesta de uso académico de IA debe ser 'Sí' o 'No'."})
            return

        herramientas = datos.get('herramientas_ia', [])
        if not isinstance(herramientas, list):
            herramientas = []
        herramientas_str = json.dumps([str(h)[:50] for h in herramientas[:10]], ensure_ascii=False)

        frecuencia = str(datos.get('frecuencia_uso', '')).strip()
        frecuencias_validas = {'Nunca', 'Rara vez', 'Algunas veces', 'Frecuentemente', 'Muy frecuentemente'}
        if frecuencia not in frecuencias_validas:
            conn.close()
            self._responder_json(422, {"error": "Frecuencia de uso inválida."})
            return

        # 5. Validación rigurosa de los 40 Reactivos Oficiales
        items = datos.get('items', {})
        if not isinstance(items, dict):
            conn.close()
            self._responder_json(422, {"error": "Estructura de reactivos inválida."})
            return

        valores_items = []
        for i in range(1, 41):
            val = items.get(str(i)) or items.get(i)
            try:
                val_int = int(val)
                if val_int < 1 or val_int > 5:
                    conn.close()
                    self._responder_json(422, {"error": f"El reactivo {i} tiene un valor fuera de escala (debe ser 1 a 5)."})
                    return
                valores_items.append(val_int)
            except (ValueError, TypeError):
                conn.close()
                self._responder_json(422, {"error": f"Falta responder el reactivo obligatorio {i}."})
                return

        # Campos de preguntas complementarias de IA
        tipo_version = str(datos.get('tipo_version_ia', '')).strip()[:150]
        paga_suscripcion = str(datos.get('paga_suscripcion_ia', '')).strip()[:150]
        versiones_pago = datos.get('versiones_pago_ia', [])
        if not isinstance(versiones_pago, list):
            versiones_pago = []
        versiones_pago_str = json.dumps([str(v)[:80] for v in versiones_pago[:15]], ensure_ascii=False)
        tiempo_uso = str(datos.get('tiempo_uso_ia', '')).strip()[:100]

        # 6. Almacenamiento seguro y anónimo mediante consulta parametrizada
        id_tecnico = f"CUIAG-{uuid.uuid4().hex[:12].upper()}"
        timestamp = datetime.now().isoformat()
        version = VERSION_INSTRUMENTO

        columnas = [
            "id", "timestamp", "carrera", "edad", "uso_ia_academico",
            "herramientas_ia", "frecuencia_uso",
            "tipo_version_ia", "paga_suscripcion_ia", "versiones_pago_ia", "tiempo_uso_ia"
        ]
        columnas.extend([f"item_{i}" for i in range(1, 41)])
        columnas.extend(["version_instrumento", "estado", "token_envio"])

        placeholders = ", ".join(["?"] * len(columnas))
        valores = [
            id_tecnico, timestamp, carrera, edad, uso_ia,
            herramientas_str, frecuencia,
            tipo_version, paga_suscripcion, versiones_pago_str, tiempo_uso
        ]
        valores.extend(valores_items)
        valores.extend([version, "completado", token_envio])

        try:
            sql = f"INSERT INTO cuiag_respuestas ({', '.join(columnas)}) VALUES ({placeholders})"
            cursor.execute(db_adapter.adaptar_sql(sql), valores)
            conn.commit()
            conn.close()

            self._responder_json(201, {
                "ok": True,
                "mensaje": "Sus respuestas han sido registradas exitosamente de manera anónima. ¡Muchas gracias por su participación en la investigación!",
                "id_confirmacion": id_tecnico
            })
        except Exception as e:
            conn.close()
            err_str = str(e).lower()
            if 'unique' in err_str or 'duplicate' in err_str or 'integrity' in err_str:
                self._responder_json(409, {"error": "Envío duplicado detectado. Sus respuestas ya habían sido guardadas."})
            else:
                print(f"[Error Guardar Respuestas] {e}", file=sys.stderr)
                self._responder_json(500, {"error": "Error interno al guardar respuestas."})

    def manejar_get_metricas(self):
        """Devuelve estadísticas descriptivas agregadas para el panel de investigación (protegido por rol)."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido. Se requiere rol administrativo (Superadmin TI o Administrador)."})
            return

        try:
            conn = db_adapter.obtener_conexion()
            cursor = conn.cursor()

            # Total completados
            cursor.execute(db_adapter.adaptar_sql("SELECT COUNT(*) FROM cuiag_respuestas WHERE estado = 'completado'"))
            total = cursor.fetchone()[0]

            # Distribución por carrera
            cursor.execute(db_adapter.adaptar_sql("SELECT carrera, COUNT(*) as cantidad FROM cuiag_respuestas GROUP BY carrera"))
            por_carrera = {row['carrera']: row['cantidad'] for row in cursor.fetchall()}

            # Distribución por uso previo de IA
            cursor.execute(db_adapter.adaptar_sql("SELECT uso_ia_academico, COUNT(*) as cantidad FROM cuiag_respuestas GROUP BY uso_ia_academico"))
            por_uso_ia = {row['uso_ia_academico']: row['cantidad'] for row in cursor.fetchall()}

            # Distribución por frecuencia de uso
            cursor.execute(db_adapter.adaptar_sql("SELECT frecuencia_uso, COUNT(*) as cantidad FROM cuiag_respuestas GROUP BY frecuencia_uso"))
            por_frecuencia = {row['frecuencia_uso']: row['cantidad'] for row in cursor.fetchall()}

            # Promedio de edad
            cursor.execute(db_adapter.adaptar_sql("SELECT AVG(edad), MIN(edad), MAX(edad) FROM cuiag_respuestas"))
            fila_edad = cursor.fetchone()
            promedio_edad = round(float(fila_edad[0] or 0), 1)
            min_edad = int(fila_edad[1] or 0)
            max_edad = int(fila_edad[2] or 0)

            # Frecuencias y porcentajes para cada uno de los 40 reactivos
            frecuencias_items = {}
            for i in range(1, 41):
                col = f"item_{i}"
                cursor.execute(db_adapter.adaptar_sql(f"""
                SELECT {col} as valor, COUNT(*) as cant 
                FROM cuiag_respuestas 
                GROUP BY {col}
                """))
                conteo = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                for r in cursor.fetchall():
                    conteo[r['valor']] = r['cant']

                porcentajes = {
                    k: round((v / total * 100), 1) if total > 0 else 0
                    for k, v in conteo.items()
                }

                # Cálculo de media aritmética descriptiva del reactivo
                cursor.execute(db_adapter.adaptar_sql(f"SELECT AVG({col}) FROM cuiag_respuestas"))
                media = round(float(cursor.fetchone()[0] or 0), 2)

                frecuencias_items[i] = {
                    "enunciado": ENUNCIADOS_ITEMS.get(i, ""),
                    "es_inverso": i in ITEMS_INVERSOS,
                    "frecuencias": conteo,
                    "porcentajes": porcentajes,
                    "media_original": media
                }

            # Configuración actual
            cursor.execute(db_adapter.adaptar_sql("SELECT clave, valor FROM cuiag_config"))
            config = dict(cursor.fetchall())
            conn.close()

            self._responder_json(200, {
                "ok": True,
                "total_completados": total,
                "version_instrumento": VERSION_INSTRUMENTO,
                "carreras": por_carrera,
                "uso_ia": por_uso_ia,
                "frecuencias_uso": por_frecuencia,
                "edad_stats": {
                    "promedio": promedio_edad,
                    "min": min_edad,
                    "max": max_edad
                },
                "items": frecuencias_items,
                "dimensiones": DIMENSIONES_METADATA,
                "ip_local": obtener_ip_red(),
                "url_alumnos": f"http://{obtener_ip_red()}:{PORT}/",
                "config": {
                    "recepcion_activa": config.get("recepcion_activa", "1") == "1",
                    "aprobacion_institucional": config.get("confirmacion_aprobacion_institucional", "1") == "1",
                    "mensaje_inactivo": config.get("mensaje_inactivo", "")
                }
            })
        except Exception as e:
            self._responder_json(500, {"error": f"Error al generar métricas: {str(e)}"})

    def manejar_exportar_csv(self):
        """Exporta respuestas con valores originales y variables recodificadas derivadas (UTF-8 con BOM)."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido. Se requiere perfil administrativo."})
            return

        try:
            filas = db_adapter.obtener_todas_las_respuestas()

            # Preparar CSV en memoria con BOM UTF-8 para apertura correcta en Microsoft Excel
            output = io.StringIO()
            writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

            # Encabezados: Datos generales + Preguntas complementarias IA + 40 reactivos originales + 4 reactivos recodificados + puntuaciones de dimensión
            encabezados = [
                "id_tecnico", "fecha_hora", "carrera", "edad",
                "uso_ia_academico", "frecuencia_general_uso",
                "herramientas_ia", "tipo_version_ia", "paga_suscripcion_ia", "versiones_pago_ia", "tiempo_uso_ia",
                "version_instrumento", "estado"
            ]
            # Reactivos originales (1 al 40)
            encabezados.extend([f"item_{i}" for i in range(1, 41)])
            # Reactivos inversos recodificados: Puntuación recodificada = 6 - respuesta original
            encabezados.extend([f"item_{i}_recodificado" for i in sorted(ITEMS_INVERSOS)])
            # Puntuaciones brutas por dimensión para análisis derivado
            encabezados.extend([f"dim_{d['num']}_{d['nombre'].lower().replace(' ', '_')}_suma" for d in DIMENSIONES_METADATA])

            writer.writerow(encabezados)

            for f in filas:
                f_keys = f.keys()
                fila_csv = [
                    f["id"], f["timestamp"], f["carrera"], f["edad"],
                    f["uso_ia_academico"], f["frecuencia_uso"],
                    f["herramientas_ia"],
                    f["tipo_version_ia"] if "tipo_version_ia" in f_keys else "",
                    f["paga_suscripcion_ia"] if "paga_suscripcion_ia" in f_keys else "",
                    f["versiones_pago_ia"] if "versiones_pago_ia" in f_keys else "[]",
                    f["tiempo_uso_ia"] if "tiempo_uso_ia" in f_keys else "",
                    f["version_instrumento"], f["estado"]
                ]
                # Valores originales de reactivos (1 a 40)
                respuestas_items = {}
                for i in range(1, 41):
                    val = f[f"item_{i}"]
                    respuestas_items[i] = val
                    fila_csv.append(val)

                # Reactivos inversos recodificados: 6 - x
                for inv in sorted(ITEMS_INVERSOS):
                    val_orig = respuestas_items[inv]
                    val_rec = 6 - val_orig
                    fila_csv.append(val_rec)

                # Suma por dimensiones usando reactivos recodificados donde corresponda
                for d in DIMENSIONES_METADATA:
                    suma_dim = 0
                    for item_idx in d["items"]:
                        if item_idx in ITEMS_INVERSOS:
                            suma_dim += (6 - respuestas_items[item_idx])
                        else:
                            suma_dim += respuestas_items[item_idx]
                    fila_csv.append(suma_dim)

                writer.writerow(fila_csv)

            csv_content = output.getvalue()
            # UTF-8 BOM
            csv_bytes = b'\xef\xbb\xbf' + csv_content.encode('utf-8')

            rol_actual = self.headers.get('X-FACSA-Role', 'admin')
            registrar_auditoria_admin(rol_actual, 'Exportación CSV', f'Exportadas {len(filas)} respuestas de CUIAG-CIS')

            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="cuiag_cis_respuestas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"')
            self.send_header('Content-Length', str(len(csv_bytes)))
            self.end_headers()
            self.wfile.write(csv_bytes)
        except Exception as e:
            self._responder_json(500, {"error": f"Error al exportar CSV: {str(e)}"})

    def manejar_exportar_excel(self):
        """Exporta un libro Excel (.xlsx) con 3 hojas, formateo institucional, análisis y gráficos estadísticos."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido. Se requiere rol administrativo para exportar datos."})
            return

        try:
            excel_bytes = generar_excel_cuiag(DB_PATH)

            rol_actual = self.headers.get('X-FACSA-Role', 'admin')
            registrar_auditoria_admin(rol_actual, 'Exportación Excel con Gráficos', 'Generado reporte avanzado .xlsx con gráficos de análisis')

            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition', f'attachment; filename="cuiag_cis_analisis_graficos_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"')
            self.send_header('Content-Length', str(len(excel_bytes)))
            self.end_headers()
            self.wfile.write(excel_bytes)
        except Exception as e:
            self._responder_json(500, {"error": f"Error al generar reporte Excel: {str(e)}"})

    def manejar_exportar_diccionario(self):
        """Exporta el Diccionario de Variables oficial del instrumento en formato CSV."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido."})
            return

        try:
            output = io.StringIO()
            writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

            encabezados = [
                "nombre_variable", "numero_reactivo", "dimension",
                "enunciado", "es_inverso", "tipo_dato", "escala_opciones",
                "regla_recodificacion", "observaciones"
            ]
            writer.writerow(encabezados)

            # Variables demográficas y generales
            writer.writerow(["id_tecnico", "-", "Identificador", "Identificador técnico aleatorio", "No", "Texto (UUID)", "Único", "Sin recodificación", "Anónimo, sin datos personales"])
            writer.writerow(["fecha_hora", "-", "Registro", "Fecha y hora de envío", "No", "Fecha/Hora ISO-8601", "Variable", "Sin recodificación", "Marca temporal"])
            writer.writerow(["carrera", "-", "Datos Generales", "Licenciatura en la que está inscrito el estudiante", "No", "Texto categórico", "1=Medicina, 2=Psicología, 3=Nutrición", "Sin recodificación", "Último semestre"])
            writer.writerow(["edad", "-", "Datos Generales", "Edad cumplida en años", "No", "Numérico entero", "17 a 99", "Sin recodificación", "Años cumplidos"])
            writer.writerow(["uso_ia_academico", "-", "Datos Generales", "¿Has utilizado herramientas de IA generativa con fines académicos?", "No", "Dicotómica", "1=Sí, 2=No", "Sin recodificación", "Filtro descriptivo"])
            writer.writerow(["frecuencia_general_uso", "-", "Datos Generales", "Frecuencia general con la que utiliza IA generativa", "No", "Ordinal", "1=Nunca, 2=Rara vez, 3=Algunas veces, 4=Frecuentemente, 5=Muy frecuentemente", "Sin recodificación", "Escala de 5 puntos"])
            # Variables de Preguntas Complementarias sobre IA
            writer.writerow(["herramientas_ia", "-", "Preguntas Complementarias IA", "¿Cuáles herramientas de IA generativa utilizas con fines académicos?", "No", "Texto (JSON)", "ChatGPT, Google Gemini, Microsoft Copilot, Claude, Perplexity AI, DeepSeek, Otras, No utilizo", "Sin recodificación", "Respuesta múltiple"])
            writer.writerow(["tipo_version_ia", "-", "Preguntas Complementarias IA", "¿Qué tipo de versión utilizas habitualmente de las herramientas de IA generativa?", "No", "Categórica", "Exclusivamente gratuitas, Principalmente gratuitas, Ambas con frecuencia, Principalmente de pago, Exclusivamente de pago, No estoy seguro(a)", "Sin recodificación", "Selección única"])
            writer.writerow(["paga_suscripcion_ia", "-", "Preguntas Complementarias IA", "¿Pagas personalmente alguna suscripción para utilizar herramientas de IA generativa?", "No", "Categórica", "Sí, No (solo gratuitas), No personalmente (tercero/institución), No estoy seguro(a)", "Sin recodificación", "Selección única"])
            writer.writerow(["versiones_pago_ia", "-", "Preguntas Complementarias IA", "Si utilizas versiones de pago, ¿cuáles?", "No", "Texto (JSON)", "ChatGPT Plus/Pro, Google AI Pro/Ultra, Copilot suscripción, Claude Pro/Max, Perplexity Pro, Otra, No utilizo, No conozco plan", "Sin recodificación", "Respuesta múltiple"])
            writer.writerow(["tiempo_uso_ia", "-", "Preguntas Complementarias IA", "¿Desde hace cuánto tiempo utilizas herramientas de IA generativa para actividades académicas?", "No", "Ordinal", "Menos de un mes, De 1 a 6 meses, De 7 a 12 meses, Más de un año, No las utilizo con fines académicos", "Sin recodificación", "Selección única"])

            # 40 reactivos
            for d in DIMENSIONES_METADATA:
                for num in d["items"]:
                    es_inv = num in ITEMS_INVERSOS
                    enunciado = ENUNCIADOS_ITEMS.get(num, "")
                    regla = "Puntuación recodificada = 6 - respuesta original" if es_inv else "Sin recodificación (1 a 5)"
                    obs = "Reactivo con sentido inverso. Conservar valor original en BD; recodificar solo para puntuación derivada." if es_inv else "Escala Likert regular de 5 puntos."
                    writer.writerow([
                        f"item_{num}",
                        num,
                        f"Dimensión {d['num']}: {d['nombre']}",
                        enunciado,
                        "Sí" if es_inv else "No",
                        "Numérico entero (1 a 5)",
                        "1=Totalmente en desacuerdo, 2=En desacuerdo, 3=Ni de acuerdo ni en desacuerdo, 4=De acuerdo, 5=Totalmente de acuerdo",
                        regla,
                        obs
                    ])

            # Variables derivadas
            for inv in sorted(ITEMS_INVERSOS):
                writer.writerow([
                    f"item_{inv}_recodificado",
                    inv,
                    "Variable Derivada",
                    f"Versión recodificada de ítem {inv} para análisis inferencial",
                    "Sí",
                    "Numérico entero (1 a 5)",
                    "1=Totalmente en desacuerdo (recod. 5) ... 5=Totalmente de acuerdo (recod. 1)",
                    "6 - original",
                    "Puntuación recodificada"
                ])

            csv_content = output.getvalue()
            csv_bytes = b'\xef\xbb\xbf' + csv_content.encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', 'attachment; filename="cuiag_cis_diccionario_variables.csv"')
            self.send_header('Content-Length', str(len(csv_bytes)))
            self.end_headers()
            self.wfile.write(csv_bytes)
        except Exception as e:
            self._responder_json(500, {"error": f"Error al generar diccionario: {str(e)}"})

    def manejar_get_auditoria(self):
        """Consulta el log administrativo de acciones del módulo CUIAG-CIS."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido."})
            return

        try:
            conn = db_adapter.obtener_conexion()
            cursor = conn.cursor()
            cursor.execute(db_adapter.adaptar_sql("SELECT * FROM cuiag_auditoria_admin ORDER BY timestamp DESC LIMIT 100"))
            if hasattr(cursor, 'description') and cursor.description:
                nombres = [desc[0] for desc in cursor.description]
                filas = [dict(zip(nombres, f)) for f in cursor.fetchall()]
            else:
                filas = [dict(f) for f in cursor.fetchall()]
            conn.close()

            self._responder_json(200, {"ok": True, "registros": filas})
        except Exception as e:
            self._responder_json(500, {"error": str(e)})

    def manejar_post_config(self):
        """Actualiza la configuración administrativa (activar/pausar, aprobaciones institucionales)."""
        if not self._es_autorizado_admin():
            self._responder_json(403, {"error": "Acceso restringido. Solo administradores autorizados."})
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            datos = json.loads(body_bytes.decode('utf-8'))

            conn = db_adapter.obtener_conexion()
            cursor = conn.cursor()

            if 'recepcion_activa' in datos:
                val = "1" if datos['recepcion_activa'] else "0"
                cursor.execute(db_adapter.adaptar_sql("INSERT OR REPLACE INTO cuiag_config (clave, valor) VALUES ('recepcion_activa', ?)"), (val,))

            if 'confirmacion_aprobacion_institucional' in datos:
                val = "1" if datos['confirmacion_aprobacion_institucional'] else "0"
                cursor.execute(db_adapter.adaptar_sql("INSERT OR REPLACE INTO cuiag_config (clave, valor) VALUES ('confirmacion_aprobacion_institucional', ?)"), (val,))

            if 'mensaje_inactivo' in datos:
                cursor.execute(db_adapter.adaptar_sql("INSERT OR REPLACE INTO cuiag_config (clave, valor) VALUES ('mensaje_inactivo', ?)"), (str(datos['mensaje_inactivo'])[:300],))

            conn.commit()
            conn.close()

            rol_actual = self.headers.get('X-FACSA-Role', 'admin')
            registrar_auditoria_admin(rol_actual, 'Configuración Actualizada', f"Cambio de estado: activa={datos.get('recepcion_activa')}, aprobacion={datos.get('confirmacion_aprobacion_institucional')}")

            self._responder_json(200, {"ok": True, "mensaje": "Configuración del módulo actualizada correctamente."})
        except Exception as e:
            self._responder_json(500, {"error": f"Error al guardar configuración: {str(e)}"})

def iniciar_servidor():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    inicializar_bd()
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, FACSAHTTPHandler)
    ip_actual = obtener_ip_red()
    print("=" * 68)
    print("  🏛️  FACULTAD DE CIENCIAS DE LA SALUD (FACSA - UJED)")
    print("  🔬  Cuestionario CUIAG-CIS • Servidor Activo")
    print("=" * 68)
    print("  📲  ENLACE PARA TUS ALUMNOS (Misma red Wi-Fi / Aula):")
    print(f"      👉 http://{ip_actual}:{PORT}/")
    print("      (Copia y comparte este enlace con tus estudiantes)")
    print("  --------------------------------------------------------------")
    print(f"  💻  Tu acceso local en esta PC:  http://localhost:{PORT}/")
    print(f"  🔐  Panel de Investigador (Admin): http://localhost:{PORT}/admin")
    print(f"  💾  Motor de Base de Datos:       {db_adapter.obtener_tipo_bd()}")
    print("=" * 68)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        httpd.server_close()

if __name__ == '__main__':
    iniciar_servidor()
