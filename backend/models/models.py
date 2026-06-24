import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, BigInteger, Text
from sqlalchemy.dialects.postgresql import UUID
from database.db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class InternalData(Base):
    __tablename__ = "internal_data"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    temperature = Column(Float)
    co2 = Column(Float)
    humidity = Column(Float)
    voc = Column(Float)
    vpd = Column(Float)
    pressure = Column(Float)
    dew_point = Column(Float)

class ExternalData(Base):
    __tablename__ = "external_data"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    radiation = Column(Float)
    wind_speed = Column(Float)
    humidity = Column(Float)
    temperature = Column(Float)

class Device(Base):
    __tablename__ = "devices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)
    location = Column(String(50), nullable=False)
    status = Column(String(20), default="OFF")
    last_update = Column(DateTime(timezone=True), default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    value = Column(Float)
    threshold = Column(Float)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(String(100))
