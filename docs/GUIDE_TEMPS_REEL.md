# Guide complet — Exploitation en temps réel
## Serre fraisier 5m × 10m · Synology DS115j · Smart Monitor

---

## Architecture du pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPTEURS IoT (serre)                         │
│  • Capteurs internes : T°, CO₂, Humidité, VOC, VPD, Pression  │
│  • Station météo externe : Radiation, Vent, T° ext, Hum. ext   │
│  • Relais/signal numérique → état de chaque ventilateur         │
└────────────────────┬────────────────────────────────────────────┘
                     │  écrit des fichiers CSV (1 min interne / 15 min externe)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               Synology DS115j  (192.168.X.X)                    │
│               Dossier partagé SMB :  \\NAS\DATA\               │
│               • internal_AAAA_MM_JJ.csv                         │
│               • external_AAAA_MM_JJ.csv                         │
└────────────────────┬────────────────────────────────────────────┘
                     │  montage réseau SMB/CIFS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            PC / Serveur hôte Docker                             │
│            Point de montage :  /mnt/nas_data/                  │
└────────────────────┬────────────────────────────────────────────┘
                     │  volume Docker  /mnt/nas_data → /app/csv_data
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            Backend FastAPI  (conteneur Docker)                  │
│            Scan CSV automatique toutes les 60 secondes          │
│            → insère en base PostgreSQL                          │
│            → détecte les alertes et les enregistre              │
└────────────────────┬────────────────────────────────────────────┘
                     │  API REST + WebSocket temps réel
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            Frontend React  →  http://localhost:3000             │
│            Dashboard · Historique · Alertes · Vue 3D            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ÉTAPE 1 — Configurer le Synology DS115j

### 1.1 Première mise en service du NAS

1. Insérer un disque dur dans le DS115j
2. Brancher le NAS au routeur/switch (même réseau que votre PC)
3. Depuis un navigateur : **http://find.synology.com**
4. Suivre l'assistant DSM (choisir **DSM 7.x**)
5. Créer un compte administrateur NAS (ex: `nasadmin`)

### 1.2 Trouver l'adresse IP du NAS

Trois méthodes :

```
A) Site : http://find.synology.com
B) Votre box/routeur → liste des appareils DHCP
C) Depuis un PC : arp -a   (chercher une adresse MAC Synology)
```

Notez l'IP : **192.168.X.X** (ex: `192.168.1.50`)

### 1.3 Créer le dossier partagé "DATA"

Dans **DSM → Panneau de configuration → Dossier partagé** :

| Paramètre | Valeur |
|---|---|
| Nom | `DATA` |
| Description | Smart Monitor CSV |
| Chiffrement | Non (inutile en réseau local) |

### 1.4 Activer le partage SMB

**DSM → Panneau de configuration → Services de fichiers → SMB/AFP/NFS**

- Cocher **Activer le service SMB**
- Version minimale : **SMB2**
- Cliquer **Appliquer**

### 1.5 Créer un utilisateur dédié

**DSM → Panneau de configuration → Utilisateur et groupe → Créer**

| Paramètre | Valeur |
|---|---|
| Nom d'utilisateur | `iot_reader` |
| Mot de passe | `IoT@Serre2024!` |
| Accès au dossier DATA | Lecture/Écriture |

---

## ÉTAPE 2 — Format exact des fichiers CSV

> **CRITIQUE** — le backend lit les fichiers selon des noms et colonnes précis.

### 2.1 Capteurs internes (température, CO₂, humidité…)

**Nom du fichier :** `internal_AAAA_MM_JJ.csv`
Exemples valides : `internal_2024_06_20.csv`, `internal_capteurs.csv`

```csv
timestamp,temperature,co2,humidity,voc,vpd,pressure,dew_point
2024-06-20 08:00:00,21.5,870,72.1,118,0.71,1013.2,16.4
2024-06-20 08:01:00,21.7,885,71.8,122,0.73,1013.1,16.3
2024-06-20 08:02:00,21.6,892,72.3,115,0.72,1013.3,16.5
```

| Colonne | Unité | Plage optimale fraisier | Obligatoire |
|---|---|---|---|
| `timestamp` | YYYY-MM-DD HH:MM:SS | — | Oui |
| `temperature` | °C | **18 – 23** | Oui |
| `co2` | ppm | **800 – 1000** | Oui |
| `humidity` | % | **70 – 75** | Oui |
| `voc` | ppb | < 300 | Non |
| `vpd` | kPa | 0.4 – 1.2 | Non |
| `pressure` | hPa | 980 – 1040 | Non |
| `dew_point` | °C | calculable | Non |

**Noms alternatifs acceptés :**
`temp` → temperature · `hum` → humidity · `pression` → pressure · `point_rosee` → dew_point

### 2.2 Capteurs externes (météo)

**Nom du fichier :** `external_AAAA_MM_JJ.csv`

```csv
timestamp,radiation,wind_speed,humidity,temperature
2024-06-20 08:00:00,350.5,2.3,58.0,18.2
2024-06-20 08:15:00,420.0,2.8,57.5,19.0
2024-06-20 08:30:00,510.2,3.1,56.8,19.8
```

| Colonne | Unité | Obligatoire |
|---|---|---|
| `timestamp` | YYYY-MM-DD HH:MM:SS | Oui |
| `radiation` | W/m² | Oui |
| `wind_speed` | m/s | Oui |
| `humidity` | % | Oui |
| `temperature` | °C | Oui |

**Noms alternatifs :** `radiation_solaire` · `vitesse_vent` · `humidite` · `temp`

---

## ÉTAPE 3 — Script de collecte sur le PC relié aux capteurs

Adaptez ce script Python à votre matériel et exécutez-le en continu sur le PC ou Raspberry Pi de la serre.

### Script capteurs internes

```python
# collect_internal.py — 1 mesure par minute, écrit sur le NAS
import csv, time
from datetime import datetime
from pathlib import Path

# ADAPTEZ CE CHEMIN ─────────────────────────────────────────────────────────
# Linux   (NAS monté via SMB) :
NAS_PATH = Path("/mnt/nas_data")
# Windows (NAS monté en lecteur Z:) :
# NAS_PATH = Path("Z:\\")
# ────────────────────────────────────────────────────────────────────────────

def lire_capteurs_internes():
    """
    REMPLACEZ CE BLOC par la lecture réelle de vos capteurs.
    Exemples de matériels compatibles :
      - SHT31 / SHT40  → Température + Humidité (I2C)
      - MH-Z19B        → CO₂ (UART)
      - BME280         → Pression + T° + Hum (I2C/SPI)
      - SGP30 / SGP40  → VOC (I2C)
    """
    # Exemple Raspberry Pi avec SHT31 :
    # import board, adafruit_sht31d
    # i2c = board.I2C()
    # sensor = adafruit_sht31d.SHT31D(i2c)
    # temp = round(sensor.temperature, 2)
    # hum  = round(sensor.relative_humidity, 1)

    # Placeholder — remplacez par vos vraies lectures :
    import random, math
    t = time.time()
    temp = round(21 + 2 * math.sin(t / 60) + random.gauss(0, 0.2), 2)
    hum  = round(72 + 2 * math.sin(t / 90) + random.gauss(0, 0.3), 1)
    co2  = round(880 + 80 * math.sin(t / 45) + random.gauss(0, 10), 1)
    voc  = round(120 + 30 * random.random(), 1)
    vpd  = round(0.6108 * (17.27 * temp / (temp + 237.3)) * (1 - hum / 100) * 0.01, 3)
    pres = round(1013.0 + random.gauss(0, 0.3), 2)
    dew  = round(temp - (100 - hum) / 5, 2)
    return {
        "temperature": temp, "co2": co2, "humidity": hum,
        "voc": voc, "vpd": vpd, "pressure": pres, "dew_point": dew
    }

def ecrire_ligne_csv():
    date_str    = datetime.now().strftime("%Y_%m_%d")
    fichier     = NAS_PATH / f"internal_{date_str}.csv"
    est_nouveau = not fichier.exists()

    with open(fichier, "a", newline="") as f:
        colonnes = ["timestamp","temperature","co2","humidity","voc","vpd","pressure","dew_point"]
        writer   = csv.DictWriter(f, fieldnames=colonnes)
        if est_nouveau:
            writer.writeheader()
        donnees = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        donnees.update(lire_capteurs_internes())
        writer.writerow(donnees)
        print(f"[{donnees['timestamp']}] Ecrit → {fichier.name}")

print("Collecte demarree. Ctrl+C pour arreter.")
while True:
    try:
        ecrire_ligne_csv()
    except Exception as e:
        print(f"Erreur : {e}")
    time.sleep(60)
```

### Script capteurs externes (météo)

```python
# collect_external.py — 1 mesure toutes les 15 minutes
import csv, time
from datetime import datetime
from pathlib import Path

NAS_PATH = Path("/mnt/nas_data")  # ou Path("Z:\\") sur Windows

def lire_capteurs_externes():
    """
    REMPLACEZ par vos vraies lectures de station météo.
    Exemples : Davis Vantage Pro, Campbell CR1000, capteur pyranomètre, anémomètre.
    """
    import random, math
    t = time.time()
    return {
        "radiation":   round(max(0, 500 * math.sin(math.pi * (t % 86400) / 86400) + random.gauss(0, 20)), 1),
        "wind_speed":  round(abs(3 + 2 * math.sin(t / 30) + random.gauss(0, 0.5)), 2),
        "humidity":    round(60 + 10 * math.sin(t / 120) + random.gauss(0, 2), 1),
        "temperature": round(20 + 6 * math.sin(math.pi * (t % 86400) / 86400) + random.gauss(0, 0.5), 2),
    }

def ecrire_ligne_csv():
    date_str    = datetime.now().strftime("%Y_%m_%d")
    fichier     = NAS_PATH / f"external_{date_str}.csv"
    est_nouveau = not fichier.exists()

    with open(fichier, "a", newline="") as f:
        colonnes = ["timestamp","radiation","wind_speed","humidity","temperature"]
        writer   = csv.DictWriter(f, fieldnames=colonnes)
        if est_nouveau:
            writer.writeheader()
        donnees = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        donnees.update(lire_capteurs_externes())
        writer.writerow(donnees)
        print(f"[{donnees['timestamp']}] Ecrit → {fichier.name}")

print("Collecte externe demarree. Ctrl+C pour arreter.")
while True:
    try:
        ecrire_ligne_csv()
    except Exception as e:
        print(f"Erreur : {e}")
    time.sleep(900)  # 15 minutes
```

---

## ÉTAPE 4 — Monter le NAS sur le PC hôte Docker

### Sur Windows (Docker Desktop)

```powershell
# Monter le NAS en lecteur réseau (remplacez 192.168.1.50 par l'IP réelle)
net use Z: \\192.168.1.50\DATA /user:iot_reader IoT@Serre2024! /persistent:yes

# Vérifier que les fichiers sont visibles
dir Z:\
```

Puis dans **Docker Desktop → Settings → Resources → File Sharing** :
Ajouter le chemin `Z:\` pour que Docker puisse y accéder.

Dans `docker-compose.yml`, modifier le volume :

```yaml
volumes:
  - ./backend:/app
  - Z:/:/app/csv_data     # Windows — lettre de lecteur réseau
```

### Sur Linux (Ubuntu / Debian)

```bash
# 1. Installer le client SMB
sudo apt-get install -y cifs-utils

# 2. Créer le point de montage
sudo mkdir -p /mnt/nas_data

# 3. Monter le partage NAS (remplacez 192.168.1.50 par l'IP réelle)
sudo mount -t cifs //192.168.1.50/DATA /mnt/nas_data \
    -o username=iot_reader,password=IoT@Serre2024!,uid=1000,gid=1000,vers=2.0

# 4. Vérifier
ls /mnt/nas_data/
# → internal_2024_06_20.csv  external_2024_06_20.csv

# 5. Montage automatique au démarrage (ajouter dans /etc/fstab)
echo "//192.168.1.50/DATA /mnt/nas_data cifs username=iot_reader,password=IoT@Serre2024!,uid=1000,gid=1000,vers=2.0,_netdev 0 0" | sudo tee -a /etc/fstab
```

---

## ÉTAPE 5 — Basculer en mode PRODUCTION

### 5.1 Modifier docker-compose.yml (2 changements)

Ouvrez `smart-monitor/docker-compose.yml` :

```yaml
services:
  backend:
    environment:
      SIMULATION_MODE: "false"         # ← 1. Changer "true" en "false"
      CSV_DATA_PATH: /app/csv_data
    volumes:
      - ./backend:/app
      - /mnt/nas_data:/app/csv_data    # ← 2. Décommenter cette ligne (retirer le #)
```

### 5.2 Redémarrer l'application

```bash
cd smart-monitor
docker-compose down
docker-compose up -d --build

# Surveiller les logs
docker-compose logs -f backend
```

**Logs attendus au démarrage :**

```
[Mode] PRODUCTION — lecture CSV reels depuis: /app/csv_data
[CSV Sync] Imported 60 rows from internal_2024_06_20.csv
[CSV Sync] Imported 4 rows from external_2024_06_20.csv
```

> Le backend scanne automatiquement le dossier **toutes les 60 secondes**.

---

## ÉTAPE 6 — Remonter l'état des ventilateurs en temps réel

Les ventilateurs n'ont pas de CSV dédié. Leur état (`ON` / `OFF` / `Erreur`) est mis à jour via l'**API REST** depuis votre automate, relais réseau ou script Python.

### 6.1 Récupérer le token d'authentification

```bash
# Linux / macOS / Git Bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token \
  -d "username=admin&password=admin" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token : $TOKEN"
```

### 6.2 Lister les 6 ventilateurs et leurs IDs

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/devices/ | python3 -m json.tool
```

Réponse :

```json
[
  {"id": "a1b2c3d4-...", "name": "Ventilateur Toiture 1", "location": "roof",    "status": "ON"},
  {"id": "e5f6g7h8-...", "name": "Ventilateur Toiture 2", "location": "roof",    "status": "OFF"},
  {"id": "i9j0k1l2-...", "name": "Ventilateur Toiture 3", "location": "roof",    "status": "ON"},
  {"id": "m3n4o5p6-...", "name": "Ventilateur Plafond 1", "location": "ceiling", "status": "ON"},
  {"id": "q7r8s9t0-...", "name": "Ventilateur Plafond 2", "location": "ceiling", "status": "OFF"},
  {"id": "u1v2w3x4-...", "name": "Ventilateur Plafond 3", "location": "ceiling", "status": "Erreur"}
]
```

### 6.3 Mettre à jour l'état d'un ventilateur

```bash
# États valides : "ON" | "OFF" | "Erreur"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ON"}' \
  http://localhost:8000/api/devices/<UUID>/status
```

### 6.4 Script de mise à jour automatique depuis votre relais/automate

```python
# fan_status_updater.py — met à jour l'etat des ventilateurs via l'API
import requests, time

API_BASE    = "http://localhost:8000"
CREDENTIALS = {"username": "admin", "password": "admin"}

# Mapping UUID ventilateur ↔ signal physique (remplacez les UUIDs par les vrais)
FANS = {
    "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_17",   # Ventilateur Toiture 1
    "e5f6g7h8-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_18",   # Ventilateur Toiture 2
    "i9j0k1l2-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_19",   # Ventilateur Toiture 3
    "m3n4o5p6-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_20",   # Ventilateur Plafond 1
    "q7r8s9t0-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_21",   # Ventilateur Plafond 2
    "u1v2w3x4-xxxx-xxxx-xxxx-xxxxxxxxxxxx": "GPIO_22",   # Ventilateur Plafond 3
}

def get_token():
    r = requests.post(f"{API_BASE}/api/auth/token", data=CREDENTIALS)
    return r.json()["access_token"]

def lire_etat_ventilateur(signal_id):
    """
    ADAPTEZ ICI a votre materiel.
    Retourne : "ON", "OFF" ou "Erreur"

    Exemple Raspberry Pi GPIO :
      import RPi.GPIO as GPIO
      pin = int(signal_id.replace("GPIO_", ""))
      GPIO.setmode(GPIO.BCM)
      GPIO.setup(pin, GPIO.IN)
      return "ON" if GPIO.input(pin) == GPIO.HIGH else "OFF"

    Exemple lecture registre Modbus (automate) :
      from pymodbus.client import ModbusTcpClient
      client = ModbusTcpClient("192.168.1.200")
      result = client.read_coils(address=0, count=6)
      return "ON" if result.bits[index] else "OFF"
    """
    return "ON"  # Placeholder — remplacez par lecture reelle

def update_fan_status(token, fan_id, status):
    r = requests.patch(
        f"{API_BASE}/api/devices/{fan_id}/status",
        json={"status": status},
        headers={"Authorization": f"Bearer {token}"}
    )
    return r.status_code == 200

# Boucle principale ─────────────────────────────────────────────────────────
token = get_token()
print("Mise a jour des ventilateurs demarree. Ctrl+C pour arreter.")

while True:
    try:
        for fan_id, signal in FANS.items():
            etat = lire_etat_ventilateur(signal)
            ok   = update_fan_status(token, fan_id, etat)
            print(f"[{fan_id[:8]}...] {signal} → {etat}  {'OK' if ok else 'ECHEC'}")
    except requests.exceptions.ConnectionError:
        print("Backend inaccessible — nouvelle tentative dans 30s")
        time.sleep(30)
        token = get_token()
    except Exception as e:
        print(f"Erreur : {e}")

    time.sleep(30)  # verification toutes les 30 secondes
```

---

## ÉTAPE 7 — Vérification complète du pipeline

```bash
# 1. Tous les conteneurs doivent être "Up"
docker-compose ps

# 2. Fichiers CSV accessibles depuis le backend
docker exec smart_monitor_backend ls /app/csv_data/

# 3. Forcer un import immédiat (sans attendre 60 secondes)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/csv/import | python3 -m json.tool

# 4. Dernière donnée interne
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/internal/latest | python3 -m json.tool

# 5. Dernière donnée externe
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/external/latest | python3 -m json.tool

# 6. État du dossier CSV
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/csv/status | python3 -m json.tool
```

**Interface Swagger (toutes les routes API) :**

```
http://localhost:8000/docs
```

---

## Checklist de mise en production

```
SYNOLOGY DS115j
  [ ] DSM installe et accessible via navigateur (192.168.X.X)
  [ ] Dossier partage "DATA" cree
  [ ] Service SMB active (version SMB2 minimum)
  [ ] Utilisateur "iot_reader" cree avec acces Lecture/Ecriture sur DATA

CAPTEURS IoT
  [ ] Script collect_internal.py adapte au materiel et teste
  [ ] Script collect_external.py adapte au materiel et teste
  [ ] Fichiers ecrits sur le NAS au bon format
  [ ] Nommage correct : internal*.csv / external*.csv
  [ ] Frequence : 1 min (interne) / 15 min (externe)
  [ ] Test manuel : ouvrir le CSV et verifier les colonnes

PC / SERVEUR HOTE DOCKER
  [ ] NAS monte : /mnt/nas_data (Linux) ou Z:\ (Windows)
  [ ] Montage automatique configure (/etc/fstab sur Linux)
  [ ] Docker peut acceder au dossier monte (File Sharing sur Docker Desktop)

DOCKER / APPLICATION
  [ ] SIMULATION_MODE: "false" dans docker-compose.yml
  [ ] Volume NAS decommente dans docker-compose.yml
  [ ] docker-compose down && docker-compose up -d --build execute
  [ ] Logs backend : "[Mode] PRODUCTION" visible
  [ ] Logs backend : "[CSV Sync] Imported X rows" visible toutes les 60s

VENTILATEURS
  [ ] IDs recuperes via GET /api/devices/
  [ ] Script fan_status_updater.py adapte et teste
  [ ] Script lance en continu (service systemd, tache planifiee Windows, etc.)
  [ ] Interface "Etat Ventilateurs" reflete les etats reels

VALIDATION FINALE
  [ ] Dashboard affiche T° 18-23°C, Humidite 70-75%, CO2 800-1000ppm
  [ ] Alertes se declenchent si seuils fraisier depasses
  [ ] Historique accumule les donnees sur plusieurs jours
  [ ] Vue 3D affiche les capteurs actifs avec couleurs en temps reel
```

---

## Fréquences et synchronisation

| Flux | Frequence recommandee | Auto-import backend |
|---|---|---|
| Capteurs internes (T°, CO₂, Hum…) | 1 mesure / 1 minute | Toutes les 60 secondes |
| Station meteo externe | 1 mesure / 15 minutes | Toutes les 60 secondes |
| Etat ventilateurs (API) | 1 mise a jour / 30 secondes | Immediat (API REST) |

---

## Alertes automatiques — Seuils fraisier

Le backend génère des alertes automatiquement quand les valeurs sortent des plages optimales :

| Capteur | Plage optimale | Alerte Warning | Alerte Critique |
|---|---|---|---|
| Température | 18 – 23 °C | < 18 ou > 23 °C | < 10 ou > 30 °C |
| Humidité | 70 – 75 % | < 70 ou > 75 % | < 60 ou > 85 % |
| CO₂ | 800 – 1000 ppm | < 800 ou > 1000 ppm | > 1200 ppm |
| VOC | — | > 300 ppb | > 400 ppb |

Les alertes sont visibles dans l'onglet **Alertes** et consultables via :

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/alerts/?limit=20" | python3 -m json.tool
```

---

## Commandes Docker utiles

```bash
# Démarrer toute l'application
docker-compose up -d --build

# Arrêter
docker-compose down

# Voir les logs en temps réel
docker-compose logs -f

# Logs d'un seul service
docker-compose logs -f backend
docker-compose logs -f frontend

# Redémarrer le backend uniquement
docker-compose restart backend

# Entrer dans le conteneur backend pour déboguer
docker exec -it smart_monitor_backend bash

# Vérifier les fichiers CSV dans le conteneur
docker exec smart_monitor_backend ls -lh /app/csv_data/

# Tout supprimer (base de données comprise)
docker-compose down -v
```
