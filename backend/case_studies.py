from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class CaseStudy:
    id: str
    name: str
    description: str
    ode_expression: str
    independent_var: str
    dependent_var: str
    initial_x: float
    initial_y: float
    x_end: float
    default_h: float
    category: str
    theory: str


CASE_STUDIES: Dict[str, CaseStudy] = {
    "rc_circuit": CaseStudy(
        id="rc_circuit",
        name="RC Circuit Discharge",
        description="Exponential discharge of a capacitor through a resistor. Voltage decays exponentially: V(t) = V0 exp(-t/RC)",
        ode_expression="-y / 1.0",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=10.0,
        x_end=5.0,
        default_h=0.01,
        category="Electrical Engineering",
        theory="First-order linear ODE: dV/dt = -V/(RC). Solution: V(t) = V0 exp(-t/RC).",
    ),
    "population_growth": CaseStudy(
        id="population_growth",
        name="Logistic Population Growth",
        description="Population dynamics with carrying capacity. Growth rate decreases as population approaches K.",
        ode_expression="0.5 * y * (1 - y / 100)",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=10.0,
        x_end=15.0,
        default_h=0.05,
        category="Biology/Ecology",
        theory="Logistic ODE: dP/dt = r*P*(1 - P/K). r=0.5, K=100.",
    ),
    "newtons_cooling": CaseStudy(
        id="newtons_cooling",
        name="Newton's Law of Cooling",
        description="Temperature decay of hot object in cooler environment. Heat transfer proportional to temperature difference.",
        ode_expression="-0.1 * (y - 20)",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=80.0,
        x_end=50.0,
        default_h=0.1,
        category="Thermal Engineering",
        theory="Newton's cooling: dT/dt = -k*(T - Tenv). k=0.1, Tenv=20.",
    ),
    "chemical_decay": CaseStudy(
        id="chemical_decay",
        name="First-Order Chemical Reaction Kinetics",
        description="First-order decay process. Concentration decreases exponentially.",
        ode_expression="-0.3 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=100.0,
        x_end=15.0,
        default_h=0.05,
        category="Chemical Engineering",
        theory="First-order kinetics: dC/dt = -lambda*C. lambda=0.3.",
    ),
    "spring_mass_damper": CaseStudy(
        id="spring_mass_damper",
        name="Spring-Mass-Damper System",
        description="Mechanical oscillation with damping. 2nd-order system.",
        ode_expression="-0.5 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=1.0,
        x_end=10.0,
        default_h=0.01,
        category="Mechanical Engineering",
        theory="Simplified damped system: dy/dt = -0.5y.",
    ),
    "pendulum": CaseStudy(
        id="pendulum",
        name="Simple Pendulum (Small Angle)",
        description="Angular motion of a pendulum under gravity. Small angle approximation.",
        ode_expression="-9.81 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=0.1,
        x_end=10.0,
        default_h=0.01,
        category="Mechanical Engineering",
        theory="Small angle pendulum: d²θ/dt² = -(g/L)θ. Simplified: dθ/dt = -9.81θ.",
    ),

    "heat_equation": CaseStudy(
        id="heat_equation",
        name="Heat Conduction (Lumped System)",
        description="Temperature distribution in a solid body with heat generation.",
        ode_expression="-0.05 * y + 2.0",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=20.0,
        x_end=60.0,
        default_h=0.1,
        category="Thermal Engineering",
        theory="Lumped heat equation: dT/dt = -hA/mc * (T - T_inf) + Q. Steady state at T=60°C.",
    ),

    "drug_concentration": CaseStudy(
        id="drug_concentration",
        name="Drug Concentration in Blood",
        description="Pharmacokinetics — drug absorption and elimination in bloodstream.",
        ode_expression="-0.2 * y + 5.0",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=0.0,
        x_end=30.0,
        default_h=0.05,
        category="Biomedical Engineering",
        theory="One-compartment model: dC/dt = -ke*C + ka*D. ke=0.2 elimination, D=5 dose rate.",
    ),

    "virus_spread": CaseStudy(
        id="virus_spread",
        name="Virus Spread (SIS Model)",
        description="Simplified epidemic model — infected population growth and recovery.",
        ode_expression="0.3 * y * (1 - y / 1000) - 0.1 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=10.0,
        x_end=50.0,
        default_h=0.1,
        category="Biomedical Engineering",
        theory="SIS model: dI/dt = β*I*(N-I)/N - γ*I. β=0.3 infection rate, γ=0.1 recovery rate.",
    ),

    "satellite_orbit": CaseStudy(
        id="satellite_orbit",
        name="Satellite Orbital Decay",
        description="Altitude loss of a satellite due to atmospheric drag.",
        ode_expression="-0.001 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=400.0,
        x_end=1000.0,
        default_h=1.0,
        category="Aerospace Engineering",
        theory="Orbital decay: dh/dt = -k*h. k=0.001 drag coefficient. Altitude in km.",
    ),

    "battery_discharge": CaseStudy(
        id="battery_discharge",
        name="Battery Discharge Model",
        description="Voltage decay during battery discharge under constant load.",
        ode_expression="-0.05 * y",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=4.2,
        x_end=60.0,
        default_h=0.1,
        category="Electrical Engineering",
        theory="Battery model: dV/dt = -k*V. k=0.05 discharge rate. Initial voltage 4.2V (Li-ion).",
    ),

    "water_tank": CaseStudy(
        id="water_tank",
        name="Water Tank Drainage (Torricelli)",
        description="Water level decrease in a tank through an orifice. Torricelli's law.",
        ode_expression="-0.01 * y**0.5",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=100.0,
        x_end=200.0,
        default_h=0.5,
        category="Civil Engineering",
        theory="Torricelli: dh/dt = -(A_orifice/A_tank)*sqrt(2g*h). Simplified: dh/dt = -0.01*sqrt(h).",
    ),

    "co2_absorption": CaseStudy(
        id="co2_absorption",
        name="CO₂ Absorption in Ocean",
        description="Carbon dioxide absorption rate in ocean surface water.",
        ode_expression="-0.08 * (y - 280)",
        independent_var="t",
        dependent_var="y",
        initial_x=0,
        initial_y=420.0,
        x_end=50.0,
        default_h=0.1,
        category="Environmental Engineering",
        theory="CO₂ equilibrium: dC/dt = -k*(C - C_eq). k=0.08, equilibrium at 280 ppm.",
    ),
}


def get_case_study(study_id: str) -> CaseStudy:
    if study_id not in CASE_STUDIES:
        raise ValueError(f"Case study '{study_id}' not found")
    return CASE_STUDIES[study_id]


def list_case_studies():
    return [
        {
            "id": study.id,
            "name": study.name,
            "category": study.category,
            "description": study.description,
        }
        for study in CASE_STUDIES.values()
    ]


def get_case_study_details(study_id: str) -> Dict[str, Any]:
    study = get_case_study(study_id)
    return {
        "id": study.id,
        "name": study.name,
        "description": study.description,
        "category": study.category,
        "theory": study.theory,
        "ode_expression": study.ode_expression,
        "independent_var": study.independent_var,
        "dependent_var": study.dependent_var,
        "initial_conditions": {
            "x0": study.initial_x,
            "y0": study.initial_y,
            "x_end": study.x_end,
        },
        "suggested_step_size": study.default_h,
    }
