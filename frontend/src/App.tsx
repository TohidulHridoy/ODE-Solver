import { useState, ReactNode, ChangeEvent } from 'react';
import EquationInput from './components/EquationInput';
import MethodSelector from './components/MethodSelector';
import SolutionChart from './components/SolutionChart';
import ErrorChart from './components/ErrorChart';
import ConvergencePanel from './components/ConvergencePanel';
import PresetPanel from './components/PresetPanel';
import StabilityDiagram from './components/StabilityDiagram';
import MethodTheoryModal from './components/MethodTheory';
import ODESolverAPI from './api/client';
import html2canvas from 'html2canvas';
import HelpModal from './components/HelpModal';

// Type definitions
interface Solution {
  method: string;
  x_values: number[];
  y_values: number[] | number[][];
  steps_taken: number;
  local_errors?: number[];
  error_estimates?: number[];
}

interface ExactSolution {
  x_values: number[];
  y_values: number[];
}

interface Parameter {
  label: string;
  value: number;
  setter: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

export interface Tab {
  key: 'solution' | 'error' | 'convergence' | 'stability';
  label: string;
}

// API singleton instance
const api = new ODESolverAPI();

export default function App(): ReactNode {
  const [odeExpression, setOdeExpression] = useState<string>('-2*y');
  const [initialX, setInitialX] = useState<number>(0);
  const [initialY, setInitialY] = useState<number>(1);
  const [xEnd, setXEnd] = useState<number>(5);
  const [stepSize, setStepSize] = useState<number>(0.1);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['rk4']);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [exactSolution, setExactSolution] = useState<ExactSolution | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solution' | 'error' | 'convergence' | 'stability'>('solution');
  const [theoryMethod, setTheoryMethod] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const solveODE = async (): Promise<void> => {
    if (!odeExpression.trim()) { setError('Please enter an ODE expression'); return; }
    if (selectedMethods.length === 0) { setError('Please select at least one method'); return; }
    setLoading(true);
    setError(null);
    setSolutions([]);
    setExactSolution(null);
    try {
      const response = await api.solveODE(odeExpression, initialX, initialY, xEnd, stepSize, selectedMethods);
      if (response.success) {
        setSolutions(response.solutions);
        if (response.exact_solution) setExactSolution(response.exact_solution);
      } else {
        setError(response.message || 'Failed to solve ODE');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve ODE.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = async (caseStudyId: string, methods: string[]): Promise<void> => {
    setLoading(true);
    setError(null);
    setSolutions([]);
    setExactSolution(null);
    try {
      const response = await api.solveCaseStudy(caseStudyId, methods);
      if (response.success) {
        setSolutions(response.solutions);
        if (response.exact_solution) setExactSolution(response.exact_solution);
        setSelectedMethods(methods);
      } else {
        setError(response.message || 'Failed to solve case study');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case study');
    } finally {
      setLoading(false);
    }
  };

  const downloadChart = async (): Promise<void> => {
    const chartElement = document.querySelector('.recharts-wrapper');
    if (!chartElement) { alert('No chart found'); return; }
    try {
      const canvas = await html2canvas(chartElement as HTMLElement);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'ode_chart.png';
      a.click();
    } catch { alert('Failed to download chart'); }
  };

  const downloadData = (): void => {
    if (solutions.length === 0) { alert('No data to download'); return; }
    let csv = 'x,' + solutions.map(s => s.method).join(',') + '\n';
    const maxLength = Math.max(...solutions.map(s => s.x_values.length));
    for (let i = 0; i < maxLength; i++) {
      csv += (solutions[0].x_values[i] || '') + ',';
      csv += solutions.map(sol => {
        const y = Array.isArray(sol.y_values[0])
          ? (sol.y_values[i] as number[])?.[0] || ''
          : sol.y_values[i] || '';
        return y;
      }).join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ode_solution.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const downloadPDF = async () => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── PAGE 1: Cover ──────────────────────────────────
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('ODE Solver Report', 15, 30);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Numerical ODE Solver for Engineering Problems', 15, 42);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 52);

  // ODE Info Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, 68, pageW - 24, 55, 3, 3, 'F');
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(12, 68, pageW - 24, 55, 3, 3, 'S');

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('ODE Information', 18, 80);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Expression:   dy/dx = ${odeExpression}`, 18, 92);
  doc.text(`Initial x (x0):  ${initialX}`, 18, 102);
  doc.text(`Initial y (y0):  ${initialY}`, 18, 112);
  doc.text(`x range:      [${initialX},  ${xEnd}]`, 110, 92);
  doc.text(`Step size h:  ${stepSize}`, 110, 102);
  doc.text(`Methods:      ${solutions.map(s => s.method).join(', ')}`, 110, 112);

  // Method descriptions
  const methodDesc: Record<string, string> = {
    Euler:  'Order 1 — Simple, limited stability',
    Heun:   'Order 2 — Predictor-corrector',
    RK4:    'Order 4 — Industry standard',
    RK45:   'Order 4 — Adaptive step control',
  };

  let y = 140;
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Methods Used', 15, y); y += 8;

  const methodDotColors: Record<string, [number,number,number]> = {
    Euler:  [239,68,68],
    Heun:   [245,158,11],
    RK4:    [59,130,246],
    RK45:   [139,92,246],
  };

  solutions.forEach(sol => {
    const c = methodDotColors[sol.method] || [100,100,100];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.circle(19, y - 2, 2.5, 'F');
    doc.setTextColor(30,30,30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(sol.method, 24, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`— ${methodDesc[sol.method] || ''}`, 50, y);
    y += 9;
  });

  // ── PAGE 2: Results Table ──────────────────────────
  doc.addPage();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Results Summary', 15, 13);

  // Table header
  y = 30;
  const cols = [15, 45, 80, 120, 155, 180];
  const headers = ['Method', 'Steps', 'Final y', 'Error vs Exact', 'Accuracy', ''];

  doc.setFillColor(37, 99, 235);
  doc.rect(12, y - 6, pageW - 24, 10, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 8;

  solutions.forEach((sol, idx) => {
    const lastY = Array.isArray(sol.y_values[0])
      ? (sol.y_values[sol.y_values.length - 1] as number[])[0]
      : sol.y_values[sol.y_values.length - 1] as number;

    const exactLastY = exactSolution
      ? exactSolution.y_values[exactSolution.y_values.length - 1]
      : null;

    const absError = exactLastY !== null && typeof lastY === 'number'
      ? Math.abs(lastY - exactLastY) : null;

    const accuracy = absError === null ? 'N/A'
      : absError < 1e-8 ? 'Excellent'
      : absError < 1e-5 ? 'Good'
      : absError < 1e-3 ? 'Fair' : 'Poor';

    const accColor: [number,number,number] = accuracy === 'Excellent' ? [16,185,129]
      : accuracy === 'Good' ? [37,99,235]
      : accuracy === 'Fair' ? [245,158,11]
      : accuracy === 'Poor' ? [239,68,68]
      : [100,100,100];

    if (idx % 2 === 0) {
      doc.setFillColor(245, 247, 255);
      doc.rect(12, y - 5, pageW - 24, 9, 'F');
    }

    const c = methodDotColors[sol.method] || [100,100,100];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.circle(cols[0] + 2, y - 1.5, 2, 'F');

    doc.setTextColor(30,30,30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(sol.method, cols[0] + 6, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(sol.steps_taken), cols[1], y);
    doc.text(typeof lastY === 'number' ? lastY.toFixed(6) : 'N/A', cols[2], y);
    doc.text(absError !== null ? absError.toExponential(3) : '—', cols[3], y);

    doc.setTextColor(accColor[0], accColor[1], accColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(accuracy, cols[4], y);
    y += 10;
  });

  // Exact solution row
  if (exactSolution) {
    const exactLast = exactSolution.y_values[exactSolution.y_values.length - 1];
    doc.setFillColor(220, 252, 231);
    doc.rect(12, y - 5, pageW - 24, 9, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Exact', cols[0], y);
    doc.setFont('helvetica', 'normal');
    doc.text('—', cols[1], y);
    doc.text(exactLast.toFixed(6), cols[2], y);
    doc.text('0.000e+0', cols[3], y);
    doc.setFont('helvetica', 'bold');
    doc.text('Reference', cols[4], y);
    y += 16;
  }

  // Explanation box
  y += 4;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(12, y, pageW - 24, 40, 3, 3, 'F');
  doc.setDrawColor(147, 197, 253);
  doc.roundedRect(12, y, pageW - 24, 40, 3, 3, 'S');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('What do these results mean?', 18, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const explain = [
    'Excellent (< 1e-8): Near-perfect match with analytical solution. Use for precision work.',
    'Good (< 1e-5): Suitable for most engineering applications.',
    'Fair (< 1e-3): Acceptable for preliminary analysis; consider smaller step size.',
    'Poor (>= 1e-3): Significant error. Reduce step size h or use higher-order method.',
  ];
  explain.forEach((line, i) => doc.text(line, 18, y + 20 + i * 7));

  // ── PAGE 3: Chart ─────────────────────────────────
  const chartEl = document.querySelector('.recharts-wrapper');
  if (chartEl) {
    try {
      doc.addPage();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Solution Chart', 15, 13);

      const canvas = await html2canvas(chartEl as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgH = (canvas.height / canvas.width) * (pageW - 20);
      doc.addImage(imgData, 'PNG', 10, 24, pageW - 20, imgH);

      // Caption
      const captionY = 24 + imgH + 8;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Figure: Solution of dy/dx = ${odeExpression} with x0=${initialX}, y0=${initialY}, h=${stepSize}`,
        15, captionY
      );
    } catch (e) {
      console.error('Chart capture failed', e);
    }
  }

  // ── Footer on all pages ────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 41, 59);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(180,180,180);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ODE Solver  •  Built with FastAPI, React & Recharts', 15, pageH - 4);
    doc.text(`Page ${i} / ${totalPages}`, pageW - 15, pageH - 4, { align: 'right' });
  }

  doc.save(`ODE_Report_${odeExpression.replace(/[^a-z0-9]/gi,'_')}.pdf`);
};


  const tabs = [
  { key: 'solution', label: 'Solution' },
  { key: 'error', label: 'Error Analysis' },
  { key: 'convergence', label: 'Convergence' },
  { key: 'stability', label: 'Stability' },
] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Theory Modal */}
      {theoryMethod && (
        <MethodTheoryModal method={theoryMethod} onClose={() => setTheoryMethod(null)} />
      )}
      {showHelp && (
  <HelpModal
    onClose={() => setShowHelp(false)}
    onLoadExample={async (expr) => {
      setOdeExpression(expr);
      setActiveTab('solution');
      setSolutions([]);
      setExactSolution(null);
      setShowHelp(false);
      
      // Auto solve
      setLoading(true);
      setError(null);
      try {
        const response = await api.solveODE(
          expr, initialX, initialY, xEnd, stepSize, selectedMethods
        );
        if (response.success) {
          setSolutions(response.solutions);
          if (response.exact_solution) setExactSolution(response.exact_solution);
        } else {
          setError(response.message || 'Failed to solve ODE');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to solve ODE.');
      } finally {
        setLoading(false);
      }
    }}
  />
)}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🔬 ODE Solver</h1>
            <p className="text-blue-100 mt-1">Full-stack numerical ODE solver for engineering problems</p>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            <span className="text-lg">?</span>
            <span>Help</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
              <EquationInput
                value={odeExpression}
                onChange={setOdeExpression}
                onSubmit={solveODE}
                placeholder="e.g., -2*y + x"
              />
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
              <MethodSelector
                selectedMethods={selectedMethods}
                onChange={setSelectedMethods}
              />
              {/* Theory buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(['euler', 'heun', 'rk4', 'rk45'] as const).map((m: string) => (
                  <button
                    key={m}
                    onClick={(): void => setTheoryMethod(m)}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                  >
                    {m.toUpperCase()} Theory
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md space-y-4">
              <h3 className="font-semibold text-gray-800">Initial Conditions</h3>
              {([
                { label: 'x₀', value: initialX, setter: setInitialX, min: -10, max: 10, step: 0.1 },
                { label: 'y₀', value: initialY, setter: setInitialY, min: -10, max: 10, step: 0.1 },
                { label: 'x_end', value: xEnd, setter: setXEnd, min: 1, max: 50, step: 0.5 },
                { label: 'Step size h', value: stepSize, setter: setStepSize, min: 0.001, max: 0.5, step: 0.001 },
              ] as Parameter[]).map(({ label, value, setter, min, max, step }: Parameter) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} = {value.toFixed(label === 'Step size h' ? 3 : 2)}
                  </label>
                  <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => setter(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <PresetPanel onLoadPreset={handleLoadPreset} loading={loading} />

            {solutions.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-gray-800">Export</h3>
                <button onClick={downloadChart}
                className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition">
                📊 Download Chart (PNG)
                </button>
                <button onClick={downloadData}
                className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition">
                📥 Download CSV
                </button>
                <button onClick={downloadPDF}
                className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition">
                📄 Download PDF Report
                </button>
            </div>
            )}
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-red-700 font-semibold">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {loading && (
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <p className="text-blue-700 font-semibold">Solving ODE...</p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2 border-b border-gray-300 flex-wrap">
               {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              </div>

              <div className="bg-white rounded-lg shadow-md">
                {activeTab === 'solution' && solutions.length > 0 && (
                    <div className="p-6">
                        <SolutionChart
                        solutions={solutions}
                        exactSolution={exactSolution || undefined}
                        />
                    </div>
                    )}
                
                {activeTab === 'error' && (
                  <div className="p-6 space-y-8">
                    {solutions.length > 0 ? (
                      <>
                        <ErrorChart solutions={solutions} errorType="local" title="Local Truncation Error (Euler, Heun, RK4)" />
                        {solutions.some(s => s.method === 'RK45' && s.error_estimates && s.error_estimates.length > 0) && (
                          <ErrorChart solutions={solutions} errorType="adaptive" title="RK45 Adaptive Error Estimates" />
                        )}
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        Solve an ODE to see error analysis
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'convergence' && (
                  <div className="p-6">
                    <ConvergencePanel
                      odeExpression={odeExpression}
                      initialX={initialX}
                      initialY={initialY}
                      xEnd={xEnd}
                    />
                  </div>
                )}

                {activeTab === 'stability' && (
                <div className="p-6">
                    <StabilityDiagram
                    odeExpression={odeExpression}
                    stepSize={stepSize}
                    />
                </div>
                )}
              </div>
            </div>

            {!loading && solutions.length === 0 && activeTab === 'solution' && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-2xl mb-2">📈</p>
                <p className="text-gray-600 text-lg font-medium">No solutions yet</p>
                <p className="text-gray-500 text-sm mt-2">Enter an ODE expression and click "Solve ODE" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-300 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>ODE Solver • Built with FastAPI, React, and Recharts</p>
        </div>
      </footer>
    </div>
  );
}