"""
Génère un diagramme d'architecture détaillé (image PNG) du système
Serre Fraisier : couches, composants, protocoles.

Usage: python3 scripts/generate_architecture_diagram.py
Sortie: docs/architecture_diagram.png
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1800, 2000
BG = (10, 16, 28)
GRID = (18, 28, 46)

COLORS = {
    "external": (249, 115, 22),
    "backend": (0, 170, 255),
    "db": (168, 85, 247),
    "frontend": (16, 185, 129),
    "protocol": (234, 179, 8),
    "text_hi": (226, 236, 248),
    "text_lo": (138, 172, 204),
    "box_border": (60, 90, 130),
    "box_fill": (16, 26, 44),
    "misc": (120, 160, 200),
}


def load_font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


F_TITLE = load_font(38, bold=True)
F_SUB = load_font(20)
F_LAYER = load_font(24, bold=True)
F_BOX_T = load_font(19, bold=True)
F_BOX_S = load_font(15)
F_PROTO = load_font(15, bold=True)
F_SMALL = load_font(13)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

for x in range(0, W, 40):
    d.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 40):
    d.line([(0, y), (W, y)], fill=GRID, width=1)


def rounded_box(xy, fill, outline, radius=14, width=2):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def box_with_lines(xy, title, lines, accent, sub=None):
    x0, y0, x1, y1 = xy
    rounded_box(xy, fill=COLORS["box_fill"], outline=accent, radius=12, width=2)
    d.rectangle([x0, y0, x0 + 6, y1], fill=accent)
    ty = y0 + 14
    d.text((x0 + 20, ty), title, font=F_BOX_T, fill=COLORS["text_hi"])
    ty += 26
    if sub:
        d.text((x0 + 20, ty), sub, font=F_SMALL, fill=accent)
        ty += 18
    ty += 4
    for ln in lines:
        d.text((x0 + 20, ty), f"• {ln}", font=F_BOX_S, fill=COLORS["text_lo"])
        ty += 20


def arrow(p0, p1, color, label=None, label_pos=0.5, dashed=False, width=3):
    x0, y0 = p0
    x1, y1 = p1
    if dashed:
        length = math.hypot(x1 - x0, y1 - y0)
        n = max(1, int(length // 12))
        for i in range(n):
            t0 = i / n
            t1 = t0 + 0.55 / n
            xa = x0 + (x1 - x0) * t0
            ya = y0 + (y1 - y0) * t0
            xb = x0 + (x1 - x0) * t1
            yb = y0 + (y1 - y0) * t1
            d.line([(xa, ya), (xb, yb)], fill=color, width=width)
    else:
        d.line([(x0, y0), (x1, y1)], fill=color, width=width)
    ah = 9
    ang = math.atan2(y1 - y0, x1 - x0)
    ax1 = x1 - ah * math.cos(ang - math.pi / 7)
    ay1 = y1 - ah * math.sin(ang - math.pi / 7)
    ax2 = x1 - ah * math.cos(ang + math.pi / 7)
    ay2 = y1 - ah * math.sin(ang + math.pi / 7)
    d.polygon([(x1, y1), (ax1, ay1), (ax2, ay2)], fill=color)
    if label:
        lx = x0 + (x1 - x0) * label_pos
        ly = y0 + (y1 - y0) * label_pos
        bbox = d.textbbox((0, 0), label, font=F_PROTO)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.rectangle([lx - tw / 2 - 6, ly - th / 2 - 4, lx + tw / 2 + 6, ly + th / 2 + 6],
                    fill=(8, 12, 20), outline=color, width=1)
        d.text((lx, ly), label, font=F_PROTO, fill=color, anchor="mm")


# ── Title ──────────────────────────────────────────────────────────────
d.text((W / 2, 40), "Serre Fraisier — Architecture Technique", font=F_TITLE, fill=COLORS["text_hi"], anchor="mm")
d.text((W / 2, 78), "Plateforme de surveillance hydroponique fraisier — couches, composants & protocoles",
       font=F_SUB, fill=COLORS["text_lo"], anchor="mm")

layer_x0, layer_x1 = 60, W - 60


def layer_label(y, text, color):
    d.text((layer_x0, y), text, font=F_LAYER, fill=color)
    d.line([(layer_x0, y + 32), (layer_x1, y + 32)], fill=color, width=1)


# ── LAYER 1: External Sources ────────────────────────────────────────
y1 = 120
layer_label(y1, "1 · SOURCE DE DONNÉES DISTANTE (site de la serre)", COLORS["external"])

ext_y0 = y1 + 50
ext_y1 = ext_y0 + 150

box_with_lines(
    (80, ext_y0, 620, ext_y1),
    "Capteurs Physiques",
    ["Ambiance interne: Temp., Hum., CO₂, VOC, VPD,",
     "Pression, Point de rosée, Éclairement, Pr. Vap. Partielle",
     "Station météo ext.: Temp., Hum., Irradiance, Vent,",
     "Pluie, RSSI, Batterie, Girouette"],
    COLORS["external"],
)
box_with_lines(
    (660, ext_y0, 1180, ext_y1),
    "Serveur Flask (Raspberry Pi / PC local)",
    ["Acquisition capteurs (I2C / série / RS485)",
     "Agrégation + horodatage des mesures",
     "Expose GET /api/telemetry/latest (JSON)",
     "Ne fait AUCUN accès direct au navigateur"],
    COLORS["external"],
    sub="Python · Flask",
)
box_with_lines(
    (1220, ext_y0, W - 80, ext_y1),
    "Tunnel ngrok",
    ["Expose le serveur Flask local via HTTPS public",
     "URL secrète : GREENHOUSE_TELEMETRY_URL",
     "Jamais exposée au frontend ni committée en git",
     "Header ngrok-skip-browser-warning requis"],
    COLORS["protocol"],
)

# ── LAYER 2: Backend ─────────────────────────────────────────────────
y2 = ext_y1 + 60
layer_label(y2, "2 · BACKEND — API & TRAITEMENT (Docker container)", COLORS["backend"])

be_y0 = y2 + 50
be_y1 = be_y0 + 170
box_with_lines(
    (80, be_y0, 560, be_y1),
    "telemetry_client.py",
    ["Polling HTTP périodique (httpx.AsyncClient)",
     "GET {GREENHOUSE_TELEMETRY_URL}/api/telemetry/latest",
     "Parse str→float, timestamps, dédoublonnage",
     "Persiste en DB + diffuse via WebSocket",
     "Expose .status() → /api/internal/telemetry-status"],
    COLORS["backend"],
    sub="Python · httpx (async)",
)
box_with_lines(
    (600, be_y0, 1030, be_y1),
    "data_simulator.py",
    ["Génère données simulées réalistes",
     "Actif seulement si aucune URL distante",
     "Sinon: mode backfill uniquement (historique)",
     "alert_rules.py : logique de seuils partagée"],
    COLORS["backend"],
    sub="Fallback / démo",
)
box_with_lines(
    (1070, be_y0, W - 80, be_y1),
    "FastAPI — main.py",
    ["Lifespan: lance telemetry_client OU simulateur",
     "Routers: internal, external, devices, alerts, auth",
     "WebSocket /ws pour push temps réel au frontend",
     "CORS + auth JWT pour les routes protégées"],
    COLORS["backend"],
    sub="Python · FastAPI · Uvicorn",
)

# ── LAYER 3: Database ────────────────────────────────────────────────
y3 = be_y1 + 60
layer_label(y3, "3 · PERSISTANCE", COLORS["db"])
db_y0 = y3 + 50
db_y1 = db_y0 + 130
box_with_lines(
    (80, db_y0, 900, db_y1),
    "PostgreSQL",
    ["Tables: internal_data, external_data, devices, alerts, users",
     "Champ source ('simulation' | 'station') sur chaque mesure",
     "Historique horodaté pour graphiques & jumeau 3D"],
    COLORS["db"],
    sub="SQLAlchemy (async) · asyncpg",
)
box_with_lines(
    (940, db_y0, W - 80, db_y1),
    "Docker Compose",
    ["Orchestration: backend + db + frontend",
     "Variables d'env: GREENHOUSE_TELEMETRY_URL,",
     "TELEMETRY_POLL_SECONDS, DATABASE_URL"],
    COLORS["misc"],
    sub="Environnement local",
)

# ── LAYER 4: Frontend ────────────────────────────────────────────────
y4 = db_y1 + 60
layer_label(y4, "4 · FRONTEND — Interface Utilisateur (navigateur)", COLORS["frontend"])
fe_y0 = y4 + 50
fe_y1 = fe_y0 + 190
box_with_lines(
    (80, fe_y0, 520, fe_y1),
    "Dashboard",
    ["KPI climat intérieur (10 paramètres)",
     "Mini-carte conditions extérieures",
     "Badge source : Station Réelle / Simulateur",
     "Graphiques tendances (2h)"],
    COLORS["frontend"],
)
box_with_lines(
    (560, fe_y0, 1000, fe_y1),
    "Externe / Actionneurs / Alertes",
    ["Externe: irradiance, vent (km/h), pluie,",
     "RSSI, batterie station",
     "Actionneurs (ex-Ventilateurs): supervision ON/OFF",
     "Alertes: seuils dépassés, accusé de réception"],
    COLORS["frontend"],
)
box_with_lines(
    (1040, fe_y0, W - 80, fe_y1),
    "Vue 3D — Jumeau Numérique",
    ["React Three Fiber : serre 10×5 m (9 m + corridor 1 m)",
     "3 gouttières × 8.5 m, hauteur 0.8 m, plants ≤ 1.15 m",
     "Capteurs & actionneurs animés en temps réel",
     "HUD live : climat + météo extérieure"],
    COLORS["frontend"],
    sub="React + Vite + MUI + Three.js",
)

# ── Arrows between layers ─────────────────────────────────────────────
arrow((900, ext_y1), (900, be_y0), COLORS["protocol"], "HTTPS / ngrok · GET JSON", width=4)
arrow((330, be_y1), (330, db_y0), COLORS["db"], "asyncpg", width=3)
arrow((1300, be_y1), (1300, db_y0), COLORS["db"], "asyncpg", width=3)
arrow((900, db_y1), (900, fe_y0), COLORS["frontend"], "REST JSON + WebSocket", width=4)

# ── Protocol legend ────────────────────────────────────────────────────
leg_y = fe_y1 + 50
d.text((layer_x0, leg_y), "Légende des protocoles", font=F_LAYER, fill=COLORS["text_hi"])
leg_y += 40
legend_items = [
    ("HTTPS (ngrok tunnel)", COLORS["protocol"], "Serveur Flask distant → Backend (polling httpx, intervalle configurable)"),
    ("asyncpg / SQL", COLORS["db"], "Backend ↔ PostgreSQL (lecture/écriture mesures, alertes, devices)"),
    ("REST (HTTP JSON)", COLORS["frontend"], "Frontend → Backend (fetch initial, historique, actions)"),
    ("WebSocket", COLORS["frontend"], "Backend → Frontend (push temps réel : nouvelles mesures, alertes)"),
]
for label, color, desc in legend_items:
    d.rectangle([layer_x0, leg_y, layer_x0 + 26, leg_y + 26], fill=color)
    d.text((layer_x0 + 38, leg_y + 2), label, font=F_BOX_T, fill=COLORS["text_hi"])
    d.text((layer_x0 + 38, leg_y + 24), desc, font=F_BOX_S, fill=COLORS["text_lo"])
    leg_y += 56

# ── Security note ──────────────────────────────────────────────────────
sec_y = leg_y + 10
rounded_box((layer_x0, sec_y, layer_x1, sec_y + 70), fill=(28, 14, 14), outline=(232, 51, 74), radius=10, width=2)
d.text((layer_x0 + 20, sec_y + 14), "🔒 Sécurité", font=F_BOX_T, fill=(232, 120, 130))
d.text((layer_x0 + 20, sec_y + 40),
       "L'URL ngrok du serveur de télémétrie n'est jamais exposée au navigateur ni committée en git — elle vit uniquement",
       font=F_BOX_S, fill=COLORS["text_lo"])
d.text((layer_x0 + 20, sec_y + 58),
       "côté serveur (variable d'environnement GREENHOUSE_TELEMETRY_URL, backend uniquement).",
       font=F_BOX_S, fill=COLORS["text_lo"])

final_h = sec_y + 70 + 30
img = img.crop((0, 0, W, final_h))
os.makedirs("docs", exist_ok=True)
img.save("docs/architecture_diagram.png")
print(f"Saved docs/architecture_diagram.png ({W}x{final_h})")
