# Campus Recover — AI-Powered Campus Lost & Found Platform

A modern, intelligent lost & found platform for university campuses. Uses AI-powered matching to automatically connect lost items with found reports.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI + SQLAlchemy + PostgreSQL
- **AI**: sentence-transformers (text), CLIP (image), Haversine (location)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + Python
├── docker-compose.yml # PostgreSQL
└── README.md
```

## Development Phases

1. ✅ Architecture + Project Setup
2. Database + Backend Foundation
3. Authentication
4. Frontend Foundation
5. Lost/Found Reporting
6. Search & Browsing
7. AI Text Matching
8. Location + Time Matching
9. Image Matching
10. Claim Verification
11. Notifications
12. Campus Map
13. Admin Dashboard
14. Security Hardening
15. Testing
16. Deployment

## License

Private — All rights reserved.
