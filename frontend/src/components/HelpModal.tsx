import React, { useState } from 'react';

interface HelpModalProps {
  onClose: () => void;
  onLoadExample?: (expr: string) => void;
}

type Tab = 'syntax' | 'methods' | 'parameters' | 'examples';

const HelpModal: React.FC<HelpModalProps> = ({ onClose, onLoadExample }) => {
  const [activeTab, setActiveTab] = useState<Tab>('syntax');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'syntax', label: 'Syntax', icon: '✏️' },
    { key: 'methods', label: 'Methods', icon: '⚙️' },
    { key: 'parameters', label: 'Parameters', icon: '🎛️' },
    { key: 'examples', label: 'Examples', icon: '💡' },
  ];
  const examples = [
  // ── Basic ──
  { expr: '-2*y', label: 'Exponential Decay', desc: 'dy/dx = -2y', category: 'Basic' },
  { expr: '-2*y + x', label: 'Decay with Forcing', desc: 'dy/dx = -2y + x', category: 'Basic' },
  { expr: 'cos(x)', label: 'Pure Integration', desc: 'dy/dx = cos(x)', category: 'Basic' },
  { expr: '3*x**2', label: 'Polynomial', desc: 'dy/dx = 3x²', category: 'Basic' },
  { expr: 'x - y', label: 'Linear First Order', desc: 'dy/dx = x - y', category: 'Basic' },

  // ── Engineering ──
  { expr: '-y / 1.0', label: 'RC Circuit Discharge', desc: 'dV/dt = -V/RC', category: 'Engineering' },
  { expr: '-0.1*(y - 20)', label: "Newton's Cooling", desc: 'dT/dt = -k(T-T∞)', category: 'Engineering' },
  { expr: '-0.3*y', label: 'Chemical Decay', desc: 'dC/dt = -λC', category: 'Engineering' },
  { expr: '-0.05*y + 2.0', label: 'Heat Conduction', desc: 'dT/dt = -hT + Q', category: 'Engineering' },
  { expr: '-0.2*y + 5.0', label: 'Drug Concentration', desc: 'dC/dt = -ke·C + dose', category: 'Engineering' },
  { expr: '-0.001*y', label: 'Satellite Decay', desc: 'dh/dt = -k·h (orbital drag)', category: 'Engineering' },

  // ── Biology ──
  { expr: '0.5*y*(1 - y/100)', label: 'Logistic Growth', desc: 'dP/dt = rP(1-P/K)', category: 'Biology' },
  { expr: '0.3*y*(1 - y/1000) - 0.1*y', label: 'Virus Spread (SIS)', desc: 'dI/dt = βI(N-I)/N - γI', category: 'Biology' },
  { expr: '0.4*y - 0.001*y**2', label: 'Predator Growth', desc: 'dy/dt = ry - ay²', category: 'Biology' },

  // ── Nonlinear ──
  { expr: 'y**2 - y', label: 'Nonlinear ODE', desc: 'dy/dx = y² - y', category: 'Nonlinear' },
  { expr: 'y*(1-y)', label: 'Bernoulli ODE', desc: 'dy/dx = y(1-y)', category: 'Nonlinear' },
  { expr: 'y**2 - x**2', label: 'Riccati Equation', desc: 'dy/dx = y² - x²', category: 'Nonlinear' },
  { expr: '-y + y**3', label: 'Cubic Nonlinear', desc: 'dy/dx = -y + y³', category: 'Nonlinear' },

  // ── Trig ──
  { expr: 'sin(x)*y', label: 'Trig Coefficient', desc: 'dy/dx = sin(x)·y', category: 'Trig' },
  { expr: 'sin(x) + cos(y)', label: 'Mixed Trig', desc: 'dy/dx = sin(x) + cos(y)', category: 'Trig' },
  { expr: '-sin(y)', label: 'Pendulum (approx)', desc: 'dy/dx = -sin(y)', category: 'Trig' },

  // ── Complex ──
  { expr: 'exp(-x) - y', label: 'Exponential Input', desc: 'dy/dx = e⁻ˣ - y', category: 'Complex' },
  { expr: 'exp(-x)*sin(x) - y', label: 'Damped Wave Input', desc: 'dy/dx = e⁻ˣsin(x) - y', category: 'Complex' },
  { expr: '(x - y) / (x + y)', label: 'Homogeneous ODE', desc: 'dy/dx = (x-y)/(x+y)', category: 'Complex' },
  { expr: 'sin(x*y)', label: 'Nonlinear Coupled', desc: 'dy/dx = sin(x·y)', category: 'Complex' },
  { expr: 'x*exp(-y)', label: 'Exponential Nonlinear', desc: 'dy/dx = x·e⁻ʸ', category: 'Complex' },
  { expr: 'log(abs(y) + 1)*x', label: 'Logarithmic Growth', desc: 'dy/dx = x·ln(|y|+1)', category: 'Complex' },
];

  const categoryColors: Record<string, string> = {
  Basic: 'bg-blue-50 text-blue-700 border-blue-200',
  Nonlinear: 'bg-purple-50 text-purple-700 border-purple-200',
  Trig: 'bg-green-50 text-green-700 border-green-200',
  Biology: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Thermal: 'bg-orange-50 text-orange-700 border-orange-200',
  Engineering: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Chemistry: 'bg-pink-50 text-pink-700 border-pink-200',
  Complex: 'bg-red-50 text-red-700 border-red-200',
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-white font-bold text-lg">Documentation & Tutorial</h2>
              <p className="text-blue-200 text-xs">Learn how to use ODE Solver effectively</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-white hover:text-blue-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:bg-opacity-20 transition"
          >×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── SYNTAX ── */}
          {activeTab === 'syntax' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">How to write ODE expressions</h3>
                <p className="text-sm text-gray-500">
                  Enter the right-hand side of dy/dx = f(x, y). Use{' '}
                  <code className="bg-gray-100 px-1 rounded">x</code> for independent variable and{' '}
                  <code className="bg-gray-100 px-1 rounded">y</code> for dependent variable.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Basic decay', code: '-2*y', math: 'dy/dx = -2y' },
                  { label: 'With forcing', code: '-2*y + x', math: 'dy/dx = -2y + x' },
                  { label: 'Nonlinear', code: 'y**2 - y', math: 'dy/dx = y² - y' },
                  { label: 'Trigonometric', code: 'sin(x)*y', math: 'dy/dx = sin(x)·y' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <code className="text-blue-600 font-bold text-sm">{item.code}</code>
                    <p className="text-xs text-gray-400 mt-1">{item.math}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Supported operators & functions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { group: 'Arithmetic', items: ['+ (add)', '- (subtract)', '* (multiply)', '/ (divide)', '** (power)'] },
                    { group: 'Functions', items: ['sin(x)', 'cos(x)', 'tan(x)', 'exp(x)', 'log(x)', 'sqrt(x)', 'abs(x)'] },
                  ].map(g => (
                    <div key={g.group} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-700 mb-2">{g.group}</p>
                      {g.items.map(item => (
                        <code key={item} className="block text-xs text-blue-600 py-0.5">{item}</code>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-yellow-800">⚠ Common mistakes</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { wrong: '2y', right: '2*y', note: 'Always use *' },
                    { wrong: 'y^2', right: 'y**2', note: 'Use ** for power' },
                    { wrong: 'e^x', right: 'exp(x)', note: 'Use exp()' },
                    { wrong: 'ln(x)', right: 'log(x)', note: 'log = natural log' },
                  ].map(m => (
                    <div key={m.wrong} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-yellow-100">
                      <code className="text-red-500 line-through">{m.wrong}</code>
                      <span className="text-gray-400">→</span>
                      <code className="text-green-600 font-bold">{m.right}</code>
                      <span className="text-gray-400 text-xs ml-auto">{m.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── METHODS ── */}
          {activeTab === 'methods' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Choose the right method for your problem.</p>
              {[
                {
                  name: 'Euler', order: 1, color: 'red',
                  formula: 'yₙ₊₁ = yₙ + h·f(xₙ, yₙ)',
                  when: 'Quick estimates, educational purposes',
                  pros: ['Simple', 'Fast', 'Easy to understand'],
                  cons: ['Low accuracy', 'Needs small h', 'Unstable for stiff ODEs'],
                },
                {
                  name: 'Heun', order: 2, color: 'yellow',
                  formula: 'k₁=f(xₙ,yₙ),  k₂=f(xₙ+h, yₙ+h·k₁)\nyₙ₊₁ = yₙ + h/2·(k₁+k₂)',
                  when: 'Moderate accuracy, smooth ODEs',
                  pros: ['Order 2', 'Predictor-corrector', 'Better than Euler'],
                  cons: ['2 evals/step', 'Limited stability'],
                },
                {
                  name: 'RK4', order: 4, color: 'blue',
                  formula: 'k₁,k₂,k₃,k₄ slopes\nyₙ₊₁ = yₙ + h/6·(k₁+2k₂+2k₃+k₄)',
                  when: 'Most engineering problems',
                  pros: ['High accuracy', 'Good stability', 'Industry standard'],
                  cons: ['4 evals/step', 'Fixed step'],
                },
                {
                  name: 'RK45', order: 4, color: 'purple',
                  formula: 'Adaptive: compares RK4 & RK5\nAdjusts h based on error tolerance',
                  when: 'Stiff ODEs, accuracy critical',
                  pros: ['Adaptive step', 'Error controlled', 'Most robust'],
                  cons: ['Variable step count', 'More overhead'],
                },
              ].map(m => {
                const colors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
                  red:    { border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
                  yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
                  blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
                  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
                };
                const c = colors[m.color];
                return (
                  <div key={m.name} className={`border ${c.border} rounded-xl overflow-hidden`}>
                    <div className={`${c.bg} px-4 py-3 flex items-center gap-3`}>
                      <div className={`w-3 h-3 rounded-full ${c.dot}`}/>
                      <span className={`font-bold ${c.text}`}>{m.name}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border">Order {m.order}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <pre className={`text-xs font-mono ${c.text} whitespace-pre-wrap`}>{m.formula}</pre>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-semibold text-green-700 mb-1">✓ Pros</p>
                          {m.pros.map(p => <p key={p} className="text-gray-600">• {p}</p>)}
                        </div>
                        <div>
                          <p className="font-semibold text-red-700 mb-1">✗ Cons</p>
                          {m.cons.map(c => <p key={c} className="text-gray-600">• {c}</p>)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Best for: </span>{m.when}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PARAMETERS ── */}
          {activeTab === 'parameters' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Understanding each parameter and its effect on the solution.</p>

              {[
                {
                  param: 'x₀', name: 'Initial x', color: 'blue',
                  desc: 'Starting point of the independent variable (usually time t or position x).',
                  tip: 'For time-based problems, set x₀ = 0 to start from t = 0.',
                  example: 'x₀ = 0 → simulation starts at t = 0',
                  range: '-10 to 10',
                },
                {
                  param: 'y₀', name: 'Initial y value', color: 'green',
                  desc: 'Initial value of the dependent variable y at x = x₀. This is your initial condition.',
                  tip: 'This defines the starting state of your system.',
                  example: 'y₀ = 10 → V(0) = 10V for RC circuit',
                  range: '-10 to 10',
                },
                {
                  param: 'x_end', name: 'End point', color: 'orange',
                  desc: 'Final value of x where the solution stops. Defines simulation duration.',
                  tip: 'For oscillatory systems, use at least 2-3 full periods.',
                  example: 'x_end = 5 → simulate from t=0 to t=5',
                  range: '1 to 50',
                },
                {
                  param: 'h', name: 'Step size', color: 'purple',
                  desc: 'Distance between consecutive solution points. Smaller h = more accurate but slower.',
                  tip: 'Start with h=0.1. If solution looks wrong, reduce to h=0.01.',
                  example: 'h=0.1 → 50 steps for x∈[0,5]',
                  range: '0.001 to 0.5',
                },
              ].map(p => {
                const colors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
                  blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800' },
                  green:  { border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800' },
                  orange: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
                  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
                };
                const c = colors[p.color];
                return (
                  <div key={p.param} className={`border ${c.border} rounded-xl overflow-hidden`}>
                    <div className={`${c.bg} px-4 py-3 flex items-center gap-3`}>
                      <span className={`text-xl font-bold ${c.text} font-mono`}>{p.param}</span>
                      <span className="font-medium text-gray-700 text-sm">{p.name}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${c.badge}`}>Range: {p.range}</span>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <p className="text-gray-700">{p.desc}</p>
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
                        <span className="font-semibold">Example: </span>{p.example}
                      </div>
                      <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
                        <span>💡</span>
                        <p className="text-xs text-blue-700">{p.tip}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Step size table */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Step size vs Accuracy trade-off</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      {['Step size h', 'Steps (x∈[0,5])', 'Accuracy', 'Speed'].map(h => (
                        <th key={h} className="px-3 py-1.5 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { h: '0.5', steps: '10', acc: 'Low', speed: 'Very fast', ac: 'text-red-600', sp: 'text-green-600' },
                      { h: '0.1', steps: '50', acc: 'Good', speed: 'Fast', ac: 'text-blue-600', sp: 'text-blue-600' },
                      { h: '0.01', steps: '500', acc: 'High', speed: 'Moderate', ac: 'text-green-600', sp: 'text-yellow-600' },
                      { h: '0.001', steps: '5000', acc: 'Very high', speed: 'Slow', ac: 'text-green-700', sp: 'text-red-600' },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 font-mono font-bold">{row.h}</td>
                        <td className="px-3 py-1.5">{row.steps}</td>
                        <td className={`px-3 py-1.5 font-medium ${row.ac}`}>{row.acc}</td>
                        <td className={`px-3 py-1.5 font-medium ${row.sp}`}>{row.speed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EXAMPLES ── */}
          {activeTab === 'examples' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Click any example to load it instantly into the solver.
              </p>
              <div className="space-y-2">
                {examples.map(ex => (
                  <div key={ex.expr}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[ex.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {ex.category}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ex.label}</p>
                        <p className="text-xs text-gray-500">{ex.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-mono border border-blue-100">
                        {ex.expr}
                      </code>
                      <button
                        onClick={() => {
                            if (onLoadExample) onLoadExample(ex.expr);
                            onClose();
                        }}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                        >
                        Load →
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <p className="text-xs text-gray-400">ODE Solver Documentation v1.0</p>
          <button onClick={onClose}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;