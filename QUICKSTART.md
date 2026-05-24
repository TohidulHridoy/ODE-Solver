# 🚀 Quick Start Guide

## Prerequisites
- Python 3.11+ (backend)
- Node.js 18+ (frontend)
- Git

## One-Command Setup (Docker)

```bash
docker-compose up --build
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **OpenAPI Docs**: http://localhost:8000/docs

---

## Local Development Setup

### Step 1: Backend Setup (Terminal 1)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server (auto-reloads on code changes)
python -m uvicorn main:app --reload
```

✅ Backend ready at: **http://localhost:8000**

### Step 2: Frontend Setup (Terminal 2)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend ready at: **http://localhost:3000**

---

## First Run: Try an Example

### 1. Simple Exponential Decay
- **Equation**: `-2*y`
- **Initial condition**: y₀ = 1.0
- **Range**: x = 0 to 5
- **Methods**: Select RK4
- Click "Solve ODE"

You'll see:
- Solution curve (blue)
- Exact solution (green dashed)
- Step count and error info

### 2. Load a Preset
- On left sidebar, scroll down to "Engineering Presets"
- Select "RC Circuit Discharge"
- Choose methods (Euler + RK4)
- Click "Load & Solve Case Study"

### 3. Analyze Convergence
- After solving an ODE
- Click "Convergence" tab
- Select a method
- Click "Analyze Convergence"
- See how error decreases with step size

---

## API Testing

### Get OpenAPI Documentation
Visit: http://localhost:8000/docs

### Test via curl

**Solve RC Circuit:**
```bash
curl -X POST "http://localhost:8000/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "ode_expression": "-y",
    "initial_x": 0,
    "initial_y": 10,
    "x_end": 5,
    "step_size": 0.05,
    "methods": ["euler", "rk4"],
    "find_exact": true
  }'
```

**List Case Studies:**
```bash
curl http://localhost:8000/case-studies
```

**Stability Analysis:**
```bash
curl -X POST "http://localhost:8000/stability-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "ode_expression": "-2*y",
    "independent_var": "x",
    "dependent_var": "y"
  }'
```

---

## Running Tests

```bash
cd backend
pytest ../tests/test_solvers.py -v

# With coverage
pytest ../tests/test_solvers.py -v --cov=. --cov-report=html
```

Expected: **30+ tests passing**

---

## Project Files Summary

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server & endpoints |
| `backend/solvers.py` | ODE solver implementations |
| `backend/parser.py` | Expression parser (SymPy) |
| `backend/case_studies.py` | Engineering presets |
| `backend/stability.py` | Stability analysis |
| `frontend/src/App.tsx` | Main React component |
| `frontend/src/components/*.tsx` | UI components |
| `frontend/src/api/client.ts` | HTTP client |
| `tests/test_solvers.py` | Unit tests |

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check port 8000 is free
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -i :8000
```

### Frontend build fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### CORS errors
- Backend CORS is configured in `main.py`
- Frontend proxy is in `vite.config.ts`
- If issues persist, check both files are unchanged

### Sympy/Math errors
```bash
# Reinstall science stack
pip install --upgrade numpy scipy sympy
```

---

## Next Steps

1. **Understand the code**: Start with `backend/solvers.py`
2. **Try different equations**: `-y`, `t**2 - y`, `sin(x)*y`, etc.
3. **Compare methods**: Run same ODE with all 4 methods
4. **Analyze convergence**: Check convergence order matches theory
5. **Study case studies**: Read the theory behind each case
6. **Extend the project**: Add more case studies or methods

---

## Key Resources

- **API Docs**: http://localhost:8000/docs (when running)
- **Code**: See comments in `backend/solvers.py`
- **Theory**: Read `README.md` section on methods
- **Tests**: Review `tests/test_solvers.py` for usage examples

---

## Support

For issues or questions:
1. Check existing tests for examples
2. Review error messages in browser/terminal
3. Check OpenAPI docs for API format
4. Verify dependencies are installed

**Happy solving! 🎓**
