from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import ScrapSession, ScrapEntry, QRCode, Area, Poste, TypeScrap, Raison, WireMapping, OperatorCode, db

scrap_bp = Blueprint("scrap", __name__)


def _get_week_number(date_obj):
    return date_obj.isocalendar()[1]


@scrap_bp.route("/verify-code", methods=["POST"])
def verify_operator_code():
    """Verify an operator access code. No auth required."""
    data = request.get_json()
    code = (data.get("code") or "").strip()
    if not code:
        return jsonify({"error": "Code opérateur requis"}), 400

    op_code = OperatorCode.query.filter_by(code=code, is_active=True).first()
    if not op_code:
        return jsonify({"error": "Code opérateur invalide"}), 401

    return jsonify({"valid": True, "label": op_code.label}), 200


@scrap_bp.route("/session", methods=["POST"])
def create_session():
    """Create a new scrap session. Operator enters assignment code only."""
    data = request.get_json()
    assignment_code = (data.get("assignment_code") or "").strip()

    # Look up assignment code
    qr = QRCode.query.filter_by(code=assignment_code, is_active=True).first()
    if not qr:
        return jsonify({"error": "Code d'affectation invalide ou inactif"}), 400

    now = datetime.now(timezone.utc)
    semaine = _get_week_number(now.date())

    session = ScrapSession(
        qr_code_id=qr.id,
        semaine=semaine,
        date=now.date(),
        section=qr.section,
        segment=qr.segment,
        equipe=qr.equipe,
        ligne=qr.ligne,
        status="pending_weight",
    )
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201


@scrap_bp.route("/session/<int:session_id>", methods=["GET"])
def get_session(session_id):
    session = ScrapSession.query.get_or_404(session_id)
    return jsonify(session.to_dict()), 200


@scrap_bp.route("/session/<int:session_id>/entry", methods=["POST"])
def add_entry(session_id):
    """Add a scrap entry to a session. No auth required for operators."""
    session = ScrapSession.query.get_or_404(session_id)
    data = request.get_json()

    area_id = data.get("area_id")
    type_scrap_id = data.get("type_scrap_id")
    poste_id = data.get("poste_id")
    raison_id = data.get("raison_id")
    fil_value = data.get("fil", "").strip()
    quantite = data.get("quantite")

    errors = []
    if not area_id:
        errors.append("Area is required")
    if not type_scrap_id:
        errors.append("Type scrap is required")
    if not poste_id:
        errors.append("Poste is required")
    if not raison_id:
        errors.append("Raison is required")
    if not fil_value:
        errors.append("Fil is required")
    if not quantite or quantite <= 0:
        errors.append("Quantité must be a positive number")

    if errors:
        return jsonify({"error": ", ".join(errors)}), 400

    # Look up CCFE from wire mapping
    wire = WireMapping.query.filter(WireMapping.fil.ilike(fil_value)).first()
    numero_piece = wire.ccfe if wire else data.get("numero_piece", "")

    entry = ScrapEntry(
        session_id=session.id,
        qr_code_id=session.qr_code_id,
        area_id=area_id,
        type_scrap_id=type_scrap_id,
        poste_id=poste_id,
        raison_id=raison_id,
        numero_piece=numero_piece,
        fil=fil_value,
        quantite=int(quantite),
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify(entry.to_dict()), 201


@scrap_bp.route("/session/<int:session_id>/entry/<int:entry_id>", methods=["DELETE"])
def delete_entry(session_id, entry_id):
    session = ScrapSession.query.get_or_404(session_id)
    entry = ScrapEntry.query.filter_by(id=entry_id, session_id=session_id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Entry deleted"}), 200


@scrap_bp.route("/session/<int:session_id>/complete", methods=["POST"])
def complete_session(session_id):
    """Complete a session by adding total weight."""
    session = ScrapSession.query.get_or_404(session_id)
    data = request.get_json()
    total_weight = data.get("total_weight")

    if total_weight is None or total_weight < 0:
        return jsonify({"error": "Total weight is required"}), 400

    session.total_weight = float(total_weight)
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify(session.to_dict()), 200


@scrap_bp.route("/wire-search", methods=["GET"])
def search_wire():
    """Search wire mappings for autocomplete. No auth required.
    Supports searching by fil (default) or by ccfe when ?by=ccfe."""
    query = request.args.get("q", "").strip()
    by = request.args.get("by", "fil").strip()
    if not query:
        return jsonify([]), 200

    if by == "ccfe":
        wires = WireMapping.query.filter(WireMapping.ccfe.ilike(f"%{query}%")).limit(20).all()
    else:
        wires = WireMapping.query.filter(WireMapping.fil.ilike(f"%{query}%")).limit(20).all()
    return jsonify([w.to_dict() for w in wires]), 200


@scrap_bp.route("/postes-by-area/<int:area_id>", methods=["GET"])
def get_postes_by_area(area_id):
    """Get postes for a given area. No auth required."""
    postes = Poste.query.filter_by(area_id=area_id).all()
    return jsonify([p.to_dict() for p in postes]), 200


@scrap_bp.route("/session/<int:session_id>/entries-batch", methods=["POST"])
def add_entries_batch(session_id):
    """Add multiple scrap entries at once for split-by-raison logic.
    Expects: { area_id, type_scrap_id, poste_id, fil, numero_piece,
               raison_splits: [{ raison_id, quantite }, ...] }
    """
    session = ScrapSession.query.get_or_404(session_id)
    data = request.get_json()

    area_id = data.get("area_id")
    type_scrap_id = data.get("type_scrap_id")
    poste_id = data.get("poste_id")
    fil_value = (data.get("fil") or "").strip()
    raison_splits = data.get("raison_splits", [])

    errors = []
    if not area_id:
        errors.append("Area is required")
    if not type_scrap_id:
        errors.append("Type scrap is required")
    if not poste_id:
        errors.append("Poste is required")
    if not fil_value:
        errors.append("Fil is required")
    if not raison_splits:
        errors.append("At least one raison split is required")

    total_qty = sum(s.get("quantite", 0) for s in raison_splits)
    if total_qty <= 0:
        errors.append("Total quantité must be a positive number")

    for i, s in enumerate(raison_splits):
        if not s.get("raison_id"):
            errors.append(f"Raison is required for split {i+1}")
        if not s.get("quantite") or s["quantite"] <= 0:
            errors.append(f"Quantité must be positive for split {i+1}")

    if errors:
        return jsonify({"error": ", ".join(errors)}), 400

    # Look up CCFE from wire mapping
    wire = WireMapping.query.filter(WireMapping.fil.ilike(fil_value)).first()
    numero_piece = wire.ccfe if wire else (data.get("numero_piece") or "")

    created_entries = []
    for split in raison_splits:
        entry = ScrapEntry(
            session_id=session.id,
            qr_code_id=session.qr_code_id,
            area_id=area_id,
            type_scrap_id=type_scrap_id,
            poste_id=poste_id,
            raison_id=split["raison_id"],
            numero_piece=numero_piece,
            fil=fil_value,
            quantite=int(split["quantite"]),
        )
        db.session.add(entry)
        created_entries.append(entry)

    db.session.commit()

    return jsonify([e.to_dict() for e in created_entries]), 201
