"""
Unit tests for ODE solver methods
Tests against known analytical solutions and convergence properties
"""

import pytest
import numpy as np
import math
from backend.solvers import (
    EulerSolver, HeunSolver, RK4Solver, RK45Solver,
    SystemODESolver, ODESolution
)
from backend.parser import ODEParser


class TestEulerSolver:
    """Test Euler's method implementation"""

    def test_exponential_decay(self):
        """Test dy/dx = -2y with analytical solution y = e^(-2x)"""
        # ODE: dy/dx = -2y
        f = lambda x, y: -2 * y
        
        sol = EulerSolver.solve(f, 0, 1.0, 2.0, 0.01)
        
        # Analytical solution
        x_test = 1.0
        y_analytical = np.exp(-2 * x_test)
        y_numerical = sol.y[int(x_test / 0.01)]
        
        # Euler is O(h), so error should be roughly 0.01
        assert abs(y_analytical - y_numerical) < 0.1
        assert sol.steps_taken > 0
        assert len(sol.x) == len(sol.y)

    def test_linear_growth(self):
        """Test dy/dx = y with analytical solution y = e^x"""
        f = lambda x, y: y
        
        sol = EulerSolver.solve(f, 0, 1.0, 1.0, 0.001)
        
        x_test = 1.0
        y_analytical = np.exp(1.0)
        y_numerical = sol.y[-1]
        
        # Should be reasonably close
        assert abs(y_analytical - y_numerical) < 0.5
        assert len(sol.local_errors) > 0

    def test_zero_derivative(self):
        """Test constant solution: dy/dx = 0"""
        f = lambda x, y: 0
        
        sol = EulerSolver.solve(f, 0, 5.0, 10.0, 0.1)
        
        # All y values should be constant
        assert np.allclose(sol.y, 5.0)
        assert len(sol.x) == len(sol.y)

    def test_initial_conditions(self):
        """Test that initial conditions are respected"""
        f = lambda x, y: -y
        x0, y0 = 0.5, 2.5
        
        sol = EulerSolver.solve(f, x0, y0, 2.0, 0.1)
        
        assert sol.x[0] == x0
        assert sol.y[0] == y0


class TestHeunSolver:
    """Test Heun's method (improved Euler)"""

    def test_exponential_decay_accuracy(self):
        """Heun should be more accurate than Euler for same step size"""
        f = lambda x, y: -2 * y
        
        h = 0.1
        sol_heun = HeunSolver.solve(f, 0, 1.0, 2.0, h)
        sol_euler = EulerSolver.solve(f, 0, 1.0, 2.0, h)
        
        # Analytical at x = 2
        y_analytical = np.exp(-4)
        
        error_heun = abs(sol_heun.y[-1] - y_analytical)
        error_euler = abs(sol_euler.y[-1] - y_analytical)
        
        # Heun should be more accurate
        assert error_heun < error_euler

    def test_quadratic_ode(self):
        """Test dy/dx = x"""
        f = lambda x, y: x
        
        sol = HeunSolver.solve(f, 0, 0, 3.0, 0.01)
        
        # Analytical: y = x^2 / 2
        x_test = 2.0
        idx = int(x_test / 0.01)
        y_analytical = x_test**2 / 2
        y_numerical = sol.y[idx]
        
        assert abs(y_analytical - y_numerical) < 0.01

    def test_convergence_order(self):
        """Test that Heun achieves 2nd order convergence"""
        f = lambda x, y: -y
        y_analytical = lambda x: np.exp(-x)
        
        errors = []
        step_sizes = [0.1, 0.05, 0.025, 0.0125]
        
        for h in step_sizes:
            sol = HeunSolver.solve(f, 0, 1.0, 1.0, h)
            y_num = sol.y[-1]
            y_exact = y_analytical(1.0)
            error = abs(y_num - y_exact)
            errors.append(error)
        
        # Check convergence ratio (should be ~4 for 2nd order)
        ratio = errors[0] / errors[1]
        assert 3.5 < ratio < 4.5


class TestRK4Solver:
    """Test Classical RK4 method"""

    def test_exponential_decay(self):
        """RK4 should be very accurate for exponential"""
        f = lambda x, y: -2 * y
        
        sol = RK4Solver.solve(f, 0, 1.0, 2.0, 0.05)
        
        y_analytical = np.exp(-4)
        y_numerical = sol.y[-1]
        
        # RK4 is 4th order, should be very accurate
        assert abs(y_analytical - y_numerical) < 0.001

    def test_polynomial_solution(self):
        """Test dy/dx = 2x, solution y = x^2 + c"""
        f = lambda x, y: 2 * x
        
        sol = RK4Solver.solve(f, 0, 0, 5.0, 0.01)
        
        # At x=5, y should be 25
        y_numerical = sol.y[-1]
        y_analytical = 25.0
        
        assert abs(y_analytical - y_numerical) < 0.01

    def test_convergence_order(self):
        """Test that RK4 achieves 4th order convergence"""
        f = lambda x, y: -y
        y_analytical = lambda x: np.exp(-x)
        
        errors = []
        step_sizes = [0.1, 0.05, 0.025, 0.0125]
        
        for h in step_sizes:
            sol = RK4Solver.solve(f, 0, 1.0, 1.0, h)
            y_num = sol.y[-1]
            y_exact = y_analytical(1.0)
            error = abs(y_num - y_exact)
            errors.append(error)
        
        # Check convergence ratio (should be ~16 for 4th order)
        ratio = errors[0] / errors[1]
        assert 10 < ratio < 20

    def test_local_error_estimation(self):
        """Test that local errors are computed"""
        f = lambda x, y: -y
        
        sol = RK4Solver.solve(f, 0, 1.0, 1.0, 0.1)
        
        assert sol.local_errors is not None
        assert len(sol.local_errors) > 0
        assert all(e >= 0 for e in sol.local_errors)


class TestRK45Solver:
    """Test adaptive RK45 method"""

    def test_basic_solve(self):
        """Test RK45 basic functionality"""
        f = lambda x, y: -y
        
        sol = RK45Solver.solve(f, 0, 1.0, 2.0, 0.1)
        
        assert len(sol.x) > 0
        assert len(sol.y) == len(sol.x)
        assert sol.steps_taken > 0

    def test_adaptive_stepping(self):
        """RK45 should take fewer steps for smooth problems"""
        f = lambda x, y: -y
        
        sol_rk45 = RK45Solver.solve(f, 0, 1.0, 1.0, 0.1, rtol=1e-8)
        sol_rk4 = RK4Solver.solve(f, 0, 1.0, 1.0, 0.01)  # Fixed small step
        
        # RK45 should take similar or fewer steps
        assert sol_rk45.steps_taken <= sol_rk4.steps_taken + 50

    def test_tolerance_control(self):
        """Test that error control works (loose tolerance = fewer steps)"""
        f = lambda x, y: -y * y
        
        sol_loose = RK45Solver.solve(f, 0, 1.0, 1.0, 0.1, rtol=1e-2, atol=1e-4)
        sol_tight = RK45Solver.solve(f, 0, 1.0, 1.0, 0.1, rtol=1e-10, atol=1e-12)
        
        # Tighter tolerance should require more steps
        assert sol_tight.steps_taken >= sol_loose.steps_taken

    def test_stiff_problem(self):
        """Test on a stiff problem where adaptive stepping helps"""
        # y' = -100*y, stiff problem
        f = lambda x, y: -100 * y
        
        sol = RK45Solver.solve(f, 0, 1.0, 1.0, 0.1)
        
        # Should still converge correctly
        y_analytical = np.exp(-100)
        y_numerical = sol.y[-1]
        
        assert abs(y_analytical - y_numerical) < 0.01


class TestSystemODESolver:
    """Test system ODE conversion"""

    def test_second_order_conversion(self):
        """Test converting 2nd order ODE to system"""
        # d²x/dt² = -x (simple harmonic oscillator)
        f_2nd = lambda t, x, v: -x
        
        system_f, y0 = SystemODESolver.convert_second_order(f_2nd, 0, 1.0, 0)
        
        # Test the system function
        state = np.array([1.0, 0.0])
        result = system_f(0, state)
        
        # Should give [v, a] = [0, -1]
        assert result[0] == 0
        assert result[1] == -1

    def test_solve_spring_mass_system(self):
        """Test solving a spring-mass system"""
        # m*d²x/dt² + c*dx/dt + k*x = 0
        # m=1, c=0.5, k=1
        f_2nd = lambda t, x, v: -0.5 * v - 1.0 * x
        
        system_f, y0 = SystemODESolver.convert_second_order(f_2nd, 0, 1.0, 0)
        
        # Solve with RK4
        sol = RK4Solver.solve(system_f, 0, y0, 10.0, 0.01, system=True)
        
        assert len(sol.y) > 0
        # Should be 2D (position and velocity)
        assert sol.y.shape[1] == 2


class TestODEParser:
    """Test expression parser"""

    def test_parse_simple_expression(self):
        """Test parsing simple expressions"""
        f, vars = ODEParser.parse_ode_expression('-2*y')
        
        # Test at a point
        result = f(1.0, 2.0)
        assert result == -4.0

    def test_parse_linear_combination(self):
        """Test parsing linear combination"""
        f, vars = ODEParser.parse_ode_expression('-2*y + x')
        
        result = f(1.0, 1.0)
        assert result == -2 + 1  # -2*1 + 1 = -1

    def test_parse_trigonometric(self):
        """Test parsing trigonometric functions"""
        f, vars = ODEParser.parse_ode_expression('sin(x)*y')
        
        result = f(0, 1.0)
        assert abs(result - 0) < 1e-10  # sin(0)*1 = 0
        
        result = f(math.pi / 2, 1.0)
        assert abs(result - 1.0) < 1e-10  # sin(pi/2)*1 = 1

    def test_parse_exponential(self):
        """Test parsing exponential functions"""
        f, vars = ODEParser.parse_ode_expression('exp(-x)*y')
        
        result = f(0, 1.0)
        assert abs(result - 1.0) < 1e-10  # exp(0)*1 = 1
        
        result = f(1.0, 1.0)
        assert abs(result - np.exp(-1)) < 1e-10

    def test_get_exact_solution(self):
        """Test getting exact solution where available"""
        # dy/dx = -2y has solution y = y0*exp(-2x)
        exact_f = ODEParser.get_exact_solution('-2*y', 0, 1.0)
        
        assert exact_f is not None
        
        # Test at x=1
        y = exact_f(1.0)
        y_expected = np.exp(-2)
        assert abs(y - y_expected) < 1e-10

    def test_validation(self):
        """Test expression validation"""
        assert ODEParser.validate_expression('-2*y')
        assert ODEParser.validate_expression('sin(x)*y')
        assert not ODEParser.validate_expression('__import__')
        assert not ODEParser.validate_expression('exec()')


class TestErrorEstimation:
    """Test local and global error estimation"""

    def test_local_errors_decrease_with_step_size(self):
        """Local errors should decrease as step size decreases"""
        f = lambda x, y: -y
        
        errors_h1 = []
        errors_h2 = []
        
        for h in [0.1]:
            sol = RK4Solver.solve(f, 0, 1.0, 1.0, h)
            errors_h1.extend(sol.local_errors)
        
        for h in [0.05]:
            sol = RK4Solver.solve(f, 0, 1.0, 1.0, h)
            errors_h2.extend(sol.local_errors)
        
        # Average error with smaller step should be smaller
        avg_err_1 = np.mean(errors_h1)
        avg_err_2 = np.mean(errors_h2)
        
        assert avg_err_2 < avg_err_1


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_single_step(self):
        """Test solving over very small interval"""
        f = lambda x, y: -y
        
        sol = RK4Solver.solve(f, 0, 1.0, 0.01, 0.01)
        
        assert len(sol.x) >= 2
        assert sol.x[0] == 0
        assert sol.x[-1] <= 0.01

    def test_negative_step_size(self):
        """Test solving backwards"""
        f = lambda x, y: -y
        
        # Going from x=1 to x=0 (backwards)
        sol = RK4Solver.solve(f, 1.0, np.exp(-1), 0, 0.01)
        
        assert sol.x[0] == 1.0
        assert sol.x[-1] >= 0

    def test_large_coefficient(self):
        """Test with very large coefficient (stiff)"""
        f = lambda x, y: -100 * y
        
        sol = RK4Solver.solve(f, 0, 1.0, 1.0, 0.001)
        
        assert len(sol.x) > 0
        assert sol.y[-1] <= 1e-43  # exp(-100) ≈ 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
