FROM python:3.11-slim

WORKDIR /app

# Pas besoin de build-essential/libpq-dev — tous les packages utilisent
# des wheels pré-compilées (psycopg2-binary, asyncpg, cryptography…)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/csv_data

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
