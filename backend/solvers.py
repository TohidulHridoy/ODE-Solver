"""
ODE Solver Methods Implementation
Includes: Euler, Heun (Improved Euler), Classical RK4, Adaptive RK45, Taylor Series
"""

import numpy as np
from typing import Callable, Tuple, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class SolverMethod(Enum):
    """Enumeration of available ODE solver methods"""
    EULER = "euler"
    HEUN = "heun"
    RK4 = "rk4"
    RK45 = "rk45"
    TAYLOR = "taylor"


@dataclass
class ODESolution:
    """Container for ODE solution results"""
    x: np.ndarray
    y: np.ndarray
    method: str
    steps_taken: int
    local_errors: np.ndarray = None
    global_errors: np.ndarray = None
    exact_solution: np.ndarray = None
    error_estimates: np.ndarray = None  # For RK45 adaptive stepping


class EulerSolver:
    """
    Euler's Method (forward Euler)
    First-order explicit method
    Local truncation error: O(h^2)
    Global error: O(h)
    """

    @staticmethod
    def solve(
        f: Callable,
        x0: float,
        y0: float,
        x_end: float,
        h: float,
        system: bool = False,
    ) -> ODESolution:
        x_values = []
        y_values = [] if not system else []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)
            
            slope = f(x, y)
            y_new = y + h_step * slope
            
            y_half1 = y + (h_step / 2) * f(x, y)
            y_half2 = y_half1 + (h_step / 2) * f(x + h_step / 2, y_half1)
            local_error = np.linalg.norm(y_half2 - y_new) if system else abs(y_half2 - y_new)
            local_errors.append(local_error)

            x += h_step
            y = y_new
            
            x_values.append(x)
            y_values.append(y.copy() if system else y)

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="Euler",
            steps_taken=len(x_values) - 1,
            local_errors=np.array(local_errors),
        )


class HeunSolver:
    """
    Heun's Method (Improved Euler, Predictor-Corrector)
    Second-order explicit method
    Local truncation error: O(h^3)
    Global error: O(h^2)
    """

    @staticmethod
    def solve(
        f: Callable,
        x0: float,
        y0: float,
        x_end: float,
        h: float,
        system: bool = False,
    ) -> ODESolution:
        x_values = []
        y_values = []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)
            
            f_n = f(x, y)
            y_pred = y + h_step * f_n
            
            f_n1 = f(x + h_step, y_pred)
            y_new = y + (h_step / 2) * (f_n + f_n1)
            
            local_error = np.linalg.norm(y_new - y_pred) if system else abs(y_new - y_pred)
            local_errors.append(local_error)

            x += h_step
            y = y_new
            
            x_values.append(x)
            y_values.append(y.copy() if system else y)

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="Heun",
            steps_taken=len(x_values) - 1,
            local_errors=np.array(local_errors),
        )


class RK4Solver:
    """
    Classical Runge-Kutta Method of 4th Order
    Fourth-order explicit method
    Local truncation error: O(h^5)
    Global error: O(h^4)
    """

    @staticmethod
    def solve(
        f: Callable,
        x0: float,
        y0: float,
        x_end: float,
        h: float,
        system: bool = False,
    ) -> ODESolution:
        x_values = []
        y_values = []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)
            
            k1 = f(x, y)
            k2 = f(x + h_step / 2, y + (h_step / 2) * k1)
            k3 = f(x + h_step / 2, y + (h_step / 2) * k2)
            k4 = f(x + h_step, y + h_step * k3)
            
            y_new = y + (h_step / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
            
            k1_half = f(x, y)
            k2_half = f(x + h_step / 4, y + (h_step / 4) * k1_half)
            k3_half = f(x + h_step / 4, y + (h_step / 4) * k2_half)
            k4_half = f(x + h_step / 2, y + (h_step / 2) * k3_half)
            y_half1 = y + (h_step / 12) * (k1_half + 2 * k2_half + 2 * k3_half + k4_half)
            
            k1_half2 = f(x + h_step / 2, y_half1)
            k2_half2 = f(x + 3 * h_step / 4, y_half1 + (h_step / 4) * k1_half2)
            k3_half2 = f(x + 3 * h_step / 4, y_half1 + (h_step / 4) * k2_half2)
            k4_half2 = f(x + h_step, y_half1 + (h_step / 2) * k3_half2)
            y_half2 = y_half1 + (h_step / 12) * (k1_half2 + 2 * k2_half2 + 2 * k3_half2 + k4_half2)
            
            local_error = np.linalg.norm(y_half2 - y_new) if system else abs(y_half2 - y_new)
            local_errors.append(local_error)

            x += h_step
            y = y_new
            
            x_values.append(x)
            y_values.append(y.copy() if system else y)

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="RK4",
            steps_taken=len(x_values) - 1,
            local_errors=np.array(local_errors),
        )


class RK45Solver:
    """
    Adaptive Runge-Kutta 4th/5th Order Method (Dormand-Prince)
    """

    @staticmethod
    def solve(
        f: Callable,
        x0: float,
        y0: float,
        x_end: float,
        h: float,
        rtol: float = 1e-6,
        atol: float = 1e-9,
        system: bool = False,
    ) -> ODESolution:
        c = np.array([0, 1/5, 3/10, 4/5, 8/9, 1, 1])
        a = np.array([
            [0, 0, 0, 0, 0, 0],
            [1/5, 0, 0, 0, 0, 0],
            [3/40, 9/40, 0, 0, 0, 0],
            [44/45, -56/15, 32/9, 0, 0, 0],
            [19372/6561, -25360/2187, 64448/6561, -212/729, 0, 0],
            [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656, 0],
            [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84],
        ])
        b_5 = np.array([35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0])
        b_4 = np.array([5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40])
        
        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)
        h_step = h
        
        x_values = [x]
        y_values = [y.copy() if system else y]
        error_estimates = []
        steps_taken = 0

        while x < x_end - 1e-10:
            h_step = min(h_step, x_end - x)
            
            k = np.zeros((7, len(y)) if system else (7,))
            for i in range(7):
                y_stage = y.copy() if system else y
                for j in range(i):
                    y_stage = y_stage + h_step * a[i, j] * k[j]
                k[i] = f(x + c[i] * h_step, y_stage)
            
            y_rk5 = y + h_step * np.dot(b_5, k)
            y_rk4 = y + h_step * np.dot(b_4, k)
            
            error = np.linalg.norm(y_rk5 - y_rk4) if system else abs(y_rk5 - y_rk4)
            tolerance = atol + rtol * (np.linalg.norm(y) if system else abs(y))
            error_estimates.append(error)
            
            if error == 0:
                h_new = h_step * 2
            else:
                h_new = h_step * (tolerance / (error + 1e-16)) ** 0.2
            
            if error <= tolerance:
                x += h_step
                y = y_rk5
                steps_taken += 1
                
                x_values.append(x)
                y_values.append(y.copy() if system else y)
                
                h_step = min(h_new, x_end - x) if x < x_end else h_new
            else:
                h_step = h_new / 2

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="RK45",
            steps_taken=steps_taken,
            error_estimates=np.array(error_estimates),
        )


class TaylorSolver:
    """
    Taylor Series Method (Order 4)

    T1 = f(x, y)
    T2 = df/dx + f * df/dy
    T3 = d/dx[T2] + f * d/dy[T2]
    T4 = d/dx[T3] + f * d/dy[T3]
    y_{n+1} = y_n + h*T1 + (h^2/2!)*T2 + (h^3/3!)*T3 + (h^4/4!)*T4

    RK4-এর same order (4th), same local/global error O(h^5)/O(h^4).
    পার্থক্য: RK4 প্রতি step-এ 4 বার f evaluate করে; Taylor derivatives
    symbolically একবার (SymPy দিয়ে) বের করে, তারপর প্রতি step-এ সরাসরি
    সেগুলো numeric ভাবে evaluate করে। Stability region RK4-এর সাথে identical।
    বর্তমানে শুধু scalar (non-system) first-order ODE সাপোর্ট করে।
    """

    @staticmethod
    def solve(
        taylor_terms: List[Callable],
        x0: float,
        y0: float,
        x_end: float,
        h: float,
    ) -> ODESolution:
        order = len(taylor_terms)
        factorial = [1] * (order + 1)
        for k in range(1, order + 1):
            factorial[k] = factorial[k - 1] * k

        def taylor_step(x, y, h_step):
            y_new = y
            for k in range(order):
                y_new = y_new + (h_step ** (k + 1) / factorial[k + 1]) * taylor_terms[k](x, y)
            return y_new

        x_values = [x0]
        y_values = [y0]
        local_errors = []

        x = x0
        y = y0

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)

            y_new = taylor_step(x, y, h_step)

            # Local error: half-step Richardson (Euler/RK4-এর মতো একই pattern)
            y_half1 = taylor_step(x, y, h_step / 2)
            y_half2 = taylor_step(x + h_step / 2, y_half1, h_step / 2)
            local_error = abs(y_half2 - y_new)
            local_errors.append(local_error)

            x += h_step
            y = y_new

            x_values.append(x)
            y_values.append(y)

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="Taylor",
            steps_taken=len(x_values) - 1,
            local_errors=np.array(local_errors),
        )


class MultiMethodSolver:
    """Wrapper to solve ODE with multiple methods"""

    @staticmethod
    def solve_multiple(
        f: Callable,
        x0: float,
        y0: float,
        x_end: float,
        h: float,
        methods: List[str] = None,
        system: bool = False,
        taylor_terms: List[Callable] = None,
    ) -> Dict[str, ODESolution]:
        if methods is None:
            methods = ["euler", "heun", "rk4"]

        results = {}

        for method in methods:
            method_lower = method.lower()
            
            if method_lower == "euler":
                results["Euler"] = EulerSolver.solve(f, x0, y0, x_end, h, system)
            elif method_lower == "heun":
                results["Heun"] = HeunSolver.solve(f, x0, y0, x_end, h, system)
            elif method_lower == "rk4":
                results["RK4"] = RK4Solver.solve(f, x0, y0, x_end, h, system)
            elif method_lower == "rk45":
                results["RK45"] = RK45Solver.solve(f, x0, y0, x_end, h, system=system)
            elif method_lower == "taylor":
                if system:
                    raise ValueError("Taylor series method currently supports first-order scalar ODEs only")
                if taylor_terms is None:
                    raise ValueError("Taylor series method requires derivative terms to be computed first")
                results["Taylor"] = TaylorSolver.solve(taylor_terms, x0, y0, x_end, h)

        return results


class SystemODESolver:
    """Helper for converting 2nd-order ODE to 1st-order system"""

    @staticmethod
    def convert_second_order(
        f: Callable, x0: float, y0: float, v0: float
    ) -> Tuple[Callable, np.ndarray]:
        def system(x, state):
            y, v = state
            dv = f(x, y, v)
            return np.array([v, dv])

        return system, np.array([y0, v0])