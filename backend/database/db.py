from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://smart_user:smart_pass@postgres:5432/smart_monitor"
    database_sync_url: str = "postgresql://smart_user:smart_pass@postgres:5432/smart_monitor"
    secret_key: str = "your-super-secret-jwt-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    csv_data_path: str = "/app/csv_data"
    simulation_mode: bool = True
    # URL du serveur Flask distant (via tunnel ngrok) exposant les données réelles
    # de la serre. Ne JAMAIS exposer cette URL au frontend — uniquement utilisée
    # côté backend pour le polling HTTP. Définie via variable d'environnement /
    # secret, jamais en dur dans le code.
    greenhouse_telemetry_url: str = ""
    telemetry_poll_seconds: int = 20
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
