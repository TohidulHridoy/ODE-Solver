# 🔬 Full-Stack ODE Solver Web Application

A comprehensive numerical ODE solver application for engineering problems, featuring multiple integration methods with real-time visualization and analysis tools.

## 🚀 Features

### Backend (FastAPI + NumPy + SciPy)
- **Multiple ODE Solver Methods:**
  - Euler's Method (1st order)
  - Heun's Method/Improved Euler (2nd order)
  - Classical RK4 (4th order)
  - Adaptive RK45 with error control

- **Advanced Analysis:**
  - Stability analysis with eigenvalue computation
  - Convergence analysis (convergence order estimation)
  - Local and global error estimation
  - Analytical exact solutions via SymPy

- **Engineering Case Studies:**
  - RC Circuit discharge
  - Spring-mass-damper systems (2nd order ODEs)
  - Logistic population growth
  - Newton's Law of Cooling
  - First-order chemical reaction kinetics

- **REST API with OpenAPI docs:**
  - `/solve` - Solve ODE with multiple methods
  - `/solve-second-order` - Solve 2nd-order ODEs (converted to systems)
  - `/convergence-analysis` - Analyze numerical convergence
  - `/stability-analysis` - Eigenvalue stability analysis
  - `/case-studies` - List and load preset problems
  - `/stability-regions` - Get method stability diagrams

### Frontend (React + TypeScript + Tailwind + Recharts)
- **Interactive Dashboard:**
  - Real-time ODE equation input with LaTeX preview using KaTeX
  - Multi-method solver comparison with overlaid curves
  - Method selection with detailed information cards

- **Visualization:**
  - Recharts-based solution charts with exact solution reference
  - Error analysis plots (local truncation errors)
  - Convergence analysis with log-log plots
  - Method stability region diagrams

- **Engineering Presets:**
  - One-click load of 5 classic case studies
  - Pre-configured initial conditions and parameters

- **Advanced Features:**
  - Slider controls for initial conditions and parameters
  - Export charts as PNG
  - Download solution data as CSV
  - Convergence order estimation
  - Method theory tooltips

## 📦 Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── solvers.py           # ODE solver implementations
│   ├── parser.py            # Safe expression parser (SymPy)
│   ├── case_studies.py      # Engineering presets
│   ├── stability.py         # Stability and convergence analysis
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend container
│   └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EquationInput.tsx        # ODE input with LaTeX
│   │   │   ├── MethodSelector.tsx       # Solver method selection
│   │   │   ├── SolutionChart.tsx        # Solution visualization
│   │   │   ├── ErrorChart.tsx           # Error analysis plots
│   │   │   ├── ConvergencePanel.tsx     # Convergence analysis
│   │   │   └── PresetPanel.tsx          # Case studies loader
│   │   ├── api/
│   │   │   └── client.ts                # API client (Axios)
│   │   ├── App.tsx                      # Main app component
│   │   ├── main.tsx                     # Entry point
│   │   └── index.css                    # Tailwind + custom styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── Dockerfile
│   └── .gitignore
│
├── tests/
│   ├── test_solvers.py      # Comprehensive unit tests
│   └── __init__.py
│
├── docker-compose.yml       # Full-stack orchestration
└── README.md
```

## 🔧 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Run tests
pytest ../tests/test_solvers.py -v

# Start server
python -m uvicorn main:app --reload
```

Server runs at: **http://localhost:8000**
OpenAPI docs: **http://localhost:8000/docs**

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

### Docker Deployment
```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## 🧪 Testing

Run comprehensive test suite:
```bash
cd backend
pytest ../tests/test_solvers.py -v --cov=. --cov-report=html
```

Tests cover:
- All four solver methods (Euler, Heun, RK4, RK45)
- Convergence orders for each method
- Local and global error estimation
- System ODE conversion
- Expression parsing
- Edge cases and stiff problems

## 📊 Usage Examples

### API Usage

**Example 1: Solve RC Circuit (exponential decay)**
```bash
curl -X POST "http://localhost:8000/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "ode_expression": "-y / 1.0",
    "initial_x": 0,
    "initial_y": 10.0,
    "x_end": 5.0,
    "step_size": 0.01,
    "methods": ["euler", "rk4"],
    "find_exact": true
  }'
```

**Example 2: Convergence Analysis**
```bash
curl -X POST "http://localhost:8000/convergence-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "ode_expression": "-2*y + x",
    "initial_x": 0,
    "initial_y": 1,
    "x_end": 10,
    "step_sizes": [0.1, 0.05, 0.025, 0.0125],
    "method": "rk4"
  }'
```

**Example 3: Load Case Study**
```bash
curl -X POST "http://localhost:8000/case-studies/solve" \
  -H "Content-Type: application/json" \
  -d '{
    "case_study_id": "rc_circuit",
    "methods": ["euler", "heun", "rk4"]
  }'
```

## 🎯 Method Comparison

| Method | Order | Stability | Use Case |
|--------|-------|-----------|----------|
| **Euler** | 1 | Limited | Educational, simple problems |
| **Heun** | 2 | Good | Moderate accuracy needed |
| **RK4** | 4 | Good | General purpose (most popular) |
| **RK45** | 4 (adaptive) | Excellent | Stiff problems, automatic step control |

## 📈 Engineering Case Studies

1. **RC Circuit Discharge**: Exponential voltage decay
   - Expression: `dy/dt = -y/(RC)`
   - Analytical: `V(t) = V₀ exp(-t/RC)`

2. **Logistic Population Growth**: S-curve population dynamics
   - Expression: `dy/dt = r·y(1 - y/K)`
   - Approaches carrying capacity K

3. **Newton's Cooling**: Temperature decay
   - Expression: `dT/dt = -k(T - T_env)`
   - Models heat transfer

4. **Chemical Kinetics**: First-order decay
   - Expression: `dC/dt = -λC`
   - Half-life: `t₁/₂ = ln(2)/λ`

5. **Spring-Mass-Damper**: Damped oscillation (2nd order)
   - Expression: `d²x/dt² = -2ζωₙ(dx/dt) - ωₙ²x`
   - Underdamped, critically damped, overdamped regimes

## 🔬 Mathematical Background

### Stability Analysis
- Eigenvalue computation for linear ODEs
- Stability regions in complex plane (hλ)
- Comparison of A-stable vs A(α)-stable methods

### Error Estimation
- Local truncation error: O(h^p) where p is order
- Global error: One order lower than local
- Richardson extrapolation for error estimation

### Convergence Order
- Euler: O(h)
- Heun: O(h²)
- RK4: O(h⁴)
- RK45: O(h⁴) with adaptive stepping

## 🛠️ Technologies

**Backend:**
- FastAPI 0.104+
- NumPy 1.24+
- SciPy 1.11+
- SymPy 1.12+ (symbolic math)
- Pydantic 2.5+ (validation)

**Frontend:**
- React 18.2+
- TypeScript 5.2+
- Tailwind CSS 3.3+
- Recharts 2.10+ (charts)
- KaTeX 0.16+ (math rendering)
- Axios (HTTP client)
- Vite (build tool)

**DevOps:**
- Docker & Docker Compose
- Pytest (testing)
- OpenAPI/Swagger (API docs)

## 📝 Future Enhancements

- [ ] Phase portrait plotting for systems
- [ ] Bifurcation analysis for parameter-dependent ODEs
- [ ] Implicit methods for stiff problems
- [ ] GPU acceleration for large systems
- [ ] Method stability region optimization
- [ ] More case studies (pendulum, chemical reactors)
- [ ] PDF report generation
- [ ] Real-time formula rendering improvements
- [ ] WebGL visualization for 3D phase space
- [ ] Collaborative solving (WebSockets)

## 📚 References

- Burden & Faires: *Numerical Analysis* (10th ed.)
- Butcher: *Numerical Methods for Ordinary Differential Equations*
- Hairer, Nørsett & Wanner: *Solving Ordinary Differential Equations*
- SciPy Documentation: https://docs.scipy.org/doc/scipy/reference/integrate.html

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

Created as a comprehensive educational tool for numerical methods in engineering.

---

**Happy solving! 🚀**
