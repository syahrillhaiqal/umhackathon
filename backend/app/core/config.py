from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="GridGuard API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, validation_alias=AliasChoices("GRIDGUARD_DEBUG", "DEBUG"))
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    @field_validator("debug", mode="before")
    @classmethod
    def _coerce_debug(cls, value):
        if value is None or isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "t", "yes", "y", "on"}:
                return True
            if normalized in {"0", "false", "f", "no", "n", "off"}:
                return False
            # Some ecosystems (especially JS tooling) use DEBUG for log namespaces
            # or other non-boolean values (e.g. "warn"). Don't crash settings parsing.
            return True
        return True

    glm_api_key: str = Field(default="", alias="GLM_API_KEY")
    glm_base_url: str = Field(default="https://open.bigmodel.cn/api/paas/v4/", alias="GLM_BASE_URL")
    glm_model: str = Field(default="glm-5.1", alias="GLM_MODEL")

    duckdb_path: str = Field(default="./data/gridguard.duckdb", alias="DUCKDB_PATH")
    postgres_dsn: str = Field(
        default="postgresql+asyncpg://gridguard:gridguard@localhost:5432/gridguard",
        alias="POSTGRES_DSN",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    fund_transfer_increment: float = Field(default=20000, alias="FUND_TRANSFER_INCREMENT")
    contingency_fund_source: str = Field(default="Safety_Contingency", alias="CONTINGENCY_FUND_SOURCE")
    contractor_retry_limit: int = Field(default=5, alias="CONTRACTOR_RETRY_LIMIT")


settings = Settings()
