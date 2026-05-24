"""
Stability Analysis for ODE Solvers
Eigenvalue analysis for linear systems and stability diagrams
"""

import numpy as np
import sympy as sp
from typing import Dict, Tuple, Optional, List
from sympy import symbols, Matrix, lambdify


class StabilityAnalyzer:
    """Analyze stability of linear ODE systems"""

    @staticmethod
    def analyze_linear_ode(ode_str: str, ind_var: str = 'x', dep_var: str = 'y') -> Dict:
        """
        Analyze stability of linear ODE
        Example: dy/dx = -2*y + x
        
        Args:
            ode_str: ODE expression (RHS of dy/dx = ...)
            ind_var: Independent variable name
            dep_var: Dependent variable name
            
        Returns:
            Dictionary with stability analysis
        """
        try:
            x, y = symbols(f'{ind_var} {dep_var}')
            expr = sp.sympify(ode_str)
            
            # Check if linear in y
            jacobian = sp.diff(expr, y)
            
            # Extract coefficient (assume linear: dy/dx = ay + f(x))
            # For pure autonomous systems: dy/dx = ay
            if jacobian == 0:
                return {"is_linear": False, "error": "Expression is constant"}
            
            # Try to factor out y
            coeff = None
            try:
                # For expressions like -2*y or -y/RC
                if expr.is_polynomial(y):
                    poly = sp.Poly(expr, y)
                    coeffs = poly.all_coeffs()
                    if len(coeffs) > 0:
                        coeff = coeffs[0]  # Coefficient of highest power of y
            except:
                pass
            
            if coeff is None:
                # Try direct differentiation approach
                coeff = jacobian
            
            eigenvalue = float(coeff.evalf())
            
            return {
                "is_linear": True,
                "eigenvalue": eigenvalue,
                "stability": "stable" if eigenvalue < 0 else "unstable",
                "description": f"Linear autonomous ODE with eigenvalue λ = {eigenvalue:.4f}",
                "solution_type": "exponential" if eigenvalue != 0 else "constant",
                "decay_rate": abs(eigenvalue) if eigenvalue < 0 else None,
            }
        
        except Exception as e:
            return {"is_linear": False, "error": str(e)}

    @staticmethod
    def analyze_system_stability(jacobian_matrix: np.ndarray) -> Dict:
        """
        Analyze stability of a system using Jacobian eigenvalues
        
        Args:
            jacobian_matrix: System Jacobian matrix
            
        Returns:
            Stability analysis results
        """
        eigenvalues = np.linalg.eigvals(jacobian_matrix)
        
        # Check stability based on real parts
        max_real_part = np.max(np.real(eigenvalues))
        
        stable = max_real_part < 0
        
        return {
            "eigenvalues": eigenvalues.tolist(),
            "max_real_part": float(max_real_part),
            "is_stable": stable,
            "stability_margin": float(abs(max_real_part)),
            "analysis": "Stable - all eigenvalues have negative real parts" if stable 
                       else "Unstable - at least one eigenvalue has positive real part",
        }

    @staticmethod
    def get_stability_region_rk4() -> Dict[str, np.ndarray]:
        """
        Return points on the boundary of RK4 stability region
        For dy/dx = λy, RK4 is stable when |R(hλ)| ≤ 1
        where R(z) = 1 + z + z²/2 + z³/6 + z⁴/24
        
        Returns:
            Dictionary with x, y coordinates for plotting
        """
        theta = np.linspace(0, 2 * np.pi, 500)
        boundary_points = []
        
        # Solve |1 + z + z²/2 + z³/6 + z⁴/24| = 1 along circle
        for angle in theta:
            # Binary search for stability boundary
            for r in np.linspace(0, 3, 100):
                z = r * np.exp(1j * angle)
                R = 1 + z + z**2/2 + z**3/6 + z**4/24
                if abs(abs(R) - 1) < 0.05:
                    boundary_points.append([z.real, z.imag])
                    break
        
        if not boundary_points:
            # Approximate RK4 stability region
            # Known to extend approximately from -2.78 to 0 on real axis
            real_part = np.linspace(-2.78, 0, 100)
            imag_part = np.sqrt(np.maximum(0, 1.4**2 - (real_part + 1.39)**2))
            
            x_coords = np.concatenate([real_part, real_part[::-1]])
            y_coords = np.concatenate([imag_part, -imag_part[::-1]])
        else:
            boundary_points = np.array(boundary_points)
            x_coords = boundary_points[:, 0]
            y_coords = boundary_points[:, 1]
        
        return {
            "x": x_coords.tolist(),
            "y": y_coords.tolist(),
            "name": "RK4 Stability Region"
        }

    @staticmethod
    def get_stability_region_euler() -> Dict[str, np.ndarray]:
        """
        Euler method stability region: |1 + z| ≤ 1
        Circle centered at (-1, 0) with radius 1
        """
        theta = np.linspace(0, 2 * np.pi, 200)
        x_coords = -1 + np.cos(theta)
        y_coords = np.sin(theta)
        
        return {
            "x": x_coords.tolist(),
            "y": y_coords.tolist(),
            "name": "Euler Stability Region"
        }

    @staticmethod
    def get_stability_region_heun() -> Dict[str, np.ndarray]:
        """
        Heun method stability region
        For dy/dx = λy, Heun is stable when |R(hλ)| ≤ 1
        where R(z) = 1 + z + z²/2
        """
        theta = np.linspace(0, 2 * np.pi, 200)
        boundary_points = []
        
        for angle in theta:
            for r in np.linspace(0, 2, 100):
                z = r * np.exp(1j * angle)
                R = 1 + z + z**2/2
                if abs(abs(R) - 1) < 0.05:
                    boundary_points.append([z.real, z.imag])
                    break
        
        if boundary_points:
            boundary_points = np.array(boundary_points)
            x_coords = boundary_points[:, 0]
            y_coords = boundary_points[:, 1]
        else:
            # Approximate: larger than Euler, smaller than RK4
            real_part = np.linspace(-2, 0, 100)
            imag_part = np.sqrt(np.maximum(0, 1**2 - (real_part + 1)**2)) * 1.2
            x_coords = np.concatenate([real_part, real_part[::-1]])
            y_coords = np.concatenate([imag_part, -imag_part[::-1]])
        
        return {
            "x": x_coords.tolist(),
            "y": y_coords.tolist(),
            "name": "Heun Stability Region"
        }

    @staticmethod
    def method_stability_info() -> Dict[str, Dict]:
        """Get stability information for all methods"""
        return {
            "euler": {
                "name": "Euler's Method",
                "order": 1,
                "stable_for": "Small step sizes (h < 2/|λ|)",
                "real_axis_stability": "[-2, 0]",
                "notes": "Explicit, simple, but limited stability region",
                "region": StabilityAnalyzer.get_stability_region_euler(),
            },
            "heun": {
                "name": "Heun's Method",
                "order": 2,
                "stable_for": "Larger step sizes than Euler",
                "real_axis_stability": "≈ [-2.0, 0]",
                "notes": "Explicit, more stable than Euler, 2nd order accuracy",
                "region": StabilityAnalyzer.get_stability_region_heun(),
            },
            "rk4": {
                "name": "Classical RK4",
                "order": 4,
                "stable_for": "h·|λ| < 2.78",
                "real_axis_stability": "[-2.78, 0]",
                "notes": "Explicit, excellent accuracy, reasonable stability region",
                "region": StabilityAnalyzer.get_stability_region_rk4(),
            },
            "rk45": {
                "name": "Adaptive RK45",
                "order": 4,
                "stable_for": "Adapts automatically to maintain accuracy",
                "real_axis_stability": "Similar to RK4",
                "notes": "Adaptive step control, optimal for stiff problems",
                "region": None,
            },
        }


class ConvergenceAnalyzer:
    """Analyze numerical convergence of solver methods"""

    @staticmethod
    def convergence_order(
        errors: List[float],
        step_sizes: List[float]
    ) -> Tuple[float, float]:
        """
        Estimate convergence order from global errors and step sizes
        
        Args:
            errors: Global errors at different step sizes
            step_sizes: Corresponding step sizes
            
        Returns:
            (convergence_order, error_constant)
        """
        log_h = np.log(step_sizes)
        log_e = np.log(errors)
        
        # Linear regression: log(E) = p*log(h) + log(C)
        coeffs = np.polyfit(log_h, log_e, 1)
        p = coeffs[0]  # Convergence order
        C = np.exp(coeffs[1])  # Error constant
        
        return p, C

    @staticmethod
    def estimate_required_steps(
        error_tolerance: float,
        initial_error: float,
        convergence_order: float,
        initial_step_size: float
    ) -> Tuple[float, int]:
        """
        Estimate required step size and number of steps
        
        Args:
            error_tolerance: Target error
            initial_error: Error with initial step size
            convergence_order: Estimated order p
            initial_step_size: Initial h
            
        Returns:
            (required_h, approx_steps)
        """
        # E(h) ~ C*h^p
        # E(h_new) = tolerance -> h_new = h*(tolerance/E(h))^(1/p)
        ratio = (error_tolerance / initial_error) ** (1 / convergence_order)
        required_h = initial_step_size * ratio
        
        # Approximate steps for unit interval
        approx_steps = int(1.0 / required_h) if required_h > 0 else 1
        
        return required_h, approx_steps
