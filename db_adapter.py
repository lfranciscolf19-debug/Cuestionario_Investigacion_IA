#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adaptador de Base de Datos Híbrido: SQLite Local y PostgreSQL / Supabase en la Nube
Facultad de Ciencias de la Salud (FACSA - UJED) • Protocolo CUIAG-CIS

Permite persistencia permanente en la nube (Render + Supabase / PostgreSQL)
y compatibilidad local offline con SQLite sin requerir configuración adicional.
"""

import os
import sys
import sqlite3
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, 'cuiag_investigacion.db')

DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

_DRIVER_POSTGRES = None
if DATABASE_URL:
    try:
        import psycopg2
        import psycopg2.extras
        _DRIVER_POSTGRES = 'psycopg2'
    except ImportError:
        try:
            import pg8000.dbapi
            _DRIVER_POSTGRES = 'pg8000'
        except ImportError:
            _DRIVER_POSTGRES = None


def es_postgres():
    """Retorna True si hay DATABASE_URL configurada y driver disponible."""
    return bool(DATABASE_URL and _DRIVER_POSTGRES)


def obtener_tipo_bd():
    """Nombre amigable del motor de base de datos activo."""
    if es_postgres():
        return f"PostgreSQL ({_DRIVER_POSTGRES}) [Persistencia Nube Activa]"
    return "SQLite Local [Archivo: data/cuiag_investigacion.db]"


def obtener_conexion():
    """
    Retorna una conexión a la base de datos adecuada.
    Si está en Postgres y conecta exitosamente, retorna conexión psycopg2/pg8000.
    Si falla o no hay DATABASE_URL, retorna conexión sqlite3 de respaldo seguro.
    """
    if es_postgres():
        try:
            if _DRIVER_POSTGRES == 'psycopg2':
                import psycopg2
                import psycopg2.extras
                conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.DictCursor)
                conn.autocommit = False
                return conn
            elif _DRIVER_POSTGRES == 'pg8000':
                import pg8000.dbapi
                import urllib.parse
                url = urllib.parse.urlparse(DATABASE_URL)
                conn = pg8000.dbapi.connect(
                    user=url.username or 'postgres',
                    password=url.password or '',
                    host=url.hostname or 'localhost',
                    port=url.port or 5432,
                    database=url.path.lstrip('/') or 'postgres'
                )
                conn.autocommit = False
                return conn
        except Exception as e:
            print(f"[DB ADAPTER WARNING] No se pudo conectar a PostgreSQL ({e}). Usando SQLite local de respaldo temporal.", file=sys.stderr)

    # SQLite Local de respaldo
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def adaptar_sql(sql, conn=None):
    """
    Adapta la sintaxis SQL entre SQLite y PostgreSQL:
    - Si la conexión activa es SQLite: no modifica '?' ni clausulas SQLite.
    - Si es PostgreSQL: '?' -> '%s', ON CONFLICT, etc.
    """
    es_sqlite = False
    if conn is not None:
        es_sqlite = isinstance(conn, sqlite3.Connection)
    else:
        es_sqlite = not es_postgres()

    if es_sqlite:
        return sql

    adaptada = sql.replace('?', '%s')

    if 'INSERT OR IGNORE INTO cuiag_config' in adaptada:
        adaptada = adaptada.replace(
            'INSERT OR IGNORE INTO cuiag_config',
            'INSERT INTO cuiag_config'
        )
        if 'ON CONFLICT' not in adaptada:
            adaptada += ' ON CONFLICT (clave) DO NOTHING'

    if 'INSERT OR REPLACE INTO cuiag_config' in adaptada:
        adaptada = adaptada.replace(
            'INSERT OR REPLACE INTO cuiag_config',
            'INSERT INTO cuiag_config'
        )
        if 'ON CONFLICT' not in adaptada:
            adaptada += ' ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor'

    return adaptada


def inicializar_bd():
    """Crea las tablas en PostgreSQL o SQLite si no existen de forma segura."""
    columnas_items = ", ".join([f"item_{i} INTEGER NOT NULL" for i in range(1, 41)])

    conn = obtener_conexion()
    cursor = conn.cursor()
    es_sqlite = isinstance(conn, sqlite3.Connection)

    try:
        # Tabla de respuestas CUIAG-CIS
        cursor.execute(adaptar_sql(f"""
        CREATE TABLE IF NOT EXISTS cuiag_respuestas (
            id VARCHAR(64) PRIMARY KEY,
            timestamp VARCHAR(64) NOT NULL,
            carrera VARCHAR(128) NOT NULL,
            edad INTEGER NOT NULL,
            uso_ia_academico VARCHAR(64) NOT NULL,
            herramientas_ia TEXT NOT NULL,
            frecuencia_uso VARCHAR(64) NOT NULL,
            tipo_version_ia TEXT DEFAULT '',
            paga_suscripcion_ia TEXT DEFAULT '',
            versiones_pago_ia TEXT DEFAULT '[]',
            tiempo_uso_ia TEXT DEFAULT '',
            {columnas_items},
            version_instrumento VARCHAR(64) NOT NULL,
            estado VARCHAR(32) NOT NULL DEFAULT 'completado',
            token_envio VARCHAR(128) UNIQUE NOT NULL
        )
        """, conn=conn))

        # Columnas complementarias (migración automática)
        if es_sqlite:
            cursor.execute("PRAGMA table_info(cuiag_respuestas)")
            columnas_existentes = {row[1] for row in cursor.fetchall()}
            cols_comp = [
                ("tipo_version_ia", "TEXT DEFAULT ''"),
                ("paga_suscripcion_ia", "TEXT DEFAULT ''"),
                ("versiones_pago_ia", "TEXT DEFAULT '[]'"),
                ("tiempo_uso_ia", "TEXT DEFAULT ''")
            ]
            for col_nom, col_def in cols_comp:
                if col_nom not in columnas_existentes:
                    cursor.execute(f"ALTER TABLE cuiag_respuestas ADD COLUMN {col_nom} {col_def}")
        else:
            # En PostgreSQL verificamos information_schema
            cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'cuiag_respuestas'
            """)
            columnas_existentes = {row[0].lower() for row in cursor.fetchall()}
            cols_comp = [
                ("tipo_version_ia", "TEXT DEFAULT ''"),
                ("paga_suscripcion_ia", "TEXT DEFAULT ''"),
                ("versiones_pago_ia", "TEXT DEFAULT '[]'"),
                ("tiempo_uso_ia", "TEXT DEFAULT ''")
            ]
            for col_nom, col_def in cols_comp:
                if col_nom.lower() not in columnas_existentes:
                    cursor.execute(f"ALTER TABLE cuiag_respuestas ADD COLUMN {col_nom} {col_def}")

        # Tabla de configuración
        cursor.execute(adaptar_sql("""
        CREATE TABLE IF NOT EXISTS cuiag_config (
            clave VARCHAR(64) PRIMARY KEY,
            valor TEXT NOT NULL
        )
        """, conn=conn))

        # Valores iniciales de configuración
        config_defaults = {
            "recepcion_activa": "1",
            "confirmacion_aprobacion_institucional": "1",
            "mensaje_inactivo": "La recepción de respuestas se encuentra actualmente pausada por el comité de investigación."
        }
        for k, v in config_defaults.items():
            if not es_sqlite:
                cursor.execute("""
                INSERT INTO cuiag_config (clave, valor) VALUES (%s, %s)
                ON CONFLICT (clave) DO NOTHING
                """, (k, v))
            else:
                cursor.execute("INSERT OR IGNORE INTO cuiag_config (clave, valor) VALUES (?, ?)", (k, v))

        # Tabla de auditoría
        cursor.execute(adaptar_sql("""
        CREATE TABLE IF NOT EXISTS cuiag_auditoria_admin (
            id VARCHAR(64) PRIMARY KEY,
            timestamp VARCHAR(64) NOT NULL,
            usuario VARCHAR(64) NOT NULL,
            accion VARCHAR(128) NOT NULL,
            detalle TEXT NOT NULL
        )
        """, conn=conn))

        conn.commit()
        tipo_msg = "SQLite Local (respaldo)" if es_sqlite else f"PostgreSQL ({_DRIVER_POSTGRES})"
        print(f"[DB ADAPTER] Base de datos inicializada correctamente en: {tipo_msg}")
    except Exception as e:
        conn.rollback()
        print(f"[DB ADAPTER ERROR] Error al inicializar base de datos: {e}", file=sys.stderr)
        raise e
    finally:
        conn.close()


def ejecutar_consulta(sql, params=None, fetch='none'):
    """
    Ejecuta una consulta SQL adaptada de forma segura.
    fetch: 'none', 'one', 'all'
    Retorna resultados como diccionarios legibles.
    """
    conn = obtener_conexion()
    cursor = conn.cursor()
    sql_adaptada = adaptar_sql(sql, conn=conn)

    try:
        if params:
            cursor.execute(sql_adaptada, params)
        else:
            cursor.execute(sql_adaptada)

        resultado = None
        if fetch == 'one':
            fila = cursor.fetchone()
            if fila is not None and hasattr(cursor, 'description') and cursor.description:
                nombres = [desc[0] for desc in cursor.description]
                resultado = dict(zip(nombres, fila))
            else:
                resultado = fila
        elif fetch == 'all':
            filas = cursor.fetchall()
            if hasattr(cursor, 'description') and cursor.description:
                nombres = [desc[0] for desc in cursor.description]
                resultado = [dict(zip(nombres, f)) for f in filas]
            else:
                resultado = filas

        conn.commit()
        return resultado
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def obtener_todas_las_respuestas():
    """Retorna todas las respuestas registradas ordenadas por timestamp desc como lista de diccionarios."""
    return ejecutar_consulta("SELECT * FROM cuiag_respuestas ORDER BY timestamp DESC", fetch='all') or []
