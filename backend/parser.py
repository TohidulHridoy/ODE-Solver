import sympy as sp
from typing import Callable, Tuple, List, Optional
import re
import numpy as np


class ODEParser:

    ALLOWED_FUNCTIONS = {
        'sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh',
        'exp', 'log', 'sqrt', 'abs', 'pi', 'e'
    }

    @staticmethod
    def validate_expression(expr_str: str, max_length: int = 500) -> bool:
        if len(expr_str) > max_length:
            return False
        dangerous_patterns = [
            r'__', r'import', r'exec', r'eval', r'open',
            r'system', r'os\.', r'subprocess', r'lambda'
        ]
        for pattern in dangerous_patterns:
            if re.search(pattern, expr_str, re.IGNORECASE):
                return False
        return True

    @staticmethod
    def parse_ode_expression(
        ode_str: str,
        var_names: dict = None
    ) -> Tuple[Callable, List[str]]:

        if not ODEParser.validate_expression(ode_str):
            raise ValueError("Invalid or unsafe expression")

        if var_names is None:
            if 't' in ode_str.lower():
                var_names = {'independent': 't', 'dependent': 'y'}
            else:
                var_names = {'independent': 'x', 'dependent': 'y'}

        ind_name = var_names.get('independent', 'x')
        dep_name = var_names.get('dependent', 'y')

        ind_var = sp.Symbol(ind_name)
        dep_var = sp.Symbol(dep_name)

        try:
            local_dict = {
                ind_name: ind_var,
                dep_name: dep_var,
                'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
                'exp': sp.exp, 'log': sp.log, 'sqrt': sp.sqrt,
                'abs': sp.Abs, 'pi': sp.pi, 'e': sp.E,
                'sinh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
            }
            expr = sp.sympify(ode_str, locals=local_dict)
            f = sp.lambdify((ind_var, dep_var), expr, modules='numpy')
            return f, [ind_name, dep_name]

        except Exception as e:
            raise ValueError(f"Failed to parse expression: {str(e)}")

    @staticmethod
    def parse_second_order_ode(
        ode_str: str,
        var_names: dict = None
    ) -> Tuple[Callable, List[str]]:

        if var_names is None:
            var_names = {'independent': 'x', 'dependent': 'y', 'velocity': 'v'}

        ind_name = var_names.get('independent', 'x')
        dep_name = var_names.get('dependent', 'y')
        vel_name = var_names.get('velocity', 'v')

        ind_var = sp.Symbol(ind_name)
        dep_var = sp.Symbol(dep_name)
        vel_var = sp.Symbol(vel_name)

        try:
            local_dict = {
                ind_name: ind_var,
                dep_name: dep_var,
                vel_name: vel_var,
                'sin': sp.sin, 'cos': sp.cos, 'exp': sp.exp,
                'sqrt': sp.sqrt, 'log': sp.log, 'pi': sp.pi,
            }
            expr = sp.sympify(ode_str, locals=local_dict)
            f = sp.lambdify((ind_var, dep_var, vel_var), expr, modules='numpy')
            return f, [ind_name, dep_name, vel_name]

        except Exception as e:
            raise ValueError(f"Failed to parse 2nd order: {str(e)}")

    @staticmethod
    def get_exact_solution(
        ode_str: str,
        x0: float,
        y0: float,
        var_names: dict = None
    ) -> Optional[Callable]:

        if var_names is None:
            var_names = {'independent': 'x', 'dependent': 'y'}

        ind_name = var_names.get('independent', 'x')
        dep_name = var_names.get('dependent', 'y')

        ind_var = sp.Symbol(ind_name)
        dep_func = sp.Function(dep_name)

        try:
            local_dict = {
                ind_name: ind_var,
                dep_name: sp.Symbol(dep_name),
                'sin': sp.sin, 'cos': sp.cos, 'exp': sp.exp,
                'sqrt': sp.sqrt, 'log': sp.log, 'pi': sp.pi,
            }
            expr = sp.sympify(ode_str, locals=local_dict)

            # Replace dep symbol with dep function for dsolve
            dep_sym = sp.Symbol(dep_name)
            expr_func = expr.subs(dep_sym, dep_func(ind_var))

            ode_eq = sp.Eq(dep_func(ind_var).diff(ind_var), expr_func)
            general_solution = sp.dsolve(ode_eq, dep_func(ind_var))

            if isinstance(general_solution, sp.Eq):
                sol_expr = general_solution.rhs
            else:
                sol_expr = general_solution

            C1 = sp.Symbol('C1')
            if C1 in sol_expr.free_symbols:
                sol_at_x0 = sol_expr.subs(ind_var, x0)
                c_value = sp.solve(sol_at_x0 - y0, C1)
                if c_value:
                    sol_expr = sol_expr.subs(C1, c_value[0])

            exact_fn = sp.lambdify(ind_var, sol_expr, modules='numpy')
            return exact_fn

        except Exception:
            return None

    @staticmethod
    def extract_variables(ode_str: str) -> List[str]:
        temp = ode_str
        for func in ODEParser.ALLOWED_FUNCTIONS:
            temp = re.sub(rf'\b{func}\b', '', temp)
        variables = set(re.findall(r'[a-zA-Z]\w*', temp))
        variables.discard('pi')
        variables.discard('e')
        return sorted(list(variables))
