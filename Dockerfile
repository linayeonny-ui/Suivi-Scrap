# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend ----
FROM python:3.11-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend build into backend so Flask can serve it
COPY --from=frontend-build /app/frontend/dist /app/frontend_dist

# Create instance dir for SQLite
RUN mkdir -p /app/instance /app/uploads

# Environment
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_DIST=/app/frontend_dist

EXPOSE 8080

# Seed DB on first run, then start server
CMD ["sh", "-c", "python seed.py && gunicorn app:app --bind 0.0.0.0:8080 --workers 1 --timeout 120"]
