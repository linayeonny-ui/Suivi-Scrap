from routes.auth import auth_bp
from routes.qr_codes import qr_bp
from routes.scrap import scrap_bp
from routes.admin import admin_bp
from routes.uploads import upload_bp
from routes.reference_data import ref_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(qr_bp, url_prefix="/api/qr-codes")
    app.register_blueprint(scrap_bp, url_prefix="/api/scrap")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(upload_bp, url_prefix="/api/uploads")
    app.register_blueprint(ref_bp, url_prefix="/api/reference")
