"""
ODE Solver Methods Implementation
Includes: Euler, Heun (Improved Euler), Classical RK4, and Adaptive RK45
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
        """
        Solve ODE using Euler's method
        
        Args:
            f: Function dy/dx = f(x, y) or dy/dx = f(x, y_vec) for systems
            x0: Initial x value
            y0: Initial y value (scalar) or array for systems
            x_end: Final x value
            h: Step size
            system: Whether solving a system of ODEs
            
        Returns:
            ODESolution object with results
        """
        x_values = []
        y_values = [] if not system else []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)  # Adjust step for end boundary
            
            # Euler step: y_{n+1} = y_n + h * f(x_n, y_n)
            slope = f(x, y)
            y_new = y + h_step * slope
            
            # Estimate local truncation error using Richardson extrapolation
            # Take half-step twice
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
        """
        Solve ODE using Heun's method (improved Euler)
        
        Predictor: y_p = y_n + h * f(x_n, y_n)
        Corrector: y_{n+1} = y_n + (h/2) * [f(x_n, y_n) + f(x_{n+1}, y_p)]
        """
        x_values = []
        y_values = []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)
            
            # Predictor step
            f_n = f(x, y)
            y_pred = y + h_step * f_n
            
            # Corrector step
            f_n1 = f(x + h_step, y_pred)
            y_new = y + (h_step / 2) * (f_n + f_n1)
            
            # Local error estimate
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
    Excellent accuracy for smooth problems without adaptivity
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
        """
        Solve ODE using Classical Runge-Kutta 4th order method
        
        k1 = f(x_n, y_n)
        k2 = f(x_n + h/2, y_n + h*k1/2)
        k3 = f(x_n + h/2, y_n + h*k2/2)
        k4 = f(x_n + h, y_n + h*k3)
        y_{n+1} = y_n + (h/6)*(k1 + 2*k2 + 2*k3 + k4)
        """
        x_values = []
        y_values = []
        local_errors = []

        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)

        x_values.append(x)
        y_values.append(y.copy() if system else y)

        while x < x_end - 1e-10:
            h_step = min(h, x_end - x)
            
            # RK4 stages
            k1 = f(x, y)
            k2 = f(x + h_step / 2, y + (h_step / 2) * k1)
            k3 = f(x + h_step / 2, y + (h_step / 2) * k2)
            k4 = f(x + h_step, y + h_step * k3)
            
            # RK4 step
            y_new = y + (h_step / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
            
            # Estimate local error using Runge extrapolation
            # Compare with half-step estimates
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
    Embedded pair: RK5 and RK4 for error estimation and step control
    Automatically adjusts step size based on error tolerance
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
        rtol: float = 1e-6,
        atol: float = 1e-9,
        system: bool = False,
    ) -> ODESolution:
        """
        Adaptive RK45 using Dormand-Prince coefficients with step size control
        
        Args:
            f: ODE function
            x0, y0: Initial conditions
            x_end: Final x value
            h: Initial step size
            rtol: Relative tolerance
            atol: Absolute tolerance
            system: Whether solving system of ODEs
        """
        # Dormand-Prince coefficients
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
        b_5 = np.array([35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0])  # RK5
        b_4 = np.array([5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40])  # RK4
        
        x = x0
        y = np.array([y0]) if system and np.isscalar(y0) else (y0 if system else y0)
        h_step = h
        
        x_values = [x]
        y_values = [y.copy() if system else y]
        error_estimates = []
        steps_taken = 0

        while x < x_end - 1e-10:
            h_step = min(h_step, x_end - x)
            
            # Compute RK stages
            k = np.zeros((7, len(y)) if system else (7,))
            for i in range(7):
                y_stage = y.copy() if system else y
                for j in range(i):
                    if system:
                        y_stage = y_stage + h_step * a[i, j] * k[j]
                    else:
                        y_stage = y_stage + h_step * a[i, j] * k[j]
                k[i] = f(x + c[i] * h_step, y_stage)
            
            # Compute RK5 and RK4 solutions
            if system:
                y_rk5 = y + h_step * np.dot(b_5, k)
                y_rk4 = y + h_step * np.dot(b_4, k)
            else:
                y_rk5 = y + h_step * np.dot(b_5, k)
                y_rk4 = y + h_step * np.dot(b_4, k)
            
            # Estimate error
            error = np.linalg.norm(y_rk5 - y_rk4) if system else abs(y_rk5 - y_rk4)
            tolerance = atol + rtol * (np.linalg.norm(y) if system else abs(y))
            error_estimates.append(error)
            
            # Step size control
            if error == 0:
                h_new = h_step * 2
            else:
                h_new = h_step * (tolerance / (error + 1e-16)) ** 0.2
            
            if error <= tolerance:
                # Accept step
                x += h_step
                y = y_rk5
                steps_taken += 1
                
                x_values.append(x)
                y_values.append(y.copy() if system else y)
                
                h_step = min(h_new, x_end - x) if x < x_end else h_new
            else:
                # Reject step, try smaller h
                h_step = h_new / 2

        return ODESolution(
            x=np.array(x_values),
            y=np.array(y_values),
            method="RK45",
            steps_taken=steps_taken,
            error_estimates=np.array(error_estimates),
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
    ) -> Dict[str, ODESolution]:
        """
        Solve ODE using multiple methods for comparison
        
        Args:
            f: ODE function
            x0, y0: Initial conditions
            x_end: Final x
            h: Step size (initial for RK45)
            methods: List of method names to use
            system: Whether solving system
            
        Returns:
            Dictionary mapping method names to ODESolution objects
        """
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

        return results


class SystemODESolver:
    """Helper for converting 2nd-order ODE to 1st-order system"""

    @staticmethod
    def convert_second_order(
        f: Callable, x0: float, y0: float, v0: float
    ) -> Tuple[Callable, np.ndarray]:
        """
        Convert 2nd-order ODE d²y/dx² = f(x, y, dy/dx) to system:
        dy/dx = v
        dv/dx = f(x, y, v)
        
        Args:
            f: Function f(x, y, v) representing d²y/dx²
            x0: Initial x
            y0: Initial y
            v0: Initial dy/dx
            
        Returns:
            (system_function, initial_state) where system_function takes (x, [y, v])
        """
        def system(x, state):
            y, v = state
            dv = f(x, y, v)
            return np.array([v, dv])

        return system, np.array([y0, v0])
