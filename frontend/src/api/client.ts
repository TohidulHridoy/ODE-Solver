import axios, { AxiosInstance } from 'axios';

interface ODESolution {
  method: string;
  x_values: number[];
  y_values: number[] | number[][];
  steps_taken: number;
  local_errors?: number[];
  error_estimates?: number[];
}

interface SolveResponse {
  success: boolean;
  solutions: ODESolution[];
  exact_solution?: {
    x_values: number[];
    y_values: number[];
  };
  x_range: {
    start: number;
    end: number;
  };
  message: string;
}

interface CaseStudy {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface CaseStudyDetails extends CaseStudy {
  theory: string;
  ode_expression: string;
  independent_var: string;
  dependent_var: string;
  initial_conditions: {
    x0: number;
    y0: number;
    x_end: number;
  };
  suggested_step_size: number;
}

class ODESolverAPI {
  private client: AxiosInstance;
  constructor(baseURL: string = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL: baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async solveODE(
    odeExpression: string,
    initialX: number = 0,
    initialY: number = 1,
    xEnd: number = 10,
    stepSize: number = 0.1,
    methods: string[] = ['rk4'],
    independentVar: string = 'x',
    dependentVar: string = 'y',
    findExact: boolean = true
  ): Promise<SolveResponse> {
    const res = await this.client.post('/solve', {
      ode_expression: odeExpression,
      initial_x: initialX,
      initial_y: initialY,
      x_end: xEnd,
      step_size: stepSize,
      methods,
      independent_var: independentVar,
      dependent_var: dependentVar,
      find_exact: findExact,
    });
    return res.data;
  }

  async listCaseStudies(): Promise<{ case_studies: CaseStudy[] }> {
    const res = await this.client.get('/case-studies');
    return res.data;
  }

  async getCaseStudy(caseId: string): Promise<CaseStudyDetails> {
    const res = await this.client.get(`/case-studies/${caseId}`);
    return res.data;
  }

  async solveCaseStudy(
    caseStudyId: string,
    methods: string[] = ['rk4'],
    customStepSize?: number
  ): Promise<SolveResponse> {
    const res = await this.client.post('/case-studies/solve', {
      case_study_id: caseStudyId,
      methods,
      custom_step_size: customStepSize,
    });
    return res.data;
  }

  async convergenceAnalysis(
    odeExpression: string,
    initialX: number = 0,
    initialY: number = 1,
    xEnd: number = 10,
    stepSizes: number[] = [0.1, 0.05, 0.025, 0.0125],
    method: string = 'rk4',
    independentVar: string = 'x',
    dependentVar: string = 'y'
  ) {
    const res = await this.client.post('/convergence-analysis', {
      ode_expression: odeExpression,
      initial_x: initialX,
      initial_y: initialY,
      x_end: xEnd,
      step_sizes: stepSizes,
      method,
      independent_var: independentVar,
      dependent_var: dependentVar,
    });
    return res.data;
  }
  async solveSecondOrder(
  odeExpression: string,
  initialX: number = 0,
  initialY: number = 1,
  initialV: number = 0,
  xEnd: number = 10,
  stepSize: number = 0.1,
  methods: string[] = ['rk4'],
  independentVar: string = 'x'
): Promise<SolveResponse> {
  const res = await this.client.post('/solve-second-order', {
    ode_expression: odeExpression,
    initial_x: initialX,
    initial_y: initialY,
    initial_v: initialV,
    x_end: xEnd,
    step_size: stepSize,
    methods,
    independent_var: independentVar,
  });
  return res.data;
}
}

export default ODESolverAPI;
export type { ODESolution, SolveResponse, CaseStudy, CaseStudyDetails };