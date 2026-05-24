from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from enum import Enum

from solvers import (
    EulerSolver, HeunSolver, RK4Solver, RK45Solver,
    MultiMethodSolver, SystemODESolver, ODESolution
)
from parser import ODEParser
from case_studies import get_case_study, list_case_studies, get_case_study_details
from stability import StabilityAnalyzer, ConvergenceAnalyzer


class MethodEnum(str, Enum):
    EULER = "euler"
    HEUN = "heun"
    RK4 = "rk4"
    RK45 = "rk45"


class SolveRequest(BaseModel):
    ode_expression: str
    initial_x: float = 0.0
    initial_y: float = 1.0
    x_end: float = 10.0
    step_size: float = 0.1
    methods: List[MethodEnum] = ["rk4"]
    independent_var: str = "x"
    dependent_var: str = "y"
    find_exact: bool = True


class SecondOrderODERequest(BaseModel):
    ode_expression: str
    initial_x: float = 0.0
    initial_y: float = 1.0
    initial_v: float = 0.0
    x_end: float = 10.0
    step_size: float = 0.1
    methods: List[MethodEnum] = ["rk4"]
    independent_var: str = "x"


class ConvergenceAnalysisRequest(BaseModel):
    ode_expression: str
    initial_x: float = 0.0
    initial_y: float = 1.0
    x_end: float = 10.0
    step_sizes: List[float] = [0.1, 0.05, 0.025, 0.0125, 0.00625]
    method: MethodEnum = "rk4"
    independent_var: str = "x"
    dependent_var: str = "y"


class StabilityRequest(BaseModel):
    ode_expression: str
    independent_var: str = "x"
    dependent_var: str = "y"


class CaseStudyRequest(BaseModel):
    case_study_id: str
    methods: List[MethodEnum] = ["euler", "rk4"]
    custom_step_size: Optional[float] = None


class MethodSolution(BaseModel):
    method: str
    x_values: List[float]
    y_values: List[Any]
    steps_taken: int
    local_errors: Optional[List[float]] = None
    error_estimates: Optional[List[float]] = None


class SolveResponse(BaseModel):
    success: bool
    solutions: List[MethodSolution]
    exact_solution: Optional[Dict[str, List[float]]] = None
    x_range: Dict[str, float]
    message: str = ""


app = FastAPI(title="ODE Solver API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_float_array(arr):
    if arr is None:
        return None
    result = []
    for val in arr:
        try:
            result.append(float(val))
        except:
            result.append(0.0)
    return result


def solution_to_dict(sol: ODESolution) -> MethodSolution:
    return MethodSolution(
        method=sol.method,
        x_values=sol.x.tolist(),
        y_values=sol.y.tolist(),
        steps_taken=sol.steps_taken,
        local_errors=safe_float_array(sol.local_errors),
        error_estimates=safe_float_array(sol.error_estimates),
    )


def safe_exact_solution(exact_func, x_eval):
    try:
        y_raw = exact_func(x_eval)
        y_float = safe_float_array(y_raw)
        return {"x_values": x_eval.tolist(), "y_values": y_float}
    except:
        return None


@app.get("/")
async def root():
    return {"message": "ODE Solver API", "version": "1.0.0"}


@app.post("/solve", response_model=SolveResponse)
async def solve_ode(request: SolveRequest):
    try:
        var_names = {"independent": request.independent_var, "dependent": request.dependent_var}
        f, _ = ODEParser.parse_ode_expression(request.ode_expression, var_names)
        methods = [m.value for m in request.methods]
        solutions_dict = MultiMethodSolver.solve_multiple(f, request.initial_x, request.initial_y, request.x_end, request.step_size, methods=methods, system=False)
        solutions = [solution_to_dict(sol) for sol in solutions_dict.values()]
        exact_sol = None
        if request.find_exact:
            exact_func = ODEParser.get_exact_solution(request.ode_expression, request.initial_x, request.initial_y, var_names)
            if exact_func is not None:
                x_eval = np.linspace(request.initial_x, request.x_end, min(len(solutions[0].x_values), 1000))
                exact_sol = safe_exact_solution(exact_func, x_eval)
        return SolveResponse(success=True, solutions=solutions, exact_solution=exact_sol, x_range={"start": request.initial_x, "end": request.x_end}, message=f"Solved using {len(solutions)} method(s)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")


@app.post("/solve-second-order", response_model=SolveResponse)
async def solve_second_order_ode(request: SecondOrderODERequest):
    try:
        var_names = {"independent": request.independent_var, "dependent": "y", "velocity": "v"}
        f_2nd, _ = ODEParser.parse_second_order_ode(request.ode_expression, var_names)
        system_f, y0_vec = SystemODESolver.convert_second_order(f_2nd, request.initial_x, request.initial_y, request.initial_v)
        methods = [m.value for m in request.methods]
        solutions_dict = MultiMethodSolver.solve_multiple(system_f, request.initial_x, y0_vec, request.x_end, request.step_size, methods=methods, system=True)
        solutions = [solution_to_dict(sol) for sol in solutions_dict.values()]
        return SolveResponse(success=True, solutions=solutions, x_range={"start": request.initial_x, "end": request.x_end}, message="Solved 2nd-order ODE")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")


@app.post("/convergence-analysis")
async def convergence_analysis(request: ConvergenceAnalysisRequest):
    try:
        var_names = {"independent": request.independent_var, "dependent": request.dependent_var}
        f, _ = ODEParser.parse_ode_expression(request.ode_expression, var_names)
        method = request.method.value
        global_errors = []
        local_errors_avg = []
        steps_counts = []
        exact_func = ODEParser.get_exact_solution(request.ode_expression, request.initial_x, request.initial_y, var_names)
        for h in request.step_sizes:
            if method == "euler":
                sol = EulerSolver.solve(f, request.initial_x, request.initial_y, request.x_end, h, system=False)
            elif method == "heun":
                sol = HeunSolver.solve(f, request.initial_x, request.initial_y, request.x_end, h, system=False)
            elif method == "rk4":
                sol = RK4Solver.solve(f, request.initial_x, request.initial_y, request.x_end, h, system=False)
            else:
                sol = RK45Solver.solve(f, request.initial_x, request.initial_y, request.x_end, h, system=False)
            steps_counts.append(sol.steps_taken)
            if sol.local_errors is not None:
                try:
                    local_errors_avg.append(float(np.mean([float(v) for v in sol.local_errors])))
                except:
                    pass
            if exact_func is not None:
                try:
                    y_raw = exact_func(sol.x)
                    y_exact = np.array([float(v) for v in y_raw])
                    global_errors.append(float(np.mean(np.abs(sol.y - y_exact))))
                except:
                    pass
        convergence_order, error_constant = None, None
        if len(global_errors) > 1:
            convergence_order, error_constant = ConvergenceAnalyzer.convergence_order(global_errors, request.step_sizes[:len(global_errors)])
        return {
            "method": method,
            "step_sizes": request.step_sizes[:len(steps_counts)],
            "steps_taken": steps_counts,
            "global_errors": global_errors,
            "avg_local_errors": local_errors_avg,
            "convergence_order": float(convergence_order) if convergence_order else None,
            "error_constant": float(error_constant) if error_constant else None,
            "has_exact_solution": exact_func is not None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Convergence analysis failed: {str(e)}")


@app.post("/stability-analysis")
async def stability_analysis(request: StabilityRequest):
    try:
        analysis = StabilityAnalyzer.analyze_linear_ode(request.ode_expression, request.independent_var, request.dependent_var)
        method_info = StabilityAnalyzer.method_stability_info()
        return {"ode_analysis": analysis, "method_stability": {m: {k: v for k, v in info.items() if k != "region"} for m, info in method_info.items()}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stability analysis failed: {str(e)}")


@app.get("/stability-regions")
async def get_stability_regions():
    try:
        method_info = StabilityAnalyzer.method_stability_info()
        regions = {m: info["region"] for m, info in method_info.items() if info["region"] is not None}
        return {"regions": regions, "info": {m: {k: v for k, v in info.items() if k != "region"} for m, info in method_info.items()}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed: {str(e)}")


@app.get("/case-studies")
async def list_cases():
    return {"case_studies": list_case_studies()}


@app.post("/case-studies/solve")
async def solve_case_study(request: CaseStudyRequest):
    try:
        study = get_case_study(request.case_study_id)
        h = request.custom_step_size if request.custom_step_size else study.default_h
        var_names = {"independent": study.independent_var, "dependent": study.dependent_var}
        f, _ = ODEParser.parse_ode_expression(study.ode_expression, var_names)
        methods = [m.value for m in request.methods]
        solutions_dict = MultiMethodSolver.solve_multiple(f, study.initial_x, study.initial_y, study.x_end, h, methods=methods, system=False)
        solutions = [solution_to_dict(sol) for sol in solutions_dict.values()]
        exact_sol = None
        exact_func = ODEParser.get_exact_solution(study.ode_expression, study.initial_x, study.initial_y, var_names)
        if exact_func is not None:
            x_eval = np.linspace(study.initial_x, study.x_end, 500)
            exact_sol = safe_exact_solution(exact_func, x_eval)
        return SolveResponse(success=True, solutions=solutions, exact_solution=exact_sol, x_range={"start": study.initial_x, "end": study.x_end}, message=f"Solved: {study.name}")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")


@app.get("/case-studies/{case_id}")
async def get_case(case_id: str):
    try:
        return get_case_study_details(case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)