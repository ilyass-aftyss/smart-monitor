CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    temperature FLOAT,
    co2 FLOAT,
    humidity FLOAT,
    voc FLOAT,
    vpd FLOAT,
    pressure FLOAT,
    dew_point FLOAT
);

CREATE TABLE IF NOT EXISTS external_data (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    radiation FLOAT,
    wind_speed FLOAT,
    humidity FLOAT,
    temperature FLOAT
);

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'OFF',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    value FLOAT,
    threshold FLOAT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_internal_data_timestamp ON internal_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_external_data_timestamp ON external_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

INSERT INTO users (username, email, hashed_password, role) VALUES
('admin', 'admin@smartmonitor.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjAfozXrpPx4/epEEBj7K2', 'admin'),
('viewer', 'viewer@smartmonitor.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjAfozXrpPx4/epEEBj7K2', 'user')
ON CONFLICT DO NOTHING;

INSERT INTO devices (name, device_type, location, status) VALUES
('Ventilateur Toiture 1', 'fan', 'roof', 'ON'),
('Ventilateur Toiture 2', 'fan', 'roof', 'OFF'),
('Ventilateur Toiture 3', 'fan', 'roof', 'ON'),
('Ventilateur Plafond 1', 'fan', 'ceiling', 'ON'),
('Ventilateur Plafond 2', 'fan', 'ceiling', 'OFF'),
('Ventilateur Plafond 3', 'fan', 'ceiling', 'Erreur')
ON CONFLICT DO NOTHING;
