# Guide Complet — Connexion aux Données Réelles CSV

## Vue d'ensemble

```
Vos Capteurs Physiques
        │
        ▼
   Synology NAS DS115j
   (stocke les fichiers CSV)
        │  Partage réseau SMB (\\NAS_IP\data)
        ▼
   PC Windows
   (monte le partage NAS comme dossier local)
        │  Volume Docker
        ▼
   Conteneur Backend (FastAPI)
   (lit les CSV, insère en PostgreSQL)
        │
        ▼
   Interface Web — Tableaux de bord, Vue 3D
```

---

## PARTIE 1 — Format des fichiers CSV

### 1.1 Fichiers de capteurs internes (greenhouse)

**Nom attendu :** `internal_YYYYMMDD.csv` ou n'importe quel nom commençant par `internal`

Exemples valides :
- `internal_20260618.csv`
- `internal_greenhouse_juin2026.csv`
- `internal.csv`

**Colonnes — vous pouvez utiliser les noms français OU anglais :**

| Colonne FR | Colonne EN | Description | Unité |
|-----------|-----------|-------------|-------|
| `timestamp` | `timestamp` | Date/heure de la mesure | ISO 8601 ou YYYY-MM-DD HH:MM:SS |
| `temperature` ou `temp` | `temperature` | Température | °C |
| `humidite` ou `hum` | `humidity` | Humidité relative | % |
| `co2` | `co2` | Concentration CO₂ | ppm |
| `voc` | `voc` | Composés organiques volatils | ppb |
| `vpd` | `vpd` | Déficit de pression de vapeur | kPa |
| `pression` | `pressure` | Pression atmosphérique | hPa |
| `point_rosee` | `dew_point` | Point de rosée | °C |

**Exemple de fichier `internal_20260618.csv` :**
```csv
timestamp,temperature,humidity,co2,voc,vpd,pressure,dew_point
2026-06-18 08:00:00,22.5,58.2,445,115,0.82,1013.4,13.9
2026-06-18 08:05:00,22.7,57.9,448,118,0.84,1013.2,14.1
2026-06-18 08:10:00,23.1,57.3,452,122,0.87,1013.0,14.3
2026-06-18 08:15:00,23.4,56.8,460,125,0.90,1012.9,14.5
```

> **⚠ Colonnes manquantes :** Si votre appareil ne mesure pas toutes les colonnes, laissez-les vides ou omettez-les. Le système accepte des données partielles.

---

### 1.2 Fichiers de capteurs externes (météo/environnement)

**Nom attendu :** `external_YYYYMMDD.csv` ou tout nom commençant par `external`

**Colonnes :**

| Colonne FR | Colonne EN | Description | Unité |
|-----------|-----------|-------------|-------|
| `timestamp` | `timestamp` | Date/heure | ISO 8601 |
| `radiation_solaire` | `radiation` | Radiation solaire | W/m² |
| `vitesse_vent` | `wind_speed` | Vitesse du vent | m/s |
| `humidite` | `humidity` | Humidité extérieure | % |
| `temperature` ou `temp` | `temperature` | Température extérieure | °C |

**Exemple de fichier `external_20260618.csv` :**
```csv
timestamp,radiation,wind_speed,humidity,temperature
2026-06-18 08:00:00,320.5,2.3,62.0,18.4
2026-06-18 08:05:00,335.2,2.5,61.5,18.7
2026-06-18 08:10:00,348.0,2.1,61.0,19.1
2026-06-18 08:15:00,361.5,1.9,60.5,19.4
```

---

### 1.3 Règles importantes

- **Encodage :** UTF-8 (standard)
- **Séparateur :** virgule `,` (CSV standard)
- **Format timestamp :** `YYYY-MM-DD HH:MM:SS` ou `YYYY-MM-DDTHH:MM:SS`
- **Valeurs manquantes :** laisser vide ou mettre `NULL` / `NaN`
- **Les noms de colonnes ne sont pas sensibles à la casse** (`Temperature`, `TEMPERATURE`, `temperature` sont tous acceptés)

---

## PARTIE 2 — Configuration du Synology NAS DS115j

### 2.1 Activer le partage SMB sur le NAS

1. Connectez-vous à l'interface DSM de votre NAS :
   - Ouvrez un navigateur → `http://[IP_DU_NAS]:5000`
   - Exemple : `http://192.168.1.50:5000`

2. Allez dans **Panneau de configuration** → **Services de fichiers** → **SMB/AFP/NFS**

3. Dans l'onglet **SMB**, cochez **Activer le service SMB**

4. Cliquez **Appliquer**

### 2.2 Créer le dossier partagé CSV

1. Allez dans **File Station** (application DSM)

2. Créez un dossier nommé `smart_monitor_csv` (ou le nom de votre choix)

3. Faites **clic droit** → **Propriétés** → **Permissions**
   - Autorisez l'utilisateur admin (ou créez un utilisateur dédié) en **Lecture/Écriture**

4. Allez dans **Panneau de configuration** → **Dossier partagé**

5. Cliquez **Créer** → donnez le nom `smart_monitor_csv`
   - Cochez **Masquer ce dossier partagé dans «Mes emplacements réseau»** (optionnel)
   - Cliquez **Suivant** → **Suivant** → **Appliquer**

6. Dans les **Permissions** du dossier partagé, autorisez votre utilisateur

### 2.3 Trouver l'IP de votre NAS

Depuis PowerShell sur votre PC Windows :
```powershell
ping diskstation
```
ou regardez dans l'interface DSM → coin supérieur droit → info système.

---

## PARTIE 3 — Monter le partage NAS sur Windows

### 3.1 Montage permanent (recommandé)

Dans PowerShell **en administrateur** :

```powershell
# Remplacez 192.168.1.50 par l'IP de votre NAS
# Remplacez smart_monitor_csv par le nom de votre dossier partagé
# Remplacez Z: par la lettre de lecteur souhaitée

net use Z: \\192.168.1.50\smart_monitor_csv /user:admin VotreMotDePasseNAS /persistent:yes
```

Vérifiez que le montage est actif :
```powershell
net use
```
Vous devriez voir `Z:` dans la liste avec le statut `OK`.

### 3.2 Vérification du montage

```powershell
# Lister le contenu du NAS
dir Z:\

# Créer un fichier test pour vérifier l'accès en écriture
echo "test" > Z:\test.txt
dir Z:\test.txt
del Z:\test.txt
```

Si vous voyez le fichier, le montage est opérationnel.

### 3.3 Résolution de problèmes de connexion SMB

Si `net use` échoue :

```powershell
# Vérifier que le NAS est accessible
ping 192.168.1.50

# Activer SMB1 si nécessaire (DS115j est ancien)
Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# Ou essayer avec le nom réseau
net use Z: \\DISKSTATION\smart_monitor_csv /user:admin MotDePasse /persistent:yes
```

---

## PARTIE 4 — Configurer Docker pour lire le NAS

### 4.1 Modifier `docker-compose.yml`

Ouvrez `smart-monitor\docker-compose.yml` et modifiez la section `backend` :

**Avant :**
```yaml
  backend:
    ...
    environment:
      CSV_DATA_PATH: /app/csv_data
      NAS_PATH: ""
    volumes:
      - ./backend:/app
      - csv_data:/app/csv_data
```

**Après — avec le NAS monté sur Z: :**
```yaml
  backend:
    ...
    environment:
      CSV_DATA_PATH: /app/nas_data
      NAS_PATH: ""
    volumes:
      - ./backend:/app
      - Z:/:/app/nas_data    # ← Montez le lecteur NAS ici
```

> **Note :** Sur Windows, le chemin Docker pour un lecteur `Z:` s'écrit `Z:/` (avec slash, pas antislash).

### 4.2 Si votre NAS est monté comme sous-dossier (pas lettre de lecteur)

Si vous avez monté le NAS dans `C:\NAS\data\` :
```yaml
    volumes:
      - C:/NAS/data:/app/nas_data
```

### 4.3 Appliquer la configuration

```powershell
# Dans le dossier smart-monitor
docker-compose down
docker-compose up -d
```

---

## PARTIE 5 — Déposer les fichiers CSV

### 5.1 Manuellement (test)

Copiez vos fichiers CSV directement dans le lecteur monté :

```powershell
# Copier un fichier depuis votre PC vers le NAS
copy C:\Mes_Donnees\internal_20260618.csv Z:\internal_20260618.csv
copy C:\Mes_Donnees\external_20260618.csv Z:\external_20260618.csv
```

### 5.2 Depuis votre système d'acquisition de données

Configurez votre logger/datalogger pour qu'il écrive directement dans le chemin réseau :
```
\\192.168.1.50\smart_monitor_csv\internal_YYYYMMDD.csv
```

### 5.3 Organisation recommandée des fichiers

```
Z:\                          ← Racine du partage NAS
├── internal_20260601.csv    ← Un fichier par jour (ou par heure)
├── internal_20260602.csv
├── internal_20260603.csv
├── external_20260601.csv
├── external_20260602.csv
└── external_20260603.csv
```

> Le système lit **tous** les fichiers correspondant aux patterns `internal*.csv` et `external*.csv` à chaque cycle de synchronisation (toutes les 60 secondes).

---

## PARTIE 6 — Vérifier que l'import fonctionne

### 6.1 Vérifier via l'API Swagger

Ouvrez dans votre navigateur :
```
http://localhost:8000/docs
```

Connectez-vous avec `admin` / `admin`, puis testez :

**GET `/api/csv/status`** — Vérifier que Docker voit bien le dossier :
```json
{
  "status": "ok",
  "path": "/app/nas_data",
  "file_count": 4,
  "files": [
    {"name": "internal_20260618.csv", "size_kb": 12.3},
    {"name": "external_20260618.csv", "size_kb": 8.1}
  ]
}
```

**POST `/api/csv/import`** — Déclencher l'import manuellement :
```json
{
  "status": "ok",
  "results": {
    "internal": [{"file": "internal_20260618.csv", "rows": 288}],
    "external": [{"file": "external_20260618.csv", "rows": 288}],
    "errors": []
  }
}
```

### 6.2 Vérifier dans les logs Docker

```powershell
docker logs smart_monitor_backend --tail 50 -f
```

Vous devriez voir des lignes comme :
```
[CSV Sync] Imported 288 rows from internal_20260618.csv
[CSV Sync] Imported 288 rows from external_20260618.csv
```

### 6.3 Vérifier dans l'interface web

1. Allez sur **http://localhost:3000**
2. Page **Dashboard** → les KPI cards doivent afficher vos vraies valeurs
3. Page **Historique** → les graphiques doivent montrer vos données historiques
4. Page **Vue 3D** → les nœuds de capteurs doivent afficher vos mesures

---

## PARTIE 7 — Désactiver le simulateur (données 100% réelles)

Par défaut, le simulateur génère des données toutes les 60 secondes **en parallèle** des imports CSV. Pour utiliser uniquement vos données réelles :

Ouvrez `smart-monitor\backend\main.py` et commentez la ligne du simulateur :

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_users()
    await seed_default_devices()
    # sim_task = asyncio.create_task(simulator.run())   # ← Commenter cette ligne
    csv_task = asyncio.create_task(auto_sync_csv_folder(interval_seconds=60))
    yield
    # sim_task.cancel()                                  # ← Et cette ligne
    csv_task.cancel()
```

Puis redémarrez :
```powershell
docker restart smart_monitor_backend
```

---

## PARTIE 8 — Synchronisation automatique en continu

Le backend vérifie automatiquement le dossier NAS **toutes les 60 secondes**.

Pour changer l'intervalle (ex: toutes les 5 minutes) :

Dans `smart-monitor\backend\main.py`, modifiez :
```python
csv_task = asyncio.create_task(auto_sync_csv_folder(interval_seconds=300))  # 5 minutes
```

---

## PARTIE 9 — Résumé des modifications dans docker-compose.yml

Voici le fichier `docker-compose.yml` complet avec la configuration NAS :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: smart_monitor_db
    environment:
      POSTGRES_USER: smart_user
      POSTGRES_PASSWORD: smart_pass
      POSTGRES_DB: smart_monitor
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smart_user -d smart_monitor"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - smart_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart_monitor_backend
    environment:
      DATABASE_URL: postgresql+asyncpg://smart_user:smart_pass@postgres:5432/smart_monitor
      DATABASE_SYNC_URL: postgresql://smart_user:smart_pass@postgres:5432/smart_monitor
      SECRET_KEY: votre-cle-secrete-jwt-changez-en-production
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 480
      # ↓ Pointer vers le dossier NAS monté dans le conteneur
      CSV_DATA_PATH: /app/nas_data
      NAS_PATH: ""
      CORS_ORIGINS: "http://localhost:3000,http://localhost:5173"
    volumes:
      - ./backend:/app
      # ↓ CHANGEZ Z:/ par votre lettre de lecteur NAS
      - Z:/:/app/nas_data
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - smart_net
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  smart_net:
    driver: bridge
```

---

## PARTIE 10 — Tableau de bord de diagnostic

| Étape | Commande de vérification | Résultat attendu |
|-------|--------------------------|-----------------|
| NAS accessible | `ping 192.168.1.50` | Réponse < 5ms |
| Partage monté | `dir Z:\` | Liste les fichiers CSV |
| Docker lit le NAS | GET `/api/csv/status` | `"status": "ok"` avec liste de fichiers |
| Import fonctionne | POST `/api/csv/import` | `"errors": []` |
| Logs backend | `docker logs smart_monitor_backend` | `[CSV Sync] Imported X rows` |
| Données visibles | Dashboard web | KPIs affichent valeurs réelles |

---

## Annexe — Adapter le format de vos colonnes

Si vos CSV ont des noms de colonnes différents, modifiez le fichier :
`smart-monitor\backend\csv_reader\reader.py`

Cherchez `INTERNAL_COLUMN_MAP` et ajoutez vos noms :

```python
INTERNAL_COLUMN_MAP = {
    "timestamp": "timestamp",
    "temperature": "temperature",
    "temp": "temperature",
    "t_air": "temperature",          # ← Ajoutez vos noms ici
    "temperature_air": "temperature", # ← Exemple
    "co2": "co2",
    "co2_ppm": "co2",                # ← Exemple
    "humidity": "humidity",
    "rh": "humidity",                # ← Relative Humidity
    ...
}
```

Après modification, redémarrez :
```powershell
docker restart smart_monitor_backend
```
