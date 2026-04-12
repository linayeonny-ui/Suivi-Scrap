from datetime import datetime, timezone
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    full_name = db.Column(db.String(120), nullable=True)
    is_admin = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        from bcrypt import hashpw, gensalt
        self.password_hash = hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")

    def check_password(self, password):
        from bcrypt import checkpw
        return checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class QRCode(db.Model):
    __tablename__ = "qr_codes"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False)
    segment = db.Column(db.String(100), nullable=False)
    equipe = db.Column(db.String(100), nullable=False)
    ligne = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    entries = db.relationship("ScrapEntry", backref="qr_code", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "segment": self.segment,
            "equipe": self.equipe,
            "ligne": self.ligne,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "entries_count": self.entries.count(),
        }


class Area(db.Model):
    __tablename__ = "areas"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    postes = db.relationship("Poste", backref="area", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "postes_count": self.postes.count(),
            "postes": [p.to_dict() for p in self.postes],
        }


class Poste(db.Model):
    __tablename__ = "postes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey("areas.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("name", "area_id", name="uq_poste_area"),)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area_id": self.area_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TypeScrap(db.Model):
    __tablename__ = "type_scraps"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Raison(db.Model):
    __tablename__ = "raisons"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OperatorCode(db.Model):
    __tablename__ = "operator_codes"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), nullable=False, unique=True)
    label = db.Column(db.String(100), nullable=True, default="Code opérateur")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "label": self.label,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WireMapping(db.Model):
    __tablename__ = "wire_mappings"

    id = db.Column(db.Integer, primary_key=True)
    fil = db.Column(db.String(100), nullable=False, index=True)
    ccfe = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("fil", "ccfe", name="uq_fil_ccfe"),)

    def to_dict(self):
        return {
            "id": self.id,
            "fil": self.fil,
            "ccfe": self.ccfe,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ScrapSession(db.Model):
    __tablename__ = "scrap_sessions"

    id = db.Column(db.Integer, primary_key=True)
    qr_code_id = db.Column(db.Integer, db.ForeignKey("qr_codes.id"), nullable=False)
    semaine = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    segment = db.Column(db.String(100), nullable=False)
    equipe = db.Column(db.String(100), nullable=False)
    ligne = db.Column(db.String(100), nullable=False)
    total_weight = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default="pending_weight")  # pending_weight, completed
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    entries = db.relationship("ScrapEntry", backref="session", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_entries=True):
        data = {
            "id": self.id,
            "qr_code_id": self.qr_code_id,
            "semaine": self.semaine,
            "date": self.date.isoformat() if self.date else None,
            "segment": self.segment,
            "equipe": self.equipe,
            "ligne": self.ligne,
            "total_weight": self.total_weight,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "entries_count": self.entries.count(),
        }
        if include_entries:
            data["entries"] = [e.to_dict() for e in self.entries]
        return data


class ScrapEntry(db.Model):
    __tablename__ = "scrap_entries"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("scrap_sessions.id"), nullable=False)
    qr_code_id = db.Column(db.Integer, db.ForeignKey("qr_codes.id"), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey("areas.id"), nullable=False)
    type_scrap_id = db.Column(db.Integer, db.ForeignKey("type_scraps.id"), nullable=False)
    poste_id = db.Column(db.Integer, db.ForeignKey("postes.id"), nullable=False)
    raison_id = db.Column(db.Integer, db.ForeignKey("raisons.id"), nullable=False)
    numero_piece = db.Column(db.String(200), nullable=True, default="")
    fil = db.Column(db.String(100), nullable=False)
    quantite = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    area = db.relationship("Area", foreign_keys=[area_id])
    type_scrap = db.relationship("TypeScrap", foreign_keys=[type_scrap_id])
    poste = db.relationship("Poste", foreign_keys=[poste_id])
    raison = db.relationship("Raison", foreign_keys=[raison_id])

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "qr_code_id": self.qr_code_id,
            "area": self.area.to_dict() if self.area else None,
            "area_id": self.area_id,
            "type_scrap": self.type_scrap.to_dict() if self.type_scrap else None,
            "type_scrap_id": self.type_scrap_id,
            "poste": self.poste.to_dict() if self.poste else None,
            "poste_id": self.poste_id,
            "raison": self.raison.to_dict() if self.raison else None,
            "raison_id": self.raison_id,
            "numero_piece": self.numero_piece,
            "fil": self.fil,
            "quantite": self.quantite,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
