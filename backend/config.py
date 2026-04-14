import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.environ.get("DATA_DIR", os.path.join(os.path.abspath(os.path.dirname(__file__)), "instance")), "scrap.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(os.path.abspath(os.path.dirname(__file__)), "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
