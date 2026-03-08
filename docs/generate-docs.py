"""
Generate comprehensive technical documentation for Can I Nap? project.
Creates a professional Word document (.docx) covering architecture, math, and data pipeline.
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
import os

doc = Document()

# ── Style setup ──────────────────────────────────────────────────────────────

style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.15

for level in range(1, 5):
    heading_style = doc.styles[f'Heading {level}']
    heading_style.font.name = 'Calibri'
    heading_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

doc.styles['Heading 1'].font.size = Pt(22)
doc.styles['Heading 2'].font.size = Pt(16)
doc.styles['Heading 3'].font.size = Pt(13)


def add_code_block(doc, code, language=""):
    """Add a formatted code block."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(code)
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x1E, 0x1E, 0x2E)
    # Add shading
    shading = run._element.get_or_add_rPr()
    shd = shading.makeelement(qn('w:shd'), {
        qn('w:val'): 'clear',
        qn('w:color'): 'auto',
        qn('w:fill'): 'F1F5F9'
    })
    shading.append(shd)


def add_table(doc, headers, rows):
    """Add a formatted table."""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Light Grid Accent 1'

    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = header
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(10)

    for row_idx, row_data in enumerate(rows):
        for col_idx, cell_text in enumerate(row_data):
            cell = table.rows[row_idx + 1].cells[col_idx]
            cell.text = str(cell_text)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)

    return table


def add_bullet(doc, text, level=0):
    """Add a bullet point."""
    p = doc.add_paragraph(text, style='List Bullet')
    p.paragraph_format.left_indent = Cm(1.27 * (level + 1))


# ══════════════════════════════════════════════════════════════════════════════
# TITLE PAGE
# ══════════════════════════════════════════════════════════════════════════════

for _ in range(6):
    doc.add_paragraph()

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run('Can I Nap?')
run.bold = True
run.font.size = Pt(36)
run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

subtitle_he = doc.add_paragraph()
subtitle_he.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle_he.add_run('\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD?')
run.font.size = Pt(28)
run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

doc.add_paragraph()

desc = doc.add_paragraph()
desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = desc.add_run('Comprehensive Technical Documentation')
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

doc.add_paragraph()

version = doc.add_paragraph()
version.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = version.add_run('v1.0 \u2014 March 2026')
run.font.size = Pt(14)
run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('Table of Contents', level=1)
toc_items = [
    '1. Executive Summary',
    '2. How the Risk is Calculated',
    '   2.1 The Core Statistical Model (Poisson Process)',
    '   2.2 The Five Risk Factors',
    '   2.3 Trend Factor',
    '   2.4 Recency Factor',
    '   2.5 Dual-Front Escalation',
    '   2.6 Time-of-Day Bias',
    '   2.7 Weighted Final Calculation',
    '3. Iran vs Hezbollah Classification',
    '   3.1 The Problem',
    '   3.2 Our Solution \u2014 Three Signals',
    '4. Data Pipeline',
    '   4.1 Data Sources',
    '   4.2 Data Flow',
    '   4.3 Alert Categories',
    '   4.4 Data Volume',
    '5. Architecture',
    '   5.1 Tech Stack',
    '   5.2 Key Files',
    '   5.3 Real-Time Flow',
    '6. User Interface',
    '   6.1 Single-Page Dashboard',
    '   6.2 Key Components',
    '   6.3 Languages',
    '   6.4 Visual Design',
    '7. Security Considerations',
    '8. Performance Optimizations',
    '9. Future Roadmap',
    'Appendix A: The Math in Detail',
    'Appendix B: Complete i18n String Table',
]
for item in toc_items:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(2)
    if item.startswith('   '):
        p.paragraph_format.left_indent = Cm(1.5)
        p.runs[0].font.size = Pt(10)
        p.runs[0].font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    else:
        p.runs[0].font.size = Pt(11)
        p.runs[0].bold = True

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 1. EXECUTIVE SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('1. Executive Summary', level=1)

doc.add_paragraph(
    '"Can I Nap?" is a real-time web application that calculates the probability of a nap '
    'being interrupted by a rocket alert from Pikud HaOref (Israeli Home Front Command). '
    'It was built specifically for Israeli civilians during the Iran-Israel war that began '
    'on February 28, 2026.'
)

doc.add_paragraph(
    'The concept is inspired by canishower.com, but the problem domain is fundamentally different. '
    'Showers last 5\u201320 minutes; naps last 10\u2013120 minutes. Longer exposure windows mean risk '
    'compounds non-linearly \u2014 doubling the nap duration more than doubles the probability of '
    'interruption. This requires a Poisson-based statistical model rather than simple rate estimation.'
)

doc.add_paragraph(
    'The app polls the Pikud HaOref real-time alert API every 5 seconds, classifies each alert '
    'by its likely source (Iranian ballistic missiles vs. Hezbollah rockets from Lebanon), and '
    'calculates interruption probability using a weighted multi-factor risk model with five components: '
    'core statistical probability, trend detection, recency decay, dual-front escalation tracking, '
    'and time-of-day bias.'
)

doc.add_heading('Key Features', level=3)
features = [
    'Real-time risk percentage based on live Pikud HaOref data',
    'Poisson-based probability model with 5 weighted risk factors',
    'Iran vs. Hezbollah dual-front tracking with escalation detection',
    '24-hour safety timeline graph showing optimal nap windows',
    'User-adjustable factor weights for personalized risk assessment',
    '1,450+ city database with fuzzy matching and geolocation',
    'Pre-alert (cat:14) detection for Iranian ballistic missiles',
    'Full-screen visual threat overlay (no audio \u2014 users may be sleeping)',
    'Hebrew + English with full RTL/LTR support',
    'PWA installable \u2014 works offline with service worker caching',
    'Animated WebGL shader background (Three.js, lazy-loaded)',
    'Glass morphism UI with backdrop blur effects',
]
for f in features:
    add_bullet(doc, f)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 2. HOW THE RISK IS CALCULATED
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('2. How the Risk is Calculated', level=1)

doc.add_paragraph(
    'This is the heart of the application. The risk engine takes real alert data, computes '
    'five independent risk factors, normalizes each to a 0\u2013100% scale, and combines them '
    'using user-adjustable weights. The result is a single percentage representing the chance '
    'that at least one rocket alert will interrupt the user\'s nap.'
)

# 2.1 Poisson
doc.add_heading('2.1 The Core Statistical Model (Poisson Process)', level=2)

doc.add_paragraph(
    'We model rocket alerts as a Poisson process \u2014 random events occurring at a rate '
    'that can be estimated from recent history. From the civilian\'s perspective, the exact '
    'timing of the next attack is unpredictable, but the average rate can be computed from '
    'observed data.'
)

doc.add_paragraph(
    'The probability of at least one alert during a nap of duration d minutes, given an '
    'average interval of \u03BB minutes between alerts:'
)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('P(interruption) = 1 \u2212 e^(\u2212d/\u03BB)')
run.bold = True
run.font.size = Pt(14)
run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

doc.add_paragraph(
    'This is the exponential CDF (Cumulative Distribution Function). It gives the probability '
    'that the waiting time until the next event is less than d minutes.'
)

doc.add_paragraph('Example calculation:')
add_bullet(doc, 'Average interval between alerts: \u03BB = 30 minutes')
add_bullet(doc, 'Nap duration: d = 45 minutes')
add_bullet(doc, 'P = 1 \u2212 e^(\u221245/30) = 1 \u2212 e^(\u22121.5) = 1 \u2212 0.223 = 77.7%')

doc.add_paragraph(
    'Why Poisson? Rocket attacks are effectively random from the civilian\'s perspective. '
    'While military intelligence may predict attack windows, the average citizen cannot. '
    'The Poisson model captures this uncertainty while leveraging the observable rate.'
)

doc.add_paragraph(
    'The average interval \u03BB is calculated from recent alerts in the user\'s selected zone. '
    'The engine uses an expanding window strategy: it first checks the last 6 hours, then '
    '24 hours, then 72 hours, then all available data \u2014 using whichever window has at '
    'least 2 alerts for a meaningful interval calculation. If no alerts exist, \u03BB defaults '
    'to 720 minutes (12 hours), yielding a low baseline risk.'
)

# 2.2 Five Risk Factors
doc.add_heading('2.2 The Five Risk Factors', level=2)

doc.add_paragraph(
    'The raw Poisson probability is one of five factors that contribute to the final risk score. '
    'Each factor captures a different dimension of threat assessment:'
)

add_table(doc,
    ['Factor', 'Default Weight', 'What it Measures'],
    [
        ['Core statistical model', '40%', 'Base Poisson probability from alert frequency in the zone'],
        ['Trend factor', '15%', 'Is alert frequency increasing or decreasing over recent hours?'],
        ['Recency factor', '20%', 'How recently did the last alert happen? (exponential decay)'],
        ['Dual-front escalation', '15%', 'Are both Iran and Hezbollah firing simultaneously?'],
        ['Time-of-day bias', '10%', 'Historical attack patterns by hour of day'],
    ]
)

doc.add_paragraph()
doc.add_paragraph(
    'Each factor produces a "module risk" value between 0 and 1, which represents how concerning '
    'that particular signal is. These are then combined via weighted sum to produce the final percentage. '
    'Users can adjust the weights through sliders in the "How it\'s calculated" panel.'
)

# 2.3 Trend
doc.add_heading('2.3 Trend Factor', level=2)

doc.add_paragraph(
    'The trend factor detects whether alert frequency is accelerating or declining:'
)

add_bullet(doc, 'Count alerts in the last 3 hours (last3h)')
add_bullet(doc, 'Count alerts in the 3 hours before that (prior3h, i.e., 3\u20136 hours ago)')
add_bullet(doc, 'If last3h > prior3h \u00D7 1.3 \u2192 "increasing" \u2192 multiplier = 1.4')
add_bullet(doc, 'If last3h < prior3h \u00D7 0.7 \u2192 "decreasing" \u2192 multiplier = 0.6')
add_bullet(doc, 'Otherwise \u2192 "stable" \u2192 multiplier = 1.0')

doc.add_paragraph('Normalized to 0\u20131 scale:')
add_code_block(doc, 'trendModuleRisk = (multiplier - 0.6) / (1.4 - 0.6)')

doc.add_paragraph(
    'This means: increasing trend \u2192 moduleRisk = 1.0 (maximum concern), '
    'stable \u2192 0.5, decreasing \u2192 0.0 (minimum concern).'
)

# 2.4 Recency
doc.add_heading('2.4 Recency Factor', level=2)

doc.add_paragraph(
    'The recency factor captures the intuition that if an alert just happened, another is more '
    'likely soon (attack barrages tend to cluster). The formula uses exponential decay:'
)

add_code_block(doc, 'recencyMultiplier = 0.5 + 1.5 \u00D7 e^(-minutesSinceLast / 60)')

doc.add_paragraph('This produces:')

add_table(doc,
    ['Time Since Last Alert', 'Multiplier', 'Interpretation'],
    [
        ['Just now (0 min)', '\u2248 2.0', 'Very high risk \u2014 likely part of an active barrage'],
        ['30 minutes ago', '\u2248 1.11', 'Slightly elevated \u2014 recent activity'],
        ['1 hour ago', '\u2248 1.05', 'Near baseline'],
        ['3 hours ago', '\u2248 0.57', 'Low \u2014 extended quiet period'],
        ['6+ hours ago', '\u2248 0.50', 'Minimum \u2014 prolonged calm'],
    ]
)

doc.add_paragraph()
doc.add_paragraph('Normalized to 0\u20131:')
add_code_block(doc, 'recencyModuleRisk = (multiplier - 0.5) / (2.0 - 0.5)')

# 2.5 Dual-Front
doc.add_heading('2.5 Dual-Front Escalation', level=2)

doc.add_paragraph(
    'Israel faces two simultaneous threats: Iranian ballistic missiles (targeting central/south) '
    'and Hezbollah rockets from Lebanon (targeting the north). When both fronts are active '
    'simultaneously, the risk multiplies significantly.'
)

doc.add_paragraph(
    'The system checks the last 30 minutes for alerts from each front:'
)

add_table(doc,
    ['Escalation Level', 'Condition', 'Risk Multiplier'],
    [
        ['Calm', 'Both fronts quiet (no alerts in 30 min)', '1.0\u00D7'],
        ['Single front', 'Only Iran OR only Hezbollah active', '1.0\u00D7'],
        ['Dual front', 'Both Iran AND Hezbollah firing', '1.5\u00D7'],
        ['Heavy barrage', '5+ alerts from one front in 30 min', '2.0\u00D7'],
        ['Heavy barrage (both)', '5+ alerts from BOTH fronts in 30 min', '2.5\u00D7'],
    ]
)

doc.add_paragraph()
doc.add_paragraph('Normalized to 0\u20131:')
add_code_block(doc, 'dualFrontModuleRisk = (multiplier - 1.0) / (2.5 - 1.0)')

# 2.6 Time of Day
doc.add_heading('2.6 Time-of-Day Bias', level=2)

doc.add_paragraph(
    'Based on observed patterns from the first week of the Iran war:'
)

add_table(doc,
    ['Hour Range', 'Multiplier', 'Rationale'],
    [
        ['1:00 \u2013 5:00 AM', '1.3\u00D7', 'Iran prefers nighttime attacks \u2014 ballistic missiles tracked against dark sky'],
        ['6:00 \u2013 8:00 AM', '1.1\u00D7', 'Dawn \u2014 moderate risk, transition period'],
        ['9:00 AM \u2013 3:00 PM', '0.8\u00D7', 'Midday \u2014 historically quieter'],
        ['4:00 \u2013 7:00 PM', '1.0\u00D7', 'Afternoon/evening \u2014 baseline'],
        ['8:00 PM \u2013 12:00 AM', '1.2\u00D7', 'Night \u2014 elevated risk'],
    ]
)

doc.add_paragraph()
doc.add_paragraph('Normalized to 0\u20131:')
add_code_block(doc, 'timeOfDayModuleRisk = (multiplier - 0.8) / (1.3 - 0.8)')

# 2.7 Weighted Final
doc.add_heading('2.7 Weighted Final Calculation', level=2)

doc.add_paragraph('The final risk percentage is computed as:')

add_code_block(doc,
    '1. Normalize all weights to sum to 1.0:\n'
    '   w_i = weight_i / sum(all_weights)\n'
    '\n'
    '2. Compute weighted sum:\n'
    '   weightedRisk = core_risk * w_core\n'
    '                + trend_risk * w_trend\n'
    '                + recency_risk * w_recency\n'
    '                + dualFront_risk * w_dualFront\n'
    '                + timeOfDay_risk * w_timeOfDay\n'
    '\n'
    '3. Convert to percentage:\n'
    '   riskPercent = clamp(weightedRisk * 100, 0, 99)'
)

doc.add_paragraph(
    'The result is clamped to 0\u201399%. We never show 100% because there is always some '
    'chance of quiet, no matter how active the situation. Users can adjust weights via sliders '
    'in the "How it\'s calculated" expandable panel.'
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 3. IRAN vs HEZBOLLAH CLASSIFICATION
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('3. Iran vs Hezbollah Classification', level=1)

doc.add_heading('3.1 The Problem', level=2)

doc.add_paragraph(
    'The Pikud HaOref API does not indicate WHO fired the rocket. It simply reports '
    '"rocket alert in city X" with a list of affected cities. To track the dual-front situation '
    'and apply the escalation multiplier, we need to classify each alert by its likely source.'
)

doc.add_heading('3.2 Our Solution \u2014 Three Signals', level=2)

doc.add_heading('Signal 1: Pre-Alert Correlation (Definitive)', level=3)

doc.add_paragraph(
    'Iranian ballistic missiles fly approximately 1,200 km from Iran to Israel, taking about '
    '12 minutes of flight time. The Home Front Command system detects the launch via satellite '
    'early warning and sends a category 14 (pre-alert / early warning) notification approximately '
    '2 minutes before impact. When the missiles enter Israeli airspace, the standard category 1 '
    '(rockets and missiles) alert follows.'
)

doc.add_paragraph(
    'Hezbollah rockets from Lebanon fly only 5\u201340 km with 0\u201330 seconds of flight time. '
    'It is physically impossible to send an early warning for these \u2014 the alert and impact '
    'happen nearly simultaneously.'
)

doc.add_paragraph('Therefore:')
add_bullet(doc, 'Category 14 alert = 100% Iran (definitive)')
add_bullet(doc, 'Any category 1 alert within 4 minutes of a category 14 = same Iranian barrage')
add_bullet(doc, 'An in-memory pre-alert tracker maintains recent cat:14 events with 4-minute expiry windows')

doc.add_heading('Signal 2: Volume Pattern', level=3)
add_bullet(doc, 'Iran launches massive barrages: 20+ cities in a single alert wave')
add_bullet(doc, 'Hezbollah typically hits 1\u201310 cities per alert')
add_bullet(doc, 'If an alert contains 20+ cities and hits central/south Israel \u2192 classified as Iran')

doc.add_heading('Signal 3: Geography (Fallback)', level=3)

doc.add_paragraph(
    'When neither pre-alert correlation nor volume pattern is conclusive, we fall back to geography:'
)

add_table(doc,
    ['Region', 'Classification', 'Cities/Areas'],
    [
        ['Northern Israel', 'Hezbollah', 'Kiryat Shmona, Nahariya, Metula, Safed, Tiberias, all Galilee, Golan Heights'],
        ['Central/South Israel', 'Iran', 'Tel Aviv, Jerusalem, Ashdod, Be\'er Sheva, Rishon LeZion, Rehovot, Modiin'],
        ['Haifa area', 'Both possible', 'Haifa, Kiryat Ata, Kiryat Bialik \u2014 in range of both Iran and Hezbollah'],
    ]
)

doc.add_paragraph()
doc.add_paragraph(
    'The system maintains a comprehensive list of ~150 northern community keywords '
    '(kibbutzim, moshavim, small towns) for accurate classification of settlements that '
    'may not appear in the main zone database. If a city is not recognized and is not in the '
    'north, it defaults to "central/south" (Iran) since most of Israel\'s population is in '
    'this region.'
)

doc.add_paragraph(
    'When an alert hits both northern AND central/southern cities, it is classified as '
    '"dual" \u2014 indicating coordinated multi-front activity.'
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 4. DATA PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('4. Data Pipeline', level=1)

doc.add_heading('4.1 Data Sources', level=2)

add_table(doc,
    ['Source', 'Endpoint', 'Update Frequency'],
    [
        ['Real-time alerts', 'oref.org.il/.../alerts.json', 'Polled every 5 seconds'],
        ['24h history', 'oref.org.il/.../AlertsHistory.json', 'On app startup'],
        ['Historical archive', 'oref.org.il/.../GetAlarmsHistory.aspx', 'One-time seed (date range)'],
    ]
)

doc.add_paragraph()
doc.add_paragraph(
    'All Oref API endpoints require specific HTTP headers to avoid being blocked:'
)

add_code_block(doc,
    'Referer: https://www.oref.org.il/\n'
    'X-Requested-With: XMLHttpRequest\n'
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...'
)

doc.add_paragraph(
    'IMPORTANT: The Oref API is geo-blocked to Israeli IP addresses. The backend polling '
    'server must run from an Israeli IP (e.g., GCP me-west1 region or an Israeli VPS).'
)

doc.add_heading('4.2 Data Flow', level=2)

doc.add_paragraph('The data pipeline operates in four stages:')

p = doc.add_paragraph()
run = p.add_run('Stage 1 \u2014 Startup Seed: ')
run.bold = True
p.add_run('On app startup, the server fetches 7 days of history from the Oref history API '
          'and the Tzofar historical archive. This populates the alert store with baseline data.')

p = doc.add_paragraph()
run = p.add_run('Stage 2 \u2014 Continuous Polling: ')
run.bold = True
p.add_run('Every 5 seconds, the /api/poll endpoint hits the Oref real-time API. If an active '
          'alert is found, it is classified by source, deduplicated by ID, validated (timestamp, '
          'category), and appended to the JSON file store.')

p = doc.add_paragraph()
run = p.add_run('Stage 3 \u2014 SSE Broadcasting: ')
run.bold = True
p.add_run('New alerts are pushed to connected browsers via Server-Sent Events (SSE). Each '
          'browser maintains a persistent EventSource connection to /api/sse. When new data '
          'arrives, the client recalculates risk immediately without waiting for the next poll.')

p = doc.add_paragraph()
run = p.add_run('Stage 4 \u2014 Periodic Refresh: ')
run.bold = True
p.add_run('Every 30 seconds (every 6th poll cycle), the client fetches the full alert store '
          'from /api/alerts?hours=168. This serves as a consistency check and catches any alerts '
          'that may have been missed by SSE.')

doc.add_heading('4.3 Alert Categories', level=2)

add_table(doc,
    ['Category', 'Type', 'How We Use It'],
    [
        ['1', 'Rockets & missiles', 'PRIMARY \u2014 drives all risk calculations'],
        ['2', 'Hostile aircraft intrusion', 'Also drives risk calculations (treated same as cat:1)'],
        ['13', 'All clear / end of alert', 'FILTERED OUT \u2014 not a threat, not stored'],
        ['14', 'Pre-alert / early warning', 'Stored for Iran classification signal, NOT counted as threat in risk engine'],
    ]
)

doc.add_paragraph()
doc.add_paragraph(
    'Only category 1 and 2 alerts ("threat alerts") are used in the risk calculation. '
    'Category 14 alerts are stored and used exclusively for the Iran/Hezbollah classification '
    'system. Category 13 alerts are discarded entirely.'
)

doc.add_heading('4.4 Data Volume (Feb 28 \u2013 Mar 8, 2026)', level=2)

add_bullet(doc, '~1,409 total alerts stored after filtering')
add_bullet(doc, '~554 actual threat alerts (category 1 + category 2)')
add_bullet(doc, '~855 pre-alerts (category 14, used for classification only)')
add_bullet(doc, '933 unique cities affected')
add_bullet(doc, 'Peak activity window: 20:00\u201323:00 Israel time')
add_bullet(doc, 'Storage format: JSON file (data/alerts.json), max 10,000 alerts, 10 MB cap')

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 5. ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('5. Architecture', level=1)

doc.add_heading('5.1 Tech Stack', level=2)

add_table(doc,
    ['Technology', 'Role', 'Notes'],
    [
        ['Next.js 14', 'Full-stack framework', 'App Router, TypeScript strict mode'],
        ['Tailwind CSS', 'Styling', 'Dark theme, glass morphism, RTL utilities'],
        ['Recharts', 'Charts', 'Safety timeline graph (lazy-loaded)'],
        ['Three.js', 'Visual effects', 'WebGL shader aurora background (lazy-loaded)'],
        ['Server-Sent Events', 'Real-time', 'Pushes new alerts to connected browsers'],
        ['File-based JSON store', 'Database', 'data/alerts.json (Supabase migration planned)'],
    ]
)

doc.add_heading('5.2 Key Files', level=2)

add_table(doc,
    ['File', 'Purpose'],
    [
        ['src/lib/risk.ts', 'Core risk engine \u2014 Poisson model, weighted factors, optimal window finder'],
        ['src/lib/dual-front.ts', 'Iran/Hezbollah dual-front escalation detection'],
        ['src/lib/zones.ts', 'Zone matching, source classification, region grouping, ~150 northern keywords'],
        ['src/lib/zones-generated.ts', '1,450+ city database auto-generated from Pikud HaOref data'],
        ['src/lib/pre-alert-tracker.ts', 'In-memory cat:14 event correlation with 4-minute expiry'],
        ['src/lib/oref-client.ts', 'Oref API client with required headers and 5s timeout'],
        ['src/lib/alert-store.ts', 'File-based JSON alert storage with deduplication and size cap'],
        ['src/lib/types.ts', 'All TypeScript interfaces (Zone, Alert, RiskResult, etc.)'],
        ['src/app/page.tsx', 'Single-page app \u2014 all client state, SSE subscription, polling orchestration'],
        ['src/components/RiskDial.tsx', 'Animated SVG circular gauge with color-coded glow'],
        ['src/components/SafeNapGraph.tsx', '24-hour safety timeline chart (Recharts AreaChart)'],
        ['src/components/CalculationPanel.tsx', 'Expandable 5-factor breakdown with weight sliders'],
        ['src/components/ActiveThreatOverlay.tsx', 'Full-screen red alert overlay (visual only, no audio)'],
        ['src/components/DualFrontCard.tsx', 'Iran vs. Hezbollah activity bars with escalation badge'],
        ['src/components/InlineLocationPicker.tsx', 'Fuzzy search + quick chips + browser geolocation'],
        ['src/components/ui/AnimatedBackground.tsx', 'WebGL shader aurora background (Three.js)'],
    ]
)

doc.add_heading('5.3 Real-Time Data Flow', level=2)

add_code_block(doc,
    'Oref API  \u2500\u2500\u2500\u2192  /api/poll (every 5s)  \u2500\u2500\u2500\u2192  data/alerts.json\n'
    '                                            \u2502\n'
    '                                            \u251C\u2500\u2500\u2192  /api/sse  \u2500\u2500\u2500\u2192  Browser EventSource\n'
    '                                            \u2502\n'
    '                                            \u2514\u2500\u2500\u2192  /api/alerts  \u2500\u2500\u2500\u2192  Browser fetch (every 30s)'
)

doc.add_paragraph(
    'The browser maintains dual data channels: SSE for immediate new-alert notification, '
    'and periodic HTTP fetch as a consistency fallback. Risk recalculation is triggered by '
    'either channel when new data arrives, using a graphRecalcKey counter to avoid unnecessary '
    'recomputation.'
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 6. USER INTERFACE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('6. User Interface', level=1)

doc.add_heading('6.1 Single-Page Dashboard', level=2)

doc.add_paragraph(
    'The app uses a single-page architecture \u2014 no routing, no separate landing page. '
    'Users see everything immediately on load. The default view is "All of Israel" (national '
    'aggregate), with a CTA banner prompting users to select their specific location for '
    'more accurate zone-specific calculations.'
)

doc.add_heading('6.2 Key Components', level=2)

components = [
    ('Risk Dial', 'Large SVG circular gauge showing the risk percentage. Color transitions from green (\u226420%) through yellow (\u226440%) and orange (\u226460%) to red (>60%). Animated number counting with ease-out cubic interpolation. CSS drop-shadow glow matches the current risk color.'),
    ('Duration Buttons', 'Three preset buttons (20/45/90 minutes) plus a custom input with +/\u2212 stepper. 45 minutes is the default \u2014 approximately one full sleep cycle.'),
    ('Inline Location Picker', 'Fuzzy search across 1,450+ Israeli cities with Hebrew and English matching. Quick-access chips for Tel Aviv, Jerusalem, Haifa, and Be\'er Sheva. Browser geolocation button for automatic nearest-zone detection.'),
    ('Stats Cards', 'Four metric cards in a 2\u00D72 grid: time since last alert (live-ticking every second), average interval between alerts, 24-hour alert count, and trend direction (increasing/decreasing/stable with colored arrows).'),
    ('Dual-Front Card', 'Visualizes Iran and Hezbollah front activity with progress bars. Shows escalation level badge (Calm/Single Front/Dual Front/Heavy Barrage). Includes zone-specific alert counts when a non-national zone is selected.'),
    ('Safety Timeline Graph', '24-hour Recharts AreaChart showing safety percentage over time. The inverse of risk \u2014 higher is safer. Highlights the best nap window with a labeled vertical marker. Alert timestamps shown as reference dots on the x-axis.'),
    ('Calculation Panel', 'Expandable accordion showing all 5 risk factors. Each factor row shows: module risk (0\u2013100%), weight (adjustable slider), and resulted contribution. Helps users understand and customize how the final number is computed.'),
    ('Active Threat Overlay', 'Full-screen red overlay triggered when an alert matches the user\'s selected zone. Shows shelter countdown timer based on the zone\'s time-to-shelter value. Visual only \u2014 no audio (users may be sleeping). Auto-dismisses after 5 minutes. Pre-alerts show as yellow overlay with 3-minute auto-dismiss.'),
    ('Connection Status', 'Shows real-time connection state (Connected/Reconnecting/Offline), data freshness indicator (warns if data is >1 hour old), and total alert count.'),
]

for name, desc in components:
    p = doc.add_paragraph()
    run = p.add_run(f'{name}: ')
    run.bold = True
    p.add_run(desc)

doc.add_heading('6.3 Languages', level=2)

doc.add_paragraph(
    'The app supports Hebrew (default, RTL) and English (LTR). A toggle button in the top-left '
    'corner switches between languages. The entire layout direction flips \u2014 the HTML dir '
    'attribute and Tailwind RTL utilities handle text alignment, margin directions, and '
    'border placement. All user-facing strings come from i18n translation files (src/lib/i18n/he.ts '
    'and en.ts). Arabic support is planned but not yet implemented.'
)

doc.add_heading('6.4 Visual Design', level=2)

add_bullet(doc, 'Dark navy theme (#0f172a) \u2014 designed for nighttime/bedtime use, easy on the eyes')
add_bullet(doc, 'Animated WebGL shader background \u2014 warm amber aurora streaks via Three.js fragment shader, 30fps capped, lazy-loaded')
add_bullet(doc, 'Glass morphism cards \u2014 semi-transparent backgrounds with backdrop-filter: blur(12px)')
add_bullet(doc, 'Staggered fade-in animations \u2014 7-stage cascading entrance on page load (200\u2013600ms delays)')
add_bullet(doc, 'Risk dial glow \u2014 CSS drop-shadow color matches risk level (green/yellow/orange/red)')
add_bullet(doc, 'Mobile-first \u2014 designed for 375px+ width, 85%+ expected mobile users')

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 7. SECURITY
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('7. Security Considerations', level=1)

security_items = [
    ('No API keys exposed', 'The Oref API uses HTTP headers for authentication, not API keys. No secrets are stored in the codebase or environment variables.'),
    ('XSS prevention', 'All external data (alert cities, titles) is rendered through React\'s JSX templating, which auto-escapes HTML entities. No use of dangerouslySetInnerHTML anywhere in the codebase.'),
    ('Input validation', 'API route parameters are validated: the "hours" query param is parsed as a positive number and capped at 168 (7 days). Invalid inputs return appropriate error responses.'),
    ('Data corruption recovery', 'The alert store wraps all file reads in try-catch blocks. If alerts.json is corrupted or contains invalid JSON, the system falls back to an empty array rather than crashing.'),
    ('File size cap', 'The alert store enforces a 10 MB file size limit and a 10,000 alert maximum. Excess alerts are trimmed from the oldest.'),
    ('No user authentication', 'The app is read-only from the user\'s perspective. There are no user accounts, no personal data stored, and no write operations from the client.'),
]

for title, desc in security_items:
    p = doc.add_paragraph()
    run = p.add_run(f'{title}: ')
    run.bold = True
    p.add_run(desc)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Production TODOs: ')
run.bold = True
p.add_run('Rate limiting on API routes, migration to Supabase/PostgreSQL database, '
          'HTTPS enforcement, Content Security Policy headers, environment-based configuration.')

# ══════════════════════════════════════════════════════════════════════════════
# 8. PERFORMANCE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('8. Performance Optimizations', level=1)

perf_items = [
    ('Three.js lazy loading', 'The WebGL shader background is loaded via dynamic import(\'three\'). Three.js (~370 KB) lands in a separate chunk and does not affect the 137 KB first-load JS bundle.'),
    ('Recharts lazy loading', 'The SafeNapGraph component is loaded via next/dynamic with a skeleton placeholder, preventing chart code from blocking initial render.'),
    ('Graph recalculation optimization', 'The safety timeline graph (which runs 25 risk calculations for 24 hours of 15-minute slots) only recalculates when alert data actually changes, not on every 30-second timer tick. A graphRecalcKey state counter tracks real data changes.'),
    ('Separate timer tiers', 'Two independent timers: a 1-second tick for live-updating stat cards (time since last alert), and an on-demand recalculation for the risk dial and graph. This prevents expensive risk calculations every second.'),
    ('Smart data diffing', 'The fetchAlerts callback compares the new JSON response string against the previous one. If identical, it skips setState entirely, preventing unnecessary React re-renders.'),
    ('Merged polling intervals', 'A single setInterval runs every 5 seconds for Oref API polling. Every 6th tick (30 seconds), it also refreshes the alert store. This replaces two separate intervals.'),
    ('30fps shader cap', 'The WebGL animation loop skips frames to maintain 30fps, reducing GPU usage. It also uses powerPreference: \'low-power\' and caps pixel ratio at 1.5\u00D7.'),
    ('Reduced motion support', 'The shader background is entirely skipped if the user has prefers-reduced-motion: reduce enabled, saving GPU resources for accessibility-conscious users.'),
    ('First-load JS', '137 KB total first-load JavaScript (after gzip). Three.js and Recharts are in separate lazy chunks.'),
]

for title, desc in perf_items:
    p = doc.add_paragraph()
    run = p.add_run(f'{title}: ')
    run.bold = True
    p.add_run(desc)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# 9. ROADMAP
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('9. Future Roadmap', level=1)

roadmap = [
    ('Supabase database', 'Replace the file-based JSON store with Supabase (PostgreSQL). File I/O on every poll is not scalable for concurrent users.'),
    ('Deploy to production', 'Frontend on Vercel, alert poller on an Israeli-IP server (GCP me-west1 or Israeli VPS).'),
    ('Arabic language support', 'Third language with full RTL support. Translation files are structured for easy addition.'),
    ('Push notifications', 'Optional browser push notifications for alerts in the user\'s zone (with explicit consent).'),
    ('Historical data expansion', 'Seed the full Tzofar archive for deeper historical analysis and more accurate time-of-day patterns.'),
    ('Region-specific time-of-day', 'Train time-of-day multipliers on real zone-specific data rather than using a single national pattern.'),
    ('Live user count', 'Show how many people are currently checking their nap risk.'),
]

for title, desc in roadmap:
    p = doc.add_paragraph()
    run = p.add_run(f'{title}: ')
    run.bold = True
    p.add_run(desc)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# APPENDIX A: MATH IN DETAIL
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('Appendix A: The Math in Detail', level=1)

doc.add_paragraph(
    'Three worked examples showing the complete calculation path from raw data to final percentage.'
)

# Example 1
doc.add_heading('Example 1: Quiet Night (Low Risk)', level=2)
doc.add_paragraph('Scenario: No alerts in the user\'s zone for 6 hours, nap duration = 30 minutes')

add_code_block(doc,
    'Step 1: Zone filtering\n'
    '  Zone: Ashdod\n'
    '  Alerts in zone (last 6h): 0\n'
    '  Expanding window to 24h: 2 alerts found\n'
    '  Avg interval: 720 min (12h, calculated from the 2 alerts)\n'
    '\n'
    'Step 2: Core Poisson probability\n'
    '  P = 1 - e^(-30/720) = 1 - e^(-0.0417) = 1 - 0.959 = 0.041 (4.1%)\n'
    '\n'
    'Step 3: Trend factor\n'
    '  last3h = 0, prior3h = 0\n'
    '  Trend: stable -> multiplier = 1.0\n'
    '  moduleRisk = (1.0 - 0.6) / 0.8 = 0.5\n'
    '\n'
    'Step 4: Recency factor\n'
    '  minutesSinceLast = 360 (6 hours)\n'
    '  multiplier = 0.5 + 1.5 * e^(-360/60) = 0.5 + 1.5 * 0.0025 = 0.504\n'
    '  moduleRisk = (0.504 - 0.5) / 1.5 = 0.003\n'
    '\n'
    'Step 5: Dual-front factor\n'
    '  No alerts in 30 min -> calm -> multiplier = 1.0\n'
    '  moduleRisk = (1.0 - 1.0) / 1.5 = 0.0\n'
    '\n'
    'Step 6: Time-of-day factor\n'
    '  Hour: 2 AM -> multiplier = 1.3\n'
    '  moduleRisk = (1.3 - 0.8) / 0.5 = 1.0\n'
    '\n'
    'Step 7: Weighted combination\n'
    '  = 0.041 * 0.4 + 0.5 * 0.15 + 0.003 * 0.2 + 0.0 * 0.15 + 1.0 * 0.1\n'
    '  = 0.0164 + 0.075 + 0.0006 + 0.0 + 0.1\n'
    '  = 0.192\n'
    '\n'
    'Final: 19.2% risk -> "Very low risk - nap peacefully"'
)

# Example 2
doc.add_heading('Example 2: Active Barrage (Very High Risk)', level=2)
doc.add_paragraph('Scenario: Alerts every 15 minutes in the zone, last one 5 min ago, nap = 90 minutes, dual front active')

add_code_block(doc,
    'Step 1: Zone filtering\n'
    '  Zone: Tel Aviv - Center\n'
    '  Alerts in zone (last 6h): 24\n'
    '  Avg interval: 15 min\n'
    '\n'
    'Step 2: Core Poisson probability\n'
    '  P = 1 - e^(-90/15) = 1 - e^(-6.0) = 1 - 0.0025 = 0.9975 (99.75%)\n'
    '\n'
    'Step 3: Trend factor\n'
    '  last3h = 12, prior3h = 6 -> 12 > 6*1.3=7.8 -> increasing\n'
    '  multiplier = 1.4, moduleRisk = 1.0\n'
    '\n'
    'Step 4: Recency factor\n'
    '  minutesSinceLast = 5\n'
    '  multiplier = 0.5 + 1.5 * e^(-5/60) = 0.5 + 1.5 * 0.920 = 1.880\n'
    '  moduleRisk = (1.880 - 0.5) / 1.5 = 0.920\n'
    '\n'
    'Step 5: Dual-front factor\n'
    '  Both fronts active, 5+ on Iran -> heavy barrage\n'
    '  multiplier = 2.0, moduleRisk = (2.0 - 1.0) / 1.5 = 0.667\n'
    '\n'
    'Step 6: Time-of-day factor\n'
    '  Hour: 10 PM -> multiplier = 1.2\n'
    '  moduleRisk = (1.2 - 0.8) / 0.5 = 0.8\n'
    '\n'
    'Step 7: Weighted combination\n'
    '  = 0.9975 * 0.4 + 1.0 * 0.15 + 0.920 * 0.2 + 0.667 * 0.15 + 0.8 * 0.1\n'
    '  = 0.399 + 0.15 + 0.184 + 0.100 + 0.08\n'
    '  = 0.913\n'
    '\n'
    'Final: 91.3% risk -> "Almost certain interruption"'
)

# Example 3
doc.add_heading('Example 3: Moderate Activity (Medium Risk)', level=2)
doc.add_paragraph('Scenario: Alerts every 2 hours, last one 45 min ago, nap = 45 minutes, single front')

add_code_block(doc,
    'Step 1: Zone filtering\n'
    '  Zone: Jerusalem - Center\n'
    '  Alerts in zone (last 6h): 3\n'
    '  Avg interval: 120 min (2 hours)\n'
    '\n'
    'Step 2: Core Poisson probability\n'
    '  P = 1 - e^(-45/120) = 1 - e^(-0.375) = 1 - 0.687 = 0.313 (31.3%)\n'
    '\n'
    'Step 3: Trend factor\n'
    '  last3h = 2, prior3h = 1 -> 2 > 1*1.3=1.3 -> increasing\n'
    '  multiplier = 1.4, moduleRisk = 1.0\n'
    '\n'
    'Step 4: Recency factor\n'
    '  minutesSinceLast = 45\n'
    '  multiplier = 0.5 + 1.5 * e^(-45/60) = 0.5 + 1.5 * 0.472 = 1.208\n'
    '  moduleRisk = (1.208 - 0.5) / 1.5 = 0.472\n'
    '\n'
    'Step 5: Dual-front factor\n'
    '  Single front only -> multiplier = 1.0\n'
    '  moduleRisk = 0.0\n'
    '\n'
    'Step 6: Time-of-day factor\n'
    '  Hour: 2 PM -> multiplier = 0.8\n'
    '  moduleRisk = 0.0\n'
    '\n'
    'Step 7: Weighted combination\n'
    '  = 0.313 * 0.4 + 1.0 * 0.15 + 0.472 * 0.2 + 0.0 * 0.15 + 0.0 * 0.1\n'
    '  = 0.125 + 0.15 + 0.094 + 0.0 + 0.0\n'
    '  = 0.369\n'
    '\n'
    'Final: 36.9% risk -> "Moderate risk - stay prepared"'
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# APPENDIX B: i18n STRING TABLE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_heading('Appendix B: Complete i18n String Table', level=1)

doc.add_paragraph(
    'All user-facing strings are stored in translation files. Below is the complete table '
    'of Hebrew and English strings used throughout the application.'
)

i18n_data = [
    ('appName', '\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD?', 'Can I Nap?'),
    ('tagline', '\u05D1\u05D3\u05D5\u05E7 \u05D0\u05DD \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD \u05D1\u05DC\u05D9 \u05E9\u05D0\u05D6\u05E2\u05E7\u05D4 \u05EA\u05E2\u05D9\u05E8 \u05D0\u05D5\u05EA\u05DA', 'Check if you can nap without an alert waking you up'),
    ('riskLabel', '\u05E1\u05D9\u05DB\u05D5\u05D9 \u05DC\u05D4\u05E4\u05E8\u05E2\u05D4', 'chance of interruption'),
    ('realTimeAssessment', '\u05D4\u05E2\u05E8\u05DB\u05EA \u05E1\u05D9\u05DB\u05D5\u05DF \u05EA\u05E0\u05D5\u05DE\u05D4 \u05D1\u05D6\u05DE\u05DF \u05D0\u05DE\u05EA', 'Real-time nap risk assessment'),
    ('timeSinceLast', '\u05D6\u05DE\u05DF \u05DE\u05D4\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4', 'Time since last'),
    ('avgInterval', '\u05DE\u05E8\u05D5\u05D5\u05D7 \u05DE\u05DE\u05D5\u05E6\u05E2', 'Avg. interval'),
    ('alertCount24h', '\u05D0\u05D6\u05E2\u05E7\u05D5\u05EA (24 \u05E9\u05E2\u05D5\u05EA)', 'Alerts (24h)'),
    ('trend', '\u05DE\u05D2\u05DE\u05D4', 'Trend'),
    ('increasing', '\u05E2\u05D5\u05DC\u05D4', 'Increasing'),
    ('decreasing', '\u05D9\u05D5\u05E8\u05D3', 'Decreasing'),
    ('stable', '\u05D9\u05E6\u05D9\u05D1', 'Stable'),
    ('duration', '\u05DE\u05E9\u05DA \u05D4\u05EA\u05E0\u05D5\u05DE\u05D4', 'Nap duration'),
    ('minutes', '\u05D3\u05E7\u05D5\u05EA', 'minutes'),
    ('powerNap', '\u05EA\u05E0\u05D5\u05DE\u05EA \u05D8\u05E2\u05D9\u05E0\u05D4', 'Power nap'),
    ('fullCycle', '\u05DE\u05D7\u05D6\u05D5\u05E8 \u05DE\u05DC\u05D0', 'Full cycle'),
    ('location', '\u05DE\u05D9\u05E7\u05D5\u05DD', 'Location'),
    ('allOfIsrael', '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC', 'All of Israel'),
    ('searchPlaceholder', '\u05D7\u05E4\u05E9/\u05D9 \u05D0\u05EA \u05D4\u05E2\u05D9\u05E8 \u05E9\u05DC\u05DA...', 'Search for your city...'),
    ('improveAccuracy', '\u05E9\u05E4\u05E8 \u05D3\u05D9\u05D5\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 \u05D1\u05D7\u05D9\u05E8\u05EA \u05D4\u05DE\u05D9\u05E7\u05D5\u05DD \u05E9\u05DC\u05DA', 'Improve accuracy by choosing your location'),
    ('iranFront', '\u05D7\u05D6\u05D9\u05EA \u05D0\u05D9\u05E8\u05D0\u05DF', 'Iran front'),
    ('hezbollahFront', '\u05D7\u05D6\u05D9\u05EA \u05D7\u05D9\u05D6\u05D1\u05D0\u05DC\u05D4', 'Hezbollah front'),
    ('dualFrontActive', '\u05E9\u05EA\u05D9 \u05D7\u05D6\u05D9\u05EA\u05D5\u05EA \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA', 'DUAL FRONT ACTIVE'),
    ('whenSafest', '\u05DE\u05EA\u05D9 \u05D4\u05D6\u05DE\u05DF \u05D4\u05DB\u05D9 \u05D1\u05D8\u05D5\u05D7 \u05DC\u05E0\u05DE\u05E0\u05DD?', 'When is the safest time to nap?'),
    ('howCalculated', '\u05D0\u05D9\u05DA \u05D6\u05D4 \u05DE\u05D7\u05D5\u05E9\u05D1', 'How it\'s calculated'),
    ('adjustWeights', '\u05D4\u05EA\u05D0\u05DD \u05DE\u05E9\u05E7\u05D5\u05DC\u05D5\u05EA', 'Adjust weights'),
    ('factorCore', '\u05DE\u05D5\u05D3\u05DC \u05E1\u05D8\u05D8\u05D9\u05E1\u05D8\u05D9 \u05D1\u05E1\u05D9\u05E1\u05D9', 'Core statistical model'),
    ('factorTrend', '\u05D2\u05D5\u05E8\u05DD \u05DE\u05D2\u05DE\u05D4', 'Trend factor'),
    ('factorRecency', '\u05D2\u05D5\u05E8\u05DD \u05E2\u05D3\u05DB\u05E0\u05D9\u05D5\u05EA', 'Recency factor'),
    ('factorDualFront', '\u05D4\u05E1\u05DC\u05DE\u05EA \u05D7\u05D6\u05D9\u05EA \u05DB\u05E4\u05D5\u05DC\u05D4', 'Dual-front escalation'),
    ('factorTimeOfDay', '\u05D4\u05D8\u05D9\u05D9\u05EA \u05E9\u05E2\u05D4 \u05D1\u05D9\u05D5\u05DD', 'Time-of-day bias'),
    ('alertActive', '\u05D0\u05D6\u05E2\u05E7\u05D4 \u05E4\u05E2\u05D9\u05DC\u05D4 \u2014 \u05D4\u05D9\u05DB\u05E0\u05E1\u05D5 \u05DC\u05DE\u05E8\u05D7\u05D1 \u05D4\u05DE\u05D5\u05D2\u05DF', 'ALERT ACTIVE \u2014 SEEK SHELTER'),
    ('preAlert', '\u05D0\u05D6\u05E2\u05E7\u05D4 \u05DE\u05D5\u05E7\u05D3\u05DE\u05EA \u05D6\u05D5\u05D4\u05EA\u05D4...', 'Pre-alert detected \u2014 missile alert may follow in ~2 minutes'),
    ('disclaimer', '\u05DC\u05DE\u05D9\u05D3\u05E2 \u05D1\u05DC\u05D1\u05D3. \u05EA\u05DE\u05D9\u05D3 \u05E4\u05E2\u05DC\u05D5 \u05DC\u05E4\u05D9 \u05D4\u05E0\u05D7\u05D9\u05D5\u05EA \u05E4\u05D9\u05E7\u05D5\u05D3 \u05D4\u05E2\u05D5\u05E8\u05E3.', 'For informational purposes only. Always follow Home Front Command instructions.'),
    ('share', '\u05E9\u05EA\u05E4\u05D5', 'Share'),
    ('copied', '\u05D4\u05D5\u05E2\u05EA\u05E7!', 'Copied!'),
    ('veryLowRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05E0\u05DE\u05D5\u05DA \u05DE\u05D0\u05D5\u05D3 \u2014 \u05EA\u05E0\u05D5\u05DE\u05D4 \u05E9\u05E7\u05D8\u05D4', 'Very low risk \u2014 nap peacefully'),
    ('lowRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05E0\u05DE\u05D5\u05DA \u2014 \u05E1\u05D1\u05D9\u05E8 \u05E9\u05D9\u05D4\u05D9\u05D4 \u05E9\u05E7\u05D8', 'Low risk \u2014 likely to be quiet'),
    ('moderateRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05D1\u05D9\u05E0\u05D5\u05E0\u05D9 \u2014 \u05EA\u05D4\u05D9\u05D4 \u05DE\u05D5\u05DB\u05DF', 'Moderate risk \u2014 stay prepared'),
    ('highRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05D2\u05D1\u05D5\u05D4 \u2014 \u05EA\u05E0\u05D5\u05DE\u05D4 \u05E7\u05E6\u05E8\u05D4 \u05D1\u05DC\u05D1\u05D3', 'High risk \u2014 short naps only'),
    ('veryHighRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05D2\u05D1\u05D5\u05D4 \u05DE\u05D0\u05D5\u05D3 \u2014 \u05DC\u05D0 \u05DE\u05D5\u05DE\u05DC\u05E5 \u05DC\u05E0\u05DE\u05E0\u05DD', 'Very high risk \u2014 napping not recommended'),
    ('criticalRisk', '\u05E1\u05D9\u05DB\u05D5\u05DF \u05E7\u05E8\u05D9\u05D8\u05D9 \u2014 \u05D4\u05D9\u05E9\u05D0\u05E8 \u05E2\u05E8\u05E0\u05D9', 'Critical risk \u2014 stay alert'),
    ('madeIn', '\u05E0\u05D5\u05E6\u05E8 \u05E2\u05DD \u05E7\u05E4\u05D4 \u05D1\u05D0\u05E9\u05D3\u05D5\u05D3', 'Made with coffee in Ashdod'),
]

# Split into chunks to fit page width
chunk_size = 20
for chunk_start in range(0, len(i18n_data), chunk_size):
    chunk = i18n_data[chunk_start:chunk_start + chunk_size]
    add_table(doc,
        ['Key', 'Hebrew', 'English'],
        [[key, he, en] for key, he, en in chunk]
    )
    doc.add_paragraph()  # spacing between tables

# ══════════════════════════════════════════════════════════════════════════════
# FINAL PAGE
# ══════════════════════════════════════════════════════════════════════════════

doc.add_page_break()

for _ in range(8):
    doc.add_paragraph()

final = doc.add_paragraph()
final.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = final.add_run('Can I Nap? v1.0')
run.font.size = Pt(18)
run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

doc.add_paragraph()

disclaimer = doc.add_paragraph()
disclaimer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = disclaimer.add_run(
    'For informational purposes only.\n'
    'Always follow Pikud HaOref / Home Front Command instructions.\n'
    'Download the official Pikud HaOref app.'
)
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

doc.add_paragraph()

credit = doc.add_paragraph()
credit.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = credit.add_run('Made with coffee in Ashdod, Israel')
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
run.italic = True

# ── Save ─────────────────────────────────────────────────────────────────────

output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Can-I-Nap-Documentation.docx')
doc.save(output_path)
print(f'Documentation saved to: {output_path}')
