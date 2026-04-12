# Suivi-Scrap

Application web de suivi et gestion du scrap industriel.

## Stack

- **Backend**: Flask, SQLAlchemy, Flask-JWT-Extended, openpyxl
- **Frontend**: React 18, Vite, TailwindCSS, Recharts, Lucide Icons

## Fonctionnalités

- Interface opérateur mobile (scan QR code, déclaration scrap)
- Panneau d'administration (tableau de bord, CRUD, export Excel/CSV)
- Codes d'accès opérateur générés par l'admin
- Répartition de la quantité par raison (split-by-raison)
- Export Excel avec styles, couleurs et graphiques
- Génération de QR codes
- Upload de mappings Fil/CCFE via Excel

## Installation

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python seed.py
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Accès

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Admin par défaut: `admin` / `admin123`
