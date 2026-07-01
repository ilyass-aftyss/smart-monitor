from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_fill_color(15, 30, 60)
        self.rect(0, 0, 210, 18, 'F')
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(0, 170, 255)
        self.set_y(5)
        self.cell(0, 8, '  Serre Fraisier - Guide Technique & Presentation', align='L')
        self.set_text_color(100, 140, 180)
        self.set_font('Helvetica', '', 8)
        self.set_y(5)
        self.cell(0, 8, 'Supervision Hydroponique Temps Reel  ', align='R')
        self.ln(16)

    def footer(self):
        self.set_y(-13)
        self.set_fill_color(15, 30, 60)
        self.rect(0, self.get_y(), 210, 15, 'F')
        self.set_font('Helvetica', '', 8)
        self.set_text_color(100, 140, 180)
        self.cell(0, 8, '   Page ' + str(self.page_no()) + ' / {nb}', align='L')
        self.cell(0, 8, 'Projet Serre Fraisier - 2026   ', align='R')

    def section_title(self, num, title):
        self.ln(4)
        self.set_fill_color(15, 30, 60)
        self.set_draw_color(0, 100, 200)
        self.set_line_width(0.5)
        self.rect(10, self.get_y(), 190, 10, 'F')
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(0, 170, 255)
        self.set_x(14)
        self.cell(12, 10, num, ln=0)
        self.set_text_color(220, 235, 255)
        self.cell(0, 10, title, ln=1)
        self.ln(3)

    def sub_title(self, title, color=(0, 140, 220)):
        self.ln(3)
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*color)
        self.set_x(14)
        self.cell(0, 7, '>> ' + title, ln=1)
        self.set_draw_color(*color)
        self.set_line_width(0.3)
        self.line(14, self.get_y(), 110, self.get_y())
        self.ln(2)

    def body(self, text, indent=14, color=(40, 55, 80)):
        self.set_font('Helvetica', '', 9.5)
        self.set_text_color(*color)
        self.set_x(indent)
        self.multi_cell(196 - indent, 5.5, text)

    def bullet(self, symbol, text, symbol_color=(0, 150, 220)):
        self.set_font('Helvetica', 'B', 9.5)
        self.set_text_color(*symbol_color)
        self.set_x(18)
        self.cell(6, 5.5, symbol, ln=0)
        self.set_font('Helvetica', '', 9.5)
        self.set_text_color(40, 55, 80)
        self.multi_cell(178, 5.5, text)

    def code_block(self, lines):
        self.ln(2)
        self.set_fill_color(8, 18, 38)
        self.set_draw_color(0, 80, 160)
        self.set_line_width(0.3)
        h = len(lines) * 5.5 + 5
        self.rect(14, self.get_y(), 182, h, 'FD')
        self.set_font('Courier', '', 8.5)
        self.set_text_color(0, 200, 100)
        self.ln(2.5)
        for line in lines:
            self.set_x(17)
            self.cell(0, 5.5, line, ln=1)
        self.set_text_color(40, 55, 80)
        self.ln(2)

    def info_box(self, lines, bg=(225, 240, 255), border=(0, 100, 200), tc=(10, 30, 80)):
        self.ln(2)
        total_h = len(lines) * 6 + 4
        self.set_fill_color(*bg)
        self.set_draw_color(*border)
        self.set_line_width(0.5)
        self.rect(14, self.get_y(), 182, total_h, 'FD')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*tc)
        self.ln(2)
        for line in lines:
            self.set_x(18)
            self.cell(0, 6, line, ln=1)
        self.ln(2)

    def table_row(self, cols, widths, header=False):
        if header:
            self.set_fill_color(15, 40, 90)
            self.set_text_color(0, 170, 255)
            self.set_font('Helvetica', 'B', 8.5)
        else:
            self.set_fill_color(235, 243, 255)
            self.set_text_color(20, 45, 80)
            self.set_font('Helvetica', '', 8.5)
        self.set_draw_color(160, 190, 230)
        self.set_line_width(0.2)
        self.set_x(14)
        for col, w in zip(cols, widths):
            self.cell(w, 7, '  ' + col, border=1, fill=True, ln=0)
        self.ln()


pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(10, 20, 10)

# ═══════════════════════════════════════════
# PAGE DE COUVERTURE
# ═══════════════════════════════════════════
pdf.add_page()

pdf.set_fill_color(8, 15, 40)
pdf.rect(0, 0, 210, 110, 'F')
pdf.set_fill_color(0, 60, 140)
pdf.rect(0, 107, 210, 3, 'F')

pdf.set_xy(0, 22)
pdf.set_font('Helvetica', 'B', 46)
pdf.set_text_color(0, 170, 255)
pdf.cell(210, 18, 'SERRE FRAISIER', align='C', ln=1)

pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(120, 190, 255)
pdf.cell(210, 8, 'Plateforme de Supervision Hydroponique Temps Reel', align='C', ln=1)
pdf.ln(3)
pdf.set_font('Helvetica', 'B', 10)
pdf.set_text_color(0, 220, 130)
pdf.cell(210, 7, 'Guide Technique & Guide de Presentation Jury', align='C', ln=1)

pdf.set_fill_color(15, 35, 80)
pdf.set_draw_color(0, 100, 200)
pdf.set_line_width(0.6)
pdf.rect(30, 120, 150, 52, 'FD')

infos = [
    ('Stack technique',    'React + FastAPI + PostgreSQL + WebSocket'),
    ('Protocole',          'WebSocket (RFC 6455) + REST HTTP'),
    ('Deploiement',        'Docker Compose / Synology NAS'),
    ('Version',            '2026 - Projet Academique'),
]
y_i = 126
for label, val in infos:
    pdf.set_xy(35, y_i)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(0, 170, 255)
    pdf.cell(52, 7, label + ' :', ln=0)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(200, 225, 250)
    pdf.cell(90, 7, val, ln=1)
    y_i += 11

pdf.set_xy(0, 180)
pdf.set_font('Helvetica', '', 8.5)
pdf.set_text_color(80, 110, 160)
pdf.cell(210, 7, 'Contenu : Architecture | WebSocket | Synology NAS | Guide Jury | Checklist', align='C', ln=1)


# ═══════════════════════════════════════════
# PAGE 2 - ARCHITECTURE
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('01', 'Architecture Globale de l\'Application')

pdf.body(
    'L\'application est decoupee en 3 couches independantes. Chaque couche a un role '
    'precis et elles communiquent via des protocoles standards (HTTP et WebSocket).',
    color=(40, 55, 80)
)
pdf.ln(4)

# Diagramme fleche
items = ['Simulateur', 'PostgreSQL', 'FastAPI', 'WebSocket', 'React (UI)']
colors_flow = [(10,25,70), (0,55,130), (0,90,170), (0,130,200), (0,160,230)]
box_w = 34
arrow_w = 7
total_w = len(items) * box_w + (len(items)-1) * arrow_w
sx = (210 - total_w) / 2
y_flow = pdf.get_y()
for i, item in enumerate(items):
    cx = sx + i * (box_w + arrow_w)
    pdf.set_fill_color(*colors_flow[i])
    pdf.rect(cx, y_flow, box_w, 10, 'F')
    pdf.set_font('Helvetica', 'B', 7)
    pdf.set_text_color(220, 240, 255)
    pdf.set_xy(cx, y_flow + 2.5)
    pdf.cell(box_w, 5, item, align='C')
    if i < len(items) - 1:
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(0, 180, 255)
        pdf.set_xy(cx + box_w, y_flow)
        pdf.cell(arrow_w, 10, '>', align='C')
pdf.ln(16)

pdf.sub_title('Description des 3 couches principales')

layers = [
    ('FRONTEND', 'React + Vite (port 3000)',
     'L\'interface utilisateur dans le navigateur web. Elle affiche les graphiques en '
     'temps reel (ECharts), la vue 3D (Three.js), les alertes et l\'historique. '
     'Elle recoit les donnees via WebSocket et fait des requetes REST pour les historiques.',
     (0, 120, 200)),
    ('BACKEND', 'FastAPI Python (port 8000)',
     'Le serveur central. Il gere deux types de communication : '
     '1) L\'API REST pour les requetes (historique, appareils, alertes). '
     '2) Le WebSocket /ws/live qui pousse les nouvelles mesures a tous les clients connectes en meme temps.',
     (0, 160, 100)),
    ('BASE DE DONNEES', 'PostgreSQL (port 5432)',
     'Stocke toutes les mesures climatiques (temperature, humidite, CO2, EC, pH...) '
     'ainsi que les appareils (ventilateurs) et les alertes. '
     'Le simulateur insere une nouvelle mesure toutes les 5 secondes.',
     (180, 120, 0)),
]

for name, tech, desc, color in layers:
    pdf.ln(2)
    r, g, b = color
    pdf.set_fill_color(r//5, g//5, b//5)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.4)
    pdf.rect(14, pdf.get_y(), 182, 24, 'FD')
    pdf.set_fill_color(*color)
    pdf.rect(14, pdf.get_y(), 22, 24, 'F')
    pdf.set_font('Helvetica', 'B', 7)
    pdf.set_text_color(255, 255, 255)
    txt_y = pdf.get_y() + 9
    pdf.set_xy(14, txt_y)
    pdf.cell(22, 6, name[:4], align='C')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*color)
    pdf.set_xy(38, txt_y - 8)
    pdf.cell(0, 6, name + ' - ' + tech, ln=1)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(170, 200, 235)
    pdf.set_x(38)
    pdf.multi_cell(156, 5, desc)
    pdf.ln(1)

pdf.ln(3)
pdf.sub_title('Flux de donnees complet (etape par etape)')
pdf.code_block([
    '1. DataSimulator genere une mesure toutes les 5 secondes',
    '2. La mesure est inseree dans PostgreSQL (table internal_data)',
    '3. FastAPI recupere la mesure et appelle ConnectionManager.broadcast()',
    '4. Tous les clients WebSocket connectes recoivent la mise a jour',
    '5. React met a jour les graphiques ECharts en temps reel (< 100 ms)',
])


# ═══════════════════════════════════════════
# PAGE 3 - WEBSOCKET
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('02', 'Protocole WebSocket - Pourquoi et Comment')

pdf.body(
    'Le WebSocket est le protocole choisi pour la communication en temps reel. '
    'Il ouvre une connexion persistante entre le navigateur et le serveur : '
    'le serveur peut envoyer des donnees a tout moment sans que le client ne les redemande.',
    color=(40, 55, 80)
)
pdf.ln(3)

pdf.sub_title('Comparaison des protocoles')
pdf.table_row(['Protocole', 'Fonctionnement', 'Delai', 'Bande passante'], [44, 72, 28, 38], header=True)
pdf.table_row(['REST Polling', 'Client demande toutes les X secondes', '5 - 30 s', 'Elevee'], [44, 72, 28, 38])
pdf.table_row(['WebSocket  (choisi)', 'Connexion ouverte, push instantane', '< 100 ms', 'Tres faible'], [44, 72, 28, 38])
pdf.table_row(['SSE', 'Serveur pousse, sens unique', '< 200 ms', 'Faible'], [44, 72, 28, 38])
pdf.table_row(['MQTT', 'Protocole IoT publish/subscribe', '< 50 ms', 'Minimale'], [44, 72, 28, 38])
pdf.ln(3)

pdf.info_box([
    '  CHOIX RETENU : WebSocket est le meilleur compromis pour ce projet.',
    '  Raisons : support natif dans tous les navigateurs, integration directe dans FastAPI,',
    '  latence < 100 ms, et aucun broker intermediaire necessaire (contrairement a MQTT).',
], bg=(225, 240, 255), border=(0, 100, 200), tc=(10, 30, 100))

pdf.sub_title('Les 3 avantages cles du WebSocket')

avantages = [
    ('1 - Connexion persistante',
     'Une seule "poignee de main" TCP au demarrage. Ensuite, le canal reste ouvert. '
     'Pas de reconnexion a chaque mesure. Cela economise du temps de traitement et de la bande passante.',
     (0, 140, 220)),
    ('2 - Push serveur instantane',
     'Des que le simulateur ecrit une mesure, le backend appelle broadcast() et TOUS les '
     'onglets ouverts recoivent la donnee automatiquement en moins de 100 millisecondes.',
     (0, 180, 120)),
    ('3 - Economie de donnees (99%)',
     'En HTTP classique : 800 octets d\'en-tetes par requete. En WebSocket : 2 octets. '
     'Pour 1 mesure toutes les 5s sur 24h, WebSocket economise plus de 99% de la bande passante.',
     (200, 130, 0)),
]

for titre, desc, color in avantages:
    pdf.ln(2)
    r, g, b = color
    pdf.set_fill_color(r//8, g//8, b//8)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.4)
    pdf.rect(14, pdf.get_y(), 182, 20, 'FD')
    pdf.set_font('Helvetica', 'B', 9.5)
    pdf.set_text_color(*color)
    pdf.set_xy(18, pdf.get_y() + 2)
    pdf.cell(0, 6, titre, ln=1)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(180, 210, 240)
    pdf.set_x(18)
    pdf.multi_cell(176, 5, desc)
    pdf.ln(1)

pdf.ln(3)
pdf.sub_title('Message WebSocket envoye par le serveur (format JSON)')
pdf.code_block([
    '{',
    '  "type": "internal_update",',
    '  "timestamp": "2026-07-01T14:23:05Z",',
    '  "data": {',
    '    "temperature": 23.4,',
    '    "humidity": 67.2,',
    '    "co2": 850,',
    '    "ec": 1.8,',
    '    "ph": 6.1',
    '  }',
    '}',
])

pdf.ln(2)
pdf.sub_title('Code cote frontend (useSensorData.ts - simplifie)')
pdf.code_block([
    'const ws = new WebSocket("ws://SERVEUR:8000/ws/live")',
    '',
    'ws.onmessage = (event) => {',
    '  const msg = JSON.parse(event.data)',
    '  if (msg.type === "internal_update") {',
    '    setTemperature(msg.data.temperature)  // graphique se met a jour',
    '    setHumidity(msg.data.humidity)',
    '  }',
    '}',
    '',
    'ws.onclose = () => {',
    '  setTimeout(connect, 5000)  // reconnexion automatique apres 5s',
    '}',
])


# ═══════════════════════════════════════════
# PAGE 4 - SYNOLOGY NAS
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('03', 'Integration avec le Serveur Synology DS115j')

pdf.info_box([
    '  INFORMATION IMPORTANTE : Le DS115j est un NAS ARM avec 512 Mo de RAM.',
    '  Il ne supporte pas Docker officiellement.',
    '  Pour la presentation jury : garder Docker local + reseau Wi-Fi local.',
    '  C\'est la solution la plus simple et la plus fiable pour le jour J.',
], bg=(255, 243, 220), border=(200, 130, 0), tc=(80, 50, 0))

pdf.sub_title('Option A - Presentation jury (recommandee, la plus simple)')

pdf.body(
    'Gardez votre application Docker locale. Toute personne connectee au meme Wi-Fi '
    'peut acceder a l\'application via votre adresse IP locale :', color=(40, 55, 80)
)
pdf.code_block([
    '# Etape 1 : Trouver votre adresse IP locale',
    'Windows :  ipconfig  (chercher "Adresse IPv4")',
    'Linux/Mac: ip addr show  (chercher "inet 192.168...")',
    '',
    '# Etape 2 : Lancer l\'application Docker',
    'docker compose up -d',
    '',
    '# Etape 3 : Partager l\'URL avec le jury',
    'http://192.168.1.XX:3000   (remplacer XX par votre IP)',
    '',
    '# Pour un acces depuis Internet (jury a distance)',
    'ngrok http 3000',
    '# -> genere une URL publique ex: https://abc123.ngrok.io',
])

pdf.sub_title('Option B - Deploiement natif sur le Synology DS115j')

pdf.body('Suivez ces 5 etapes dans l\'ordre :', color=(40, 55, 80))
pdf.ln(2)

steps = [
    ('Etape 1', 'Installer les packages DSM',
     'Dans DSM -> Centre de paquets : installer Python 3, Web Station, Nginx, PostgreSQL (via SynoCommunity).',
     (0, 140, 220)),
    ('Etape 2', 'Activer SSH et uploader le backend',
     'DSM -> Panneau de configuration -> Terminal -> Activer SSH.\n'
     'Puis: scp -r ./backend/* admin@IP_NAS:/volume1/serre/backend/\n'
     'Et: pip3 install -r requirements.txt',
     (0, 180, 120)),
    ('Etape 3', 'Configurer PostgreSQL sur le NAS',
     'Se connecter a psql et creer la base :\n'
     'CREATE DATABASE serre_fraisier;\n'
     'Puis mettre a jour DATABASE_URL dans le fichier .env du backend.',
     (180, 120, 0)),
    ('Etape 4', 'Compiler et copier le frontend',
     'Sur votre machine : npm run build (dans le dossier frontend/)\n'
     'Copier le dossier dist/ vers /volume1/web/serre/ sur le NAS.',
     (140, 0, 180)),
    ('Etape 5', 'Configurer le Reverse Proxy Nginx',
     'DSM -> Portail de connexion -> Proxy inverse :\n'
     '/api/* et /ws/* -> localhost:8000 (backend)\n'
     '/* -> localhost:3000 (frontend)',
     (0, 100, 180)),
]

for code, titre, desc, color in steps:
    pdf.ln(2)
    r, g, b = color
    pdf.set_fill_color(r//6, g//6, b//6)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.3)
    lines = desc.count('\n') + 1
    h = 14 + lines * 5.5
    pdf.rect(14, pdf.get_y(), 182, h, 'FD')
    pdf.set_fill_color(*color)
    pdf.rect(14, pdf.get_y(), 20, h, 'F')
    pdf.set_font('Helvetica', 'B', 7.5)
    pdf.set_text_color(255, 255, 255)
    mid_y = pdf.get_y() + h/2 - 3
    pdf.set_xy(14, mid_y)
    pdf.cell(20, 6, code, align='C')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*color)
    pdf.set_xy(36, pdf.get_y() - h/2 + 3)
    pdf.cell(0, 6, titre, ln=1)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(180, 210, 235)
    pdf.set_x(36)
    pdf.multi_cell(158, 5, desc)
    pdf.ln(1)


# ═══════════════════════════════════════════
# PAGE 5 - GUIDE JURY
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('04', 'Guide de Presentation devant le Jury')

pdf.body(
    'Duree recommandee : 15 a 20 minutes. Structurez votre presentation en 5 parties. '
    'Commencez par montrer l\'application ouverte et fonctionnelle, '
    'ensuite expliquez les choix techniques.',
    color=(40, 55, 80)
)
pdf.ln(3)

plan = [
    ('01', 'Introduction', '2 min',
     'Presentez l\'objectif : supervision en temps reel d\'une serre hydroponique de fraisiers. '
     'Montrez le Dashboard ouvert avec les graphiques qui se mettent a jour en direct.',
     (0, 160, 110)),
    ('02', 'Architecture', '3 min',
     'Dessinez le schema : Simulateur -> PostgreSQL -> FastAPI -> WebSocket -> React. '
     'Expliquez le role de chaque brique technique.',
     (0, 120, 200)),
    ('03', 'Focus WebSocket', '4 min',
     'C\'est le coeur technique attendu par le jury. Ouvrez 2 onglets du Dashboard '
     'cote a cote et montrez la mise a jour simultanee. Expliquez pourquoi WebSocket '
     'est meilleur que le polling HTTP classique.',
     (180, 90, 0)),
    ('04', 'Demo des pages', '5 min',
     'Parcourez : Dashboard, Historique, Ventilateurs, Alertes, Vue 3D. '
     'Activez le mode sombre (plus impressionnant visuellement pour le jury).',
     (120, 0, 180)),
    ('05', 'Integration serveur', '3 min',
     'Expliquez comment l\'URL WebSocket est configuree via variable d\'environnement '
     '(VITE_WS_URL) au moment du build Docker. Cela permet de changer de serveur '
     '(local, NAS, cloud) sans modifier une seule ligne de code.',
     (0, 80, 180)),
]

for num, titre, duree, desc, color in plan:
    pdf.ln(2)
    r, g, b = color
    pdf.set_fill_color(r//5, g//5, b//5)
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.4)
    pdf.rect(14, pdf.get_y(), 182, 26, 'FD')
    pdf.set_fill_color(*color)
    pdf.rect(14, pdf.get_y(), 22, 26, 'F')
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(14, pdf.get_y() + 8)
    pdf.cell(22, 10, num, align='C', ln=0)
    pdf.set_font('Helvetica', 'B', 9.5)
    pdf.set_text_color(*color)
    pdf.set_xy(38, pdf.get_y() - 8 + 2)
    pdf.cell(120, 6, titre, ln=0)
    pdf.set_text_color(160, 185, 215)
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(0, 6, '[ ' + duree + ' ]', align='R', ln=1)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(185, 210, 240)
    pdf.set_x(38)
    pdf.multi_cell(158, 5, desc)
    pdf.ln(1)


# ═══════════════════════════════════════════
# PAGE 6 - QUESTIONS JURY
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('05', 'Questions Frequentes du Jury - Reponses Preparees')

questions = [
    (
        'Pourquoi WebSocket et pas MQTT ?',
        'MQTT est optimise pour les capteurs physiques contraints (Arduino, ESP32) qui ont peu '
        'de memoire. Dans notre cas, le backend Python recoit deja les donnees. WebSocket '
        's\'integre directement dans FastAPI et dans les navigateurs sans broker intermediaire.'
    ),
    (
        'Comment gerez-vous la deconnexion reseau ?',
        'Le hook useSensorData.ts implemente une reconnexion automatique apres 5 secondes '
        '(ws.onclose -> setTimeout(connect, 5000)). En parallele, le polling REST toutes '
        'les 30s assure un fallback. L\'indicateur EN DIRECT dans la NavBar change de couleur.'
    ),
    (
        'La securite de l\'application ?',
        'En production : HTTPS pour le frontend et WSS (WebSocket Securise avec TLS) pour '
        'les donnees temps reel. Le backend FastAPI genere des tokens JWT. '
        'Sur le NAS, le reverse proxy Nginx termine la connexion TLS.'
    ),
    (
        'Comment l\'application passe-t-elle du local au serveur ?',
        'L\'URL du serveur est configuree via des variables d\'environnement (VITE_API_URL et '
        'VITE_WS_URL) au moment du build Docker. Il suffit de changer ces valeurs '
        'pour pointer vers le NAS ou un serveur cloud sans modifier le code.'
    ),
    (
        'Pourquoi Docker Compose ?',
        'Docker garantit que l\'application fonctionne de maniere identique sur toutes les '
        'machines. Compose orchestre les 3 services (frontend, backend, PostgreSQL) avec leurs '
        'dependances. Un seul "docker compose up" demarre tout l\'ecosysteme.'
    ),
    (
        'Que se passe-t-il si le serveur tombe ?',
        'Le frontend affiche les dernieres donnees en cache et l\'indicateur "EN DIRECT" '
        'passe en orange "Hors ligne". La reconnexion WebSocket se fait automatiquement '
        'toutes les 5 secondes. Le polling REST prend le relais si le WebSocket echoue.'
    ),
]

for q, r in questions:
    pdf.ln(2)
    pdf.set_fill_color(8, 22, 55)
    pdf.set_draw_color(0, 110, 210)
    pdf.set_line_width(0.4)
    pdf.rect(14, pdf.get_y(), 182, 8, 'FD')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(0, 200, 255)
    pdf.set_xy(17, pdf.get_y() + 1.5)
    pdf.cell(0, 5, 'Q : ' + q, ln=1)
    pdf.set_fill_color(235, 245, 255)
    pdf.set_draw_color(0, 110, 210)
    pdf.set_line_width(0.2)
    y0 = pdf.get_y()
    pdf.set_x(17)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(15, 40, 85)
    pdf.multi_cell(176, 5, 'R : ' + r)
    y1 = pdf.get_y()
    pdf.rect(14, y0, 182, y1 - y0 + 2, 'FD')
    pdf.set_xy(17, y0)
    pdf.set_text_color(15, 40, 85)
    pdf.multi_cell(176, 5, 'R : ' + r)
    pdf.ln(3)


# ═══════════════════════════════════════════
# PAGE 7 - CHECKLIST
# ═══════════════════════════════════════════
pdf.add_page()
pdf.section_title('06', 'Checklist - Avant de Passer devant le Jury')

pdf.body(
    'Verifiez chaque point dans les 30 minutes qui precedent votre presentation.',
    color=(40, 55, 80)
)
pdf.ln(3)

sections_check = [
    ('TECHNIQUE', (0, 80, 170), [
        'docker compose up -d lance et stable (verifier avec : docker ps)',
        'Dashboard visible sur http://localhost:3000',
        'Indicateur "EN DIRECT" vert dans la NavBar (dot vert anime)',
        'Mode sombre active (plus impressionnant visuellement)',
        'Vue 3D chargee et visible (attendre 3s le premier chargement)',
        'Badge rouge sur "Alertes" dans la navigation',
    ]),
    ('DEMONSTRATION', (0, 140, 100), [
        'Avoir 2 onglets du Dashboard ouverts pour montrer le WebSocket simultanee',
        'Preparer la navigation : Dashboard -> 3D -> Historique -> Alertes',
        'Connaitre les chiffres cles : 5s cycle, <100ms latence WS, 30s poll REST',
    ]),
    ('RESEAU', (160, 80, 0), [
        'Connaitre votre IP locale (ipconfig sur Windows)',
        'Verifier que le pare-feu autorise le port 3000',
        'Tester l\'acces depuis un autre appareil sur le meme Wi-Fi',
        'Si acces Internet necessaire : lancer ngrok http 3000 avant',
    ]),
    ('PRESENTATION ORALE', (120, 0, 160), [
        'Schema d\'architecture prepare (dessin ou papier imprime)',
        'Difference WebSocket vs REST polling vs MQTT expliquee',
        'Savoir expliquer VITE_WS_URL et les variables d\'environnement',
        'Connaitre le nom de chaque page et ce qu\'elle montre',
    ]),
]

for cat, color, items in sections_check:
    pdf.ln(2)
    pdf.set_fill_color(*color)
    pdf.set_draw_color(*[c//2 for c in color])
    pdf.rect(14, pdf.get_y(), 182, 8, 'FD')
    pdf.set_font('Helvetica', 'B', 9.5)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(17, pdf.get_y() + 1.5)
    pdf.cell(0, 5, cat, ln=1)
    for item in items:
        pdf.set_fill_color(240, 246, 255)
        pdf.set_draw_color(180, 200, 230)
        pdf.rect(14, pdf.get_y(), 182, 7.5, 'FD')
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*color)
        pdf.set_xy(17, pdf.get_y() + 1)
        pdf.cell(7, 5.5, 'o', ln=0)
        pdf.set_font('Helvetica', '', 8.5)
        pdf.set_text_color(15, 35, 75)
        pdf.cell(0, 5.5, item, ln=1)
    pdf.ln(2)

pdf.ln(4)
pdf.set_fill_color(8, 18, 45)
pdf.set_draw_color(0, 100, 200)
pdf.set_line_width(0.5)
pdf.rect(14, pdf.get_y(), 182, 16, 'FD')
pdf.set_font('Helvetica', 'B', 11)
pdf.set_text_color(0, 200, 255)
pdf.set_xy(14, pdf.get_y() + 3)
pdf.cell(182, 6, 'Bonne presentation !', align='C', ln=1)
pdf.set_font('Helvetica', '', 8.5)
pdf.set_text_color(120, 160, 200)
pdf.cell(182, 5, 'React + FastAPI + PostgreSQL + WebSocket + Docker', align='C', ln=1)

pdf.output('Guide_Serre_Fraisier.pdf')
print('PDF genere : Guide_Serre_Fraisier.pdf')
