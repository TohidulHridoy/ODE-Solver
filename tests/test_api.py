"""
Integration tests for FastAPI endpoints
Tests the full API stack
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

from main import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


class TestRootEndpoint:
    """Test root/info endpoint"""

    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
        assert "endpoints" in response.json()


class TestSolveEndpoint:
    """Test ODE solving endpoint"""

    def test_solve_simple_ode(self, client):
        """Test solving simple exponential decay"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "-2*y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": 0.1,
                "methods": ["rk4"],
                "find_exact": True,
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert len(data["solutions"]) == 1
        assert data["solutions"][0]["method"] == "RK4"
        assert len(data["solutions"][0]["x_values"]) > 0
        assert len(data["solutions"][0]["y_values"]) > 0

    def test_solve_multiple_methods(self, client):
        """Test solving with multiple methods"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "-y + x",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 2.0,
                "step_size": 0.05,
                "methods": ["euler", "heun", "rk4"],
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["solutions"]) == 3

    def test_solve_with_exact_solution(self, client):
        """Test that exact solution is returned when available"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "-y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": 0.1,
                "methods": ["rk4"],
                "find_exact": True,
            }
        )
        data = response.json()
        assert data["exact_solution"] is not None
        assert "x_values" in data["exact_solution"]
        assert "y_values" in data["exact_solution"]

    def test_solve_invalid_expression(self, client):
        """Test error handling for invalid expressions"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "__import__",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": 0.1,
                "methods": ["rk4"],
            }
        )
        assert response.status_code == 400


class TestSecondOrderEndpoint:
    """Test 2nd-order ODE endpoint"""

    def test_solve_second_order(self, client):
        """Test solving spring-mass system"""
        response = client.post(
            "/solve-second-order",
            json={
                "ode_expression": "-2*y[1] - 10*y[0]",  # damped spring
                "initial_x": 0,
                "initial_y": 1.0,
                "initial_v": 0.0,
                "x_end": 5.0,
                "step_size": 0.01,
                "methods": ["rk4"],
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert len(data["solutions"]) > 0


class TestConvergenceAnalysisEndpoint:
    """Test convergence analysis"""

    def test_convergence_analysis(self, client):
        """Test convergence order estimation"""
        response = client.post(
            "/convergence-analysis",
            json={
                "ode_expression": "-2*y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_sizes": [0.1, 0.05, 0.025],
                "method": "rk4",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "convergence_order" in data
        assert "global_errors" in data
        assert len(data["step_sizes"]) > 0


class TestStabilityAnalysisEndpoint:
    """Test stability analysis"""

    def test_stability_analysis_linear(self, client):
        """Test stability analysis for linear ODE"""
        response = client.post(
            "/stability-analysis",
            json={
                "ode_expression": "-2*y",
                "independent_var": "x",
                "dependent_var": "y",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "ode_analysis" in data
        assert "method_stability" in data

    def test_get_stability_regions(self, client):
        """Test getting stability region diagrams"""
        response = client.get("/stability-regions")
        assert response.status_code == 200
        data = response.json()
        assert "regions" in data
        assert "info" in data


class TestCaseStudiesEndpoint:
    """Test case studies endpoints"""

    def test_list_case_studies(self, client):
        """Test listing all case studies"""
        response = client.get("/case-studies")
        assert response.status_code == 200
        data = response.json()
        assert "case_studies" in data
        assert len(data["case_studies"]) >= 5  # Should have at least 5

    def test_get_case_study(self, client):
        """Test getting specific case study"""
        response = client.get("/case-studies/rc_circuit")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "rc_circuit"
        assert "theory" in data
        assert "ode_expression" in data

    def test_get_invalid_case_study(self, client):
        """Test error for invalid case study"""
        response = client.get("/case-studies/invalid_id")
        assert response.status_code == 404

    def test_solve_case_study(self, client):
        """Test solving a case study"""
        response = client.post(
            "/case-studies/solve",
            json={
                "case_study_id": "rc_circuit",
                "methods": ["rk4"],
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert len(data["solutions"]) > 0


class TestMethodComparison:
    """Test comparing different methods on same problem"""

    def test_euler_vs_rk4(self, client):
        """Verify RK4 is more accurate than Euler"""
        h = 0.1
        
        response_euler = client.post(
            "/solve",
            json={
                "ode_expression": "-y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": h,
                "methods": ["euler"],
                "find_exact": True,
            }
        )
        
        response_rk4 = client.post(
            "/solve",
            json={
                "ode_expression": "-y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": h,
                "methods": ["rk4"],
                "find_exact": True,
            }
        )
        
        euler_data = response_euler.json()
        rk4_data = response_rk4.json()
        
        # Both should succeed
        assert euler_data["success"]
        assert rk4_data["success"]
        
        # Compare final values with exact solution
        exact_final = euler_data["exact_solution"]["y_values"][-1]
        euler_final = euler_data["solutions"][0]["y_values"][-1]
        rk4_final = rk4_data["solutions"][0]["y_values"][-1]
        
        euler_error = abs(euler_final - exact_final)
        rk4_error = abs(rk4_final - exact_final)
        
        # RK4 should be more accurate
        assert rk4_error < euler_error


class TestErrorHandling:
    """Test error handling"""

    def test_empty_expression(self, client):
        """Test handling of empty expression"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": 0.1,
                "methods": ["rk4"],
            }
        )
        assert response.status_code == 400

    def test_no_methods(self, client):
        """Test handling of no methods selected"""
        response = client.post(
            "/solve",
            json={
                "ode_expression": "-y",
                "initial_x": 0,
                "initial_y": 1.0,
                "x_end": 1.0,
                "step_size": 0.1,
                "methods": [],
            }
        )
        # Should either fail or use default
        assert response.status_code in [200, 400]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
