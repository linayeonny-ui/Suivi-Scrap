import io
import base64
import qrcode as qrcode_lib
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import QRCode, db

qr_bp = Blueprint("qr_codes", __name__)


@qr_bp.route("/", methods=["GET"])
@jwt_required()
def list_qr_codes():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    is_active = request.args.get("is_active", type=str)

    query = QRCode.query
    if is_active is not None:
        query = query.filter(QRCode.is_active == (is_active.lower() == "true"))
    query = query.order_by(QRCode.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "items": [q.to_dict() for q in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
    }), 200


@qr_bp.route("/<int:qr_id>", methods=["GET"])
@jwt_required()
def get_qr_code(qr_id):
    qr = QRCode.query.get_or_404(qr_id)
    return jsonify(qr.to_dict()), 200


@qr_bp.route("/", methods=["POST"])
@jwt_required()
def create_qr_code():
    data = request.get_json()
    segment = data.get("segment", "").strip()
    equipe = data.get("equipe", "").strip()
    ligne = data.get("ligne", "").strip()

    if not all([segment, equipe, ligne]):
        return jsonify({"error": "Segment, Equipe, and Ligne are required"}), 400

    import uuid
    code = data.get("code") or str(uuid.uuid4())[:8].upper()

    if QRCode.query.filter_by(code=code).first():
        return jsonify({"error": "QR code already exists"}), 400

    qr = QRCode(code=code, segment=segment, equipe=equipe, ligne=ligne)
    db.session.add(qr)
    db.session.commit()

    return jsonify(qr.to_dict()), 201


@qr_bp.route("/<int:qr_id>", methods=["PUT"])
@jwt_required()
def update_qr_code(qr_id):
    qr = QRCode.query.get_or_404(qr_id)
    data = request.get_json()

    if "segment" in data:
        qr.segment = data["segment"].strip()
    if "equipe" in data:
        qr.equipe = data["equipe"].strip()
    if "ligne" in data:
        qr.ligne = data["ligne"].strip()
    if "is_active" in data:
        qr.is_active = data["is_active"]

    db.session.commit()
    return jsonify(qr.to_dict()), 200


@qr_bp.route("/<int:qr_id>", methods=["DELETE"])
@jwt_required()
def delete_qr_code(qr_id):
    qr = QRCode.query.get_or_404(qr_id)
    if qr.entries.count() > 0:
        return jsonify({"error": "Cannot delete QR code with existing scrap entries"}), 400
    db.session.delete(qr)
    db.session.commit()
    return jsonify({"message": "QR code deleted"}), 200


@qr_bp.route("/<int:qr_id>/image", methods=["GET"])
@jwt_required()
def get_qr_image(qr_id):
    qr = QRCode.query.get_or_404(qr_id)

    scan_url = request.args.get("base_url", "http://localhost:5173")
    target_url = f"{scan_url}/scan/{qr.code}"

    qr_img = qrcode_lib.QRCode(version=1, box_size=10, border=4)
    qr_img.add_data(target_url)
    qr_img.make(fit=True)
    img = qr_img.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return jsonify({"image": f"data:image/png;base64,{img_base64}", "url": target_url}), 200


@qr_bp.route("/<code>/scan", methods=["GET"])
def scan_qr_code(code):
    """Public endpoint - no auth required for operators scanning QR codes."""
    qr = QRCode.query.filter_by(code=code, is_active=True).first()
    if not qr:
        return jsonify({"error": "Invalid or inactive QR code"}), 404

    return jsonify(qr.to_dict()), 200
