import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>\n'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
            f'  <w:insideV w:val="none"/>\n'
            f'  <w:left w:val="none"/>\n'
            f'  <w:right w:val="none"/>\n'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F5F7FA")
    set_cell_margins(cell, top=120, bottom=120, left=200, right=200)
    
    # Border: subtle left accent border
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="1B365D"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text)
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(33, 37, 41)
    
    # Empty paragraph after table for spacing
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)
    p_after.paragraph_format.space_before = Pt(0)

def add_callout(doc, title, text, bg_color="EEF4FA", border_color="0D6EFD"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=120, bottom=120, left=200, right=200)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    r_title = p.add_run(title + "\n")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(13, 58, 110)
    
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(40, 45, 50)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)

def build_document():
    doc = docx.Document()
    
    # Page setup - Margins 1 inch
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Default Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(50, 50, 50)
    
    # ----------------------------------------------------
    # HEADER / PORTADA INSTITUCIONAL
    # ----------------------------------------------------
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(2)
    r_sub = p_meta.add_run("Materia: Asistencia sobre Aplicaciones Específicas | Área de Gestión de Sistemas")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(9.5)
    r_sub.font.color.rgb = RGBColor(108, 117, 125)
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("TRABAJO PRÁCTICO N° 5")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(22)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(27, 54, 93)  # Corporate Navy
    
    p_topic = doc.add_paragraph()
    p_topic.paragraph_format.space_before = Pt(0)
    p_topic.paragraph_format.space_after = Pt(12)
    r_topic = p_topic.add_run("Tema: Parametrización de Módulos y Carga Masiva de Datos")
    r_topic.font.name = "Calibri"
    r_topic.font.size = Pt(13)
    r_topic.font.color.rgb = RGBColor(70, 80, 95)
    r_topic.bold = True

    # Line separator
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(14)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="4" w:color="1B365D"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)

    # ----------------------------------------------------
    # OBJETIVOS
    # ----------------------------------------------------
    p_obj_h = doc.add_paragraph()
    p_obj_h.paragraph_format.space_before = Pt(6)
    p_obj_h.paragraph_format.space_after = Pt(4)
    r_obj_h = p_obj_h.add_run("OBJETIVOS DEL TRABAJO PRÁCTICO")
    r_obj_h.bold = True
    r_obj_h.font.size = Pt(11)
    r_obj_h.font.color.rgb = RGBColor(27, 54, 93)
    
    objectives = [
        "Comprender el concepto de parametrización funcional en los distintos módulos operativos de un ERP.",
        "Diseñar tablas de mapeo y protocolos rigurosos para la carga masiva de datos en bases de datos empresariales.",
        "Diagnosticar y resolver errores comunes de importación de archivos tabulares (delimitadores, encoding, integridad referencial y claves duplicadas)."
    ]
    for obj in objectives:
        p_obj = doc.add_paragraph(style='List Bullet')
        p_obj.paragraph_format.space_before = Pt(1)
        p_obj.paragraph_format.space_after = Pt(2)
        r = p_obj.add_run(obj)
        r.font.size = Pt(10.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ----------------------------------------------------
    # ACTIVIDAD 1: CUESTIONARIO DE COMPRENSIÓN TÉCNICA
    # ----------------------------------------------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("ACTIVIDAD 1: Cuestionario de Comprensión Técnica")
    r_h1.bold = True
    r_h1.font.size = Pt(14)
    r_h1.font.color.rgb = RGBColor(27, 54, 93)

    # Pregunta 1
    p_q1 = doc.add_paragraph()
    p_q1.paragraph_format.space_before = Pt(6)
    p_q1.paragraph_format.space_after = Pt(4)
    r_q1 = p_q1.add_run("1. ¿Qué diferencia conceptual existe entre programar un software a medida y parametrizar un módulo funcional en un sistema comercial paquetizado (COTS)?")
    r_q1.bold = True
    r_q1.font.size = Pt(11)
    r_q1.font.color.rgb = RGBColor(33, 37, 41)

    p_a1_1 = doc.add_paragraph()
    p_a1_1.paragraph_format.space_before = Pt(2)
    p_a1_1.paragraph_format.space_after = Pt(4)
    p_a1_1.paragraph_format.line_spacing = 1.15
    r = p_a1_1.add_run("• Software a Medida (Custom Development): ")
    r.bold = True
    p_a1_1.add_run(
        "Consiste en concebir, diseñar y codificar una solución tecnológica desde cero o sobre marcos de trabajo específicos "
        "para amoldarse a los requerimientos particulares de una organización. Exige desarrollo en código fuente (lenguajes como "
        "Java, C#, Python, esquemas de bases de datos DDL ad-hoc), implica plazos de desarrollo extensos, costos iniciales muy elevados "
        "y traslada el 100% de la responsabilidad del mantenimiento correctivo, evolutivo y la deuda técnica al cliente o equipo creador."
    )

    p_a1_2 = doc.add_paragraph()
    p_a1_2.paragraph_format.space_before = Pt(2)
    p_a1_2.paragraph_format.space_after = Pt(8)
    p_a1_2.paragraph_format.line_spacing = 1.15
    r = p_a1_2.add_run("• Parametrización en Sistemas COTS (Commercial Off-The-Shelf / ERP Paquetizado): ")
    r.bold = True
    p_a1_2.add_run(
        "El software ya ha sido previamente programado, probado y validado industrialmente. La adaptación a la operatoria empresarial "
        "no se ejecuta alterando el código fuente nuclear, sino configurando tablas maestras, variables funcionales, flujos de trabajo "
        "y políticas de negocio provistas por el fabricante mediante interfaces gráficas de administración. Esto permite una puesta en "
        "marcha sensiblemente más rápida, adopción de mejores prácticas del sector y compatibilidad asegurada con actualizaciones futuras."
    )

    # Pregunta 2
    p_q2 = doc.add_paragraph()
    p_q2.paragraph_format.space_before = Pt(6)
    p_q2.paragraph_format.space_after = Pt(4)
    r_q2 = p_q2.add_run("2. En el módulo de Stock, ¿por qué es crítico configurar correctamente los parámetros de Stock Mínimo y Punto de Pedido para la operatoria de una empresa?")
    r_q2.bold = True
    r_q2.font.size = Pt(11)
    r_q2.font.color.rgb = RGBColor(33, 37, 41)

    p_a2 = doc.add_paragraph()
    p_a2.paragraph_format.space_before = Pt(2)
    p_a2.paragraph_format.space_after = Pt(8)
    p_a2.paragraph_format.line_spacing = 1.15
    p_a2.add_run(
        "Ambos parámetros constituyen el núcleo del control cuantitativo de existencias y la automatización de la cadena de suministro:\n"
    )
    r = p_a2.add_run("• Stock Mínimo (Inventario de Seguridad): ")
    r.bold = True
    p_a2.add_run(
        "Es el colchón de resguardo destinado a absorber fluctuaciones imprevistas en la demanda o demoras en la entrega de proveedores. "
        "Un valor subdimensionado genera rotura de stock (pérdida directa de ventas y parada operativa). Un valor sobredimensionado "
        "provoca inmovilización improductiva de capital de trabajo y mayores costos de almacenamiento y deterioro.\n"
    )
    r = p_a2.add_run("• Punto de Pedido (Reorder Point - ROP): ")
    r.bold = True
    p_a2.add_run(
        "Es el nivel de inventario que activa automáticamente una solicitud u orden de compra. Su cálculo integra el plazo de entrega del proveedor "
        "(Lead Time) y la demanda media proyectada más el stock de seguridad. Si se parametriza tarde, el reabastecimiento llegará con la empresa en quiebre "
        "de stock; si se parametriza tempranamente, genera saturación de depósito y sobrecostos financieros."
    )

    # Pregunta 3
    p_q3 = doc.add_paragraph()
    p_q3.paragraph_format.space_before = Pt(6)
    p_q3.paragraph_format.space_after = Pt(4)
    r_q3 = p_q3.add_run("3. ¿Qué función cumple el proceso de Mapeo de Columnas antes de ejecutar una carga masiva de datos desde un archivo CSV?")
    r_q3.bold = True
    r_q3.font.size = Pt(11)
    r_q3.font.color.rgb = RGBColor(33, 37, 41)

    p_a3 = doc.add_paragraph()
    p_a3.paragraph_format.space_before = Pt(2)
    p_a3.paragraph_format.space_after = Pt(12)
    p_a3.paragraph_format.line_spacing = 1.15
    p_a3.add_run(
        "El Mapeo de Columnas (Data Mapping) es el proceso formal de correspondencia unívoca entre los campos/encabezados del archivo origen "
        "(CSV/plano) y las columnas de la tabla destino en la base de datos relacional. Cumple tres funciones críticas:\n"
        "1. Resolver discrepancias sintácticas y posicionales: Asocia columnas aunque tengan nombres distintos o vengan desordenadas respecto al esquema relacional.\n"
        "2. Aplicar reglas de transformación y tipado: Permite convertir tipos de datos (texto a numérico, parsear formatos de fecha, normalizar separadores decimales).\n"
        "3. Salvaguardar la integridad de la base de datos: Previene desbordamiento de cadenas (truncamiento en VARCHAR), violaciones de restricciones de nulidad (NOT NULL) y colisiones de llaves primarias o foráneas."
    )

    # ----------------------------------------------------
    # ACTIVIDAD 2: DISEÑO DE PARÁMETROS POR MÓDULO
    # ----------------------------------------------------
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("ACTIVIDAD 2: Diseño de Parámetros por Módulo")
    r_h2.bold = True
    r_h2.font.size = Pt(14)
    r_h2.font.color.rgb = RGBColor(27, 54, 93)

    p_case_desc = doc.add_paragraph()
    p_case_desc.paragraph_format.space_before = Pt(2)
    p_case_desc.paragraph_format.space_after = Pt(8)
    p_case_desc.paragraph_format.line_spacing = 1.15
    r_ctx = p_case_desc.add_run("Contexto de Aplicación: ")
    r_ctx.bold = True
    p_case_desc.add_run(
        "Ferretería industrial de tamaño mediano con ventas mostrador y mayoristas a empresas constructoras/talleres, "
        "gestión de miles de SKUs fraccionables y unitarios, catálogo extenso de proveedores y nómina de operarios y administrativos."
    )

    table2 = doc.add_table(rows=5, cols=3)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    table2.autofit = False
    set_table_borders(table2, color="B0C4DE", sz="6", val="single")

    headers2 = ["Módulo Funcional", "Parámetro 1 a Configurar (Definición e Impacto)", "Parámetro 2 a Configurar (Definición e Impacto)"]
    col_widths2 = [Inches(1.8), Inches(2.35), Inches(2.35)]

    # Header Row
    hdr_cells = table2.rows[0].cells
    for i, title in enumerate(headers2):
        hdr_cells[i].width = col_widths2[i]
        set_cell_background(hdr_cells[i], "1B365D")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.bold = True
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data2 = [
        (
            "1. Ventas y Facturación",
            "Puntos de Emisión y Tipos de Comprobantes Fiscales:\n"
            "Alta de puntos de venta autorizados ante el organismo fiscal (AFIP) y asignación de talonarios/CAE para Facturas A, B, Notas de Crédito/Débito y Remitos oficiales de entrega.",
            "Listas de Precios y Condiciones de Cuenta Corriente:\n"
            "Segmentación de precios (Mostrador/Minorista vs. Mayorista/Gremios) junto con asignación de topes de crédito y plazos de pago (30/60 días) para clientes habituales."
        ),
        (
            "2. Stock e Inventario",
            "Método de Valuación de Existencias:\n"
            "Selección de fórmula contable de costeo (PPP - Precio Promedio Ponderado o PEPS/FIFO), crucial para reflejar adecuadamente la rentabilidad en contextos de inflación o variaciones de costos.",
            "Unidades de Medida y Factores de Conversión:\n"
            "Parámetros para admitir fraccionamiento (ej. comprar bulonería o alambre en bobinas/cajas y comercializar fraccionado por kilo, metro o unidad suelta)."
        ),
        (
            "3. Compras",
            "Flujo de Aprobación de Órdenes de Compra (Workflow):\n"
            "Umbral monetario a partir del cual una compra requiere autorización jerárquica de Gerencia (ej. órdenes mayores a $1.000.000 requieren doble firma antes de emisión al proveedor).",
            "Lead Time y Proveedor Habitual por Artículo:\n"
            "Carga de los tiempos de entrega promedio por proveedor para alimentar el cálculo automatizado de reabastecimiento y sugerencias de compra del ERP."
        ),
        (
            "4. Recursos Humanos",
            "Convenio Colectivo de Trabajo y Escalas Salariales:\n"
            "Asignación del CCT aplicable (ej. Empleados de Comercio 130/75), definiendo categorías laborales, adicionales por manejo de caja, antigüedad y conceptos no remunerativos.",
            "Esquema de Turnos y Tolerancia de Fichada:\n"
            "Configuración de turnos de atención al público y depósito (rotativos), junto al margen de tolerancia de ingreso (ej. 10 minutos) para liquidación de presentismo y horas extras."
        )
    ]

    for row_idx, row_data in enumerate(data2, start=1):
        row_cells = table2.rows[row_idx].cells
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].width = col_widths2[col_idx]
            set_cell_background(row_cells[col_idx], bg)
            set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=120, right=120)
            p = row_cells[col_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            
            # Format text: bold the title if contains ':'
            lines = cell_value.split("\n")
            if len(lines) > 1 and ":" in lines[0]:
                r_title = p.add_run(lines[0] + "\n")
                r_title.bold = True
                r_title.font.name = "Calibri"
                r_title.font.size = Pt(9.5)
                r_title.font.color.rgb = RGBColor(27, 54, 93)
                
                r_body = p.add_run("\n".join(lines[1:]))
                r_body.font.name = "Calibri"
                r_body.font.size = Pt(9.5)
            else:
                r_cell = p.add_run(cell_value)
                r_cell.bold = (col_idx == 0)
                r_cell.font.name = "Calibri"
                r_cell.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ----------------------------------------------------
    # ACTIVIDAD 3: ESTUDIO DE CASO — PROTOCOLO DE CARGA MASIVA
    # ----------------------------------------------------
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("ACTIVIDAD 3: Estudio de Caso — Protocolo de Carga Masiva")
    r_h3.bold = True
    r_h3.font.size = Pt(14)
    r_h3.font.color.rgb = RGBColor(27, 54, 93)

    add_callout(
        doc,
        "Planteo del Caso Práctico: 'Electrónica del Norte'",
        "El comercio necesita migrar su padrón histórico de 5.000 clientes desde una planilla Excel antigua hacia el nuevo ERP.\n"
        "• Columnas desordenadas en archivo CSV origen: [Telefono, Correo_Electronico, Razon_Social, CUIT, Domicilio]\n"
        "• Estructura tabla destino MySQL: clientes (id_cliente INT PRIMARY KEY, nombre_comercial VARCHAR(100) NOT NULL, documento_cuit VARCHAR(15) NOT NULL, direccion VARCHAR(150), tel VARCHAR(20), email VARCHAR(100))"
    )

    # Paso 1
    p_step1 = doc.add_paragraph()
    p_step1.paragraph_format.space_before = Pt(6)
    p_step1.paragraph_format.space_after = Pt(4)
    r_s1 = p_step1.add_run("Paso 1: Limpieza Previa y Tratamiento de Integridad (Data Cleansing)")
    r_s1.bold = True
    r_s1.font.size = Pt(11.5)
    r_s1.font.color.rgb = RGBColor(27, 54, 93)

    p_s1_body = doc.add_paragraph()
    p_s1_body.paragraph_format.space_before = Pt(2)
    p_s1_body.paragraph_format.space_after = Pt(6)
    p_s1_body.paragraph_format.line_spacing = 1.15
    p_s1_body.add_run(
        "Antes de interactuar con el motor MySQL, se procesa el archivo CSV en un entorno de preparación de datos (OpenRefine, Python/Pandas o Excel) aplicando los siguientes recaudos obligatorios:\n\n"
    )
    
    recaudos = [
        ("Tratamiento de Valores Nulos o Vacíos en CUIT: ", 
         "Dado que la tabla destino define 'documento_cuit VARCHAR(15) NOT NULL', cualquier registro nulo provocará el aborto de la inserción o corrupción de datos. Se filtran todos los registros con CUIT vacío. Si corresponden a consumidores finales sin personería fiscal, se evalúa con el área contable si se les asigna un CUIT genérico normado (ej. '00-00000000-0') o si deben aislarse en un archivo de 'clientes_pendientes_regularizacion.csv' para carga manual posterior."),
        ("Normalización de Formato de CUIT: ", 
         "En archivos antiguos coexisten formatos dispares: con guiones ('20-12345678-9'), sin guiones ('20123456789') o con espacios. Se aplica una limpieza sistemática eliminando espacios y caracteres no permitidos, estandarizando al patrón exacto de 11 dígitos o formato homogéneo con guiones que valide el algoritmo de dígito verificador (Módulo 11)."),
        ("Detección de CUITs Duplicados en Origen: ", 
         "Al ser el CUIT la clave fiscal de identificación unívoca, se ejecuta un análisis de duplicidad en la planilla origen. Si se detectan CUITs repetidos, se audita si se trata de sucursales del mismo cliente (en cuyo caso se debe acordar la estructura de sucursal) o de registros duplicados por error. En caso de redundancia pura, se conserva el registro con domicilio y contacto más actualizados.")
    ]

    for title, desc in recaudos:
        p_item = doc.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(3)
        p_item.paragraph_format.line_spacing = 1.15
        r_t = p_item.add_run(title)
        r_t.bold = True
        p_item.add_run(desc)

    # Paso 2
    p_step2 = doc.add_paragraph()
    p_step2.paragraph_format.space_before = Pt(8)
    p_step2.paragraph_format.space_after = Pt(4)
    r_s2 = p_step2.add_run("Paso 2: Matriz de Mapeo de Campos (Equivalencias y Transformación)")
    r_s2.bold = True
    r_s2.font.size = Pt(11.5)
    r_s2.font.color.rgb = RGBColor(27, 54, 93)

    table_map = doc.add_table(rows=7, cols=4)
    table_map.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_map.autofit = False
    set_table_borders(table_map, color="B0C4DE", sz="6", val="single")

    map_headers = ["Columna Origen (CSV)", "Columna Destino (MySQL)", "Tipo de Dato", "Regla de Transformación / Validación"]
    map_widths = [Inches(1.6), Inches(1.6), Inches(1.2), Inches(2.1)]

    for idx, th in enumerate(map_headers):
        cell = table_map.rows[0].cells[idx]
        cell.width = map_widths[idx]
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(th)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    map_rows = [
        ("(No existe en CSV)", "id_cliente", "INT PRIMARY KEY", "Autoincremental (AUTO_INCREMENT). El motor MySQL asigna la secuencia numérica."),
        ("Razon_Social", "nombre_comercial", "VARCHAR(100) NOT NULL", "Función TRIM() para suprimir espacios residuales. Validación de longitud máxima (<=100)."),
        ("CUIT", "documento_cuit", "VARCHAR(15) NOT NULL", "Normalización de formato. Validación de obligatoriedad (rechazar valores nulos)."),
        ("Domicilio", "direccion", "VARCHAR(150)", "Verificación de no exceder 150 caracteres. Admite valores nulos si no está informado."),
        ("Telefono", "tel", "VARCHAR(20)", "Limpieza de caracteres especiales; mantener prefijo internacional/interurbano. Admite nulo."),
        ("Correo_Electronico", "email", "VARCHAR(100)", "Conversión a minúsculas con LOWER(). Validación sintáctica de estructura de correo.")
    ]

    for row_idx, rdata in enumerate(map_rows, start=1):
        cells = table_map.rows[row_idx].cells
        bg = "FFFFFF" if row_idx % 2 != 0 else "F8FAFC"
        for col_idx, text in enumerate(rdata):
            cells[col_idx].width = map_widths[col_idx]
            set_cell_background(cells[col_idx], bg)
            set_cell_margins(cells[col_idx], top=80, bottom=80, left=100, right=100)
            p = cells[col_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            r.font.size = Pt(9)
            if col_idx in (0, 1):
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Paso 3
    p_step3 = doc.add_paragraph()
    p_step3.paragraph_format.space_before = Pt(8)
    p_step3.paragraph_format.space_after = Pt(4)
    r_s3 = p_step3.add_run("Paso 3: Validación de Errores — Resolución de 'Duplicate entry for key cuit'")
    r_s3.bold = True
    r_s3.font.size = Pt(11.5)
    r_s3.font.color.rgb = RGBColor(27, 54, 93)

    p_s3_body = doc.add_paragraph()
    p_s3_body.paragraph_format.space_before = Pt(2)
    p_s3_body.paragraph_format.space_after = Pt(6)
    p_s3_body.paragraph_format.line_spacing = 1.15
    p_s3_body.add_run(
        "• Diagnóstico del Error:\n"
        "El motor MySQL rechazó 50 filas debido a que la columna 'documento_cuit' posee una restricción de unicidad (UNIQUE KEY). "
        "Esto ocurre cuando en el archivo CSV existen 50 registros cuyos CUITs ya existen previamente en la base de datos o se repiten "
        "dentro del mismo lote de importación (por ejemplo, múltiples contactos asociados a la misma empresa cliente o errores históricos de carga).\n\n"
        "• Protocolo de Resolución Técnica en 4 Fases:\n"
    )

    res_steps = [
        ("1. Carga en Área de Transición (Staging Table): ", 
         "Nunca se debe reintentar directamente sobre la tabla operativa. Se crea una tabla temporal desnormalizada 'clientes_staging' sin índice UNIQUE para volcar las 5.000 filas intactas."),
        ("2. Identificación exacta de los conflictos mediante SQL: ",
         "Se ejecuta una consulta analítica de agrupación para aislar los 50 registros conflictivos:\n"
         "SELECT documento_cuit, COUNT(*) AS repeticiones FROM clientes_staging GROUP BY documento_cuit HAVING COUNT(*) > 1;"),
        ("3. Criterio de Resolución de Negocio: ",
         "Se presenta el reporte de duplicados al área comercial para decidir: si se trata de sucursales (se añade código de sucursal), o si se trata de duplicados por actualización de domicilio/teléfono."),
        ("4. Inserción Definitiva con Cláusula de Manejo de Conflictos: ",
         "Para completar la carga sin interrupciones, se emplean instrucciones SQL seguras:")
    ]

    for title, desc in res_steps:
        p_item = doc.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(2)
        p_item.paragraph_format.line_spacing = 1.15
        r_t = p_item.add_run(title)
        r_t.bold = True
        p_item.add_run(desc)

    sql_dups = (
        "-- Opción A: Descartar duplicados manteniendo el primer registro válido\n"
        "INSERT IGNORE INTO clientes (nombre_comercial, documento_cuit, direccion, tel, email)\n"
        "SELECT nombre_comercial, documento_cuit, direccion, tel, email FROM clientes_staging;\n\n"
        "-- Opción B: Si el archivo contiene datos más recientes, actualizar la información existente\n"
        "INSERT INTO clientes (nombre_comercial, documento_cuit, direccion, tel, email)\n"
        "SELECT nombre_comercial, documento_cuit, direccion, tel, email FROM clientes_staging\n"
        "ON DUPLICATE KEY UPDATE\n"
        "    nombre_comercial = VALUES(nombre_comercial),\n"
        "    direccion = VALUES(direccion),\n"
        "    tel = VALUES(tel),\n"
        "    email = VALUES(email);"
    )
    add_code_block(doc, sql_dups)

    # ----------------------------------------------------
    # ACTIVIDAD 4: TALLER PRÁCTICO DE SIMULACIÓN DE IMPORTACIÓN
    # ----------------------------------------------------
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("ACTIVIDAD 4: Taller Práctico de Simulación de Importación (CSV / SQL)")
    r_h4.bold = True
    r_h4.font.size = Pt(14)
    r_h4.font.color.rgb = RGBColor(27, 54, 93)

    p_a4_desc = doc.add_paragraph()
    p_a4_desc.paragraph_format.space_before = Pt(2)
    p_a4_desc.paragraph_format.space_after = Pt(6)
    p_a4_desc.paragraph_format.line_spacing = 1.15
    p_a4_desc.add_run(
        "Se reproduce la simulación técnica de laboratorio para la carga masiva de artículos en un motor MySQL, "
        "respetando el formato requerido: archivo delimitado por punto y coma (;), codificación UTF-8 sin BOM "
        "y sentencias DDL y DML estructuradas."
    )

    # 1. Archivo CSV
    p_csv_h = doc.add_paragraph()
    p_csv_h.paragraph_format.space_before = Pt(6)
    p_csv_h.paragraph_format.space_after = Pt(2)
    r_csv_h = p_csv_h.add_run("1. Contenido exacto del archivo 'articulos_carga.csv' (5 registros de prueba)")
    r_csv_h.bold = True
    r_csv_h.font.size = Pt(11)
    r_csv_h.font.color.rgb = RGBColor(27, 54, 93)

    csv_content = (
        "codigo;descripcion;precio;stock_actual\n"
        "HER-001;Amoladora Angular 115mm 850W;125500.50;18\n"
        "HER-002;Taladro Percutor 13mm 650W;98400.00;25\n"
        "INS-101;Disco de Corte Acero Inoxidable 4.5\";1250.75;340\n"
        "BUL-501;Caja Tornillos Autoperforantes 10x3/4 x 500u;14200.00;60\n"
        "EPP-202;Guantes de Descarne Reforzados Talle 10;4500.20;120"
    )
    add_code_block(doc, csv_content)

    p_note_enc = doc.add_paragraph()
    p_note_enc.paragraph_format.space_before = Pt(2)
    p_note_enc.paragraph_format.space_after = Pt(6)
    p_note_enc.paragraph_format.line_spacing = 1.15
    r_n = p_note_enc.add_run("Nota sobre codificación: ")
    r_n.bold = True
    p_note_enc.add_run(
        "El archivo ha sido guardado con codificación UTF-8 pura (sin BOM). La ausencia de BOM evita que caracteres "
        "invisibles (\\xEF\\xBB\\xBF) se antepongan al primer encabezado 'codigo', lo que causaría el error común "
        "donde MySQL no reconoce la primera columna."
    )

    # 2. Estructura de la tabla SQL
    p_ddl_h = doc.add_paragraph()
    p_ddl_h.paragraph_format.space_before = Pt(8)
    p_ddl_h.paragraph_format.space_after = Pt(2)
    r_ddl_h = p_ddl_h.add_run("2. Estructura de la Tabla SQL (DDL)")
    r_ddl_h.bold = True
    r_ddl_h.font.size = Pt(11)
    r_ddl_h.font.color.rgb = RGBColor(27, 54, 93)

    sql_ddl = (
        "CREATE DATABASE IF NOT EXISTS ferreteria_erp;\n"
        "USE ferreteria_erp;\n\n"
        "DROP TABLE IF EXISTS articulos;\n\n"
        "CREATE TABLE articulos (\n"
        "    id_articulo INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    codigo VARCHAR(20) NOT NULL UNIQUE,\n"
        "    descripcion VARCHAR(150) NOT NULL,\n"
        "    precio DECIMAL(10,2) NOT NULL,\n"
        "    stock_actual INT NOT NULL DEFAULT 0,\n"
        "    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    )
    add_code_block(doc, sql_ddl)

    # 3. Sentencia LOAD DATA INFILE
    p_dml_h = doc.add_paragraph()
    p_dml_h.paragraph_format.space_before = Pt(8)
    p_dml_h.paragraph_format.space_after = Pt(2)
    r_dml_h = p_dml_h.add_run("3. Sentencia SQL de Inserción Masiva (LOAD DATA LOCAL INFILE)")
    r_dml_h.bold = True
    r_dml_h.font.size = Pt(11)
    r_dml_h.font.color.rgb = RGBColor(27, 54, 93)

    sql_load = (
        "LOAD DATA LOCAL INFILE 'C:/Users/Usuario/Desktop/articulos_carga.csv'\n"
        "INTO TABLE articulos\n"
        "CHARACTER SET utf8mb4\n"
        "FIELDS TERMINATED BY ';'\n"
        "ENCLOSED BY '\"'\n"
        "LINES TERMINATED BY '\\r\\n'\n"
        "IGNORE 1 LINES\n"
        "(codigo, descripcion, precio, stock_actual);"
    )
    add_code_block(doc, sql_load)

    # Explicación parámetros
    p_exp = doc.add_paragraph()
    p_exp.paragraph_format.space_before = Pt(2)
    p_exp.paragraph_format.space_after = Pt(6)
    p_exp.paragraph_format.line_spacing = 1.15
    p_exp.add_run("Desglose técnico de parámetros utilizados:\n")
    
    params = [
        ("LOCAL INFILE: ", "Instruye al cliente de base de datos a transmitir el archivo desde el sistema de archivos local hacia el servidor MySQL."),
        ("CHARACTER SET utf8mb4: ", "Garantiza soporte completo para acentos, caracteres especiales y comillas sin distorsión de caracteres (mojibake)."),
        ("FIELDS TERMINATED BY ';': ", "Configura el delimitador de campos por punto y coma según las especificaciones de la consigna."),
        ("LINES TERMINATED BY '\\r\\n': ", "Ajusta la lectura al retorno de carro y salto de línea estándar del entorno Windows (CRLF)."),
        ("IGNORE 1 LINES: ", "Omite la primera fila correspondiente a los nombres de las columnas para evitar errores de conversión de tipos."),
        ("(codigo, descripcion, precio, stock_actual): ", "Mapeo explícito que asigna las 4 columnas del CSV, permitiendo que 'id_articulo' y 'fecha_alta' se autogeneren.")
    ]

    for p_name, p_desc in params:
        p_item = doc.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(2)
        r_pn = p_item.add_run(p_name)
        r_pn.bold = True
        p_item.add_run(p_desc)

    # 4. Alternativa INSERT INTO Batch
    p_alt_h = doc.add_paragraph()
    p_alt_h.paragraph_format.space_before = Pt(8)
    p_alt_h.paragraph_format.space_after = Pt(2)
    r_alt_h = p_alt_h.add_run("4. Sentencia Alternativa por Lotes (INSERT INTO Batch)")
    r_alt_h.bold = True
    r_alt_h.font.size = Pt(11)
    r_alt_h.font.color.rgb = RGBColor(27, 54, 93)

    p_alt_txt = doc.add_paragraph()
    p_alt_txt.paragraph_format.space_before = Pt(2)
    p_alt_txt.paragraph_format.space_after = Pt(4)
    p_alt_txt.paragraph_format.line_spacing = 1.15
    p_alt_txt.add_run(
        "Para entornos de hosting o servidores corporativos donde la directiva 'local_infile' se encuentra deshabilitada por motivos de seguridad, la importación se ejecuta en una sola transacción mediante inserción multi-fila:"
    )

    sql_batch = (
        "INSERT INTO articulos (codigo, descripcion, precio, stock_actual) VALUES\n"
        "('HER-001', 'Amoladora Angular 115mm 850W', 125500.50, 18),\n"
        "('HER-002', 'Taladro Percutor 13mm 650W', 98400.00, 25),\n"
        "('INS-101', 'Disco de Corte Acero Inoxidable 4.5\"', 1250.75, 340),\n"
        "('BUL-501', 'Caja Tornillos Autoperforantes 10x3/4 x 500u', 14200.00, 60),\n"
        "('EPP-202', 'Guantes de Descarne Reforzados Talle 10', 4500.20, 120);\n\n"
        "-- Verificación de consistencia final:\n"
        "SELECT * FROM articulos;"
    )
    add_code_block(doc, sql_batch)

    # Conclusión
    add_callout(
        doc,
        "Conclusiones del Diagnóstico y Carga Masiva",
        "La correcta parametrización previa y la rigurosidad en los protocolos de saneamiento (Data Cleansing) y mapeo "
        "constituyen el factor determinante para el éxito de una migración de datos hacia un ERP. El empleo de tablas "
        "intermedias (staging) y validaciones de tipos de datos previene la corrupción de la base operativa y garantiza la "
        "continuidad ininterrumpida del negocio.",
        bg_color="F0FFF4",
        border_color="28A745"
    )

    # Guardar en Desktop
    desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')
    out_docx = os.path.join(desktop_path, "TP5_Parametrizacion_y_Carga_Masiva.docx")
    doc.save(out_docx)
    print(f"Documento Word guardado exitosamente en: {out_docx}")

    # También crear el archivo articulos_carga.csv en el Escritorio
    out_csv = os.path.join(desktop_path, "articulos_carga.csv")
    with open(out_csv, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(csv_content)
    print(f"Archivo CSV de prueba guardado exitosamente en: {out_csv}")

if __name__ == "__main__":
    build_document()
