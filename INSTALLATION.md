# 📦 Complete Installation & Setup Guide

## System Requirements

### Minimum
- CPU: Dual-core
- RAM: 4GB
- Storage: 2GB free space

### Recommended
- CPU: Quad-core
- RAM: 8GB+
- Storage: 5GB free space
- OS: Windows 10+, Ubuntu 20.04+, macOS 11+

## Software Prerequisites

### Required
- **Python 3.11+** - Download from https://www.python.org/downloads/
  - ✓ Add to PATH during installation
- **Node.js 18+** - Download from https://nodejs.org/
  - Includes npm package manager
- **Git** (optional) - For cloning repository

### Optional (for Docker deployment)
- **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
- **Docker Compose** - Usually included with Docker Desktop

---

## Option 1: Docker Deployment (Easiest)

### Prerequisites
- Docker Desktop installed and running

### Steps

```bash
# 1. Navigate to project directory
cd numerical\ project

# 2. Build and start all services
docker-compose up --build

# 3. Wait for services to start (may take 2-3 minutes)
# You'll see logs from both frontend and backend
```

### Verify Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Stop Services
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
docker-compose up --build
```

---

## Option 2: Local Development (More Control)

### Backend Setup

#### Windows
```bash
# 1. Open PowerShell/Command Prompt in backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\activate

# 4. Upgrade pip
python -m pip install --upgrade pip

# 5. Install dependencies
pip install -r requirements.txt

# 6. Verify installation
python -c "import fastapi; import numpy; import sympy; print('✓ All imports successful')"

# 7. Start server
python -m uvicorn main:app --reload --port 8000
```

#### macOS/Linux
```bash
# 1. Open Terminal in backend directory
cd backend

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify installation
python -c "import fastapi; import numpy; import sympy; print('✓ All imports successful')"

# 6. Start server
python -m uvicorn main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Backend ready at: http://localhost:8000

---

### Frontend Setup

#### All Platforms
```bash
# 1. Open new terminal/command prompt in frontend directory
cd frontend

# 2. Verify Node.js installation
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 123 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h + enter to show help
```

✅ Frontend ready at: http://localhost:3000

---

## Option 3: Production Build

### Backend
```bash
cd backend

# Install gunicorn for production
pip install gunicorn

# Run with gunicorn (4 workers)
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### Frontend
```bash
cd frontend

# Build for production
npm run build

# Serve with a static server (requires additional setup)
# Option A: Use Python's built-in server
cd dist
python -m http.server 3000

# Option B: Use Node serve
npm install -g serve
serve -s dist -l 3000
```

---

## Running Tests

### Backend Unit Tests
```bash
cd backend

# Run all tests
pytest ../tests/test_solvers.py -v

# Run specific test
pytest ../tests/test_solvers.py::TestEulerSolver::test_exponential_decay -v

# With coverage report
pytest ../tests/test_solvers.py --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

### Backend API Tests
```bash
cd backend

# Tests require running backend
python -m uvicorn main:app --reload &  # Background
pytest ../tests/test_api.py -v
```

### Frontend Tests (Optional - can add later)
```bash
cd frontend

# Run with vitest (if configured)
npm test
```

---

## Troubleshooting

### Python Issues

**Problem**: "Python not found" or "python: command not found"
```bash
# Windows: Use full path
C:\Python311\python.exe -m venv venv

# macOS/Linux: Try python3
python3 -m venv venv
```

**Problem**: Permission denied on venv activation (Linux/Mac)
```bash
chmod +x venv/bin/activate
source venv/bin/activate
```

**Problem**: Old pip version
```bash
python -m pip install --upgrade pip setuptools wheel
```

### Node.js Issues

**Problem**: "npm not found"
- Reinstall Node.js from https://nodejs.org/
- Restart terminal/command prompt after installation

**Problem**: Port 3000 already in use
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Kill the process or use different port:
npm run dev -- --port 3001
```

### Backend Issues

**Problem**: ModuleNotFoundError for solvers, parser, etc.
```bash
# From backend directory:
python -c "import sys; print(sys.path)"
# Verify current directory is in path

# Or run from project root:
cd ..
python -m backend.main
```

**Problem**: SymPy installation fails
```bash
# Try pre-built wheels (faster)
pip install --only-binary :all: sympy

# Or upgrade build tools
pip install --upgrade setuptools wheel
pip install sympy
```

**Problem**: Port 8000 already in use
```bash
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8000
kill -9 <PID>

# Or use different port:
python -m uvicorn main:app --port 8001
```

### Frontend Issues

**Problem**: Blank page or endless loading
- Open browser DevTools (F12)
- Check Console tab for errors
- Verify backend is running on http://localhost:8000
- Check Network tab for failed requests

**Problem**: "Can't find module react"
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Build fails
```bash
npm run build

# If it still fails, check:
npx tsc --noEmit  # Check TypeScript errors
npm run lint      # Check linting errors
```

### CORS/Connection Issues

**Problem**: CORS error in browser console
- Backend CORS is configured in `main.py` (allow all origins)
- Frontend proxy is configured in `vite.config.ts`
- Verify both services are running

**Problem**: Connection refused
- Verify backend is running: curl http://localhost:8000/
- Verify frontend is running: open http://localhost:3000
- Check firewall settings

### Docker Issues

**Problem**: "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Linux: sudo usermod -aG docker $USER (then logout/login)

**Problem**: Port already in use
```bash
# Find container using port
docker ps -a

# Stop the container
docker stop <container_id>

# Or use different ports
docker-compose -p myproject up
```

**Problem**: Out of disk space
```bash
# Clean up unused Docker resources
docker system prune -a
```

---

## Verification Checklist

After installation, verify:

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts without errors
- [ ] Can open http://localhost:3000 in browser
- [ ] Can open http://localhost:8000/docs (API documentation)
- [ ] Sample ODE `-2*y` can be solved
- [ ] Tests pass: `pytest ../tests/test_solvers.py -v`
- [ ] No CORS errors in browser console
- [ ] Chart renders with solution curves
- [ ] Export buttons work

---

## Performance Optimization

### Backend
```python
# Use UVICORN_LOG_LEVEL=info for production
# Reduce debug output

# Use 4-8 workers with gunicorn
gunicorn -w 8 -b 0.0.0.0:8000 main:app
```

### Frontend
```bash
# Build for production (optimized bundle)
npm run build

# Bundle size analysis
npm install -g webpack-bundle-analyzer
# Add to vite.config.ts for analysis
```

### Database/Caching (Future Enhancement)
```python
# Can add Redis for caching expensive calculations
pip install redis
```

---

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_DEBUG=false
```

### Backend (.env)
```
DEBUG=True
WORKERS=4
LOG_LEVEL=info
ALLOW_ORIGINS=*
```

---

## Deployment to Cloud

### Heroku
```bash
# See DEPLOYMENT_HEROKU.md
```

### AWS
```bash
# See DEPLOYMENT_AWS.md
```

### Google Cloud
```bash
# See DEPLOYMENT_GCP.md
```

---

## Next Steps After Installation

1. **Read Documentation**
   - Review README.md for features
   - Check QUICKSTART.md for first steps

2. **Try Examples**
   - Solve: `-2*y` (exponential decay)
   - Load: RC Circuit case study
   - Compare: All four methods

3. **Run Tests**
   - Unit tests: `pytest ../tests/test_solvers.py`
   - API tests: `pytest ../tests/test_api.py`

4. **Explore Code**
   - Backend solver logic: `backend/solvers.py`
   - Frontend components: `frontend/src/components/`
   - Tests: `tests/test_*.py`

5. **Extend Project**
   - Add more case studies
   - Implement implicit methods
   - Add real-time collaboration

---

## Getting Help

1. **Check Error Messages**
   - Backend: See terminal output
   - Frontend: Open DevTools (F12) → Console tab
   - API: Visit http://localhost:8000/docs

2. **Review Documentation**
   - README.md - Overview and features
   - QUICKSTART.md - Quick start guide
   - Comments in source code

3. **Check Tests**
   - test_solvers.py shows usage examples
   - test_api.py shows API request format

4. **Common Issues**
   - See Troubleshooting section above
   - Check Stack Overflow/GitHub Issues

---

## Support Resources

- Python Docs: https://docs.python.org/3/
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- NumPy: https://numpy.org/doc/
- SymPy: https://docs.sympy.org/
- Recharts: https://recharts.org/

---

**Installation complete! 🎉 Ready to solve ODEs!**
