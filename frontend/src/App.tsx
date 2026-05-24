import React, { useState } from 'react';
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

export default function App() {
  const [odeExpression, setOdeExpression] = useState('-2*y');
  const [initialX, setInitialX] = useState(0);
  const [initialY, setInitialY] = useState(1);
  const [xEnd, setXEnd] = useState(5);
  const [stepSize, setStepSize] = useState(0.1);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['rk4']);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [exactSolution, setExactSolution] = useState<ExactSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solution' | 'error' | 'convergence' | 'stability'>('solution');
  const [theoryMethod, setTheoryMethod] = useState<string | null>(null);

  const api = new ODESolverAPI();

  const solveODE = async () => {
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

  const handleLoadPreset = async (caseStudyId: string, methods: string[]) => {
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

  const downloadChart = async () => {
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

  const downloadData = () => {
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

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('ODE Solver Report', 15, 20);

  // ODE Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('ODE Information', 15, 42);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Expression: dy/dx = ${odeExpression}`, 15, 52);
  doc.text(`Initial: x₀ = ${initialX},  y₀ = ${initialY}`, 15, 60);
  doc.text(`x range: [${initialX}, ${xEnd}]   Step size h = ${stepSize}`, 15, 68);
  doc.text(`Methods: ${solutions.map(s => s.method).join(', ')}`, 15, 76);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 82, 195, 82);

  // Results table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('Results Summary', 15, 92);

  // Table header
  doc.setFillColor(37, 99, 235);
  doc.rect(15, 96, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Method', 18, 102);
  doc.text('Steps', 60, 102);
  doc.text('Final y', 90, 102);
  doc.text('Error vs Exact', 130, 102);
  doc.text('Accuracy', 170, 102);

  // Table rows
  let rowY = 110;
  solutions.forEach((sol, idx) => {
    const lastY = Array.isArray(sol.y_values[0])
      ? (sol.y_values[sol.y_values.length - 1] as number[])[0]
      : sol.y_values[sol.y_values.length - 1] as number;

    const exactLastY = exactSolution
      ? exactSolution.y_values[exactSolution.y_values.length - 1]
      : null;

    const absError = exactLastY !== null && typeof lastY === 'number'
      ? Math.abs(lastY - exactLastY) : null;

    const accuracy = absError !== null
      ? absError < 1e-8 ? 'Excellent'
        : absError < 1e-5 ? 'Good'
        : absError < 1e-3 ? 'Fair'
        : 'Poor'
      : 'N/A';

    if (idx % 2 === 0) {
      doc.setFillColor(245, 247, 255);
      doc.rect(15, rowY - 5, 180, 8, 'F');
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(sol.method, 18, rowY);
    doc.text(String(sol.steps_taken), 60, rowY);
    doc.text(typeof lastY === 'number' ? lastY.toFixed(6) : 'N/A', 90, rowY);
    doc.text(absError !== null ? absError.toExponential(3) : '—', 130, rowY);

    const accColor = accuracy === 'Excellent' ? [16, 185, 129]
      : accuracy === 'Good' ? [37, 99, 235]
      : accuracy === 'Fair' ? [245, 158, 11]
      : [239, 68, 68];
    doc.setTextColor(accColor[0], accColor[1], accColor[2]);
    doc.text(accuracy, 170, rowY);
    doc.setTextColor(0, 0, 0);

    rowY += 10;
  });

  // Exact solution row
  if (exactSolution) {
    const exactLast = exactSolution.y_values[exactSolution.y_values.length - 1];
    doc.setFillColor(220, 252, 231);
    doc.rect(15, rowY - 5, 180, 8, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(9);
    doc.text('Exact', 18, rowY);
    doc.text('—', 60, rowY);
    doc.text(exactLast.toFixed(6), 90, rowY);
    doc.text('0.000e+0', 130, rowY);
    doc.text('Reference', 170, rowY);
    rowY += 10;
  }

  // Chart screenshot
  const chartEl = document.querySelector('.recharts-wrapper');
  if (chartEl) {
    try {
      doc.addPage();

      // Page header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('Solution Chart', 15, 14);

      const canvas = await html2canvas(chartEl as HTMLElement, { scale: 1.5 });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, 25, 190, 120);

      // Chart info below
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 155);
      doc.text(`ODE: dy/dx = ${odeExpression}  |  x₀=${initialX}, y₀=${initialY}, h=${stepSize}`, 15, 163);
    } catch (e) {
      console.error('Chart capture failed', e);
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(8);
    doc.text('ODE Solver • Built with FastAPI, React & Recharts', 15, 293);
    doc.text(`Page ${i} / ${pageCount}`, 185, 293, { align: 'right' });
  }

  doc.save(`ODE_Report_${odeExpression.replace(/[^a-z0-9]/gi, '_')}.pdf`);
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

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🔬 ODE Solver</h1>
          <p className="text-blue-100 mt-1">Full-stack numerical ODE solver for engineering problems</p>
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
                {['euler', 'heun', 'rk4', 'rk45'].map(m => (
                  <button
                    key={m}
                    onClick={() => setTheoryMethod(m)}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                  >
                    {m.toUpperCase()} Theory
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md space-y-4">
              <h3 className="font-semibold text-gray-800">Initial Conditions</h3>
              {[
                { label: 'x₀', value: initialX, setter: setInitialX, min: -10, max: 10, step: 0.1 },
                { label: 'y₀', value: initialY, setter: setInitialY, min: -10, max: 10, step: 0.1 },
                { label: 'x_end', value: xEnd, setter: setXEnd, min: 1, max: 50, step: 0.5 },
                { label: 'Step size h', value: stepSize, setter: setStepSize, min: 0.001, max: 0.5, step: 0.001 },
              ].map(({ label, value, setter, min, max, step }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} = {value.toFixed(label === 'Step size h' ? 3 : 2)}
                  </label>
                  <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={(e) => setter(parseFloat(e.target.value))}
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

            {/* Tabs — Stability সবসময় দেখাবে, বাকিগুলো solution থাকলে */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-gray-300 flex-wrap">
                {tabs.map(tab => (
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
                        exactSolution={exactSolution}
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