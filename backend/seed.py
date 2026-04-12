"""Seed script to populate reference data for testing."""
from app import create_app
from extensions import db
from models import Area, Poste, TypeScrap, Raison, QRCode

app = create_app()

with app.app_context():
    # Create sample areas with postes
    areas_data = {
        "Montage Moteur": ["P1", "P2", "P3", "P4"],
        "Câblage": ["C1", "C2", "C3", "C4", "C5"],
        "Soudure": ["S1", "S2", "S3"],
        "Test & Contrôle": ["T1", "T2"],
        "Emballage": ["E1", "E2", "E3"],
    }

    for area_name, postes in areas_data.items():
        if not Area.query.filter_by(name=area_name).first():
            area = Area(name=area_name)
            db.session.add(area)
            db.session.flush()
            for poste_name in postes:
                if not Poste.query.filter_by(name=poste_name, area_id=area.id).first():
                    db.session.add(Poste(name=poste_name, area_id=area.id))

    # Create sample type scraps
    type_scraps = ["Électrique", "Mécanique", "Cosmétique", "Fonctionnel", "Mixte"]
    for name in type_scraps:
        if not TypeScrap.query.filter_by(name=name).first():
            db.session.add(TypeScrap(name=name))

    # Create sample raisons
    raisons = [
        "Défaut matière",
        "Erreur de montage",
        "Défaut de soudure",
        "Câblage incorrect",
        "Endommagé lors du transport",
        "Non conforme aux spécifications",
        "Défaut de fabrication",
        "Test échoué",
        "Autre",
    ]
    for name in raisons:
        if not Raison.query.filter_by(name=name).first():
            db.session.add(Raison(name=name))

    # Create sample QR codes
    qr_codes_data = [
        {"code": "QR001", "segment": "Segment A", "equipe": "Équipe Alpha", "ligne": "Ligne 1"},
        {"code": "QR002", "segment": "Segment A", "equipe": "Équipe Beta", "ligne": "Ligne 2"},
        {"code": "QR003", "segment": "Segment B", "equipe": "Équipe Gamma", "ligne": "Ligne 3"},
        {"code": "QR004", "segment": "Segment B", "equipe": "Équipe Delta", "ligne": "Ligne 4"},
        {"code": "QR005", "segment": "Segment C", "equipe": "Équipe Epsilon", "ligne": "Ligne 5"},
    ]
    for qr_data in qr_codes_data:
        if not QRCode.query.filter_by(code=qr_data["code"]).first():
            db.session.add(QRCode(**qr_data))

    db.session.commit()
    print("Seed data created successfully!")
    print(f"  Areas: {Area.query.count()}")
    print(f"  Postes: {Poste.query.count()}")
    print(f"  Type Scraps: {TypeScrap.query.count()}")
    print(f"  Raisons: {Raison.query.count()}")
    print(f"  QR Codes: {QRCode.query.count()}")
