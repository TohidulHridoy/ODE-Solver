# 📋 ODE Solver - Quick Reference Card

## 🚀 Start in 30 Seconds

### Option 1: Docker (Easiest)
```bash
docker-compose up --build
# Open: http://localhost:3000
```

### Option 2: Local
```bash
# Terminal 1 - Backend
cd backend && python -m venv venv
venv\Scripts\activate && pip install -r requirements.txt
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
# Open: http://localhost:3000
```

---

## 📁 Project Map

| Location | Purpose | Key Files |
|----------|---------|-----------|
| `/backend` | Python FastAPI | main.py, solvers.py, parser.py |
| `/frontend` | React UI | App.tsx, components/*.tsx |
| `/tests` | Automated tests | test_solvers.py, test_api.py |
| `/docs` | Documentation | README.md, QUICKSTART.md |

---

## 🧮 ODE Solver Methods

| Method | Order | Use Case | Function |
|--------|-------|----------|----------|
| **Euler** | 1st | Learning | `EulerSolver.solve()` |
| **Heun** | 2nd | Quick use | `HeunSolver.solve()` |
| **RK4** | 4th | Default ⭐ | `RK4Solver.solve()` |
| **RK45** | 4th | Adaptive | `RK45Solver.solve()` |

---

## 🔗 API Quick Reference

### Solve ODE
```bash
POST /solve
{
  "ode_expression": "-2*y",
  "initial_x": 0, "initial_y": 1,
  "x_end": 10, "step_size": 0.1,
  "methods": ["rk4"]
}
```

### Convergence Analysis
```bash
POST /convergence-analysis
{
  "ode_expression": "-y",
  "x_end": 1,
  "step_sizes": [0.1, 0.05, 0.025],
  "method": "rk4"
}
```

### Stability Analysis
```bash
POST /stability-analysis
{
  "ode_expression": "-2*y"
}
```

### Load Case Study
```bash
POST /case-studies/solve
{
  "case_study_id": "rc_circuit",
  "methods": ["rk4"]
}
```

**Full API docs**: http://localhost:8000/docs

---

## 🧪 Testing

```bash
# Unit tests (35+)
pytest tests/test_solvers.py -v

# API tests (20+)
pytest tests/test_api.py -v

# With coverage
pytest tests/ --cov
```

---

## 📊 Example ODE Expressions

| Expression | Description | Analytical Solution |
|------------|-------------|---------------------|
| `-y` | Exponential decay | e^(-x) |
| `y**2 - y` | Logistic | 1/(1+ce^(-x)) |
| `sin(x)*y` | Trigonometric | Numerical |
| `-2*y + x` | Linear+forcing | Mixed |
| `x**2 - y` | Polynomial | Numerical |

---

## 🎓 Engineering Case Studies

| # | Name | ODE | Topic |
|-|------|-----|-------|
| 1 | RC Circuit | `-y/RC` | Electrical |
| 2 | Population | `r*y*(1-y/K)` | Biology |
| 3 | Cooling | `-k(T-Tenv)` | Thermal |
| 4 | Kinetics | `-λC` | Chemical |
| 5 | Spring | `-2ζωv - ω²x` | Mechanical |

**Load via**: Presets → Select → Solve

---

## 📈 Frontend Navigation

```
Dashboard (App.tsx)
├── Left Sidebar
│   ├── Equation Input (+ LaTeX preview)
│   ├── Method Selector (checkboxes)
│   ├── Initial Conditions (sliders)
│   ├── Presets (case studies)
│   └── Export (CSV/PNG)
└── Main Area
    ├── Tabs: Solution | Error | Convergence
    ├── Solution Chart (Recharts)
    ├── Error Chart (log scale)
    └── Convergence Table
```

---

## 🔧 Common Tasks

### Solve Simple ODE
1. Enter: `-2*y`
2. Set: y₀=1, x_end=5
3. Select: RK4
4. Click: Solve ODE
5. View: Chart + errors

### Compare Methods
1. Enter: any ODE
2. Select: All 4 methods
3. Click: Solve ODE
4. See: 4 curves overlaid

### Analyze Convergence
1. Solve an ODE
2. Click: Convergence tab
3. Click: Analyze Convergence
4. View: Log-log plot + order

### Study Stability
1. Enter: ODE like `-2*y`
2. (automatically analyzed)
3. View: Eigenvalue info
4. Check: Method stability regions

---

## 🔍 File Locations

### Backend
- **Solvers**: `backend/solvers.py`
- **API**: `backend/main.py`
- **Parser**: `backend/parser.py`
- **Cases**: `backend/case_studies.py`
- **Analysis**: `backend/stability.py`

### Frontend
- **Main**: `frontend/src/App.tsx`
- **Components**: `frontend/src/components/`
- **API Client**: `frontend/src/api/client.ts`

### Tests
- **Solver Tests**: `tests/test_solvers.py`
- **API Tests**: `tests/test_api.py`

---

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| INDEX.md | Navigation | 2 min |
| QUICKSTART.md | Quick start | 5 min |
| README.md | Overview | 10 min |
| INSTALLATION.md | Setup details | 15 min |
| PROJECT_SUMMARY.md | Architecture | 20 min |
| CHECKLIST.md | Verification | 10 min |

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend won't start | `pip install -r requirements.txt` |
| Frontend blank | `npm install && npm run dev` |
| Port in use | Change port in config or kill process |
| CORS error | Check backend running on :8000 |
| Tests fail | `pip install pytest` then retry |
| Build fails | Clear node_modules: `rm -rf node_modules` |

---

## 💡 Tips & Tricks

- **Try negative step sizes** to solve backward
- **Use smaller h for stiff problems** (rapid changes)
- **RK4 is best default** for most ODEs
- **Convergence tab shows** empirical order
- **Exact solution shows** when SymPy can solve it
- **Export buttons** download chart/CSV
- **Presets load** with one click

---

## 🎯 Success Checklist

- [ ] Docker running OR Python+Node installed
- [ ] Backend server started (port 8000)
- [ ] Frontend server started (port 3000)
- [ ] Can open http://localhost:3000
- [ ] Can enter ODE: `-y`
- [ ] Can see chart after solving
- [ ] Tests pass: `pytest tests/ -v`

---

## 📞 Need Help?

1. **Setup**: See QUICKSTART.md
2. **Details**: See INSTALLATION.md
3. **Architecture**: See PROJECT_SUMMARY.md
4. **API**: See http://localhost:8000/docs
5. **Code**: Check inline comments

---

## 🚀 Next Steps

**Do This Now:**
```bash
docker-compose up --build
# Then: http://localhost:3000
```

**Try These ODEs:**
- `-2*y` (exponential)
- `y**2 - y` (logistic)
- `sin(x)*y` (trig)

**Then:**
- Load a case study
- Run convergence analysis
- Compare all 4 methods
- Read the theory

---

## ✨ Key Stats

- **4** ODE solver methods
- **9** API endpoints
- **7** React components
- **55+** automated tests
- **5** engineering case studies
- **5000+** lines of code
- **40+** project files

---

**Status**: ✅ Ready to Use | ✅ Fully Tested | ✅ Well Documented

**Version**: 1.0 | **Date**: 2026-05-23

---

Print this card or keep as reference! 📋
