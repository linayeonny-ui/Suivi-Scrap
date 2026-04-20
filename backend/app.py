import os
from flask import Flask, send_from_directory
from config import Config
from extensions import db, cors, jwt, migrate
from models import User


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure instance and uploads folders exist
    os.makedirs(os.path.join(os.path.abspath(os.path.dirname(__file__)), "instance"), exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, origins="*", supports_credentials=True)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from routes import register_blueprints
    register_blueprints(app)

    # Serve React build in production
    frontend_dist = os.environ.get("FRONTEND_DIST", os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "frontend", "dist"))
    if os.path.exists(frontend_dist):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path and os.path.exists(os.path.join(frontend_dist, path)):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    # Create tables and default admin
    with app.app_context():
        db.create_all()
        _migrate_add_section(app)
        _create_default_admin(app)

    return app


def _migrate_add_section(app):
    """Add 'section' column to qr_codes and scrap_sessions if missing."""
    with app.app_context():
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        for table_name in ["qr_codes", "scrap_sessions"]:
            columns = [col["name"] for col in inspector.get_columns(table_name)]
            if "section" not in columns:
                db.session.execute(text(
                    f"ALTER TABLE {table_name} ADD COLUMN section VARCHAR(100) NOT NULL DEFAULT ''"
                ))
                db.session.commit()
                print(f"Migrated: added 'section' column to {table_name}")


def _create_default_admin(app):
    with app.app_context():
        if not User.query.filter_by(username="admin").first():
            admin = User(
                username="admin",
                email="admin@company.com",
                full_name="Administrator",
                is_admin=True,
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("Default admin created: username=admin, password=admin123")
            print("IMPORTANT: Change the default password after first login!")


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, host="0.0.0.0")
