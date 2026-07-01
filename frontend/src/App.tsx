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
  const now = new Date().toLocaleString();

  // ── PAGE 1 ─────────────────────────────────────────
  // Cover gradient bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 35, pageW, 10, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ODE Solver Report', 15, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Numerical ODE Solver for Engineering Problems', 15, 32);

  // Generated date — right aligned
  doc.setFontSize(8);
  doc.setTextColor(196, 213, 255);
  doc.text(`Generated: ${now}`, pageW - 15, 32, { align: 'right' });

  // ── ODE Info Box ──
  doc.setFillColor(241, 245, 255);
  doc.roundedRect(12, 52, pageW - 24, 62, 4, 4, 'F');
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 52, pageW - 24, 62, 4, 4, 'S');

  // Section title
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(12, 52, pageW - 24, 10, 4, 4, 'F');
  doc.rect(12, 57, pageW - 24, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ODE Information', 18, 59);

  // Info grid
  const infoItems = [
    { label: 'Expression', value: `dy/dx = ${odeExpression}` },
    { label: 'Initial x₀', value: String(initialX) },
    { label: 'Initial y₀', value: String(initialY) },
    { label: 'x range', value: `[${initialX},  ${xEnd}]` },
    { label: 'Step size h', value: String(stepSize) },
    { label: 'Methods', value: solutions.map(s => s.method).join(', ') },
  ];

  doc.setFontSize(9);
  infoItems.forEach((item, i) => {
    const col = i % 2 === 0 ? 18 : pageW / 2 + 5;
    const row = 70 + Math.floor(i / 2) * 12;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.label}:`, col, row);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, col + 28, row);
  });

  // ── Methods Used ──
  let y = 124;
  doc.setFillColor(241, 245, 255);
  doc.roundedRect(12, y, pageW - 24, 8 + solutions.length * 12, 4, 4, 'F');
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(12, y, pageW - 24, 10, 4, 4, 'F');
  doc.rect(12, y + 5, pageW - 24, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Methods Used', 18, y + 7);
  y += 14;

 const methodDotColors: Record<string, [number, number, number]> = {
    Euler:  [239, 68, 68],
    Heun:   [245, 158, 11],
    RK4:    [59, 130, 246],
    RK45:   [139, 92, 246],
    Taylor: [16, 185, 129],
  };
  const methodDesc: Record<string, string> = {
    Euler:  'Order 1 — Simple first-order method',
    Heun:   'Order 2 — Predictor-corrector',
    RK4:    'Order 4 — Classical industry standard',
    RK45:   'Order 4 — Adaptive step control',
    Taylor: 'Order 4 — Symbolic Taylor expansion',
  };
  solutions.forEach(sol => {
    const c = methodDotColors[sol.method] || [100, 100, 100];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.circle(20, y - 1.5, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(sol.method, 26, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`— ${methodDesc[sol.method] || ''}`, 50, y);
    y += 12;
  });

  // ── PAGE 2: Results ───────────────────────────────
  doc.addPage();

  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Results Summary', 15, 13);

  // ODE expression reminder
  doc.setFillColor(239, 246, 255);
  doc.rect(0, 18, pageW, 10, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`dy/dx = ${odeExpression}   |   x₀=${initialX}, y₀=${initialY}, h=${stepSize}`, 15, 25);

  // Table
  y = 38;
  const cols = [15, 48, 82, 120, 158, 182];
  const headers = ['Method', 'Steps', 'Final y', 'Error vs Exact', 'Accuracy', ''];

  // Table header
  doc.setFillColor(30, 58, 138);
  doc.rect(12, y - 6, pageW - 24, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 6;

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

    const accColor: [number, number, number] =
      accuracy === 'Excellent' ? [16, 185, 129]
      : accuracy === 'Good'    ? [37, 99, 235]
      : accuracy === 'Fair'    ? [245, 158, 11]
      : accuracy === 'Poor'    ? [239, 68, 68]
      : [100, 100, 100];

    // Row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 255);
      doc.rect(12, y - 4, pageW - 24, 10, 'F');
    }

    // Method dot
    const c = methodDotColors[sol.method] || [100, 100, 100];
    doc.setFillColor(c[0], c[1], c[2]);
    doc.circle(cols[0] + 2, y + 1, 2.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text(sol.method, cols[0] + 7, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(sol.steps_taken), cols[1], y + 2);
    doc.text(typeof lastY === 'number' ? lastY.toFixed(6) : 'N/A', cols[2], y + 2);
    doc.text(absError !== null ? absError.toExponential(3) : '—', cols[3], y + 2);

    // Accuracy badge
    doc.setFillColor(...accColor);
    doc.roundedRect(cols[4] - 1, y - 2, 22, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(accuracy, cols[4] + 1, y + 3);

    y += 12;
  });

  // Exact row
  if (exactSolution) {
    const exactLast = exactSolution.y_values[exactSolution.y_values.length - 1];
    doc.setFillColor(220, 252, 231);
    doc.rect(12, y - 4, pageW - 24, 10, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.rect(12, y - 4, pageW - 24, 10, 'S');

    doc.setFillColor(16, 185, 129);
    doc.circle(cols[0] + 2, y + 1, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Exact', cols[0] + 7, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text('—', cols[1], y + 2);
    doc.text(exactLast.toFixed(6), cols[2], y + 2);
    doc.text('0.000e+0', cols[3], y + 2);
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(cols[4] - 1, y - 2, 24, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Reference', cols[4] + 1, y + 3);
    y += 16;
  }

  // ── Explanation Box ──
  y += 4;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(12, y, pageW - 24, 48, 4, 4, 'F');
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, pageW - 24, 48, 4, 4, 'S');

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(12, y, pageW - 24, 10, 4, 4, 'F');
  doc.rect(12, y + 5, pageW - 24, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Accuracy Guide', 18, y + 7);
  y += 14;

  const accGuide = [
    { label: 'Excellent', range: '< 1e-8', color: [16, 185, 129] as [number,number,number], note: 'Near-perfect. Use for high-precision engineering.' },
    { label: 'Good',      range: '< 1e-5', color: [37, 99, 235] as [number,number,number],  note: 'Suitable for most engineering applications.' },
    { label: 'Fair',      range: '< 1e-3', color: [245, 158, 11] as [number,number,number], note: 'Acceptable for preliminary analysis. Reduce h.' },
    { label: 'Poor',      range: '≥ 1e-3', color: [239, 68, 68] as [number,number,number],  note: 'Large error. Use smaller h or higher-order method.' },
  ];

  accGuide.forEach(g => {
    doc.setFillColor(...g.color);
    doc.roundedRect(18, y - 3, 18, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(g.label, 19, y + 1);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`(${g.range})`, 38, y + 1);
    doc.setTextColor(15, 23, 42);
    doc.text(g.note, 62, y + 1);
    y += 9;
  });

  // ── PAGE 3: Chart ─────────────────────────────────
  const chartEl = document.querySelector('.recharts-wrapper');
  if (chartEl) {
    try {
      doc.addPage();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Solution Chart', 15, 13);

      doc.setFillColor(239, 246, 255);
      doc.rect(0, 18, pageW, 10, 'F');
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`dy/dx = ${odeExpression}   |   x₀=${initialX}, y₀=${initialY}, h=${stepSize}`, 15, 25);

      const canvas = await html2canvas(chartEl as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgH = (canvas.height / canvas.width) * (pageW - 20);
      doc.addImage(imgData, 'PNG', 10, 32, pageW - 20, Math.min(imgH, 150));

      // Method legend below chart
      let legendY = 32 + Math.min(imgH, 150) + 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Legend:', 15, legendY);
      legendY += 7;

      solutions.forEach(sol => {
        const c = methodDotColors[sol.method] || [100, 100, 100];
        doc.setFillColor(c[0], c[1], c[2]);
        doc.rect(15, legendY - 3, 8, 3, 'F');
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`${sol.method} (${sol.steps_taken} steps)`, 26, legendY);
        legendY += 7;
      });

      if (exactSolution) {
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1);
        doc.setLineDashPattern([3, 2], 0);
        doc.line(15, legendY - 2, 23, legendY - 2);
        doc.setLineDashPattern([], 0);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Exact Solution (Analytical)', 26, legendY);
      }
    } catch (e) {
      console.error('Chart capture failed', e);
    }
  }

  // ── Footer on all pages ────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, pageH - 12, 3, 12, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ODE Solver  •  Built with FastAPI, React & Recharts', 8, pageH - 4);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} / ${totalPages}`, pageW - 8, pageH - 4, { align: 'right' });
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
      {showHelp && (
      <HelpModal
        onClose={() => setShowHelp(false)}
        onLoadExample={async (expr) => {
          setOdeExpression(expr);
          setActiveTab('solution');
          setSolutions([]);
          setExactSolution(null);
          setShowHelp(false);

          setLoading(true);
          setError(null);
          try {
            const response = await api.solveODE(
              expr, initialX, initialY, xEnd, stepSize,
              ['euler', 'heun', 'rk4', 'rk45', 'taylor']
            );
            if (response.success) {
              setSolutions(response.solutions);
              setSelectedMethods(['euler', 'heun', 'rk4', 'rk45', 'taylor']);
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
                {(['euler', 'heun', 'rk4', 'rk45', 'taylor'] as const).map((m: string) => (
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