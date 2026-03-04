# Quick Start Guide

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- Terminal/PowerShell/Bash

## ⚡ Quick Setup (5 minutes)

### Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```powershell
cd frontend
npm install
```

## 🚀 Run Both Servers

### In Terminal 1 (Backend)

```powershell
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### In Terminal 2 (Frontend)

```powershell
cd frontend
npm run dev
```

Output:
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:5173/
```

## ✅ Verify it's Working

### Backend
- Visit `http://localhost:8000`
  - Should see: `{"message":"Bienvenido a la API de Laboratorio"}`
- Visit `http://localhost:8000/health`
  - Should see: `{"status":"ok"}`
- Visit `http://localhost:8000/docs`
  - Should see: Swagger UI with all endpoints

### Frontend
- Visit `http://localhost:5173`
  - Should see: "Frontend funcionando ✨"

## 📚 Next Steps

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup
2. Read [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) for architecture
3. Check individual README files for each part:
   - [backend/README.md](backend/README.md)
   - [frontend/README.md](frontend/README.md)

## 🔗 Useful Links

| Link | Purpose |
|------|---------|
| `http://localhost:8000` | Backend root |
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |
| `http://localhost:5173` | Frontend root |

## ⚙️ Common Commands

### Backend

```bash
# Development
uvicorn app.main:app --reload

# Production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

### Frontend

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## 🆘 Troubleshooting

### Port already in use

**For Windows:**
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process with PID
taskkill /PID <PID> /F
```

### Python venv issues

```bash
# Recreate venv
rm -r venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### npm issues

```bash
# Clear cache and reinstall
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

## 📦 Project Structure Quick Reference

```
laboratorio/
├── backend/         # FastAPI server
│   └── app/
│       ├── main.py  # Entry point
│       ├── routes/  # API endpoints
│       ├── models/  # Data models
│       ├── services/  # Business logic
│       └── utils/   # Helpers
│
├── frontend/        # React+Vite app
│   └── src/
│       ├── pages/   # Page components
│       ├── components/  # Reusable components
│       ├── services/  # API client
│       └── hooks/   # Custom React hooks
```

## 🎯 Ready to Code!

Your fullstack project is ready. Start with:

1. Add new routes in `backend/app/routes/`
2. Create new pages in `frontend/src/pages/`
3. Build components in `frontend/src/components/`
4. Add services in `backend/app/services/`

Happy coding! 🚀
