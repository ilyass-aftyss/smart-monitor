# Guide complet — Passage en mode Production (données IoT réelles)

## Synology DS115j + Capteurs IoT → Smart Monitor

---

## VUE D'ENSEMBLE DU PIPELINE

```
Capteurs IoT (internes + externes)
        │
        │  écrivent des fichiers CSV
        ▼
Synology DS115j  (\\NAS\DATA\)
        │
        │  dossier partagé SMB/NFS
        ▼
PC / Serveur hôte
        │
        │  montage réseau → /mnt/nas_data/
        ▼
Docker Backend  (CSV_DATA_PATH=/app/csv_data)
        │
        │  scan automatique toutes les 60 secondes
        ▼
PostgreSQL  →  API REST  →  Frontend React
```

---

## ÉTAPE 1 — Configurer le Synology DS115j

### 1.1 Accéder au Synology DSM

1. Brancher le NAS au réseau local (même switch que votre PC / serveur)
2. Ouvrir un navigateur et aller sur : `http://find.synology.com`
   ou directement `http://<IP_du_NAS>` (ex: `http://192.168.1.100`)
3. Terminer l'assistant de configuration initiale si ce n'est pas fait

### 1.2 Créer le dossier partagé

Dans **DSM → Panneau de configuration → Dossier partagé** :

1. Cliquer **Créer**
2. Nom du dossier : `DATA`
3. Description : `Smart Monitor CSV Data`
4. Laisser les options par défaut
5. **Permissions** : donner accès **Lecture/Écriture** à l'utilisateur qui sera utilisé

### 1.3 Activer le partage SMB (Windows / Linux)

Dans **DSM → Panneau de configuration → Services de fichiers → SMB** :

1. Cocher **Activer le service SMB**
2. Version minimum : **SMB2** (recommandé)
3. Cliquer **Appliquer**

### 1.4 Créer un utilisateur dédié pour le montage

Dans **DSM → Panneau de configuration → Utilisateur** :

1. Créer un utilisateur : `iot_reader`
2. Mot de passe fort : ex. `IoT@Serre2024!`
3. Lui donner accès **Lecture/Écriture** sur le dossier `DATA`

---

## ÉTAPE 2 — Structure des fichiers CSV

### 2.1 Format obligatoire — Capteurs internes

Le backend recherche les fichiers nommés `internal*.csv`  
(ex: `internal_2024_01_15.csv`, `internal_capteurs.csv`)

**Colonnes requises :**

```csv
timestamp,temperature,co2,humidity,voc,vpd,pressure,dew_point
2024-01-15 08:00:00,22.5,450,65.2,125,0.82,1013.2,15.4
2024-01-15 08:01:00,22.7,455,64.8,128,0.84,1013.1,15.3
2024-01-15 08:02:00,22.6,452,65.0,122,0.83,1013.3,15.5
```

**Unités :**

| Colonne     | Unité | Description             |
|-------------|-------|-------------------------|
| timestamp   | —     | Format: YYYY-MM-DD HH:MM:SS |
| temperature | °C    | Température interne     |
| co2         | ppm   | Dioxyde de carbone      |
| humidity    | %     | Humidité relative       |
| voc         | ppb   | Composés organiques     |
| vpd         | kPa   | Déficit de pression de vapeur |
| pressure    | hPa   | Pression atmosphérique  |
| dew_point   | °C    | Point de rosée          |

> **Noms alternatifs acceptés** (le backend les normalise automatiquement) :
> `temp` → temperature | `hum` → humidity | `pression` → pressure | `point_rosee` → dew_point

---

### 2.2 Format obligatoire — Capteurs externes

Le backend recherche les fichiers nommés `external*.csv`  
(ex: `external_meteo.csv`, `external_2024_01_15.csv`)

```csv
timestamp,radiation,wind_speed,humidity,temperature
2024-01-15 08:00:00,350.5,2.3,58.0,18.2
2024-01-15 08:15:00,420.0,2.8,57.5,19.0
2024-01-15 08:30:00,510.2,3.1,56.8,19.8
```

**Unités :**

| Colonne    | Unité | Description          |
|------------|-------|----------------------|
| timestamp  | —     | Format: YYYY-MM-DD HH:MM:SS |
| radiation  | W/m²  | Radiation solaire    |
| wind_speed | m/s   | Vitesse du vent      |
| humidity   | %     | Humidité externe     |
| temperature| °C    | Température externe  |

> **Noms alternatifs acceptés** :
> `radiation_solaire` → radiation | `vitesse_vent` → wind_speed | `humidite` → humidity | `temp` → temperature

---

## ÉTAPE 3 — Programmer les capteurs IoT pour écrire sur le NAS

### Option A — Capteur avec sortie CSV directe (Raspberry Pi, Arduino + ESP32, etc.)

Si votre capteur est un micro-contrôleur avec accès réseau, voici un exemple Python à adapter :

```python
# script_capteur_interne.py — à exécuter sur le Raspberry Pi / PC relié aux capteurs
import csv
import time
from datetime import datetime
from pathlib import Path

# ─── Adaptez ce chemin au point de montage SMB ───
NAS_PATH = Path("/mnt/nas_data")   # Linux
# NAS_PATH = Path("Z:\\")           # Windows (si NAS monté en Z:)

def lire_capteurs():
    """Remplacez ici par la lecture réelle de vos capteurs."""
    import random, math
    t = time.time()
    return {
        "temperature": round(22 + 2 * math.sin(t / 60) + random.gauss(0, 0.2), 2),
        "co2":         round(450 + 100 * random.random(), 1),
        "humidity":    round(60 + 5 * math.sin(t / 90) + random.gauss(0, 0.5), 1),
        "voc":         round(120 + 30 * random.random(), 1),
        "vpd":         round(0.8 + 0.1 * random.random(), 3),
        "pressure":    round(1013.0 + random.gauss(0, 0.3), 2),
        "dew_point":   round(15.0 + random.gauss(0, 0.5), 2),
    }

def ecrire_csv():
    date_str = datetime.now().strftime("%Y_%m_%d")
    fichier  = NAS_PATH / f"internal_{date_str}.csv"
    nouveau  = not fichier.exists()

    with open(fichier, "a", newline="") as f:
        champs = ["timestamp","temperature","co2","humidity","voc","vpd","pressure","dew_point"]
        writer = csv.DictWriter(f, fieldnames=champs)
        if nouveau:
            writer.writeheader()
        row = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        row.update(lire_capteurs())
        writer.writerow(row)
    print(f"[{row['timestamp']}] Donnée écrite → {fichier.name}")

# Boucle — 1 mesure par minute
while True:
    try:
        ecrire_csv()
    except Exception as e:
        print(f"Erreur: {e}")
    time.sleep(60)
```

### Option B — Capteurs avec logiciel propriétaire (ex: Campbell, Vaisala, etc.)

Configurez le logiciel du capteur pour :
- **Destination de l'export** : `\\<IP_NAS>\DATA\` 
- **Nom du fichier** : `internal_YYYYMMDD.csv`
- **Intervalle d'export** : 1 minute (données internes) / 15 minutes (externes)
- **Format** : CSV avec en-tête (header)

---

## ÉTAPE 4 — Monter le dossier NAS sur le PC/serveur hôte Docker

### Sur Linux (Ubuntu / Debian)

```bash
# 1. Installer le client SMB
sudo apt-get install cifs-utils -y

# 2. Créer le point de montage
sudo mkdir -p /mnt/nas_data

# 3. Monter le partage NAS
#    Remplacez 192.168.1.100 par l'IP réelle de votre DS115j
sudo mount -t cifs //192.168.1.100/DATA /mnt/nas_data \
    -o username=iot_reader,password=IoT@Serre2024!,uid=1000,gid=1000,vers=2.0

# 4. Vérifier que les fichiers CSV sont visibles
ls /mnt/nas_data/
# → internal_2024_01_15.csv  external_2024_01_15.csv ...

# 5. Montage automatique au démarrage — ajouter dans /etc/fstab :
echo "//192.168.1.100/DATA /mnt/nas_data cifs username=iot_reader,password=IoT@Serre2024!,uid=1000,gid=1000,vers=2.0,_netdev 0 0" | sudo tee -a /etc/fstab
```

### Sur Windows (si Docker Desktop)

```powershell
# Dans l'Explorateur Windows : \\192.168.1.100\DATA
# Ou en ligne de commande :
net use Z: \\192.168.1.100\DATA /user:iot_reader IoT@Serre2024! /persistent:yes
```

> Sur Windows avec Docker Desktop, partagez le dossier `Z:\` avec Docker via :  
> **Docker Desktop → Settings → Resources → File Sharing → Ajouter Z:\**

---

## ÉTAPE 5 — Basculer l'application en mode Production

### 5.1 Modifier docker-compose.yml

Ouvrez `smart-monitor/docker-compose.yml` et faites **3 changements** :

```yaml
environment:
  # 1. Désactiver le simulateur
  SIMULATION_MODE: "false"           # ← changer de "true" à "false"
  
  # 2. Pointer vers le dossier NAS monté
  CSV_DATA_PATH: /app/csv_data       # ← laisser tel quel

volumes:
  - ./backend:/app
  # 3. Décommenter la ligne NAS (retirer le # devant) :
  - /mnt/nas_data:/app/csv_data      # ← décommenter cette ligne
```

**Résultat final dans docker-compose.yml :**

```yaml
services:
  backend:
    environment:
      SIMULATION_MODE: "false"
      CSV_DATA_PATH: /app/csv_data
    volumes:
      - ./backend:/app
      - /mnt/nas_data:/app/csv_data  # ← NAS monté ici
```

### 5.2 Redémarrer les conteneurs

```bash
cd smart-monitor
docker-compose down
docker-compose up -d --build

# Vérifier les logs du backend
docker-compose logs -f backend
```

**Vous devez voir :**
```
[Mode] PRODUCTION — lecture CSV réels depuis: /app/csv_data
[CSV Sync] Imported 60 rows from internal_2024_01_15.csv
[CSV Sync] Imported 4 rows from external_2024_01_15.csv
```

---

## ÉTAPE 6 — Vérification complète du pipeline

### 6.1 Vérifier que le NAS est accessible

```bash
# Depuis l'hôte Docker
ls /mnt/nas_data/
# → doit afficher vos fichiers CSV

# Depuis l'intérieur du conteneur
docker exec smart_monitor_backend ls /app/csv_data/
# → doit afficher les mêmes fichiers
```

### 6.2 Vérifier l'import CSV via l'API

```bash
# Récupérer un token (mot de passe par défaut: admin)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token \
  -d "username=admin&password=admin" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Vérifier l'état du dossier CSV
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/csv/status

# Déclencher un import manuel immédiat
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/csv/import
```

### 6.3 Vérifier les données dans l'API

```bash
# Dernière lecture interne
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/internal/latest

# Dernière lecture externe
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/external/latest
```

**Réponse attendue :**
```json
{
  "temperature": 22.5,
  "co2": 450.0,
  "humidity": 65.2,
  "voc": 125.0,
  "vpd": 0.82,
  "pressure": 1013.2,
  "dew_point": 15.4,
  "timestamp": "2024-01-15T08:00:00"
}
```

---

## ÉTAPE 7 — Gestion des états ventilateurs (Actionneurs)

Les ventilateurs sont gérés manuellement via l'interface ou l'API.  
Si vos ventilateurs sont connectés à un automate (PLC) ou un relais réseau, vous pouvez synchroniser leur état via l'API :

```bash
# Lister tous les ventilateurs
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/devices/

# Mettre à jour l'état d'un ventilateur (admin uniquement)
# Remplacez <DEVICE_ID> par l'UUID du ventilateur
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ON"}' \
  http://localhost:8000/api/devices/<DEVICE_ID>/status

# États possibles : "ON" | "OFF" | "Erreur" | "Maintenance"
```

---

## RÉSUMÉ — Checklist de mise en production

```
✅ SYNOLOGY DS115j
   □ DSM installé et accessible
   □ Dossier partagé "DATA" créé
   □ Service SMB activé
   □ Utilisateur iot_reader créé avec accès au dossier DATA

✅ CAPTEURS IoT
   □ Script de lecture capteurs adapté et testé
   □ Fichiers CSV écrits sur le NAS au bon format
   □ Nommage correct : internal*.csv / external*.csv
   □ Fréquence : 1 min (interne) / 15 min (externe)

✅ PC / SERVEUR HÔTE
   □ NAS monté sur /mnt/nas_data (Linux) ou Z:\ (Windows)
   □ Montage automatique configuré (/etc/fstab)
   □ Fichiers visibles depuis l'hôte

✅ DOCKER / APPLICATION
   □ SIMULATION_MODE: "false" dans docker-compose.yml
   □ Volume NAS décommenté dans docker-compose.yml
   □ docker-compose down && docker-compose up -d --build
   □ Logs backend montrent "[Mode] PRODUCTION"
   □ Import CSV confirmé dans les logs

✅ VALIDATION FINALE
   □ /api/internal/latest retourne des données réelles
   □ /api/external/latest retourne des données réelles
   □ Dashboard frontend affiche les vraies valeurs
   □ Alertes se déclenchent si seuils dépassés
```

---

## Fréquence de synchronisation

| Type de données | Fréquence capteur | Sync NAS → Backend |
|-----------------|------------------|--------------------|
| Interne (temp, CO₂, etc.) | 1 mesure / minute | Toutes les 60 secondes |
| Externe (météo) | 1 mesure / 15 min | Toutes les 60 secondes |

Le backend lit le dossier CSV **toutes les 60 secondes** automatiquement.  
Vous pouvez forcer un import immédiat via `POST /api/csv/import`.

---

## Adresse IP du NAS DS115j

Pour trouver l'IP de votre DS115j sur le réseau local :
- Utiliser le site `find.synology.com` depuis un navigateur sur le même réseau
- Ou vérifier les baux DHCP sur votre box/routeur internet
- Ou utiliser la commande : `arp -a | grep -i synology`
