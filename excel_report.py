# -*- coding: utf-8 -*-
"""
Generador de Reportes Excel con Análisis Estadístico y Gráficos
Módulo CUIAG-CIS • Facultad de Ciencias de la Salud (FACSA - UJED)
Utiliza openpyxl para crear libros de cálculo profesionales (.xlsx)
con tablas formateadas, fórmulas, estadísticas y gráficos integrados.
"""

import sqlite3
import io
import json
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, PieChart, Reference
from openpyxl.utils import get_column_letter

VERSION_INSTRUMENTO = "1.0-preliminar-expertos"
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

def generar_excel_cuiag(db_path=None):
    """Genera un archivo Excel (.xlsx) estructurado con tres hojas, formato institucional y gráficos integrados."""
    filas = []
    try:
        import db_adapter
        filas = db_adapter.obtener_todas_las_respuestas()
    except Exception as e:
        if db_path and os.path.exists(db_path):
            conn = sqlite3.connect(db_path, timeout=30.0)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cuiag_respuestas ORDER BY timestamp DESC")
            filas = cursor.fetchall()
            conn.close()

    wb = openpyxl.Workbook()

    # -------------------------------------------------------------
    # Estilos compartidos de formato institucional
    # -------------------------------------------------------------
    font_banner_title = Font(name='Arial', size=14, bold=True, color='FFFFFF')
    font_banner_sub = Font(name='Arial', size=10, italic=True, color='FDE68A')
    font_sec_title = Font(name='Arial', size=12, bold=True, color='0B2A5B')
    font_header = Font(name='Arial', size=10, bold=True, color='FFFFFF')
    font_data = Font(name='Arial', size=9, color='000000')
    font_bold = Font(name='Arial', size=9, bold=True, color='000000')

    fill_banner = PatternFill(start_color='7F1D1D', end_color='7F1D1D', fill_type='solid') # Carmesí
    fill_header_crimson = PatternFill(start_color='7F1D1D', end_color='7F1D1D', fill_type='solid')
    fill_header_navy = PatternFill(start_color='0B2A5B', end_color='0B2A5B', fill_type='solid') # Azul
    fill_header_gold = PatternFill(start_color='C9A227', end_color='C9A227', fill_type='solid') # Oro
    fill_zebra = PatternFill(start_color='F8FAFC', end_color='F8FAFC', fill_type='solid')
    fill_highlight = PatternFill(start_color='FEF3C7', end_color='FEF3C7', fill_type='solid')

    border_thin = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    align_center = Alignment(horizontal='center', vertical='center', wrap_text=True)
    align_left = Alignment(horizontal='left', vertical='center', wrap_text=True)
    align_right = Alignment(horizontal='right', vertical='center')

    # =============================================================
    # HOJA 1: RESPUESTAS INDIVIDUALES & PUNTUACIONES
    # =============================================================
    ws_data = wb.active
    ws_data.title = "Respuestas y Puntuaciones"
    ws_data.sheet_properties.tabColor = "0B2A5B"
    ws_data.views.sheetView[0].showGridLines = True

    # Banner superior
    ws_data.merge_cells("A1:BH1")
    ws_data["A1"] = "FACULTAD DE CIENCIAS DE LA SALUD (FACSA - UJED) • DURANGO"
    ws_data["A1"].font = font_banner_title
    ws_data["A1"].fill = fill_banner
    ws_data["A1"].alignment = align_center
    ws_data.row_dimensions[1].height = 28

    ws_data.merge_cells("A2:BH2")
    ws_data["A2"] = f"Cuestionario CUIAG-CIS (v{VERSION_INSTRUMENTO}) • Matriz de Respuestas Capturadas • Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} • Total Registros: {len(filas)}"
    ws_data["A2"].font = font_banner_sub
    ws_data["A2"].fill = fill_banner
    ws_data["A2"].alignment = align_center
    ws_data.row_dimensions[2].height = 20

    # Encabezados de columnas (Fila 4)
    encabezados = [
        "Folio Técnico", "Fecha y Hora", "Carrera", "Edad",
        "Uso IA Académico", "Frecuencia General",
        "Herramientas IA", "Tipo Versión IA", "Paga Suscripción", "Versiones Pago", "Tiempo Uso IA",
        "Versión", "Estado"
    ]
    # 40 reactivos originales
    encabezados.extend([f"Ítem {i}" for i in range(1, 41)])
    # 4 reactivos inversos recodificados
    encabezados.extend([f"Ítem {i} (Recodificado: 6-x)" for i in sorted(ITEMS_INVERSOS)])
    # Puntuaciones por dimensión
    encabezados.extend([
        "Dim 1: Uso Académico IA (Suma)",
        "Dim 2: Alfabetización IA (Suma)",
        "Dim 3: Pensamiento Crítico (Suma)",
        "Dim 4: Uso Ético (Suma)",
        "Dim 5: Autoeficacia Investigativa (Suma)",
        "Dim 6: Competencias Investigativas (Suma)",
        "Puntuación Total CUIAG-CIS (Suma)"
    ])

    ws_data.row_dimensions[4].height = 36
    for col_idx, col_name in enumerate(encabezados, start=1):
        cell = ws_data.cell(row=4, column=col_idx, value=col_name)
        cell.font = font_header
        cell.alignment = align_center
        cell.border = border_thin
        if col_idx <= 13:
            cell.fill = fill_header_navy
        elif col_idx <= 53:
            cell.fill = fill_header_crimson
        elif col_idx <= 57:
            cell.fill = fill_header_gold
        else:
            cell.fill = fill_header_navy

    # Llenado de filas de datos
    for r_idx, f in enumerate(filas, start=5):
        ws_data.row_dimensions[r_idx].height = 20
        is_zebra = (r_idx % 2 == 0)

        f_keys = f.keys()
        tipo_ver = f["tipo_version_ia"] if "tipo_version_ia" in f_keys else ""
        paga_susc = f["paga_suscripcion_ia"] if "paga_suscripcion_ia" in f_keys else ""
        ver_pago = f["versiones_pago_ia"] if "versiones_pago_ia" in f_keys else "[]"
        tiempo_u = f["tiempo_uso_ia"] if "tiempo_uso_ia" in f_keys else ""

        fila_valores = [
            f["id"], f["timestamp"], f["carrera"], f["edad"],
            f["uso_ia_academico"], f["frecuencia_uso"],
            f["herramientas_ia"], tipo_ver, paga_susc, ver_pago, tiempo_u,
            f["version_instrumento"], f["estado"]
        ]

        respuestas_items = {}
        for i in range(1, 41):
            val = f[f"item_{i}"]
            respuestas_items[i] = val
            fila_valores.append(val)

        # Reactivos inversos recodificados
        for inv in sorted(ITEMS_INVERSOS):
            val_orig = respuestas_items[inv]
            val_rec = 6 - val_orig
            fila_valores.append(val_rec)

        # Sumas por dimensión
        total_instrumento = 0
        for d in DIMENSIONES_METADATA:
            suma_dim = 0
            for item_idx in d["items"]:
                if item_idx in ITEMS_INVERSOS:
                    suma_dim += (6 - respuestas_items[item_idx])
                else:
                    suma_dim += respuestas_items[item_idx]
            fila_valores.append(suma_dim)
            total_instrumento += suma_dim

        fila_valores.append(total_instrumento)

        for c_idx, val in enumerate(fila_valores, start=1):
            c = ws_data.cell(row=r_idx, column=c_idx, value=val)
            c.font = font_data
            c.border = border_thin
            if is_zebra:
                c.fill = fill_zebra
            if c_idx in [3, 4, 5, 6, 8, 9, 11, 12, 13]:
                c.alignment = align_center
            elif c_idx >= 14:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Auto-ajuste de anchos de columnas
    for col in ws_data.columns:
        col_letter = get_column_letter(col[0].column)
        if col[0].column in [1, 2, 7, 10]:
            ws_data.column_dimensions[col_letter].width = 24
        elif col[0].column in [8, 9, 11]:
            ws_data.column_dimensions[col_letter].width = 20
        elif col[0].column <= 13:
            ws_data.column_dimensions[col_letter].width = 16
        elif col[0].column <= 53:
            ws_data.column_dimensions[col_letter].width = 9
        else:
            ws_data.column_dimensions[col_letter].width = 18

    # =============================================================
    # HOJA 2: RESUMEN ANALÍTICO Y GRÁFICOS
    # =============================================================
    ws_summary = wb.create_sheet(title="Analisis y Graficos")
    ws_summary.sheet_properties.tabColor = "7F1D1D"
    ws_summary.views.sheetView[0].showGridLines = True

    # Banner superior
    ws_summary.merge_cells("A1:K1")
    ws_summary["A1"] = "FACSA - UJED • REPORTE ESTADÍSTICO DESCRIPTIVO Y GRÁFICOS"
    ws_summary["A1"].font = font_banner_title
    ws_summary["A1"].fill = fill_banner
    ws_summary["A1"].alignment = align_center
    ws_summary.row_dimensions[1].height = 28

    ws_summary.merge_cells("A2:K2")
    ws_summary["A2"] = f"Análisis de Participación, Frecuencias y Dimensiones Psicométricas (CUIAG-CIS) • N = {len(filas)} estudiantes"
    ws_summary["A2"].font = font_banner_sub
    ws_summary["A2"].fill = fill_banner
    ws_summary["A2"].alignment = align_center
    ws_summary.row_dimensions[2].height = 20

    # -------------------------------------------------------------
    # SECCIÓN 1: DISTRIBUCIÓN POR LICENCIATURA
    # -------------------------------------------------------------
    ws_summary.cell(row=4, column=1, value="1. DISTRIBUCIÓN POR LICENCIATURA").font = font_sec_title
    ws_summary.cell(row=5, column=1, value="Carrera").font = font_header
    ws_summary.cell(row=5, column=1).fill = fill_header_navy
    ws_summary.cell(row=5, column=1).border = border_thin
    ws_summary.cell(row=5, column=2, value="Frecuencia").font = font_header
    ws_summary.cell(row=5, column=2).fill = fill_header_navy
    ws_summary.cell(row=5, column=2).border = border_thin
    ws_summary.cell(row=5, column=3, value="Porcentaje (%)").font = font_header
    ws_summary.cell(row=5, column=3).fill = fill_header_navy
    ws_summary.cell(row=5, column=3).border = border_thin

    carreras_lista = ["Medicina", "Psicología", "Nutrición"]
    conteo_carreras = {c: sum(1 for f in filas if f["carrera"] == c) for c in carreras_lista}
    total_resp = len(filas) if len(filas) > 0 else 1

    for idx, c_nom in enumerate(carreras_lista, start=6):
        cnt = conteo_carreras[c_nom]
        pct = round((cnt / total_resp) * 100, 1) if len(filas) > 0 else 0
        ws_summary.cell(row=idx, column=1, value=c_nom).font = font_bold
        ws_summary.cell(row=idx, column=1).border = border_thin
        ws_summary.cell(row=idx, column=2, value=cnt).alignment = align_center
        ws_summary.cell(row=idx, column=2).border = border_thin
        ws_summary.cell(row=idx, column=3, value=pct).alignment = align_center
        ws_summary.cell(row=idx, column=3).border = border_thin

    # Gráfico de Pastel (PieChart)
    pie_carrera = PieChart()
    pie_carrera.title = "Distribución de Participación por Licenciatura"
    labels_car = Reference(ws_summary, min_col=1, min_row=6, max_row=8)
    data_car = Reference(ws_summary, min_col=2, min_row=5, max_row=8)
    pie_carrera.add_data(data_car, titles_from_data=True)
    pie_carrera.set_categories(labels_car)
    pie_carrera.width = 14
    pie_carrera.height = 8.5
    ws_summary.add_chart(pie_carrera, "E4")

    # -------------------------------------------------------------
    # SECCIÓN 2: FRECUENCIA GENERAL DE USO DE IA
    # -------------------------------------------------------------
    ws_summary.cell(row=10, column=1, value="2. FRECUENCIA GENERAL DE USO DE IA").font = font_sec_title
    ws_summary.cell(row=11, column=1, value="Frecuencia").font = font_header
    ws_summary.cell(row=11, column=1).fill = fill_header_crimson
    ws_summary.cell(row=11, column=1).border = border_thin
    ws_summary.cell(row=11, column=2, value="Frecuencia").font = font_header
    ws_summary.cell(row=11, column=2).fill = fill_header_crimson
    ws_summary.cell(row=11, column=2).border = border_thin
    ws_summary.cell(row=11, column=3, value="Porcentaje (%)").font = font_header
    ws_summary.cell(row=11, column=3).fill = fill_header_crimson
    ws_summary.cell(row=11, column=3).border = border_thin

    frecuencias_opc = ["Nunca", "Rara vez", "Algunas veces", "Frecuentemente", "Muy frecuentemente"]
    conteo_frec = {f: sum(1 for fila in filas if fila["frecuencia_uso"] == f) for f in frecuencias_opc}

    for idx, f_nom in enumerate(frecuencias_opc, start=12):
        cnt = conteo_frec[f_nom]
        pct = round((cnt / total_resp) * 100, 1) if len(filas) > 0 else 0
        ws_summary.cell(row=idx, column=1, value=f_nom).font = font_data
        ws_summary.cell(row=idx, column=1).border = border_thin
        ws_summary.cell(row=idx, column=2, value=cnt).alignment = align_center
        ws_summary.cell(row=idx, column=2).border = border_thin
        ws_summary.cell(row=idx, column=3, value=pct).alignment = align_center
        ws_summary.cell(row=idx, column=3).border = border_thin

    # Gráfico de Barras para Frecuencia
    bar_frec = BarChart()
    bar_frec.type = "col"
    bar_frec.title = "Frecuencia de Uso de IA Generativa en Estudiantes"
    bar_frec.y_axis.title = "Estudiantes"
    bar_frec.x_axis.title = "Frecuencia"
    labels_fr = Reference(ws_summary, min_col=1, min_row=12, max_row=16)
    data_fr = Reference(ws_summary, min_col=2, min_row=11, max_row=16)
    bar_frec.add_data(data_fr, titles_from_data=True)
    bar_frec.set_categories(labels_fr)
    bar_frec.legend = None
    bar_frec.width = 14
    bar_frec.height = 8.5
    ws_summary.add_chart(bar_frec, "E13")

    # -------------------------------------------------------------
    # SECCIÓN 3: PUNTUACIONES MEDIAS POR DIMENSIÓN
    # -------------------------------------------------------------
    start_row_dim = 18
    ws_summary.cell(row=start_row_dim, column=1, value="3. ANÁLISIS POR DIMENSIONES INVESTIGATIVAS").font = font_sec_title
    headers_dim = ["Dimensión", "Ítems", "Media Obtenida", "Máximo Posible", "% Rendimiento"]
    for c_i, h_nom in enumerate(headers_dim, start=1):
        c = ws_summary.cell(row=start_row_dim+1, column=c_i, value=h_nom)
        c.font = font_header
        c.fill = fill_header_gold
        c.border = border_thin
        c.alignment = align_center

    medias_dimensiones = []
    for d_idx, d in enumerate(DIMENSIONES_METADATA, start=start_row_dim+2):
        items_d = d["items"]
        max_posible = len(items_d) * 5

        # Calcular media sumada en las filas
        if len(filas) > 0:
            sumas = []
            for f in filas:
                s = sum((6 - f[f"item_{it}"]) if it in ITEMS_INVERSOS else f[f"item_{it}"] for it in items_d)
                sumas.append(s)
            media_d = round(sum(sumas) / len(sumas), 2)
        else:
            media_d = 0.0

        pct_rend = round((media_d / max_posible) * 100, 1) if max_posible > 0 else 0
        medias_dimensiones.append((d["nombre"], media_d))

        ws_summary.cell(row=d_idx, column=1, value=f"Dim {d['num']}: {d['nombre'][:28]}...").font = font_bold
        ws_summary.cell(row=d_idx, column=1).border = border_thin
        ws_summary.cell(row=d_idx, column=2, value=len(items_d)).alignment = align_center
        ws_summary.cell(row=d_idx, column=2).border = border_thin
        ws_summary.cell(row=d_idx, column=3, value=media_d).alignment = align_center
        ws_summary.cell(row=d_idx, column=3).border = border_thin
        ws_summary.cell(row=d_idx, column=4, value=max_posible).alignment = align_center
        ws_summary.cell(row=d_idx, column=4).border = border_thin
        ws_summary.cell(row=d_idx, column=5, value=pct_rend).alignment = align_center
        ws_summary.cell(row=d_idx, column=5).border = border_thin

    # Gráfico de Barras para Dimensiones
    bar_dim = BarChart()
    bar_dim.type = "bar" # horizontal
    bar_dim.title = "Puntuación Media Obtenida por Dimensión (CUIAG-CIS)"
    bar_dim.x_axis.title = "Media Obtenida"
    bar_dim.y_axis.title = "Dimensión"
    labels_dm = Reference(ws_summary, min_col=1, min_row=start_row_dim+2, max_row=start_row_dim+7)
    data_dm = Reference(ws_summary, min_col=3, min_row=start_row_dim+1, max_row=start_row_dim+7)
    bar_dim.add_data(data_dm, titles_from_data=True)
    bar_dim.set_categories(labels_dm)
    bar_dim.legend = None
    bar_dim.width = 16
    bar_dim.height = 9.5
    ws_summary.add_chart(bar_dim, "E22")

    # -------------------------------------------------------------
    # SECCIÓN 4: ANÁLISIS DETALLADO REACTIVO POR REACTIVO (1 AL 40)
    # -------------------------------------------------------------
    start_row_items = 26
    ws_summary.cell(row=start_row_items, column=1, value="4. DESGLOSE ESTADÍSTICO REACTIVO POR REACTIVO (1 AL 40)").font = font_sec_title
    headers_items = [
        "Ítem", "Dimensión", "Enunciado Oficial", "Sentido",
        "1: Totalmente en Desacuerdo (%)", "2: En Desacuerdo (%)",
        "3: Ni Acuerdo ni Desacuerdo (%)", "4: De Acuerdo (%)",
        "5: Totalmente de Acuerdo (%)", "Media Original", "Media Recodificada"
    ]
    for c_i, h_nom in enumerate(headers_items, start=1):
        c = ws_summary.cell(row=start_row_items+1, column=c_i, value=h_nom)
        c.font = font_header
        c.fill = fill_header_navy
        c.border = border_thin
        c.alignment = align_center

    for it_num in range(1, 41):
        cur_row = start_row_items + 1 + it_num
        es_inv = it_num in ITEMS_INVERSOS
        enunciado = ENUNCIADOS_ITEMS.get(it_num, "")

        # Dimensión a la que pertenece
        dim_pert = next(f"Dim {d['num']}: {d['nombre'][:18]}" for d in DIMENSIONES_METADATA if it_num in d["items"])

        # Conteos y porcentajes
        conteos = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        vals = []
        for f in filas:
            v = f[f"item_{it_num}"]
            conteos[v] = conteos.get(v, 0) + 1
            vals.append(v)

        media_orig = round(sum(vals) / len(vals), 2) if len(vals) > 0 else 0.0
        media_recod = round(sum((6 - v) if es_inv else v for v in vals) / len(vals), 2) if len(vals) > 0 else media_orig

        pcts = {k: round((v / total_resp) * 100, 1) if len(filas) > 0 else 0 for k, v in conteos.items()}

        ws_summary.cell(row=cur_row, column=1, value=it_num).alignment = align_center
        ws_summary.cell(row=cur_row, column=1).font = font_bold
        ws_summary.cell(row=cur_row, column=1).border = border_thin

        ws_summary.cell(row=cur_row, column=2, value=dim_pert).alignment = align_left
        ws_summary.cell(row=cur_row, column=2).font = font_data
        ws_summary.cell(row=cur_row, column=2).border = border_thin

        ws_summary.cell(row=cur_row, column=3, value=enunciado).alignment = align_left
        ws_summary.cell(row=cur_row, column=3).font = font_data
        ws_summary.cell(row=cur_row, column=3).border = border_thin

        sentido_txt = "Inverso (6-x)" if es_inv else "Directo"
        cell_sent = ws_summary.cell(row=cur_row, column=4, value=sentido_txt)
        cell_sent.alignment = align_center
        cell_sent.border = border_thin
        if es_inv:
            cell_sent.fill = fill_highlight

        for p_idx, p_val in enumerate([pcts[1], pcts[2], pcts[3], pcts[4], pcts[5]], start=5):
            c_p = ws_summary.cell(row=cur_row, column=p_idx, value=f"{p_val}%")
            c_p.alignment = align_center
            c_p.font = font_data
            c_p.border = border_thin

        c_mo = ws_summary.cell(row=cur_row, column=10, value=media_orig)
        c_mo.alignment = align_center
        c_mo.font = font_bold
        c_mo.border = border_thin

        c_mr = ws_summary.cell(row=cur_row, column=11, value=media_recod)
        c_mr.alignment = align_center
        c_mr.font = font_bold
        c_mr.border = border_thin
        if es_inv:
            c_mr.fill = fill_highlight

    ws_summary.column_dimensions["A"].width = 16
    ws_summary.column_dimensions["B"].width = 20
    ws_summary.column_dimensions["C"].width = 46
    ws_summary.column_dimensions["D"].width = 15
    for l in ["E", "F", "G", "H", "I", "J", "K"]:
        ws_summary.column_dimensions[l].width = 15

    # =============================================================
    # HOJA 3: DICCIONARIO DE VARIABLES
    # =============================================================
    ws_dict = wb.create_sheet(title="Diccionario de Variables")
    ws_dict.sheet_properties.tabColor = "C9A227"
    ws_dict.views.sheetView[0].showGridLines = True

    ws_dict.merge_cells("A1:G1")
    ws_dict["A1"] = "DICCIONARIO DE VARIABLES PSICOMÉTRICAS • INSTRUMENTO CUIAG-CIS"
    ws_dict["A1"].font = font_banner_title
    ws_dict["A1"].fill = fill_banner
    ws_dict["A1"].alignment = align_center
    ws_dict.row_dimensions[1].height = 28

    headers_dic = ["Nombre Variable", "N° Ítem", "Dimensión", "Enunciado / Descripción", "Sentido Inverso", "Tipo de Dato", "Regla de Recodificación"]
    ws_dict.row_dimensions[3].height = 25
    for c_i, h_nom in enumerate(headers_dic, start=1):
        c = ws_dict.cell(row=3, column=c_i, value=h_nom)
        c.font = font_header
        c.fill = fill_header_gold
        c.border = border_thin
        c.alignment = align_center

    row_d_idx = 4
    # Generales y Complementarias IA
    generales = [
        ("id", "-", "Identificador", "Folio técnico aleatorio anónimo", "No", "Texto (UUID)", "Sin recodificación"),
        ("timestamp", "-", "Registro", "Marca temporal ISO-8601", "No", "Fecha/Hora", "Sin recodificación"),
        ("carrera", "-", "Datos Generales", "Licenciatura cursada (Medicina, Psicología, Nutrición)", "No", "Categórica", "Sin recodificación"),
        ("edad", "-", "Datos Generales", "Años cumplidos", "No", "Entero (17-99)", "Sin recodificación"),
        ("uso_ia_academico", "-", "Datos Generales", "¿Has utilizado herramientas de IA con fines académicos?", "No", "Dicotómica (Sí/No)", "Sin recodificación"),
        ("frecuencia_uso", "-", "Datos Generales", "Frecuencia general de uso de herramientas de IA", "No", "Ordinal 5 puntos", "Sin recodificación"),
        ("herramientas_ia", "-", "Preguntas Complementarias IA", "¿Cuáles herramientas de IA generativa utilizas con fines académicos?", "No", "JSON Array", "Sin recodificación"),
        ("tipo_version_ia", "-", "Preguntas Complementarias IA", "¿Qué tipo de versión utilizas habitualmente?", "No", "Categórica", "Sin recodificación"),
        ("paga_suscripcion_ia", "-", "Preguntas Complementarias IA", "¿Pagas personalmente alguna suscripción para utilizar herramientas de IA?", "No", "Categórica", "Sin recodificación"),
        ("versiones_pago_ia", "-", "Preguntas Complementarias IA", "Si utilizas versiones de pago, ¿cuáles?", "No", "JSON Array", "Sin recodificación"),
        ("tiempo_uso_ia", "-", "Preguntas Complementarias IA", "¿Desde hace cuánto tiempo utilizas herramientas de IA?", "No", "Ordinal", "Sin recodificación")
    ]
    for gen in generales:
        ws_dict.row_dimensions[row_d_idx].height = 18
        for col_i, val in enumerate(gen, start=1):
            c = ws_dict.cell(row=row_d_idx, column=col_i, value=val)
            c.font = font_data
            c.border = border_thin
            c.alignment = align_center if col_i in [2, 5, 6] else align_left
        row_d_idx += 1

    # 40 reactivos
    for d in DIMENSIONES_METADATA:
        for it_num in d["items"]:
            es_inv = it_num in ITEMS_INVERSOS
            enunciado = ENUNCIADOS_ITEMS.get(it_num, "")
            regla = "Puntuación recodificada = 6 - respuesta original" if es_inv else "Sin recodificación (1 a 5)"
            fila_d = (
                f"item_{it_num}",
                it_num,
                f"Dimensión {d['num']}: {d['nombre']}",
                enunciado,
                "Sí" if es_inv else "No",
                "Entero (1 a 5)",
                regla
            )
            ws_dict.row_dimensions[row_d_idx].height = 18
            for col_i, val in enumerate(fila_d, start=1):
                c = ws_dict.cell(row=row_d_idx, column=col_i, value=val)
                c.font = font_data
                c.border = border_thin
                c.alignment = align_center if col_i in [2, 5, 6] else align_left
                if es_inv and col_i == 5:
                    c.fill = fill_highlight
            row_d_idx += 1

    # Anchos de columna
    ws_dict.column_dimensions["A"].width = 16
    ws_dict.column_dimensions["B"].width = 10
    ws_dict.column_dimensions["C"].width = 30
    ws_dict.column_dimensions["D"].width = 50
    ws_dict.column_dimensions["E"].width = 15
    ws_dict.column_dimensions["F"].width = 16
    ws_dict.column_dimensions["G"].width = 38

    # Guardar en memoria
    output_io = io.BytesIO()
    wb.save(output_io)
    return output_io.getvalue()
