"""
Script para generar el documento formal de entrega en DOCX y PDF para Canvas LMS.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def generate_docx(filename="ENTREGABLE_CANVAS.docx"):
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Titulo
    title = doc.add_paragraph()
    run = title.add_run("TALLER AUTÓNOMO: AUDITORÍA DE IA CON McCABE Y COBERTURA DE CÓDIGO")
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = RGBColor(15, 37, 64)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub = doc.add_paragraph()
    sub_run = sub.add_run("Pruebas, Control de Calidad y Mantenimiento de Software (7mo Semestre)")
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER

    repo = doc.add_paragraph()
    repo_run = repo.add_run("Repositorio GitHub: https://github.com/danielbazx/mccabe-y-cobertura-de-codigo")
    repo_run.font.size = Pt(10)
    repo_run.font.bold = True
    repo_run.font.color.rgb = RGBColor(14, 116, 144)
    repo.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("─" * 55)

    # Integrantes
    h1 = doc.add_heading("1. Integrantes del Equipo y Roles Tácticos", level=2)
    tbl = doc.add_table(rows=1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.style = 'Table Grid'
    hdr = tbl.rows[0].cells
    hdr[0].text = "Integrante"
    hdr[1].text = "Rol Táctico"
    hdr[2].text = "Responsabilidades"
    for c in hdr:
        set_cell_background(c, "0F2540")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9)

    integrantes = [
        ("Daniel Cadena", "Git Lead & Arquitecto Backend", "Configuración de arquitectura Node.js/Express, persistencia SQLite, gestión del repositorio Git y orquestación del entregable."),
        ("Gonzalo Cárdenas", "Auditor Topológico de McCabe", "Extracción de Grafos de Flujo de Control (CFG), cálculo formal de complejidad ciclomática V(G) = P + 1 = E - N + 2 y verificación del límite V(G) <= 10."),
        ("Gabriel Vásquez", "Ingeniero de Automatización QA", "Diseño de pruebas unitarias en Jest bajo el modelo PIE, erradicación de tests zombis y garantía de Cobertura de Ramas al 100%.")
    ]
    for nombre, rol, resp in integrantes:
        row = tbl.add_row().cells
        row[0].text = nombre
        row[1].text = rol
        row[2].text = resp
        for c in row:
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(8.5)

    doc.add_paragraph("")
    doc.add_heading("2. Resumen Ejecutivo y Metodología", level=2)
    p_res = doc.add_paragraph(
        "Frente al fenómeno del 'Desarrollador Copiador', el equipo asumió el rol de 'Ingeniero QA Auditor' "
        "diseñando un Sistema de Citas Médicas Familiares auditado mediante Complejidad Ciclomática de McCabe (V(G)) "
        "y Cobertura de Ramas al 100%. Se modelaron las 4 reglas críticas del sistema mediante Grafos de Flujo de Control (CFG), "
        "demostrando matemáticamente que la complejidad de cada módulo es V(G) <= 7, cumpliendo holgadamente el límite de McCabe (<= 10)."
    )
    p_res.runs[0].font.size = Pt(9.5)

    doc.add_heading("3. Matriz Topológica y Fórmulas de McCabe V(G)", level=2)
    tbl2 = doc.add_table(rows=1, cols=7)
    tbl2.style = 'Table Grid'
    hdr2 = tbl2.rows[0].cells
    hdr2[0].text = "Regla de Negocio"
    hdr2[1].text = "Función"
    hdr2[2].text = "N"
    hdr2[3].text = "E"
    hdr2[4].text = "P"
    hdr2[5].text = "V(G)"
    hdr2[6].text = "Límite <= 10"
    for c in hdr2:
        set_cell_background(c, "1E293B")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(8.5)

    metricas = [
        ("Regla 1: Edad Pediátrica", "validarReglaEdad", "7", "10", "4", "5", "Aprobado"),
        ("Regla 2: Horarios Operativos", "validarRestriccionHorario", "9", "14", "6", "7", "Aprobado"),
        ("Regla 3: Choque de Citas", "validarChoqueDeCitas", "6", "8", "3", "4", "Aprobado"),
        ("Regla 4: Penalización < 24h", "evaluarPenalizacionCancelacion", "5", "6", "2", "3", "Aprobado")
    ]
    for r, f, n, e, p, vg, lim in metricas:
        row = tbl2.add_row().cells
        row[0].text = r
        row[1].text = f
        row[2].text = n
        row[3].text = e
        row[4].text = p
        row[5].text = vg
        row[6].text = lim
        for c in row:
            for para in c.paragraphs:
                for run in para.runs:
                    run.font.size = Pt(8)

    doc.add_paragraph("")
    doc.add_heading("4. Evidencia de Cobertura de Ramas al 100% (Jest)", level=2)
    p_cov = doc.add_paragraph(
        "Se ejecutaron 39 pruebas unitarias e integrales en Jest, logrando:\n"
        "• Cobertura de Sentencias (Statements): 100%\n"
        "• Cobertura de Ramas (Branches): 100%\n"
        "• Cobertura de Funciones: 100%\n"
        "• Cobertura de Líneas: 100%\n"
        "Erradicando la trampa de los 'Tests Zombis' mediante oráculos estrictos basados en el Modelo PIE."
    )
    p_cov.runs[0].font.size = Pt(9.5)

    doc.add_heading("5. Respuestas al Cuestionario de Auditoría (Slide 12)", level=2)
    preguntas = [
        ("1. ¿Conozco el número exacto de caminos lógicos V(G) antes de leer los tests generados por la IA?",
         "Sí. Mediante el cálculo V(G) = P + 1 determinamos a priori que la penalización tardía requiere exactamente 3 caminos independientes."),
        ("2. ¿El 100% de cobertura que reporta la herramienta incluye aserciones (oráculos) fuertes?",
         "Sí. Cada prueba evalúa múltiples aserciones sobre estados canónicos, montos monetarios precisos y motivos de rechazo."),
        ("3. ¿Están evaluadas todas las condiciones lógicas, o solo las líneas de código superficiales?",
         "Sí. Se alcanzó el 100% en Branch Coverage evaluando cada bifurcación lógica tanto en True como en False."),
        ("4. ¿He forzado intencionalmente fallos (mutaciones) para verificar si los tests de la IA los detectan?",
         "Sí. Se incluyeron pruebas de control defensivo demostrando que cualquier mutación lógica quiebra de inmediato los oráculos."),
        ("5. ¿Es la complejidad del código generado tan alta que la acción correcta es refactorizar en lugar de testear?",
         "No. Todas las funciones mantienen V(G) <= 7, muy por debajo del umbral de advertencia de McCabe (V(G) = 10).")
    ]
    for q, a in preguntas:
        p_qa = doc.add_paragraph()
        r_q = p_qa.add_run(q + "\n")
        r_q.bold = True
        r_q.font.size = Pt(9)
        r_a = p_qa.add_run("Respuesta: " + a)
        r_a.font.size = Pt(8.5)

    doc.save(filename)
    print(f"Generado DOCX: {filename}")

def generate_pdf(filename="ENTREGABLE_CANVAS.pdf"):
    pdf = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=45, leftMargin=45, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontSize = 8.5
    normal.leading = 11

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F2540'),
        alignment=1
    )

    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#0F2540'),
        spaceBefore=8,
        spaceAfter=4
    )

    story = []
    story.append(Paragraph("TALLER AUTÓNOMO: AUDITORÍA DE IA CON McCABE Y COBERTURA", title_style))
    story.append(Paragraph("Pruebas, Control de Calidad y Mantenimiento de Software (7mo Semestre)", sub_style))
    story.append(Paragraph("<b>Repositorio GitHub:</b> https://github.com/danielbazx/mccabe-y-cobertura-de-codigo", sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))

    story.append(Paragraph("1. Integrantes del Equipo y Roles Tácticos", h2_style))
    t1_data = [
        [Paragraph("<b>Integrante</b>", normal), Paragraph("<b>Rol Táctico</b>", normal), Paragraph("<b>Responsabilidades</b>", normal)],
        [Paragraph("Daniel Cadena", normal), Paragraph("Git Lead & Arquitecto Backend", normal), Paragraph("Configuración Node.js/Express, persistencia SQLite, gestión Git y orquestación.", normal)],
        [Paragraph("Gonzalo Cárdenas", normal), Paragraph("Auditor Topológico de McCabe", normal), Paragraph("Modelado CFG, cálculo V(G) = P + 1 = E - N + 2 y verificación del límite V(G) <= 10.", normal)],
        [Paragraph("Gabriel Vásquez", normal), Paragraph("Ingeniero de Automatización QA", normal), Paragraph("Diseño de pruebas en Jest bajo el modelo PIE y garantía de Cobertura de Ramas al 100%.", normal)]
    ]
    t1 = Table(t1_data, colWidths=[110, 130, 280])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F2540')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3)
    ]))
    story.append(t1)

    story.append(Paragraph("2. Matriz Topológica y Complejidad Ciclomática de McCabe V(G)", h2_style))
    t2_data = [
        [Paragraph("<b>Regla de Negocio</b>", normal), Paragraph("<b>Función</b>", normal), Paragraph("<b>N</b>", normal), Paragraph("<b>E</b>", normal), Paragraph("<b>P</b>", normal), Paragraph("<b>V(G)</b>", normal), Paragraph("<b>Límite <= 10</b>", normal)],
        [Paragraph("Regla 1: Edad Pediátrica", normal), Paragraph("validarReglaEdad", normal), "7", "10", "4", "5", "Aprobado"],
        [Paragraph("Regla 2: Horarios Operativos", normal), Paragraph("validarRestriccionHorario", normal), "9", "14", "6", "7", "Aprobado"],
        [Paragraph("Regla 3: Choque de Citas", normal), Paragraph("validarChoqueDeCitas", normal), "6", "8", "3", "4", "Aprobado"],
        [Paragraph("Regla 4: Penalización < 24h", normal), Paragraph("evaluarPenalizacionCancelacion", normal), "5", "6", "2", "3", "Aprobado"]
    ]
    t2 = Table(t2_data, colWidths=[120, 130, 30, 30, 30, 45, 65])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,1), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3)
    ]))
    story.append(t2)

    story.append(Paragraph("3. Evidencia de Cobertura de Ramas al 100% (Branch Coverage)", h2_style))
    story.append(Paragraph(
        "Se ejecutaron <b>39 pruebas en Jest</b> con 100% en Sentencias, Ramas, Funciones y Líneas. "
        "Se aplicó el <b>Modelo PIE (Execution, Infection, Detection)</b> para erradicar tests zombis y asegurar oráculos estrictos.",
        normal
    ))

    story.append(Paragraph("4. Respuestas al Cuestionario de Auditoría (Slide 12)", h2_style))
    p_text = (
        "<b>1. ¿Conozco V(G) antes de ver tests?</b> Sí, se calcularon matemáticamente los caminos independientes a priori.<br/>"
        "<b>2. ¿El 100% de cobertura incluye oráculos fuertes?</b> Sí, oráculos estrictos sobre estados, montos monetarios y flags.<br/>"
        "<b>3. ¿Están evaluadas todas las condiciones lógicas?</b> Sí, 100% de Cobertura de Ramas evaluando todas las decisiones.<br/>"
        "<b>4. ¿Se forzaron fallos por mutaciones?</b> Sí, se incorporaron controles defensivos ante datos corruptos o mutados.<br/>"
        "<b>5. ¿Complejidad controlada?</b> Sí, todas las funciones presentan V(G) <= 7, dentro del límite de McCabe (<= 10)."
    )
    story.append(Paragraph(p_text, normal))

    pdf.build(story)
    print(f"Generado PDF: {filename}")

if __name__ == '__main__':
    generate_docx()
    generate_pdf()
