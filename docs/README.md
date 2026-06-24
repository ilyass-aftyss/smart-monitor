# Smart Environmental Monitoring & 3D Visualization Platform

Plateforme industrielle de surveillance environnementale avec visualisation 3D interactive.

---

## Prérequis

| Logiciel | Version minimale | Téléchargement |
|----------|-----------------|----------------|
| **Docker Desktop** | 24+ | https://www.docker.com/products/docker-desktop |
| **Node.js** | 18+ | https://nodejs.org (LTS recommandé) |

> Le frontend tourne en **natif sur Windows** (pas dans Docker), ce qui évite les problèmes réseau lors du `npm install`.

---

## Démarrage rapide

### Option A — Script automatique (recommandé)

```bat
REM Double-cliquez sur start.bat  OU  exécutez dans PowerShell :
.\start.bat
```

Le script :
1. Lance PostgreSQL + Backend via Docker
2. Attend que l'API soit prête
3. Installe les dépendances npm (première fois uniquement)
4. Lance le frontend Vite

### Option B — Démarrage manuel

**Terminal 1 (PowerShell / CMD) — Docker :**
```bat
docker-compose up -d --build
```

**Terminal 2 — Frontend :**
```bat
cd frontend
npm install
npm run dev
```

### Arrêt
```bat
.\stop.bat
REM puis Ctrl+C dans la fenêtre du frontend
```

---

## Accès à l'application

| URL | Service |
|-----|---------|
| **http://localhost:5173** | Interface web (frontend) |
| http://localhost:8000/docs | API Swagger (backend) |
| localhost:5432 | PostgreSQL |

## Connexion

| Utilisateur | Mot de passe | Rôle |
|------------|--------------|------|
| `admin` | `admin` | Accès complet |
| `viewer` | `admin` | Consultation |

---

## Architecture

```
smart-monitor/
├── start.bat            → Démarrage automatique (Windows)
├── stop.bat             → Arrêt
├── docker-compose.yml   → PostgreSQL + Backend
├── backend/             → FastAPI (Python 3.11) — dans Docker
│   ├── api/             → Routes REST
│   ├── models/          → SQLAlchemy models
│   ├── services/        → Simulateur de données, alertes
│   ├── csv_reader/      → Import CSV (Synology NAS)
│   └── main.py
├── frontend/            → React + Vite + Three.js — natif Windows
│   └── src/
│       ├── pages/       → Dashboard, History, External, Devices, Alerts, 3D
│       ├── components/
│       └── services/
├── database/            → Scripts SQL d'initialisation
└── docs/
```

---

## Connexion au Synology NAS (DS115j)

### Version 1 : Import CSV via partage réseau (SMB)

Montez le partage Synology sur Windows :
```
\\<IP_NAS>\csv_data
```

Puis mappez ce dossier dans `docker-compose.yml` :
```yaml
volumes:
  - //NAS_IP/csv_data:/app/csv_data
```

### Format des fichiers CSV

Placez vos fichiers dans le dossier monté avec les noms :
- `internal_YYYYMMDD.csv` — données internes (capteurs greenhouse)
- `external_YYYYMMDD.csv` — données externes (météo)

**Colonnes attendues (`internal`) :**
```
timestamp, zone_id, temperature, humidity, co2, light_intensity, soil_moisture
```

**Colonnes attendues (`external`) :**
```
timestamp, temperature, humidity, wind_speed, wind_direction, solar_radiation, uv_index, rainfall
```

---

## Variables d'environnement

Modifiez dans `docker-compose.yml` si nécessaire :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SECRET_KEY` | `your-super-secret-jwt-key-...` | **À changer en production** |
| `CSV_DATA_PATH` | `/app/csv_data` | Chemin local CSV dans le conteneur |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Durée session (8h) |

---

## Changer les mots de passe

```python
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('votre_mdp'))"
```

Remplacez le hash dans `database/init.sql`, puis :
```bat
docker-compose down -v
docker-compose up -d
```

---

## Dépannage

| Problème | Solution |
|----------|---------|
| `npm install` lent | Normal à la 1re fois (~2-5 min selon connexion) |
| Backend `500 error` au démarrage | Attendez 30s que PostgreSQL s'initialise |
| Port 8000 déjà utilisé | `docker-compose down` puis relancez |
| Port 5173 déjà utilisé | Changez `port: 5173` dans `frontend/vite.config.ts` |
| Données vides | Le simulateur génère des données toutes les 60s automatiquement |
