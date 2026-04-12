from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Area, Poste, TypeScrap, Raison, db

ref_bp = Blueprint("reference_data", __name__)


def _admin_required():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return None
    return user


# ── Areas ───────────────────────────────────────────────────────────────────
@ref_bp.route("/areas", methods=["GET"])
def list_areas():
    areas = Area.query.order_by(Area.name).all()
    return jsonify([a.to_dict() for a in areas]), 200


@ref_bp.route("/areas", methods=["POST"])
@jwt_required()
def create_area():
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400
    if Area.query.filter_by(name=name).first():
        return jsonify({"error": "Area already exists"}), 400

    area = Area(name=name)
    db.session.add(area)
    db.session.commit()
    return jsonify(area.to_dict()), 201


@ref_bp.route("/areas/<int:area_id>", methods=["PUT"])
@jwt_required()
def update_area(area_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    area = Area.query.get_or_404(area_id)
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    area.name = name
    db.session.commit()
    return jsonify(area.to_dict()), 200


@ref_bp.route("/areas/<int:area_id>", methods=["DELETE"])
@jwt_required()
def delete_area(area_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    area = Area.query.get_or_404(area_id)
    if area.postes.count() > 0:
        return jsonify({"error": "Cannot delete area with existing postes"}), 400
    db.session.delete(area)
    db.session.commit()
    return jsonify({"message": "Area deleted"}), 200


# ── Postes ──────────────────────────────────────────────────────────────────
@ref_bp.route("/postes", methods=["GET"])
def list_postes():
    area_id = request.args.get("area_id", type=int)
    query = Poste.query
    if area_id:
        query = query.filter_by(area_id=area_id)
    postes = query.order_by(Poste.name).all()
    return jsonify([p.to_dict() for p in postes]), 200


@ref_bp.route("/postes", methods=["POST"])
@jwt_required()
def create_poste():
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    name = data.get("name", "").strip()
    area_id = data.get("area_id")

    if not name or not area_id:
        return jsonify({"error": "Name and area_id are required"}), 400

    area = Area.query.get(area_id)
    if not area:
        return jsonify({"error": "Area not found"}), 404

    poste = Poste(name=name, area_id=area_id)
    db.session.add(poste)
    db.session.commit()
    return jsonify(poste.to_dict()), 201


@ref_bp.route("/postes/<int:poste_id>", methods=["PUT"])
@jwt_required()
def update_poste(poste_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    poste = Poste.query.get_or_404(poste_id)
    data = request.get_json()

    if "name" in data:
        poste.name = data["name"].strip()
    if "area_id" in data:
        area = Area.query.get(data["area_id"])
        if not area:
            return jsonify({"error": "Area not found"}), 404
        poste.area_id = data["area_id"]

    db.session.commit()
    return jsonify(poste.to_dict()), 200


@ref_bp.route("/postes/<int:poste_id>", methods=["DELETE"])
@jwt_required()
def delete_poste(poste_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    poste = Poste.query.get_or_404(poste_id)
    db.session.delete(poste)
    db.session.commit()
    return jsonify({"message": "Poste deleted"}), 200


# ── Type Scrap ──────────────────────────────────────────────────────────────
@ref_bp.route("/type-scraps", methods=["GET"])
def list_type_scraps():
    types = TypeScrap.query.order_by(TypeScrap.name).all()
    return jsonify([t.to_dict() for t in types]), 200


@ref_bp.route("/type-scraps", methods=["POST"])
@jwt_required()
def create_type_scrap():
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    type_scrap = TypeScrap(name=name)
    db.session.add(type_scrap)
    db.session.commit()
    return jsonify(type_scrap.to_dict()), 201


@ref_bp.route("/type-scraps/<int:type_id>", methods=["PUT"])
@jwt_required()
def update_type_scrap(type_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    type_scrap = TypeScrap.query.get_or_404(type_id)
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    type_scrap.name = name
    db.session.commit()
    return jsonify(type_scrap.to_dict()), 200


@ref_bp.route("/type-scraps/<int:type_id>", methods=["DELETE"])
@jwt_required()
def delete_type_scrap(type_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    type_scrap = TypeScrap.query.get_or_404(type_id)
    db.session.delete(type_scrap)
    db.session.commit()
    return jsonify({"message": "Type scrap deleted"}), 200


# ── Raisons ─────────────────────────────────────────────────────────────────
@ref_bp.route("/raisons", methods=["GET"])
def list_raisons():
    raisons = Raison.query.order_by(Raison.name).all()
    return jsonify([r.to_dict() for r in raisons]), 200


@ref_bp.route("/raisons", methods=["POST"])
@jwt_required()
def create_raison():
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    raison = Raison(name=name)
    db.session.add(raison)
    db.session.commit()
    return jsonify(raison.to_dict()), 201


@ref_bp.route("/raisons/<int:raison_id>", methods=["PUT"])
@jwt_required()
def update_raison(raison_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    raison = Raison.query.get_or_404(raison_id)
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    raison.name = name
    db.session.commit()
    return jsonify(raison.to_dict()), 200


@ref_bp.route("/raisons/<int:raison_id>", methods=["DELETE"])
@jwt_required()
def delete_raison(raison_id):
    admin = _admin_required()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    raison = Raison.query.get_or_404(raison_id)
    db.session.delete(raison)
    db.session.commit()
    return jsonify({"message": "Raison deleted"}), 200
